// src/pages/AdminReservationsPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../../app/store";
import { fetchReservations , removeReservation , updateStatus } from "../../../features/reservation/reservationthunks";
import Sidebar from "../../../components/Sidebar";
import {
  Search,
  Eye,
  Plus,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Calendar,
  Clock,
  Car,
  RefreshCw,
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Hash,
  Tag,
  Gauge,
  AlertTriangle,
  Building,
  FileText,
  Image as ImageIcon,
   Edit,        // Add this
  Trash2  
} from "lucide-react";

// Types based on your API response
interface Reservation {
  _id: string;
  code: string;
  status: string;
  created_at: string;
  pickup: {
    branch_id: {
      name: string;
      address?: {
        city?: string;
      };
    };
    at: string;
  };
  dropoff: {
    branch_id: {
      name: string;
      address?: {
        city?: string;
      };
    };
    at: string;
  };
  driver_snapshot: {
    full_name: string;
    phone: string;
    email: string;
    driver_license: {
      number: string;
      class: string;
      expires_at: string;
      verified: boolean;
    };
  };
  vehicle_id: {
    plate_number: string;
    vin: string;
    color: string;
    odometer_km: number;
    photos: string[];
    metadata?: {
      seats?: number;
      doors?: number;
      features?: string[];
    };
  };
  vehicle_model_id: {
    make: string;
    model: string;
    year: number;
    class: string;
  };
  pricing: {
    currency: string;
    grand_total: { $numberDecimal: string };
    breakdown: Array<{ label: string; quantity: number; total: { $numberDecimal: string } }>;
  };
  payment_summary: {
    status: string;
    paid_total: { $numberDecimal: string };
    outstanding: { $numberDecimal: string };
  };
}

const AdminReservationsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  



const apiResponse = useSelector(
  (state: any) => state.reservations.reservations
);

const reservations: Reservation[] = apiResponse?.data || [];

const loading = useSelector(
  (state: any) => state.reservations?.isLoading
);

const error = useSelector(
  (state: any) => state.reservations?.error
);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
const [selectedStatusReservation, setSelectedStatusReservation] = useState<Reservation | null>(null);
const [selectedNewStatus, setSelectedNewStatus] = useState("");
const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  useEffect(() => {
    dispatch(fetchReservations());
  }, [dispatch]);

  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Extract reservations array from API response
  // const reservations: Reservation[] = apiResponse?.data || [];
  

  // Transform reservation for display
  const transformReservation = (res: Reservation) => {
    const pickupDate = new Date(res.pickup.at);
    const dropoffDate = new Date(res.dropoff.at);
    const durationDays = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    };

    const formatDateTime = (date: string) => {
      return new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };

    const formatCurrency = (amount: string) => {
      const num = parseFloat(amount);
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: res.pricing?.currency || "USD"
      }).format(num || 0);
    };

    return {
      id: res._id,
      code: res.code,
      customer: res.driver_snapshot?.full_name || "N/A",
      email: res.driver_snapshot?.email || "N/A",
      phone: res.driver_snapshot?.phone || "N/A",
      vehicleName: `${res.vehicle_model_id?.make || ""} ${res.vehicle_model_id?.model || ""}`.trim(),
      make: res.vehicle_model_id?.make || "N/A",
      model: res.vehicle_model_id?.model || "N/A",
      year: res.vehicle_model_id?.year || 0,
      vehicleClass: res.vehicle_model_id?.class || "N/A",
      plateNumber: res.vehicle_id?.plate_number || "N/A",
      vin: res.vehicle_id?.vin || "N/A",
      color: res.vehicle_id?.color || "N/A",
      odometer: res.vehicle_id?.odometer_km?.toLocaleString() || "0",
      photos: res.vehicle_id?.photos || [],
      startDate: formatDate(res.pickup.at),
      endDate: formatDate(res.dropoff.at),
      startDateTime: res.pickup.at,
      endDateTime: res.dropoff.at,
      startFormatted: formatDateTime(res.pickup.at),
      endFormatted: formatDateTime(res.dropoff.at),
      status: res.status?.charAt(0).toUpperCase() + res.status?.slice(1) || "Pending",
      rawStatus: res.status,
      totalAmount: formatCurrency(res.pricing?.grand_total?.$numberDecimal || "0"),
      pickupLocation: res.pickup.branch_id?.name || "N/A",
      dropoffLocation: res.dropoff.branch_id?.name || "N/A",
      duration: durationDays,
      createdDate: formatDate(res.created_at),
      paymentStatus: res.payment_summary?.status || "unpaid",
      paidAmount: formatCurrency(res.payment_summary?.paid_total?.$numberDecimal || "0"),
      outstandingAmount: formatCurrency(res.payment_summary?.outstanding?.$numberDecimal || "0"),
      seats: res.vehicle_id?.metadata?.seats || 4,
      doors: res.vehicle_id?.metadata?.doors || 4,
      features: res.vehicle_id?.metadata?.features || [],
      licenseClass: res.driver_snapshot?.driver_license?.class || "N/A",
      licenseNumber: res.driver_snapshot?.driver_license?.number || "N/A",
      licenseVerified: res.driver_snapshot?.driver_license?.verified || false,
      pricingBreakdown: res.pricing?.breakdown || []
    };
  };

  console.log("reservations:", reservations);
