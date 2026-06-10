import React, { useState, useEffect, useCallback } from "react";
import ManagerSidebar from "../../../components/ManagerSideBar";
import {
  fetchAllServiceOrders,
  createServiceOrder,
  updateServiceOrder,
  deleteServiceOrder,
  getErrorDisplay,
  type IServiceOrder,
  type ServiceOrderType,
  type ServiceOrderStatus,
  type CreateServiceOrderPayload,
  type UpdateServiceOrderPayload,
  type IVehicleModelRef,
  type IVehicleRef,
} from "../../../Services/adminAndManager/service_order_service";
import {
  fetchVehicleUnits,
  type IVehicleUnit,
} from "../../../Services/adminAndManager/vehicle_units_services";
import {
  Search,
  Trash2,
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
  Wrench,
  Gauge,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Save,
  Tag,
  Info,
  AlertTriangle,
  Check,
  XCircle,
  Clock3,
  BarChart3,
  Sparkles,
  FileText,
  CalendarClock,
  TrendingUp,
  Package,
  Layers,
  Zap,
  Shield,
  Building,
  Hash,
  Copy,
  Target,
  Users,
  Ticket,
  DollarSign,
  ClipboardCheck,
  Settings,

  RotateCw,
  Calendar as CalendarIcon,
  UserCog,
  UserCheck,
  AlertOctagon,
} from "lucide-react";

