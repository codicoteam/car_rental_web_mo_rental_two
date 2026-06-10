import React, { useState, useEffect, useCallback } from "react";
import ManagerSidebar from "../../../components/ManagerSideBar";
import BookingDriverService , {type DriverBooking} from "../../../Services/boking_service";
import {
  Search,
 
  Eye,
  Edit,
  Plus,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Calendar,
  Clock,
  Car,
  MapPin,
  RefreshCw,
  DollarSign,
  User,
  Star,
  Phone,
  MessageSquare,
  CreditCard,
  Navigation,
  Clock3,
  TrendingUp,
  FileText,
  CalendarClock,
  Package,
  Users,
  Ticket,
  ClipboardCheck,
  RotateCw,
  Calendar as CalendarIcon,
  UserCheck,
  AlertOctagon,
  Wallet,
  Truck,
  Map,
  Briefcase,
  Languages,
  Award,
  ChevronRight,
  Building,
  Hash,
  Copy,
  Target,
  Settings,
  Wrench,
  Gauge,
  Sparkles,
  Zap,
  Shield,
  Info,
  Check,
  XCircle,
  BarChart3,
  Save,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertTriangle,
} from "lucide-react";

// Types based on your JSON response


const ManagerDriverBookings: React.FC = () => {
  // State
  const [bookings, setBookings] = useState<DriverBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState<DriverBooking | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConfirmPaymentModalOpen, setIsConfirmPaymentModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);



        // Helper to parse number fields that might be in $numberDecimal format
        const parseNumber = (value: any): number => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'object' && value.$numberDecimal) {
            return parseFloat(value.$numberDecimal);
        }
        return Number(value) || 0;
        };

        // Helper to parse the entire booking object and convert number fields
        const normalizeBooking = (booking: any): DriverBooking => {
        return {
            ...booking,
            pricing: {
            ...booking.pricing,
            hourly_rate_snapshot: parseNumber(booking.pricing?.hourly_rate_snapshot),
            estimated_total_amount: parseNumber(booking.pricing?.estimated_total_amount),
            }
        };
        };

    // Update loadBookings function
     const loadBookings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await BookingDriverService.getAllBookings();
            
            // Normalize the bookings data - convert $numberDecimal objects to numbers
            let bookingsData = response.data || [];
            bookingsData = bookingsData.map(normalizeBooking);
            
            setBookings(bookingsData);
        } catch (err: any) {
            const errorMessage = err?.message || "Failed to load driver bookings";
            setError(errorMessage);
            showSnackbar(errorMessage, "error");
        } finally {
            setLoading(false);
        }
        }, []);

  // Initial load
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Open view modal
  const openViewModal = (booking: DriverBooking) => {
    setSelectedBooking(booking);
    setIsViewModalOpen(true);
  };

  // Open payment modal
  const openPaymentModal = (booking: DriverBooking) => {
    setSelectedBooking(booking);
    setIsPaymentModalOpen(true);
  };

  // Handle confirm payment
  const handleConfirmPayment = async () => {
    if (!selectedBooking) return;

    try {
      await BookingDriverService.confirmPayment(selectedBooking._id);
      showSnackbar("Payment confirmed successfully", "success");
      setIsConfirmPaymentModalOpen(false);
      setIsPaymentModalOpen(false);
      loadBookings();
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to confirm payment";
      showSnackbar(errorMessage, "error");
    }
  };

 
  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      searchTerm === "" ||
      booking.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.customer_id?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.customer_id?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.driver_profile_id.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pickup_location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.dropoff_location.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || booking.payment_status_snapshot === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Get status badge
  const getStatusBadge = (booking: DriverBooking) => {
    switch (booking.status) {
      case "requested":
        return { text: "REQUESTED", color: "bg-yellow-100 text-yellow-800", icon: Clock };
      case "accepted":
        return { text: "ACCEPTED", color: "bg-blue-100 text-blue-800", icon: UserCheck };
      case "in_progress":
        return { text: "IN PROGRESS", color: "bg-purple-100 text-purple-800", icon: Truck };
      case "completed":
        return { text: "COMPLETED", color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "cancelled":
        return { text: "CANCELLED", color: "bg-red-100 text-red-800", icon: XCircle };
      default:
        return { text: "UNKNOWN", color: "bg-gray-100 text-gray-800", icon: AlertCircle };
    }
  };

  // Get payment badge
  const getPaymentBadge = (booking: DriverBooking) => {
    switch (booking.payment_status_snapshot) {
      case "paid":
        return { text: "PAID", color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "unpaid":
        return { text: "UNPAID", color: "bg-red-100 text-red-800", icon: XCircle };
      case "pending":
        return { text: "PENDING", color: "bg-yellow-100 text-yellow-800", icon: Clock };
      default:
        return { text: "UNKNOWN", color: "bg-gray-100 text-gray-800", icon: AlertCircle };
    }
  };

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format date with time
  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate duration in hours
  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  // Get status statistics
  const statusStats = {
    requested: bookings.filter(b => b.status === "requested").length,
    accepted: bookings.filter(b => b.status === "accepted").length,
    in_progress: bookings.filter(b => b.status === "in_progress").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  // Get payment statistics
  const paymentStats = {
    paid: bookings.filter(b => b.payment_status_snapshot === "paid").length,
    unpaid: bookings.filter(b => b.payment_status_snapshot === "unpaid").length,
    pending: bookings.filter(b => b.payment_status_snapshot === "pending").length,
  };

  // Replace your totalRevenue calculation with this:

// Helper function to safely get number value
const getNumberValue = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value.$numberDecimal) {
    return parseFloat(value.$numberDecimal);
  }
  return Number(value) || 0;
};

// Calculate total revenue - parse numbers safely
const totalRevenue = bookings
  .filter(b => b.payment_status_snapshot === "paid")
  .reduce((sum, b) => {
    const amount = getNumberValue(b.pricing?.estimated_total_amount);
    return sum + amount;
  }, 0);

 
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
                <h1 className="text-2xl font-bold text-gray-800">Driver Bookings Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage all driver bookings and payments</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold">{bookings.length}</span> bookings
              </div>
              <button
                onClick={loadBookings}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-800">{bookings.length}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-[#1EA2E4]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Requests</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {statusStats.requested}
                    </p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {statusStats.completed}
                    </p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrency(totalRevenue)}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-500" />
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
                      placeholder="Search by booking code, customer name, driver, or address..."
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
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Status</option>
                      <option value="requested">Requested</option>
                      <option value="accepted">Accepted</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Payments</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="pending">Pending</option>
                    </select>
                    <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bookings Grid/Table */}
            <div>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                    <p className="text-gray-600">Loading driver bookings...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                  <p className="text-red-600 text-center mb-4">{error}</p>
                  <button
                    onClick={loadBookings}
                    className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <Car className="w-20 h-20 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No driver bookings found</p>
                  <p className="text-gray-400 text-center">
                    {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                      ? "Try adjusting your filters or search terms"
                      : "No bookings have been created yet"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Booking Code</th>
                              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Customer</th>
                              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Driver</th>
                              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Date & Time</th>
                              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Amount</th>
                              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
                              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Payment</th>
                              <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredBookings.map((booking) => {
                              const statusBadge = getStatusBadge(booking);
                              const paymentBadge = getPaymentBadge(booking);
                              const StatusIcon = statusBadge.icon;
                              const PaymentIcon = paymentBadge.icon;

                              return (
                                <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="font-mono text-sm font-medium text-gray-900">{booking.code}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(booking.start_at)}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {booking.customer_id ? (
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{booking.customer_id.full_name}</p>
                                        <p className="text-xs text-gray-500">{booking.customer_id.email}</p>
                                        <p className="text-xs text-gray-500">{booking.customer_id.phone}</p>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500">Guest User</p>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      {booking.driver_profile_id.profile_image && (
                                        <img
                                          src={booking.driver_profile_id.profile_image}
                                          alt={booking.driver_profile_id.display_name}
                                          className="w-8 h-8 rounded-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                              booking.driver_profile_id.display_name
                                            )}&background=1EA2E4&color=fff`;
                                          }}
                                        />
                                      )}
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {booking.driver_profile_id.display_name}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                          <span className="text-xs text-gray-600">
                                            {booking.driver_profile_id.rating_average} ({booking.driver_profile_id.rating_count})
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div>
                                      <div className="flex items-center gap-1 text-sm text-gray-900">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>{formatDate(booking.start_at)}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span>
                                          {formatDateTime(booking.start_at).split(',')[1]} - {formatDateTime(booking.end_at).split(',')[1]}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {booking.pricing.hours_requested} hours • {getDuration(booking.start_at, booking.end_at)}h total
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="text-lg font-bold text-gray-900">
                                        {formatCurrency(booking.pricing.estimated_total_amount)}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        @ ${booking.pricing.hourly_rate_snapshot}/hr
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}
                                    >
                                      <StatusIcon className="w-3 h-3" />
                                      {statusBadge.text}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${paymentBadge.color}`}
                                    >
                                      <PaymentIcon className="w-3 h-3" />
                                      {paymentBadge.text}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => openViewModal(booking)}
                                        className="p-2 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                        title="View Details"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      {booking.payment_status_snapshot === "unpaid" && booking.status !== "cancelled" && (
                                        <button
                                          onClick={() => openPaymentModal(booking)}
                                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                          title="Process Payment"
                                        >
                                          <CreditCard className="w-4 h-4" />
                                        </button>
                                      )}
                                    
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                    {filteredBookings.map((booking) => {
                      const statusBadge = getStatusBadge(booking);
                      const paymentBadge = getPaymentBadge(booking);
                      const StatusIcon = statusBadge.icon;

                      return (
                        <div
                          key={booking._id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                          <div className="p-4">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-mono text-sm font-bold text-gray-900">{booking.code}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(booking.start_at)}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => openViewModal(booking)}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>
                            </div>

                            {/* Customer & Driver */}
                            <div className="space-y-2 mb-3">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {booking.customer_id?.full_name || "Guest User"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Truck className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{booking.driver_profile_id.display_name}</span>
                                <div className="flex items-center gap-1 ml-auto">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-gray-600">
                                    {booking.driver_profile_id.rating_average}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Time & Location */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">{formatDate(booking.start_at)}</span>
                                <Clock className="w-4 h-4 text-gray-500 ml-auto" />
                                <span className="text-gray-700 text-sm">
                                  {formatDateTime(booking.start_at).split(',')[1]}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500">Pickup:</p>
                                  <p className="text-sm text-gray-700">{booking.pickup_location.address}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Navigation className="w-4 h-4 text-gray-500 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500">Dropoff:</p>
                                  <p className="text-sm text-gray-700">{booking.dropoff_location.address}</p>
                                </div>
                              </div>
                            </div>

                            {/* Pricing & Status */}
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {formatCurrency(booking.pricing.estimated_total_amount)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {booking.pricing.hours_requested} hours @ ${booking.pricing.hourly_rate_snapshot}/hr
                                </p>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}
                                >
                                  <StatusIcon className="w-3 h-3" />
                                  {statusBadge.text}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ml-2 ${paymentBadge.color}`}
                                >
                                  {paymentBadge.text}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            {booking.payment_status_snapshot === "unpaid" && booking.status !== "cancelled" && (
                              <button
                                onClick={() => openPaymentModal(booking)}
                                className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <CreditCard className="w-4 h-4" />
                                Process Payment
                              </button>
                            )}
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
      </div>

      {/* View Booking Details Modal */}
      {isViewModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Booking Details</h2>
                <p className="text-sm text-gray-600">{selectedBooking.code}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedBooking.payment_status_snapshot === "unpaid" && selectedBooking.status !== "cancelled" && (
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openPaymentModal(selectedBooking);
                    }}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Process Payment
                  </button>
                )}
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-8" style={{ maxHeight: "calc(90vh - 80px)" }}>
              <div className="space-y-8">
                {/* Booking Overview */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Booking Overview
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-[#1EA2E4]" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Date & Time</p>
                          <p className="text-sm font-medium">{formatDate(selectedBooking.start_at)}</p>
                          <p className="text-xs text-gray-600">
                            {formatDateTime(selectedBooking.start_at).split(',')[1]} - {formatDateTime(selectedBooking.end_at).split(',')[1]}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <Clock className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="text-sm font-medium">{selectedBooking.pricing.hours_requested} hours requested</p>
                          <p className="text-xs text-gray-600">{getDuration(selectedBooking.start_at, selectedBooking.end_at)} hours total</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <DollarSign className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Amount</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(selectedBooking.pricing.estimated_total_amount)}
                          </p>
                          <p className="text-xs text-gray-600">@{selectedBooking.pricing.hourly_rate_snapshot}/hr</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Driver Information
                  </h4>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      {selectedBooking.driver_profile_id.profile_image ? (
                        <img
                          src={selectedBooking.driver_profile_id.profile_image}
                          alt={selectedBooking.driver_profile_id.display_name}
                          className="w-24 h-24 rounded-full object-cover border-2 border-white shadow"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              selectedBooking.driver_profile_id.display_name
                            )}&background=1EA2E4&color=fff&size=96`;
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-[#1EA2E4] flex items-center justify-center text-white text-2xl font-bold">
                          {selectedBooking.driver_profile_id.display_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-lg font-bold text-gray-900">{selectedBooking.driver_profile_id.display_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Base Location</p>
                          <p className="text-sm text-gray-900">
                            {selectedBooking.driver_profile_id.base_city}, {selectedBooking.driver_profile_id.base_region}, {selectedBooking.driver_profile_id.base_country}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Experience</p>
                          <p className="text-sm text-gray-900">{selectedBooking.driver_profile_id.years_experience} years</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Rating</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{selectedBooking.driver_profile_id.rating_average}</span>
                            <span className="text-xs text-gray-500">({selectedBooking.driver_profile_id.rating_count} reviews)</span>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500">Languages</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedBooking.driver_profile_id.languages.map((lang, idx) => (
                              <span key={idx} className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500">Bio</p>
                          <p className="text-sm text-gray-700">{selectedBooking.driver_profile_id.bio}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Customer Information
                  </h4>
                  {selectedBooking.customer_id ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="text-sm font-medium">{selectedBooking.customer_id.full_name}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium">{selectedBooking.customer_id.email}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium">{selectedBooking.customer_id.phone}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Guest user (no account)</p>
                  )}
                </div>

                {/* Trip Details */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Trip Details
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Pickup Location</p>
                          <p className="text-sm font-medium">{selectedBooking.pickup_location.label}</p>
                          <p className="text-sm text-gray-600">{selectedBooking.pickup_location.address}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Lat: {selectedBooking.pickup_location.latitude}, Lng: {selectedBooking.pickup_location.longitude}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <Navigation className="w-5 h-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Dropoff Location</p>
                          <p className="text-sm font-medium">{selectedBooking.dropoff_location.label}</p>
                          <p className="text-sm text-gray-600">{selectedBooking.dropoff_location.address}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Lat: {selectedBooking.dropoff_location.latitude}, Lng: {selectedBooking.dropoff_location.longitude}
                          </p>
                        </div>
                      </div>
                    </div>
                    {selectedBooking.notes && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Notes</p>
                            <p className="text-sm text-gray-700">{selectedBooking.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment & Status */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Payment & Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Booking Status</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full ${getStatusBadge(selectedBooking).color}`}>
                          {getStatusBadge(selectedBooking).text}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">Requested: {formatDateTime(selectedBooking.requested_at)}</p>
                      {selectedBooking.driver_responded_at && (
                        <p className="text-xs text-gray-500">Driver Responded: {formatDateTime(selectedBooking.driver_responded_at)}</p>
                      )}
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Payment Status</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full ${getPaymentBadge(selectedBooking).color}`}>
                          {getPaymentBadge(selectedBooking).text}
                        </span>
                      </div>
                      {selectedBooking.paid_at && (
                        <p className="text-xs text-gray-500 mt-3">Paid: {formatDateTime(selectedBooking.paid_at)}</p>
                      )}
                      {selectedBooking.payment_deadline_at && (
                        <p className="text-xs text-gray-500">Deadline: {formatDateTime(selectedBooking.payment_deadline_at)}</p>
                      )}
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

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsPaymentModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Process Payment</h3>
                  <p className="text-sm text-gray-600">Confirm payment for this booking</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Booking Details:</p>
                  <p className="font-mono text-sm font-medium">{selectedBooking.code}</p>
                  <p className="text-sm text-gray-700 mt-2">
                    Customer: <span className="font-medium">{selectedBooking.customer_id?.full_name || "Guest"}</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    Amount: <span className="font-bold text-green-600">{formatCurrency(selectedBooking.pricing.estimated_total_amount)}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm text-gray-700">Payment Status:</span>
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                    UNPAID
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsConfirmPaymentModalOpen(true)}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Payment Modal */}
      {isConfirmPaymentModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsConfirmPaymentModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Confirm Payment</h3>
                  <p className="text-sm text-gray-600">Mark this booking as paid</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to mark this booking as paid? This action will confirm that the customer has completed payment for the service.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsConfirmPaymentModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setBookingToCancel(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertOctagon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Cancel Booking</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this booking? This will remove the driver assignment and notify the customer.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setBookingToCancel(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  No, Keep Booking
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

export default ManagerDriverBookings;