console.log("type:", typeof reservations);
console.log("isArray:", Array.isArray(reservations));

  // Filter reservations
  const filteredReservations = reservations.filter(res => {
    const transformed = transformReservation(res);
    const matchesSearch = searchTerm === "" ||
      transformed.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transformed.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transformed.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transformed.plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transformed.rawStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });


const handleDeleteReservation = async (reservationId: string) => {
  setIsDeleting(true);
  try {
    await dispatch(removeReservation(reservationId)).unwrap();
    showSnackbar("Reservation deleted successfully", "success");
    setReservationToDelete(null);
  } catch (err: any) {
    showSnackbar(err.message || "Failed to delete reservation", "error");
  }
  finally{
    setIsDeleting(false)
  }
};

const openStatusModal = (reservation: Reservation) => {
  setSelectedStatusReservation(reservation);
  setSelectedNewStatus(reservation.status);
  setShowStatusModal(true);
};

const handleConfirmStatusUpdate = async () => {
  if (!selectedStatusReservation || !selectedNewStatus) return;
  
  setIsUpdatingStatus(true);
  try {
    await dispatch(updateStatus({ 
      reservationId: selectedStatusReservation._id, 
      status: selectedNewStatus 
    })).unwrap();
    showSnackbar(`Reservation status updated to ${selectedNewStatus}`, "success");
    setShowStatusModal(false);
    setSelectedStatusReservation(null);
  } catch (err: any) {
    showSnackbar(err.message || "Failed to update status", "error");
  } finally {
    setIsUpdatingStatus(false);
  }
};

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      active: "bg-cyan-100 text-cyan-800 border-cyan-200",
      completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      cancelled: "bg-rose-100 text-rose-800 border-rose-200"
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: "bg-emerald-100 text-emerald-800",
      unpaid: "bg-rose-100 text-rose-800",
      partial: "bg-amber-100 text-amber-800"
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const openViewModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsViewModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar - Fixed */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Fixed */}
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
                <h1 className="text-2xl font-bold text-gray-800">Reservations Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage and track all vehicle reservations</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold">{reservations.length}</span> reservations
              </div> */}
              {/* <button
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Add Reservation</span>
              </button> */}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Stats Overview */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reservations</p>
                    <p className="text-2xl font-bold text-gray-800">{reservations.length}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Car className="w-6 h-6 text-[#1EA2E4]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {reservations.filter(r => r.status === "pending").length}
                    </p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-cyan-600">
                      {reservations.filter(r => r.status === "active").length}
                    </p>
                  </div>
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <Car className="w-6 h-6 text-cyan-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {reservations.filter(r => r.status === "completed").length}
                    </p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by customer, vehicle, or reservation code..."
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
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reservations Grid */}
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
                  onClick={() => dispatch(fetchReservations())}
                  className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <Car className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No reservations found</p>
                <p className="text-gray-400 text-center mb-6">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "Get started by adding your first reservation"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Grid */}
                <div className="hidden lg:block">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReservations.map((reservation) => {
                      const res = transformReservation(reservation);
                      
                      return (
                       <div
                                key={reservation._id}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                              >
                                {/* Vehicle Image */}
                                {res.photos && res.photos.length > 0 && (
                                  <div className="h-40 overflow-hidden">
                                    <img
                                      src={res.photos[0]}
                                      alt={res.vehicleName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x200/1EA2E4/ffffff?text=${encodeURIComponent(res.vehicleName)}`;
                                      }}
                                    />
                                  </div>
                                )}

                                <div className="p-6 flex-1">
                                  {/* Header */}
                                  <div className="flex justify-between items-start mb-4">
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">
                                          {res.vehicleName}
                                        </h3>
                                        <span
                                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(res.rawStatus)}`}
                                        >
                                          {res.status}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Hash className="w-4 h-4" />
                                        <span className="font-mono">{res.code}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Customer */}
                                  <div className="mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                      <User className="w-4 h-4" />
                                      <span className="font-medium">{res.customer}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <Mail className="w-3 h-3" />
                                      <span>{res.email}</span>
                                    </div>
                                  </div>

                                  {/* Rental Period */}
                                  <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>Pick-up</span>
                                      </div>
                                      <span className="font-medium text-gray-800">{res.startDate}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span>Drop-off</span>
                                      </div>
                                      <span className="font-medium text-gray-800">{res.endDate}</span>
                                    </div>
                                  </div>

                                  {/* Price and Payment */}
                                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                                    <div>
                                      <p className="text-xs text-gray-500">Total Amount</p>
                                      <p className="text-xl font-bold text-[#1EA2E4]">{res.totalAmount}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-gray-500">Payment</p>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(res.paymentStatus)}`}>
                                        {res.paymentStatus.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Locations */}
                                  <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-3.5 h-3.5" />
                                      <span className="truncate">{res.pickupLocation}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-3.5 h-3.5" />
                                      <span className="truncate">{res.dropoffLocation}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons at the bottom */}
                                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex justify-end gap-2">
                                  <button
                                    onClick={() => openStatusModal(reservation)}
                                    className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                    title="Update Status"
                                  >
                                     <RefreshCw className="w-4 h-4" />
                                    
                                  </button>
                                  <button
                                    onClick={() => openViewModal(reservation)}
                                    className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4 text-gray-600" />
                                  </button>
                                  <button
                                    className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors"
                                    title="Edit Reservation"
                                  >
                                    <Edit className="w-4 h-4 text-blue-600" />
                                  </button>
                                  <button
                                    onClick={() => setReservationToDelete(reservation._id)}
                                    className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Delete Reservation"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              </div>
                          
                        
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {filteredReservations.map((reservation) => {
                    const res = transformReservation(reservation);
                    
                    return (
                     <div
  key={reservation._id}
  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
>
  {/* Vehicle Image for Mobile */}
  {res.photos && res.photos.length > 0 && (
    <div className="h-32 overflow-hidden">
      <img
        src={res.photos[0]}
        alt={res.vehicleName}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x200/1EA2E4/ffffff?text=${encodeURIComponent(res.vehicleName)}`;
        }}
      />
    </div>
  )}

  <div className="p-4 flex-1">
    <div className="flex justify-between items-start mb-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-gray-900">{res.vehicleName}</h3>
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(res.rawStatus)}`}
          >
            {res.status}
          </span>
        </div>
        <p className="text-sm text-gray-600 font-mono">{res.code}</p>
      </div>
    </div>

    <div className="mb-3">
      <p className="font-medium text-gray-900">{res.customer}</p>
      <p className="text-xs text-gray-500">{res.email}</p>
    </div>

    <div className="grid grid-cols-2 gap-3 mb-3">
      <div>
        <p className="text-xs text-gray-500">Pick-up</p>
        <p className="text-sm font-medium">{res.startDate}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Drop-off</p>
        <p className="text-sm font-medium">{res.endDate}</p>
      </div>
    </div>

    <div className="flex items-center justify-between mb-3 pt-2">
      <div>
        <p className="text-lg font-bold text-[#1EA2E4]">{res.totalAmount}</p>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(res.paymentStatus)}`}>
          {res.paymentStatus}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          <span className="truncate max-w-[100px]">{res.pickupLocation}</span>
        </div>
      </div>
    </div>
  </div>

  {/* Action Buttons at the bottom for mobile */}
  <div className="border-t border-gray-100 p-3 bg-gray-50 flex flex-wrap gap-2 justify-end">
    <button
      onClick={() => openStatusModal(reservation)}
      className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
    
    </button>
    <button
      onClick={() => openViewModal(reservation)}
      className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
    >
      <Eye className="w-3.5 h-3.5 text-gray-600" />
    </button>
    <button
      className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-blue-50"
    >
      <Edit className="w-3.5 h-3.5 text-blue-600" />
    </button>
    <button
      onClick={() => setReservationToDelete(reservation._id)}
      className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-red-50"
    >
      <Trash2 className="w-3.5 h-3.5 text-red-600" />
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

      {/* View Reservation Details Modal */}
      {isViewModalOpen && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Reservation Details</h2>
                <p className="text-sm text-gray-600">Complete reservation information</p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-8" style={{ maxHeight: "calc(90vh - 80px)" }}>
              {(() => {
                const details = transformReservation(selectedReservation);
                return (
                  <div className="space-y-8">
                    {/* Status Bar */}
                    <div className="flex flex-wrap gap-3 pb-4 border-b border-gray-200">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(details.rawStatus)}`}>
                        {details.status}
                      </span>
                      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getPaymentStatusColor(details.paymentStatus)}`}>
                        {details.paymentStatus.toUpperCase()}
                      </span>
                      <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                        {details.duration} Day{details.duration !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Vehicle Photos */}
                    {details.photos.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                          Vehicle Photos
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {details.photos.slice(0, 3).map((photo, idx) => (
                            <div key={idx} className="rounded-lg overflow-hidden border border-gray-200 aspect-video">
                              <img src={photo} alt={`${details.vehicleName} ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customer Information */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-[#1EA2E4]" />
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                          Customer Information
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="text-lg font-bold text-gray-900">{details.customer}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900">{details.email}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900">{details.phone || "N/A"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Driver License</p>
                          <p className="text-gray-900">{details.licenseClass} • {details.licenseNumber}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Car className="w-5 h-5 text-[#1EA2E4]" />
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                          Vehicle Information
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-gray-500">Make & Model</p>
                          <p className="text-lg font-bold text-gray-900">{details.vehicleName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Year</p>
                          <p className="text-gray-900">{details.year}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Plate Number</p>
                          <p className="font-mono text-gray-900">{details.plateNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">VIN</p>
                          <p className="font-mono text-sm text-gray-900">{details.vin}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Color</p>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: details.color.toLowerCase() }}></div>
                            <p className="text-gray-900">{details.color}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Odometer</p>
                          <div className="flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900">{details.odometer} km</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Seats</p>
                          <p className="text-gray-900">{details.seats}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Doors</p>
                          <p className="text-gray-900">{details.doors}</p>
                        </div>
                      </div>
                      {details.features.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Features</p>
                          <div className="flex flex-wrap gap-2">
                            {details.features.map((feature, idx) => (
                              <span key={idx} className="px-2 py-1 bg-white rounded-lg text-xs text-gray-600 border border-gray-200">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Rental Details */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-[#1EA2E4]" />
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                          Rental Details
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Pick-up Location</p>
                              <p className="text-gray-900">{details.pickupLocation}</p>
                              <p className="text-sm text-gray-500 mt-1">{details.startFormatted}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-purple-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Drop-off Location</p>
                              <p className="text-gray-900">{details.dropoffLocation}</p>
                              <p className="text-sm text-gray-500 mt-1">{details.endFormatted}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="w-5 h-5 text-[#1EA2E4]" />
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                          Payment Summary
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">Total Amount</p>
                          <p className="text-2xl font-bold text-[#1EA2E4]">{details.totalAmount}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">Paid Amount</p>
                          <p className="text-2xl font-bold text-emerald-600">{details.paidAmount}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">Outstanding</p>
                          <p className="text-2xl font-bold text-rose-600">{details.outstandingAmount}</p>
                        </div>
                      </div>
                      {details.pricingBreakdown.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-3">Pricing Breakdown</p>
                          <div className="space-y-2">
                            {details.pricingBreakdown.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.label} (x{item.quantity})</span>
                                <span className="font-medium text-gray-900">
                                  {new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: selectedReservation.pricing?.currency || "USD"
                                  }).format(parseFloat(item.total.$numberDecimal))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
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

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setShowMobileFilters(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Filter by Status</h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {["all", "pending", "confirmed", "active", "completed", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setShowMobileFilters(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-left font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-[#1EA2E4] text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
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

      {/* Status Update Modal */}
{showStatusModal && selectedStatusReservation && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={() => !isUpdatingStatus && setShowStatusModal(false)}
    />
    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Update Reservation Status</h3>
            <p className="text-sm text-gray-600">
              Reservation: {selectedStatusReservation.code}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select New Status
          </label>
          <select
            value={selectedNewStatus}
            onChange={(e) => setSelectedNewStatus(e.target.value)}
            disabled={isUpdatingStatus}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent disabled:opacity-50"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowStatusModal(false)}
            disabled={isUpdatingStatus}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmStatusUpdate}
            disabled={isUpdatingStatus || selectedNewStatus === selectedStatusReservation.status}
            className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUpdatingStatus ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Delete Confirmation Modal */}
     
{reservationToDelete && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={() => !isDeleting && setReservationToDelete(null)}
    />
    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Delete Reservation</h3>
            <p className="text-sm text-gray-600">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this reservation? This will permanently remove all
          reservation data and cannot be recovered.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setReservationToDelete(null)}
            disabled={isDeleting}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDeleteReservation(reservationToDelete)}
            disabled={isDeleting}
            className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              "Delete Reservation"
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AdminReservationsPage;