// DriverBookingScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAdminDriverBookings,
  deleteDriverBookingsByCustomer,
  getErrorDisplay,
  type IDriverBooking,
  type IUserRef,
  type IDriverProfileLite,
  type ILocation,
  type IPricing,
} from "../../../Services/adminAndManager/driver_booking_service";
import Sidebar from "../../../components/Sidebar";
import {
  ArrowLeft,
  Trash2,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  User,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  RefreshCw,
  XCircle,
  FileText,
  CreditCard,
  Navigation,
  MessageSquare,

  Phone,
  Mail,
  UserCheck,
  UserX,
  Truck,
  Timer,
  AlertTriangle,
  ExternalLink,
  Download,
  Printer,

} from "lucide-react";

// Status options and colors
const STATUS_OPTIONS = [
  "requested",
  "confirmed",
  "paid",
  "cancelled",
  "completed",
  "rejected",
  "expired",
];

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  requested: {
    bg: "bg-blue-100 text-blue-800",
    text: "Requested",
    icon: <Clock className="w-4 h-4" />,
  },
  confirmed: {
    bg: "bg-green-100 text-green-800",
    text: "Confirmed",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  paid: {
    bg: "bg-purple-100 text-purple-800",
    text: "Paid",
    icon: <CreditCard className="w-4 h-4" />,
  },
  cancelled: {
    bg: "bg-red-100 text-red-800",
    text: "Cancelled",
    icon: <XCircle className="w-4 h-4" />,
  },
  completed: {
    bg: "bg-indigo-100 text-indigo-800",
    text: "Completed",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  rejected: {
    bg: "bg-orange-100 text-orange-800",
    text: "Rejected",
    icon: <XCircle className="w-4 h-4" />,
  },
  expired: {
    bg: "bg-gray-100 text-gray-800",
    text: "Expired",
    icon: <Timer className="w-4 h-4" />,
  },
};

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-yellow-100 text-yellow-800", text: "Pending" },
  paid: { bg: "bg-green-100 text-green-800", text: "Paid" },
  failed: { bg: "bg-red-100 text-red-800", text: "Failed" },
  refunded: { bg: "bg-blue-100 text-blue-800", text: "Refunded" },
};

interface DriverBookingScreenProps {}

