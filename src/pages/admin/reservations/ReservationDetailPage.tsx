// src/pages/admin/reservations/ReservationDetailPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Sidebar from "../../../components/Sidebar";
import {
  fetchReservationById,
  updateReservationStatus,
  deleteReservation,
  parseDecimalValue,
  formatCurrencyDisplay,
  calculateTotalDays,
  type IReservation,
  type ReservationStatus,
  type IBranchRef,
  type IVehicleRef,
  type IVehicleModelRef,
} from "../../../Services/adminAndManager/reservations_service";
import VehicleTrackerService from "../../../Services/adminAndManager/vehicle_trackers_service";
import {
  recordCashPayment,
  initiateOnlinePayment,
  initiateMobileMoneyPayment,
} from "../../../Services/adminAndManager/payment_service";
import {
  createVehicleIncident,
} from "../../../Services/adminAndManager/vehicle_incident_manager";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  X,
  ArrowRight,
  Trash2,
  RefreshCw,
  User,
  Car,
  MapPin,
  CreditCard,
  Menu,
  Shield,
  Clock,
  FileText,
  Navigation,
  Banknote,
  Smartphone,
  ExternalLink,
  Gauge,
  Fuel,
  TriangleAlert,
  ClipboardList,
  ChevronDown,
} from "lucide-react";

// ===== Fix Leaflet default icons =====
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const makeIcon = (color: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const greenIcon = makeIcon("green");
const redIcon = makeIcon("red");
const blueIcon = makeIcon("blue");

// ===== Status config =====
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending:     { label: "Pending",     bg: "bg-amber-100",   text: "text-amber-700" },
  confirmed:   { label: "Confirmed",   bg: "bg-blue-100",    text: "text-blue-700" },
  checked_out: { label: "Checked Out", bg: "bg-indigo-100",  text: "text-indigo-700" },
  checked_in:  { label: "Checked In",  bg: "bg-cyan-100",    text: "text-cyan-700" },
  returned:    { label: "Checked In",  bg: "bg-cyan-100",    text: "text-cyan-700" },
  closed:      { label: "Completed",   bg: "bg-emerald-100", text: "text-emerald-700" },
  completed:   { label: "Completed",   bg: "bg-emerald-100", text: "text-emerald-700" },
  cancelled:   { label: "Cancelled",   bg: "bg-red-100",     text: "text-red-600" },
  no_show:     { label: "No Show",     bg: "bg-gray-100",    text: "text-gray-600" },
};

const PAY_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  unpaid: { label: "Unpaid", bg: "bg-red-50", text: "text-red-600" },
  partially_paid: { label: "Partial", bg: "bg-amber-50", text: "text-amber-600" },
  paid: { label: "Paid", bg: "bg-emerald-50", text: "text-emerald-600" },
  refunded: { label: "Refunded", bg: "bg-purple-50", text: "text-purple-600" },
  cancelled: { label: "Cancelled", bg: "bg-gray-50", text: "text-gray-500" },
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

const TIMELINE_STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "checked_out",
  "checked_in",
  "closed",
];

// ===== Types =====
type Tab = "overview" | "map" | "pricing";

interface TrackerLocation {
  latitude: number;
  longitude: number;
  speed_kmh?: number;
  heading_deg?: number;
  accuracy_m?: number;
  at?: string;
  source?: string;
}

// ===== Helper functions =====
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function getBranchName(branchId: string | IBranchRef | null | undefined): string {
  if (!branchId) return "—";
  if (typeof branchId === "object") return (branchId as IBranchRef).name || "—";
  return branchId;
}

function getBranchCoords(branchId: string | IBranchRef | null | undefined): [number, number] | null {
  if (!branchId || typeof branchId !== "object") return null;
  const b = branchId as IBranchRef;
  if (!b.geo?.coordinates || b.geo.coordinates.length < 2) return null;
  // GeoJSON: [lng, lat] -> Leaflet: [lat, lng]
  return [b.geo.coordinates[1], b.geo.coordinates[0]];
}

function getVehicleId(r: IReservation): string | null {
  if (!r.vehicle_id) return null;
  if (typeof r.vehicle_id === "object") return (r.vehicle_id as IVehicleRef)._id || null;
  return r.vehicle_id as string;
}

