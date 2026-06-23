import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, Edit2, Trash2, X, AlertCircle, CheckCircle,
  MoreVertical, User, Shield, Building2, Calendar, Mail,
  Phone, Hash, Activity, CreditCard, Car, Clock,
  ChevronDown, ChevronUp, Save, Loader2, RefreshCw,
  UserCheck, BarChart3, TrendingUp, Banknote, Star,
  LogIn, FileEdit, UserPlus, Eye, MapPin, Headphones,
  Plus, ChevronRight, Upload, FileImage, CheckSquare, XSquare,
  AlertTriangle, RotateCcw, ZoomIn, ZoomOut, Download,
  ChevronLeft, ExternalLink, ImageOff, Replace,
} from "lucide-react";
import {
  fetchProfilesByUserId,
  createCustomerProfileByStaff,
  createAgentProfileByStaff,
  createManagerProfileByStaff,
  createBranchReceptionistProfileByStaff,
  updateProfileById,
  updateKycStatus,
  deleteProfileById,
  getErrorDisplay,
  type IProfile,
  type KycStatus,
  type UpdateProfilePayload,
  type CreateCustomerProfilePayload,
  type CreateAgentProfilePayload,
  type CreateManagerProfilePayload,
  type CreateBranchReceptionistProfilePayload,
} from "../../../Services/adminAndManager/admin_profiles_service";
import {
  fetchUserStats,
  fetchUserAuditLogs,
  type IUserStats,
  type IAuditLog,
} from "../../../Services/adminAndManager/audit_service";
import { fetchBranches, type IBranch } from "../../../Services/adminAndManager/admin_branch_service";
import { supabase } from "../../../helpers/supa_base_client";
import Sidebar from "../../../components/Sidebar";
import { ZIM_CITIES, ZIM_CITY_TO_PROVINCE } from "../../../utils/constants";

// ── KYC helpers ───────────────────────────────────────────────────────────────
const KYC_META: Record<KycStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  not_submitted: { label: "Not Submitted", color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200", icon: FileImage },
  pending: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
  verified: { label: "Verified", color: "text-green-700", bg: "bg-green-50", border: "border-green-200", icon: CheckCircle },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: XSquare },
};