const DriverBookingScreen: React.FC<DriverBookingScreenProps> = () => {
  const navigate = useNavigate();

  // State
  const [driverBookings, setDriverBookings] = useState<IDriverBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState<IDriverBooking | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  // Delete modal state
  const [customerToDelete, setCustomerToDelete] = useState<{
    id: string;
    name: string;
    email?: string;
  } | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    start_date: "",
    end_date: "",
    min_amount: "",
    max_amount: "",
    driver_name: "",
    customer_name: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    totalRevenue: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

  // Load driver bookings
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAdminDriverBookings();
      const bookings = response.data || response.items || [];
      setDriverBookings(bookings);

      // Calculate stats
      const total = bookings.length;
      const totalRevenue = bookings.reduce((sum, booking) => {
        const amount = parseFloat(booking.pricing?.estimated_total_amount?.$numberDecimal || "0");
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      const pending = bookings.filter(b => b.status === "requested" || b.status === "confirmed").length;
      const completed = bookings.filter(b => b.status === "completed").length;
      const cancelled = bookings.filter(b => b.status === "cancelled" || b.status === "rejected").length;

      setStats({ total, totalRevenue, pending, completed, cancelled });
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      setError(errorDisplay.message || "Failed to load driver bookings");
      showSnackbar(errorDisplay.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Handle delete bookings by customer
  const handleDeleteCustomerBookings = async () => {
    if (!customerToDelete) return;

    try {
      await deleteDriverBookingsByCustomer(customerToDelete.id);
      showSnackbar(`All bookings for ${customerToDelete.name} deleted successfully`, "success");
      setCustomerToDelete(null);
      loadData();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Format date
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount?: string | number) => {
    if (!amount) return "$0.00";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(isNaN(num) ? 0 : num);
  };

  // Get user info
  const getUserInfo = (userRef?: IUserRef | string) => {
    if (!userRef) return { email: "N/A", phone: "N/A", fullName: "N/A" };
    
    if (typeof userRef === "object") {
      return {
        email: userRef.email || "N/A",
        phone: userRef.phone || "N/A",
        fullName: userRef.full_name || "N/A",
      };
    }
    
    return { email: "N/A", phone: "N/A", fullName: "N/A" };
  };

  // Get driver info
  const getDriverInfo = (driverRef?: IDriverProfileLite) => {
    if (!driverRef) return { displayName: "N/A", baseCity: "N/A", experience: "N/A" };
    
    return {
      displayName: driverRef.display_name || "N/A",
      baseCity: driverRef.base_city || "N/A",
      experience: driverRef.years_experience ? `${driverRef.years_experience} years` : "N/A",
      hourlyRate: driverRef.hourly_rate ? `$${driverRef.hourly_rate}/hr` : "N/A",
    };
  };

  // Get location info
  const getLocationInfo = (location?: ILocation) => {
    if (!location) return { label: "N/A", address: "N/A" };
    
    return {
      label: location.label || "Location",
      address: location.address || "No address provided",
      coordinates: location.latitude && location.longitude 
        ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
        : "No coordinates",
    };
  };

  // Get pricing info
  const getPricingInfo = (pricing?: IPricing) => {
    if (!pricing) return { hourlyRate: "$0.00", hours: 0, total: "$0.00" };
    
    return {
      currency: pricing.currency || "USD",
      hourlyRate: formatCurrency(pricing.hourly_rate_snapshot?.$numberDecimal),
      hours: pricing.hours_requested || 0,
      total: formatCurrency(pricing.estimated_total_amount?.$numberDecimal),
    };
  };

  // Calculate duration
  const calculateDuration = (startAt?: string, endAt?: string) => {
    if (!startAt || !endAt) return "N/A";
    
    const start = new Date(startAt);
    const end = new Date(endAt);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  // Filtered bookings
  const filteredBookings = driverBookings.filter(booking => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const bookingCode = booking.code?.toLowerCase() || "";
      const customerName = booking.customer_id?.full_name?.toLowerCase() || "";
      const driverName = booking.driver_profile_id?.display_name?.toLowerCase() || "";
      const pickupLocation = booking.pickup_location?.address?.toLowerCase() || "";
      
      if (
        !bookingCode.includes(query) &&
        !customerName.includes(query) &&
        !driverName.includes(query) &&
        !pickupLocation.includes(query)
      ) {
        return false;
      }
    }

    // Additional filters
    if (filters.status && booking.status !== filters.status) return false;
    
    if (filters.start_date) {
      const startDate = new Date(filters.start_date);
      const bookingDate = new Date(booking.start_at || booking.created_at || "");
      if (bookingDate < startDate) return false;
    }
    
    if (filters.end_date) {
      const endDate = new Date(filters.end_date);
      endDate.setHours(23, 59, 59, 999);
      const bookingDate = new Date(booking.start_at || booking.created_at || "");
      if (bookingDate > endDate) return false;
    }
    
    if (filters.min_amount) {
      const amount = parseFloat(booking.pricing?.estimated_total_amount?.$numberDecimal || "0");
      if (amount < parseFloat(filters.min_amount)) return false;
    }
    
    if (filters.max_amount) {
      const amount = parseFloat(booking.pricing?.estimated_total_amount?.$numberDecimal || "0");
      if (amount > parseFloat(filters.max_amount)) return false;
    }
    
    if (filters.driver_name) {
      const driverName = booking.driver_profile_id?.display_name?.toLowerCase() || "";
      if (!driverName.includes(filters.driver_name.toLowerCase())) return false;
    }
    
    if (filters.customer_name) {
      const customerName = booking.customer_id?.full_name?.toLowerCase() || "";
      if (!customerName.includes(filters.customer_name.toLowerCase())) return false;
    }

    return true;
  });

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: "",
      start_date: "",
      end_date: "",
      min_amount: "",
      max_amount: "",
      driver_name: "",
      customer_name: "",
    });
  };

  // Toggle booking expansion
  const toggleBookingExpansion = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  // Export data
  const exportToCSV = () => {
    const headers = [
      "Booking Code",
      "Customer",
      "Driver",
      "Start Time",
      "End Time",
      "Duration",
      "Pickup Location",
      "Dropoff Location",
      "Status",
      "Total Amount",
      "Payment Status",
      "Created At",
    ];
    
    const rows = filteredBookings.map(booking => [
      booking.code || "N/A",
      booking.customer_id?.full_name || "N/A",
      booking.driver_profile_id?.display_name || "N/A",
      formatDate(booking.start_at),
      formatDate(booking.end_at),
      calculateDuration(booking.start_at, booking.end_at),
      booking.pickup_location?.address || "N/A",
      booking.dropoff_location?.address || "N/A",
      booking.status || "N/A",
      getPricingInfo(booking.pricing).total,
      booking.payment_status_snapshot || "N/A",
      formatDate(booking.created_at),
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `driver-bookings-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    
    showSnackbar("Data exported to CSV successfully", "success");
  };

  // Print booking details
  const printBookingDetails = (booking: IDriverBooking) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const content = `
      <html>
        <head>
          <title>Driver Booking - ${booking.code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; color: #1EA2E4; margin-bottom: 10px; }
            .row { display: flex; margin-bottom: 8px; }
            .label { font-weight: bold; width: 180px; }
            .value { flex: 1; }
            .total { font-size: 18px; font-weight: bold; color: #1EA2E4; margin-top: 20px; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Driver Booking Details</h1>
            <h2>${booking.code}</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Booking Information</div>
            <div class="row"><div class="label">Status:</div><div class="value"><span class="status">${booking.status}</span></div></div>
            <div class="row"><div class="label">Created:</div><div class="value">${formatDate(booking.created_at)}</div></div>
            <div class="row"><div class="label">Booking Code:</div><div class="value">${booking.code}</div></div>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="row"><div class="label">Name:</div><div class="value">${getUserInfo(booking.customer_id).fullName}</div></div>
            <div class="row"><div class="label">Email:</div><div class="value">${getUserInfo(booking.customer_id).email}</div></div>
            <div class="row"><div class="label">Phone:</div><div class="value">${getUserInfo(booking.customer_id).phone}</div></div>
          </div>
          
          <div class="section">
            <div class="section-title">Driver Information</div>
            <div class="row"><div class="label">Name:</div><div class="value">${getDriverInfo(booking.driver_profile_id).displayName}</div></div>
            <div class="row"><div class="label">Base City:</div><div class="value">${getDriverInfo(booking.driver_profile_id).baseCity}</div></div>
            <div class="row"><div class="label">Experience:</div><div class="value">${getDriverInfo(booking.driver_profile_id).experience}</div></div>
          </div>
          
          <div class="section">
            <div class="section-title">Schedule</div>
            <div class="row"><div class="label">Start Time:</div><div class="value">${formatDate(booking.start_at)}</div></div>
            <div class="row"><div class="label">End Time:</div><div class="value">${formatDate(booking.end_at)}</div></div>
            <div class="row"><div class="label">Duration:</div><div class="value">${calculateDuration(booking.start_at, booking.end_at)}</div></div>
          </div>
          
          <div class="section">
            <div class="section-title">Locations</div>
            <div class="row"><div class="label">Pickup:</div><div class="value">${getLocationInfo(booking.pickup_location).address}</div></div>
            <div class="row"><div class="label">Dropoff:</div><div class="value">${getLocationInfo(booking.dropoff_location).address}</div></div>
          </div>
          
          <div class="section">
            <div class="section-title">Pricing</div>
            <div class="row"><div class="label">Hourly Rate:</div><div class="value">${getPricingInfo(booking.pricing).hourlyRate}</div></div>
            <div class="row"><div class="label">Hours Requested:</div><div class="value">${getPricingInfo(booking.pricing).hours}</div></div>
            <div class="row"><div class="label">Payment Status:</div><div class="value">${booking.payment_status_snapshot || "N/A"}</div></div>
            <div class="row"><div class="label">Paid At:</div><div class="value">${booking.paid_at ? formatDate(booking.paid_at) : "N/A"}</div></div>
            <div class="total">Total Amount: ${getPricingInfo(booking.pricing).total}</div>
          </div>
          
          ${booking.notes ? `
          <div class="section">
            <div class="section-title">Notes</div>
            <p>${booking.notes}</p>
          </div>
          ` : ""}
          
          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #1EA2E4; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Print This Document
            </button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Get status info
  const getStatusInfo = (status?: string) => {
    if (!status) return STATUS_COLORS.requested;
    return STATUS_COLORS[status] || STATUS_COLORS.requested;
  };

  // Get payment status info
  const getPaymentStatusInfo = (status?: string | null) => {
    if (!status) return PAYMENT_STATUS_COLORS.pending;
    return PAYMENT_STATUS_COLORS[status] || PAYMENT_STATUS_COLORS.pending;
  };

  // Render stars for rating
  const renderStars = (rating?: number | null) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-3 h-3 rounded-full ${star <= rating ? "bg-yellow-400" : "bg-gray-300"}`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans relative">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
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
              <button
                onClick={() => navigate("/admin-dashboard")}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Driver Bookings</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage all driver booking requests and assignments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className="font-semibold">{filteredBookings.length}</span> booking(s)
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Total Bookings */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    ${stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Pending */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            {/* Cancelled */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.cancelled}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 pb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by booking code, customer, driver, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium">Filters</span>
                {showFilters ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {/* Export Button */}
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Export to CSV"
              >
                <Download className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium hidden md:inline">Export</span>
              </button>

              {/* Refresh */}
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    >
                      <option value="">All Statuses</option>
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.start_date}
                      onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.end_date}
                      onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={filters.min_amount}
                        onChange={(e) => setFilters(prev => ({ ...prev, min_amount: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={filters.max_amount}
                        onChange={(e) => setFilters(prev => ({ ...prev, max_amount: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        placeholder="Max"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Driver Name
                    </label>
                    <input
                      type="text"
                      value={filters.driver_name}
                      onChange={(e) => setFilters(prev => ({ ...prev, driver_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      placeholder="Filter by driver"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={filters.customer_name}
                      onChange={(e) => setFilters(prev => ({ ...prev, customer_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      placeholder="Filter by customer"
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
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
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Driver Bookings Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery || Object.values(filters).some(v => v)
                  ? "No bookings match your search criteria. Try adjusting your filters."
                  : "No driver bookings found in the system."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const statusInfo = getStatusInfo(booking.status);
                const customerInfo = getUserInfo(booking.customer_id);
                const driverInfo = getDriverInfo(booking.driver_profile_id);
                const pickupInfo = getLocationInfo(booking.pickup_location);
                const dropoffInfo = getLocationInfo(booking.dropoff_location);
                const pricingInfo = getPricingInfo(booking.pricing);
                const duration = calculateDuration(booking.start_at, booking.end_at);
                
                return (
                  <div
                    key={booking._id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Booking Header */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-flex items-center gap-1 ${statusInfo.bg}`}>
                              {statusInfo.icon}
                              {statusInfo.text}
                            </span>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded font-mono">
                              {booking.code}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(booking.created_at)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleBookingExpansion(booking._id)}
                            className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                            title={expandedBooking === booking._id ? "Show Less" : "Show More"}
                          >
                            {expandedBooking === booking._id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => printBookingDetails(booking)}
                            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Print Details"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const customer = booking.customer_id;
                              if (typeof customer === 'object') {
                                setCustomerToDelete({
                                  id: customer._id,
                                  name: customer.full_name || "Customer",
                                  email: customer.email,
                                });
                              }
                            }}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete All Customer Bookings"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Booking Content */}
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        {/* Customer & Driver Info */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{customerInfo.fullName}</p>
                              <p className="text-xs text-gray-500">Customer</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                              <Truck className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{driverInfo.displayName}</p>
                              <p className="text-xs text-gray-500">Driver</p>
                            </div>
                          </div>
                        </div>

                        {/* Location Info */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mt-0.5">
                              <MapPin className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Pickup</p>
                              <p className="text-xs text-gray-600 truncate">{pickupInfo.address}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mt-0.5">
                              <Navigation className="w-5 h-5 text-purple-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Dropoff</p>
                              <p className="text-xs text-gray-600 truncate">{dropoffInfo.address}</p>
                            </div>
                          </div>
                        </div>

                        {/* Schedule & Pricing */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Duration:</span>
                            </div>
                            <span className="text-sm font-medium">{duration}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Start:</span>
                            </div>
                            <span className="text-sm font-medium">{formatDate(booking.start_at)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Total:</span>
                            </div>
                            <span className="text-sm font-medium text-[#1EA2E4]">
                              {pricingInfo.total}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedBooking === booking._id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Payment Info */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-gray-700">Payment Information</h4>
                                {booking.payment_status_snapshot && (
                                  <span className={`px-2 py-1 text-xs font-semibold rounded ${getPaymentStatusInfo(booking.payment_status_snapshot).bg}`}>
                                    {getPaymentStatusInfo(booking.payment_status_snapshot).text}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Hourly Rate:</span>
                                  <span className="font-medium">{pricingInfo.hourlyRate}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Hours:</span>
                                  <span className="font-medium">{pricingInfo.hours}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Currency:</span>
                                  <span className="font-medium">{pricingInfo.currency}</span>
                                </div>
                                {booking.paid_at && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Paid At:</span>
                                    <span className="font-medium">{formatDate(booking.paid_at)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Contact Information</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-gray-600">{customerInfo.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-gray-600">{customerInfo.phone}</span>
                                </div>
                                {booking.driver_profile_id?.user_id && (
                                  <div className="flex items-center gap-2">
                                    <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-gray-600">Driver ID: {booking.driver_profile_id.user_id.slice(-8)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          {booking.notes && (
                            <div className="mt-3 bg-blue-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="w-4 h-4 text-blue-500" />
                                <h4 className="text-sm font-semibold text-blue-700">Notes</h4>
                              </div>
                              <p className="text-sm text-blue-600">{booking.notes}</p>
                            </div>
                          )}

                          {/* Rating */}
                          {booking.customer_rating_of_driver && (
                            <div className="mt-3 bg-yellow-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-yellow-700">Customer Rating</h4>
                                {renderStars(booking.customer_rating_of_driver)}
                              </div>
                              {booking.customer_review_text && (
                                <p className="text-sm text-yellow-600 mt-1">{booking.customer_review_text}</p>
                              )}
                            </div>
                          )}

                          {/* Timeline */}
                          <div className="mt-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Timeline</h4>
                            <div className="space-y-2 text-sm">
                              {booking.requested_at && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Requested:</span>
                                  <span className="font-medium">{formatDate(booking.requested_at)}</span>
                                </div>
                              )}
                              {booking.driver_responded_at && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Driver Responded:</span>
                                  <span className="font-medium">{formatDate(booking.driver_responded_at)}</span>
                                </div>
                              )}
                              {booking.completed_at && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Completed:</span>
                                  <span className="font-medium">{formatDate(booking.completed_at)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* View Booking Modal */}
      {isViewModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Booking Details</h2>
                  <p className="text-sm text-gray-600">Complete booking information</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-flex items-center gap-1 ${getStatusInfo(selectedBooking.status).bg}`}>
                    {getStatusInfo(selectedBooking.status).icon}
                    {getStatusInfo(selectedBooking.status).text}
                  </span>
                  <span className="px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded font-mono">
                    {selectedBooking.code}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-500" />
                      Customer Information
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="text-gray-900 font-medium">{getUserInfo(selectedBooking.customer_id).fullName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="text-gray-900 font-medium">{getUserInfo(selectedBooking.customer_id).email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="text-gray-900 font-medium">{getUserInfo(selectedBooking.customer_id).phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Customer ID</p>
                          <p className="text-gray-900 font-mono text-sm">
                            {typeof selectedBooking.customer_id === 'object' ? selectedBooking.customer_id._id.slice(-8) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driver Information */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-gray-500" />
                      Driver Information
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Display Name</p>
                          <p className="text-gray-900 font-medium">{getDriverInfo(selectedBooking.driver_profile_id).displayName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Base City</p>
                          <p className="text-gray-900 font-medium">{getDriverInfo(selectedBooking.driver_profile_id).baseCity}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Experience</p>
                          <p className="text-gray-900 font-medium">{getDriverInfo(selectedBooking.driver_profile_id).experience}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Hourly Rate</p>
                          <p className="text-gray-900 font-medium">{getDriverInfo(selectedBooking.driver_profile_id).hourlyRate}</p>
                        </div>
                      </div>
                      {selectedBooking.driver_profile_id?.bio && (
                        <div>
                          <p className="text-sm text-gray-500">Bio</p>
                          <p className="text-gray-900 text-sm mt-1">{selectedBooking.driver_profile_id.bio}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule Information */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      Schedule Information
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Start Time</p>
                          <p className="text-gray-900 font-medium">{formatDate(selectedBooking.start_at)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">End Time</p>
                          <p className="text-gray-900 font-medium">{formatDate(selectedBooking.end_at)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="text-gray-900 font-medium">{calculateDuration(selectedBooking.start_at, selectedBooking.end_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Location Information */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      Location Information
                    </h4>
                    <div className="space-y-6">
                      {/* Pickup Location */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Pickup Location
                        </h5>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <p className="text-gray-900 font-medium mb-1">
                            {getLocationInfo(selectedBooking.pickup_location).label}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {getLocationInfo(selectedBooking.pickup_location).address}
                          </p>
                          {selectedBooking.pickup_location?.latitude && selectedBooking.pickup_location?.longitude && (
                            <p className="text-gray-500 text-xs mt-2">
                              Coordinates: {getLocationInfo(selectedBooking.pickup_location).coordinates}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dropoff Location */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          Dropoff Location
                        </h5>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <p className="text-gray-900 font-medium mb-1">
                            {getLocationInfo(selectedBooking.dropoff_location).label}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {getLocationInfo(selectedBooking.dropoff_location).address}
                          </p>
                          {selectedBooking.dropoff_location?.latitude && selectedBooking.dropoff_location?.longitude && (
                            <p className="text-gray-500 text-xs mt-2">
                              Coordinates: {getLocationInfo(selectedBooking.dropoff_location).coordinates}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-gray-500" />
                      Pricing Information
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Hourly Rate</p>
                          <p className="text-gray-900 font-medium">{getPricingInfo(selectedBooking.pricing).hourlyRate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Hours Requested</p>
                          <p className="text-gray-900 font-medium">{getPricingInfo(selectedBooking.pricing).hours}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Currency</p>
                          <p className="text-gray-900 font-medium">{getPricingInfo(selectedBooking.pricing).currency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Payment Status</p>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getPaymentStatusInfo(selectedBooking.payment_status_snapshot).bg}`}>
                            {getPaymentStatusInfo(selectedBooking.payment_status_snapshot).text}
                          </span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <p className="text-lg font-semibold text-gray-800">Total Amount</p>
                          <p className="text-2xl font-bold text-[#1EA2E4]">
                            {getPricingInfo(selectedBooking.pricing).total}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-500" />
                      Additional Information
                    </h4>
                    <div className="space-y-4">
                      {selectedBooking.notes && (
                        <div>
                          <p className="text-sm text-gray-500">Notes</p>
                          <div className="mt-1 p-3 bg-white rounded border border-gray-200">
                            <p className="text-gray-700">{selectedBooking.notes}</p>
                          </div>
                        </div>
                      )}

                      {selectedBooking.customer_rating_of_driver && (
                        <div>
                          <p className="text-sm text-gray-500">Customer Rating</p>
                          <div className="mt-1 flex items-center gap-2">
                            {renderStars(selectedBooking.customer_rating_of_driver)}
                          </div>
                          {selectedBooking.customer_review_text && (
                            <p className="text-gray-700 text-sm mt-2">{selectedBooking.customer_review_text}</p>
                          )}
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-gray-500">Booking Channel</p>
                        <p className="text-gray-900 font-medium capitalize">
                          {selectedBooking.created_channel || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-8 bg-gray-50 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  Booking Timeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedBooking.requested_at && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Requested At</p>
                      <p className="text-gray-900 font-medium">{formatDate(selectedBooking.requested_at)}</p>
                    </div>
                  )}
                  {selectedBooking.driver_responded_at && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Driver Responded</p>
                      <p className="text-gray-900 font-medium">{formatDate(selectedBooking.driver_responded_at)}</p>
                    </div>
                  )}
                  {selectedBooking.paid_at && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Paid At</p>
                      <p className="text-gray-900 font-medium">{formatDate(selectedBooking.paid_at)}</p>
                    </div>
                  )}
                  {selectedBooking.completed_at && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Completed At</p>
                      <p className="text-gray-900 font-medium">{formatDate(selectedBooking.completed_at)}</p>
                    </div>
                  )}
                  {selectedBooking.cancelled_at && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Cancelled At</p>
                      <p className="text-gray-900 font-medium">{formatDate(selectedBooking.cancelled_at)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Booking ID: <span className="font-mono">{selectedBooking._id}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => printBookingDetails(selectedBooking)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Bookings Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setCustomerToDelete(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Customer Bookings</h3>
                  <p className="text-sm text-gray-600">This will delete ALL bookings for this customer</p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="text-sm font-medium">Warning: This action cannot be undone</p>
                </div>
                <p className="text-sm text-red-600">
                  You are about to delete all driver bookings for{" "}
                  <span className="font-semibold">{customerToDelete.name}</span>.
                  {customerToDelete.email && ` (${customerToDelete.email})`}
                </p>
              </div>

              <div className="text-sm text-gray-600 mb-6">
                <p>This will permanently delete:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All booking records for this customer</li>
                  <li>Associated payment information</li>
                  <li>Booking history and logs</li>
                  <li>Customer ratings and reviews</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCustomerToDelete(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCustomerBookings}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete All Bookings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${snackbar.type === "success" ? "bg-green-50 border border-green-200 text-green-800" :
                snackbar.type === "error" ? "bg-red-50 border border-red-200 text-red-800" :
                  "bg-blue-50 border border-blue-200 text-blue-800"
            }`}>
            {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{snackbar.message}</span>
            <button
              onClick={() => setSnackbar(prev => ({ ...prev, show: false }))}
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

export default DriverBookingScreen;