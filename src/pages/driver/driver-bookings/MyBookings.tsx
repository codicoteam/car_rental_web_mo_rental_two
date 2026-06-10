import React, { useState, useEffect, useCallback } from "react";
import DriverSidebar from "../../../components/DriverSideBar";

import BookingDriverService from "../../../Services/boking_service"; 
import {
  Search,
  Eye,
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
  CreditCard,
  Navigation,
  FileText,
  Trash2,
  XCircle,
  AlertOctagon,
} from "lucide-react";

// Types based on your actual API response
interface Customer {
  _id: string;
  email: string;
  phone: string;
  full_name: string;
}

interface Location {
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface Pricing {
  currency: string;
  hourly_rate_snapshot: number;
  hours_requested: number;
  estimated_total_amount: number;
}

interface DriverBooking {
  _id: string;
  code: string;
  customer_id: Customer | null;
  created_by: string;
  created_channel: string;
  driver_profile_id: string; // This is a string ID, not an object
  driver_user_id: string;
  start_at: string;
  end_at: string;
  pickup_location: Location;
  dropoff_location: Location;
  notes: string;
  pricing: Pricing;
  status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  requested_at: string;
  driver_responded_at: string | null;
  payment_deadline_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  payment_id: string | null;
  payment_status_snapshot: 'paid' | 'unpaid' | 'pending';
  last_status_update_by: string | null;
  customer_rating_of_driver: number | null;
  customer_review_text: string;
  created_at: string;
  updated_at: string;
  __v: number;
}

const MyBookings: React.FC = () => {
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add these with your other state declarations (around line 60-70)
    const [actionLoading, setActionLoading] = useState<string | null>(null); // Track which booking is being acted upon
    const [showRespondModal, setShowRespondModal] = useState(false);
    const [selectedAction, setSelectedAction] = useState<'accept' | 'decline'>('accept');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [bookingToComplete, setBookingToComplete] = useState<string | null>(null);
    const [completing, setCompleting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper to parse MongoDB Decimal128
  const parseDecimal = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value.$numberDecimal) {
      return parseFloat(value.$numberDecimal);
    }
    return Number(value) || 0;
  };

  // Normalize booking data
  const normalizeBookings = (rawBookings: any[]): DriverBooking[] => {
    return rawBookings.map(booking => ({
      ...booking,
      pricing: {
        currency: booking.pricing.currency,
        hourly_rate_snapshot: parseDecimal(booking.pricing.hourly_rate_snapshot),
        hours_requested: booking.pricing.hours_requested,
        estimated_total_amount: parseDecimal(booking.pricing.estimated_total_amount),
      }
    }));
  };

  // Load bookings function
  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await BookingDriverService.getDriverBookings();
      
      console.log('API Response:', response); // Debug log
      
      // Extract the array from response
      let rawBookings: any[] = [];
      
      if (response?.success && Array.isArray(response?.data)) {
        rawBookings = response.data;
      } else if (Array.isArray(response)) {
        rawBookings = response;
      } else if (response?.data && Array.isArray(response.data)) {
        rawBookings = response.data;
      }
      
      // Normalize the bookings
      const normalizedBookings = normalizeBookings(rawBookings);
      setBookings(normalizedBookings);
      
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      const errorMessage = err?.message || "Failed to load driver bookings";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
      setBookings([]);
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

  // Handle respond to booking (accept/decline)
const handleRespondToBooking = async (id: string, action: 'accept' | 'decline') => {
  try {
    setActionLoading(id);
    await BookingDriverService.respondToBooking(id, action);
    showSnackbar(`Booking ${action}ed successfully`, "success");
    setShowRespondModal(false);
    loadBookings(); // Refresh the list
  } catch (err: any) {
    const errorMessage = err?.message || `Failed to ${action} booking`;
    showSnackbar(errorMessage, "error");
  } finally {
    setActionLoading(null);
  }
};

// Handle cancel booking
const handleCancelBooking = async () => {
  if (!bookingToCancel) return;

  try {
    setCancelling(true);
    await BookingDriverService.cancelBooking(bookingToCancel);
    showSnackbar("Booking cancelled successfully", "success");
    setShowCancelModal(false);
    setBookingToCancel(null);
    loadBookings(); // Refresh the list
  } catch (err: any) {
    const errorMessage = err?.message || "Failed to cancel booking";
    showSnackbar(errorMessage, "error");
  } finally {
    setCancelling(false);
  }
};

// Handle complete booking
const handleCompleteBooking = async () => {
  if (!bookingToComplete) return;

  try {
    setCompleting(true);
    await BookingDriverService.completeBooking(bookingToComplete);
    showSnackbar("Booking completed successfully", "success");
    setShowCompleteModal(false);
    setBookingToComplete(null);
    loadBookings(); // Refresh the list
  } catch (err: any) {
    const errorMessage = err?.message || "Failed to complete booking";
    showSnackbar(errorMessage, "error");
  } finally {
    setCompleting(false);
  }
};

  // Handle delete booking
  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;

