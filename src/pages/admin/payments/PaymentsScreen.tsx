import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../../components/Sidebar";
import PaymentService from "../../../Services/payment_service";
import { fetchBranches, type IBranch } from "../../../Services/adminAndManager/admin_branch_service";
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
  CreditCard,
  Navigation,
  FileText,
  Truck,
  XCircle,
  Wallet,
  Smartphone,
  Building,
  Clock as ClockIcon,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PaymentItem {
  _id: string;
  reservation_id: any;
  driver_booking_id: any;
  user_id: any;
  provider: string;
  method: string;
  amount: {
    $numberDecimal: string;
  };
  currency: string;
  paymentStatus: string;
  pollUrl: string;
  pricePaid: number;
  promotionApplied: boolean;
  promotionDiscount: number;
  captured_at: string | null;
  promo_code_id: string | null;
  promo_code: string | null;
  boughtAt: string;
  refunds: any[];
  created_at: string;
  updated_at: string;
  __v: number;
}

const PaymentsScreen: React.FC = () => {
  // State
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [branches, setBranches] = useState<IBranch[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Modal states
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
 // Status check state
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    const [providerStatus, setProviderStatus] = useState<string | null>(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper to parse amount from $numberDecimal
  const parseAmount = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value.$numberDecimal) {
      return parseFloat(value.$numberDecimal);
    }
    return Number(value) || 0;
  };

  // Load payments
  const loadPayments = useCallback(async (branchId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await PaymentService.getAllPayments({ branch_id: branchId !== "all" ? branchId : undefined });
      const paymentsData = response.items || [];
      setTotalItems(paymentsData.length);
      setPayments(paymentsData);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to load payments";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPayments();
    fetchBranches().then(r => setBranches(r.data || [])).catch(() => {});
  }, [loadPayments]);

  // Reload when branch filter changes
  useEffect(() => {
    loadPayments(branchFilter);
  }, [branchFilter, loadPayments]);

  // Check payment status
const checkPaymentStatus = async (paymentId: string) => {
  try {
    setIsCheckingStatus(true);
    const response = await PaymentService.getPaymentStatus(paymentId);
    
    if (response.success) {
      setPaymentStatus(response.status);
      setProviderStatus(response.provider_status);
      
      // Update the payment in the list if status changed
      if (response.status !== selectedPayment?.paymentStatus) {
        showSnackbar(`Payment status updated to ${response.status.toUpperCase()}`, "info");
        loadPayments(); // Reload to get fresh data
      }
    }
  } catch (err: any) {
    const errorMessage = err?.message || "Failed to check payment status";
    showSnackbar(errorMessage, "error");
  } finally {
    setIsCheckingStatus(false);
  }
};

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Open view modal
  const openViewModal = (payment: PaymentItem) => {
    setSelectedPayment(payment);
    setPaymentStatus(null);
    setProviderStatus(null);
    setIsViewModalOpen(true);
  };

  // Auto-check status when modal opens
useEffect(() => {
  if (isViewModalOpen && selectedPayment) {
    checkPaymentStatus(selectedPayment._id);
  }
}, [isViewModalOpen, selectedPayment]);

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      searchTerm === "" ||
      payment._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.user_id?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.user_id?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.provider.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || payment.paymentStatus === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    
    let matchesType = true;
    if (typeFilter === "driver_booking") {
      matchesType = payment.driver_booking_id !== null;
    } else if (typeFilter === "reservation") {
      matchesType = payment.reservation_id !== null;
    }

    return matchesSearch && matchesStatus && matchesMethod && matchesType;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return { text: "PAID", color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "pending":
        return { text: "PENDING", color: "bg-yellow-100 text-yellow-800", icon: Clock };
      case "cancelled":
        return { text: "CANCELLED", color: "bg-red-100 text-red-800", icon: XCircle };
      case "sent":
        return { text: "SENT", color: "bg-blue-100 text-blue-800", icon: CreditCard };
      default:
        return { text: "UNKNOWN", color: "bg-gray-100 text-gray-800", icon: AlertCircle };
    }
  };

  // Get method badge
  const getMethodBadge = (method: string) => {
    switch (method) {
      case "card":
        return { text: "CARD", color: "bg-purple-100 text-purple-800", icon: CreditCard };
      case "wallet":
        return { text: "WALLET", color: "bg-indigo-100 text-indigo-800", icon: Wallet };
      default:
        return { text: method.toUpperCase(), color: "bg-gray-100 text-gray-800", icon: Smartphone };
    }
  };

  // Get type badge
  const getTypeBadge = (payment: PaymentItem) => {
    if (payment.driver_booking_id) {
      return { text: "DRIVER BOOKING", color: "bg-blue-100 text-blue-800", icon: Truck };
    }
    if (payment.reservation_id) {
      return { text: "RESERVATION", color: "bg-green-100 text-green-800", icon: Car };
    }
    return { text: "UNKNOWN", color: "bg-gray-100 text-gray-800", icon: AlertCircle };
  };


 // Format time only (HH:MM AM/PM)
