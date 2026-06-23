import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import {
  fetchAllRatePlans, createRatePlan, upsertRatePlan, fetchRatePlanById,
  updateRatePlan, deleteRatePlan,
  getErrorDisplay, normalizeDecimal, ApiError,
  type IRatePlan, type CreateRatePlanPayload, type UpdateRatePlanPayload,
  type VehicleClass, type IRatePlanSeasonalOverride, type IRatePlanTax, type IRatePlanFee,
} from "../../../Services/adminAndManager/rate_plan_service";
import { fetchVehicleUnits, type IVehicleUnit } from "../../../Services/adminAndManager/vehicle_units_services";
import { fetchVehicleModels, type IVehicleModel } from "../../../Services/adminAndManager/vehicle_model_service";
import { fetchBranches, type IBranch } from "../../../Services/adminAndManager/admin_branch_service";
import {
  Search, Trash2, Eye, Edit, Plus, X, AlertCircle, CheckCircle,
  MoreVertical, Building2, Tag, DollarSign, Calendar, RefreshCw,
  Car, Save, Layers, Package, TrendingUp, Percent, Hash,
  ChevronDown, ChevronUp, Clock, Globe, CreditCard,
} from "lucide-react";

type RatePlanType = "vehicle_class" | "vehicle_model" | "vehicle_unit";

const vehicleClasses: VehicleClass[] = [
  "economy", "compact", "midsize", "suv", "luxury", "van", "truck",
];

