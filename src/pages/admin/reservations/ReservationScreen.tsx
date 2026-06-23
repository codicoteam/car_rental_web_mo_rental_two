// ReservationScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllReservations,
  deleteReservation,
  updateReservationStatus,
  getErrorDisplay,
  parseDecimalValue,
  formatCurrencyDisplay,
  calculateTotalDays,
  type IReservation,
  type IUserRef,
  type IVehicleRef,
  type IVehicleModelRef,
  type IBranchRef,
  type ReservationStatus,
} from "../../../Services/adminAndManager/reservations_service";
import Sidebar from "../../../components/Sidebar";
import {
  ArrowLeft,
  Edit,
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
  Check,
  XCircle,
  FileText,
  CreditCard,
  Navigation,
  MessageSquare,
  Tag,
  Code,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Car,
  Timer,
  AlertTriangle,
  ExternalLink,
  Download,
  Printer,
  MoreHorizontal,
  Loader2,
  Building2,
  Receipt,
  Key,
  LogIn,
  LogOut,
  Shield,
  Zap,
  Star,
  Award,
  Briefcase,
  CheckSquare,
  Truck,
  FileDown,
} from "lucide-react";

// Status options from the backend model
const STATUS_OPTIONS: ReservationStatus[] = [
  "pending",
  "confirmed",
  "checked_out",
  "checked_in",
  "closed",
  "cancelled",
  "no_show",
];

// Status colors and icons
const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending: {
    bg: "bg-yellow-100 text-yellow-800",
    text: "Pending",
    icon: <Clock className="w-4 h-4" />,
  },
  confirmed: {
    bg: "bg-blue-100 text-blue-800",
    text: "Confirmed",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  checked_out: {
    bg: "bg-green-100 text-green-800",
    text: "Checked Out",
    icon: <Key className="w-4 h-4" />,
  },
  checked_in: {
    bg: "bg-cyan-100 text-cyan-800",
    text: "Checked In",
    icon: <CheckSquare className="w-4 h-4" />,
  },
  returned: {
    bg: "bg-cyan-100 text-cyan-800",
    text: "Checked In",
    icon: <CheckSquare className="w-4 h-4" />,
  },
  closed: {
    bg: "bg-emerald-100 text-emerald-800",
    text: "Completed",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  cancelled: {
    bg: "bg-red-100 text-red-800",
    text: "Cancelled",
    icon: <XCircle className="w-4 h-4" />,
  },
  no_show: {
    bg: "bg-orange-100 text-orange-800",
    text: "No Show",
    icon: <UserX className="w-4 h-4" />,
  },
  completed: {
    bg: "bg-emerald-100 text-emerald-800",
    text: "Completed",
    icon: <CheckCircle className="w-4 h-4" />,
  },
};

// Payment status colors
const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  unpaid: { bg: "bg-red-100 text-red-800", text: "Unpaid" },
  partial: { bg: "bg-yellow-100 text-yellow-800", text: "Partial" },
  paid: { bg: "bg-green-100 text-green-800", text: "Paid" },
  refunded: { bg: "bg-blue-100 text-blue-800", text: "Refunded" },
  void: { bg: "bg-gray-100 text-gray-800", text: "Void" },
};

// Channel options
const CHANNEL_OPTIONS = ["web", "mobile", "kiosk", "agent"];

interface ReservationScreenProps {}

