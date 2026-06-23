// src/pages/admin/reservations/AdminReservationsPage.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import {
  fetchAllReservations,
  createReservation,
  updateReservationStatus,
  deleteReservation,
  parseDecimalValue,
  type IReservation,
  type ReservationStatus,
  type CreateReservationPayload,
  type IBranchRef,
  type IVehicleRef,
} from "../../../Services/adminAndManager/reservations_service";
import {
  fetchBranches,
  type IBranch,
} from "../../../Services/adminAndManager/admin_branch_service";
import {
  fetchVehicleUnits,
  type IVehicleUnit,
  type IVehicleModelSummary,
  type IBranchSummary,
} from "../../../Services/adminAndManager/vehicle_units_services";
import {
  fetchAllUsers,
  type IUser,
} from "../../../Services/adminAndManager/admi_users_service";
import {
  Search, Plus, X, AlertCircle, CheckCircle, RefreshCw,
  ChevronRight, Eye, Trash2, ArrowRight, Menu, Car, User,
  Calendar, Building2, Loader2, UserCheck, Users, UserPlus,
  Hash, MapPin, Clock, CreditCard, Banknote, Tag,
} from "lucide-react";

// ===== Status config =====
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:     { label: "Pending",     bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-400" },
  confirmed:   { label: "Confirmed",   bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500" },
  checked_out: { label: "Checked Out", bg: "bg-indigo-100",  text: "text-indigo-700",  dot: "bg-indigo-500" },
  checked_in:  { label: "Checked In",  bg: "bg-cyan-100",    text: "text-cyan-700",    dot: "bg-cyan-500" },
  returned:    { label: "Checked In",  bg: "bg-cyan-100",    text: "text-cyan-700",    dot: "bg-cyan-500" },
  closed:      { label: "Completed",   bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  completed:   { label: "Completed",   bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  cancelled:   { label: "Cancelled",   bg: "bg-red-100",     text: "text-red-600",     dot: "bg-red-400" },
  no_show:     { label: "No Show",     bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400" },
};

const PAY_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  unpaid:         { label: "Unpaid",    bg: "bg-red-50",     text: "text-red-600" },
  partially_paid: { label: "Partial",   bg: "bg-amber-50",   text: "text-amber-600" },
  paid:           { label: "Paid",      bg: "bg-emerald-50", text: "text-emerald-600" },
  refunded:       { label: "Refunded",  bg: "bg-purple-50",  text: "text-purple-600" },
  cancelled:      { label: "Cancelled", bg: "bg-gray-50",    text: "text-gray-500" },
};

const STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending:     ["confirmed", "cancelled", "no_show"],
  confirmed:   ["checked_out", "cancelled", "no_show"],
  checked_out: ["checked_in"],
  checked_in:  ["closed"],
  returned:    ["closed"],
  closed:      [],
  completed:   [],
  cancelled:   [],
  no_show:     [],
};

// ===== Helpers =====
function formatDate(s: string): string {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}
function formatDateTime(s: string): string {
  if (!s) return "—";
  try { return new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}
function getBranchName(b: string | IBranchRef | null): string {
  if (!b) return "—";
  return typeof b === "object" ? (b as IBranchRef).name || "—" : b;
}
function getVehicleLabel(r: IReservation): string {
  const vm = r.vehicle_model_id;
  if (!vm) return "Unknown";
  if (typeof vm === "object") return `${(vm as any).make || ""} ${(vm as any).model || ""}`.trim() || "Unknown";
  return "Unknown";
}
function getCustomerName(r: IReservation): string {
  return r.driver_snapshot?.full_name || "Unknown";
}
function getCreatedByName(r: IReservation): string {
  const cb = r.created_by;
  if (!cb) return "";
  if (typeof cb === "object") return (cb as any).full_name || (cb as any).email || "";
  return "";
}
function isWalkInReservation(r: IReservation): boolean {
  return !r.user_id;
}
function getVehicleBranchId(u: IVehicleUnit): string {
  if (!u.branch_id) return "";
  return typeof u.branch_id === "object" ? (u.branch_id as IBranchSummary)._id || "" : u.branch_id as string;
}
function getVehicleModelLabel(u: IVehicleUnit): string {
  if (!u.vehicle_model_id) return u.plate_number;
  if (typeof u.vehicle_model_id === "object") {
    const m = u.vehicle_model_id as IVehicleModelSummary;
    return `${m.make || ""} ${m.model || ""} (${m.year || ""})`.trim();
  }
  return u.plate_number;
}

// ===== Main Component =====
export default function AdminReservationsPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [reservations, setReservations] = useState<IReservation[]>([]);
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [vehicleUnits, setVehicleUnits] = useState<IVehicleUnit[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);

  // Loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterPayStatus, setFilterPayStatus] = useState("");

  // Status change modal
  const [statusModalRes, setStatusModalRes] = useState<IReservation | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<IReservation | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: "success" | "error" }>({ open: false, message: "", type: "success" });
  function showSnack(message: string, type: "success" | "error") { setSnackbar({ open: true, message, type }); }

  // Create panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [panelSubmitting, setPanelSubmitting] = useState(false);

  // Walk-in / user selection
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const userDropRef = useRef<HTMLDivElement>(null);

  // Step 1 — driver snapshot
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [licNumber, setLicNumber] = useState("");
  const [licClass, setLicClass] = useState("");
  const [licCountry, setLicCountry] = useState("ZW");
  const [licExpiry, setLicExpiry] = useState("");

  // Step 2 — vehicle
  const [pickupBranchId, setPickupBranchId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  // Step 3 — dates
  const [dropoffBranchId, setDropoffBranchId] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [dropoffAt, setDropoffAt] = useState("");
  const [notes, setNotes] = useState("");

  // ── Load data ──────────────────────────────────────────────────────────
  const loadReservations = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchAllReservations();
      setReservations(res.data || []);
    } catch (e: any) { setError(e?.message || "Failed to load reservations"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadReservations();
    fetchBranches().then(r => setBranches(r.data || [])).catch(() => {});
    fetchVehicleUnits(1, 200).then(r => setVehicleUnits(r.data?.items || [])).catch(() => {});
  }, [loadReservations]);

  useEffect(() => {
    if (snackbar.open) {
      const t = setTimeout(() => setSnackbar(s => ({ ...s, open: false })), 3500);
      return () => clearTimeout(t);
    }
  }, [snackbar.open]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userDropRef.current && !userDropRef.current.contains(e.target as Node)) setUserDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────
  const total     = reservations.length;
  const pending   = reservations.filter(r => r.status === "pending").length;
  const active    = reservations.filter(r => ["confirmed", "checked_out", "checked_in", "returned"].includes(r.status)).length;
  const completed = reservations.filter(r => ["closed", "completed"].includes(r.status)).length;

  // ── Filters ────────────────────────────────────────────────────────────
  const filtered = reservations.filter(r => {
    const q = search.toLowerCase();
    const plate = typeof r.vehicle_id === "object" && r.vehicle_id ? (r.vehicle_id as IVehicleRef).plate_number || "" : "";
    const ms = !q || r.code?.toLowerCase().includes(q) || getCustomerName(r).toLowerCase().includes(q) || plate.toLowerCase().includes(q);
    const mSt = !filterStatus || r.status === filterStatus ||
      (filterStatus === "closed"     && r.status === "completed") ||
      (filterStatus === "checked_in" && r.status === "returned");
    const mBr = !filterBranch || getBranchName(r.pickup?.branch_id).includes(filterBranch) ||
      (r.pickup?.branch_id != null && typeof r.pickup.branch_id === "object" && (r.pickup.branch_id as IBranchRef)._id === filterBranch);
    const mPay = !filterPayStatus || r.payment_summary?.status === filterPayStatus;
    return ms && mSt && mBr && mPay;
  });

  // ── Status change ──────────────────────────────────────────────────────
  async function handleStatusChange(newStatus: ReservationStatus) {
    if (!statusModalRes) return;
    setStatusChanging(true);
    try {
      const updated = await updateReservationStatus(statusModalRes._id, newStatus);
      setReservations(prev => prev.map(r => r._id === updated._id ? { ...r, status: updated.status } : r));
      showSnack(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`, "success");
      setStatusModalRes(null);
    } catch (e: any) { showSnack(e?.message || "Failed to update status", "error"); }
    finally { setStatusChanging(false); }
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteReservation(deleteTarget._id);
      setReservations(prev => prev.filter(r => r._id !== deleteTarget._id));
      showSnack("Reservation deleted", "success");
      setDeleteTarget(null);
    } catch (e: any) { showSnack(e?.message || "Failed to delete", "error"); }
    finally { setDeleting(false); }
  }

  // ── Panel helpers ──────────────────────────────────────────────────────
  function resetPanel() {
    setStep(1);
    setIsWalkIn(true);
    setUserSearch(""); setSelectedUserId(""); setUserDropOpen(false);
    setCustName(""); setCustPhone(""); setCustEmail("");
    setLicNumber(""); setLicClass(""); setLicCountry("ZW"); setLicExpiry("");
    setPickupBranchId(""); setSelectedVehicleId("");
    setDropoffBranchId(""); setPickupAt(""); setDropoffAt(""); setNotes("");
    setPanelSubmitting(false);
  }

  async function openPanel() {
    resetPanel();
    setPanelOpen(true);
    // Load users for non-walk-in selection
    if (users.length === 0) {
      setUsersLoading(true);
      try { const r = await fetchAllUsers(1, 300); setUsers(r.data?.users || []); }
      catch { /* silent */ }
      finally { setUsersLoading(false); }
    }
  }

  function selectUser(u: IUser) {
    setSelectedUserId(u._id);
    setCustName(u.full_name || "");
    setCustPhone(u.phone || "");
    setCustEmail(u.email || "");
    setUserSearch(u.full_name || u.email || "");
    setUserDropOpen(false);
  }

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q);
  }).slice(0, 20);

  const vehiclesForBranch = vehicleUnits.filter(v => pickupBranchId && getVehicleBranchId(v) === pickupBranchId);
  const selectedVehicle   = vehicleUnits.find(v => v._id === selectedVehicleId) || null;

  function step1Valid() {
    if (!isWalkIn && !selectedUserId) return false;
    return !!(custName.trim() && custPhone.trim() && custEmail.trim());
  }
  function step2Valid() { return !!(pickupBranchId && selectedVehicleId); }
  function step3Valid() { return !!(dropoffBranchId && pickupAt && dropoffAt); }

  async function handleCreateReservation() {
    if (!selectedVehicle) return;
    setPanelSubmitting(true);
    try {
      let vmId = "";
      const vm = selectedVehicle.vehicle_model_id;
      if (vm) vmId = typeof vm === "object" ? (vm as IVehicleModelSummary)._id : vm as string;

      const payload: CreateReservationPayload = {
        vehicle_id: selectedVehicle._id,
        vehicle_model_id: vmId,
        pickup:  { branch_id: pickupBranchId,  at: new Date(pickupAt).toISOString() },
        dropoff: { branch_id: dropoffBranchId, at: new Date(dropoffAt).toISOString() },
        user_id: isWalkIn ? null : (selectedUserId || null),
        created_channel: "web",
        driver_snapshot: {
          full_name: custName, phone: custPhone, email: custEmail,
          driver_license: {
            number:     licNumber  || "N/A",
            country:    licCountry || "ZW",
            class:      licClass   || "4",
            expires_at: licExpiry ? new Date(licExpiry).toISOString() : new Date(Date.now() + 365 * 86400000).toISOString(),
            verified:   false,
          },
        },
        notes: notes || undefined,
      };

      const created = await createReservation(payload);
      setReservations(prev => [created, ...prev]);
      showSnack(`Reservation ${created.code} created successfully`, "success");
      setPanelOpen(false);
      resetPanel();
    } catch (e: any) { showSnack(e?.message || "Failed to create reservation", "error"); }
    finally { setPanelSubmitting(false); }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all bg-white text-gray-800";
  const sel = inp + " appearance-none";

  return (
    <div className="flex h-screen bg-[#F0F6FF] overflow-hidden font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top bar ── */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <button className="lg:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#0A1628]">Reservations</h1>
            <p className="text-xs text-gray-400 mt-0.5">{reservations.length} total reservations</p>
          </div>
          <button onClick={loadReservations} className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-[#00AEEF] border border-gray-100 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => navigate("/staff/create-reservation")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl hover:opacity-90 font-medium text-sm shadow-sm transition-all">
            <Plus className="w-4 h-4" /> New Reservation
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ── Stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total", value: total,     color: "text-[#0A1628]",    bg: "bg-white",       border: "border-gray-200" },
              { label: "Pending",   value: pending,   color: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-200" },
              { label: "Active",    value: active,    color: "text-blue-600",    bg: "bg-blue-50",     border: "border-blue-200" },
              { label: "Completed", value: completed, color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-200" },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 shadow-sm`}>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Filters ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search code, customer, plate…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all" />
              </div>
              {[
                { value: filterStatus,    onChange: setFilterStatus,    options: (["pending","confirmed","checked_out","checked_in","closed","cancelled","no_show"] as const).map(k => ({ k, label: STATUS_CONFIG[k].label })), placeholder: "All Statuses" },
                { value: filterBranch,    onChange: setFilterBranch,    options: branches.map(b => ({ k: b._id, label: b.name })),                          placeholder: "All Branches" },
                { value: filterPayStatus, onChange: setFilterPayStatus, options: Object.entries(PAY_STATUS_CONFIG).map(([k,v]) => ({ k, label: v.label })), placeholder: "All Pay Status" },
              ].map((f, i) => (
                <div key={i} className="relative">
                  <select value={f.value} onChange={e => f.onChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] text-gray-700">
                    <option value="">{f.placeholder}</option>
                    {f.options.map(o => <option key={o.k} value={o.k}>{o.label}</option>)}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none rotate-90" />
                </div>
              ))}
            </div>
            {(search || filterStatus || filterBranch || filterPayStatus) && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
                <button onClick={() => { setSearch(""); setFilterStatus(""); setFilterBranch(""); setFilterPayStatus(""); }}
                  className="text-xs text-[#00AEEF] hover:underline">Clear filters</button>
              </div>
            )}
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 text-[#00AEEF] animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
              <button onClick={loadReservations} className="ml-auto text-sm text-red-600 underline">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
              <Calendar className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-semibold text-lg">No reservations found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
              <button onClick={openPanel} className="mt-6 px-5 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl text-sm font-medium">
                Create First Reservation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(r => (
                <ReservationCard key={r._id} reservation={r}
                  onView={() => navigate(`/admin/reservation/${r._id}`)}
                  onChangeStatus={() => setStatusModalRes(r)}
                  onDelete={() => setDeleteTarget(r)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STATUS CHANGE MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {statusModalRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setStatusModalRes(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <button onClick={() => setStatusModalRes(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <h3 className="text-lg font-bold text-[#0A1628] mb-1">Change Status</h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-mono font-medium text-gray-700">{statusModalRes.code}</span>
              {" · "}
              <StatusBadge status={statusModalRes.status} />
            </p>
            {(STATUS_TRANSITIONS[statusModalRes.status as ReservationStatus] || []).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No status transitions available.</p>
            ) : (
              <div className="space-y-2">
                {(STATUS_TRANSITIONS[statusModalRes.status as ReservationStatus] || []).map(s => {
                  const cfg = STATUS_CONFIG[s] || { label: s, bg: "bg-gray-100", text: "text-gray-700" };
                  return (
                    <button key={s} disabled={statusChanging} onClick={() => handleStatusChange(s)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-transparent hover:border-[#00AEEF] transition-all ${cfg.bg} ${statusChanging ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <span className={`font-semibold text-sm ${cfg.text}`}>{cfg.label}</span>
                      {statusChanging ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <ArrowRight className={`w-4 h-4 ${cfg.text}`} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DELETE DIALOG
      ══════════════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Reservation</h3>
                <p className="text-sm text-gray-400">This cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to delete <strong className="font-mono">{deleteTarget.code}</strong>?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CREATE RESERVATION — LARGE CENTERED MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A1628]/70 backdrop-blur-sm" onClick={() => { setPanelOpen(false); resetPanel(); }} />
          <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "95vh" }}>

            {/* Modal header */}
            <div className="bg-gradient-to-r from-[#0A1628] to-[#1A3A5C] px-8 py-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">New Reservation</h2>
                  <p className="text-white/50 text-sm mt-0.5">Step {step} of 4 — {["Customer Info", "Vehicle Selection", "Dates & Locations", "Review & Confirm"][step - 1]}</p>
                </div>
                <button onClick={() => { setPanelOpen(false); resetPanel(); }} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mt-5">
                {["Customer", "Vehicle", "Dates", "Review"].map((label, i) => {
                  const idx = i + 1;
                  const active = step === idx;
                  const done   = step > idx;
                  return (
                    <React.Fragment key={label}>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${active ? "bg-[#00AEEF] text-white scale-110" : done ? "bg-emerald-400 text-white" : "bg-white/20 text-white/50"}`}>
                          {done ? <CheckCircle className="w-4 h-4" /> : idx}
                        </div>
                        <span className={`text-sm font-medium ${active ? "text-white" : done ? "text-emerald-300" : "text-white/40"}`}>{label}</span>
                      </div>
                      {i < 3 && <div className={`flex-1 h-0.5 rounded-full transition-all ${done ? "bg-emerald-400" : "bg-white/15"}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Modal body — two-column layout */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left: form */}
              <div className="flex-1 overflow-y-auto p-8">

                {/* ── STEP 1: Customer Info ── */}
                {step === 1 && (
                  <div className="space-y-6">
                    {/* Walk-in toggle */}
                    <div className="flex items-center gap-4 p-4 bg-[#F0F6FF] rounded-2xl border border-[#00AEEF]/20">
                      <div className="flex-1">
                        <p className="font-semibold text-[#0A1628] text-sm">Reservation Type</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {isWalkIn ? "Walk-in: customer has no app account — fill details manually" : "Linked account: select a registered user from the system"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setIsWalkIn(true); setSelectedUserId(""); setUserSearch(""); }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isWalkIn ? "bg-[#00AEEF] text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200"}`}>
                          <UserPlus className="w-4 h-4" /> Walk-in
                        </button>
                        <button onClick={() => setIsWalkIn(false)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${!isWalkIn ? "bg-[#0A1628] text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200"}`}>
                          <Users className="w-4 h-4" /> Registered User
                        </button>
                      </div>
                    </div>

                    {/* User search (non-walk-in) */}
                    {!isWalkIn && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-5 rounded-full bg-[#00AEEF]" />
                          <h3 className="font-bold text-[#0A1628] text-sm uppercase tracking-wider">Select Customer Account</h3>
                        </div>
                        <div ref={userDropRef} className="relative">
                          <div className={`flex items-center border rounded-xl px-3.5 py-2.5 gap-2 transition-all ${selectedUserId ? "border-[#00AEEF] bg-[#00AEEF]/5" : "border-gray-200 bg-white"}`}>
                            {usersLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" /> : <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                            <input value={userSearch} placeholder="Search by name, email, or phone…"
                              onChange={e => { setUserSearch(e.target.value); setUserDropOpen(true); if (!e.target.value) { setSelectedUserId(""); setCustName(""); setCustPhone(""); setCustEmail(""); } }}
                              onFocus={() => setUserDropOpen(true)}
                              className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-400" />
                            {selectedUserId && <UserCheck className="w-4 h-4 text-[#00AEEF] flex-shrink-0" />}
                          </div>
                          {userDropOpen && filteredUsers.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                              {filteredUsers.map(u => (
                                <button key={u._id} onClick={() => selectUser(u)}
                                  className="w-full text-left px-4 py-3 hover:bg-[#00AEEF]/5 transition-colors border-b border-gray-50 last:border-0">
                                  <p className="text-sm font-semibold text-[#0A1628]">{u.full_name}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{u.email} {u.phone ? `· ${u.phone}` : ""}</p>
                                </button>
                              ))}
                            </div>
                          )}
                          {userDropOpen && !usersLoading && userSearch && filteredUsers.length === 0 && (
                            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center">
                              <p className="text-sm text-gray-400">No users found. Try a walk-in reservation instead.</p>
                            </div>
                          )}
                        </div>
                        {selectedUserId && (
                          <p className="text-xs text-[#00AEEF] mt-1.5 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> User linked — fields auto-filled below. You can still edit them.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Driver snapshot */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 rounded-full bg-[#00AEEF]" />
                        <h3 className="font-bold text-[#0A1628] text-sm uppercase tracking-wider">Driver Details</h3>
                        <span className="text-xs text-gray-400">(stored on reservation)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <FLabel label="Full Name *">
                          <input value={custName} onChange={e => setCustName(e.target.value)} placeholder="e.g. Tendai Moyo" className={inp} />
                        </FLabel>
                        <FLabel label="Phone *">
                          <input value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="+263 77 123 4567" type="tel" className={inp} />
                        </FLabel>
                        <FLabel label="Email *">
                          <input value={custEmail} onChange={e => setCustEmail(e.target.value)} placeholder="tendai@email.com" type="email" className={inp} />
                        </FLabel>
                      </div>
                    </div>

                    {/* License */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 rounded-full bg-[#00AEEF]" />
                        <h3 className="font-bold text-[#0A1628] text-sm uppercase tracking-wider">Driver's Licence</h3>
                        <span className="text-xs text-gray-400">(optional but recommended)</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FLabel label="Licence Number">
                          <input value={licNumber} onChange={e => setLicNumber(e.target.value)} placeholder="ZW123456" className={inp} />
                        </FLabel>
                        <FLabel label="Class">
                          <input value={licClass} onChange={e => setLicClass(e.target.value)} placeholder="e.g. 4" className={inp} />
                        </FLabel>
                        <FLabel label="Country">
                          <input value={licCountry} onChange={e => setLicCountry(e.target.value)} placeholder="ZW" className={inp} />
                        </FLabel>
                        <FLabel label="Expiry Date">
                          <input type="date" value={licExpiry} onChange={e => setLicExpiry(e.target.value)} className={inp} />
                        </FLabel>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Vehicle ── */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 rounded-full bg-[#00AEEF]" />
                        <h3 className="font-bold text-[#0A1628] text-sm uppercase tracking-wider">Pickup Branch</h3>
                      </div>
                      <div className="relative">
                        <select value={pickupBranchId} onChange={e => { setPickupBranchId(e.target.value); setSelectedVehicleId(""); }} className={sel}>
                          <option value="">Select pickup branch…</option>
                          {branches.map(b => <option key={b._id} value={b._id}>{b.name} — {b.address?.city}</option>)}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none rotate-90" />
                      </div>
                    </div>

                    {pickupBranchId && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-5 rounded-full bg-[#00AEEF]" />
                            <h3 className="font-bold text-[#0A1628] text-sm uppercase tracking-wider">Available Vehicles</h3>
                          </div>
                          <span className="text-xs text-gray-400">{vehiclesForBranch.length} vehicle{vehiclesForBranch.length !== 1 ? "s" : ""}</span>
                        </div>
                        {vehiclesForBranch.length === 0 ? (
                          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
                            <Car className="w-10 h-10 mx-auto mb-2 opacity-40" />
                            <p className="font-medium text-sm">No vehicles at this branch</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {vehiclesForBranch.map(v => {
                              const sel2 = selectedVehicleId === v._id;
                              return (
                                <button key={v._id} onClick={() => setSelectedVehicleId(v._id)}
                                  className={`text-left p-4 rounded-2xl border-2 transition-all ${sel2 ? "border-[#00AEEF] bg-[#00AEEF]/5 shadow-sm" : "border-gray-200 hover:border-[#00AEEF]/40 hover:bg-gray-50"}`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="font-bold text-sm text-[#0A1628] font-mono">{v.plate_number}</p>
                                      <p className="text-xs text-gray-500 mt-0.5">{getVehicleModelLabel(v)}</p>
                                    </div>
                                    {sel2 && <CheckCircle className="w-4 h-4 text-[#00AEEF] flex-shrink-0" />}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {v.color && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{v.color}</span>}
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.availability_state === "available" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                      {v.availability_state}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 3: Dates ── */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 rounded-full bg-[#00AEEF]" />
                        <h3 className="font-bold text-[#0A1628] text-sm uppercase tracking-wider">Pickup Details</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FLabel label="Pickup Branch *">
                          <div className="relative">
                            <select value={pickupBranchId} onChange={e => setPickupBranchId(e.target.value)} className={sel}>
                              <option value="">Select…</option>
                              {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none rotate-90" />
                          </div>
                        </FLabel>
                        <FLabel label="Pickup Date & Time *">
                          <input type="datetime-local" value={pickupAt} onChange={e => setPickupAt(e.target.value)} className={inp} />
                        </FLabel>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-5 rounded-full bg-indigo-400" />
                        <h3 className="font-bold text-[#0A1628] text-sm uppercase tracking-wider">Dropoff Details</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FLabel label="Dropoff Branch *">
                          <div className="relative">
                            <select value={dropoffBranchId} onChange={e => setDropoffBranchId(e.target.value)} className={sel}>
                              <option value="">Select…</option>
                              {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none rotate-90" />
                          </div>
                        </FLabel>
                        <FLabel label="Dropoff Date & Time *">
                          <input type="datetime-local" value={dropoffAt} onChange={e => setDropoffAt(e.target.value)} className={inp} />
                        </FLabel>
                      </div>
                    </div>

                    {pickupAt && dropoffAt && new Date(dropoffAt) > new Date(pickupAt) && (
                      <div className="bg-[#00AEEF]/5 border border-[#00AEEF]/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-[#00AEEF]">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        Duration: <strong>{Math.ceil((new Date(dropoffAt).getTime() - new Date(pickupAt).getTime()) / 86400000)} day{Math.ceil((new Date(dropoffAt).getTime() - new Date(pickupAt).getTime()) / 86400000) !== 1 ? "s" : ""}</strong>
                      </div>
                    )}

                    <FLabel label="Notes (optional)">
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                        placeholder="Any special instructions or notes…"
                        className={inp + " resize-none"} />
                    </FLabel>
                  </div>
                )}

                {/* ── STEP 4: Review ── */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-5 rounded-full bg-emerald-400" />
                      <h3 className="font-bold text-[#0A1628] text-sm uppercase tracking-wider">Review & Confirm</h3>
                    </div>

                    {/* Type badge */}
                    <div className="flex items-center gap-2">
                      {isWalkIn
                        ? <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">Walk-in Customer</span>
                        : <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Registered User Account</span>}
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Web · Admin Created</span>
                    </div>

                    <ReviewSection title="Customer / Driver" icon={<User className="w-4 h-4" />}>
                      <RR label="Name" v={custName} />
                      <RR label="Phone" v={custPhone} />
                      <RR label="Email" v={custEmail} />
                      {licNumber && <RR label="Licence #" v={`${licNumber} (${licClass || "—"}) · ${licCountry}`} />}
                      {licExpiry && <RR label="Expiry" v={formatDate(licExpiry)} />}
                    </ReviewSection>

                    {selectedVehicle && (
                      <ReviewSection title="Vehicle" icon={<Car className="w-4 h-4" />}>
                        <RR label="Plate" v={selectedVehicle.plate_number} />
                        <RR label="Model" v={getVehicleModelLabel(selectedVehicle)} />
                        {selectedVehicle.color && <RR label="Color" v={selectedVehicle.color} />}
                      </ReviewSection>
                    )}

                    <ReviewSection title="Booking Details" icon={<Calendar className="w-4 h-4" />}>
                      <RR label="Pickup Branch" v={branches.find(b => b._id === pickupBranchId)?.name || "—"} />
                      <RR label="Pickup Time" v={formatDateTime(pickupAt)} />
                      <RR label="Dropoff Branch" v={branches.find(b => b._id === dropoffBranchId)?.name || "—"} />
                      <RR label="Dropoff Time" v={formatDateTime(dropoffAt)} />
                      {pickupAt && dropoffAt && <RR label="Duration" v={`${Math.ceil((new Date(dropoffAt).getTime() - new Date(pickupAt).getTime()) / 86400000)} days`} />}
                      {notes && <RR label="Notes" v={notes} />}
                    </ReviewSection>
                  </div>
                )}
              </div>

              {/* Right: sidebar summary (steps 2-4) */}
              {step > 1 && (
                <div className="w-72 flex-shrink-0 bg-gray-50 border-l border-gray-100 p-6 space-y-5 overflow-y-auto">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Summary</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4 text-[#00AEEF] flex-shrink-0" />
                      <span className="truncate font-medium">{custName || "—"}</span>
                    </div>
                    {custPhone && <p className="text-xs text-gray-400 pl-6">{custPhone}</p>}
                    {isWalkIn
                      ? <span className="ml-6 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Walk-in</span>
                      : <span className="ml-6 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Registered User</span>}
                  </div>

                  {selectedVehicle && (
                    <div className="space-y-1 text-sm pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Car className="w-4 h-4 text-[#00AEEF] flex-shrink-0" />
                        <span className="font-medium font-mono">{selectedVehicle.plate_number}</span>
                      </div>
                      <p className="text-xs text-gray-400 pl-6">{getVehicleModelLabel(selectedVehicle)}</p>
                    </div>
                  )}

                  {pickupBranchId && (
                    <div className="space-y-2 text-xs pt-3 border-t border-gray-200">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-400">Pickup</p>
                          <p className="font-medium text-gray-700">{branches.find(b => b._id === pickupBranchId)?.name}</p>
                          {pickupAt && <p className="text-gray-400 mt-0.5">{formatDateTime(pickupAt)}</p>}
                        </div>
                      </div>
                      {dropoffBranchId && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-gray-400">Dropoff</p>
                            <p className="font-medium text-gray-700">{branches.find(b => b._id === dropoffBranchId)?.name}</p>
                            {dropoffAt && <p className="text-gray-400 mt-0.5">{formatDateTime(dropoffAt)}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {pickupAt && dropoffAt && new Date(dropoffAt) > new Date(pickupAt) && (
                    <div className="bg-[#00AEEF]/10 rounded-xl p-3 text-center border border-[#00AEEF]/20">
                      <p className="text-xs text-gray-400">Duration</p>
                      <p className="text-2xl font-bold text-[#00AEEF]">{Math.ceil((new Date(dropoffAt).getTime() - new Date(pickupAt).getTime()) / 86400000)}</p>
                      <p className="text-xs text-gray-400">days</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="border-t border-gray-100 px-8 py-4 bg-gray-50 flex items-center justify-between gap-4 flex-shrink-0">
              <button onClick={() => step > 1 ? setStep(step - 1) : (setPanelOpen(false), resetPanel())}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                {step === 1 ? "Cancel" : "← Back"}
              </button>
              <div className="flex items-center gap-3">
                {step < 4 && (
                  <button onClick={() => setStep(step + 1)}
                    disabled={(step === 1 && !step1Valid()) || (step === 2 && !step2Valid()) || (step === 3 && !step3Valid())}
                    className="px-7 py-2.5 bg-[#00AEEF] text-white rounded-xl text-sm font-medium hover:bg-[#0099D6] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    Next Step →
                  </button>
                )}
                {step === 4 && (
                  <button onClick={handleCreateReservation} disabled={panelSubmitting}
                    className="px-7 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2 hover:opacity-90 transition-all shadow-sm">
                    {panelSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {panelSubmitting ? "Creating…" : "Confirm & Create"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Snackbar ── */}
      {snackbar.open && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium transition-all ${snackbar.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {snackbar.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {snackbar.message}
          <button onClick={() => setSnackbar(s => ({ ...s, open: false }))} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function PayBadge({ status }: { status: string }) {
  const cfg = PAY_STATUS_CONFIG[status] || { label: status, bg: "bg-gray-50", text: "text-gray-500" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
}

function ReservationCard({ reservation: r, onView, onChangeStatus, onDelete }: {
  reservation: IReservation; onView: () => void; onChangeStatus: () => void; onDelete: () => void;
}) {
  const vehicleLabel  = getVehicleLabel(r);
  const customerName  = getCustomerName(r);
  const pickupBranch  = getBranchName(r.pickup?.branch_id);
  const dropoffBranch = getBranchName(r.dropoff?.branch_id);
  const canChange     = (STATUS_TRANSITIONS[r.status as ReservationStatus] || []).length > 0;
  const grandTotal    = r.pricing?.grand_total ? parseDecimalValue(r.pricing.grand_total) : null;
  const walkIn        = isWalkInReservation(r);
  const createdBy     = getCreatedByName(r);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-[#0A1628] to-[#00AEEF]" />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-[#0A1628] text-sm font-mono">{r.code}</p>
              {walkIn && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wide">Walk-in</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(r.created_at)}</p>
            {createdBy && <p className="text-[10px] text-gray-300 mt-0.5">By: {createdBy}</p>}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <StatusBadge status={r.status} />
            <PayBadge status={r.payment_summary?.status || "unpaid"} />
          </div>
        </div>

        {/* Customer */}
        <div className="flex items-center gap-2 text-sm">
          <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 font-medium truncate">{customerName}</span>
        </div>

        {/* Vehicle */}
        <div className="flex items-center gap-2 text-sm">
          <Car className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600 truncate">{vehicleLabel}</span>
          {typeof r.vehicle_id === "object" && r.vehicle_id && (r.vehicle_id as IVehicleRef).plate_number && (
            <span className="text-xs text-gray-400 font-mono flex-shrink-0">· {(r.vehicle_id as IVehicleRef).plate_number}</span>
          )}
        </div>

        {/* Pickup / Dropoff */}
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
            <span className="text-gray-400">Pickup:</span>
            <span className="truncate font-medium">{pickupBranch}</span>
            <span className="text-gray-300 flex-shrink-0">{formatDate(r.pickup?.at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
            <span className="text-gray-400">Dropoff:</span>
            <span className="truncate font-medium">{dropoffBranch}</span>
            <span className="text-gray-300 flex-shrink-0">{formatDate(r.dropoff?.at)}</span>
          </div>
        </div>

        {/* Total */}
        {grandTotal !== null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 text-xs">Grand Total</span>
            <span className="font-bold text-[#0A1628]">{r.pricing?.currency || "USD"} {grandTotal.toFixed(2)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
          <button onClick={onView}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#00AEEF] border border-[#00AEEF] rounded-xl hover:bg-[#00AEEF]/5 transition-colors">
            <Eye className="w-3.5 h-3.5" /> View
          </button>
          {canChange && (
            <button onClick={onChangeStatus}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#1A5FA8] border border-[#1A5FA8] rounded-xl hover:bg-[#1A5FA8]/5 transition-colors">
              <ArrowRight className="w-3.5 h-3.5" /> Status
            </button>
          )}
          <button onClick={onDelete}
            className="p-2 text-red-400 border border-red-200 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ReviewSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-[#00AEEF]">{icon}</span>
        <span className="font-bold text-sm text-[#0A1628]">{title}</span>
      </div>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  );
}

function RR({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
      <span className="text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-medium text-right">{v || "—"}</span>
    </div>
  );
}