// ── Supabase document upload ──────────────────────────────────────────────────
async function uploadDocToSupabase(file: File, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("topics")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data: urlData } = supabase.storage.from("topics").getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ── Shimmer ─────────────────────────────────────────────────────────────────
const Shimmer: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 ${className}`}
    style={{ animation: "shimmer 1.6s ease-in-out infinite", backgroundSize: "400% 100%" }} />
);

// ── Constants ────────────────────────────────────────────────────────────────
const ROLE_BADGE: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700 border-rose-200",
  manager: "bg-amber-100 text-amber-700 border-amber-200",
  branch_receptionist: "bg-sky-100 text-sky-700 border-sky-200",
  executive_admin: "bg-purple-100 text-purple-700 border-purple-200",
  agent: "bg-indigo-100 text-indigo-700 border-indigo-200",
  customer: "bg-teal-100 text-teal-700 border-teal-200",
  driver: "bg-blue-100 text-blue-700 border-blue-200",
};

const ROLE_ICON: Record<string, React.ElementType> = {
  admin: Shield, manager: Building2, branch_receptionist: Headphones,
  executive_admin: BarChart3, agent: UserCheck, customer: User, driver: Car,
};

const ACTION_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  login: { icon: LogIn, color: "text-green-600 bg-green-50", label: "Logged in" },
  profile_updated: { icon: FileEdit, color: "text-blue-600 bg-blue-50", label: "Profile updated" },
  profile_created: { icon: UserPlus, color: "text-indigo-600 bg-indigo-50", label: "Profile created" },
  user_created: { icon: UserPlus, color: "text-teal-600 bg-teal-50", label: "Account created" },
  reservation_created: { icon: Car, color: "text-amber-600 bg-amber-50", label: "Reservation created" },
  reservation_cancelled: { icon: X, color: "text-red-600 bg-red-50", label: "Reservation cancelled" },
  reservation_completed: { icon: CheckCircle, color: "text-green-600 bg-green-50", label: "Reservation completed" },
  payment_initiated: { icon: CreditCard, color: "text-purple-600 bg-purple-50", label: "Payment initiated" },
  payment_completed: { icon: Banknote, color: "text-green-600 bg-green-50", label: "Payment completed" },
  driver_booking_created: { icon: Car, color: "text-sky-600 bg-sky-50", label: "Driver booking created" },
};

const PIE_COLORS = ["#00AEEF", "#1A5FA8", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const CREATABLE_ROLES = [
  { id: "customer", label: "Customer", icon: User, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200", desc: "Standard rental customer" },
  { id: "agent", label: "Agent", icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", desc: "Assists customers with bookings", needsBranch: true, singleBranch: true },
  { id: "manager", label: "Branch Manager", icon: Building2, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", desc: "Manages one or more branches", needsBranch: true },
  { id: "branch_receptionist", label: "Receptionist", icon: Headphones, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200", desc: "Branch front-desk operations", needsBranch: true },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (s?: string) => {
  if (!s) return "N/A";
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const timeAgo = (s: string) => {
  const diff = Date.now() - new Date(s).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const formatRoleLabel = (r: string) => r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-[#0A1628] mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.name?.toLowerCase().includes("usd") ? `$${Number(p.value).toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; loading?: boolean;
}> = ({ icon: Icon, label, value, sub, color, loading }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
    {loading ? (
      <div className="space-y-3">
        <Shimmer className="h-9 w-9" />
        <Shimmer className="h-4 w-20" />
        <Shimmer className="h-7 w-16" />
      </div>
    ) : (
      <>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-[#0A1628]">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </>
    )}
  </div>
);

// ── Document Lightbox ────────────────────────────────────────────────────────
interface LightboxDoc { label: string; url: string; field: string; }

const DocLightbox: React.FC<{
  docs: LightboxDoc[];
  activeIndex: number;
  uploading: Record<string, boolean>;
  onClose: () => void;
  onNavigate: (i: number) => void;
  onReplaceFile: (field: string, file: File) => void;
}> = ({ docs, activeIndex, uploading, onClose, onNavigate, onReplaceFile }) => {
  const [zoom, setZoom] = useState(1);
  const replaceRef = useRef<HTMLInputElement>(null);
  const doc = docs[activeIndex];

  useEffect(() => { setZoom(1); }, [activeIndex]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && activeIndex > 0) onNavigate(activeIndex - 1);
      if (e.key === "ArrowRight" && activeIndex < docs.length - 1) onNavigate(activeIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, docs.length, onClose, onNavigate]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = doc.url;
    a.download = `${doc.label.replace(/\s+/g, "_")}.jpg`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div>
            <p className="text-white font-bold text-sm">{doc.label}</p>
            <p className="text-white/40 text-xs">{activeIndex + 1} of {docs.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors" title="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-white/60 text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors" title="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <button onClick={handleDownload}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors" title="Download">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => window.open(doc.url, "_blank")}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors" title="Open in new tab">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-4">
        {activeIndex > 0 && (
          <button onClick={() => onNavigate(activeIndex - 1)}
            className="absolute left-4 z-10 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div className="max-w-full max-h-full overflow-auto flex items-center justify-center">
          <img src={doc.url} alt={doc.label}
            style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s ease" }}
            className="max-w-full max-h-[calc(100vh-220px)] object-contain rounded-xl shadow-2xl select-none" />
        </div>
        {activeIndex < docs.length - 1 && (
          <button onClick={() => onNavigate(activeIndex + 1)}
            className="absolute right-4 z-10 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-5 py-4 flex items-center justify-between">
        {/* Thumbnail strip */}
        <div className="flex items-center gap-2">
          {docs.map((d, i) => (
            <button key={d.field} onClick={() => onNavigate(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === activeIndex ? "border-[#00AEEF] scale-110" : "border-white/20 opacity-60 hover:opacity-100"}`}>
              <img src={d.url} alt={d.label} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        {/* Replace button */}
        <button
          onClick={() => replaceRef.current?.click()}
          disabled={uploading[doc.field]}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#00AEEF] hover:bg-[#0099D4] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-lg"
        >
          {uploading[doc.field] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Replace className="w-4 h-4" />}
          Replace Document
        </button>
        <input ref={replaceRef} type="file" accept="image/*,application/pdf" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) { onReplaceFile(doc.field, f); e.target.value = ""; } }} />
      </div>
    </div>
  );
};

// ── Document tile ─────────────────────────────────────────────────────────────
const DocTile: React.FC<{
  label: string;
  url?: string;
  uploading: boolean;
  onView: () => void;
  onUpload: (file: File) => void;
}> = ({ label, url, uploading, onView, onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        {url && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100">
            <CheckCircle className="w-2.5 h-2.5" /> Uploaded
          </span>
        )}
      </div>
      {url ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-100 h-36 shadow-sm">
          <img src={url} alt={label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
            <button onClick={onView}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0A1628] rounded-lg text-xs font-bold hover:bg-[#00AEEF] hover:text-white transition-colors shadow-md">
              <Eye className="w-3.5 h-3.5" /> View
            </button>
            <button onClick={() => inputRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 border border-white/40 text-white rounded-lg text-xs font-semibold hover:bg-white/30 transition-colors disabled:opacity-50">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Replace
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="h-36 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#00AEEF] hover:bg-[#F0F9FF] transition-all duration-200 flex flex-col items-center justify-center gap-2.5 text-gray-400 hover:text-[#00AEEF] group disabled:opacity-50 disabled:cursor-not-allowed">
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-[#00AEEF]" />
              <span className="text-xs font-medium text-[#00AEEF]">Uploading…</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-[#00AEEF]/10 flex items-center justify-center transition-colors">
                <ImageOff className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold">No document</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Click to upload</p>
              </div>
            </>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) { onUpload(f); e.target.value = ""; } }} />
    </div>
  );
};

// ── KYC status bar (always visible — approve/reject/reset) ───────────────────
const KycStatusBar: React.FC<{
  profile: IProfile;
  onUpdated: (p: IProfile) => void;
  showSnackbar: (msg: string, type: "success" | "error" | "info") => void;
}> = ({ profile, onUpdated, showSnackbar }) => {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [kycLoading, setKycLoading] = useState(false);

  const kycStatus = (profile.kyc_status || "not_submitted") as KycStatus;
  const meta = KYC_META[kycStatus];
  const KycIcon = meta.icon;

  const handleKyc = async (status: KycStatus, reason?: string) => {
    setKycLoading(true);
    try {
      const updated = await updateKycStatus(profile._id, {
        kyc_status: status,
        ...(reason ? { kyc_rejection_reason: reason } : {}),
      });
      onUpdated({ ...profile, ...updated });
      showSnackbar(
        status === "verified" ? "KYC approved" :
        status === "rejected" ? "KYC rejected" : "KYC status updated",
        "success"
      );
      setRejectOpen(false);
      setRejectReason("");
    } catch (err) {
      showSnackbar(getErrorDisplay(err).message, "error");
    } finally {
      setKycLoading(false);
    }
  };

  return (
    <div className={`mx-5 mb-4 rounded-xl border px-4 py-3 space-y-3 ${
      kycStatus === "verified" ? "bg-green-50/60 border-green-100" :
      kycStatus === "rejected" ? "bg-red-50/60 border-red-100" :
      kycStatus === "pending" ? "bg-amber-50/60 border-amber-100" :
      "bg-gray-50 border-gray-100"
    }`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${meta.color} ${meta.bg} ${meta.border}`}>
            <KycIcon className="w-3.5 h-3.5" />
            KYC: {meta.label}
          </span>
          {profile.kyc_reviewed_at && (
            <span className="text-xs text-gray-400">
              {kycStatus === "verified" ? "Verified" : "Reviewed"} {timeAgo(profile.kyc_reviewed_at)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {kycStatus !== "verified" && (
            <button
              onClick={() => handleKyc("verified")}
              disabled={kycLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {kycLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckSquare className="w-3.5 h-3.5" />}
              Approve
            </button>
          )}
          {kycStatus !== "rejected" && (
            <button
              onClick={() => setRejectOpen(r => !r)}
              disabled={kycLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XSquare className="w-3.5 h-3.5" /> Reject
            </button>
          )}
          {(kycStatus === "verified" || kycStatus === "rejected") && (
            <button
              onClick={() => handleKyc("pending")}
              disabled={kycLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {rejectOpen && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Rejection Reason
          </p>
          <textarea
            rows={2}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Explain why the documents were rejected..."
            className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 bg-white resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setRejectOpen(false); setRejectReason(""); }} className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => handleKyc("rejected", rejectReason)}
              disabled={!rejectReason.trim() || kycLoading}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              {kycLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Confirm Reject
            </button>
          </div>
        </div>
      )}

      {profile.kyc_rejection_reason && kycStatus === "rejected" && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-700 mb-0.5">Rejection Reason</p>
            <p className="text-sm text-red-600">{profile.kyc_rejection_reason}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── KYC documents section (customer profiles) ─────────────────────────────────
const CustomerKycSection: React.FC<{
  profile: IProfile;
  onUpdated: (p: IProfile) => void;
  showSnackbar: (msg: string, type: "success" | "error" | "info") => void;
}> = ({ profile, onUpdated, showSnackbar }) => {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // All 4 possible docs — only include ones that have a URL for lightbox nav
  const allDocs = [
    { label: "National ID — Front", field: "national_id_front", url: profile.national_id_front_url },
    { label: "National ID — Back",  field: "national_id_back",  url: profile.national_id_back_url },
    { label: "Licence — Front",     field: "license_front",     url: profile.driver_license?.front_url || profile.driver_license?.imageUrl },
    { label: "Licence — Back",      field: "license_back",      url: profile.driver_license?.back_url },
  ];
  const uploadedDocs = allDocs.filter(d => !!d.url) as LightboxDoc[];

  const openLightbox = (field: string) => {
    const idx = uploadedDocs.findIndex(d => d.field === field);
    if (idx >= 0) { setLightboxIndex(idx); setLightboxOpen(true); }
  };

  const handleDocUpload = async (field: string, file: File) => {
    setUploading(p => ({ ...p, [field]: true }));
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}_${profile._id}_${field}.${ext}`;
      const url = await uploadDocToSupabase(file, path);
      let payload: UpdateProfilePayload = {};
      if (field === "national_id_front") payload.national_id_front_url = url;
      else if (field === "national_id_back") payload.national_id_back_url = url;
      else if (field === "license_front") payload.driver_license = { ...profile.driver_license, front_url: url };
      else if (field === "license_back") payload.driver_license = { ...profile.driver_license, back_url: url };

      const kycPatch: Partial<UpdateProfilePayload> =
        profile.kyc_status === "not_submitted" ? { kyc_status: "pending" as KycStatus } : {};

      const updated = await updateProfileById(profile._id, { ...payload, ...kycPatch });
      onUpdated({ ...profile, ...updated });
      showSnackbar("Document uploaded successfully", "success");
    } catch (err) {
      showSnackbar(getErrorDisplay(err).message, "error");
    } finally {
      setUploading(p => ({ ...p, [field]: false }));
    }
  };

  const docCount = uploadedDocs.length;

  return (
    <>
      {lightboxOpen && uploadedDocs.length > 0 && (
        <DocLightbox
          docs={uploadedDocs}
          activeIndex={lightboxIndex}
          uploading={uploading}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
          onReplaceFile={handleDocUpload}
        />
      )}

      <div className="border-t border-gray-100 px-5 py-5 space-y-5">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00AEEF]/10 flex items-center justify-center">
              <FileImage className="w-3.5 h-3.5 text-[#00AEEF]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0A1628]">Identity Documents</p>
              <p className="text-[10px] text-gray-400">{docCount} of 4 uploaded</p>
            </div>
          </div>
          {docCount > 0 && (
            <button onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#00AEEF] bg-[#00AEEF]/10 hover:bg-[#00AEEF] hover:text-white rounded-xl transition-colors">
              <Eye className="w-3.5 h-3.5" /> View All
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00AEEF] to-[#1A5FA8] rounded-full transition-all duration-500"
              style={{ width: `${(docCount / 4) * 100}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 text-right">{docCount}/4 documents</p>
        </div>

        {/* National ID */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">National ID</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { field: "national_id_front", label: "Front Side", url: profile.national_id_front_url },
              { field: "national_id_back",  label: "Back Side",  url: profile.national_id_back_url },
            ].map(doc => (
              <DocTile key={doc.field}
                label={doc.label}
                url={doc.url}
                uploading={!!uploading[doc.field]}
                onView={() => openLightbox(doc.field)}
                onUpload={f => handleDocUpload(doc.field, f)}
              />
            ))}
          </div>
        </div>

        {/* Driver's Licence */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Driver's Licence</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { field: "license_front", label: "Front Side", url: profile.driver_license?.front_url || profile.driver_license?.imageUrl },
              { field: "license_back",  label: "Back Side",  url: profile.driver_license?.back_url },
            ].map(doc => (
              <DocTile key={doc.field}
                label={doc.label}
                url={doc.url}
                uploading={!!uploading[doc.field]}
                onView={() => openLightbox(doc.field)}
                onUpload={f => handleDocUpload(doc.field, f)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// ── City dropdown (Zimbabwe) ───────────────────────────────────────────────────
const CitySelect: React.FC<{
  value: string;
  onChange: (v: string) => void;
  className?: string;
}> = ({ value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all appearance-none pr-9"
    >
      <option value="">Select city…</option>
      {ZIM_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const AdminUserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const userFromNav = location.state?.user as any;

  const [profiles, setProfiles] = useState<IProfile[]>([]);
  const [stats, setStats] = useState<IUserStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<IAuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [branches, setBranches] = useState<IBranch[]>([]);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "profiles" | "audit">("overview");

  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateProfilePayload>({});
  const [saving, setSaving] = useState(false);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("customer");
  const [addForm, setAddForm] = useState({
    full_name: userFromNav?.full_name || "",
    national_id: "",
    dob: "",
    license_number: "",
    city: "",
    line1: "",
    line2: "",
  });
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [branchDropOpen, setBranchDropOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [snackbar, setSnackbar] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({ show: false, message: "", type: "info" });
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar(p => ({ ...p, show: false })), 4000);
  };

  const roleConfig = CREATABLE_ROLES.find(r => r.id === selectedRole);
  const needsBranch = !!roleConfig?.needsBranch;
  const singleBranch = !!roleConfig?.singleBranch;

  const loadProfiles = useCallback(async () => {
    if (!userId) return;
    const res = await fetchProfilesByUserId(userId);
    setProfiles(res.data.profiles || []);
  }, [userId]);

  const loadStats = useCallback(async () => {
    if (!userId) return;
    setStatsLoading(true);
    try { setStats(await fetchUserStats(userId)); } catch { } finally { setStatsLoading(false); }
  }, [userId]);

  const loadAudit = useCallback(async (page = 1) => {
    if (!userId) return;
    setAuditLoading(true);
    try {
      const res = await fetchUserAuditLogs(userId, { page, limit: 15 });
      setAuditLogs(p => page === 1 ? res.logs : [...p, ...res.logs]);
      setAuditTotal(res.total);
      setAuditPage(page);
    } catch { } finally { setAuditLoading(false); }
  }, [userId]);

  const loadBranches = useCallback(async () => {
    if (branches.length > 0) return;
    setBranchesLoading(true);
    try { const r = await fetchBranches(); setBranches(r.data || []); } catch { } finally { setBranchesLoading(false); }
  }, [branches.length]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadProfiles(), loadStats(), loadAudit(1)]).finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { if (needsBranch) loadBranches(); }, [needsBranch]);

  const startEdit = (profile: IProfile) => {
    setEditingProfileId(profile._id);
    setExpandedProfileId(null);
    setEditForm({
      full_name: profile.full_name || "",
      national_id: profile.national_id || "",
      dob: profile.dob ? String(profile.dob).split('T')[0] : undefined,
      driver_license: profile.driver_license ? { ...profile.driver_license } : undefined,
      address: profile.address ? { ...profile.address } : {},
      approval_limit_usd: (profile as any).approval_limit_usd,
    });
  };

  const saveEdit = async (profileId: string) => {
    setSaving(true);
    try {
      const payload: UpdateProfilePayload = {
        ...editForm,
        address: (editForm.address as any)?.city ? {
          ...(editForm.address as any),
          region: ZIM_CITY_TO_PROVINCE[(editForm.address as any).city] || '',
          country: 'Zimbabwe',
        } : editForm.address,
      };
      const updated = await updateProfileById(profileId, payload);
      setProfiles(p => p.map(pr => pr._id === profileId ? { ...pr, ...(updated as any) } : pr));
      setEditingProfileId(null);
      showSnackbar("Profile updated successfully", "success");
    } catch (err) {
      showSnackbar(getErrorDisplay(err).message, "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProfileById(id);
      setProfiles(p => p.filter(pr => pr._id !== id));
      setProfileToDelete(null);
      showSnackbar("Profile deleted", "success");
    } catch (err) {
      showSnackbar(getErrorDisplay(err).message, "error");
    }
  };

  const handleAddProfile = async () => {
    if (!userId) return;
    setAddLoading(true);
    try {
      const base = {
        target_user_id: userId,
        full_name: addForm.full_name,
        national_id: addForm.national_id || undefined,
        dob: addForm.dob || undefined,
        driver_license: addForm.license_number ? { number: addForm.license_number } : undefined,
        address: addForm.city ? {
          line1: addForm.line1 || undefined,
          line2: addForm.line2 || undefined,
          city: addForm.city,
          region: ZIM_CITY_TO_PROVINCE[addForm.city] || '',
          country: 'Zimbabwe',
        } : undefined,
      };

      let created: any;
      if (selectedRole === "customer") {
        created = await createCustomerProfileByStaff(base as CreateCustomerProfilePayload);
      } else if (selectedRole === "agent") {
        created = await createAgentProfileByStaff({ ...base, branch_id: selectedBranchIds[0] || "" } as CreateAgentProfilePayload);
      } else if (selectedRole === "manager") {
        created = await createManagerProfileByStaff({ ...base, branch_ids: selectedBranchIds } as CreateManagerProfilePayload);
      } else if (selectedRole === "branch_receptionist") {
        created = await createBranchReceptionistProfileByStaff({ ...base, branch_ids: selectedBranchIds } as CreateBranchReceptionistProfilePayload);
      }

      await loadProfiles();
      setAddPanelOpen(false);
      setAddForm({ full_name: userFromNav?.full_name || "", national_id: "", dob: "", license_number: "", city: "", line1: "", line2: "" });
      setSelectedBranchIds([]);
      showSnackbar("Profile created successfully", "success");
    } catch (err) {
      showSnackbar(getErrorDisplay(err).message, "error");
    } finally { setAddLoading(false); }
  };

  const s = stats?.summary;
  const pieData = (stats?.charts.activity_breakdown || []).slice(0, 7).map((a, i) => ({
    name: ACTION_META[a.action]?.label || formatRoleLabel(a.action),
    value: a.count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // ── Profile card ────────────────────────────────────────────────────────────
  const ProfileCard: React.FC<{ profile: IProfile }> = ({ profile }) => {
    const isEditing = editingProfileId === profile._id;
    const isExpanded = expandedProfileId === profile._id;
    const isCustomer = profile.role === "customer";
    const RoleIcon = ROLE_ICON[profile.role] || User;
    const badge = ROLE_BADGE[profile.role] || "bg-gray-100 text-gray-600 border-gray-200";
    const kycMeta = KYC_META[(profile.kyc_status || "not_submitted") as KycStatus];

    const handleProfileUpdated = (updated: IProfile) => {
      setProfiles(p => p.map(pr => pr._id === updated._id ? { ...pr, ...updated } : pr));
    };

    return (
      <div className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden ${isEditing ? "border-[#00AEEF] shadow-lg" : "border-gray-100 hover:border-gray-200 hover:shadow-md"}`}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${badge.split(" ")[0]}`}>
                <RoleIcon className="w-6 h-6" style={{ opacity: 0.7 }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${badge}`}>
                    {formatRoleLabel(profile.role)}
                  </span>
                  {profile.verified && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {isCustomer && (
                    <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${kycMeta.color} ${kycMeta.bg} ${kycMeta.border}`}>
                      <kycMeta.icon className="w-3 h-3" />
                      {kycMeta.label}
                    </span>
                  )}
                </div>
                <p className="text-base font-bold text-[#0A1628] mt-1 truncate">{profile.full_name || "—"}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                  <p className="text-xs text-gray-400">Created {formatDate(profile.created_at)}</p>
                  {profile.created_by && (
                    <p className="text-xs text-gray-400">
                      by <span className="font-medium text-[#0A1628]">
                        {typeof profile.created_by === "object"
                          ? profile.created_by.full_name
                          : "Staff"}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {!isEditing && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => startEdit(profile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00AEEF]/10 text-[#00AEEF] hover:bg-[#00AEEF] hover:text-white rounded-xl text-xs font-semibold transition-all duration-150"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setExpandedProfileId(isExpanded ? null : profile._id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setProfileToDelete(profile._id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.national_id && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                  <Hash className="w-3 h-3" /> {profile.national_id}
                </div>
              )}
              {profile.address?.city && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                  <MapPin className="w-3 h-3" /> {profile.address.city}
                </div>
              )}
              {(profile as any).branch_ids?.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg font-medium">
                  <Building2 className="w-3 h-3" /> {(profile as any).branch_ids.length} branch(es)
                </div>
              )}
              {(profile as any).loyalty_points !== undefined && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg font-semibold">
                  <Star className="w-3 h-3" /> {(profile as any).loyalty_points} pts
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── KYC status bar — always visible for customer profiles ── */}
        {isCustomer && (
          <KycStatusBar profile={profile} onUpdated={handleProfileUpdated} showSnackbar={showSnackbar} />
        )}

        {/* ── Edit form ── */}
        {isEditing && (
          <div className="border-t-2 border-[#00AEEF]/30 bg-gradient-to-b from-[#F0F9FF] to-white px-5 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#00AEEF] uppercase tracking-wider">Editing {formatRoleLabel(profile.role)} Profile</p>
              <button onClick={() => setEditingProfileId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                <input
                  value={(editForm.full_name as string) || ""}
                  onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">National ID</label>
                <input
                  value={(editForm.national_id as string) || ""}
                  onChange={e => setEditForm(p => ({ ...p, national_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                  placeholder="ID number"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">City</label>
                <CitySelect
                  value={(editForm.address as any)?.city || ""}
                  onChange={v => setEditForm(p => ({ ...p, address: { ...(p.address as any || {}), city: v } }))}
                />
                {(editForm.address as any)?.city && (
                  <p className="text-xs text-gray-400 mt-1">
                    Province: {ZIM_CITY_TO_PROVINCE[(editForm.address as any).city] ?? '—'} · Country: Zimbabwe
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={(editForm.dob as string)?.split('T')[0] || ""}
                  onChange={e => setEditForm(p => ({ ...p, dob: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Driver's Licence No.</label>
                <input
                  value={(editForm.driver_license as any)?.number || ""}
                  onChange={e => setEditForm(p => ({ ...p, driver_license: { ...(p.driver_license as any || {}), number: e.target.value } }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                  placeholder="Licence number"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Street Address</label>
                <input
                  value={(editForm.address as any)?.line1 || ""}
                  onChange={e => setEditForm(p => ({ ...p, address: { ...(p.address as any || {}), line1: e.target.value } }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                  placeholder="Street address"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address Line 2</label>
                <input
                  value={(editForm.address as any)?.line2 || ""}
                  onChange={e => setEditForm(p => ({ ...p, address: { ...(p.address as any || {}), line2: e.target.value } }))}
                  className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                  placeholder="Apt, suite, etc."
                />
              </div>
              {(profile as any).approval_limit_usd !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Approval Limit (USD)</label>
                  <input
                    type="number"
                    value={(editForm.approval_limit_usd as number) ?? ""}
                    onChange={e => setEditForm(p => ({ ...p, approval_limit_usd: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-[#00AEEF]/10">
              <button onClick={() => setEditingProfileId(null)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
              <button
                onClick={() => saveEdit(profile._id)}
                disabled={saving}
                className="px-5 py-2 bg-[#00AEEF] text-white rounded-xl text-sm font-bold hover:bg-[#0099D4] transition-colors flex items-center gap-2 disabled:opacity-60 shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* ── Expanded details ── */}
        {isExpanded && !isEditing && (
          <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white">
            {/* Info grid */}
            <div className="px-5 pt-5 pb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Profile Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                {profile.dob && (
                  <div className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date of Birth</p>
                      <p className="text-sm font-bold text-[#0A1628] mt-0.5">{formatDate(String(profile.dob))}</p>
                    </div>
                  </div>
                )}

                {profile.national_id && (
                  <div className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Hash className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">National ID</p>
                      <p className="text-sm font-bold text-[#0A1628] mt-0.5 font-mono">{profile.national_id}</p>
                    </div>
                  </div>
                )}

                {(profile as any).driver_license?.number && (
                  <div className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Driver's Licence</p>
                      <p className="text-sm font-bold text-[#0A1628] mt-0.5 font-mono">{(profile as any).driver_license.number}</p>
                    </div>
                  </div>
                )}

                {profile.address && (profile.address.line1 || profile.address.city) && (
                  <div className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm sm:col-span-2">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Address</p>
                      <p className="text-sm font-bold text-[#0A1628] mt-0.5 leading-relaxed">
                        {[
                          profile.address.line1,
                          profile.address.line2,
                          profile.address.city,
                          profile.address.city
                            ? (ZIM_CITY_TO_PROVINCE[profile.address.city] ?? profile.address.region)
                            : profile.address.region,
                          "Zimbabwe",
                        ].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                {(profile as any).approval_limit_usd !== undefined && (
                  <div className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Banknote className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Approval Limit</p>
                      <p className="text-sm font-bold text-[#0A1628] mt-0.5">${(profile as any).approval_limit_usd}</p>
                    </div>
                  </div>
                )}

                {(profile as any).loyalty_points !== undefined && (
                  <div className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Loyalty Points</p>
                      <p className="text-sm font-bold text-[#0A1628] mt-0.5">{(profile as any).loyalty_points} pts</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Hash className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Profile ID</p>
                    <p className="text-[10px] font-mono text-gray-500 mt-0.5 truncate">{profile._id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* KYC documents section — customer only */}
            {isCustomer && (
              <CustomerKycSection
                profile={profile}
                onUpdated={handleProfileUpdated}
                showSnackbar={showSnackbar}
              />
            )}
          </div>
        )}

        {/* Always show KYC section for customer profiles even when not expanded */}
        {isCustomer && !isExpanded && !isEditing && (
          <div className="border-t border-gray-100 bg-[#FAFBFC] px-5 py-3">
            <button
              onClick={() => setExpandedProfileId(profile._id)}
              className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-[#00AEEF] transition-colors font-medium"
            >
              <span className="flex items-center gap-1.5">
                <FileImage className="w-3.5 h-3.5" />
                KYC Documents &amp; Verification
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Audit item ──────────────────────────────────────────────────────────────
  const AuditItem: React.FC<{ log: IAuditLog; isLast?: boolean }> = ({ log, isLast }) => {
    const meta = ACTION_META[log.action] || { icon: Activity, color: "text-gray-500 bg-gray-50", label: formatRoleLabel(log.action) };
    const Icon = meta.icon;
    return (
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
            <Icon className="w-4 h-4" />
          </div>
          {!isLast && <div className="w-px flex-1 bg-gray-100 my-1" />}
        </div>
        <div className={`flex-1 min-w-0 ${isLast ? "pb-2" : "pb-5"}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[#0A1628]">{meta.label}</p>
              {log.description && <p className="text-xs text-gray-500 mt-0.5">{log.description}</p>}
              {log.actor_id && log.actor_id._id !== log.user_id && (
                <p className="text-xs text-[#00AEEF] mt-0.5">By: {log.actor_id.full_name}</p>
              )}
              {log.ip_address && <p className="text-[10px] text-gray-300 mt-0.5 font-mono">IP {log.ip_address}</p>}
            </div>
            <p className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{timeAgo(log.created_at)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderFullSkeleton = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-5">
          <Shimmer className="w-20 h-20 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-6 w-52" />
            <Shimmer className="h-4 w-36" />
            <div className="flex gap-2"><Shimmer className="h-6 w-20 rounded-full" /><Shimmer className="h-6 w-20 rounded-full" /></div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <Shimmer className="h-10 w-10 rounded-xl" />
            <Shimmer className="h-3 w-20" />
            <Shimmer className="h-7 w-16" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-[#0A1628] transition-colors text-sm font-medium">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Users</span>
              </button>
              <div className="h-5 w-px bg-gray-200" />
              <div>
                <h1 className="text-lg font-bold text-[#0A1628]">User Detail</h1>
                <p className="text-xs text-gray-400">Profiles · Analytics · Audit</p>
              </div>
            </div>
            {activeTab === "profiles" && (
              <button
                onClick={() => setAddPanelOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#00AEEF] text-white rounded-xl hover:bg-[#0099D4] transition-colors font-semibold text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Profile
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
            {loading ? renderFullSkeleton() : (
              <>
                {/* Hero */}
                <div className="bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] rounded-2xl p-6 text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                        {(userFromNav?.full_name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{userFromNav?.full_name || "User"}</h2>
                        {userFromNav?.email && (
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-3.5 h-3.5 text-white/60" />
                            <span className="text-sm text-white/70">{userFromNav.email}</span>
                          </div>
                        )}
                        {userFromNav?.phone && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-white/60" />
                            <span className="text-sm text-white/70">{userFromNav.phone}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(userFromNav?.roles || []).map((r: string) => (
                            <span key={r} className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-white/15 text-white/90 border border-white/20">
                              {formatRoleLabel(r)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-xl border border-white/10">
                        <Calendar className="w-3.5 h-3.5 text-white/60" />
                        <span className="text-white/80">Joined {formatDate(userFromNav?.created_at)}</span>
                      </div>
                      {userFromNav?.email_verified && (
                        <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 px-3 py-2 rounded-xl text-green-300 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> Verified
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-xl border border-white/10">
                        <Shield className="w-3.5 h-3.5 text-white/60" />
                        <span className="text-white/80">{profiles.length} profile{profiles.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={Car} label="Total Reservations" value={s?.reservations?.total ?? 0} sub={`${s?.reservations?.active ?? 0} active now`} color="bg-[#00AEEF]/10 text-[#00AEEF]" loading={statsLoading} />
                  <StatCard icon={Banknote} label="Total Paid" value={`$${(s?.payments?.paid_total_usd ?? 0).toFixed(2)}`} sub={`${s?.payments?.paid_count ?? 0} transactions`} color="bg-green-100 text-green-600" loading={statsLoading} />
                  <StatCard icon={TrendingUp} label="Driver Bookings" value={s?.driver_bookings?.total ?? 0} sub={`${s?.driver_bookings?.completed ?? 0} completed`} color="bg-amber-100 text-amber-600" loading={statsLoading} />
                  <StatCard icon={Shield} label="Profiles" value={profiles.length} sub={profiles.map(p => formatRoleLabel(p.role)).join(", ") || "None created"} color="bg-purple-100 text-purple-600" />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm w-fit">
                  {(["overview", "profiles", "audit"] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${activeTab === tab ? "bg-[#0A1628] text-white shadow-sm" : "text-gray-500 hover:text-[#0A1628]"}`}
                    >
                      {tab === "audit" ? "Audit Trail" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* ── Overview tab ── */}
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    {statsLoading ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-64"><Shimmer className="h-full" /></div>)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm lg:col-span-2">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-sm font-bold text-[#0A1628]">Reservations — Last 6 Months</h3>
                              <p className="text-xs text-gray-400">Monthly booking activity</p>
                            </div>
                            <div className="w-8 h-8 bg-[#00AEEF]/10 rounded-xl flex items-center justify-center">
                              <Car className="w-4 h-4 text-[#00AEEF]" />
                            </div>
                          </div>
                          <ResponsiveContainer width="100%" height={175}>
                            <LineChart data={stats?.charts.reservations_by_month || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                              <Tooltip content={<ChartTooltip />} />
                              <Line type="monotone" dataKey="count" name="Reservations" stroke="#00AEEF" strokeWidth={2.5} dot={{ fill: "#00AEEF", r: 4, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-sm font-bold text-[#0A1628]">Activity Breakdown</h3>
                              <p className="text-xs text-gray-400">By action type</p>
                            </div>
                            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                              <Activity className="w-4 h-4 text-purple-600" />
                            </div>
                          </div>
                          {pieData.length > 0 ? (
                            <>
                              <ResponsiveContainer width="100%" height={130}>
                                <PieChart>
                                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={58} dataKey="value" paddingAngle={3}>
                                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                  </Pie>
                                  <Tooltip formatter={(v: any) => [v, "events"]} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="mt-2 space-y-1.5">
                                {pieData.slice(0, 4).map((d, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                                      <span className="text-gray-600 truncate max-w-[110px]">{d.name}</span>
                                    </div>
                                    <span className="font-bold text-[#0A1628]">{d.value}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                              <Activity className="w-12 h-12 mb-2" />
                              <span className="text-sm text-gray-400">No activity yet</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm lg:col-span-3">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-sm font-bold text-[#0A1628]">Payment Spending — Last 6 Months</h3>
                              <p className="text-xs text-gray-400">USD paid per month</p>
                            </div>
                            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                              <Banknote className="w-4 h-4 text-green-600" />
                            </div>
                          </div>
                          <ResponsiveContainer width="100%" height={155}>
                            <BarChart data={stats?.charts.payments_by_month || []} margin={{ top: 5, right: 10, left: -5, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                              <Tooltip content={<ChartTooltip />} />
                              <Bar dataKey="total" name="USD Spent" fill="#00AEEF" radius={[6, 6, 0, 0]} maxBarSize={48} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Profiles tab ── */}
                {activeTab === "profiles" && (
                  <div className="space-y-4">
                    {profiles.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-gray-100 p-14 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                          <User className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-bold text-gray-600 mb-1">No profiles yet</p>
                        <p className="text-gray-400 text-sm mb-6">This user doesn't have any role profiles. Add one to get started.</p>
                        <button
                          onClick={() => setAddPanelOpen(true)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-[#00AEEF] text-white rounded-xl hover:bg-[#0099D4] font-semibold text-sm shadow-sm"
                        >
                          <Plus className="w-4 h-4" /> Add First Profile
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {profiles.map(p => <ProfileCard key={p._id} profile={p} />)}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Audit tab ── */}
                {activeTab === "audit" && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-[#0A1628]">Audit Trail</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{auditTotal} events recorded</p>
                      </div>
                      <button onClick={() => { setAuditLogs([]); loadAudit(1); }} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00AEEF] font-medium transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                      </button>
                    </div>

                    {auditLoading && auditLogs.length === 0 ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex gap-4">
                            <Shimmer className="w-9 h-9 rounded-xl flex-shrink-0" />
                            <div className="flex-1 space-y-2 py-1"><Shimmer className="h-4 w-48" /><Shimmer className="h-3 w-64" /></div>
                          </div>
                        ))}
                      </div>
                    ) : auditLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-14 text-gray-300">
                        <Clock className="w-14 h-14 mb-3" />
                        <p className="text-sm font-medium text-gray-400">No events recorded yet</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          {auditLogs.map((log, i) => (
                            <AuditItem key={log._id} log={log} isLast={i === auditLogs.length - 1} />
                          ))}
                        </div>
                        {auditLogs.length < auditTotal && (
                          <div className="mt-5 pt-4 border-t border-gray-100 flex justify-center">
                            <button
                              onClick={() => loadAudit(auditPage + 1)}
                              disabled={auditLoading}
                              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              {auditLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                              Load more ({auditTotal - auditLogs.length} remaining)
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Profile Side Panel ── */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${addPanelOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-[#0A1628]/60 backdrop-blur-sm transition-opacity duration-300 ${addPanelOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => !addLoading && setAddPanelOpen(false)} />

        <div className={`absolute inset-y-0 right-0 transition-transform duration-300 ease-out ${addPanelOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="w-screen max-w-lg h-full flex flex-col bg-white shadow-2xl">
            <div className="flex-shrink-0 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] px-7 py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Add Profile</h2>
                    <p className="text-xs text-[#00AEEF]/80 mt-0.5">for {userFromNav?.full_name || "this user"}</p>
                  </div>
                </div>
                <button onClick={() => !addLoading && setAddPanelOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-7">
              <section>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">1. Select Role</p>
                <div className="grid grid-cols-2 gap-3">
                  {CREATABLE_ROLES.map(role => {
                    const Icon = role.icon;
                    const active = selectedRole === role.id;
                    return (
                      <button key={role.id} type="button" onClick={() => { setSelectedRole(role.id); setSelectedBranchIds([]); }}
                        className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${active ? `${role.bg} ${role.border} shadow-sm` : "border-gray-100 bg-white hover:border-gray-200"}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${active ? role.bg : "bg-gray-100"}`}>
                          <Icon className={`w-4 h-4 ${active ? role.color : "text-gray-400"}`} />
                        </div>
                        <p className={`text-sm font-bold ${active ? "text-[#0A1628]" : "text-gray-700"}`}>{role.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{role.desc}</p>
                        {role.needsBranch && (
                          <p className="text-[10px] text-[#00AEEF] font-semibold mt-1.5 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> Branch required
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="h-px bg-gray-100" />

              <section>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">2. Profile Details</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                    <input
                      value={addForm.full_name}
                      onChange={e => setAddForm(p => ({ ...p, full_name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                      placeholder="Full name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">National ID</label>
                      <input
                        value={addForm.national_id}
                        onChange={e => setAddForm(p => ({ ...p, national_id: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                        placeholder="ID number"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">City</label>
                      <CitySelect
                        value={addForm.city}
                        onChange={v => setAddForm(p => ({ ...p, city: v }))}
                      />
                      {addForm.city && (
                        <p className="text-xs text-gray-400 mt-1">
                          Province: {ZIM_CITY_TO_PROVINCE[addForm.city] ?? '—'} · Country: Zimbabwe
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date of Birth</label>
                      <input
                        type="date"
                        value={addForm.dob}
                        onChange={e => setAddForm(p => ({ ...p, dob: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Driver's Licence No.</label>
                      <input
                        value={addForm.license_number}
                        onChange={e => setAddForm(p => ({ ...p, license_number: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                        placeholder="Licence number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Street Address</label>
                    <input
                      value={addForm.line1}
                      onChange={e => setAddForm(p => ({ ...p, line1: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address Line 2</label>
                    <input
                      value={addForm.line2}
                      onChange={e => setAddForm(p => ({ ...p, line2: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] transition-all"
                      placeholder="Apt, suite, etc."
                    />
                  </div>
                </div>
              </section>

              {needsBranch && (
                <>
                  <div className="h-px bg-gray-100" />
                  <section>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">3. Branch Assignment</p>
                    <p className="text-xs text-gray-400 mb-3">
                      {singleBranch ? "Select the branch this agent belongs to." : "Select one or more branches."}
                    </p>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setBranchDropOpen(p => !p)}
                        className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl text-sm transition-all ${branchDropOpen ? "border-[#00AEEF] bg-[#F0F9FF]" : selectedBranchIds.length > 0 ? "border-[#00AEEF]/40 bg-[#F0F9FF]" : "border-gray-200 bg-white hover:border-gray-300"}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          {selectedBranchIds.length === 0 ? (
                            <span className="text-gray-400">{branchesLoading ? "Loading…" : "Select branch(es)"}</span>
                          ) : (
                            <span className="text-[#0A1628] font-medium truncate">
                              {selectedBranchIds.map(id => branches.find(b => b._id === id)?.name).filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {selectedBranchIds.length > 0 && <span className="bg-[#00AEEF] text-white text-xs font-bold px-2 py-0.5 rounded-full">{selectedBranchIds.length}</span>}
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${branchDropOpen ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {branchDropOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                          {branchesLoading ? (
                            <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400">
                              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                            </div>
                          ) : branches.length === 0 ? (
                            <p className="text-center py-6 text-sm text-gray-400">No branches found</p>
                          ) : branches.map(branch => {
                            const checked = selectedBranchIds.includes(branch._id);
                            return (
                              <button key={branch._id} type="button"
                                onClick={() => {
                                  if (singleBranch) { setSelectedBranchIds([branch._id]); setBranchDropOpen(false); }
                                  else setSelectedBranchIds(p => checked ? p.filter(id => id !== branch._id) : [...p, branch._id]);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F0F9FF] transition-colors ${checked ? "bg-[#F0F9FF]" : ""}`}
                              >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? "bg-[#00AEEF] border-[#00AEEF]" : "border-gray-300"}`}>
                                  {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[#0A1628] truncate">{branch.name}</p>
                                  <p className="text-xs text-gray-400 truncate">{branch.address?.city}{branch.code ? ` · ${branch.code}` : ""}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>

            <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50 px-7 py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="text-xs text-gray-400">
                  Creating <span className="font-semibold text-[#0A1628]">{CREATABLE_ROLES.find(r => r.id === selectedRole)?.label}</span> profile
                  {selectedBranchIds.length > 0 && <> · <span className="text-[#00AEEF] font-semibold">{selectedBranchIds.length} branch{selectedBranchIds.length > 1 ? "es" : ""}</span></>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => !addLoading && setAddPanelOpen(false)} disabled={addLoading}
                    className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={handleAddProfile}
                    disabled={addLoading || !addForm.full_name || (needsBranch && selectedBranchIds.length === 0)}
                    className="px-5 py-2.5 bg-[#00AEEF] text-white rounded-xl text-sm font-bold hover:bg-[#0099D4] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                    {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Create Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete confirmation ── */}
      {profileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A1628]/60 backdrop-blur-sm" onClick={() => setProfileToDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-[#0A1628]">Delete Profile</h3>
                <p className="text-xs text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">This profile and all its data will be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setProfileToDelete(null)} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(profileToDelete)} className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Snackbar ── */}
      {snackbar.show && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] border ${
            snackbar.type === "success" ? "bg-green-50 border-green-200 text-green-800" :
            snackbar.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
            "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            {snackbar.type === "success" && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
            {snackbar.type === "error" && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{snackbar.message}</span>
            <button onClick={() => setSnackbar(p => ({ ...p, show: false }))}><X className="w-4 h-4 opacity-40 hover:opacity-100" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserProfilePage;