const formatTime = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format date only (MMM DD, YYYY)
const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format date with time (MMM DD, YYYY - HH:MM AM/PM)
const formatDateTime = (dateString?: string) => {
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

  // Calculate statistics
  const totalPayments = filteredPayments.length;
  const totalRevenue = filteredPayments
    .filter(p => p.paymentStatus === "paid")
    .reduce((sum, p) => sum + parseAmount(p.amount), 0);
  
  const pendingCount = filteredPayments.filter(p => p.paymentStatus === "pending").length;
  const paidCount = filteredPayments.filter(p => p.paymentStatus === "paid").length;

  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
                <h1 className="text-2xl font-bold text-gray-800">Payments Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage all payments from reservations and driver bookings</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold">{totalItems}</span> payments
              </div>
              <button
                onClick={loadPayments}
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
                    <p className="text-sm text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-800">{totalPayments}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <CreditCard className="w-6 h-6 text-[#1EA2E4]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalRevenue)}
                    </p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Paid Payments</p>
                    <p className="text-2xl font-bold text-green-600">{paidCount}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Payments</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-500" />
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
                      placeholder="Search by payment ID, customer name, or provider..."
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
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Types</option>
                      <option value="driver_booking">Driver Bookings</option>
                      <option value="reservation">Reservations</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="sent">Sent</option>
                    </select>
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={methodFilter}
                      onChange={(e) => setMethodFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Methods</option>
                      <option value="card">Card</option>
                      <option value="wallet">Wallet</option>
                    </select>
                    <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[160px]"
                    >
                      <option value="all">All Branches</option>
                      {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payments Grid - Cards */}
            <div>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                    <p className="text-gray-600">Loading payments...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                  <p className="text-red-600 text-center mb-4">{error}</p>
                  <button
                    onClick={loadPayments}
                    className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <CreditCard className="w-20 h-20 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No payments found</p>
                  <p className="text-gray-400 text-center">
                    {searchTerm || statusFilter !== "all" || methodFilter !== "all"
                      ? "Try adjusting your filters or search terms"
                      : "No payments have been processed yet"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPayments.map((payment) => {
                      const statusBadge = getStatusBadge(payment.paymentStatus);
                      const methodBadge = getMethodBadge(payment.method);
                      const typeBadge = getTypeBadge(payment);
                      const StatusIcon = statusBadge.icon;
                      const MethodIcon = methodBadge.icon;
                      const TypeIcon = typeBadge.icon;
                      const amount = parseAmount(payment.amount);

                      return (
                        <div
                          key={payment._id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                        >
                          {/* Card Header */}
                         {/* Card Header */}
                            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex justify-between items-start">
                                <div>
                                <p className="text-xs text-gray-500">Booking Type</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {payment.driver_booking_id ? (
                                    <>
                                        <Truck className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm font-medium text-gray-900">Driver Booking</span>
                                    </>
                                    ) : payment.reservation_id ? (
                                    <>
                                        <Car className="w-4 h-4 text-green-500" />
                                        <span className="text-sm font-medium text-gray-900">Reservation</span>
                                    </>
                                    ) : (
                                    <span className="text-sm font-medium text-gray-900">Unknown</span>
                                    )}
                                </div>
                                </div>
                                <div className="text-right">
                                <p className="text-xs text-gray-500">Status</p>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusBadge(payment.paymentStatus).color}`}>
                                    {getStatusBadge(payment.paymentStatus).text}
                                </span>
                                </div>
                            </div>
                            </div>

                          {/* Card Body */}
                          <div className="p-4 space-y-3">
                            {/* Customer */}
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {payment.user_id?.full_name || "Unknown User"}
                                </p>
                                <p className="text-xs text-gray-500">{payment.user_id?.email || "No email"}</p>
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-gray-500">Amount</p>
                                  <p className="text-2xl font-bold text-gray-900">
                                    {formatCurrency(amount)}
                                  </p>
                                </div>
                                <div className="text-right space-y-1">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${methodBadge.color}`}
                                  >
                                    <MethodIcon className="w-3 h-3" />
                                    {methodBadge.text}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Provider</span>
                                <span className="text-sm font-medium text-gray-700 capitalize">{payment.provider}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Date</span>
                                <span className="text-sm text-gray-700">{formatDate(payment.boughtAt)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Time</span>
                                <span className="text-sm text-gray-700">
                                   {formatTime(payment.boughtAt)}
                                </span>
                              </div>
                            </div>

                            {/* Badges */}
                          
                          </div>
                          {/* Card Footer */}
                            <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                            <div className="flex justify-end">
                                <button
                                onClick={() => openViewModal(payment)}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                title="View Details"
                                >
                                <Eye className="w-4 h-4" />
                                </button>
                            </div>
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

      {/* View Payment Details Modal */}
      {isViewModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Payment Details</h2>
                <p className="text-sm text-gray-600 font-mono">{selectedPayment._id}</p>
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
                {/* Payment Overview */}
               
                
               
<div className="bg-gray-50 rounded-xl p-6">
  <div className="flex justify-between items-center mb-4">
    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
      Payment Overview
    </h4>
    {isCheckingStatus && (
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
        <span className="text-xs text-gray-500">Updating status...</span>
      </div>
    )}
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <p className="text-xs text-gray-500">Amount</p>
      <p className="text-2xl font-bold text-gray-900">
        {formatCurrency(parseAmount(selectedPayment.amount))}
      </p>
      <p className="text-xs text-gray-500 mt-2">Currency: {selectedPayment.currency}</p>
    </div>
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <p className="text-xs text-gray-500">Payment Status</p>
      <div className="mt-2">
        {isCheckingStatus ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-500">Checking status...</span>
          </div>
        ) : (
          <>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full ${getStatusBadge(paymentStatus || selectedPayment.paymentStatus).color}`}>
              {getStatusBadge(paymentStatus || selectedPayment.paymentStatus).text}
            </span>
            {providerStatus && (
              <p className="text-xs text-gray-500 mt-2">
                Provider Status: {providerStatus.toUpperCase()}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  </div>
</div>

                {/* Payment Method */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Payment Method
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Provider</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{selectedPayment.provider}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Method</p>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{selectedPayment.method}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Customer Information
                  </h4>
                  {selectedPayment.user_id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="text-sm font-medium">{selectedPayment.user_id.full_name}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium">{selectedPayment.user_id.email}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium">{selectedPayment.user_id.phone || "N/A"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">User information not available</p>
                  )}
                </div>

                {/* Booking Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Booking Information
                  </h4>
                  {selectedPayment.driver_booking_id ? (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="w-5 h-5 text-blue-500" />
                        <p className="font-medium text-gray-900">Driver Booking</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        Booking Code: <span className="font-mono font-medium">{selectedPayment.driver_booking_id.code}</span>
                      </p>
                    </div>
                  ) : selectedPayment.reservation_id ? (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="w-5 h-5 text-green-500" />
                        <p className="font-medium text-gray-900">Reservation</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        Reservation Code: <span className="font-mono font-medium">{selectedPayment.reservation_id.code}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No booking information available</p>
                  )}
                </div>

                {/* Timeline */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Timeline
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Purchased At</p>
                      <p className="text-sm font-medium">{formatDateTime(selectedPayment.boughtAt)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Created At</p>
                      <p className="text-sm font-medium">{formatDateTime(selectedPayment.created_at)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="text-sm font-medium">{formatDateTime(selectedPayment.updated_at)}</p>
                    </div>
                    {selectedPayment.captured_at && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Captured At</p>
                        <p className="text-sm font-medium">{formatDateTime(selectedPayment.captured_at)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Poll URL */}
                {selectedPayment.pollUrl && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                      Poll URL
                    </h4>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 break-all">{selectedPayment.pollUrl}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
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

export default PaymentsScreen;