const ReservationScreen: React.FC<ReservationScreenProps> = () => {
  const navigate = useNavigate();

  // State
  const [reservations, setReservations] = useState<IReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal states
  const [selectedReservation, setSelectedReservation] = useState<IReservation | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedReservation, setExpandedReservation] = useState<string | null>(null);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);
  const [statusToUpdate, setStatusToUpdate] = useState<{
    reservationId: string;
    currentStatus: ReservationStatus;
    newStatus: ReservationStatus;
  } | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    channel: "",
    start_date: "",
    end_date: "",
    min_amount: "",
    max_amount: "",
    customer_name: "",
    vehicle_model: "",
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
    confirmed: 0,
    active: 0,
    completed: 0,
  });

  // Load reservations
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAllReservations();
      const reservationsData = response.data || [];
      setReservations(reservationsData);

      // Calculate stats
      const total = reservationsData.length;
      const totalRevenue = reservationsData.reduce((sum, reservation) => {
        const amount = parseDecimalValue(reservation.pricing?.grand_total || "0");
        return sum + amount;
      }, 0);
      const pending = reservationsData.filter(r => r.status === "pending").length;
      const confirmed = reservationsData.filter(r => r.status === "confirmed").length;
      const active = reservationsData.filter(r => ["confirmed", "checked_out", "checked_in", "returned"].includes(r.status)).length;
      const completed = reservationsData.filter(r => ["closed", "completed"].includes(r.status)).length;

      setStats({ total, totalRevenue, pending, confirmed, active, completed });
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      setError(errorDisplay.message || "Failed to load reservations");
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

  // Handle delete reservation
  const handleDeleteReservation = async () => {
    if (!reservationToDelete) return;

    try {
      await deleteReservation(reservationToDelete);
      showSnackbar("Reservation deleted successfully", "success");
      setReservationToDelete(null);
      loadData();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!statusToUpdate) return;

    try {
      await updateReservationStatus(statusToUpdate.reservationId, statusToUpdate.newStatus);
      showSnackbar(`Reservation status updated to ${statusToUpdate.newStatus}`, "success");
      setStatusToUpdate(null);
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

  // Format date for display (date only)
  const formatDateOnly = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get user info
  const getUserInfo = (userRef?: string | IUserRef | null) => {
    if (!userRef) return { email: "N/A", fullName: "N/A", id: "N/A" };
    
    if (typeof userRef === "object") {
      return {
        email: userRef.email || "N/A",
        fullName: userRef.full_name || "N/A",
        id: userRef._id || "N/A",
      };
    }
    
    return { email: "N/A", fullName: "N/A", id: userRef };
  };

  // Get vehicle info
  const getVehicleInfo = (vehicleRef?: string | IVehicleRef | null) => {
    if (!vehicleRef) return { plate: "N/A", color: "N/A", status: "N/A" };
    
    if (typeof vehicleRef === "object") {
      return {
        plate: vehicleRef.plate_number || "N/A",
        color: vehicleRef.color || "N/A",
        status: vehicleRef.status || "N/A",
        photos: vehicleRef.photos || [],
      };
    }
    
    return { plate: "N/A", color: "N/A", status: "N/A", photos: [] };
  };

  // Get vehicle model info
  const getVehicleModelInfo = (modelRef?: string | IVehicleModelRef | null) => {
    if (!modelRef) return { make: "N/A", model: "N/A", year: "N/A", images: [] };
    
    if (typeof modelRef === "object") {
      return {
        make: modelRef.make || "N/A",
        model: modelRef.model || "N/A",
        year: modelRef.year || "N/A",
        class: modelRef.class || "N/A",
        images: modelRef.images || [],
      };
    }
    
    return { make: "N/A", model: "N/A", year: "N/A", images: [] };
  };

  // Get branch info
  const getBranchInfo = (branchRef?: string | IBranchRef | null) => {
    if (!branchRef) return { name: "N/A", address: "N/A", phone: "N/A" };
    
    if (typeof branchRef === "object") {
      const address = branchRef.address;
      const fullAddress = address ? 
        `${address.line1 || ''} ${address.line2 || ''}, ${address.city || ''}, ${address.region || ''} ${address.postal_code || ''}`.trim() : 
        "No address";
      
      return {
        name: branchRef.name || "N/A",
        code: branchRef.code || "N/A",
        address: fullAddress,
        phone: branchRef.phone || "N/A",
        email: branchRef.email || "N/A",
      };
    }
    
    return { name: "N/A", address: "N/A", phone: "N/A" };
  };

  // Get driver snapshot info
  const getDriverInfo = (driverSnapshot?: any) => {
    if (!driverSnapshot) return { fullName: "N/A", phone: "N/A", email: "N/A" };
    
    return {
      fullName: driverSnapshot.full_name || "N/A",
      phone: driverSnapshot.phone || "N/A",
      email: driverSnapshot.email || "N/A",
      licenseNumber: driverSnapshot.driver_license?.number || "N/A",
      licenseClass: driverSnapshot.driver_license?.class || "N/A",
      licenseExpires: driverSnapshot.driver_license?.expires_at || "N/A",
      licenseVerified: driverSnapshot.driver_license?.verified || false,
    };
  };

  // Get pricing info
  const getPricingInfo = (pricing?: any) => {
    if (!pricing) return { 
      currency: "USD", 
      breakdown: [], 
      grandTotal: 0,
      fees: 0,
      taxes: 0,
      discounts: 0,
    };
    
    const grandTotal = parseDecimalValue(pricing.grand_total);
    const fees = pricing.fees?.reduce((sum: number, fee: any) => sum + parseDecimalValue(fee.amount), 0) || 0;
    const taxes = pricing.taxes?.reduce((sum: number, tax: any) => sum + parseDecimalValue(tax.amount), 0) || 0;
    const discounts = pricing.discounts?.reduce((sum: number, discount: any) => sum + parseDecimalValue(discount.amount), 0) || 0;
    
    return {
      currency: pricing.currency || "USD",
      breakdown: pricing.breakdown || [],
      grandTotal,
      fees,
      taxes,
      discounts,
    };
  };

  // Get payment summary info
  const getPaymentInfo = (paymentSummary?: any) => {
    if (!paymentSummary) return { status: "unpaid", paidTotal: 0, outstanding: 0 };
    
    return {
      status: paymentSummary.status || "unpaid",
      paidTotal: parseDecimalValue(paymentSummary.paid_total),
      outstanding: parseDecimalValue(paymentSummary.outstanding),
      lastPaymentAt: paymentSummary.last_payment_at,
    };
  };

  // Calculate duration in days
  const calculateDuration = (pickupAt?: string, dropoffAt?: string) => {
    if (!pickupAt || !dropoffAt) return "N/A";
    
    const days = calculateTotalDays(pickupAt, dropoffAt);
    return days === 1 ? "1 day" : `${days} days`;
  };

  // Filtered reservations
  const filteredReservations = reservations.filter(reservation => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const reservationCode = reservation.code?.toLowerCase() || "";
      const customerName = getUserInfo(reservation.user_id).fullName.toLowerCase();
      const vehicleModel = getVehicleModelInfo(reservation.vehicle_model_id).model?.toLowerCase() || "";
      const vehicleMake = getVehicleModelInfo(reservation.vehicle_model_id).make?.toLowerCase() || "";
      
      if (
        !reservationCode.includes(query) &&
        !customerName.includes(query) &&
        !vehicleModel.includes(query) &&
        !vehicleMake.includes(query)
      ) {
        return false;
      }
    }

    // Additional filters
    if (filters.status) {
      const s = reservation.status;
      const match =
        s === filters.status ||
        (filters.status === "closed"    && s === "completed") ||
        (filters.status === "checked_in" && s === "returned");
      if (!match) return false;
    }
    if (filters.channel && reservation.created_channel !== filters.channel) return false;
    
    if (filters.start_date) {
      const startDate = new Date(filters.start_date);
      const reservationDate = new Date(reservation.pickup.at || reservation.created_at);
      if (reservationDate < startDate) return false;
    }
    
    if (filters.end_date) {
      const endDate = new Date(filters.end_date);
      endDate.setHours(23, 59, 59, 999);
      const reservationDate = new Date(reservation.pickup.at || reservation.created_at);
      if (reservationDate > endDate) return false;
    }
    
    if (filters.min_amount) {
      const amount = getPricingInfo(reservation.pricing).grandTotal;
      if (amount < parseFloat(filters.min_amount)) return false;
    }
    
    if (filters.max_amount) {
      const amount = getPricingInfo(reservation.pricing).grandTotal;
      if (amount > parseFloat(filters.max_amount)) return false;
    }
    
    if (filters.customer_name) {
      const customerName = getUserInfo(reservation.user_id).fullName.toLowerCase();
      if (!customerName.includes(filters.customer_name.toLowerCase())) return false;
    }
    
    if (filters.vehicle_model) {
      const vehicleModel = getVehicleModelInfo(reservation.vehicle_model_id).model?.toLowerCase() || "";
      if (!vehicleModel.includes(filters.vehicle_model.toLowerCase())) return false;
    }

    return true;
  });

  // Clear filters
  const clearFilters = () => {
    setFilters({
      status: "",
      channel: "",
      start_date: "",
      end_date: "",
      min_amount: "",
      max_amount: "",
      customer_name: "",
      vehicle_model: "",
    });
  };

  // Toggle reservation expansion
  const toggleReservationExpansion = (reservationId: string) => {
    setExpandedReservation(expandedReservation === reservationId ? null : reservationId);
  };

  // Export data to CSV
  const exportToCSV = () => {
    const headers = [
      "Reservation Code",
      "Customer",
      "Vehicle",
      "Pickup Date",
      "Dropoff Date",
      "Duration",
      "Pickup Branch",
      "Dropoff Branch",
      "Status",
      "Total Amount",
      "Payment Status",
      "Created At",
      "Channel",
    ];
    
    const rows = filteredReservations.map(reservation => {
      const customerInfo = getUserInfo(reservation.user_id);
      const vehicleModelInfo = getVehicleModelInfo(reservation.vehicle_model_id);
      const pickupBranch = getBranchInfo(reservation.pickup.branch_id);
      const dropoffBranch = getBranchInfo(reservation.dropoff.branch_id);
      const pricingInfo = getPricingInfo(reservation.pricing);
      const paymentInfo = getPaymentInfo(reservation.payment_summary);
      
      return [
        reservation.code || "N/A",
        customerInfo.fullName,
        `${vehicleModelInfo.make} ${vehicleModelInfo.model} (${vehicleModelInfo.year})`,
        formatDate(reservation.pickup.at),
        formatDate(reservation.dropoff.at),
        calculateDuration(reservation.pickup.at, reservation.dropoff.at),
        pickupBranch.name,
        dropoffBranch.name,
        reservation.status || "N/A",
        formatCurrencyDisplay(pricingInfo.grandTotal, pricingInfo.currency),
        paymentInfo.status,
        formatDate(reservation.created_at),
        reservation.created_channel || "N/A",
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reservations-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    
    showSnackbar("Data exported to CSV successfully", "success");
  };

  // Generate PDF/Print receipt
  const generateReceipt = (reservation: IReservation) => {
    const customerInfo = getUserInfo(reservation.user_id);
    const driverInfo = getDriverInfo(reservation.driver_snapshot);
    const vehicleModelInfo = getVehicleModelInfo(reservation.vehicle_model_id);
    const vehicleInfo = getVehicleInfo(reservation.vehicle_id);
    const pickupBranch = getBranchInfo(reservation.pickup.branch_id);
    const dropoffBranch = getBranchInfo(reservation.dropoff.branch_id);
    const pricingInfo = getPricingInfo(reservation.pricing);
    const paymentInfo = getPaymentInfo(reservation.payment_summary);
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const content = `
      <html>
        <head>
          <title>Reservation Receipt - ${reservation.code}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #1EA2E4; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #1EA2E4; margin-bottom: 10px; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; color: #1EA2E4; margin-bottom: 10px; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .row { display: flex; margin-bottom: 8px; }
            .label { font-weight: bold; width: 180px; flex-shrink: 0; }
            .value { flex: 1; }
            .total-row { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #eee; }
            .total-label { font-weight: bold; font-size: 18px; }
            .total-value { font-weight: bold; font-size: 18px; color: #1EA2E4; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; margin-left: 10px; }
            .receipt-number { font-size: 18px; font-weight: bold; color: #666; margin-top: 5px; }
            .breakdown-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .breakdown-table th { text-align: left; padding: 8px; background: #f5f5f5; border-bottom: 1px solid #ddd; }
            .breakdown-table td { padding: 8px; border-bottom: 1px solid #eee; }
            .breakdown-table .total-row { font-weight: bold; background: #f9f9f9; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              @page { margin: 20mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">MORENTAL</div>
            <h1>Vehicle Rental Reservation Receipt</h1>
            <div class="receipt-number">Reservation Code: ${reservation.code}</div>
            <div>Generated on ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Reservation Information</div>
            <div class="row"><div class="label">Status:</div><div class="value">${reservation.status} <span class="status" style="background: ${STATUS_COLORS[reservation.status]?.bg.replace('bg-', '').split(' ')[0]}; color: ${STATUS_COLORS[reservation.status]?.bg.replace('bg-', '').split(' ')[1]};">${reservation.status}</span></div></div>
            <div class="row"><div class="label">Created:</div><div class="value">${formatDate(reservation.created_at)}</div></div>
            <div class="row"><div class="label">Channel:</div><div class="value">${reservation.created_channel}</div></div>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="row"><div class="label">Name:</div><div class="value">${customerInfo.fullName}</div></div>
            <div class="row"><div class="label">Email:</div><div class="value">${customerInfo.email}</div></div>
          </div>
          
          <div class="section">
            <div class="section-title">Driver Information</div>
            <div class="row"><div class="label">Full Name:</div><div class="value">${driverInfo.fullName}</div></div>
            <div class="row"><div class="label">Phone:</div><div class="value">${driverInfo.phone}</div></div>
            <div class="row"><div class="label">Email:</div><div class="value">${driverInfo.email}</div></div>
            <div class="row"><div class="label">License No:</div><div class="value">${driverInfo.licenseNumber} ${driverInfo.licenseVerified ? '(Verified)' : '(Not Verified)'}</div></div>
            <div class="row"><div class="label">License Class:</div><div class="value">${driverInfo.licenseClass}</div></div>
          </div>
          
          <div class="section">
            <div class="section-title">Vehicle Information</div>
            <div class="row"><div class="label">Vehicle:</div><div class="value">${vehicleModelInfo.make} ${vehicleModelInfo.model} (${vehicleModelInfo.year})</div></div>
            <div class="row"><div class="label">Class:</div><div class="value">${vehicleModelInfo.class}</div></div>
            <div class="row"><div class="label">Plate Number:</div><div class="value">${vehicleInfo.plate}</div></div>
            <div class="row"><div class="label">Color:</div><div class="value">${vehicleInfo.color}</div></div>
          </div>
          
          <div class="section">
            <div class="section-title">Schedule</div>
            <div class="row"><div class="label">Pickup Date:</div><div class="value">${formatDate(reservation.pickup.at)}</div></div>
            <div class="row"><div class="label">Dropoff Date:</div><div class="value">${formatDate(reservation.dropoff.at)}</div></div>
            <div class="row"><div class="label">Duration:</div><div class="value">${calculateDuration(reservation.pickup.at, reservation.dropoff.at)}</div></div>
          </div>
          
          <div class="section">
            <div class="section-title">Locations</div>
            <div class="row"><div class="label">Pickup Branch:</div><div class="value">${pickupBranch.name}</div></div>
            <div class="row"><div class="label">Pickup Address:</div><div class="value">${pickupBranch.address}</div></div>
            <div class="row"><div class="label">Dropoff Branch:</div><div class="value">${dropoffBranch.name}</div></div>
            <div class="row"><div class="label">Dropoff Address:</div><div class="value">${dropoffBranch.address}</div></div>
          </div>
          
          <div class="section">
            <div class="section-title">Pricing Breakdown</div>
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${pricingInfo.breakdown.map((item: any) => `
                  <tr>
                    <td>${item.label}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrencyDisplay(item.unit_amount, pricingInfo.currency)}</td>
                    <td>${formatCurrencyDisplay(item.total, pricingInfo.currency)}</td>
                  </tr>
                `).join('')}
                ${pricingInfo.fees > 0 ? `
                  <tr>
                    <td colspan="3" style="text-align: right;">Fees:</td>
                    <td>${formatCurrencyDisplay(pricingInfo.fees, pricingInfo.currency)}</td>
                  </tr>
                ` : ''}
                ${pricingInfo.taxes > 0 ? `
                  <tr>
                    <td colspan="3" style="text-align: right;">Taxes:</td>
                    <td>${formatCurrencyDisplay(pricingInfo.taxes, pricingInfo.currency)}</td>
                  </tr>
                ` : ''}
                ${pricingInfo.discounts > 0 ? `
                  <tr>
                    <td colspan="3" style="text-align: right;">Discounts:</td>
                    <td>-${formatCurrencyDisplay(pricingInfo.discounts, pricingInfo.currency)}</td>
                  </tr>
                ` : ''}
                <tr class="total-row">
                  <td colspan="3" style="text-align: right; font-weight: bold;">Grand Total:</td>
                  <td style="font-weight: bold;">${formatCurrencyDisplay(pricingInfo.grandTotal, pricingInfo.currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Payment Information</div>
            <div class="row"><div class="label">Payment Status:</div><div class="value">${paymentInfo.status}</div></div>
            <div class="row"><div class="label">Amount Paid:</div><div class="value">${formatCurrencyDisplay(paymentInfo.paidTotal, pricingInfo.currency)}</div></div>
            <div class="row"><div class="label">Outstanding Balance:</div><div class="value">${formatCurrencyDisplay(paymentInfo.outstanding, pricingInfo.currency)}</div></div>
            ${paymentInfo.lastPaymentAt ? `<div class="row"><div class="label">Last Payment:</div><div class="value">${formatDate(paymentInfo.lastPaymentAt)}</div></div>` : ''}
          </div>
          
          ${reservation.notes ? `
          <div class="section">
            <div class="section-title">Notes</div>
            <p>${reservation.notes}</p>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Thank you for choosing Morental. For any questions, please contact support@morental.com</p>
            <p>This is an automatically generated receipt. No signature required.</p>
          </div>
          
          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #1EA2E4; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
              Print Receipt
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
    if (!status) return STATUS_COLORS.pending;
    return STATUS_COLORS[status] || STATUS_COLORS.pending;
  };

  // Get payment status info
  const getPaymentStatusInfo = (status?: string) => {
    if (!status) return PAYMENT_STATUS_COLORS.unpaid;
    return PAYMENT_STATUS_COLORS[status] || PAYMENT_STATUS_COLORS.unpaid;
  };

  // Get available status transitions
  const getAvailableStatusTransitions = (currentStatus: ReservationStatus): ReservationStatus[] => {
    const transitions: Record<string, ReservationStatus[]> = {
      pending:     ["confirmed", "cancelled"],
      confirmed:   ["checked_out", "cancelled", "no_show"],
      checked_out: ["checked_in"],
      checked_in:  ["closed"],
      returned:    ["closed"],
      closed:      [],
      completed:   [],
      cancelled:   [],
      no_show:     [],
    };

    return transitions[currentStatus] || [];
  };

  // Get vehicle image
  const getVehicleImage = (reservation: IReservation): string => {
    const vehicleModelInfo = getVehicleModelInfo(reservation.vehicle_model_id);
    const vehicleInfo = getVehicleInfo(reservation.vehicle_id);
    
    // Priority: vehicle photos > model images > default car image
    if (vehicleInfo.photos && vehicleInfo.photos.length > 0) {
      return vehicleInfo.photos[0];
    }
    
    if (vehicleModelInfo.images && vehicleModelInfo.images.length > 0) {
      return vehicleModelInfo.images[0];
    }
    
    // Default car image (you can replace with your own default image)
    return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
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
                <h1 className="text-2xl font-bold text-gray-800">Reservations</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage all vehicle rental reservations and assignments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className="font-semibold">{filteredReservations.length}</span> reservation(s)
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            {/* Total Reservations */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reservations</p>
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
                    {formatCurrencyDisplay(stats.totalRevenue, "USD")}
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

            {/* Confirmed */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.confirmed}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            {/* Active */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.active}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                  <Car className="w-6 h-6 text-green-600" />
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
                <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
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
                    placeholder="Search by reservation code, customer, vehicle model..."
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
                        <option key={status} value={status}>{STATUS_COLORS[status]?.text ?? status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Channel
                    </label>
                    <select
                      value={filters.channel}
                      onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    >
                      <option value="">All Channels</option>
                      {CHANNEL_OPTIONS.map(channel => (
                        <option key={channel} value={channel}>{channel}</option>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Model
                    </label>
                    <input
                      type="text"
                      value={filters.vehicle_model}
                      onChange={(e) => setFilters(prev => ({ ...prev, vehicle_model: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      placeholder="Filter by model"
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
                <p className="text-gray-600">Loading reservations...</p>
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
          ) : filteredReservations.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Car className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reservations Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery || Object.values(filters).some(v => v)
                  ? "No reservations match your search criteria. Try adjusting your filters."
                  : "No reservations found in the system."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => {
                const statusInfo = getStatusInfo(reservation.status);
                const customerInfo = getUserInfo(reservation.user_id);
                const driverInfo = getDriverInfo(reservation.driver_snapshot);
                const vehicleModelInfo = getVehicleModelInfo(reservation.vehicle_model_id);
                const vehicleInfo = getVehicleInfo(reservation.vehicle_id);
                const pickupBranch = getBranchInfo(reservation.pickup.branch_id);
                const dropoffBranch = getBranchInfo(reservation.dropoff.branch_id);
                const pricingInfo = getPricingInfo(reservation.pricing);
                const paymentInfo = getPaymentInfo(reservation.payment_summary);
                const duration = calculateDuration(reservation.pickup.at, reservation.dropoff.at);
                const vehicleImage = getVehicleImage(reservation);
                
                return (
                  <div
                    key={reservation._id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Reservation Header with Vehicle Image */}
                    <div className="relative h-48">
                      <img
                        src={vehicleImage}
                        alt={`${vehicleModelInfo.make} ${vehicleModelInfo.model}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/30 to-transparent p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-flex items-center gap-1 ${statusInfo.bg}`}>
                              {statusInfo.icon}
                              {statusInfo.text}
                            </span>
                            <span className="px-2 py-1 text-xs bg-white/90 text-gray-600 rounded font-mono">
                              {reservation.code}
                            </span>
                          </div>
                          <div className="text-sm text-white bg-black/50 px-2 py-1 rounded">
                            {formatDate(reservation.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Vehicle Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {vehicleModelInfo.make} {vehicleModelInfo.model} ({vehicleModelInfo.year})
                            </h3>
                            <p className="text-sm text-gray-200">
                              {vehicleInfo.color} • {vehicleInfo.plate}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-white">
                              {formatCurrencyDisplay(pricingInfo.grandTotal, pricingInfo.currency)}
                            </p>
                            <p className="text-sm text-gray-200">{duration}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reservation Content */}
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
                              <p className="text-xs text-gray-400">{customerInfo.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                              <UserCheck className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{driverInfo.fullName}</p>
                              <p className="text-xs text-gray-500">Driver</p>
                              <p className="text-xs text-gray-400">{driverInfo.phone}</p>
                            </div>
                          </div>
                        </div>

                        {/* Location Info */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mt-0.5">
                              <LogOut className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Pickup</p>
                              <p className="text-xs text-gray-600 truncate">{pickupBranch.name}</p>
                              <p className="text-xs text-gray-400">{formatDate(reservation.pickup.at)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mt-0.5">
                              <LogIn className="w-5 h-5 text-purple-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Dropoff</p>
                              <p className="text-xs text-gray-600 truncate">{dropoffBranch.name}</p>
                              <p className="text-xs text-gray-400">{formatDate(reservation.dropoff.at)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Payment & Actions */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Payment:</span>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getPaymentStatusInfo(paymentInfo.status).bg}`}>
                              {getPaymentStatusInfo(paymentInfo.status).text}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Channel:</span>
                            </div>
                            <span className="text-sm font-medium capitalize">{reservation.created_channel}</span>
                          </div>
                          
                          <div className="pt-2">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleReservationExpansion(reservation._id)}
                                className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                title={expandedReservation === reservation._id ? "Show Less" : "Show More"}
                              >
                                {expandedReservation === reservation._id ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => generateReceipt(reservation)}
                                className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Print Receipt"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setIsViewModalOpen(true);
                                }}
                                className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setReservationToDelete(reservation._id)}
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Reservation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedReservation === reservation._id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Payment Details */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-gray-700">Payment Details</h4>
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${getPaymentStatusInfo(paymentInfo.status).bg}`}>
                                  {getPaymentStatusInfo(paymentInfo.status).text}
                                </span>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total Amount:</span>
                                  <span className="font-medium">{formatCurrencyDisplay(pricingInfo.grandTotal, pricingInfo.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Amount Paid:</span>
                                  <span className="font-medium text-green-600">{formatCurrencyDisplay(paymentInfo.paidTotal, pricingInfo.currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Outstanding:</span>
                                  <span className="font-medium text-red-600">{formatCurrencyDisplay(paymentInfo.outstanding, pricingInfo.currency)}</span>
                                </div>
                                {paymentInfo.lastPaymentAt && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Last Payment:</span>
                                    <span className="font-medium">{formatDate(paymentInfo.lastPaymentAt)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Status Actions */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Update Status</h4>
                              <div className="flex flex-wrap gap-2">
                                {getAvailableStatusTransitions(reservation.status as ReservationStatus).map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => setStatusToUpdate({
                                      reservationId: reservation._id,
                                      currentStatus: reservation.status as ReservationStatus,
                                      newStatus: status,
                                    })}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                      STATUS_COLORS[status]?.bg.replace('text-', 'bg-').split(' ')[0]
                                    } ${
                                      STATUS_COLORS[status]?.bg.split(' ')[1].replace('text-', 'text-')
                                    } hover:opacity-90`}
                                  >
                                    Mark as {status}
                                  </button>
                                ))}
                                {getAvailableStatusTransitions(reservation.status as ReservationStatus).length === 0 && (
                                  <p className="text-sm text-gray-500">No status transitions available</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Vehicle Details */}
                          <div className="mt-3 bg-blue-50 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                              <Car className="w-4 h-4" />
                              Vehicle Details
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-blue-600">Make & Model</p>
                                <p className="font-medium">{vehicleModelInfo.make} {vehicleModelInfo.model}</p>
                              </div>
                              <div>
                                <p className="text-blue-600">Year</p>
                                <p className="font-medium">{vehicleModelInfo.year}</p>
                              </div>
                              <div>
                                <p className="text-blue-600">Class</p>
                                <p className="font-medium">{vehicleModelInfo.class}</p>
                              </div>
                              <div>
                                <p className="text-blue-600">Plate Number</p>
                                <p className="font-medium">{vehicleInfo.plate}</p>
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          {reservation.notes && (
                            <div className="mt-3 bg-yellow-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="w-4 h-4 text-yellow-600" />
                                <h4 className="text-sm font-semibold text-yellow-700">Notes</h4>
                              </div>
                              <p className="text-sm text-yellow-600">{reservation.notes}</p>
                            </div>
                          )}

                          {/* Pricing Breakdown */}
                          {pricingInfo.breakdown.length > 0 && (
                            <div className="mt-3 bg-gray-50 rounded-lg p-3">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Pricing Breakdown</h4>
                              <div className="space-y-1 text-sm">
                                {pricingInfo.breakdown.map((item: any, index: number) => (
                                  <div key={index} className="flex justify-between">
                                    <span className="text-gray-600">
                                      {item.label} × {item.quantity}
                                    </span>
                                    <span className="font-medium">
                                      {formatCurrencyDisplay(item.total, pricingInfo.currency)}
                                    </span>
                                  </div>
                                ))}
                                {pricingInfo.fees > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Fees</span>
                                    <span className="font-medium">
                                      {formatCurrencyDisplay(pricingInfo.fees, pricingInfo.currency)}
                                    </span>
                                  </div>
                                )}
                                {pricingInfo.taxes > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Taxes</span>
                                    <span className="font-medium">
                                      {formatCurrencyDisplay(pricingInfo.taxes, pricingInfo.currency)}
                                    </span>
                                  </div>
                                )}
                                {pricingInfo.discounts > 0 && (
                                  <div className="flex justify-between text-green-600">
                                    <span>Discounts</span>
                                    <span className="font-medium">
                                      -{formatCurrencyDisplay(pricingInfo.discounts, pricingInfo.currency)}
                                    </span>
                                  </div>
                                )}
                                <div className="pt-2 border-t border-gray-200">
                                  <div className="flex justify-between font-bold">
                                    <span>Grand Total</span>
                                    <span className="text-[#1EA2E4]">
                                      {formatCurrencyDisplay(pricingInfo.grandTotal, pricingInfo.currency)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
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
      </div>

      {/* View Reservation Modal */}
      {isViewModalOpen && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Reservation Details</h2>
                  <p className="text-sm text-gray-600">Complete reservation information</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-flex items-center gap-1 ${getStatusInfo(selectedReservation.status).bg}`}>
                    {getStatusInfo(selectedReservation.status).icon}
                    {getStatusInfo(selectedReservation.status).text}
                  </span>
                  <span className="px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded font-mono">
                    {selectedReservation.code}
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Vehicle & Customer */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Vehicle Image & Info */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
                    <div className="relative h-64">
                      <img
                        src={getVehicleImage(selectedReservation)}
                        alt="Vehicle"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {getVehicleModelInfo(selectedReservation.vehicle_model_id).make}{" "}
                              {getVehicleModelInfo(selectedReservation.vehicle_model_id).model}{" "}
                              ({getVehicleModelInfo(selectedReservation.vehicle_model_id).year})
                            </h3>
                            <p className="text-gray-200">
                              {getVehicleModelInfo(selectedReservation.vehicle_model_id).class} • {getVehicleInfo(selectedReservation.vehicle_id).color}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">
                              {formatCurrencyDisplay(getPricingInfo(selectedReservation.pricing).grandTotal, getPricingInfo(selectedReservation.pricing).currency)}
                            </p>
                            <p className="text-gray-200">{calculateDuration(selectedReservation.pickup.at, selectedReservation.dropoff.at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Plate Number</p>
                          <p className="text-gray-900 font-medium">{getVehicleInfo(selectedReservation.vehicle_id).plate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Vehicle Status</p>
                          <p className="text-gray-900 font-medium">{getVehicleInfo(selectedReservation.vehicle_id).status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Booking Channel</p>
                          <p className="text-gray-900 font-medium capitalize">{selectedReservation.created_channel}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Currency</p>
                          <p className="text-gray-900 font-medium">{getPricingInfo(selectedReservation.pricing).currency}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer & Driver Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Information */}
                    <div className="bg-gray-50 rounded-lg p-5">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-500" />
                        Customer Information
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="text-gray-900 font-medium">{getUserInfo(selectedReservation.user_id).fullName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="text-gray-900 font-medium">{getUserInfo(selectedReservation.user_id).email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Customer ID</p>
                          <p className="text-gray-900 font-mono text-sm">
                            {getUserInfo(selectedReservation.user_id).id.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Driver Information */}
                    <div className="bg-gray-50 rounded-lg p-5">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-gray-500" />
                        Driver Information
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="text-gray-900 font-medium">{getDriverInfo(selectedReservation.driver_snapshot).fullName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="text-gray-900 font-medium">{getDriverInfo(selectedReservation.driver_snapshot).phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-gray-900 font-medium">{getDriverInfo(selectedReservation.driver_snapshot).email}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Driver License</p>
                          <div className="bg-white rounded border border-gray-200 p-3 mt-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">#{getDriverInfo(selectedReservation.driver_snapshot).licenseNumber}</p>
                                <p className="text-xs text-gray-500">{getDriverInfo(selectedReservation.driver_snapshot).licenseClass}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded ${getDriverInfo(selectedReservation.driver_snapshot).licenseVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {getDriverInfo(selectedReservation.driver_snapshot).licenseVerified ? 'Verified' : 'Not Verified'}
                              </span>
                            </div>
                            {getDriverInfo(selectedReservation.driver_snapshot).licenseExpires && (
                              <p className="text-xs text-gray-500 mt-2">
                                Expires: {formatDateOnly(getDriverInfo(selectedReservation.driver_snapshot).licenseExpires)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Schedule, Locations, Pricing */}
                <div className="space-y-6">
                  {/* Schedule Information */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      Schedule
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                            <LogOut className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Pickup</p>
                            <p className="text-sm text-gray-600">{formatDate(selectedReservation.pickup.at)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Branch</p>
                          <p className="text-gray-900 font-medium">{getBranchInfo(selectedReservation.pickup.branch_id).name}</p>
                          <p className="text-sm text-gray-600 mt-1">{getBranchInfo(selectedReservation.pickup.branch_id).address}</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                            <LogIn className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Dropoff</p>
                            <p className="text-sm text-gray-600">{formatDate(selectedReservation.dropoff.at)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Branch</p>
                          <p className="text-gray-900 font-medium">{getBranchInfo(selectedReservation.dropoff.branch_id).name}</p>
                          <p className="text-sm text-gray-600 mt-1">{getBranchInfo(selectedReservation.dropoff.branch_id).address}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">Total Duration</span>
                          </div>
                          <span className="text-lg font-bold text-[#1EA2E4]">
                            {calculateDuration(selectedReservation.pickup.at, selectedReservation.dropoff.at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-gray-500" />
                      Payment Summary
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Payment Status</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getPaymentStatusInfo(getPaymentInfo(selectedReservation.payment_summary).status).bg}`}>
                          {getPaymentStatusInfo(getPaymentInfo(selectedReservation.payment_summary).status).text}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount Paid</span>
                          <span className="font-medium text-green-600">
                            {formatCurrencyDisplay(getPaymentInfo(selectedReservation.payment_summary).paidTotal, getPricingInfo(selectedReservation.pricing).currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Outstanding</span>
                          <span className="font-medium text-red-600">
                            {formatCurrencyDisplay(getPaymentInfo(selectedReservation.payment_summary).outstanding, getPricingInfo(selectedReservation.pricing).currency)}
                          </span>
                        </div>
                      </div>
                      {getPaymentInfo(selectedReservation.payment_summary).lastPaymentAt && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-sm text-gray-500">Last Payment</p>
                          <p className="text-sm font-medium">{formatDate(getPaymentInfo(selectedReservation.payment_summary).lastPaymentAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="bg-gray-50 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-gray-500" />
                      Pricing Breakdown
                    </h4>
                    <div className="space-y-3">
                      {getPricingInfo(selectedReservation.pricing).breakdown.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="text-xs text-gray-500">{item.quantity} × {formatCurrencyDisplay(item.unit_amount, getPricingInfo(selectedReservation.pricing).currency)}</p>
                          </div>
                          <span className="font-medium">
                            {formatCurrencyDisplay(item.total, getPricingInfo(selectedReservation.pricing).currency)}
                          </span>
                        </div>
                      ))}
                      
                      {getPricingInfo(selectedReservation.pricing).fees > 0 && (
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Fees</span>
                          <span className="font-medium">
                            {formatCurrencyDisplay(getPricingInfo(selectedReservation.pricing).fees, getPricingInfo(selectedReservation.pricing).currency)}
                          </span>
                        </div>
                      )}
                      
                      {getPricingInfo(selectedReservation.pricing).taxes > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Taxes</span>
                          <span className="font-medium">
                            {formatCurrencyDisplay(getPricingInfo(selectedReservation.pricing).taxes, getPricingInfo(selectedReservation.pricing).currency)}
                          </span>
                        </div>
                      )}
                      
                      {getPricingInfo(selectedReservation.pricing).discounts > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discounts</span>
                          <span className="font-medium">
                            -{formatCurrencyDisplay(getPricingInfo(selectedReservation.pricing).discounts, getPricingInfo(selectedReservation.pricing).currency)}
                          </span>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-800">Grand Total</span>
                          <span className="text-2xl font-bold text-[#1EA2E4]">
                            {formatCurrencyDisplay(getPricingInfo(selectedReservation.pricing).grandTotal, getPricingInfo(selectedReservation.pricing).currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {selectedReservation.notes && (
                <div className="mt-8 bg-yellow-50 rounded-lg p-5">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                    Notes
                  </h4>
                  <div className="bg-white rounded border border-yellow-200 p-4">
                    <p className="text-gray-700">{selectedReservation.notes}</p>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="mt-8 bg-gray-50 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  Reservation Timeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">Created At</p>
                    <p className="text-gray-900 font-medium">{formatDate(selectedReservation.created_at)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-gray-900 font-medium">{formatDate(selectedReservation.updated_at)}</p>
                  </div>
                  {getPricingInfo(selectedReservation.pricing).computed_at && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Pricing Computed</p>
                      <p className="text-gray-900 font-medium">{formatDate(getPricingInfo(selectedReservation.pricing).computed_at)}</p>
                    </div>
                  )}
                  {getPaymentInfo(selectedReservation.payment_summary).lastPaymentAt && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Last Payment</p>
                      <p className="text-gray-900 font-medium">{formatDate(getPaymentInfo(selectedReservation.payment_summary).lastPaymentAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Reservation ID: <span className="font-mono">{selectedReservation._id}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => generateReceipt(selectedReservation)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <FileDown className="w-4 h-4" />
                    Download PDF
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

      {/* Delete Reservation Modal */}
      {reservationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setReservationToDelete(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Reservation</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="text-sm font-medium">Warning: This action cannot be undone</p>
                </div>
                <p className="text-sm text-red-600">
                  You are about to delete this reservation. All associated data will be permanently removed.
                </p>
              </div>

              <div className="text-sm text-gray-600 mb-6">
                <p>This will permanently delete:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Reservation record</li>
                  <li>Pricing information</li>
                  <li>Driver snapshot data</li>
                  <li>Associated notes</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setReservationToDelete(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteReservation}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Reservation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusToUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setStatusToUpdate(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Update Reservation Status</h3>
                  <p className="text-sm text-gray-600">Change reservation status</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  You are about to update the status from <span className="font-semibold">{statusToUpdate.currentStatus}</span> to <span className="font-semibold">{statusToUpdate.newStatus}</span>.
                </p>
                
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-flex items-center gap-1 ${getStatusInfo(statusToUpdate.currentStatus).bg}`}>
                    {getStatusInfo(statusToUpdate.currentStatus).icon}
                    {getStatusInfo(statusToUpdate.currentStatus).text}
                  </span>
                  <ArrowLeft className="w-4 h-4 text-gray-400" />
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-flex items-center gap-1 ${getStatusInfo(statusToUpdate.newStatus).bg}`}>
                    {getStatusInfo(statusToUpdate.newStatus).icon}
                    {getStatusInfo(statusToUpdate.newStatus).text}
                  </span>
                </div>

                {/* Additional info based on status transition */}
                {(statusToUpdate.newStatus === "checked_out" || statusToUpdate.newStatus === "checked_in") && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      This will mark the vehicle as {statusToUpdate.newStatus === "checked_out" ? "checked out to customer" : "returned by customer"}.
                    </p>
                  </div>
                )}
                
                {statusToUpdate.newStatus === "cancelled" && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Cancelling this reservation may affect availability and require refund processing.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setStatusToUpdate(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
                >
                  Update Status
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

export default ReservationScreen;