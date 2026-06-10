import React, { useState, useEffect, useCallback } from "react";
import ManagerSidebar from "../../../components/ManagerSideBar";
import {
  Search,
  Eye,
  Filter,
  X,
  Star,
  MapPin,
   DollarSign,
 Calendar,
  Phone,
  Mail,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Languages,
  Briefcase,
  IdCard,
  Verified,
  Users,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  AlertTriangle,
  UserCheck,
 
} from "lucide-react";
import DriverProfileService, { 
  type DriverProfile, 
  
} from "../../../Services/adminAndManager/driver_profiles_service";

const DriverProfilesPage: React.FC = () => {
  // State
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Load drivers
  const loadDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await DriverProfileService.getAllDriverProfiles();
      
      if (response.success) {
        setDrivers(response.data);
        showSnackbar(`Loaded ${response.data.length} drivers successfully`, "success");
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

  // Initial load
  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Open view modal
  const openViewModal = (driver: DriverProfile) => {
    setSelectedDriver(driver);
    setIsViewModalOpen(true);
  };

  // Get unique cities for filter
  const uniqueCities = Array.from(new Set(drivers.map(driver => driver.base_city)));

  // Filter drivers
  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      searchTerm === "" ||
      driver.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.user_id.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.user_id.full_name.toLowerCase().includes(searchTerm.toLowerCase());

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

  // Get rating stars
  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="w-4 h-4 text-yellow-400" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
      </div>
    );
  };

  // Get status badge
  const getStatusBadge = (driver: DriverProfile) => {
    if (driver.status === "approved" && driver.is_available) {
      return { text: "AVAILABLE", color: "bg-green-100 text-green-800", icon: CheckCircle };
    } else if (driver.status === "approved" && !driver.is_available) {
      return { text: "BUSY", color: "bg-yellow-100 text-yellow-800", icon: ClockIcon };
    } else if (driver.status === "pending") {
      return { text: "PENDING", color: "bg-orange-100 text-orange-800", icon: AlertTriangle };
    } else {
      return { text: "REJECTED", color: "bg-red-100 text-red-800", icon: XCircle };
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get driver stats
  const driverStats = {
    total: drivers.length,
    available: drivers.filter(d => d.is_available && d.status === "approved").length,
    busy: drivers.filter(d => !d.is_available && d.status === "approved").length,
    pending: drivers.filter(d => d.status === "pending").length,
    avgRating: drivers.length > 0 
      ? (drivers.reduce((sum, d) => sum + d.rating_average, 0) / drivers.length).toFixed(1)
      : "0.0",
    totalReviews: drivers.reduce((sum, d) => sum + d.rating_count, 0),
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Driver Profiles</h1>
                <p className="text-sm text-gray-600 mt-1">Manage and view all registered drivers</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={loadDrivers}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Drivers</p>
                    <p className="text-2xl font-bold text-gray-800">{driverStats.total}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="w-6 h-6 text-[#1EA2E4]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Available</p>
                    <p className="text-2xl font-bold text-green-600">{driverStats.available}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Busy</p>
                    <p className="text-2xl font-bold text-yellow-600">{driverStats.busy}</p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-purple-600">{driverStats.avgRating}</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Star className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold text-orange-600">{driverStats.totalReviews}</p>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or bio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Cities</option>
                      {uniqueCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Status</option>
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Ratings</option>
                      <option value="4plus">4+ Stars</option>
                      <option value="3to4">3-4 Stars</option>
                      <option value="below3">Below 3 Stars</option>
                    </select>
                    <Star className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drivers Grid */}
          <div className="px-6 pb-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                  <p className="text-gray-600">Loading driver profiles...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-red-600 text-center mb-4">{error}</p>
                <button
                  onClick={loadDrivers}
                  className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <Users className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No drivers found</p>
                <p className="text-gray-400 text-center">
                  {searchTerm || cityFilter !== "all" || availabilityFilter !== "all" || ratingFilter !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "No drivers are currently registered"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Grid */}
                <div className="hidden lg:block">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredDrivers.map((driver) => {
                      const statusBadge = getStatusBadge(driver);
                      const StatusIcon = statusBadge.icon;

                      return (
                        <div
                          key={driver._id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 group"
                        >
                          {/* Header with gradient background */}
                          <div className="relative bg-gradient-to-r from-[#1EA2E4] to-[#1A8BC9] px-6 py-4">
                            <div className="absolute top-3 right-3">
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge.color} flex items-center gap-1`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusBadge.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              {/* Profile Avatar */}
                              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white">
                                {driver.profile_image ? (
                                  <img
                                    src={driver.profile_image}
                                    alt={driver.display_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white text-2xl font-bold">
                                    {driver.display_name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-white">{driver.display_name}</h3>
                                <p className="text-sm text-white/90">{driver.user_id.full_name}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  {getRatingStars(driver.rating_average)}
                                  <span className="text-xs text-white/90 ml-1">
                                    ({driver.rating_count} reviews)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            {/* Basic Info */}
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-[#1EA2E4]" />
                                <span>{driver.base_city}, {driver.base_region}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <DollarSign className="w-4 h-4 text-[#1EA2E4]" />
                                <span>{formatCurrency(driver.hourly_rate)} / hour</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Briefcase className="w-4 h-4 text-[#1EA2E4]" />
                                <span>{driver.years_experience} years experience</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Languages className="w-4 h-4 text-[#1EA2E4]" />
                                <span>{driver.languages.join(", ")}</span>
                              </div>
                            </div>

                            {/* Bio Preview */}
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {driver.bio}
                              </p>
                            </div>

                            {/* License Info */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  <IdCard className="w-3 h-3 text-gray-500" />
                                  <span className="text-gray-600">License:</span>
                                  <span className="font-mono font-medium">{driver.driver_license.number}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {driver.driver_license.verified ? (
                                    <>
                                      <Verified className="w-3 h-3 text-green-500" />
                                      <span className="text-green-600">Verified</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-3 h-3 text-yellow-500" />
                                      <span className="text-yellow-600">Unverified</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Expires: {formatDate(driver.driver_license.expires_at)}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end">
                              <button
                                onClick={() => openViewModal(driver)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors text-sm font-medium"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {filteredDrivers.map((driver) => {
                    const statusBadge = getStatusBadge(driver);
                    const StatusIcon = statusBadge.icon;

                    return (
                      <div
                        key={driver._id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1EA2E4] to-[#1A8BC9] flex items-center justify-center">
                                {driver.profile_image ? (
                                  <img
                                    src={driver.profile_image}
                                    alt={driver.display_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white text-lg font-bold">
                                    {driver.display_name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900">{driver.display_name}</h3>
                                <div className="flex items-center gap-1">
                                  {getRatingStars(driver.rating_average)}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color} flex items-center gap-1`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusBadge.text}
                            </span>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{driver.base_city}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatCurrency(driver.hourly_rate)}/hr</span>
                            </div>
                          </div>

                          <button
                            onClick={() => openViewModal(driver)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* View Driver Details Modal */}
      {isViewModalOpen && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Driver Profile Details</h2>
                <p className="text-sm text-gray-600">Complete driver information and credentials</p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-8" style={{ maxHeight: "calc(90vh - 80px)" }}>
              <div className="space-y-8">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-[#1EA2E4] to-[#1A8BC9] rounded-xl p-6 text-white">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white">
                      {selectedDriver.profile_image ? (
                        <img
                          src={selectedDriver.profile_image}
                          alt={selectedDriver.display_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-3xl font-bold">
                          {selectedDriver.display_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedDriver.display_name}</h3>
                      <p className="text-white/90">{selectedDriver.user_id.full_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {getRatingStars(selectedDriver.rating_average)}
                        <span className="text-sm">({selectedDriver.rating_count} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium">{selectedDriver.user_id.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium">{selectedDriver.user_id.phone || "N/A"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium">
                          {selectedDriver.base_city}, {selectedDriver.base_region}, {selectedDriver.base_country}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Years of Experience</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium">{selectedDriver.years_experience} years</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Languages</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedDriver.languages.map(lang => (
                          <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Hourly Rate</p>
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <p className="text-lg font-bold text-[#1EA2E4]">
                          {formatCurrency(selectedDriver.hourly_rate)}/hour
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Bio
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{selectedDriver.bio}</p>
                </div>

                {/* License Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    License Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500">License Number</p>
                      <p className="text-sm font-mono font-medium">{selectedDriver.driver_license.number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">License Class</p>
                      <p className="text-sm font-medium">{selectedDriver.driver_license.class}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Country of Issue</p>
                      <p className="text-sm font-medium">{selectedDriver.driver_license.country}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expiration Date</p>
                      <p className="text-sm font-medium">{formatDate(selectedDriver.driver_license.expires_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Verification Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedDriver.driver_license.verified ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium text-yellow-600">Pending Verification</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedDriver.driver_license.imageUrl && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">License Image</p>
                      <img
                        src={selectedDriver.driver_license.imageUrl}
                        alt="Driver License"
                        className="rounded-lg border border-gray-200 max-h-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300/1EA2E4/ffffff?text=License+Image";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Identity Document */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Identity Document
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Document Type</p>
                      <p className="text-sm font-medium capitalize">{selectedDriver.identity_document.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {selectedDriver.identity_document.imageUrl && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Document Image</p>
                      <img
                        src={selectedDriver.identity_document.imageUrl}
                        alt="Identity Document"
                        className="rounded-lg border border-gray-200 max-h-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300/1EA2E4/ffffff?text=Identity+Document";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Admin Approval Information */}
                {selectedDriver.approved_by_admin && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                      Admin Approval
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-gray-500">Approved By</p>
                        <div className="flex items-center gap-2 mt-1">
                          <UserCheck className="w-4 h-4 text-gray-400" />
                          <p className="text-sm font-medium">{selectedDriver.approved_by_admin.full_name}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Approved At</p>
                        <p className="text-sm font-medium">{formatDate(selectedDriver.approved_at)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Status Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Driver Status</p>
                      <div className="mt-1">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedDriver).color}`}>
                          {getStatusBadge(selectedDriver).text}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Availability</p>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedDriver.is_available ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">Available for hire</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium text-red-600">Currently unavailable</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Joined Date</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium">{formatDate(selectedDriver.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-8 py-5">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${
              snackbar.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : snackbar.type === "error"
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}
          >
            {snackbar.type === "success" && (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            )}
            {snackbar.type === "error" && (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium flex-1">{snackbar.message}</span>
            <button
              onClick={() => setSnackbar((prev) => ({ ...prev, show: false }))}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverProfilesPage;