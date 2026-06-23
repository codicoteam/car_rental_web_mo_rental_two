import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ManagerSidebar from "../../../components/ManagerSideBar";
import {
  fetchRatePlanById, normalizeDecimal, getErrorDisplay, deleteRatePlan,
  type IRatePlan,
} from "../../../Services/adminAndManager/rate_plan_service";
import {
  fetchVehicleUnits, fetchVehicleUnitById, type IVehicleUnit, type IVehicleModelSummary,
} from "../../../Services/adminAndManager/vehicle_units_services";
import { fetchVehicleModels } from "../../../Services/adminAndManager/vehicle_model_service";
import {
  ArrowLeft, Edit, Trash2, Tag, Building2, Calendar, Car,
  Layers, Package, AlertCircle, RefreshCw, CheckCircle, Clock,
  Percent, MoreVertical, Hash, ChevronRight,
  TrendingUp, X, DollarSign, Info,
} from "lucide-react";

type RatePlanType = "vehicle_class" | "vehicle_model" | "vehicle_unit";

const TYPE_META: Record<RatePlanType, { label: string; icon: typeof Car; color: string; bg: string; border: string }> = {
  vehicle_class: { label: "By Class", icon: Layers, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  vehicle_model: { label: "By Model", icon: Car, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  vehicle_unit: { label: "By Unit", icon: Package, color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
};

const AVAILABILITY_META: Record<string, { label: string; color: string; dot: string }> = {
  available: { label: "Available", color: "text-emerald-700 bg-emerald-50", dot: "bg-emerald-500" },
  reserved: { label: "Reserved", color: "text-amber-700 bg-amber-50", dot: "bg-amber-500" },
  rented: { label: "Rented", color: "text-blue-700 bg-blue-50", dot: "bg-blue-500" },
  out_of_service: { label: "Out of Service", color: "text-red-700 bg-red-50", dot: "bg-red-500" },
};

const ManagerRatePlanDetailPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<IRatePlan | null>(null);
  const [vehicles, setVehicles] = useState<IVehicleUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ show: boolean; msg: string; type: "success" | "error" }>({ show: false, msg: "", type: "success" });

  useEffect(() => {
    if (!planId) return;
    load();
  }, [planId]);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchRatePlanById(planId!);
      setPlan(data);
      loadVehicles(data);
    } catch (err) {
      setError(getErrorDisplay(err).message || "Failed to load rate plan");
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async (p: IRatePlan) => {
    setLoadingVehicles(true);
    try {
      const pType: RatePlanType = p.vehicle_id ? "vehicle_unit" : p.vehicle_model_id ? "vehicle_model" : "vehicle_class";

      if (pType === "vehicle_unit") {
        const vid = typeof p.vehicle_id === "object" ? (p.vehicle_id as any)?._id : p.vehicle_id;
        if (vid) {
          const v = await fetchVehicleUnitById(vid);
          setVehicles([v]);
        }
      } else {
        const [vRes, mRes] = await Promise.all([fetchVehicleUnits(1, 500), fetchVehicleModels()]);
        const all = vRes.data.items;
        const allModels = mRes.data.items || [];

        if (pType === "vehicle_model") {
          const mid = typeof p.vehicle_model_id === "object" ? (p.vehicle_model_id as any)?._id : p.vehicle_model_id;
          setVehicles(all.filter(v => {
            const vmid = typeof v.vehicle_model_id === "object" ? (v.vehicle_model_id as any)?._id : v.vehicle_model_id;
            return vmid === mid;
          }));
        } else {
          setVehicles(all.filter(v => {
            let cls: string | undefined;
            if (typeof v.vehicle_model_id === "object") cls = (v.vehicle_model_id as IVehicleModelSummary)?.class;
            else cls = allModels.find(m => m._id === v.vehicle_model_id)?.class;
            return cls === p.vehicle_class;
          }));
        }
      }
    } catch {
      // vehicles section shows empty state
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    setDeleting(true);
    try {
      await deleteRatePlan(plan._id);
      navigate("/manager-rate-plans");
    } catch (err) {
      setSnackbar({ show: true, msg: getErrorDisplay(err).message, type: "error" });
      setTimeout(() => setSnackbar(s => ({ ...s, show: false })), 3500);
      setShowDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const fmtCurrency = (amount: any, currency = "USD") => {
    const n = typeof amount === "number" ? amount
      : typeof amount === "string" ? parseFloat(amount)
      : amount?.$numberDecimal ? parseFloat(amount.$numberDecimal) : 0;
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(n);
  };
  const fmtDate = (d?: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const getPlanType = (p: IRatePlan): RatePlanType =>
    p.vehicle_id ? "vehicle_unit" : p.vehicle_model_id ? "vehicle_model" : "vehicle_class";

  const getVehicleModelData = (v: IVehicleUnit) => {
    if (typeof v.vehicle_model_id === "object") return v.vehicle_model_id as IVehicleModelSummary;
    return null;
  };
  const getVehicleLabel = (v: IVehicleUnit) => {
    const m = getVehicleModelData(v);
    return m ? `${m.make || ""} ${m.model || ""} ${m.year || ""}`.trim() : "Unknown Model";
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1EA2E4]" />
          <p className="text-gray-500 text-sm">Loading rate plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="flex h-screen bg-gray-50">
        <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-red-600">{error || "Rate plan not found"}</p>
          <div className="flex gap-3">
            <button onClick={() => navigate("/manager-rate-plans")} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-[#1EA2E4] text-white rounded-lg text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pType = getPlanType(plan);
  const meta = TYPE_META[pType];
  const TypeIcon = meta.icon;
  const dailyNum = parseFloat(normalizeDecimal(plan.daily_rate) || "0");
  const weeklyNum = parseFloat(normalizeDecimal(plan.weekly_rate) || "0");
  const monthlyNum = parseFloat(normalizeDecimal(plan.monthly_rate) || "0");
  const weekendNum = parseFloat(normalizeDecimal(plan.weekend_rate) || "0");
  const branchName = typeof plan.branch_id === "object" ? (plan.branch_id as any)?.name || "—" : "—";

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top Bar ── */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <button onClick={() => navigate("/manager-rate-plans")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> Rate Plans
              </button>
              <span className="text-gray-300">/</span>
              <span className="text-gray-800 font-semibold text-sm truncate max-w-xs">{plan.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/manager-rate-plans", { state: { editPlanId: plan._id } })}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${meta.bg} ${meta.color} ${meta.border}`}>
                    <TypeIcon className="w-3.5 h-3.5" /> {meta.label}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${plan.active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${plan.active ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {plan.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h1>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span>{branchName}</span>
                  <span className="mx-1.5">·</span>
                  <span className="font-medium text-gray-700">{plan.currency}</span>
                </div>
              </div>

              <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">Daily</p>
                  <p className="text-3xl font-bold text-gray-900">{fmtCurrency(dailyNum, plan.currency)}</p>
                </div>
                {weeklyNum > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-0.5">Weekly</p>
                    <p className="text-xl font-semibold text-gray-700">{fmtCurrency(weeklyNum, plan.currency)}</p>
                  </div>
                )}
                {monthlyNum > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-0.5">Monthly</p>
                    <p className="text-xl font-semibold text-gray-700">{fmtCurrency(monthlyNum, plan.currency)}</p>
                  </div>
                )}
                {weekendNum > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-0.5">Weekend</p>
                    <p className="text-xl font-semibold text-gray-700">{fmtCurrency(weekendNum, plan.currency)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {/* Validity */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Validity Period</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">From</p>
                      <p className="font-semibold text-gray-800">{fmtDate(plan.valid_from) || "Immediately"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Until</p>
                      <p className="font-semibold text-gray-800">{fmtDate(plan.valid_to) || "No expiry"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {(plan.seasonal_overrides?.length ?? 0) > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Seasonal Overrides</p>
                  <div className="space-y-3">
                    {plan.seasonal_overrides!.map((o, i) => (
                      <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800">{o.season?.name || `Season ${i + 1}`}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{fmtDate(o.season?.start)} → {fmtDate(o.season?.end)}</p>
                        </div>
                        {o.daily_rate && (
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Daily</p>
                            <p className="font-bold text-gray-800 text-sm">{fmtCurrency(o.daily_rate, plan.currency)}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {plan.notes && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{plan.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-5">
              {/* Target */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Target Vehicle</p>
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${meta.border} ${meta.bg}`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${meta.bg}`}>
                    <TypeIcon className={`w-5 h-5 ${meta.color}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${meta.color}`}>{meta.label}</p>
                    <p className="font-bold text-gray-800 capitalize text-sm">
                      {pType === "vehicle_class" ? plan.vehicle_class
                        : pType === "vehicle_model"
                          ? (typeof plan.vehicle_model_id === "object"
                            ? `${(plan.vehicle_model_id as any)?.make || ""} ${(plan.vehicle_model_id as any)?.model || ""}`.trim()
                            : plan.vehicle_model_id || "—")
                          : (typeof plan.vehicle_id === "object"
                            ? `${(plan.vehicle_id as any)?.vin || ""}`
                            : plan.vehicle_id as string || "—")}
                    </p>
                  </div>
                </div>
              </div>

              {(plan.taxes?.length ?? 0) > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Taxes</p>
                  <div className="space-y-2">
                    {plan.taxes!.map((t, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center">
                            <Percent className="w-3 h-3 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-800">{t.code}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-700">{(t.rate * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(plan.fees?.length ?? 0) > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Fees</p>
                  <div className="space-y-2">
                    {plan.fees!.map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-50 rounded flex items-center justify-center">
                            <DollarSign className="w-3 h-3 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-800">{f.code}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-700">{fmtCurrency(f.amount, plan.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Created</p>
                <p className="text-sm text-gray-700">{fmtDate(plan.createdAt) || "—"}</p>
                {plan.updatedAt && plan.updatedAt !== plan.createdAt && (
                  <p className="text-xs text-gray-400 mt-1">Updated {fmtDate(plan.updatedAt)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Vehicles Section */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold text-gray-800">Vehicles on this Rate Plan</h2>
                {!loadingVehicles && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">{vehicles.length}</span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {pType === "vehicle_class" ? `All ${plan.vehicle_class} class vehicles`
                  : pType === "vehicle_model" ? "All units of this model"
                  : "Specific vehicle unit"}
              </p>
            </div>

            <div className="p-6">
              {loadingVehicles ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1EA2E4] mb-3" />
                  <p className="text-gray-400 text-sm">Loading vehicles...</p>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Car className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium mb-1">No vehicles found</p>
                  <p className="text-gray-400 text-sm">No vehicles match this rate plan criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {vehicles.map(v => {
                    const avail = v.availability_state || "available";
                    const availMeta = AVAILABILITY_META[avail] || { label: avail, color: "text-gray-600 bg-gray-50", dot: "bg-gray-400" };
                    const modelData = getVehicleModelData(v);
                    const photo = v.photos?.[0];
                    const vehicleLabel = getVehicleLabel(v);

                    return (
                      <button
                        key={v._id}
                        onClick={() => navigate(`/manager/vehicle/${v._id}`)}
                        className="text-left bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#1EA2E4] hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="w-full h-36 bg-gray-100 relative overflow-hidden">
                          {photo ? (
                            <img src={photo} alt={vehicleLabel} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <Car className="w-10 h-10 text-gray-300" />
                              <p className="text-xs text-gray-300 mt-1">No photo</p>
                            </div>
                          )}
                          <span className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${availMeta.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${availMeta.dot}`} />
                            {availMeta.label}
                          </span>
                        </div>

                        <div className="px-3 py-3">
                          <p className="font-semibold text-gray-900 text-sm truncate">{vehicleLabel}</p>
                          <p className="text-xs text-gray-500 mt-0.5 font-mono">{v.vin}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">{v.plate_number}</span>
                            {v.color && <span className="text-xs text-gray-400 capitalize">{v.color}</span>}
                          </div>
                          {modelData && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                              {modelData.transmission && <span className="capitalize">{modelData.transmission}</span>}
                              {modelData.fuel_type && <span className="capitalize">{modelData.fuel_type}</span>}
                              {modelData.seats && <span>{modelData.seats} seats</span>}
                            </div>
                          )}
                        </div>

                        <div className="px-3 pb-3">
                          <div className="flex items-center gap-1 text-xs text-[#1EA2E4] font-medium group-hover:gap-2 transition-all">
                            View details <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Rate Plan</h3>
            <p className="text-sm text-gray-500 mb-1">"{plan.name}"</p>
            <p className="text-xs text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting...</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {snackbar.show && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[260px] ${snackbar.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {snackbar.type === "success" ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{snackbar.msg}</span>
            <button onClick={() => setSnackbar(s => ({ ...s, show: false }))}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerRatePlanDetailPage;
