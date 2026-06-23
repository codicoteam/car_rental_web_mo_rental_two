import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReceptionistSideBar from "../../../components/ReceptionistSideBar";
import {
  ChevronLeft, Star, MapPin, DollarSign, Calendar, Phone, Mail,
  AlertCircle, RefreshCw, Languages, Briefcase, IdCard, Verified,
  Users, CheckCircle, XCircle, Clock as ClockIcon, AlertTriangle,
  UserCheck, Car, CreditCard, Hash, MessageCircle, Menu, Shield,
} from "lucide-react";
import DriverProfileService, { type DriverProfile } from "../../../Services/adminAndManager/driver_profiles_service";
import { fetchAdminDriverBookings, type IDriverBooking } from "../../../Services/adminAndManager/driver_booking_service";

type PageTab = "profile" | "bookings";

const BOOKING_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  requested:   { bg: "bg-amber-100",   text: "text-amber-800" },
  accepted:    { bg: "bg-blue-100",    text: "text-blue-800" },
  in_progress: { bg: "bg-indigo-100",  text: "text-indigo-800" },
  completed:   { bg: "bg-emerald-100", text: "text-emerald-800" },
  cancelled:   { bg: "bg-red-100",     text: "text-red-800" },
  rejected:    { bg: "bg-gray-100",    text: "text-gray-700" },
};

