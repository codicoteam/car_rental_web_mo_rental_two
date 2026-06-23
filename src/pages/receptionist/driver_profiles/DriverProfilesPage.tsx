import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReceptionistSideBar from "../../../components/ReceptionistSideBar";
import {
  Search, Eye, Filter, X, Star, MapPin, DollarSign,
  AlertCircle, RefreshCw, MoreVertical, Languages,
  Briefcase, IdCard, Verified, Users, MessageCircle, CheckCircle,
  XCircle, Clock as ClockIcon, AlertTriangle,
} from "lucide-react";
import DriverProfileService, { type DriverProfile } from "../../../Services/adminAndManager/driver_profiles_service";

const DriverProfilesPage: React.FC = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [snackbar, setSnackbar] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false, message: "", type: "info",
  });

  const loadDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await DriverProfileService.getAllDriverProfiles();
      if (response.success) {
        setDrivers(response.data);
        showSnackbar(`Loaded ${response.data.length} drivers`, "success");
      } else {
        throw new Error("Failed to load drivers");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load driver profiles");
      showSnackbar(err.message || "Failed to load driver profiles", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar(p => ({ ...p, show: false })), 3000);
  };

  const uniqueCities = Array.from(new Set(drivers.map(d => d.base_city)));

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch =
      searchTerm === "" ||
      (driver.display_name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (driver.bio ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (driver.user_id?.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (driver.user_id?.full_name ?? "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = cityFilter === "all" || driver.base_city === cityFilter;
    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && driver.is_available) ||
      (availabilityFilter === "unavailable" && !driver.is_available);
    const matchesRating =
      ratingFilter === "all" ||
      (ratingFilter === "4plus" && driver.rating_average >= 4) ||
      (ratingFilter === "3to4" && driver.rating_average >= 3 && driver.rating_average < 4) ||
      (ratingFilter === "below3" && driver.rating_average < 3);

    return matchesSearch && matchesCity && matchesAvailability && matchesRating;
  });

  const getRatingStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return (
      <div className="flex items-center">
        {[...Array(full)].map((_, i) => <Star key={`f${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
        {half && (
          <div className="relative">
            <Star className="w-4 h-4 text-yellow-400" />
            <div className="absolute inset-0 overflow-hidden w-1/2"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /></div>
          </div>
        )}
        {[...Array(empty)].map((_, i) => <Star key={`e${i}`} className="w-4 h-4 text-gray-300" />)}
      </div>
    );
  };

  const getStatusBadge = (driver: DriverProfile) => {
    if (driver.status === "approved" && driver.is_available)
      return { text: "AVAILABLE", color: "bg-green-100 text-green-800", icon: CheckCircle };
    if (driver.status === "approved" && !driver.is_available)
      return { text: "BUSY", color: "bg-yellow-100 text-yellow-800", icon: ClockIcon };
    if (driver.status === "pending")
      return { text: "PENDING", color: "bg-orange-100 text-orange-800", icon: AlertTriangle };
    return { text: "REJECTED", color: "bg-red-100 text-red-800", icon: XCircle };
  };

  const formatDate = (d?: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount ?? 0);

  const driverStats = {
    total: drivers.length,
    available: drivers.filter(d => d.is_available && d.status === "approved").length,
    busy: drivers.filter(d => !d.is_available && d.status === "approved").length,
    pending: drivers.filter(d => d.status === "pending").length,
    avgRating: drivers.length > 0
      ? (drivers.reduce((s, d) => s + d.rating_average, 0) / drivers.length).toFixed(1)
      : "0.0",
    totalReviews: drivers.reduce((s, d) => s + d.rating_count, 0),
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <ReceptionistSideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Driver Profiles</h1>
                <p className="text-sm text-gray-600 mt-1">Manage and view all registered drivers</p>
              </div>
            </div>
            <button onClick={loadDrivers} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {[
                { label: "Total Drivers", val: driverStats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Available", val: driverStats.available, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
                { label: "Busy", val: driverStats.busy, icon: ClockIcon, color: "text-yellow-600", bg: "bg-yellow-50" },
                { label: "Avg Rating", val: driverStats.avgRating, icon: Star, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Total Reviews", val: driverStats.totalReviews, icon: MessageCircle, color: "text-orange-600", bg: "bg-orange-50" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                    </div>
                    <div className={`p-2 ${s.bg} rounded-lg`}>
                      <s.icon className={`w-6 h-6 ${s.color}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or bio..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]">
                      <option value="all">All Cities</option>
                      {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]">
                      <option value="all">All Status</option>
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]">
                      <option value="all">All Ratings</option>
                      <option value="4plus">4+ Stars</option>
                      <option value="3to4">3–4 Stars</option>
                      <option value="below3">Below 3</option>
                    </select>
                    <Star className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Grid */}
          <div className="px-6 pb-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4" />
                  <p className="text-gray-600">Loading driver profiles...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-red-600 text-center mb-4">{error}</p>
                <button onClick={loadDrivers} className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <Users className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No drivers found</p>
                <p className="text-gray-400 text-center text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDrivers.map(driver => {
                  const badge = getStatusBadge(driver);
                  const BadgeIcon = badge.icon;
                  return (
                    <div key={driver._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
                      <div className="relative bg-gradient-to-r from-[#1EA2E4] to-[#1A8BC9] px-6 py-4">
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${badge.color} flex items-center gap-1`}>
                            <BadgeIcon className="w-3 h-3" /> {badge.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white flex-shrink-0">
                            {driver.profile_image ? (
                              <img src={driver.profile_image} alt={driver.display_name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-white text-2xl font-bold">{(driver.display_name ?? "?").charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white truncate">{driver.display_name}</h3>
                            <p className="text-sm text-white/90 truncate">{driver.user_id?.full_name ?? 'N/A'}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {getRatingStars(driver.rating_average)}
                              <span className="text-xs text-white/90 ml-1">({driver.rating_count})</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-[#1EA2E4] flex-shrink-0" />
                            <span>{driver.base_city}, {driver.base_region}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4 text-[#1EA2E4] flex-shrink-0" />
                            <span>{formatCurrency(driver.hourly_rate)} / hour</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Briefcase className="w-4 h-4 text-[#1EA2E4] flex-shrink-0" />
                            <span>{driver.years_experience} yrs experience</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Languages className="w-4 h-4 text-[#1EA2E4] flex-shrink-0" />
                            <span className="truncate">{driver.languages.join(", ")}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{driver.bio}</p>

                        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <IdCard className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-600">License:</span>
                              <span className="font-mono font-medium">{driver.driver_license?.number ?? 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {driver.driver_license?.verified ? (
                                <><Verified className="w-3 h-3 text-green-500" /><span className="text-green-600">Verified</span></>
                              ) : (
                                <><AlertCircle className="w-3 h-3 text-yellow-500" /><span className="text-yellow-600">Unverified</span></>
                              )}
                            </div>
                          </div>
                          <div className="text-gray-500 mt-1">Expires: {formatDate(driver.driver_license?.expires_at)}</div>
                        </div>

                        <button
                          onClick={() => navigate(`/receptionist/driver-profile/${driver._id}`)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" /> View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Snackbar */}
      {snackbar.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${
            snackbar.type === "success" ? "bg-green-50 border border-green-200 text-green-800"
            : snackbar.type === "error" ? "bg-red-50 border border-red-200 text-red-800"
            : "bg-blue-50 border border-blue-200 text-blue-800"
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

export default DriverProfilesPage;
