import React, { useState, useEffect, useCallback } from "react";
import ManagerSidebar from "../../../components/ManagerSideBar";
import {
  fetchAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getErrorDisplay,
  type IPromoCode,
  type CreatePromoCodePayload,
  type UpdatePromoCodePayload,
  type PromoCodeType,
  type VehicleClass,
} from "../../../Services/adminAndManager/promo_code_service";
import {
  fetchBranches,
  type IBranch,
} from "../../../Services/adminAndManager/admin_branch_service";
import {
  Search, Trash2, Eye, Edit, Plus, X, AlertCircle, CheckCircle,
  MoreVertical, Building2, Tag, Calendar, Percent, RefreshCw,
  Car, Sparkles, Copy, Hash, Clock, TrendingUp, Zap,
  Save, ArrowRight, Check, Globe, Ticket,
} from "lucide-react";

const vehicleClasses: VehicleClass[] = [
  "economy", "compact", "midsize", "standard", "fullsize",
  "suv", "luxury", "van", "premium", "sports",
];

const initialForm: CreatePromoCodePayload = {
  code: "",
  type: "percent",
  value: 0,
  currency: "USD",
  active: true,
  valid_from: "",
  valid_to: null,
  usage_limit: null,
  constraints: { allowed_classes: [], min_days: undefined, branch_ids: [] },
  notes: "",
};