const TYPE_META: Record<RatePlanType, { label: string; icon: typeof Car; gradient: string; badge: string }> = {
  vehicle_class: { label: "By Class", icon: Layers, gradient: "from-blue-600 to-indigo-700", badge: "bg-blue-100 text-blue-800" },
  vehicle_model: { label: "By Model", icon: Car, gradient: "from-emerald-500 to-teal-700", badge: "bg-emerald-100 text-emerald-800" },
  vehicle_unit: { label: "By Unit", icon: Package, gradient: "from-violet-500 to-purple-700", badge: "bg-violet-100 text-violet-800" },
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const initialForm: CreateRatePlanPayload = {
  name: "", branch_id: "", vehicle_class: "", vehicle_model_id: null, vehicle_id: null,
  currency: "USD", daily_rate: "0.00", weekly_rate: "", monthly_rate: "", weekend_rate: "",
  seasonal_overrides: [], taxes: [], fees: [], active: true, valid_from: todayISO(), valid_to: null, notes: "",
};

const RatePlanScreen: React.FC = () => {
  const [ratePlans, setRatePlans] = useState<IRatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [vehicleClassFilter, setVehicleClassFilter] = useState("all");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<IRatePlan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [conflictPlanId, setConflictPlanId] = useState<string | null>(null);
  const [conflictMsg, setConflictMsg] = useState("");
  const [isViewOpen, setIsViewOpen] = useState(false);

  const [branches, setBranches] = useState<IBranch[]>([]);
  const [vehicleModels, setVehicleModels] = useState<IVehicleModel[]>([]);
  const [vehicleUnits, setVehicleUnits] = useState<IVehicleUnit[]>([]);
  const [formData, setFormData] = useState<CreateRatePlanPayload>(initialForm);
  const [planType, setPlanType] = useState<RatePlanType>("vehicle_model");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [snackbar, setSnackbar] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false, message: "", type: "info",
  });

  const loadAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [pr, br, mr, ur] = await Promise.all([
        fetchAllRatePlans(), fetchBranches(), fetchVehicleModels(), fetchVehicleUnits(),
      ]);
      setRatePlans(pr.data);
      setBranches(br.data);
      setVehicleModels(mr.data.items || []);
      setVehicleUnits(ur.data.items || []);
    } catch (err) {
      const d = getErrorDisplay(err);
      setError(d.message || "Failed to load data");
      showSnackbar(d.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const preFilledRef = useRef(false);
  useEffect(() => {
    if (loading || preFilledRef.current) return;
    const preVehicleId = searchParams.get("vehicleId");
    if (!preVehicleId) return;
    preFilledRef.current = true;
    const preVehicleName = searchParams.get("vehicleName");
    setFormData(p => ({
      ...p,
      vehicle_id: preVehicleId,
      name: preVehicleName ? `Rate Plan – ${preVehicleName}` : p.name,
    }));
    setPlanType("vehicle_unit");
    setIsEditMode(false);
    setIsFormOpen(true);
  }, [loading, searchParams]);

  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar(p => ({ ...p, show: false })), 3500);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setConflictPlanId(null);
    setConflictMsg("");
  };

  const openAdd = () => {
    setFormData(initialForm);
    setPlanType("vehicle_model");
    setIsEditMode(false);
    setConflictPlanId(null);
    setConflictMsg("");
    setIsFormOpen(true);
  };

  const openEdit = (plan: IRatePlan) => {
    setSelectedPlan(plan);
    let type: RatePlanType = "vehicle_class";
    if (plan.vehicle_id) type = "vehicle_unit";
    else if (plan.vehicle_model_id) type = "vehicle_model";
    setPlanType(type);
    const vehicleIdValue = plan.vehicle_id
      ? (typeof plan.vehicle_id === "string" ? plan.vehicle_id : plan.vehicle_id?._id || null)
      : null;
    setFormData({
      name: plan.name,
      branch_id: typeof plan.branch_id === "string" ? plan.branch_id : plan.branch_id?._id || "",
      vehicle_class: plan.vehicle_class,
      vehicle_model_id: plan.vehicle_model_id || null,
      vehicle_id: vehicleIdValue,
      currency: plan.currency,
      daily_rate: normalizeDecimal(plan.daily_rate) || "0.00",
      weekly_rate: normalizeDecimal(plan.weekly_rate) || "",
      monthly_rate: normalizeDecimal(plan.monthly_rate) || "",
      weekend_rate: normalizeDecimal(plan.weekend_rate) || "",
      seasonal_overrides: plan.seasonal_overrides?.map(o => ({
        season: o.season,
        daily_rate: normalizeDecimal(o.daily_rate) || "",
        weekly_rate: normalizeDecimal(o.weekly_rate) || "",
        monthly_rate: normalizeDecimal(o.monthly_rate) || "",
        weekend_rate: normalizeDecimal(o.weekend_rate) || "",
      })) || [],
      taxes: plan.taxes || [],
      fees: plan.fees?.map(f => ({ code: f.code, amount: normalizeDecimal(f.amount) || "" })) || [],
      active: plan.active ?? true,
      valid_from: plan.valid_from || "",
      valid_to: plan.valid_to || null,
      notes: plan.notes || "",
    });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const buildPayload = () => ({
    ...formData,
    branch_id: formData.branch_id || null,
    valid_from: formData.valid_from || new Date().toISOString(),
    vehicle_model_id: planType === "vehicle_model" ? (formData.vehicle_model_id || null) : null,
    vehicle_id: planType === "vehicle_unit" ? (formData.vehicle_id || null) : null,
    weekly_rate: formData.weekly_rate || null,
    monthly_rate: formData.monthly_rate || null,
    weekend_rate: formData.weekend_rate || null,
    fees: (formData.fees || []).map(f => ({ ...f, amount: f.amount || null })),
    seasonal_overrides: (formData.seasonal_overrides || []).map(o => ({
      ...o,
      daily_rate: o.daily_rate || null,
      weekly_rate: o.weekly_rate || null,
      monthly_rate: o.monthly_rate || null,
      weekend_rate: o.weekend_rate || null,
    })),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEditMode && selectedPlan) {
        await updateRatePlan(selectedPlan._id, payload as UpdateRatePlanPayload);
        showSnackbar("Rate plan updated!", "success");
        closeForm();
        loadAll();
      } else {
        await createRatePlan(payload as CreateRatePlanPayload);
        showSnackbar("Rate plan created!", "success");
        closeForm();
        loadAll();
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.data?.existingId) {
        setConflictPlanId(err.data.existingId as string);
        setConflictMsg(err.message);
      } else {
        showSnackbar(getErrorDisplay(err).message, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditExisting = async () => {
    if (!conflictPlanId) return;
    setSaving(true);
    try {
      const existing = await fetchRatePlanById(conflictPlanId);
      setConflictPlanId(null);
      setConflictMsg("");
      openEdit(existing);
    } catch {
      showSnackbar("Failed to load existing plan", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReplace = async () => {
    setSaving(true);
    try {
      const payload = buildPayload();
      await upsertRatePlan(payload as CreateRatePlanPayload);
      showSnackbar("Rate plan replaced successfully!", "success");
      closeForm();
      loadAll();
    } catch (err) {
      showSnackbar(getErrorDisplay(err).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRatePlan(id);
      showSnackbar("Rate plan deleted", "success");
      setDeleteTarget(null);
      loadAll();
    } catch (err) {
      showSnackbar(getErrorDisplay(err).message, "error");
    }
  };

  // ── Seasonal override helpers ──
  const addOverride = () => setFormData(p => ({
    ...p, seasonal_overrides: [...(p.seasonal_overrides || []),
      { season: { name: "", start: "", end: "" }, daily_rate: "", weekly_rate: "", monthly_rate: "", weekend_rate: "" }],
  }));
  const removeOverride = (i: number) => setFormData(p => {
    const a = [...(p.seasonal_overrides || [])]; a.splice(i, 1); return { ...p, seasonal_overrides: a };
  });
  const setOverrideField = (i: number, field: string, val: string) => setFormData(p => {
    const a = [...(p.seasonal_overrides || [])];
    if (!a[i]) a[i] = { season: { name: "", start: "", end: "" } };
    if (field.startsWith("season.")) {
      const sf = field.replace("season.", "");
      a[i] = { ...a[i], season: { ...a[i].season!, [sf]: val } };
    } else {
      a[i] = { ...a[i], [field]: val };
    }
    return { ...p, seasonal_overrides: a };
  });

  // ── Tax helpers ──
  const addTax = () => setFormData(p => ({ ...p, taxes: [...(p.taxes || []), { code: "", rate: 0 }] }));
  const removeTax = (i: number) => setFormData(p => { const a = [...(p.taxes || [])]; a.splice(i, 1); return { ...p, taxes: a }; });
  const setTaxField = (i: number, field: "code" | "rate", val: string) => setFormData(p => {
    const a = [...(p.taxes || [])];
    a[i] = { ...a[i], [field]: field === "rate" ? parseFloat(val) || 0 : val };
    return { ...p, taxes: a };
  });

  // ── Fee helpers ──
  const addFee = () => setFormData(p => ({ ...p, fees: [...(p.fees || []), { code: "", amount: "" }] }));
  const removeFee = (i: number) => setFormData(p => { const a = [...(p.fees || [])]; a.splice(i, 1); return { ...p, fees: a }; });
  const setFeeField = (i: number, field: "code" | "amount", val: string) => setFormData(p => {
    const a = [...(p.fees || [])]; a[i] = { ...a[i], [field]: val }; return { ...p, fees: a };
  });

  // ── Helpers ──
  const fmtDate = (d?: string | null) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const fmtCurrency = (amount: any, currency = "USD") => {
    const n = typeof amount === "number" ? amount
      : typeof amount === "string" ? parseFloat(amount)
      : amount?.$numberDecimal ? parseFloat(amount.$numberDecimal) : 0;
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(n);
  };
  const getBranchName = (b: any) => {
    if (!b) return "N/A";
    if (typeof b === "string") return branches.find(x => x._id === b)?.name || b;
    return b.name || b._id;
  };
  const getModelName = (id?: string | null | any) => {
    if (!id) return "N/A";
    if (typeof id === "object") return `${id.make || ""} ${id.model || ""} ${id.year || ""}`.trim() || "N/A";
    const m = vehicleModels.find(m => m._id === id);
    return m ? `${m.make} ${m.model} ${m.year}` : id;
  };
  const getUnitName = (u: any) => {
    if (!u) return "N/A";
    if (typeof u === "object") return `${u.vin || ""} (${u.plate_number || ""})`;
    const unit = vehicleUnits.find(x => x._id === u);
    return unit ? `${unit.vin} (${unit.plate_number})` : u;
  };
  const getPlanType = (plan: IRatePlan): RatePlanType =>
    plan.vehicle_id ? "vehicle_unit" : plan.vehicle_model_id ? "vehicle_model" : "vehicle_class";

  const filtered = ratePlans.filter(p => {
    const ms = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.currency.toLowerCase().includes(searchTerm.toLowerCase());
    const mst = statusFilter === "all" || (statusFilter === "active" && p.active) || (statusFilter === "inactive" && !p.active);
    const mb = branchFilter === "all" || (typeof p.branch_id === "string" ? p.branch_id === branchFilter : p.branch_id?._id === branchFilter);
    const mc = vehicleClassFilter === "all" || p.vehicle_class === vehicleClassFilter;
    return ms && mst && mb && mc;
  });

  const uniqueBranches = branches.filter(b => ratePlans.some(p =>
    typeof p.branch_id === "string" ? p.branch_id === b._id : p.branch_id?._id === b._id
  ));

  const stats = {
    total: ratePlans.length,
    active: ratePlans.filter(p => p.active).length,
    withOverrides: ratePlans.filter(p => (p.seasonal_overrides?.length ?? 0) > 0).length,
    currencies: [...new Set(ratePlans.map(p => p.currency))].length,
  };

  // ── Rate input component ──
  const RateInput = ({ label, value, onChange, currency }: { label: string; value: string; onChange: (v: string) => void; currency: string }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          {currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$"}
        </span>
        <input
          type="number" min="0" step="0.01" value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] text-sm"
          placeholder="0.00"
        />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-[#1EA2E4]" /> Rate Plans
                </h1>
                <p className="text-sm text-gray-500">Manage pricing structures for vehicles</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={loadAll} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1EA2E4] to-[#0d7fc4] text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition-all"
              >
                <Plus className="w-5 h-5" /> New Rate Plan
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Stats */}
          <div className="px-6 pt-5 pb-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Total Plans", val: stats.total, icon: Tag, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Active", val: stats.active, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Seasonal Plans", val: stats.withOverrides, icon: Calendar, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Currencies", val: stats.currencies, icon: Globe, color: "text-violet-600", bg: "bg-violet-50" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" placeholder="Search by name, currency, notes..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] text-sm"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { val: "all", label: "All" }, { val: "active", label: "Active" }, { val: "inactive", label: "Inactive" },
                ].map(f => (
                  <button key={f.val} onClick={() => setStatusFilter(f.val)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === f.val ? "bg-[#1EA2E4] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {f.label}
                  </button>
                ))}
                <div className="h-6 w-px bg-gray-200 self-center" />
                <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]">
                  <option value="all">All Branches</option>
                  {uniqueBranches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
                <select value={vehicleClassFilter} onChange={e => setVehicleClassFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]">
                  <option value="all">All Classes</option>
                  {vehicleClasses.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="px-6 pb-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4" />
                <p className="text-gray-500">Loading rate plans...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64">
                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                <p className="text-red-600 mb-4">{error}</p>
                <button onClick={loadAll} className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg flex items-center gap-2 text-sm">
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-600 font-semibold mb-1">No rate plans found</p>
                <p className="text-gray-400 text-sm mb-5">
                  {searchTerm || statusFilter !== "all" || branchFilter !== "all" || vehicleClassFilter !== "all"
                    ? "Try adjusting your filters" : "Create your first rate plan"}
                </p>
                {!searchTerm && statusFilter === "all" && branchFilter === "all" && vehicleClassFilter === "all" && (
                  <button onClick={openAdd} className="px-5 py-2.5 bg-gradient-to-r from-[#1EA2E4] to-[#0d7fc4] text-white rounded-xl font-semibold shadow-md hover:opacity-90">
                    + New Rate Plan
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(plan => {
                  const pType = getPlanType(plan);
                  const meta = TYPE_META[pType];
                  const TypeIcon = meta.icon;
                  const dailyNum = parseFloat(normalizeDecimal(plan.daily_rate) || "0");
                  const hasWeekly = plan.weekly_rate && parseFloat(normalizeDecimal(plan.weekly_rate) || "0") > 0;
                  const hasMonthly = plan.monthly_rate && parseFloat(normalizeDecimal(plan.monthly_rate) || "0") > 0;
                  const hasWeekend = plan.weekend_rate && parseFloat(normalizeDecimal(plan.weekend_rate) || "0") > 0;

                  const accentColor = pType === "vehicle_class" ? "#2563eb" : pType === "vehicle_model" ? "#059669" : "#7c3aed";

                  return (
                    <div key={plan._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden">
                      {/* Accent top bar */}
                      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

                      {/* Header */}
                      <div className="px-5 pt-4 pb-3">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium" style={{ color: accentColor, borderColor: `${accentColor}30`, backgroundColor: `${accentColor}08` }}>
                            <TypeIcon className="w-3 h-3" />
                            {meta.label}
                          </div>
                          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${plan.active ? "text-emerald-700 bg-emerald-50" : "text-gray-500 bg-gray-100"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${plan.active ? "bg-emerald-500" : "bg-gray-400"}`} />
                            {plan.active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <h3 className="font-bold text-gray-900 text-base leading-snug truncate mb-0.5">{plan.name}</h3>
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                          <Building2 className="w-3 h-3 flex-shrink-0" />
                          {getBranchName(plan.branch_id)}
                          <span className="mx-1">·</span>
                          {plan.currency}
                        </p>
                      </div>

                      {/* Rate section */}
                      <div className="mx-5 mb-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Daily Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{fmtCurrency(dailyNum, plan.currency)}</p>
                          </div>
                          <p className="text-xs text-gray-400 mb-1">per day</p>
                        </div>

                        {(hasWeekly || hasMonthly || hasWeekend) && (
                          <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-3 gap-2">
                            {[
                              { label: "Weekly", val: plan.weekly_rate, show: hasWeekly },
                              { label: "Monthly", val: plan.monthly_rate, show: hasMonthly },
                              { label: "Weekend", val: plan.weekend_rate, show: hasWeekend },
                            ].map(r => r.show ? (
                              <div key={r.label}>
                                <p className="text-xs text-gray-400">{r.label}</p>
                                <p className="text-sm font-semibold text-gray-700">{fmtCurrency(r.val, plan.currency)}</p>
                              </div>
                            ) : null)}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="px-5 pb-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <TypeIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium capitalize">
                            {pType === "vehicle_class" ? plan.vehicle_class
                              : pType === "vehicle_model" ? getModelName(plan.vehicle_model_id)
                              : getUnitName(plan.vehicle_id)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span>
                            {plan.valid_from ? fmtDate(plan.valid_from) : "Now"}
                            {" – "}
                            {plan.valid_to ? fmtDate(plan.valid_to) : "No expiry"}
                          </span>
                        </div>

                        {((plan.seasonal_overrides?.length ?? 0) > 0 || (plan.taxes?.length ?? 0) > 0 || (plan.fees?.length ?? 0) > 0) && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {(plan.seasonal_overrides?.length ?? 0) > 0 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{plan.seasonal_overrides!.length} season{plan.seasonal_overrides!.length !== 1 ? "s" : ""}</span>
                            )}
                            {(plan.taxes?.length ?? 0) > 0 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{plan.taxes!.length} tax{plan.taxes!.length !== 1 ? "es" : ""}</span>
                            )}
                            {(plan.fees?.length ?? 0) > 0 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{plan.fees!.length} fee{plan.fees!.length !== 1 ? "s" : ""}</span>
                            )}
                          </div>
                        )}

                        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center gap-2">
                          <button onClick={() => navigate(`/admin/rate-plan/${plan._id}`)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition-colors">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button onClick={() => openEdit(plan)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition-colors">
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => setDeleteTarget(plan._id)}
                            className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── VIEW MODAL REMOVED — detail page used instead ── */}
      {false && selectedPlan && (() => {
        const pType = getPlanType(selectedPlan);
        const meta = TYPE_META[pType];
        const TypeIcon = meta.icon;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Hero */}
              <div className={`bg-gradient-to-br ${meta.gradient} px-6 py-5`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-white/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <TypeIcon className="w-3.5 h-3.5 text-white" />
                        <span className="text-white text-xs font-semibold">{meta.label}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${selectedPlan.active ? "bg-emerald-400/30 text-white" : "bg-black/20 text-white/70"}`}>
                        {selectedPlan.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-0.5">{selectedPlan.name}</h2>
                    <p className="text-white/70 text-sm">{getBranchName(selectedPlan.branch_id)} · {selectedPlan.currency}</p>
                    <div className="mt-4 flex items-end gap-1">
                      <span className="text-5xl font-black text-white">{fmtCurrency(selectedPlan.daily_rate, selectedPlan.currency)}</span>
                      <span className="text-white/60 text-lg mb-1">/day</span>
                    </div>
                  </div>
                  <button onClick={() => setIsViewOpen(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg ml-4">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Rates */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Weekly", val: selectedPlan.weekly_rate },
                    { label: "Monthly", val: selectedPlan.monthly_rate },
                    { label: "Weekend", val: selectedPlan.weekend_rate },
                  ].map(r => (
                    <div key={r.label} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">{r.label}</p>
                      <p className="text-lg font-bold text-gray-800">
                        {r.val ? fmtCurrency(r.val, selectedPlan.currency) : <span className="text-gray-300">—</span>}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Vehicle Target */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vehicle Target</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
                      <TypeIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{meta.label}</p>
                      <p className="font-semibold text-gray-800 capitalize">
                        {pType === "vehicle_class" ? selectedPlan.vehicle_class
                          : pType === "vehicle_model" ? getModelName(selectedPlan.vehicle_model_id as string)
                          : getUnitName(selectedPlan.vehicle_id)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Validity */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Validity</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Valid From</p>
                      <p className="font-semibold text-gray-800">{selectedPlan.valid_from ? fmtDate(selectedPlan.valid_from) : "Immediately"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Valid To</p>
                      <p className="font-semibold text-gray-800">{selectedPlan.valid_to ? fmtDate(selectedPlan.valid_to) : "No expiry"}</p>
                    </div>
                  </div>
                </div>

                {/* Seasonal Overrides */}
                {(selectedPlan.seasonal_overrides?.length ?? 0) > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Seasonal Overrides</p>
                    <div className="space-y-3">
                      {selectedPlan.seasonal_overrides!.map((o, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="font-semibold text-sm text-gray-800 mb-2">{o.season?.name || `Season ${i + 1}`}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <span>{fmtDate(o.season?.start)} → {fmtDate(o.season?.end)}</span>
                            {o.daily_rate && <span>Daily: {fmtCurrency(o.daily_rate, selectedPlan.currency)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Taxes & Fees */}
                {((selectedPlan.taxes?.length ?? 0) > 0 || (selectedPlan.fees?.length ?? 0) > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(selectedPlan.taxes?.length ?? 0) > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Taxes</p>
                        {selectedPlan.taxes!.map((t, i) => (
                          <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0 border-gray-100">
                            <span className="text-sm font-medium text-gray-800">{t.code}</span>
                            <span className="text-sm font-bold text-[#1EA2E4]">{(t.rate * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(selectedPlan.fees?.length ?? 0) > 0 && (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Fees</p>
                        {selectedPlan.fees!.map((f, i) => (
                          <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0 border-gray-100">
                            <span className="text-sm font-medium text-gray-800">{f.code}</span>
                            <span className="text-sm font-bold text-[#1EA2E4]">{fmtCurrency(f.amount, selectedPlan.currency)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedPlan.notes && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                    <p className="text-sm text-gray-700">{selectedPlan.notes}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-between">
                <button onClick={() => setIsViewOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">Close</button>
                <button onClick={() => openEdit(selectedPlan)} className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg text-sm font-medium flex items-center gap-2">
                  <Edit className="w-4 h-4" /> Edit Plan
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ADD / EDIT DRAWER ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div className="relative w-screen max-w-2xl bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className={`px-8 py-5 bg-gradient-to-r ${isEditMode ? "from-violet-600 to-indigo-700" : "from-[#1EA2E4] to-[#0d7fc4]"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/70 text-sm">{isEditMode ? "Editing" : "Creating"}</p>
                    <h2 className="text-2xl font-bold text-white">{isEditMode ? "Update Rate Plan" : "New Rate Plan"}</h2>
                  </div>
                  <button onClick={closeForm} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                {formData.name && (
                  <div className="mt-4 bg-white/15 rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap">
                    <div>
                      <p className="text-white/60 text-xs">Plan Name</p>
                      <p className="font-bold text-white text-sm">{formData.name}</p>
                    </div>
                    <div className="w-px h-8 bg-white/30" />
                    <div>
                      <p className="text-white/60 text-xs">Daily Rate</p>
                      <p className="font-bold text-white">{formData.currency} {formData.daily_rate || "0.00"}</p>
                    </div>
                    <div className="w-px h-8 bg-white/30" />
                    <div>
                      <p className="text-white/60 text-xs">Status</p>
                      <p className="font-bold text-white text-sm">{formData.active ? "Active" : "Inactive"}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-7">

                {/* Conflict banner — shown when backend rejects creation with 409 */}
                {conflictPlanId && (
                  <div className="rounded-xl bg-amber-50 border border-amber-300 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-amber-800 text-sm">Rate plan already exists</p>
                        <p className="text-amber-700 text-xs mt-0.5">{conflictMsg} — you can edit the existing plan or replace it with the data entered above.</p>
                        <div className="mt-3 flex gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleEditExisting}
                            disabled={saving}
                            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 disabled:opacity-60 transition-colors"
                          >
                            Edit Existing Plan
                          </button>
                          <button
                            type="button"
                            onClick={handleReplace}
                            disabled={saving}
                            className="px-3 py-1.5 bg-white border border-amber-400 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-50 disabled:opacity-60 transition-colors"
                          >
                            {saving ? "Replacing…" : "Replace with This Plan"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1 ─ Plan Details */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-[#1EA2E4] flex items-center justify-center text-sm font-bold">1</div>
                    <h3 className="font-semibold text-gray-800">Plan Details</h3>
                  </div>
                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Plan Name <span className="text-red-500">*</span></label>
                      <input
                        type="text" value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]"
                        placeholder="e.g. Standard Economy Plan"
                      />
                    </div>

                    {/* Branch + Currency */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Branch <span className="ml-1 text-xs font-normal text-gray-400">optional — blank applies to all branches</span>
                        </label>
                        <select value={formData.branch_id} onChange={e => setFormData(p => ({ ...p, branch_id: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white">
                          <option value="">All branches</option>
                          {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                        <select value={formData.currency} onChange={e => setFormData(p => ({ ...p, currency: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white">
                          <option value="USD">USD ($)</option>
                          <option value="ZWL">ZWL ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="ZAR">ZAR (R)</option>
                        </select>
                      </div>
                    </div>

                    {/* Vehicle Class — ALWAYS required by the backend */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Vehicle Class <span className="text-red-500">*</span>
                        <span className="ml-1.5 text-xs text-gray-400 font-normal">Required for all plan types</span>
                      </label>
                      <select value={formData.vehicle_class} onChange={e => setFormData(p => ({ ...p, vehicle_class: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white">
                        <option value="">Select class...</option>
                        {vehicleClasses.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </div>

                    {/* Plan Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plan Scope <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 gap-3">
                        {(["vehicle_model", "vehicle_unit"] as RatePlanType[]).map(t => {
                          const m = TYPE_META[t]; const Icon = m.icon;
                          const gradients: Record<string, string> = {
                            vehicle_model: "#10b981,#0f766e",
                            vehicle_unit: "#8b5cf6,#7c3aed",
                          };
                          return (
                            <button key={t} type="button" onClick={() => setPlanType(t)}
                              className={`p-3.5 rounded-xl border-2 text-left transition-all ${planType === t ? "border-transparent shadow-md" : "border-gray-200 bg-gray-50"}`}
                              style={planType === t ? { background: `linear-gradient(to bottom right, ${gradients[t]})` } : {}}>
                              <Icon className={`w-5 h-5 mb-2 ${planType === t ? "text-white" : "text-gray-500"}`} />
                              <p className={`text-sm font-semibold ${planType === t ? "text-white" : "text-gray-800"}`}>{m.label}</p>
                              <p className={`text-xs mt-0.5 ${planType === t ? "text-white/70" : "text-gray-400"}`}>
                                {t === "vehicle_model" ? "One model" : "One unit"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        {planType === "vehicle_model" && "Applies to all units of the selected model."}
                        {planType === "vehicle_unit" && "Most specific — applies to a single vehicle unit only."}
                      </p>
                    </div>

                    {planType === "vehicle_model" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Model</label>
                        <select value={formData.vehicle_model_id || ""} onChange={e => setFormData(p => ({ ...p, vehicle_model_id: e.target.value || null }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white">
                          <option value="">Select model...</option>
                          {vehicleModels.map(m => <option key={m._id} value={m._id}>{m.make} {m.model} {m.year}</option>)}
                        </select>
                      </div>
                    )}
                    {planType === "vehicle_unit" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Unit</label>
                        <select value={formData.vehicle_id || ""} onChange={e => setFormData(p => ({ ...p, vehicle_id: e.target.value || null }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white">
                          <option value="">Select unit...</option>
                          {vehicleUnits.map(u => <option key={u._id} value={u._id}>{u.vin} ({u.plate_number})</option>)}
                        </select>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                      <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] resize-none text-sm"
                        placeholder="Internal notes about this rate plan" rows={2} />
                    </div>
                  </div>
                </div>

                {/* 2 ─ Pricing */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">2</div>
                    <h3 className="font-semibold text-gray-800">Pricing Rates</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <RateInput label="Daily Rate *" value={formData.daily_rate} onChange={v => setFormData(p => ({ ...p, daily_rate: v }))} currency={formData.currency} />
                    <RateInput label="Weekly Rate" value={formData.weekly_rate || ""} onChange={v => setFormData(p => ({ ...p, weekly_rate: v }))} currency={formData.currency} />
                    <RateInput label="Monthly Rate" value={formData.monthly_rate || ""} onChange={v => setFormData(p => ({ ...p, monthly_rate: v }))} currency={formData.currency} />
                    <RateInput label="Weekend Rate" value={formData.weekend_rate || ""} onChange={v => setFormData(p => ({ ...p, weekend_rate: v }))} currency={formData.currency} />
                  </div>
                </div>

                {/* 3 ─ Seasonal Overrides */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold">3</div>
                      <h3 className="font-semibold text-gray-800">Seasonal Overrides</h3>
                      {(formData.seasonal_overrides?.length ?? 0) > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">{formData.seasonal_overrides!.length}</span>
                      )}
                    </div>
                    <button type="button" onClick={addOverride}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100">
                      <Plus className="w-3.5 h-3.5" /> Add Season
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(formData.seasonal_overrides || []).map((o, i) => (
                      <div key={i} className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-amber-800">Season {i + 1}</p>
                          <button type="button" onClick={() => removeOverride(i)} className="p-1 text-red-400 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Name</label>
                            <input value={o.season?.name || ""} onChange={e => setOverrideField(i, "season.name", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="e.g. Summer" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Start</label>
                            <input type="date" value={o.season?.start || ""} onChange={e => setOverrideField(i, "season.start", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">End</label>
                            <input type="date" value={o.season?.end || ""} onChange={e => setOverrideField(i, "season.end", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <RateInput label="Daily" value={o.daily_rate as string || ""} onChange={v => setOverrideField(i, "daily_rate", v)} currency={formData.currency} />
                          <RateInput label="Weekly" value={o.weekly_rate as string || ""} onChange={v => setOverrideField(i, "weekly_rate", v)} currency={formData.currency} />
                        </div>
                      </div>
                    ))}
                    {(formData.seasonal_overrides?.length ?? 0) === 0 && (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No seasonal overrides. Click "Add Season" to create one.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4 ─ Taxes */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">4</div>
                      <h3 className="font-semibold text-gray-800">Taxes</h3>
                      {(formData.taxes?.length ?? 0) > 0 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{formData.taxes!.length}</span>
                      )}
                    </div>
                    <button type="button" onClick={addTax}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100">
                      <Plus className="w-3.5 h-3.5" /> Add Tax
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(formData.taxes || []).map((tax, i) => (
                      <div key={i} className="flex items-center gap-3 bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Code</label>
                          <input value={tax.code} onChange={e => setTaxField(i, "code", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="e.g. VAT" />
                        </div>
                        <div className="w-28">
                          <label className="block text-xs text-gray-500 mb-1">Rate (%)</label>
                          <div className="relative">
                            <input type="number" min="0" max="100" step="0.01" value={(tax.rate * 100).toFixed(2)}
                              onChange={e => setTaxField(i, "rate", String(parseFloat(e.target.value) / 100))}
                              className="w-full pl-3 pr-7 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="15" />
                            <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          </div>
                        </div>
                        <button type="button" onClick={() => removeTax(i)} className="mt-5 p-1.5 text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(formData.taxes?.length ?? 0) === 0 && (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center">
                        <p className="text-sm text-gray-400">No taxes added yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5 ─ Fees */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">5</div>
                      <h3 className="font-semibold text-gray-800">Fees</h3>
                      {(formData.fees?.length ?? 0) > 0 && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">{formData.fees!.length}</span>
                      )}
                    </div>
                    <button type="button" onClick={addFee}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-100">
                      <Plus className="w-3.5 h-3.5" /> Add Fee
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(formData.fees || []).map((fee, i) => (
                      <div key={i} className="flex items-center gap-3 bg-purple-50/50 border border-purple-200 rounded-xl px-4 py-3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Code</label>
                          <input value={fee.code} onChange={e => setFeeField(i, "code", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="e.g. CLEANING_FEE" />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs text-gray-500 mb-1">Amount</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <input type="number" min="0" step="0.01" value={fee.amount as string}
                              onChange={e => setFeeField(i, "amount", e.target.value)}
                              className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="10.00" />
                          </div>
                        </div>
                        <button type="button" onClick={() => removeFee(i)} className="mt-5 p-1.5 text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(formData.fees?.length ?? 0) === 0 && (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center">
                        <p className="text-sm text-gray-400">No fees added yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6 ─ Validity & Status */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold">6</div>
                    <h3 className="font-semibold text-gray-800">Validity & Status</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Valid From</label>
                      <input type="date" value={formData.valid_from || ""}
                        onChange={e => setFormData(p => ({ ...p, valid_from: e.target.value || "" }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Valid To (Optional)</label>
                      <input type="date" value={formData.valid_to || ""}
                        onChange={e => setFormData(p => ({ ...p, valid_to: e.target.value || null }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]" />
                    </div>
                  </div>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, active: !p.active }))}
                    className={`flex items-center gap-4 w-full p-4 rounded-xl border-2 transition-all ${formData.active ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.active ? "bg-emerald-500" : "bg-gray-300"}`}>
                      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: formData.active ? "26px" : "2px" }} />
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold text-sm ${formData.active ? "text-emerald-700" : "text-gray-600"}`}>{formData.active ? "Active" : "Inactive"}</p>
                      <p className="text-xs text-gray-500">{formData.active ? "This plan is live and being applied" : "This plan is disabled"}</p>
                    </div>
                  </button>
                </div>

              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 bg-gray-50 px-8 py-4 flex justify-between items-center">
                <button onClick={closeForm} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name || !formData.vehicle_class || !formData.daily_rate || !formData.valid_from || saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#1EA2E4] to-[#0d7fc4] text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" />{isEditMode ? "Update Plan" : "Create Plan"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Rate Plan</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SNACKBAR ── */}
      {snackbar.show && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[280px] ${
            snackbar.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : snackbar.type === "error" ? "bg-red-50 border-red-200 text-red-800"
            : "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{snackbar.message}</span>
            <button onClick={() => setSnackbar(p => ({ ...p, show: false }))}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatePlanScreen;