// ===== Main Component =====
export default function ReservationDetailPage() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [reservation, setReservation] = useState<IReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("overview");

  // Tracker
  const [trackerLocation, setTrackerLocation] = useState<TrackerLocation | null>(null);
  const [trackerLoading, setTrackerLoading] = useState(false);

  // OSRM routes
  const [routePickupToVehicle, setRoutePickupToVehicle] = useState<[number, number][] | null>(null);
  const [routeVehicleToDropoff, setRouteVehicleToDropoff] = useState<[number, number][] | null>(null);
  const [routePickupToDropoff, setRoutePickupToDropoff] = useState<[number, number][] | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Cash payment modal
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [cashNotes, setCashNotes] = useState("");
  const [cashSubmitting, setCashSubmitting] = useState(false);

  // Mobile money modal
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [mobileMethod, setMobileMethod] = useState<"ecocash" | "telecash" | "onemoney">("ecocash");
  const [mobilePhone, setMobilePhone] = useState("");
  const [mobileAmount, setMobileAmount] = useState("");
  const [mobileSubmitting, setMobileSubmitting] = useState(false);

  // Paynow loading
  const [paynowLoading, setPaynowLoading] = useState(false);

  // Vehicle condition + incident modal (for checked_out / checked_in transitions)
  const [conditionModalOpen, setConditionModalOpen] = useState(false);
  const [conditionTargetStatus, setConditionTargetStatus] = useState<ReservationStatus | null>(null);
  const [odometerReading, setOdometerReading] = useState("");
  const [fuelLevel, setFuelLevel] = useState<string>("full");
  const [vehicleCondition, setVehicleCondition] = useState<string>("good");
  const [conditionNotes, setConditionNotes] = useState("");
  const [reportIncident, setReportIncident] = useState(false);
  const [incidentType, setIncidentType] = useState<string>("damage");
  const [incidentSeverity, setIncidentSeverity] = useState<string>("minor");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [incidentCost, setIncidentCost] = useState("");
  const [conditionSubmitting, setConditionSubmitting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" as "success" | "error" });

  // ===== Load reservation =====
  const loadReservation = useCallback(async () => {
    if (!reservationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchReservationById(reservationId);
      setReservation(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load reservation");
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    loadReservation();
  }, [loadReservation]);

  // ===== Load tracker location =====
  useEffect(() => {
    if (!reservation) return;
    const vid = getVehicleId(reservation);
    if (!vid) return;
    setTrackerLoading(true);
    VehicleTrackerService.getVehicleLastLocation(vid)
      .then((data) => {
        if (data?.last_location) {
          setTrackerLocation(data.last_location);
        }
      })
      .catch(() => {})
      .finally(() => setTrackerLoading(false));
  }, [reservation]);

  // ===== Load OSRM routes =====
  useEffect(() => {
    if (tab !== "map" || !reservation) return;

    const pickupCoords = getBranchCoords(reservation.pickup?.branch_id);
    const dropoffCoords = getBranchCoords(reservation.dropoff?.branch_id);
    if (!pickupCoords || !dropoffCoords) return;

    setRouteLoading(true);

    const fetchOSRM = async (
      from: [number, number],
      to: [number, number]
    ): Promise<[number, number][] | null> => {
      try {
        // OSRM expects [lng, lat]
        const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const json = await resp.json();
        const coords: [number, number][][] = json?.routes?.[0]?.geometry?.coordinates;
        if (!coords) return null;
        // Convert [lng, lat] to [lat, lng] for Leaflet
        return coords.map(([lng, lat]) => [lat, lng]);
      } catch {
        return null;
      }
    };

    const load = async () => {
      if (trackerLocation) {
        const vehiclePt: [number, number] = [trackerLocation.latitude, trackerLocation.longitude];
        const [r1, r2] = await Promise.all([
          fetchOSRM(pickupCoords, vehiclePt),
          fetchOSRM(vehiclePt, dropoffCoords),
        ]);
        setRoutePickupToVehicle(r1);
        setRouteVehicleToDropoff(r2);
        setRoutePickupToDropoff(null);
      } else {
        const r = await fetchOSRM(pickupCoords, dropoffCoords);
        setRoutePickupToDropoff(r);
        setRoutePickupToVehicle(null);
        setRouteVehicleToDropoff(null);
      }
      setRouteLoading(false);
    };

    load();
  }, [tab, reservation, trackerLocation]);

  // Auto-dismiss snackbar
  useEffect(() => {
    if (snackbar.open) {
      const t = setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 3500);
      return () => clearTimeout(t);
    }
  }, [snackbar.open]);

  // ===== Status change =====
  async function handleStatusChange(newStatus: ReservationStatus) {
    if (!reservation) return;
    // For checkout and checkin, open the condition inspection modal first
    if (newStatus === "checked_out" || newStatus === "checked_in") {
      setConditionTargetStatus(newStatus);
      setOdometerReading("");
      setFuelLevel("full");
      setVehicleCondition("good");
      setConditionNotes("");
      setReportIncident(false);
      setIncidentType("damage");
      setIncidentSeverity("minor");
      setIncidentDesc("");
      setIncidentCost("");
      setStatusModalOpen(false);
      setConditionModalOpen(true);
      return;
    }
    await doStatusChange(newStatus);
  }

  async function doStatusChange(newStatus: ReservationStatus) {
    if (!reservation) return;
    setStatusChanging(true);
    try {
      const updated = await updateReservationStatus(reservation._id, newStatus);
      setReservation((prev) => prev ? { ...prev, status: updated.status } : prev);
      setSnackbar({ open: true, message: `Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`, type: "success" });
      setStatusModalOpen(false);
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || "Failed to update status", type: "error" });
    } finally {
      setStatusChanging(false);
    }
  }

  async function handleConditionSubmit() {
    if (!reservation || !conditionTargetStatus) return;
    setConditionSubmitting(true);
    try {
      const updated = await updateReservationStatus(reservation._id, conditionTargetStatus);
      setReservation((prev) => prev ? { ...prev, status: updated.status } : prev);

      if (reportIncident && incidentDesc.trim()) {
        const vid = getVehicleId(reservation);
        const branchRaw = conditionTargetStatus === "checked_in"
          ? reservation.dropoff?.branch_id
          : reservation.pickup?.branch_id;
        const branchId = typeof branchRaw === "object" && branchRaw
          ? (branchRaw as IBranchRef)._id
          : (branchRaw as string | null | undefined);

        await createVehicleIncident({
          vehicle_id: vid || undefined,
          reservation_id: reservation._id,
          branch_id: branchId || undefined,
          type: incidentType,
          severity: incidentSeverity,
          description: `[${conditionTargetStatus === "checked_out" ? "Checkout" : "Return"} Inspection] ${conditionNotes ? conditionNotes + " — " : ""}${incidentDesc}`,
          estimated_cost: incidentCost ? parseFloat(incidentCost) : undefined,
          occurred_at: new Date().toISOString(),
          status: "open",
        });
      }

      const incidentMsg = reportIncident && incidentDesc.trim() ? " — Incident logged" : "";
      setSnackbar({ open: true, message: `${STATUS_CONFIG[conditionTargetStatus]?.label} confirmed${incidentMsg}`, type: "success" });
      setConditionModalOpen(false);
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || "Failed to update status", type: "error" });
    } finally {
      setConditionSubmitting(false);
    }
  }

  // ===== Delete =====
  async function handleDelete() {
    if (!reservation) return;
    setDeleting(true);
    try {
      await deleteReservation(reservation._id);
      setSnackbar({ open: true, message: "Reservation deleted", type: "success" });
      setTimeout(() => navigate("/admin-reservations"), 800);
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || "Failed to delete reservation", type: "error" });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  // ===== Payment handlers =====
  function openCashModal() {
    if (!reservation) return;
    const out = reservation.payment_summary?.outstanding
      ? parseDecimalValue(reservation.payment_summary.outstanding)
      : 0;
    setCashAmount(out > 0 ? out.toFixed(2) : "");
    setCashNotes("");
    setCashModalOpen(true);
  }

  async function handleCashPayment() {
    if (!reservation || !cashAmount) return;
    const amt = parseFloat(cashAmount);
    if (isNaN(amt) || amt <= 0) {
      setSnackbar({ open: true, message: "Enter a valid amount", type: "error" });
      return;
    }
    setCashSubmitting(true);
    try {
      await recordCashPayment(reservation._id, amt, currency, cashNotes || undefined);
      setSnackbar({ open: true, message: "Cash payment recorded successfully", type: "success" });
      setCashModalOpen(false);
      loadReservation();
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || "Failed to record cash payment", type: "error" });
    } finally {
      setCashSubmitting(false);
    }
  }

  function openMobileModal() {
    if (!reservation) return;
    const out = reservation.payment_summary?.outstanding
      ? parseDecimalValue(reservation.payment_summary.outstanding)
      : 0;
    setMobileAmount(out > 0 ? out.toFixed(2) : "");
    setMobilePhone(reservation.driver_snapshot?.phone || "");
    setMobileMethod("ecocash");
    setMobileModalOpen(true);
  }

  async function handleMobilePayment() {
    if (!reservation || !mobilePhone || !mobileAmount) return;
    const amt = parseFloat(mobileAmount);
    if (isNaN(amt) || amt <= 0) {
      setSnackbar({ open: true, message: "Enter a valid amount", type: "error" });
      return;
    }
    if (!/^\+?[0-9]{7,15}$/.test(mobilePhone.replace(/\s/g, ""))) {
      setSnackbar({ open: true, message: "Enter a valid phone number", type: "error" });
      return;
    }
    setMobileSubmitting(true);
    try {
      await initiateMobileMoneyPayment(reservation._id, mobilePhone, mobileMethod, amt, currency);
      setSnackbar({ open: true, message: `${mobileMethod === "ecocash" ? "EcoCash" : mobileMethod === "telecash" ? "TeleCash" : "OneMoney"} payment initiated — awaiting customer confirmation`, type: "success" });
      setMobileModalOpen(false);
      setTimeout(loadReservation, 3000);
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || "Failed to initiate mobile payment", type: "error" });
    } finally {
      setMobileSubmitting(false);
    }
  }

  async function handlePaynow() {
    if (!reservation) return;
    setPaynowLoading(true);
    try {
      const result = await initiateOnlinePayment(reservation._id, outstanding, currency);
      const url = result?.redirectUrl || result?.redirectLink || result?.url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
        setSnackbar({ open: true, message: "Paynow page opened — complete payment in the new tab", type: "success" });
        setTimeout(loadReservation, 5000);
      } else {
        setSnackbar({ open: true, message: "Payment initiated but no redirect URL was returned", type: "error" });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || "Failed to initiate Paynow payment", type: "error" });
    } finally {
      setPaynowLoading(false);
    }
  }

  // ===== Render loading / error =====
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F0F6FF]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#00AEEF] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="flex min-h-screen bg-[#F0F6FF]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-700 font-medium">{error || "Reservation not found"}</p>
          <button
            onClick={() => navigate("/admin-reservations")}
            className="px-4 py-2 bg-[#0A1628] text-white rounded-lg text-sm"
          >
            Back to Reservations
          </button>
        </div>
      </div>
    );
  }

  // ===== Derived values =====
  const statusCfg = STATUS_CONFIG[reservation.status] || { label: reservation.status, bg: "bg-gray-100", text: "text-gray-600" };
  const nextStatuses = STATUS_TRANSITIONS[reservation.status as ReservationStatus] || [];
  const pickupCoords = getBranchCoords(reservation.pickup?.branch_id);
  const dropoffCoords = getBranchCoords(reservation.dropoff?.branch_id);
  const hasCoords = !!(pickupCoords || dropoffCoords || trackerLocation);

  // Vehicle info
  const vehicleRef = typeof reservation.vehicle_id === "object" && reservation.vehicle_id !== null
    ? reservation.vehicle_id as IVehicleRef
    : null;
  const vehicleModelRef = typeof reservation.vehicle_model_id === "object" && reservation.vehicle_model_id !== null
    ? reservation.vehicle_model_id as IVehicleModelRef
    : null;

  const mapCenter: [number, number] = trackerLocation
    ? [trackerLocation.latitude, trackerLocation.longitude]
    : pickupCoords || dropoffCoords || [-17.8292, 31.0522]; // Harare default

  const mapKey = reservation._id + (trackerLocation ? "t" : "n");

  // Pricing
  const grandTotal = reservation.pricing?.grand_total
    ? parseDecimalValue(reservation.pricing.grand_total)
    : 0;
  const paidTotal = reservation.payment_summary?.paid_total
    ? parseDecimalValue(reservation.payment_summary.paid_total)
    : 0;
  const outstanding = reservation.payment_summary?.outstanding
    ? parseDecimalValue(reservation.payment_summary.outstanding)
    : grandTotal - paidTotal;
  const currency = reservation.pricing?.currency || "USD";
  const payStatusCfg = PAY_STATUS_CONFIG[reservation.payment_summary?.status || "unpaid"] || PAY_STATUS_CONFIG.unpaid;

  // Duration
  let durationDays: number | null = null;
  if (reservation.pickup?.at && reservation.dropoff?.at) {
    try {
      durationDays = calculateTotalDays(reservation.pickup.at, reservation.dropoff.at);
    } catch {}
  }

  // Cancelled / no_show flags
  const isTerminalBad = ["cancelled", "no_show"].includes(reservation.status);

  // Timeline step index
  const timelineIdx = TIMELINE_STATUSES.indexOf(reservation.status as ReservationStatus);

  return (
    <div className="flex min-h-screen bg-[#F0F6FF]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => navigate("/admin-reservations")}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#0A1628] text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-[#0A1628] font-mono">{reservation.code}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Created {formatDateTime(reservation.created_at)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={loadReservation}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {nextStatuses.length > 0 && (
              <button
                onClick={() => setStatusModalOpen(true)}
                className="px-3 py-2 bg-[#1A5FA8] text-white rounded-lg text-sm font-medium hover:bg-[#1A5FA8]/90 flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                Change Status
              </button>
            )}
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="p-2 text-red-400 border border-red-200 rounded-lg hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-4">
          <div className="flex gap-1">
            {(["overview", "map", "pricing"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  tab === t
                    ? "border-[#00AEEF] text-[#00AEEF]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "map" ? "Map & Tracking" : t === "pricing" ? "Pricing & Payments" : "Overview"}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <main className="flex-1 p-4 md:p-6">
          {/* ===== TAB: OVERVIEW ===== */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Status Timeline */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-[#0A1628] text-sm mb-4">Reservation Timeline</h2>
                <div className="flex items-center gap-0 overflow-x-auto pb-2">
                  {TIMELINE_STATUSES.map((s, i) => {
                    const isCurrent = s === reservation.status && !isTerminalBad;
                    const isDone = timelineIdx > i && !isTerminalBad;
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <React.Fragment key={s}>
                        <div className="flex flex-col items-center min-w-[80px]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 ${
                            isCurrent
                              ? "bg-[#00AEEF] border-[#00AEEF] text-white"
                              : isDone
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-gray-100 border-gray-200 text-gray-400"
                          }`}>
                            {isDone ? <CheckCircle className="w-4 h-4" /> : i + 1}
                          </div>
                          <p className={`text-xs mt-1.5 text-center font-medium ${isCurrent ? "text-[#00AEEF]" : isDone ? "text-emerald-600" : "text-gray-400"}`}>
                            {cfg?.label || s}
                          </p>
                        </div>
                        {i < TIMELINE_STATUSES.length - 1 && (
                          <div className={`flex-1 h-0.5 min-w-[20px] mt-[-16px] ${isDone ? "bg-emerald-500" : "bg-gray-200"}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                {isTerminalBad && (
                  <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                    <AlertCircle className="w-4 h-4" />
                    {statusCfg.label}
                  </div>
                )}
              </div>

              {/* Customer Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-[#0A1628] text-sm mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00AEEF]" /> Customer
                  </span>
                  {reservation.user_id && (
                    <button
                      onClick={() => {
                        const uid = typeof reservation.user_id === "object" && reservation.user_id !== null
                          ? (reservation.user_id as IUserRef)._id
                          : reservation.user_id as string;
                        if (uid) navigate(`/admin/user-profiles/${uid}`);
                      }}
                      className="flex items-center gap-1 text-xs text-[#00AEEF] hover:underline font-medium"
                    >
                      View Profile <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </h2>
                {(() => {
                  const snap = reservation.driver_snapshot as any;
                  const userRef = typeof reservation.user_id === "object" && reservation.user_id !== null
                    ? reservation.user_id as IUserRef
                    : null;
                  const lic  = snap?.driver_license ?? snap?.license ?? snap?.driverLicense ?? {};
                  const name  = snap?.full_name  ?? snap?.fullName  ?? snap?.name  ?? userRef?.full_name ?? null;
                  const email = snap?.email ?? snap?.email_address ?? userRef?.email ?? null;
                  const phone = snap?.phone ?? snap?.phone_number  ?? snap?.phoneNumber ?? null;
                  const licNo     = lic?.number  ?? lic?.license_number ?? lic?.licenseNumber ?? null;
                  const licClass  = lic?.class   ?? lic?.category ?? null;
                  const licCtry   = lic?.country ?? lic?.country_code ?? null;
                  const licExpiry = lic?.expires_at ?? lic?.expiry ?? lic?.expiry_date ?? null;
                  const licVerified = lic?.verified ?? false;
                  return (
                    <div className="space-y-3">
                      <InfoRow label="Full Name" value={name} />
                      <InfoRow label="Email" value={email} />
                      <InfoRow label="Phone" value={phone} />
                      {/* Walk-in badge */}
                      {!reservation.user_id && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
                          <User className="w-3 h-3" /> Walk-in customer (no account)
                        </div>
                      )}
                      <div className="border-t border-gray-100 pt-3 mt-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" /> Driver License
                        </p>
                        <InfoRow label="Number"  value={licNo} />
                        <InfoRow label="Class"   value={licClass} />
                        <InfoRow label="Country" value={licCtry} />
                        <InfoRow label="Expires" value={formatDate(licExpiry)} />
                        <div className="flex items-center justify-between text-sm py-1.5">
                          <span className="text-gray-500">Verified</span>
                          {licVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500 text-xs">
                              <X className="w-3.5 h-3.5" /> No
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Vehicle Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-[#0A1628] text-sm mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#00AEEF]" /> Vehicle
                  </span>
                  {vehicleRef && (
                    <button
                      onClick={() => navigate("/admin-vehicles", { state: { vehicleId: vehicleRef._id } })}
                      className="flex items-center gap-1 text-xs text-[#00AEEF] hover:underline font-medium"
                    >
                      View Vehicle <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </h2>
                <div className="space-y-1">
                  {vehicleModelRef && (
                    <>
                      <InfoRow label="Make" value={vehicleModelRef.make} />
                      <InfoRow label="Model" value={vehicleModelRef.model} />
                      <InfoRow label="Year" value={vehicleModelRef.year?.toString()} />
                      <InfoRow label="Class" value={vehicleModelRef.class} />
                      {vehicleModelRef.transmission && <InfoRow label="Transmission" value={vehicleModelRef.transmission} />}
                      {vehicleModelRef.fuel_type && <InfoRow label="Fuel" value={vehicleModelRef.fuel_type} />}
                      {vehicleModelRef.seats != null && <InfoRow label="Seats" value={vehicleModelRef.seats.toString()} />}
                      {vehicleModelRef.doors != null && <InfoRow label="Doors" value={vehicleModelRef.doors.toString()} />}
                    </>
                  )}
                  {vehicleRef && (
                    <>
                      <div className="border-t border-gray-100 pt-2 mt-2" />
                      {vehicleRef.plate_number && <InfoRow label="Plate" value={vehicleRef.plate_number} />}
                      {vehicleRef.vin && <InfoRow label="VIN" value={vehicleRef.vin} />}
                      {vehicleRef.color && <InfoRow label="Color" value={vehicleRef.color} />}
                      {vehicleRef.odometer_km != null && (
                        <InfoRow label="Odometer" value={`${vehicleRef.odometer_km.toLocaleString()} km`} />
                      )}
                    </>
                  )}
                  {/* Features */}
                  {vehicleModelRef?.features && vehicleModelRef.features.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500 mb-1.5">Features</p>
                      <div className="flex flex-wrap gap-1.5">
                        {vehicleModelRef.features.map((f: string) => (
                          <span key={f} className="px-2 py-0.5 bg-[#00AEEF]/10 text-[#00AEEF] text-xs rounded-full font-medium">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Card */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-[#0A1628] text-sm mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00AEEF]" /> Booking Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                  <InfoRow label="Code" value={reservation.code} />
                  <InfoRow label="Created" value={formatDateTime(reservation.created_at)} />
                  <InfoRow label="Channel" value={reservation.created_channel} />
                  <InfoRow label="Pickup Branch" value={getBranchName(reservation.pickup?.branch_id)} />
                  <InfoRow label="Pickup Time" value={formatDateTime(reservation.pickup?.at)} />
                  <InfoRow label="Dropoff Branch" value={getBranchName(reservation.dropoff?.branch_id)} />
                  <InfoRow label="Dropoff Time" value={formatDateTime(reservation.dropoff?.at)} />
                  {durationDays != null && <InfoRow label="Duration" value={`${durationDays} day${durationDays !== 1 ? "s" : ""}`} />}
                </div>
                {reservation.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                    <p>{reservation.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== TAB: MAP & TRACKING ===== */}
          {tab === "map" && (
            <div className="space-y-4">
              {/* Tracker info row */}
              {trackerLocation && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Navigation className="w-4 h-4" />
                    <span className="font-medium">Live Tracker</span>
                  </div>
                  {trackerLocation.at && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Last updated: {formatDateTime(trackerLocation.at)}</span>
                    </div>
                  )}
                  {trackerLocation.speed_kmh != null && (
                    <span className="text-gray-600">Speed: <strong>{trackerLocation.speed_kmh} km/h</strong></span>
                  )}
                  {trackerLocation.heading_deg != null && (
                    <span className="text-gray-600">Heading: <strong>{trackerLocation.heading_deg}°</strong></span>
                  )}
                </div>
              )}

              {trackerLoading && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#00AEEF] border-t-transparent" />
                  Loading tracker data...
                </div>
              )}

              {!hasCoords ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No location data available</p>
                  <p className="text-gray-400 text-sm mt-1">Coordinates for pickup/dropoff branches or vehicle tracker are not available</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="h-[400px]">
                      <MapContainer
                        key={mapKey}
                        center={mapCenter}
                        zoom={12}
                        className="h-full w-full"
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Pickup marker */}
                        {pickupCoords && (
                          <Marker position={pickupCoords} icon={greenIcon}>
                            <Popup>
                              <strong>Pickup:</strong> {getBranchName(reservation.pickup?.branch_id)}
                            </Popup>
                          </Marker>
                        )}

                        {/* Dropoff marker */}
                        {dropoffCoords && (
                          <Marker position={dropoffCoords} icon={redIcon}>
                            <Popup>
                              <strong>Dropoff:</strong> {getBranchName(reservation.dropoff?.branch_id)}
                            </Popup>
                          </Marker>
                        )}

                        {/* Vehicle marker */}
                        {trackerLocation && (
                          <Marker
                            position={[trackerLocation.latitude, trackerLocation.longitude]}
                            icon={blueIcon}
                          >
                            <Popup>
                              <strong>Vehicle Now</strong>
                              {trackerLocation.at && (
                                <><br />Last seen: {formatDateTime(trackerLocation.at)}</>
                              )}
                            </Popup>
                          </Marker>
                        )}

                        {/* OSRM routes or fallback */}
                        {routePickupToVehicle && routePickupToVehicle.length > 0 && (
                          <Polyline positions={routePickupToVehicle} color="#00AEEF" weight={3} />
                        )}
                        {routeVehicleToDropoff && routeVehicleToDropoff.length > 0 && (
                          <Polyline positions={routeVehicleToDropoff} color="#0A1628" weight={3} />
                        )}
                        {routePickupToDropoff && routePickupToDropoff.length > 0 && (
                          <Polyline positions={routePickupToDropoff} color="#00AEEF" weight={3} />
                        )}

                        {/* Fallback straight lines */}
                        {!routePickupToVehicle && !routePickupToDropoff && !routeLoading && (
                          <>
                            {pickupCoords && trackerLocation && (
                              <Polyline
                                positions={[pickupCoords, [trackerLocation.latitude, trackerLocation.longitude]]}
                                color="#00AEEF"
                                weight={2}
                                dashArray="6 6"
                              />
                            )}
                            {trackerLocation && dropoffCoords && (
                              <Polyline
                                positions={[[trackerLocation.latitude, trackerLocation.longitude], dropoffCoords]}
                                color="#0A1628"
                                weight={2}
                                dashArray="6 6"
                              />
                            )}
                            {!trackerLocation && pickupCoords && dropoffCoords && (
                              <Polyline
                                positions={[pickupCoords, dropoffCoords]}
                                color="#666"
                                weight={2}
                                dashArray="6 6"
                              />
                            )}
                          </>
                        )}
                      </MapContainer>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Legend</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-gray-600">Pickup</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-gray-600">Vehicle (Live)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-gray-600">Dropoff</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== TAB: PRICING & PAYMENTS ===== */}
          {tab === "pricing" && (
            <div className="space-y-5">
              {/* Payment status */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${payStatusCfg.bg} ${payStatusCfg.text}`}>
                      {payStatusCfg.label}
                    </span>
                  </div>
                  {reservation.payment_summary?.last_payment_at && (
                    <div className="text-sm text-gray-500">
                      Last payment: {formatDateTime(reservation.payment_summary.last_payment_at)}
                    </div>
                  )}
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                  <AmountCard
                    label="Grand Total"
                    value={formatCurrencyDisplay(grandTotal, currency)}
                    highlight
                  />
                  <AmountCard
                    label="Paid"
                    value={formatCurrencyDisplay(paidTotal, currency)}
                    color="text-emerald-600"
                  />
                  <AmountCard
                    label="Outstanding"
                    value={formatCurrencyDisplay(outstanding, currency)}
                    color={outstanding > 0 ? "text-red-600" : "text-gray-500"}
                  />
                </div>
              </div>

              {/* Payment Actions */}
              {!["paid", "cancelled"].includes(reservation.payment_summary?.status || "unpaid") && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-[#0A1628] mb-1 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#00AEEF]" /> Record Payment
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Outstanding: <strong className="text-red-600">{formatCurrencyDisplay(outstanding, currency)}</strong> — choose a payment method to process or record.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Cash */}
                    <button
                      onClick={openCashModal}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                        <Banknote className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm text-emerald-700">Cash</p>
                        <p className="text-xs text-emerald-500 mt-0.5">Record walk-in payment</p>
                      </div>
                    </button>

                    {/* Mobile Money */}
                    <button
                      onClick={openMobileModal}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[#00AEEF]/30 bg-[#00AEEF]/5 hover:bg-[#00AEEF]/10 hover:border-[#00AEEF] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#00AEEF]/10 group-hover:bg-[#00AEEF]/20 flex items-center justify-center transition-colors">
                        <Smartphone className="w-5 h-5 text-[#00AEEF]" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm text-[#0A1628]">Mobile Money</p>
                        <p className="text-xs text-gray-400 mt-0.5">EcoCash · TeleCash · OneMoney</p>
                      </div>
                    </button>

                    {/* Paynow */}
                    <button
                      onClick={handlePaynow}
                      disabled={paynowLoading}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-400 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                        {paynowLoading
                          ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                          : <ExternalLink className="w-5 h-5 text-indigo-600" />
                        }
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm text-indigo-700">Paynow / Card</p>
                        <p className="text-xs text-indigo-400 mt-0.5">Redirect to payment page</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Breakdown */}
              {reservation.pricing?.breakdown && reservation.pricing.breakdown.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#00AEEF]" /> Price Breakdown
                    </h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-2.5 text-xs text-gray-500 font-medium">Item</th>
                        <th className="text-right px-5 py-2.5 text-xs text-gray-500 font-medium">Qty</th>
                        <th className="text-right px-5 py-2.5 text-xs text-gray-500 font-medium">Unit Price</th>
                        <th className="text-right px-5 py-2.5 text-xs text-gray-500 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservation.pricing.breakdown.map((item, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-5 py-3 text-gray-700">{item.label}</td>
                          <td className="px-5 py-3 text-right text-gray-600">{item.quantity}</td>
                          <td className="px-5 py-3 text-right text-gray-600">
                            {formatCurrencyDisplay(item.unit_amount, currency)}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-gray-800">
                            {formatCurrencyDisplay(item.total, currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Fees */}
              {reservation.pricing?.fees && reservation.pricing.fees.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">Fees</h3>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {reservation.pricing.fees.map((fee, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="px-5 py-3 text-gray-600">{fee.code}</td>
                          <td className="px-5 py-3 text-right font-medium">{formatCurrencyDisplay(fee.amount, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Taxes */}
              {reservation.pricing?.taxes && reservation.pricing.taxes.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">Taxes</h3>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {reservation.pricing.taxes.map((tax, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="px-5 py-3 text-gray-600">{tax.code}</td>
                          <td className="px-5 py-3 text-gray-500">{(tax.rate * 100).toFixed(1)}%</td>
                          <td className="px-5 py-3 text-right font-medium">{formatCurrencyDisplay(tax.amount, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Discounts */}
              {reservation.pricing?.discounts && reservation.pricing.discounts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">Discounts</h3>
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      {reservation.pricing.discounts.map((disc, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="px-5 py-3 text-gray-600">{disc.promo_code_id || "Discount"}</td>
                          <td className="px-5 py-3 text-right font-medium text-emerald-600">
                            -{disc.amount ? formatCurrencyDisplay(disc.amount, currency) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Status Change Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setStatusModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <button onClick={() => setStatusModalOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-600" />
            </button>
            <h3 className="text-lg font-bold text-[#0A1628] mb-1">Change Status</h3>
            <p className="text-sm text-gray-500 mb-4">
              Current:{" "}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                {statusCfg.label}
              </span>
            </p>
            {nextStatuses.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No transitions available.</p>
            ) : (
              <div className="space-y-2">
                {nextStatuses.map((s) => {
                  const cfg = STATUS_CONFIG[s] || { label: s, bg: "bg-gray-100", text: "text-gray-700" };
                  return (
                    <button
                      key={s}
                      disabled={statusChanging}
                      onClick={() => handleStatusChange(s)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-transparent hover:border-[#00AEEF] transition-all ${cfg.bg} ${statusChanging ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className={`font-medium text-sm ${cfg.text}`}>{cfg.label}</span>
                      <ArrowRight className={`w-4 h-4 ${cfg.text}`} />
                    </button>
                  );
                })}
              </div>
            )}
            {statusChanging && (
              <div className="flex items-center justify-center mt-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#00AEEF] border-t-transparent" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteDialogOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Reservation</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete reservation <strong>{reservation.code}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Condition / Incident Modal */}
      {conditionModalOpen && conditionTargetStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConditionModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: "92vh" }}>

            {/* Header */}
            <div className={`px-6 py-5 flex items-center gap-4 flex-shrink-0 ${conditionTargetStatus === "checked_out" ? "bg-gradient-to-r from-indigo-700 to-indigo-500" : "bg-gradient-to-r from-cyan-700 to-cyan-500"}`}>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                {conditionTargetStatus === "checked_out" ? <Car className="w-5 h-5 text-white" /> : <ClipboardList className="w-5 h-5 text-white" />}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">
                  {conditionTargetStatus === "checked_out" ? "Vehicle Check-Out Inspection" : "Vehicle Check-In Inspection"}
                </h3>
                <p className="text-white/70 text-xs mt-0.5">
                  {conditionTargetStatus === "checked_out"
                    ? "Record vehicle condition before handing over to customer"
                    : "Record vehicle condition upon return from customer"}
                </p>
              </div>
              <button onClick={() => setConditionModalOpen(false)} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Odometer + Fuel */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    <Gauge className="w-3.5 h-3.5 text-[#00AEEF]" /> Odometer (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={odometerReading}
                    onChange={(e) => setOdometerReading(e.target.value)}
                    placeholder="e.g. 45200"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF]"
                  />
                  {vehicleRef?.odometer_km != null && (
                    <p className="text-xs text-gray-400 mt-1">Last recorded: {vehicleRef.odometer_km.toLocaleString()} km</p>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    <Fuel className="w-3.5 h-3.5 text-[#00AEEF]" /> Fuel Level
                  </label>
                  <div className="relative">
                    <select
                      value={fuelLevel}
                      onChange={(e) => setFuelLevel(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] bg-white"
                    >
                      <option value="full">Full (100%)</option>
                      <option value="three_quarter">¾ Full (75%)</option>
                      <option value="half">Half (50%)</option>
                      <option value="quarter">¼ Full (25%)</option>
                      <option value="reserve">Reserve / Low</option>
                      <option value="empty">Empty</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Vehicle Condition */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Vehicle Condition</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: "excellent", label: "Excellent", color: "border-emerald-500 bg-emerald-50 text-emerald-700" },
                    { val: "good",      label: "Good",      color: "border-blue-500 bg-blue-50 text-blue-700" },
                    { val: "fair",      label: "Fair",      color: "border-amber-500 bg-amber-50 text-amber-700" },
                    { val: "damaged",   label: "Damaged",   color: "border-red-500 bg-red-50 text-red-700" },
                  ].map(({ val, label, color }) => (
                    <button
                      key={val}
                      onClick={() => setVehicleCondition(val)}
                      className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${vehicleCondition === val ? color : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition notes */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">
                  Condition Notes <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="e.g. Minor scratch on rear bumper, interior clean"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF]"
                />
              </div>

              {/* Incident toggle */}
              <div className={`rounded-2xl border-2 p-4 transition-all ${reportIncident ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                <button
                  onClick={() => setReportIncident(!reportIncident)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${reportIncident ? "bg-red-100" : "bg-gray-200"}`}>
                      <TriangleAlert className={`w-4 h-4 ${reportIncident ? "text-red-600" : "text-gray-500"}`} />
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold text-sm ${reportIncident ? "text-red-700" : "text-gray-700"}`}>Report an Incident</p>
                      <p className="text-xs text-gray-400 mt-0.5">Damage, accident, breakdown or other issue</p>
                    </div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${reportIncident ? "bg-red-500" : "bg-gray-300"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${reportIncident ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </button>

                {reportIncident && (
                  <div className="mt-4 space-y-4 pt-4 border-t border-red-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Incident Type</label>
                        <div className="relative">
                          <select
                            value={incidentType}
                            onChange={(e) => setIncidentType(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                          >
                            <option value="accident">Accident</option>
                            <option value="damage">Damage</option>
                            <option value="theft">Theft</option>
                            <option value="breakdown">Breakdown</option>
                            <option value="violation">Traffic Violation</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Severity</label>
                        <div className="flex gap-2">
                          {(["minor", "moderate", "major"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => setIncidentSeverity(s)}
                              className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${
                                incidentSeverity === s
                                  ? s === "minor" ? "border-amber-400 bg-amber-50 text-amber-700"
                                    : s === "moderate" ? "border-orange-400 bg-orange-50 text-orange-700"
                                    : "border-red-500 bg-red-100 text-red-700"
                                  : "border-gray-200 text-gray-500"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">Description *</label>
                      <textarea
                        rows={2}
                        value={incidentDesc}
                        onChange={(e) => setIncidentDesc(e.target.value)}
                        placeholder="Describe what happened…"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1.5">
                        Estimated Cost ({currency}) <span className="text-gray-400 font-normal normal-case">(optional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currency}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={incidentCost}
                          onChange={(e) => setIncidentCost(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => setConditionModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConditionSubmit}
                disabled={conditionSubmitting || (reportIncident && !incidentDesc.trim())}
                className={`px-6 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all ${conditionTargetStatus === "checked_out" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-cyan-600 hover:bg-cyan-700"}`}
              >
                {conditionSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                {conditionTargetStatus === "checked_out" ? <Car className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
                {conditionSubmitting
                  ? "Processing…"
                  : conditionTargetStatus === "checked_out"
                  ? "Confirm Check-Out"
                  : "Confirm Check-In"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Payment Modal */}
      {cashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCashModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <button onClick={() => setCashModalOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Banknote className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-[#0A1628]">Record Cash Payment</h3>
                <p className="text-xs text-gray-500">Payment collected in-person</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Amount ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{currency}</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Outstanding: <strong>{formatCurrencyDisplay(outstanding, currency)}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={cashNotes}
                  onChange={(e) => setCashNotes(e.target.value)}
                  placeholder="e.g. Paid at front desk by John"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setCashModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCashPayment}
                disabled={cashSubmitting || !cashAmount}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {cashSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                <Banknote className="w-4 h-4" />
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Money Modal */}
      {mobileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <button onClick={() => setMobileModalOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#00AEEF]/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-[#00AEEF]" />
              </div>
              <div>
                <h3 className="font-bold text-[#0A1628]">Mobile Money Payment</h3>
                <p className="text-xs text-gray-500">Send push payment request to customer</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Method chips */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Payment Method
                </label>
                <div className="flex gap-2">
                  {(["ecocash", "telecash", "onemoney"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMobileMethod(m)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${
                        mobileMethod === m
                          ? "border-[#00AEEF] bg-[#00AEEF]/10 text-[#00AEEF]"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {m === "ecocash" ? "EcoCash" : m === "telecash" ? "TeleCash" : "OneMoney"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Customer Phone Number
                </label>
                <input
                  type="tel"
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                  placeholder="+263 77 000 0000"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Amount ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{currency}</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={mobileAmount}
                    onChange={(e) => setMobileAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Outstanding: <strong>{formatCurrencyDisplay(outstanding, currency)}</strong>
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                A push payment request will be sent to the customer's phone. They must approve it on their handset to complete the transaction.
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setMobileModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMobilePayment}
                disabled={mobileSubmitting || !mobilePhone || !mobileAmount}
                className="px-5 py-2 bg-[#0A1628] text-white rounded-xl text-sm font-semibold hover:bg-[#0A1628]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {mobileSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                <Smartphone className="w-4 h-4" />
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium ${snackbar.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {snackbar.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {snackbar.message}
          <button onClick={() => setSnackbar((s) => ({ ...s, open: false }))} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ===== Sub-components =====
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="text-gray-500 flex-shrink-0 min-w-[90px]">{label}</span>
      <span className="text-gray-800 font-medium text-right break-all">{value || "—"}</span>
    </div>
  );
}

function AmountCard({
  label,
  value,
  highlight,
  color,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "border-[#00AEEF]/30 bg-[#00AEEF]/5" : "border-gray-200 bg-gray-50"}`}>
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className={`text-xl font-bold ${color || (highlight ? "text-[#0A1628]" : "text-gray-700")}`}>{value}</p>
    </div>
  );
}