    try {
      setDeleting(true);
      await BookingDriverService.deleteBooking(bookingToDelete);
      showSnackbar("Booking deleted successfully", "success");
      setIsDeleteModalOpen(false);
      setBookingToDelete(null);
      loadBookings();
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to delete booking";
      showSnackbar(errorMessage, "error");
    } finally {
      setDeleting(false);
    }
  };

  // Filter bookings - safe check for array
  const filteredBookings = Array.isArray(bookings) 
    ? bookings.filter((booking) => {
        const matchesSearch =
          searchTerm === "" ||
          booking.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (booking.customer_id?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (booking.customer_id?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.pickup_location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.dropoff_location.address.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
        const matchesPayment = paymentFilter === "all" || booking.payment_status_snapshot === paymentFilter;

        return matchesSearch && matchesStatus && matchesPayment;
      })
    : [];

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return { text: "REQUESTED", color: "bg-yellow-100 text-yellow-800", icon: Clock };
      case "accepted":
        return { text: "ACCEPTED", color: "bg-blue-100 text-blue-800", icon: CheckCircle };
      case "in_progress":
        return { text: "IN PROGRESS", color: "bg-purple-100 text-purple-800", icon: Car };
      case "completed":
        return { text: "COMPLETED", color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "cancelled":
        return { text: "CANCELLED", color: "bg-red-100 text-red-800", icon: XCircle };
      default:
        return { text: status.toUpperCase(), color: "bg-gray-100 text-gray-800", icon: AlertCircle };
    }
  };

  // Get payment badge
  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return { text: "PAID", color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "unpaid":
        return { text: "UNPAID", color: "bg-red-100 text-red-800", icon: XCircle };
      case "pending":
        return { text: "PENDING", color: "bg-yellow-100 text-yellow-800", icon: Clock };
      default:
        return { text: status.toUpperCase(), color: "bg-gray-100 text-gray-800", icon: AlertCircle };
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
    if (!amount && amount !== 0) return "$0.00";
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

  // Calculate total revenue from paid bookings
  const totalRevenue = bookings
    .filter(b => b.payment_status_snapshot === "paid" && b.status === "completed")
    .reduce((sum, b) => sum + (b.pricing?.estimated_total_amount || 0), 0);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <DriverSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
                <h1 className="text-2xl font-bold text-gray-800">My Driver Bookings</h1>
                <p className="text-sm text-gray-600 mt-1">View and manage your assigned bookings</p>
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
                    <p className="text-sm text-gray-600">Completed Trips</p>
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
                      placeholder="Search by booking code, customer name, or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white min-w-[140px]"
                  >
                    <option value="all">All Status</option>
                    <option value="requested">Requested</option>
                    <option value="accepted">Accepted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white min-w-[140px]"
                  >
                    <option value="all">All Payments</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bookings Grid */}
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
                      : "No bookings have been assigned to you yet"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBookings.map((booking) => {
                    const statusBadge = getStatusBadge(booking.status);
                    const paymentBadge = getPaymentBadge(booking.payment_status_snapshot);
                    const StatusIcon = statusBadge.icon;
                    const PaymentIcon = paymentBadge.icon;

                    return (
                      <div
                        key={booking._id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-mono text-sm font-bold text-gray-900">{booking.code}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(booking.start_at)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                          {/* Customer */}
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {booking.customer_id?.full_name || "Guest User"}
                            </span>
                            {booking.customer_id?.phone && (
                              <span className="text-xs text-gray-500">
                                {booking.customer_id.phone}
                              </span>
                            )}
                          </div>

                          {/* Time */}
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700">{formatDate(booking.start_at)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700">
                                  {new Date(booking.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.pricing.hours_requested} hour(s) • {getDuration(booking.start_at, booking.end_at)}h total
                            </div>
                          </div>

                          {/* Locations */}
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-500">Pickup</p>
                                <p className="text-sm text-gray-700 line-clamp-1">{booking.pickup_location.address}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Navigation className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-500">Dropoff</p>
                                <p className="text-sm text-gray-700 line-clamp-1">{booking.dropoff_location.address}</p>
                              </div>
                            </div>
                          </div>

                          {/* Pricing & Status */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(booking.pricing.estimated_total_amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                @ {formatCurrency(booking.pricing.hourly_rate_snapshot)}/hr
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusBadge.text}
                              </span>
                              <br />
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${paymentBadge.color}`}
                              >
                                <PaymentIcon className="w-3 h-3" />
                                {paymentBadge.text}
                              </span>
                            </div>
                          </div>

                          {/* Driver ID (since driver_profile_id is a string) */}
                          <div className="text-xs text-gray-400 pt-1 border-t">
                            Driver ID: {booking.driver_profile_id}
                          </div>
                        </div>

                        {/* Card Footer */}
                      
                            <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                            <div className="flex gap-2 justify-end">
                                {/* View Details - Always visible */}
                                <button
                                onClick={() => openViewModal(booking)}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                title="View Details"
                                >
                                <Eye className="w-4 h-4" />
                                </button>

                                {/* Accept/Decline buttons - Only for 'requested' status */}
                                {booking.status === 'requested' && (
                                <>
                                    <button
                                    onClick={() => {
                                        setSelectedBooking(booking);
                                        setSelectedAction('accept');
                                        setShowRespondModal(true);
                                    }}
                                    disabled={actionLoading === booking._id}
                                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                    title="Accept Booking"
                                    >
                                    {actionLoading === booking._id ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <CheckCircle className="w-4 h-4" />
                                    )}
                                    </button>
                                    <button
                                    onClick={() => {
                                        setSelectedBooking(booking);
                                        setSelectedAction('decline');
                                        setShowRespondModal(true);
                                    }}
                                    disabled={actionLoading === booking._id}
                                    className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                                    title="Decline Booking"
                                    >
                                    <XCircle className="w-4 h-4" />
                                    </button>
                                </>
                                )}

                                {/* Cancel button - For 'accepted' or 'in_progress' status */}
                                {(booking.status === 'accepted' || booking.status === 'in_progress') && (
                                <button
                                    onClick={() => {
                                    setBookingToCancel(booking._id);
                                    setShowCancelModal(true);
                                    }}
                                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    title="Cancel Booking"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                                )}

                                {/* Complete button - Only for 'in_progress' status */}
                                {booking.status === 'in_progress' && (
                                <button
                                    onClick={() => {
                                    setBookingToComplete(booking._id);
                                    setShowCompleteModal(true);
                                    }}
                                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                    title="Complete Trip"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </button>
                                )}

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
      </div>

      {/* View Booking Details Modal */}
      {isViewModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Booking Details</h2>
                <p className="text-sm text-gray-600">{selectedBooking.code}</p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 70px)" }}>
              <div className="space-y-6">
                {/* Booking Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Booking Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Booking Code</p>
                      <p className="font-mono text-sm">{selectedBooking.code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedBooking.status).color}`}>
                        {getStatusBadge(selectedBooking.status).text}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payment Status</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getPaymentBadge(selectedBooking.payment_status_snapshot).color}`}>
                        {getPaymentBadge(selectedBooking.payment_status_snapshot).text}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Requested At</p>
                      <p className="text-sm">{formatDateTime(selectedBooking.requested_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Customer Information</h3>
                  {selectedBooking.customer_id ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="text-sm font-medium">{selectedBooking.customer_id.full_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm">{selectedBooking.customer_id.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm">{selectedBooking.customer_id.phone}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Guest user (no account)</p>
                  )}
                </div>

                {/* Trip Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Trip Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Pickup Location</p>
                      <p className="text-sm">{selectedBooking.pickup_location.address}</p>
                      <p className="text-xs text-gray-400">Label: {selectedBooking.pickup_location.label}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Dropoff Location</p>
                      <p className="text-sm">{selectedBooking.dropoff_location.address}</p>
                      <p className="text-xs text-gray-400">Label: {selectedBooking.dropoff_location.label}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Start Time</p>
                        <p className="text-sm">{formatDateTime(selectedBooking.start_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">End Time</p>
                        <p className="text-sm">{formatDateTime(selectedBooking.end_at)}</p>
                      </div>
                    </div>
                    {selectedBooking.notes && (
                      <div>
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm">{selectedBooking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Pricing</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Hourly Rate</p>
                      <p className="text-sm font-medium">{formatCurrency(selectedBooking.pricing.hourly_rate_snapshot)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Hours Requested</p>
                      <p className="text-sm font-medium">{selectedBooking.pricing.hours_requested}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(selectedBooking.pricing.estimated_total_amount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Respond to Booking Modal (Accept/Decline) */}
{showRespondModal && selectedBooking && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={() => setShowRespondModal(false)}
    />
    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 rounded-full ${selectedAction === 'accept' ? 'bg-green-100' : 'bg-orange-100'} flex items-center justify-center mr-4`}>
            {selectedAction === 'accept' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-orange-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {selectedAction === 'accept' ? 'Accept Booking' : 'Decline Booking'}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedAction === 'accept' ? 'Confirm you want to accept this booking' : 'Confirm you want to decline this booking'}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600 mb-2">Booking Details:</p>
          <p className="font-mono text-sm font-medium">{selectedBooking.code}</p>
          <p className="text-sm text-gray-700 mt-2">
            Customer: <span className="font-medium">{selectedBooking.customer_id?.full_name || "Guest User"}</span>
          </p>
          <p className="text-sm text-gray-700">
            Amount: <span className="font-bold">{formatCurrency(selectedBooking.pricing.estimated_total_amount)}</span>
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowRespondModal(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleRespondToBooking(selectedBooking._id, selectedAction)}
            className={`px-4 py-2 ${selectedAction === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'} text-white rounded-lg transition-colors`}
          >
            {selectedAction === 'accept' ? 'Accept Booking' : 'Decline Booking'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Cancel Booking Modal */}
{showCancelModal && bookingToCancel && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={() => {
        setShowCancelModal(false);
        setBookingToCancel(null);
      }}
    />
    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
            <AlertOctagon className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Cancel Booking</h3>
            <p className="text-sm text-gray-600">Confirm cancellation of this booking</p>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to cancel this booking? This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowCancelModal(false);
              setBookingToCancel(null);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={cancelling}
          >
            No, Keep Booking
          </button>
          <button
            onClick={handleCancelBooking}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            disabled={cancelling}
          >
            {cancelling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Cancelling...
              </>
            ) : (
              "Yes, Cancel Booking"
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Complete Booking Modal */}
{showCompleteModal && bookingToComplete && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={() => {
        setShowCompleteModal(false);
        setBookingToComplete(null);
      }}
    />
    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Complete Trip</h3>
            <p className="text-sm text-gray-600">Mark this trip as completed</p>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to mark this trip as completed? This will finalize the booking.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setShowCompleteModal(false);
              setBookingToComplete(null);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={completing}
          >
            Cancel
          </button>
          <button
            onClick={handleCompleteBooking}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            disabled={completing}
          >
            {completing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Completing...
              </>
            ) : (
              "Complete Trip"
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Delete Booking Modal */}
      {isDeleteModalOpen && bookingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setBookingToDelete(null);
            }}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertOctagon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Booking</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to permanently delete this booking? This will remove all booking data from the system.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setBookingToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBooking}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Booking"
                  )}
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
            {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{snackbar.message}</span>
            <button onClick={() => setSnackbar((prev) => ({ ...prev, show: false }))}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;