const PromoCodesPage: React.FC = () => {
  const [promoCodes, setPromoCodes] = useState<IPromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [selectedPromo, setSelectedPromo] = useState<IPromoCode | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [branches, setBranches] = useState<IBranch[]>([]);
  const [formData, setFormData] = useState<CreatePromoCodePayload>(initialForm);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [snackbar, setSnackbar] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false, message: "", type: "info",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [promoRes, branchRes] = await Promise.all([fetchAllPromoCodes(), fetchBranches()]);
      setPromoCodes(promoRes.data);
      setBranches(branchRes.data);
    } catch (err) {
      const d = getErrorDisplay(err);
      setError(d.message || "Failed to load data");
      showSnackbar(d.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar(p => ({ ...p, show: false })), 3500);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setFormData(p => ({ ...p, code }));
  };

  const openAdd = () => {
    setFormData(initialForm);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const openEdit = (promo: IPromoCode) => {
    setSelectedPromo(promo);
    setFormData({
      code: promo.code,
      type: promo.type,
      value: promo.value,
      currency: promo.currency || "USD",
      active: promo.active ?? true,
      valid_from: promo.valid_from || "",
      valid_to: promo.valid_to || null,
      usage_limit: promo.usage_limit || null,
      constraints: {
        allowed_classes: promo.constraints?.allowed_classes || [],
        min_days: promo.constraints?.min_days,
        branch_ids: promo.constraints?.branch_ids || [],
      },
      notes: promo.notes || "",
    });
    setIsEditMode(true);
    setIsFormOpen(true);
    setIsViewOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData, currency: formData.type === "fixed" ? (formData.currency || "USD") : undefined };
      if (isEditMode && selectedPromo) {
        await updatePromoCode(selectedPromo._id, payload as UpdatePromoCodePayload);
        showSnackbar("Promo code updated!", "success");
      } else {
        await createPromoCode(payload);
        showSnackbar("Promo code created!", "success");
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      showSnackbar(getErrorDisplay(err).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePromoCode(id);
      showSnackbar("Promo code deleted", "success");
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      showSnackbar(getErrorDisplay(err).message, "error");
    }
  };

  const toggleClass = (cls: VehicleClass) => {
    setFormData(p => {
      const list = p.constraints?.allowed_classes || [];
      return { ...p, constraints: { ...p.constraints, allowed_classes: list.includes(cls) ? list.filter(c => c !== cls) : [...list, cls] } };
    });
  };

  const toggleBranch = (id: string) => {
    setFormData(p => {
      const list = p.constraints?.branch_ids || [];
      return { ...p, constraints: { ...p.constraints, branch_ids: list.includes(id) ? list.filter(b => b !== id) : [...list, id] } };
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSnackbar("Copied!", "success");
  };

  const fmtDate = (d?: string | null) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isValidNow = (code: IPromoCode) => {
    if (!code.active) return false;
    const now = new Date();
    if (code.valid_from && now < new Date(code.valid_from)) return false;
    if (code.valid_to && now > new Date(code.valid_to)) return false;
    if (code.usage_limit && (code.used_count || 0) >= code.usage_limit) return false;
    return true;
  };

  const getDisplayValue = (code: IPromoCode) =>
    code.type === "percent" ? `${code.value}%` : `$${code.value.toFixed(2)}`;

  const usagePct = (code: IPromoCode) => {
    if (!code.usage_limit || code.usage_limit <= 0) return null;
    return Math.min(100, ((code.used_count || 0) / code.usage_limit) * 100);
  };

  const isExpiringSoon = (code: IPromoCode) => {
    if (!code.valid_to) return false;
    const days = (new Date(code.valid_to).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 7;
  };

  const filtered = promoCodes.filter(c => {
    const ms = !searchTerm || c.code.toLowerCase().includes(searchTerm.toLowerCase()) || (c.notes || "").toLowerCase().includes(searchTerm.toLowerCase());
    const mst = statusFilter === "all" || (statusFilter === "active" && c.active) || (statusFilter === "inactive" && !c.active);
    const mt = typeFilter === "all" || c.type === typeFilter;
    return ms && mst && mt;
  });

  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter(c => c.active).length,
    valid: promoCodes.filter(isValidNow).length,
    expiring: promoCodes.filter(isExpiringSoon).length,
    totalUsed: promoCodes.reduce((s, c) => s + (c.used_count || 0), 0),
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
                  <Ticket className="w-6 h-6 text-[#1EA2E4]" /> Promo Codes
                </h1>
                <p className="text-sm text-gray-500">Create and manage promotional discounts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={loadData} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1EA2E4] to-[#0d7fc4] text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition-all"
              >
                <Plus className="w-5 h-5" /> New Promo Code
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Stats */}
          <div className="px-6 pt-6 pb-2">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: "Total Codes", val: stats.total, icon: Tag, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Active", val: stats.active, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Valid Now", val: stats.valid, icon: Zap, color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Expiring Soon", val: stats.expiring, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Total Used", val: stats.totalUsed, icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50" },
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
                  type="text"
                  placeholder="Search by code or notes..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] text-sm"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { val: "all", label: "All Status" },
                  { val: "active", label: "Active" },
                  { val: "inactive", label: "Inactive" },
                ].map(f => (
                  <button key={f.val} onClick={() => setStatusFilter(f.val)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === f.val ? "bg-[#1EA2E4] text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {f.label}
                  </button>
                ))}
                <div className="h-6 w-px bg-gray-200 self-center" />
                {[
                  { val: "all", label: "All Types" },
                  { val: "percent", label: "% Off" },
                  { val: "fixed", label: "$ Fixed" },
                ].map(f => (
                  <button key={f.val} onClick={() => setTypeFilter(f.val)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${typeFilter === f.val ? "bg-violet-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="px-6 pb-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4" />
                <p className="text-gray-500">Loading promo codes...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64">
                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                <p className="text-red-600 mb-4">{error}</p>
                <button onClick={loadData} className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg flex items-center gap-2 text-sm">
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Ticket className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-600 font-semibold mb-1">No promo codes found</p>
                <p className="text-gray-400 text-sm mb-5">
                  {searchTerm || statusFilter !== "all" || typeFilter !== "all" ? "Try adjusting your filters" : "Create your first promo code"}
                </p>
                {!searchTerm && statusFilter === "all" && typeFilter === "all" && (
                  <button onClick={openAdd} className="px-5 py-2.5 bg-gradient-to-r from-[#1EA2E4] to-[#0d7fc4] text-white rounded-xl font-semibold shadow-md hover:opacity-90">
                    + New Promo Code
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(code => {
                  const pct = usagePct(code);
                  const valid = isValidNow(code);
                  const expiring = isExpiringSoon(code);
                  const isPercent = code.type === "percent";
                  const branchNames = branches.filter(b => code.constraints?.branch_ids?.includes(b._id)).map(b => b.name);

                  const accentColor = isPercent ? "#059669" : "#2563eb";

                  return (
                    <div key={code._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

                      <div className="p-5">
                        {/* Top row: type badge + status pill */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold"
                            style={{ backgroundColor: `${accentColor}14`, color: accentColor }}>
                            {isPercent ? <Percent className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                            {isPercent ? "Percentage" : `Fixed ${code.currency || "USD"}`}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {expiring && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-xs font-medium border border-amber-200">Expiring</span>}
                            {valid && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-200">Valid</span>}
                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${code.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                              {code.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>

                        {/* Discount value */}
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">{getDisplayValue(code)}</span>
                          <span className="ml-1.5 text-sm font-medium text-gray-400">OFF</span>
                        </div>

                        {/* Code box */}
                        <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 mb-4">
                          <span className="font-mono font-bold text-gray-800 tracking-widest text-sm">{code.code}</span>
                          <button onClick={() => copyToClipboard(code.code)} className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{code.valid_from ? fmtDate(code.valid_from) : "Now"} → {code.valid_to ? fmtDate(code.valid_to) : "No expiry"}</span>
                        </div>

                        {/* Usage bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                            <span>Usage</span>
                            <span className="font-medium text-gray-700">{code.used_count || 0} / {code.usage_limit ?? "∞"}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            {pct !== null ? (
                              <div className="h-1.5 rounded-full bg-gray-400" style={{ width: `${pct}%` }} />
                            ) : (
                              <div className="h-1.5 bg-gray-200 rounded-full w-full" />
                            )}
                          </div>
                        </div>

                        {/* Branch & constraint chips */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {branchNames.length > 0 ? (
                            <>
                              {branchNames.slice(0, 2).map(n => (
                                <span key={n} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                  <Building2 className="w-3 h-3" />{n}
                                </span>
                              ))}
                              {branchNames.length > 2 && <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs">+{branchNames.length - 2} more</span>}
                            </>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs">
                              <Globe className="w-3 h-3" /> All branches
                            </span>
                          )}
                          {(code.constraints?.allowed_classes?.length ?? 0) > 0 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">{code.constraints!.allowed_classes!.length} class{code.constraints!.allowed_classes!.length !== 1 ? "es" : ""}</span>
                          )}
                          {code.constraints?.min_days && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">Min {code.constraints.min_days}d</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                          <button onClick={() => { setSelectedPromo(code); setIsViewOpen(true); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-medium transition-colors">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button onClick={() => openEdit(code)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-medium transition-colors">
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => setDeleteTarget(code._id)}
                            className="p-2 border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
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

      {/* VIEW MODAL */}
      {isViewOpen && selectedPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsViewOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className={`px-6 py-5 ${selectedPromo.type === "percent" ? "bg-gradient-to-br from-violet-600 to-indigo-700" : "bg-gradient-to-br from-emerald-500 to-cyan-600"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">Promo Code</p>
                  <div className="flex items-center gap-3">
                    <h2 className="font-mono font-black text-white text-3xl tracking-widest">{selectedPromo.code}</h2>
                    <button onClick={() => copyToClipboard(selectedPromo.code)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg">
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <p className="text-5xl font-black text-white mt-2">{getDisplayValue(selectedPromo)} <span className="text-2xl opacity-70">OFF</span></p>
                </div>
                <button onClick={() => setIsViewOpen(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedPromo.active ? "bg-white/25 text-white" : "bg-black/25 text-white/70"}`}>
                  {selectedPromo.active ? "ACTIVE" : "INACTIVE"}
                </span>
                {isValidNow(selectedPromo) && <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/25 text-white">VALID NOW</span>}
              </div>
            </div>

            <div className="overflow-y-auto p-6 space-y-5" style={{ maxHeight: "calc(90vh - 200px)" }}>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Usage</p>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedPromo.used_count || 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Times Used</p>
                  </div>
                  <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedPromo.usage_limit ?? "∞"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Usage Limit</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Validity Period</p>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500">Valid From</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{selectedPromo.valid_from ? fmtDate(selectedPromo.valid_from) : "Immediately"}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500">Valid To</p>
                    <p className="font-semibold text-gray-800 mt-0.5">{selectedPromo.valid_to ? fmtDate(selectedPromo.valid_to) : "No expiry"}</p>
                  </div>
                </div>
              </div>

              {selectedPromo.constraints?.branch_ids && selectedPromo.constraints.branch_ids.length > 0 ? (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Allowed Branches</p>
                  <div className="space-y-2">
                    {branches.filter(b => selectedPromo.constraints?.branch_ids?.includes(b._id)).map(branch => (
                      <div key={branch._id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-[#1EA2E4]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{branch.name}</p>
                          <p className="text-xs text-gray-500">{(branch as any).city || branch.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <p className="text-sm text-gray-600">Valid at all branches</p>
                </div>
              )}

              {selectedPromo.notes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</p>
                  <p className="text-sm text-gray-700">{selectedPromo.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-between">
              <button onClick={() => setIsViewOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">Close</button>
              <button onClick={() => openEdit(selectedPromo)} className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg text-sm font-medium flex items-center gap-2">
                <Edit className="w-4 h-4" /> Edit Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORM DRAWER */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div className="relative w-screen max-w-2xl bg-white shadow-2xl flex flex-col">
              <div className={`px-8 py-5 ${isEditMode ? "bg-gradient-to-r from-violet-600 to-indigo-700" : "bg-gradient-to-r from-[#1EA2E4] to-[#0d7fc4]"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/70 text-sm">{isEditMode ? "Edit" : "Create New"}</p>
                    <h2 className="text-2xl font-bold text-white">{isEditMode ? "Update Promo Code" : "New Promo Code"}</h2>
                  </div>
                  <button onClick={() => setIsFormOpen(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                {formData.code && (
                  <div className="mt-4 bg-white/15 rounded-xl px-4 py-3 flex items-center gap-4">
                    <div>
                      <p className="text-white/60 text-xs">Code</p>
                      <p className="font-mono font-bold text-white text-lg tracking-widest">{formData.code}</p>
                    </div>
                    <div className="w-px h-8 bg-white/30" />
                    <div>
                      <p className="text-white/60 text-xs">Discount</p>
                      <p className="font-bold text-white text-lg">
                        {formData.value > 0 ? `${formData.value}${formData.type === "percent" ? "%" : ` ${formData.currency}`} OFF` : "—"}
                      </p>
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
                {/* Basic Info */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-[#1EA2E4] flex items-center justify-center text-sm font-bold">1</div>
                    <h3 className="font-semibold text-gray-800">Basic Information</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Promo Code <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.code}
                          onChange={e => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] font-mono text-lg font-bold tracking-widest"
                          placeholder="SUMMER25"
                        />
                        <button type="button" onClick={generateCode} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> Auto
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Type <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { val: "percent", label: "Percentage", desc: "e.g. 20% off", icon: Percent },
                          { val: "fixed", label: "Fixed Amount", desc: "e.g. $15 off", icon: Tag },
                        ] as const).map(t => (
                          <button
                            key={t.val}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, type: t.val as PromoCodeType }))}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${formData.type === t.val ? "border-transparent shadow-md" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                            style={formData.type === t.val ? { background: t.val === "percent" ? "linear-gradient(to bottom right,#7c3aed,#4338ca)" : "linear-gradient(to bottom right,#10b981,#0d9488)" } : {}}
                          >
                            <t.icon className={`w-5 h-5 mb-2 ${formData.type === t.val ? "text-white" : "text-gray-500"}`} />
                            <p className={`font-semibold text-sm ${formData.type === t.val ? "text-white" : "text-gray-800"}`}>{t.label}</p>
                            <p className={`text-xs mt-0.5 ${formData.type === t.val ? "text-white/70" : "text-gray-500"}`}>{t.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{formData.type === "percent" ? "Percentage" : "Amount"} <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{formData.type === "percent" ? "%" : "$"}</span>
                          <input
                            type="number"
                            min="0"
                            max={formData.type === "percent" ? 100 : undefined}
                            step="0.01"
                            value={formData.value || ""}
                            onChange={e => setFormData(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))}
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]"
                            placeholder={formData.type === "percent" ? "20" : "15.00"}
                          />
                        </div>
                      </div>
                      {formData.type === "fixed" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                          <select
                            value={formData.currency || "USD"}
                            onChange={e => setFormData(p => ({ ...p, currency: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white"
                          >
                            <option value="USD">USD ($)</option>
                            <option value="ZWL">ZWL ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="ZAR">ZAR (R)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (Optional)</label>
                      <textarea
                        value={formData.notes}
                        onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] resize-none"
                        placeholder="e.g. Summer campaign for returning customers"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Validity */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold">2</div>
                    <h3 className="font-semibold text-gray-800">Validity & Limits</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Valid From</label>
                      <input type="date" value={formData.valid_from || ""} onChange={e => setFormData(p => ({ ...p, valid_from: e.target.value || "" }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Valid To (Optional)</label>
                      <input type="date" value={formData.valid_to || ""} onChange={e => setFormData(p => ({ ...p, valid_to: e.target.value || null }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Redemptions</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" min="0" step="1" value={formData.usage_limit || ""} onChange={e => setFormData(p => ({ ...p, usage_limit: e.target.value ? parseInt(e.target.value) : null }))}
                          className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]" placeholder="Leave empty = unlimited" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Rental Days</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" min="0" step="1" value={formData.constraints?.min_days || ""} onChange={e => setFormData(p => ({ ...p, constraints: { ...p.constraints, min_days: e.target.value ? parseInt(e.target.value) : undefined } }))}
                          className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]" placeholder="No minimum" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Branch Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Branch Availability</h3>
                      <p className="text-xs text-gray-500">Leave all unchecked to allow all branches</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <button type="button" onClick={() => setFormData(p => ({ ...p, constraints: { ...p.constraints, branch_ids: branches.map(b => b._id) } }))}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-[#1EA2E4] rounded-lg hover:bg-blue-100">Select All</button>
                    <button type="button" onClick={() => setFormData(p => ({ ...p, constraints: { ...p.constraints, branch_ids: [] } }))}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Clear All</button>
                    <span className="text-xs text-gray-400">
                      {(formData.constraints?.branch_ids?.length ?? 0) > 0
                        ? `${formData.constraints?.branch_ids?.length} selected`
                        : "All branches"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {branches.map(branch => {
                      const selected = formData.constraints?.branch_ids?.includes(branch._id);
                      return (
                        <button key={branch._id} type="button" onClick={() => toggleBranch(branch._id)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${selected ? "border-[#1EA2E4] bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}`}>
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? "bg-[#1EA2E4]" : "bg-gray-100"}`}>
                            <Building2 className={`w-4 h-4 ${selected ? "text-white" : "text-gray-500"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${selected ? "text-[#1EA2E4]" : "text-gray-800"}`}>{branch.name}</p>
                            <p className="text-xs text-gray-500 truncate">{(branch as any).city || branch.code}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? "bg-[#1EA2E4] border-[#1EA2E4]" : "border-gray-300"}`}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vehicle Classes */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Vehicle Classes</h3>
                      <p className="text-xs text-gray-500">Leave empty to allow all classes</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vehicleClasses.map(cls => {
                      const sel = formData.constraints?.allowed_classes?.includes(cls);
                      return (
                        <button key={cls} type="button" onClick={() => toggleClass(cls)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-sm font-medium transition-all ${sel ? "border-violet-500 bg-violet-500 text-white shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:border-violet-300"}`}>
                          <Car className="w-3.5 h-3.5" />
                          {cls.charAt(0).toUpperCase() + cls.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold">5</div>
                    <h3 className="font-semibold text-gray-800">Status</h3>
                  </div>
                  <button type="button" onClick={() => setFormData(p => ({ ...p, active: !p.active }))}
                    className={`flex items-center gap-4 w-full p-4 rounded-xl border-2 transition-all ${formData.active ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.active ? "bg-emerald-500" : "bg-gray-300"}`}>
                      <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: formData.active ? "26px" : "2px" }} />
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold text-sm ${formData.active ? "text-emerald-700" : "text-gray-600"}`}>{formData.active ? "Active" : "Inactive"}</p>
                      <p className="text-xs text-gray-500">{formData.active ? "Code is live and redeemable" : "Code is hidden and cannot be used"}</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 bg-gray-50 px-8 py-4 flex justify-between items-center">
                <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={!formData.code || formData.value <= 0 || saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#1EA2E4] to-[#0d7fc4] text-white rounded-xl font-semibold shadow-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" />{isEditMode ? "Update Code" : "Create Code"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete Promo Code</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* SNACKBAR */}
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

export default PromoCodesPage;