const ManagerServiceOrder: React.FC = () => {
  // State
  const [serviceOrders, setServiceOrders] = useState<IServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<IServiceOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusUpdateOrderId, setStatusUpdateOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<ServiceOrderStatus>("open");
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Data for dropdowns
  const [vehicles, setVehicles] = useState<IVehicleUnit[]>([]);

  // Initial form state
  const initialFormData: CreateServiceOrderPayload = {
    vehicle_id: null,
    type: "scheduled_service",
    status: "open",
    odometer_km: null,
    cost: null,
    notes: "",
    created_by: null,
    performed_by: null,
  };

  // Form states
  const [formData, setFormData] = useState<CreateServiceOrderPayload>(initialFormData);
  const [selectedVehicle, setSelectedVehicle] = useState<IVehicleUnit | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load service orders
  const loadServiceOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAllServiceOrders();
      
      // Get manager's branch ID
      const managerBranchId = localStorage.getItem('manager_branch_id');
      console.log('Manager Branch ID:', managerBranchId);
      
      // Filter service orders by branch
      let filteredByBranch = response.data;
      
      if (managerBranchId) {
        filteredByBranch = response.data.filter(order => {
          // Check if order has a vehicle_id with branch_id
          if (order.vehicle_id && typeof order.vehicle_id === 'object') {
            const vehicle = order.vehicle_id as IVehicleRef;
            // Check if branch_id matches (could be string or object)
            if (vehicle.branch_id) {
              const orderBranchId = typeof vehicle.branch_id === 'object' 
                ? vehicle.branch_id._id 
                : vehicle.branch_id;
              return orderBranchId === managerBranchId;
            }
          }
          return false;
        });
        
        console.log(`Filtered from ${response.data.length} to ${filteredByBranch.length} orders for branch ${managerBranchId}`);
      }
      
      setServiceOrders(filteredByBranch);
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      setError(errorDisplay.message || "Failed to load service orders");
      showSnackbar(errorDisplay.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load vehicle units
  const loadVehicleUnits = useCallback(async () => {
    try {
      const response = await fetchVehicleUnits(1, 100);
      setVehicles(response.data.items);
    } catch (err) {
      console.error("Failed to load vehicle units:", err);
      showSnackbar("Failed to load vehicles", "error");
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadServiceOrders();
    loadVehicleUnits();
  }, [loadServiceOrders, loadVehicleUnits]);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedVehicle(null);
  };

  // Open add modal with empty form
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Open edit modal with order data
  const openEditModal = (order: IServiceOrder) => {
    setSelectedOrder(order);
    
    // Find the vehicle for display
    let vehicle: IVehicleUnit | null = null;
    
    if (order.vehicle_id && typeof order.vehicle_id === 'object') {
      const vehicleObj = order.vehicle_id as IVehicleRef;
      vehicle = vehicles.find(v => v._id === vehicleObj._id) || null;
    } else if (order.vehicle_id) {
      vehicle = vehicles.find(v => v._id === order.vehicle_id) || null;
    }
    
    setSelectedVehicle(vehicle);
    
    setFormData({
      type: order.type || "scheduled_service",
      status: order.status || "open",
      odometer_km: order.odometer_km || null,
      cost: order.cost || null,
      notes: order.notes || "",
      created_by: order.created_by || null,
      performed_by: order.performed_by || null,
    });
    
    setIsEditModalOpen(true);
  };

  // Open view modal
  const openViewModal = (order: IServiceOrder) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  // Open status update modal
  const openStatusModal = (order: IServiceOrder, newStatus: ServiceOrderStatus) => {
    setSelectedOrder(order);
    setStatusUpdateOrderId(order._id);
    setNewStatus(newStatus);
    setIsStatusModalOpen(true);
  };

  // Handle add service order
  const handleAddServiceOrder = async () => {
    try {
      setIsCreating(true);
      const payload: CreateServiceOrderPayload = {
        ...formData,
        vehicle_id: selectedVehicle ? selectedVehicle._id : null,
      };

      await createServiceOrder(payload);
      showSnackbar("Service order created successfully", "success");
      setIsAddModalOpen(false);
      resetForm();
      loadServiceOrders();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle update service order
  const handleUpdateServiceOrder = async () => {
    if (!selectedOrder) return;

    try {
      setIsUpdating(true);
      const payload: UpdateServiceOrderPayload = {
        ...formData,
        vehicle_id: selectedVehicle ? selectedVehicle._id : null,
      };
      console.log(`Updating for : ${selectedOrder._id}`);
      await updateServiceOrder(selectedOrder._id, payload);
      showSnackbar("Service order updated successfully", "success");
      setIsEditModalOpen(false);
      setSelectedOrder(null);
      loadServiceOrders();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!statusUpdateOrderId) return;

    try {
      const payload: UpdateServiceOrderPayload = {
        status: newStatus,
      };

      await updateServiceOrder(statusUpdateOrderId, payload);
      showSnackbar(`Service order ${newStatus.replace('_', ' ')} successfully`, "success");
      setIsStatusModalOpen(false);
      setStatusUpdateOrderId(null);
      loadServiceOrders();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle delete service order
  const handleDeleteServiceOrder = async (orderId: string) => {
    try {
      await deleteServiceOrder(orderId);
      showSnackbar("Service order deleted successfully", "success");
      setOrderToDelete(null);
      loadServiceOrders();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle vehicle selection
  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v._id === vehicleId);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setFormData(prev => ({
        ...prev,
        vehicle_id: vehicle._id,
      }));
    }
  };

  // Filter service orders
  const filteredOrders = serviceOrders.filter((order) => {
    const matchesSearch =
      searchTerm === "" ||
      (order.notes && order.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getVehicleInfo(order).vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleInfo(order).plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" || order.status === statusFilter;

    const matchesType =
      typeFilter === "all" || order.type === typeFilter;

    const matchesVehicle =
      vehicleFilter === "all" ||
      (order.vehicle_id && 
        (typeof order.vehicle_id === 'object' 
          ? order.vehicle_id._id === vehicleFilter
          : order.vehicle_id === vehicleFilter));

    return matchesSearch && matchesStatus && matchesType && matchesVehicle;
  });

  // Get vehicle information from order
  const getVehicleInfo = (order: IServiceOrder) => {
    let vehicle: IVehicleRef | null = null;
    let branch: any = null;
    
    const vehicleModel = order.vehicle_model_id && typeof order.vehicle_model_id === 'object' 
      ? order.vehicle_model_id as IVehicleModelRef
      : null;

    if (order.vehicle_id && typeof order.vehicle_id === 'object') {
      vehicle = order.vehicle_id as IVehicleRef;
      
      if (vehicle.branch_id && typeof vehicle.branch_id === 'object') {
        branch = vehicle.branch_id;
      }
    }

    return {
      make: vehicleModel?.make || "Unknown",
      model: vehicleModel?.model || "Unknown",
      year: vehicleModel?.year || "Unknown",
      vin: vehicle?.vin || "N/A",
      plate: vehicle?.plate_number || "N/A",
      color: vehicle?.color || "N/A",
      odometer: vehicle?.odometer_km || 0,
      lastService: vehicle?.last_service_at,
      lastServiceOdo: vehicle?.last_service_odometer_km,
      photos: vehicle?.photos || vehicleModel?.images || [],
      branch: branch?.name || "Unknown Branch",
      branchCode: branch?.code || "N/A",
    };
  };

  // Get status badge
  const getStatusBadge = (order: IServiceOrder) => {
    switch (order.status) {
      case "open":
        return { text: "OPEN", color: "bg-blue-100 text-blue-800", icon: Clock };
      case "in_progress":
        return { text: "IN PROGRESS", color: "bg-yellow-100 text-yellow-800", icon: RotateCw };
      case "completed":
        return { text: "COMPLETED", color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "cancelled":
        return { text: "CANCELLED", color: "bg-red-100 text-red-800", icon: XCircle };
      default:
        return { text: "UNKNOWN", color: "bg-gray-100 text-gray-800", icon: AlertCircle };
    }
  };

  // Get type badge
  const getTypeBadge = (order: IServiceOrder) => {
    switch (order.type) {
      case "scheduled_service":
        return { text: "SCHEDULED SERVICE", color: "bg-purple-100 text-purple-800", icon: CalendarClock };
      case "repair":
        return { text: "REPAIR", color: "bg-orange-100 text-orange-800", icon: Wrench };
      case "tyre_change":
        return { text: "TYRE CHANGE", color: "bg-cyan-100 text-cyan-800", icon: RotateCw };
      case "inspection":
        return { text: "INSPECTION", color: "bg-indigo-100 text-indigo-800", icon: ClipboardCheck };
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
  const formatCurrency = (amount?: number | null) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get unique vehicles for filter
  const uniqueVehicles = vehicles.filter(vehicle => 
    serviceOrders.some(order => 
      (order.vehicle_id && 
        (typeof order.vehicle_id === 'string' 
          ? order.vehicle_id === vehicle._id 
          : order.vehicle_id._id === vehicle._id))
    )
  );

  // Get status statistics
  const statusStats = {
    open: serviceOrders.filter(o => o.status === "open").length,
    in_progress: serviceOrders.filter(o => o.status === "in_progress").length,
    completed: serviceOrders.filter(o => o.status === "completed").length,
    cancelled: serviceOrders.filter(o => o.status === "cancelled").length,
  };

  // Get type statistics
  const typeStats = {
    scheduled_service: serviceOrders.filter(o => o.type === "scheduled_service").length,
    repair: serviceOrders.filter(o => o.type === "repair").length,
    tyre_change: serviceOrders.filter(o => o.type === "tyre_change").length,
    inspection: serviceOrders.filter(o => o.type === "inspection").length,
  };

  // Quick status update buttons
  const getQuickStatusButtons = (order: IServiceOrder) => {
    const currentStatus = order.status;
    const StatusIcon = getStatusBadge(order).icon;

    return (
      <div className="flex flex-wrap gap-1">
        {currentStatus !== "open" && (
          <button
            onClick={() => openStatusModal(order, "open")}
            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            Open
          </button>
        )}
        {currentStatus !== "in_progress" && (
          <button
            onClick={() => openStatusModal(order, "in_progress")}
            className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded flex items-center gap-1"
          >
            <RotateCw className="w-3 h-3" />
            In Progress
          </button>
        )}
        {currentStatus !== "completed" && (
          <button
            onClick={() => openStatusModal(order, "completed")}
            className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded flex items-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Complete
          </button>
        )}
        {currentStatus !== "cancelled" && (
          <button
            onClick={() => openStatusModal(order, "cancelled")}
            className="px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded flex items-center gap-1"
          >
            <XCircle className="w-3 h-3" />
            Cancel
          </button>
        )}
      </div>
    );
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
                <h1 className="text-2xl font-bold text-gray-800">Service Orders Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage vehicle service orders and maintenance requests</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold">{serviceOrders.length}</span> orders
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Create Service Order</span>
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
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-800">{serviceOrders.length}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <ClipboardCheck className="w-6 h-6 text-[#1EA2E4]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {statusStats.in_progress}
                    </p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <RotateCw className="w-6 h-6 text-yellow-500" />
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
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrency(serviceOrders.reduce((sum, order) => sum + (order.cost || 0), 0))}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-500" />
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
                      placeholder="Search by VIN, plate, order ID, or notes..."
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
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[160px]"
                    >
                      <option value="all">All Types</option>
                      <option value="scheduled_service">Scheduled Service</option>
                      <option value="repair">Repair</option>
                      <option value="tyre_change">Tyre Change</option>
                      <option value="inspection">Inspection</option>
                    </select>
                    <Settings className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={vehicleFilter}
                      onChange={(e) => setVehicleFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[160px]"
                    >
                      <option value="all">All Vehicles</option>
                      {uniqueVehicles.map((vehicle) => (
                        <option key={vehicle._id} value={vehicle._id}>
                          {vehicle.vin} - {vehicle.plate_number}
                        </option>
                      ))}
                    </select>
                    <Car className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Orders Grid/Table */}
          <div className="px-6 pb-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                  <p className="text-gray-600">Loading service orders...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-red-600 text-center mb-4">{error}</p>
                <button
                  onClick={loadServiceOrders}
                  className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <Wrench className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No service orders found</p>
                <p className="text-gray-400 text-center mb-6">
                  {searchTerm || statusFilter !== "all" || typeFilter !== "all" || vehicleFilter !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "Get started by creating your first service order"}
                </p>
                {!searchTerm && statusFilter === "all" && typeFilter === "all" && vehicleFilter === "all" && (
                  <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                  >
                    Create Service Order
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Grid */}
                <div className="hidden lg:block">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrders.map((order) => {
                      const vehicleInfo = getVehicleInfo(order);
                      const statusBadge = getStatusBadge(order);
                      const typeBadge = getTypeBadge(order);
                      const StatusIcon = statusBadge.icon;
                      const TypeIcon = typeBadge.icon;

                      return (
                        <div
                          key={order._id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Vehicle Image */}
                          {vehicleInfo.photos && vehicleInfo.photos.length > 0 && (
                            <div className="h-40 overflow-hidden relative">
                              <img
                                src={vehicleInfo.photos[0]}
                                alt={`${vehicleInfo.make} ${vehicleInfo.model}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x200/1EA2E4/ffffff?text=${encodeURIComponent(
                                    `${vehicleInfo.make} ${vehicleInfo.model}`
                                  )}`;
                                }}
                              />
                              <div className="absolute top-3 right-3 flex flex-col gap-2">
                                <span
                                  className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}
                                >
                                  <StatusIcon className="w-3 h-3 inline mr-1" />
                                  {statusBadge.text}
                                </span>
                                <span
                                  className={`px-3 py-1 text-xs font-medium rounded-full ${typeBadge.color}`}
                                >
                                  <TypeIcon className="w-3 h-3 inline mr-1" />
                                  {typeBadge.text}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="p-6">
                            {/* Order Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-bold text-gray-900">
                                    {vehicleInfo.make} {vehicleInfo.model} ({vehicleInfo.year})
                                  </h3>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Tag className="w-4 h-4" />
                                  <span className="font-mono">{vehicleInfo.vin}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="font-medium">{vehicleInfo.plate}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Order ID: <span className="font-mono">{order._id.substring(0, 8)}...</span>
                                </div>
                              </div>
                              <button
                                onClick={() => openViewModal(order)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Eye className="w-5 h-5 text-gray-600" />
                              </button>
                            </div>

                            {/* Order Details */}
                            <div className="space-y-4 mb-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span>Created: {formatDate(order.created_at)}</span>
                                </div>
                                {order.cost && (
                                  <div className="text-lg font-bold text-[#1EA2E4]">
                                    {formatCurrency(order.cost)}
                                  </div>
                                )}
                              </div>

                              {order.odometer_km && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Gauge className="w-4 h-4" />
                                  <span>Odometer: {order.odometer_km.toLocaleString()} km</span>
                                </div>
                              )}

                              {order.notes && (
                                <div className="text-sm text-gray-600 line-clamp-2">
                                  <FileText className="w-4 h-4 inline mr-2" />
                                  {order.notes}
                                </div>
                              )}

                              {/* Quick Status Update */}
                              <div className="pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
                                {getQuickStatusButtons(order)}
                              </div>
                            </div>

                            {/* Vehicle Details */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {vehicleInfo.color}
                              </span>
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                {vehicleInfo.branch}
                              </span>
                              {vehicleInfo.odometer > 0 && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  {vehicleInfo.odometer.toLocaleString()} km
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                              <div className="text-xs text-gray-500">
                                {order.updated_at && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Updated: {formatDate(order.updated_at)}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditModal(order)}
                                  className="p-2 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                  title="Edit Service Order"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setOrderToDelete(order._id)}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Service Order"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {filteredOrders.map((order) => {
                    const vehicleInfo = getVehicleInfo(order);
                    const statusBadge = getStatusBadge(order);
                    const typeBadge = getTypeBadge(order);
                    const StatusIcon = statusBadge.icon;

                    return (
                      <div
                        key={order._id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                      >
                        {/* Vehicle Image for Mobile */}
                        {vehicleInfo.photos && vehicleInfo.photos.length > 0 && (
                          <div className="h-32 overflow-hidden relative">
                            <img
                              src={vehicleInfo.photos[0]}
                              alt={`${vehicleInfo.make} ${vehicleInfo.model}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x200/1EA2E4/ffffff?text=${encodeURIComponent(
                                  `${vehicleInfo.make} ${vehicleInfo.model}`
                                )}`;
                              }}
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge.color}`}
                              >
                                {statusBadge.text}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">
                                  {vehicleInfo.make} {vehicleInfo.model}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-600">
                                {vehicleInfo.vin} • {vehicleInfo.plate}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {typeBadge.text}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openViewModal(order)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => openEditModal(order)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg"
                              >
                                <Edit className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center justify-between">
                                <span>Status:</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadge.color}`}>
                                  {statusBadge.text}
                                </span>
                              </div>
                            </div>

                            <div className="text-sm text-gray-600">
                              <div className="flex items-center justify-between">
                                <span>Created:</span>
                                <span className="font-medium">
                                  {formatDate(order.created_at)}
                                </span>
                              </div>
                            </div>

                            {order.cost && (
                              <div className="text-sm text-gray-600">
                                <div className="flex items-center justify-between">
                                  <span>Cost:</span>
                                  <span className="font-bold text-[#1EA2E4]">
                                    {formatCurrency(order.cost)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {order.odometer_km && (
                              <div className="text-sm text-gray-600">
                                <div className="flex items-center justify-between">
                                  <span>Odometer:</span>
                                  <span>{order.odometer_km.toLocaleString()} km</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                              ID: {order._id.substring(0, 8)}...
                            </div>
                            <button
                              onClick={() => setOrderToDelete(order._id)}
                              className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                            >
                              Delete
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

      {/* View Service Order Details Modal - Wider Version */}
      {isViewModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Service Order Details</h2>
                <p className="text-sm text-gray-600">View complete service order information</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedOrder);
                  }}
                  className="px-3 py-1.5 text-sm bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                >
                  Edit
                </button>
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
                {/* Vehicle Information with Image */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Vehicle Information
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Vehicle Image */}
                    <div className="lg:col-span-1">
                      <div className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                        {(() => {
                          const vehicleInfo = getVehicleInfo(selectedOrder);
                          const imageUrl = vehicleInfo.photos && vehicleInfo.photos.length > 0 
                            ? vehicleInfo.photos[0]
                            : `https://via.placeholder.com/400x300/1EA2E4/ffffff?text=${encodeURIComponent(
                                `${vehicleInfo.make}+${vehicleInfo.model}`
                              )}`;
                          
                          return (
                            <img
                              src={imageUrl}
                              alt={`${vehicleInfo.make} ${vehicleInfo.model}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x300/1EA2E4/ffffff?text=${encodeURIComponent(
                                  `${vehicleInfo.make}+${vehicleInfo.model}`
                                )}`;
                              }}
                            />
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Vehicle Details */}
                    <div className="lg:col-span-2">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Make & Model</p>
                            <p className="text-lg font-bold text-gray-900">
                              {(() => {
                                const vehicleInfo = getVehicleInfo(selectedOrder);
                                return `${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.year})`;
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">VIN</p>
                            <p className="text-sm font-mono text-gray-900">{getVehicleInfo(selectedOrder).vin}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Plate Number</p>
                            <p className="text-sm font-semibold text-gray-900">{getVehicleInfo(selectedOrder).plate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Color</p>
                            <p className="text-sm text-gray-900">{getVehicleInfo(selectedOrder).color}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500">Branch Location</p>
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Building className="w-4 h-4" />
                            <span>{getVehicleInfo(selectedOrder).branch}</span>
                            <span className="text-gray-400">({getVehicleInfo(selectedOrder).branchCode})</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Current Odometer</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {getVehicleInfo(selectedOrder).odometer.toLocaleString()} km
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Last Service</p>
                            <p className="text-sm text-gray-900">
                              {getVehicleInfo(selectedOrder).lastService 
                                ? formatDate(getVehicleInfo(selectedOrder).lastService)
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Order Details */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Service Order Details
                  </h4>
                  <div className="space-y-6">
                    {/* Order Summary */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Order Summary</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <ClipboardCheck className="w-5 h-5 text-[#1EA2E4]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Order Type</p>
                              <p className="text-lg font-bold text-gray-900">
                                {(() => {
                                  const typeText = selectedOrder.type.replace('_', ' ').toUpperCase();
                                  return typeText;
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              selectedOrder.status === "completed" ? "bg-green-50" :
                              selectedOrder.status === "in_progress" ? "bg-yellow-50" :
                              selectedOrder.status === "cancelled" ? "bg-red-50" : "bg-blue-50"
                            }`}>
                              {(() => {
                                const StatusIcon = getStatusBadge(selectedOrder).icon;
                                return <StatusIcon className="w-5 h-5" style={{
                                  color: selectedOrder.status === "completed" ? "#10B981" :
                                         selectedOrder.status === "in_progress" ? "#F59E0B" :
                                         selectedOrder.status === "cancelled" ? "#EF4444" : "#3B82F6"
                                }} />;
                              })()}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Status</p>
                              <p className="text-lg font-bold text-gray-900">
                                {getStatusBadge(selectedOrder).text}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                              <DollarSign className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Cost</p>
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(selectedOrder.cost)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Information */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Detailed Information</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500">Odometer at Service</p>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedOrder.odometer_km 
                                ? `${selectedOrder.odometer_km.toLocaleString()} km`
                                : "N/A"}
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500">Created By</p>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedOrder.created_by || "System"}
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500">Created At</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDateTime(selectedOrder.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500">Performed By</p>
                            <p className="text-sm font-medium text-gray-900">
                              {selectedOrder.performed_by || "N/A"}
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500">Last Updated</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDateTime(selectedOrder.updated_at)}
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500">Order ID</p>
                            <p className="text-sm font-mono text-gray-900">
                              {selectedOrder._id}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedOrder.notes && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Notes</h5>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {selectedOrder.notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h5>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {getQuickStatusButtons(selectedOrder)}
                        </div>
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

      {/* Add/Edit Service Order Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div
          className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ease-in-out ${
            isAddModalOpen || isEditModalOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
              isAddModalOpen || isEditModalOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
            }}
          />

          {/* Side Panel */}
          <div
            className={`absolute inset-y-0 right-0 flex max-w-full transition-transform duration-300 ease-in-out ${
              isAddModalOpen || isEditModalOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="relative w-screen max-w-4xl">
              <div className="flex flex-col h-full bg-white shadow-xl">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {isEditModalOpen ? "Edit Service Order" : "Create New Service Order"}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {isEditModalOpen
                          ? "Update service order information"
                          : "Create a new service order for vehicle maintenance"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setIsEditModalOpen(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  <div className="space-y-8">
                    {/* Vehicle Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Vehicle Selection
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Vehicle
                        </label>
                        <select
                          value={selectedVehicle?._id || ""}
                          onChange={(e) => handleVehicleSelect(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        >
                          <option value="">Select a vehicle...</option>
                          {vehicles.map((vehicle) => {
                            const model = vehicle.vehicle_model_id && typeof vehicle.vehicle_model_id === 'object'
                              ? vehicle.vehicle_model_id
                              : null;
                            return (
                              <option key={vehicle._id} value={vehicle._id}>
                                {vehicle.vin} - {vehicle.plate_number} - {vehicle.color}
                                {model && ` (${model.make} ${model.model})`}
                              </option>
                            );
                          })}
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                          Select a vehicle unit for this service order
                        </p>
                      </div>
                    </div>

                    {/* Service Order Type and Status */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Service Order Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Type
                          </label>
                          <select
                            value={formData.type}
                            onChange={(e) =>
                              setFormData((prev) => ({ 
                                ...prev, 
                                type: e.target.value as ServiceOrderType 
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          >
                            <option value="scheduled_service">Scheduled Service</option>
                            <option value="repair">Repair</option>
                            <option value="tyre_change">Tyre Change</option>
                            <option value="inspection">Inspection</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) =>
                              setFormData((prev) => ({ 
                                ...prev, 
                                status: e.target.value as ServiceOrderStatus 
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Cost and Odometer */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Service Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Odometer at Service (km)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={formData.odometer_km || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({ 
                                  ...prev, 
                                  odometer_km: e.target.value ? parseInt(e.target.value) : null 
                                }))
                              }
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                              placeholder="e.g., 50000"
                            />
                            <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Service Cost ($)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.cost || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({ 
                                  ...prev, 
                                  cost: e.target.value ? parseFloat(e.target.value) : null 
                                }))
                              }
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                              placeholder="e.g., 250.00"
                            />
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Personnel */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Personnel
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Created By (User ID)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.created_by || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, created_by: e.target.value || null }))
                              }
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                              placeholder="User ID (auto-filled if empty)"
                            />
                            <UserCog className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Leave empty to use current logged-in user
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Performed By (User ID)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.performed_by || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, performed_by: e.target.value || null }))
                              }
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                              placeholder="User ID of technician"
                            />
                            <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Notes
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Notes
                        </label>
                        <textarea
                          value={formData.notes || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, notes: e.target.value }))
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          placeholder="Enter service details, issues found, work performed, recommendations..."
                          rows={5}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-8 py-5">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setIsEditModalOpen(false);
                      }}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                     <button
                        onClick={isEditModalOpen ? handleUpdateServiceOrder : handleAddServiceOrder}
                        disabled={!formData.vehicle_id || !formData.type || isCreating || isUpdating}
                        className="px-5 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[180px] justify-center"
                        >
                        {(isCreating || isUpdating) ? (
                            <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{isEditModalOpen ? "Updating..." : "Creating..."}</span>
                            </>
                        ) : (
                            <>
                            <Save className="w-4 h-4" />
                            <span>{isEditModalOpen ? "Update Service Order" : "Create Service Order"}</span>
                            </>
                        )}
                        </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsStatusModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  newStatus === "completed" ? "bg-green-100" :
                  newStatus === "in_progress" ? "bg-yellow-100" :
                  newStatus === "cancelled" ? "bg-red-100" : "bg-blue-100"
                }`}>
                  {(() => {
                    const StatusIcon = getStatusBadge({...selectedOrder, status: newStatus}).icon;
                    return <StatusIcon className="w-6 h-6" style={{
                      color: newStatus === "completed" ? "#10B981" :
                             newStatus === "in_progress" ? "#F59E0B" :
                             newStatus === "cancelled" ? "#EF4444" : "#3B82F6"
                    }} />;
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Update Service Order Status</h3>
                  <p className="text-sm text-gray-600">Change order status to <span className="font-semibold">{newStatus.replace('_', ' ')}</span></p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-2">Vehicle:</p>
                  <p className="font-medium">{getVehicleInfo(selectedOrder).make} {getVehicleInfo(selectedOrder).model}</p>
                  <p className="text-sm text-gray-500">{getVehicleInfo(selectedOrder).vin} • {getVehicleInfo(selectedOrder).plate}</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Current Status:</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedOrder).color}`}>
                    {getStatusBadge(selectedOrder).text}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg mt-3">
                  <span className="text-sm text-gray-700">New Status:</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    newStatus === "completed" ? "bg-green-100 text-green-800" :
                    newStatus === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                    newStatus === "cancelled" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {newStatus.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className={`px-4 py-2.5 text-white rounded-lg transition-colors font-medium ${
                    newStatus === "completed" ? "bg-green-600 hover:bg-green-700" :
                    newStatus === "in_progress" ? "bg-yellow-600 hover:bg-yellow-700" :
                    newStatus === "cancelled" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setOrderToDelete(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertOctagon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Service Order</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this service order? This will permanently remove all service
                information and cannot be recovered.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOrderToDelete(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteServiceOrder(orderToDelete)}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Service Order
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

export default ManagerServiceOrder;