const ManagerDriverProfileDetailPage: React.FC = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PageTab>("profile");

  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loadingDriver, setLoadingDriver] = useState(true);
  const [driverError, setDriverError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<IDriverBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const loadDriver = useCallback(async () => {
    if (!driverId) return;
    setLoadingDriver(true);
    setDriverError(null);
    try {
      const res = await DriverProfileService.getDriverProfileById(driverId);
      if (res.success && res.data) {
        setDriver(res.data as unknown as DriverProfile);
      } else {
        throw new Error("Driver not found");
      }
    } catch (e: any) {
      setDriverError(e.message || "Failed to load driver");
    } finally {
      setLoadingDriver(false);
    }
  }, [driverId]);

  const loadBookings = useCallback(async () => {
    if (!driverId) return;
    setLoadingBookings(true);
    setBookingsError(null);
    try {
      const res = await fetchAdminDriverBookings();
      const all: IDriverBooking[] = res.data || res.items || [];
      setBookings(all.filter(b => b.driver_profile_id?._id === driverId));
    } catch (e: any) {
      setBookingsError(e.message || "Failed to load bookings");
    } finally {
      setLoadingBookings(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadDriver();
    loadBookings();
  }, [loadDriver, loadBookings]);

  // ── helpers ──
  const fmt = (d?: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };
  const fmtDT = (d?: string | null) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  const fmtCurrency = (n?: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);

  const getRatingStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(full)].map((_, i) => <Star key={`f${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
        {half && (
          <div className="relative w-4 h-4">
            <Star className="w-4 h-4 text-yellow-400" />
            <div className="absolute inset-0 overflow-hidden w-1/2"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /></div>
          </div>
        )}
        {[...Array(empty)].map((_, i) => <Star key={`e${i}`} className="w-4 h-4 text-gray-300" />)}
      </div>
    );
  };

  const getStatusBadge = (d: DriverProfile) => {
    if (d.status === "approved" && d.is_available)  return { text: "Available",  bg: "bg-emerald-100", text_c: "text-emerald-800", Icon: CheckCircle };
    if (d.status === "approved" && !d.is_available) return { text: "Busy",       bg: "bg-amber-100",   text_c: "text-amber-800",   Icon: ClockIcon };
    if (d.status === "pending")                     return { text: "Pending",    bg: "bg-orange-100",  text_c: "text-orange-800",  Icon: AlertTriangle };
    return                                                 { text: "Rejected",   bg: "bg-red-100",     text_c: "text-red-800",     Icon: XCircle };
  };

  // ── booking stats ──
  const bookingStats = {
    total: bookings.length,
    completed: bookings.filter(b => b.status === "completed").length,
    active: bookings.filter(b => ["accepted", "in_progress"].includes(b.status ?? "")).length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
    totalEarned: bookings
      .filter(b => b.status === "completed")
      .reduce((s, b) => s + parseFloat(b.pricing?.estimated_total_amount?.$numberDecimal ?? "0"), 0),
  };

  // ── loading / error states ──
  if (loadingDriver) {
    return (
      <div className="flex h-screen bg-gray-50">
        <ReceptionistSideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1EA2E4] mx-auto mb-4" />
            <p className="text-gray-600">Loading driver profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (driverError || !driver) {
    return (
      <div className="flex h-screen bg-gray-50">
        <ReceptionistSideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-800 mb-2">Driver not found</p>
            <p className="text-gray-500 mb-6 text-sm">{driverError}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={loadDriver} className="px-5 py-2 bg-[#1EA2E4] text-white rounded-lg font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
              <button onClick={() => navigate("/receptionist-driver-profiles")} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium">
                Back to List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const badge = getStatusBadge(driver);
  const BadgeIcon = badge.Icon;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ReceptionistSideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigate("/receptionist-driver-profiles")}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Driver Profiles</span>
              </button>
              <span className="text-gray-300 hidden sm:inline">/</span>
              <span className="font-semibold text-gray-800 text-sm hidden sm:inline truncate max-w-xs">{driver.display_name}</span>
            </div>
            <button onClick={() => { loadDriver(); loadBookings(); }} className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-[#1EA2E4] to-[#0d7fc4] px-6 py-8">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/20 border-2 border-white/50 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                {driver.profile_image ? (
                  <img src={driver.profile_image} alt={driver.display_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-3xl font-bold">{(driver.display_name ?? "?").charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white">{driver.display_name}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${badge.bg} ${badge.text_c}`}>
                    <BadgeIcon className="w-3 h-3" /> {badge.text}
                  </span>
                </div>
                <p className="text-white/80 mb-2">{driver.user_id?.full_name ?? 'N/A'}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                  <div className="flex items-center gap-1">
                    {getRatingStars(driver.rating_average)}
                    <span className="ml-1">{driver.rating_average.toFixed(1)} ({driver.rating_count} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{driver.base_city}, {driver.base_region}</div>
                  <div className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" />{fmtCurrency(driver.hourly_rate)}/hr</div>
                  <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" />{driver.years_experience} yrs exp</div>
                </div>
              </div>
            </div>

            {/* Quick booking stats */}
            <div className="max-w-5xl mx-auto mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Bookings", val: bookingStats.total, color: "text-white" },
                { label: "Completed", val: bookingStats.completed, color: "text-emerald-300" },
                { label: "Active", val: bookingStats.active, color: "text-amber-300" },
                { label: "Total Earned", val: `$${bookingStats.totalEarned.toFixed(0)}`, color: "text-cyan-300" },
              ].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                  <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                  <p className="text-white/70 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 sticky top-[73px] z-10">
            <div className="max-w-5xl mx-auto px-6 flex gap-0">
              {([
                { key: "profile",  label: "Profile",  Icon: UserCheck },
                { key: "bookings", label: `Bookings (${bookings.length})`, Icon: Car },
              ] as { key: PageTab; label: string; Icon: any }[]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-[#1EA2E4] text-[#1EA2E4]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.Icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── PROFILE TAB ── */}
          {activeTab === "profile" && (
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Contact */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-[#1EA2E4]" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium text-gray-800">{driver.user_id?.email ?? 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-[#1EA2E4]" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm font-medium text-gray-800">{driver.user_id?.phone ?? 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-[#1EA2E4]" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm font-medium text-gray-800">{driver.base_city}, {driver.base_region}, {driver.base_country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-[#1EA2E4]" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Joined</p>
                          <p className="text-sm font-medium text-gray-800">{fmt(driver.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">About</h3>
                    <p className="text-gray-700 leading-relaxed text-sm">{driver.bio || 'No bio provided.'}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {driver.languages.map(l => (
                        <span key={l} className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium flex items-center gap-1">
                          <Languages className="w-3 h-3" /> {l}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* License */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Driver License</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Number</p>
                        <p className="text-sm font-mono font-semibold mt-0.5">{driver.driver_license?.number ?? 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Class</p>
                        <p className="text-sm font-semibold mt-0.5">{driver.driver_license?.class ?? 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Country</p>
                        <p className="text-sm font-semibold mt-0.5">{driver.driver_license?.country ?? 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Expires</p>
                        <p className="text-sm font-semibold mt-0.5">{fmt(driver.driver_license?.expires_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {driver.driver_license?.verified ? (
                            <><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-sm font-semibold text-emerald-600">Verified</span></>
                          ) : (
                            <><AlertCircle className="w-4 h-4 text-amber-500" /><span className="text-sm font-semibold text-amber-600">Unverified</span></>
                          )}
                        </div>
                      </div>
                    </div>
                    {driver.driver_license?.imageUrl && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">License Image</p>
                        <img src={driver.driver_license.imageUrl} alt="Driver License" className="rounded-lg border border-gray-200 max-h-48 object-contain" />
                      </div>
                    )}
                  </div>

                  {/* Identity Document */}
                  {driver.identity_document && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Identity Document</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                          <IdCard className="w-4 h-4 text-[#1EA2E4]" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Document Type</p>
                          <p className="text-sm font-semibold capitalize">
                            {(driver.identity_document.type ?? 'N/A').replace(/_/g, ' ')}
                          </p>
                        </div>
                      </div>
                      {driver.identity_document.imageUrl && (
                        <img src={driver.identity_document.imageUrl} alt="Identity Document" className="rounded-lg border border-gray-200 max-h-48 object-contain" />
                      )}
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-6">
                  {/* Rate card */}
                  <div className="bg-gradient-to-br from-[#1EA2E4] to-[#0d7fc4] rounded-xl p-6 text-white shadow-lg">
                    <p className="text-white/70 text-sm mb-1">Hourly Rate</p>
                    <p className="text-3xl font-bold">{fmtCurrency(driver.hourly_rate)}</p>
                    <p className="text-white/70 text-sm mt-0.5">per hour</p>
                    <div className="mt-4 pt-4 border-t border-white/20 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/70">Experience</span>
                        <span className="font-semibold">{driver.years_experience} yrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Rating</span>
                        <span className="font-semibold">{driver.rating_average.toFixed(1)} ★</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Reviews</span>
                        <span className="font-semibold">{driver.rating_count}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Driver Status</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text_c}`}>
                          {badge.text}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Availability</span>
                        {driver.is_available ? (
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Available</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><XCircle className="w-3.5 h-3.5" /> Unavailable</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Approval */}
                  {driver.approved_by_admin && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                        <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Approval</span>
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Approved By</p>
                          <div className="flex items-center gap-2 mt-1">
                            <UserCheck className="w-4 h-4 text-gray-400" />
                            <p className="text-sm font-medium">{driver.approved_by_admin?.full_name ?? 'N/A'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Approved At</p>
                          <p className="text-sm font-medium">{fmt(driver.approved_at)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {driver.status === "rejected" && driver.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Rejection Reason
                      </h3>
                      <p className="text-sm text-red-600">{driver.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── BOOKINGS TAB ── */}
          {activeTab === "bookings" && (
            <div className="max-w-5xl mx-auto px-6 py-8">
              {/* Booking stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total", val: bookingStats.total, color: "text-gray-800", bg: "bg-blue-50" },
                  { label: "Completed", val: bookingStats.completed, color: "text-emerald-700", bg: "bg-emerald-50" },
                  { label: "Active", val: bookingStats.active, color: "text-amber-700", bg: "bg-amber-50" },
                  { label: "Cancelled", val: bookingStats.cancelled, color: "text-red-700", bg: "bg-red-50" },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center border border-gray-100`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {loadingBookings ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1EA2E4] mr-3" />
                  <p className="text-gray-600">Loading bookings...</p>
                </div>
              ) : bookingsError ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                  <p className="text-red-600 mb-4">{bookingsError}</p>
                  <button onClick={loadBookings} className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                  <Car className="w-20 h-20 text-gray-200 mb-4" />
                  <p className="text-gray-500 font-semibold text-lg">No bookings yet</p>
                  <p className="text-gray-400 text-sm mt-1">{driver.display_name} hasn't received any bookings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map(booking => {
                    const sc = BOOKING_STATUS_COLOR[booking.status ?? ""] ?? { bg: "bg-gray-100", text: "text-gray-700" };
                    const amt = booking.pricing?.estimated_total_amount?.$numberDecimal;
                    const hours = booking.pricing?.hours_requested;
                    const rateSnap = booking.pricing?.hourly_rate_snapshot?.$numberDecimal;
                    return (
                      <div key={booking._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        {/* Card top accent */}
                        <div className={`h-1 ${sc.bg}`} />
                        <div className="p-5">
                          {/* Header row */}
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Hash className="w-4 h-4 text-gray-400" />
                                <span className="font-mono font-bold text-[#1EA2E4]">{booking.code}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>
                                  {(booking.status ?? "unknown").replace(/_/g, " ").toUpperCase()}
                                </span>
                                {booking.created_channel && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{booking.created_channel}</span>
                                )}
                              </div>
                            </div>
                            {amt && (
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Est. Total</p>
                                <p className="text-xl font-bold text-gray-800">{booking.pricing?.currency ?? 'USD'} {parseFloat(amt).toFixed(2)}</p>
                              </div>
                            )}
                          </div>

                          {/* Details grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {booking.customer_id && (
                              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-500">Customer</p>
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {booking.customer_id.full_name ?? booking.customer_id.email ?? 'N/A'}
                                  </p>
                                </div>
                              </div>
                            )}
                            {booking.start_at && (
                              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-gray-500">Start</p>
                                  <p className="text-sm font-medium text-gray-800">{fmtDT(booking.start_at)}</p>
                                </div>
                              </div>
                            )}
                            {booking.end_at && (
                              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-gray-500">End</p>
                                  <p className="text-sm font-medium text-gray-800">{fmtDT(booking.end_at)}</p>
                                </div>
                              </div>
                            )}
                            {booking.pickup_location?.label && (
                              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-500">Pickup</p>
                                  <p className="text-sm font-medium text-gray-800 truncate">{booking.pickup_location.label}</p>
                                </div>
                              </div>
                            )}
                            {hours && (
                              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-gray-500">Duration</p>
                                  <p className="text-sm font-medium text-gray-800">{hours} hour{hours !== 1 ? 's' : ''}</p>
                                </div>
                              </div>
                            )}
                            {rateSnap && (
                              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-gray-500">Rate Snapshot</p>
                                  <p className="text-sm font-medium text-gray-800">${parseFloat(rateSnap).toFixed(2)}/hr</p>
                                </div>
                              </div>
                            )}
                            {booking.payment_status_snapshot && (
                              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-gray-500">Payment</p>
                                  <p className="text-sm font-medium text-gray-800 capitalize">{booking.payment_status_snapshot}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Rating row */}
                          {booking.customer_rating_of_driver != null && (
                            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                              <MessageCircle className="w-4 h-4 text-gray-400" />
                              <div className="flex items-center gap-2">
                                {getRatingStars(booking.customer_rating_of_driver)}
                                <span className="text-sm font-medium text-gray-700">{booking.customer_rating_of_driver}/5</span>
                              </div>
                              {booking.customer_review_text && (
                                <p className="text-sm text-gray-500 italic truncate flex-1">"{booking.customer_review_text}"</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDriverProfileDetailPage;
