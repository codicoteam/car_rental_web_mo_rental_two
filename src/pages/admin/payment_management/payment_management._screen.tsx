// src/pages/admin/PaymentsManagement.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import {
  Search,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  RefreshCw,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Ban,
  Download,
  BarChart3,
  Clock,
  CheckSquare,
  XCircle,
  RotateCcw,
  Shield,
} from "lucide-react";
import {
  fetchAllPayments,
  fetchPaymentById,

  getErrorDisplay,
  parseDecimalValue,
  formatCurrencyDisplay,

  type IPaymentsListResponse,
  type PaymentStatus,
  type PaymentProvider,
  type PaymentMethod,
} from "../../../Services/adminAndManager/payment_service";

const PaymentsManagement: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [payments, setPayments] = useState<IPaymentItem[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<IPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [providerFilter, setProviderFilter] = useState<PaymentProvider | "all">("all");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "all">("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  // Modal states
  const [selectedPayment, setSelectedPayment] = useState<IPaymentItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPolling, setIsPolling] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [paymentToCancel, setPaymentToCancel] = useState<string | null>(null);

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Statistics
  const [stats, setStats] = useState({
    totalAmount: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    averagePayment: 0,
  });

  // Load payments
  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response: IPaymentsListResponse = await fetchAllPayments();
      const allPayments = response.items || [];
      
      setPayments(allPayments);
      setPagination(prev => ({
        ...prev,
        total: response.total || allPayments.length,
        totalPages: Math.ceil((response.total || allPayments.length) / prev.limit),
      }));

      // Calculate statistics
      calculateStatistics(allPayments);
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      setError(errorDisplay.message || "Failed to load payments");
      showSnackbar(errorDisplay.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Filter payments whenever filters change
  useEffect(() => {
    let result = [...payments];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(payment =>
        payment._id?.toLowerCase().includes(term) ||
        payment.reservation_id?._id?.toLowerCase().includes(term) ||
        payment.driver_booking_id?._id?.toLowerCase().includes(term) ||
        payment.user_id?.email?.toLowerCase().includes(term) ||
        payment.user_id?.full_name?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(payment => payment.paymentStatus === statusFilter);
    }

    // Apply provider filter
    if (providerFilter !== "all") {
      result = result.filter(payment => payment.provider === providerFilter);
    }

    // Apply method filter
    if (methodFilter !== "all") {
      result = result.filter(payment => payment.method === methodFilter);
    }

    // Apply date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      result = result.filter(payment => {
        const paymentDate = new Date(payment.created_at || payment.boughtAt || "");
        return paymentDate >= startDate;
      });
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      result = result.filter(payment => {
        const paymentDate = new Date(payment.created_at || payment.boughtAt || "");
        return paymentDate <= endDate;
      });
    }

    // Apply pagination
    const startIndex = (pagination.page - 1) * pagination.limit;
    const paginatedResult = result.slice(startIndex, startIndex + pagination.limit);

    setFilteredPayments(paginatedResult);
    setPagination(prev => ({
      ...prev,
      total: result.length,
      totalPages: Math.ceil(result.length / prev.limit),
    }));
  }, [payments, searchTerm, statusFilter, providerFilter, methodFilter, dateRange, pagination.page, pagination.limit]);

  // Calculate statistics
  const calculateStatistics = useCallback((paymentsList: IPaymentItem[]) => {
    let totalAmount = 0;
    let successfulCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    paymentsList.forEach(payment => {
      const amount = parseDecimalValue(payment.amount || 0);
      totalAmount += amount;

      switch (payment.paymentStatus) {
        case "paid":
        case "sent":
          successfulCount++;
          break;
        case "pending":
        case "awaiting_delivery":
        case "awaiting_confirmation":
          pendingCount++;
          break;
        case "failed":
        case "cancelled":
        case "unpaid":
          failedCount++;
          break;
      }
    });

    setStats({
      totalAmount,
      successfulPayments: successfulCount,
      pendingPayments: pendingCount,
      failedPayments: failedCount,
      averagePayment: paymentsList.length > 0 ? totalAmount / paymentsList.length : 0,
    });
  }, []);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Handle poll payment status
  const handlePollPayment = async (paymentId: string) => {
    try {
      setIsPolling(paymentId);
      const response = await pollPaymentStatus(paymentId);
      
      // Update the payment in the list
      setPayments(prev => prev.map(payment => 
        payment._id === paymentId 
          ? { ...payment, ...response.data, ...response.item, ...response.payment }
          : payment
      ));

      showSnackbar("Payment status updated successfully", "success");
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    } finally {
      setIsPolling(null);
    }
  };

  // Handle cancel payment
  const handleCancelPayment = async (paymentId: string) => {
    try {
      setIsCancelling(paymentId);
      const response = await cancelPayment(paymentId);
      
      // Update the payment in the list
      setPayments(prev => prev.map(payment => 
        payment._id === paymentId 
          ? { ...payment, ...response.data, ...response.item, ...response.payment }
          : payment
      ));

      showSnackbar("Payment cancelled successfully", "success");
      setPaymentToCancel(null);
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    } finally {
      setIsCancelling(null);
    }
  };

  // View payment details
  const handleViewDetails = async (paymentId: string) => {
    try {
      const payment = await fetchPaymentById(paymentId);
      setSelectedPayment(payment);
      setIsDetailsModalOpen(true);
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Get status badge color and icon
  const getStatusConfig = (status?: string) => {
    switch (status) {
      case "paid":
      case "sent":
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          iconColor: "text-green-600",
        };
      case "pending":
      case "awaiting_delivery":
      case "awaiting_confirmation":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Clock,
          iconColor: "text-yellow-600",
        };
      case "failed":
      case "unpaid":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: XCircle,
          iconColor: "text-red-600",
        };
      case "cancelled":
      case "refunded":
      case "partially_refunded":
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Ban,
          iconColor: "text-gray-600",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: AlertCircle,
          iconColor: "text-gray-600",
        };
    }
  };

  // Get provider badge color
  const getProviderColor = (provider?: string) => {
    switch (provider) {
      case "paynow": return "bg-blue-100 text-blue-800 border-blue-200";
      case "ecocash": return "bg-purple-100 text-purple-800 border-purple-200";
      case "bank_transfer": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "cash": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get method badge color
  const getMethodColor = (method?: string) => {
    switch (method) {
      case "card": return "bg-teal-100 text-teal-800 border-teal-200";
      case "wallet": return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "bank": return "bg-violet-100 text-violet-800 border-violet-200";
      case "cash": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setProviderFilter("all");
    setMethodFilter("all");
    setDateRange({ start: "", end: "" });
  };

  // Status options for filter
  const statusOptions: Array<{ value: PaymentStatus | "all"; label: string }> = [
    { value: "all", label: "All Statuses" },
    { value: "paid", label: "Paid" },
    { value: "sent", label: "Sent" },
    { value: "pending", label: "Pending" },
    { value: "awaiting_delivery", label: "Awaiting Delivery" },
    { value: "awaiting_confirmation", label: "Awaiting Confirmation" },
    { value: "failed", label: "Failed" },
    { value: "unpaid", label: "Unpaid" },
    { value: "cancelled", label: "Cancelled" },
    { value: "refunded", label: "Refunded" },
  ];

  // Provider options for filter
  const providerOptions: Array<{ value: PaymentProvider | "all"; label: string }> = [
    { value: "all", label: "All Providers" },
    { value: "paynow", label: "PayNow" },
    { value: "ecocash", label: "EcoCash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cash", label: "Cash" },
  ];

  // Method options for filter
  const methodOptions: Array<{ value: PaymentMethod | "all"; label: string }> = [
    { value: "all", label: "All Methods" },
    { value: "card", label: "Card" },
    { value: "wallet", label: "Wallet" },
    { value: "bank", label: "Bank" },
    { value: "cash", label: "Cash" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
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
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Payments Management</h1>
                <p className="text-sm text-gray-600 mt-1">Monitor and manage all payment transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold">{pagination.total}</span> payments
              </div>
              <button
                onClick={loadPayments}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Amount */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Amount</p>
                  <h3 className="text-2xl font-bold text-blue-800 mt-1">
                    {formatCurrencyDisplay(stats.totalAmount, "USD")}
                  </h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-blue-500 mt-2">Across all payments</p>
            </div>

            {/* Successful Payments */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Successful</p>
                  <h3 className="text-2xl font-bold text-green-800 mt-1">
                    {stats.successfulPayments}
                  </h3>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-green-500 mt-2">Paid & Sent payments</p>
            </div>

            {/* Pending Payments */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <h3 className="text-2xl font-bold text-yellow-800 mt-1">
                    {stats.pendingPayments}
                  </h3>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-xs text-yellow-500 mt-2">Awaiting processing</p>
            </div>

            {/* Failed Payments */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Failed</p>
                  <h3 className="text-2xl font-bold text-red-800 mt-1">
                    {stats.failedPayments}
                  </h3>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-xs text-red-500 mt-2">Failed & Cancelled</p>
            </div>

            {/* Average Payment */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Average Payment</p>
                  <h3 className="text-2xl font-bold text-purple-800 mt-1">
                    {formatCurrencyDisplay(stats.averagePayment, "USD")}
                  </h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-purple-500 mt-2">Per transaction</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="px-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Payment ID, User Email, Reservation ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    placeholder="Start Date"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    placeholder="End Date"
                  />
                </div>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "all")}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-10 min-w-[160px]"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value as PaymentProvider | "all")}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-10 min-w-[160px]"
                >
                  {providerOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | "all")}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-10 min-w-[160px]"
                >
                  {methodOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {(searchTerm || statusFilter !== "all" || providerFilter !== "all" || methodFilter !== "all" || dateRange.start || dateRange.end) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="p-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-600">Loading payments...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-red-600 text-center mb-4">{error}</p>
                <button
                  onClick={loadPayments}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <CreditCard className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No payments found</p>
                <p className="text-gray-400 text-center mb-6">
                  {searchTerm || statusFilter !== "all" || providerFilter !== "all" || methodFilter !== "all" || dateRange.start || dateRange.end
                    ? "Try adjusting your filters or search terms"
                    : "No payment transactions available"}
                </p>
                {(searchTerm || statusFilter !== "all" || providerFilter !== "all" || methodFilter !== "all" || dateRange.start || dateRange.end) && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Details</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Provider/Method</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPayments.map((payment) => {
                        const statusConfig = getStatusConfig(payment.paymentStatus);
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                          <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">Payment #{payment._id?.slice(-8)}</div>
                                <div className="text-xs text-gray-500 space-y-1 mt-1">
                                  {payment.reservation_id && (
                                    <div>Reservation: {payment.reservation_id._id?.slice(-8) || payment.reservation_id}</div>
                                  )}
                                  {payment.driver_booking_id && (
                                    <div>Driver Booking: {payment.driver_booking_id._id?.slice(-8) || payment.driver_booking_id}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {payment.user_id ? (
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                                    {typeof payment.user_id === 'object' 
                                      ? (payment.user_id.full_name?.charAt(0) || payment.user_id.email?.charAt(0) || "U")
                                      : "U"}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {typeof payment.user_id === 'object' 
                                        ? payment.user_id.full_name || payment.user_id.email
                                        : "Unknown User"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {typeof payment.user_id === 'object' 
                                        ? payment.user_id.email || "No email"
                                        : payment.user_id?.slice(-8)}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">No user</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-lg font-bold text-gray-900">
                                {formatCurrencyDisplay(payment.amount || 0, payment.currency)}
                              </div>
                              {payment.promotionApplied && (
                                <div className="text-xs text-green-600 mt-1">
                                  -{formatCurrencyDisplay(payment.promotionDiscount || 0, payment.currency)} discount
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`px-3 py-1.5 text-xs font-medium rounded-full border ${statusConfig.color} flex items-center gap-1.5`}>
                                  <StatusIcon className={`w-3 h-3 ${statusConfig.iconColor}`} />
                                  {payment.paymentStatus?.toUpperCase() || "UNKNOWN"}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1.5">
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getProviderColor(payment.provider)}`}>
                                  {payment.provider?.toUpperCase() || "UNKNOWN"}
                                </span>
                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getMethodColor(payment.method)} block mt-1`}>
                                  {payment.method?.toUpperCase() || "UNKNOWN"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {formatDate(payment.created_at || payment.boughtAt)}
                              </div>
                              {payment.captured_at && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Captured: {formatDate(payment.captured_at)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewDetails(payment._id)}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {["pending", "awaiting_delivery", "awaiting_confirmation"].includes(payment.paymentStatus || "") && (
                                  <>
                                    <button
                                      onClick={() => handlePollPayment(payment._id)}
                                      disabled={isPolling === payment._id}
                                      className={`p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors ${isPolling === payment._id ? "opacity-50 cursor-not-allowed" : ""}`}
                                      title="Poll Status"
                                    >
                                      {isPolling === payment._id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <RefreshCw className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => setPaymentToCancel(payment._id)}
                                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Cancel Payment"
                                    >
                                      <Ban className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden">
                  {filteredPayments.map((payment) => {
                    const statusConfig = getStatusConfig(payment.paymentStatus);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div key={payment._id} className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">Payment #{payment._id?.slice(-8)}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(payment.created_at || payment.boughtAt)}
                            </div>
                          </div>
                          <div className={`px-2.5 py-1 text-xs font-medium rounded-full border ${statusConfig.color} flex items-center gap-1`}>
                            <StatusIcon className={`w-3 h-3 ${statusConfig.iconColor}`} />
                            {payment.paymentStatus?.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Amount</div>
                            <div className="text-lg font-bold text-gray-900">
                              {formatCurrencyDisplay(payment.amount || 0, payment.currency)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">User</div>
                            <div className="text-sm text-gray-900 truncate">
                              {typeof payment.user_id === 'object' 
                                ? (payment.user_id.full_name || payment.user_id.email || "Unknown")
                                : "Unknown"}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getProviderColor(payment.provider)}`}>
                            {payment.provider}
                          </span>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getMethodColor(payment.method)}`}>
                            {payment.method}
                          </span>
                          {payment.reservation_id && (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full border border-gray-200 text-gray-700 bg-gray-50">
                              Reservation
                            </span>
                          )}
                          {payment.driver_booking_id && (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full border border-gray-200 text-gray-700 bg-gray-50">
                              Driver Booking
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(payment._id)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {["pending", "awaiting_delivery", "awaiting_confirmation"].includes(payment.paymentStatus || "") && (
                              <>
                                <button
                                  onClick={() => handlePollPayment(payment._id)}
                                  disabled={isPolling === payment._id}
                                  className={`p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg ${isPolling === payment._id ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  {isPolling === payment._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setPaymentToCancel(payment._id)}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{" "}
                      <span className="font-semibold">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{" "}
                      of <span className="font-semibold">{pagination.total}</span> payments
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className={`px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${pagination.page === 1
                            ? "text-gray-400 cursor-not-allowed bg-gray-50"
                            : "text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                          }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-700 px-2">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page >= pagination.totalPages}
                        className={`px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${pagination.page >= pagination.totalPages
                            ? "text-gray-400 cursor-not-allowed bg-gray-50"
                            : "text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                          }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      {isDetailsModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDetailsModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Payment Details</h2>
                <p className="text-sm text-gray-600">Payment #{selectedPayment._id?.slice(-12)}</p>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Payment Status Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Payment Status</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          {(() => {
                            const config = getStatusConfig(selectedPayment.paymentStatus);
                            const Icon = config.icon;
                            return (
                              <div className={`p-3 rounded-lg ${config.color.replace('bg-', 'bg-').replace('text-', 'text-').split(' ')[0]}/10`}>
                                <Icon className={`w-6 h-6 ${config.iconColor}`} />
                              </div>
                            );
                          })()}
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {selectedPayment.paymentStatus?.toUpperCase() || "UNKNOWN"}
                            </div>
                            <div className="text-sm text-gray-500">Current Status</div>
                          </div>
                        </div>
                      </div>
                      {["pending", "awaiting_delivery", "awaiting_confirmation"].includes(selectedPayment.paymentStatus || "") && (
                        <button
                          onClick={() => handlePollPayment(selectedPayment._id)}
                          disabled={isPolling === selectedPayment._id}
                          className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium flex items-center gap-2"
                        >
                          {isPolling === selectedPayment._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Poll Status
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Amount Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Amount Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Amount</span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatCurrencyDisplay(selectedPayment.amount || 0, selectedPayment.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Price Paid</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatCurrencyDisplay(selectedPayment.pricePaid || 0, selectedPayment.currency)}
                        </span>
                      </div>
                      {selectedPayment.promotionApplied && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Promotion Discount</span>
                            <span className="text-lg font-semibold text-green-600">
                              -{formatCurrencyDisplay(selectedPayment.promotionDiscount || 0, selectedPayment.currency)}
                            </span>
                          </div>
                          <div className="pt-3 border-t border-blue-100">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Promo Code</span>
                              <span className="text-sm font-medium text-blue-600">
                                {selectedPayment.promo_code || "N/A"}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Provider & Method Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Payment Method</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500">Provider</div>
                          <div className="text-sm font-medium text-gray-900">{selectedPayment.provider?.toUpperCase()}</div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getProviderColor(selectedPayment.provider)}`}>
                          {selectedPayment.provider}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-500">Method</div>
                          <div className="text-sm font-medium text-gray-900">{selectedPayment.method?.toUpperCase()}</div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getMethodColor(selectedPayment.method)}`}>
                          {selectedPayment.method}
                        </span>
                      </div>
                      {selectedPayment.pollUrl && selectedPayment.pollUrl !== "not available" && (
                        <div className="pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Poll URL</div>
                          <div className="text-xs font-mono text-blue-600 break-all">{selectedPayment.pollUrl}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* User Information Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">User Information</h3>
                    {selectedPayment.user_id && typeof selectedPayment.user_id === 'object' ? (
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-bold text-lg mr-4">
                            {selectedPayment.user_id.full_name?.charAt(0) || selectedPayment.user_id.email?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">{selectedPayment.user_id.full_name || "Unknown User"}</div>
                            <div className="text-sm text-gray-500">{selectedPayment.user_id.email}</div>
                          </div>
                        </div>
                        {selectedPayment.user_id.phone && (
                          <div className="pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-500">Phone</div>
                            <div className="text-sm font-medium text-gray-900">{selectedPayment.user_id.phone}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500">User information not available</div>
                    )}
                  </div>

                  {/* Booking Information Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Booking Information</h3>
                    <div className="space-y-3">
                      {selectedPayment.reservation_id && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Reservation ID</div>
                          <div className="text-sm font-medium text-gray-900">
                            {typeof selectedPayment.reservation_id === 'object' 
                              ? selectedPayment.reservation_id._id?.slice(-12) 
                              : selectedPayment.reservation_id.slice(-12)}
                          </div>
                        </div>
                      )}
                      {selectedPayment.driver_booking_id && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Driver Booking ID</div>
                          <div className="text-sm font-medium text-gray-900">
                            {typeof selectedPayment.driver_booking_id === 'object' 
                              ? selectedPayment.driver_booking_id._id?.slice(-12) 
                              : selectedPayment.driver_booking_id.slice(-12)}
                          </div>
                        </div>
                      )}
                      {!selectedPayment.reservation_id && !selectedPayment.driver_booking_id && (
                        <div className="text-gray-500">No booking information available</div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Timeline</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">Created</div>
                            <div className="text-xs text-gray-500">{formatDate(selectedPayment.created_at)}</div>
                          </div>
                        </div>
                      </div>
                      {selectedPayment.boughtAt && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">Purchased</div>
                              <div className="text-xs text-gray-500">{formatDate(selectedPayment.boughtAt)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedPayment.captured_at && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">Captured</div>
                              <div className="text-xs text-gray-500">{formatDate(selectedPayment.captured_at)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedPayment.updated_at && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <RefreshCw className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">Last Updated</div>
                              <div className="text-xs text-gray-500">{formatDate(selectedPayment.updated_at)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Payment ID: {selectedPayment._id}
                </div>
                <div className="flex gap-3">
                  {["pending", "awaiting_delivery", "awaiting_confirmation"].includes(selectedPayment.paymentStatus || "") && (
                    <button
                      onClick={() => {
                        setPaymentToCancel(selectedPayment._id);
                        setIsDetailsModalOpen(false);
                      }}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      Cancel Payment
                    </button>
                  )}
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {paymentToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setPaymentToCancel(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Cancel Payment</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this payment? The payment will be marked as cancelled and any pending transactions will be stopped.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPaymentToCancel(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  No, Keep Payment
                </button>
                <button
                  onClick={() => handleCancelPayment(paymentToCancel)}
                  disabled={isCancelling === paymentToCancel}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  {isCancelling === paymentToCancel ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}
                  Yes, Cancel Payment
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

export default PaymentsManagement;