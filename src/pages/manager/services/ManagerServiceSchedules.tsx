import React, { useState, useEffect, useCallback } from "react";
import ManagerSidebar from "../../../components/ManagerSideBar";
import {
  fetchAllServiceSchedules,
  createServiceSchedule,
  updateServiceSchedule,
  deleteServiceSchedule,
  getErrorDisplay,
  type IServiceSchedule,
  type CreateServiceSchedulePayload,
  type UpdateServiceSchedulePayload,
  type IVehicleRef,
  type IVehicleModelRef,
} from "../../../Services/adminAndManager/service_schedule_service";
import {
  fetchVehicleUnits,
  type IVehicleUnit,
  type VehicleStatus,
  type AvailabilityState,
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
} from "lucide-react";

const ManagerServiceSchedules: React.FC = () => {
  // State
  const [serviceSchedules, setServiceSchedules] = useState<IServiceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");

  // Modal states
  const [selectedSchedule, setSelectedSchedule] = useState<IServiceSchedule | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Data for dropdowns
  const [vehicles, setVehicles] = useState<IVehicleUnit[]>([]);
  const [vehicleModels, setVehicleModels] = useState<IVehicleModelRef[]>([]);

  // Initial form state
  const initialFormData: CreateServiceSchedulePayload = {
    vehicle_id: null,
    vehicle_model_id: null,
    interval_km: null,
    interval_days: null,
    next_due_at: null,
    next_due_odo: null,
    notes: "",
  };

  // Form states
  const [formData, setFormData] = useState<CreateServiceSchedulePayload>(initialFormData);
  const [selectedVehicle, setSelectedVehicle] = useState<IVehicleUnit | null>(null);
  const [selectedVehicleModel, setSelectedVehicleModel] = useState<IVehicleModelRef | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load service schedules
const loadServiceSchedules = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await fetchAllServiceSchedules();
    
    // Get manager's branch ID
    const managerBranchId = localStorage.getItem('manager_branch_id');
    console.log('Manager Branch ID:', managerBranchId);
    
    // Filter service schedules by branch
    let filteredByBranch = response.data;
    
    if (managerBranchId) {
      filteredByBranch = response.data.filter(schedule => {
        // Check if schedule has a vehicle_id with branch_id
        if (schedule.vehicle_id && typeof schedule.vehicle_id === 'object') {
          const vehicle = schedule.vehicle_id as IVehicleRef;
          // Check if branch_id matches (could be string or object)
          if (vehicle && vehicle.branch_id) {
            const scheduleBranchId = typeof vehicle.branch_id === 'object' && vehicle.branch_id !== null
              ? (vehicle.branch_id as any)._id 
              : vehicle.branch_id;
            return scheduleBranchId === managerBranchId;
          }
        }
        return false;
      });
      
      console.log(`Filtered from ${response.data.length} to ${filteredByBranch.length} schedules for branch ${managerBranchId}`);
    }
    
    setServiceSchedules(filteredByBranch);
  } catch (err) {
    const errorDisplay = getErrorDisplay(err);
    setError(errorDisplay.message || "Failed to load service schedules");
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
      
      // Extract unique vehicle models from vehicles
      const modelsMap = new Map<string, IVehicleModelRef>();
      response.data.items.forEach((vehicle) => {
        if (vehicle.vehicle_model_id && typeof vehicle.vehicle_model_id === 'object') {
          modelsMap.set(vehicle.vehicle_model_id._id, vehicle.vehicle_model_id);
        }
      });
      setVehicleModels(Array.from(modelsMap.values()));
    } catch (err) {
      console.error("Failed to load vehicle units:", err);
      showSnackbar("Failed to load vehicles", "error");
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadServiceSchedules();
    loadVehicleUnits();
  }, [loadServiceSchedules, loadVehicleUnits]);

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
    setSelectedVehicleModel(null);
  };

  // Open add modal with empty form
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Open edit modal with schedule data
 const openEditModal = (schedule: IServiceSchedule) => {
  setSelectedSchedule(schedule);
  
  // Find the vehicle and model for display
  let vehicle: IVehicleUnit | null = null;
  let vehicleModel: IVehicleModelRef | null = null;
  
  // Extract vehicle ID (handle both string and object)
  let vehicleId: string | null = null;
  if (schedule.vehicle_id) {
    if (typeof schedule.vehicle_id === 'object') {
      const vehicleObj = schedule.vehicle_id as IVehicleRef;
      vehicleId = vehicleObj._id;
      // Find the full vehicle object from vehicles array
      vehicle = vehicles.find(v => v._id === vehicleObj._id) || null;
    } else if (typeof schedule.vehicle_id === 'string') {
      vehicleId = schedule.vehicle_id;
      vehicle = vehicles.find(v => v._id === schedule.vehicle_id) || null;
    }
  }
  
  // Extract vehicle model ID (handle both string and object)
  let vehicleModelId: string | null = null;
  if (schedule.vehicle_model_id) {
    if (typeof schedule.vehicle_model_id === 'object') {
      const modelObj = schedule.vehicle_model_id as IVehicleModelRef;
      vehicleModelId = modelObj._id;
      vehicleModel = modelObj;
    } else if (typeof schedule.vehicle_model_id === 'string') {
      vehicleModelId = schedule.vehicle_model_id;
      vehicleModel = vehicleModels.find(m => m._id === schedule.vehicle_model_id) || null;
    }
  }
  
  setSelectedVehicle(vehicle);
  setSelectedVehicleModel(vehicleModel);
  
  setFormData({
    vehicle_id: vehicleId,
    vehicle_model_id: vehicleModelId,
    interval_km: schedule.interval_km || null,
    interval_days: schedule.interval_days || null,
    next_due_at: schedule.next_due_at || null,
    next_due_odo: schedule.next_due_odo || null,
    notes: schedule.notes || "",
  });
  
  setIsEditModalOpen(true);
};

  // Open view modal
  const openViewModal = (schedule: IServiceSchedule) => {
    setSelectedSchedule(schedule);
    setIsViewModalOpen(true);
  };

  // Handle add service schedule
  const handleAddServiceSchedule = async () => {
    try {
    setIsCreating(true);
      const payload: CreateServiceSchedulePayload = {
        ...formData,
        vehicle_id: selectedVehicle ? selectedVehicle._id : null,
        vehicle_model_id: selectedVehicleModel ? selectedVehicleModel._id : null,
      };

      await createServiceSchedule(payload);
      showSnackbar("Service schedule created successfully", "success");
      setIsAddModalOpen(false);
      resetForm();
      loadServiceSchedules();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
     finally {
    setIsCreating(false);
  }

  };

  // Handle update service schedule
  const handleUpdateServiceSchedule = async () => {
    if (!selectedSchedule) return;

    try {
        setIsUpdating(true);
      const payload: UpdateServiceSchedulePayload = {
        ...formData,
        vehicle_id: selectedVehicle ? selectedVehicle._id : null,
        vehicle_model_id: selectedVehicleModel ? selectedVehicleModel._id : null,
      };

      await updateServiceSchedule(selectedSchedule._id, payload);
      showSnackbar("Service schedule updated successfully", "success");
      setIsEditModalOpen(false);
      setSelectedSchedule(null);
      loadServiceSchedules();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
    finally{
        setIsUpdating(false);
    }
  };

  // Handle delete service schedule
  const handleDeleteServiceSchedule = async (scheduleId: string) => {
    try {
      await deleteServiceSchedule(scheduleId);
      showSnackbar("Service schedule deleted successfully", "success");
      setScheduleToDelete(null);
      loadServiceSchedules();
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
      setSelectedVehicleModel(null);
      setFormData(prev => ({
        ...prev,
        vehicle_id: vehicle._id,
        vehicle_model_id: null,
      }));
    }
  };

  // Handle vehicle model selection
  const handleVehicleModelSelect = (modelId: string) => {
    const model = vehicleModels.find(m => m._id === modelId);
    if (model) {
      setSelectedVehicleModel(model);
      setSelectedVehicle(null);
      setFormData(prev => ({
        ...prev,
        vehicle_id: null,
        vehicle_model_id: model._id,
      }));
    }
  };

  // Filter service schedules
  const filteredSchedules = serviceSchedules.filter((schedule) => {
    const matchesSearch =
      searchTerm === "" ||
      (schedule.notes && schedule.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getVehicleInfo(schedule).make.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "due" && isDueSoon(schedule)) ||
      (statusFilter === "overdue" && isOverdue(schedule)) ||
      (statusFilter === "future" && isFuture(schedule));

    const matchesVehicle =
      vehicleFilter === "all" ||
      (schedule.vehicle_id && 
        (typeof schedule.vehicle_id === 'object' 
          ? schedule.vehicle_id._id === vehicleFilter
          : schedule.vehicle_id === vehicleFilter));

    return matchesSearch && matchesStatus && matchesVehicle;
  });

  // Get vehicle information from schedule
  const getVehicleInfo = (schedule: IServiceSchedule) => {
    let vehicle: IVehicleRef | null = null;
    let vehicleModel: IVehicleModelRef | null = null;
    let branch: any = null;

    // Extract vehicle info
    if (schedule.vehicle_id && typeof schedule.vehicle_id === 'object') {
      vehicle = schedule.vehicle_id as IVehicleRef;
    }

    // Extract vehicle model info
    if (schedule.vehicle_model_id && typeof schedule.vehicle_model_id === 'object') {
      vehicleModel = schedule.vehicle_model_id as IVehicleModelRef;
    }

    // Get branch info from vehicle
    if (vehicle && typeof vehicle.branch_id === 'object') {
      branch = vehicle.branch_id;
    } else if (selectedVehicle && selectedVehicle.branch_id && typeof selectedVehicle.branch_id === 'object') {
      branch = selectedVehicle.branch_id;
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

  // Check if service is due soon (within 7 days)
  const isDueSoon = (schedule: IServiceSchedule) => {
    if (!schedule.next_due_at) return false;
    const dueDate = new Date(schedule.next_due_at);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  // Check if service is overdue
  const isOverdue = (schedule: IServiceSchedule) => {
    if (!schedule.next_due_at) return false;
    const dueDate = new Date(schedule.next_due_at);
    const today = new Date();
    return dueDate < today;
  };

  // Check if service is in future (more than 7 days)
  const isFuture = (schedule: IServiceSchedule) => {
    if (!schedule.next_due_at) return true;
    const dueDate = new Date(schedule.next_due_at);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 7;
  };

  // Get status badge
  const getStatusBadge = (schedule: IServiceSchedule) => {
    if (isOverdue(schedule)) {
      return { text: "OVERDUE", color: "bg-red-100 text-red-800" };
    } else if (isDueSoon(schedule)) {
      return { text: "DUE SOON", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { text: "UPCOMING", color: "bg-green-100 text-green-800" };
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

  // Calculate days until due
  const getDaysUntilDue = (schedule: IServiceSchedule) => {
    if (!schedule.next_due_at) return null;
    const dueDate = new Date(schedule.next_due_at);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get progress percentage for odometer-based service
  const getOdometerProgress = (schedule: IServiceSchedule) => {
    if (!schedule.next_due_odo || !schedule.interval_km) return null;
    
    const vehicleInfo = getVehicleInfo(schedule);
    if (!vehicleInfo.odometer) return null;
    
    const lastServiceOdo = vehicleInfo.lastServiceOdo || 0;
    const currentOdo = vehicleInfo.odometer;
    const interval = schedule.interval_km;
    
    const progress = ((currentOdo - lastServiceOdo) / interval) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  // Get unique vehicles for filter
  const uniqueVehicles = vehicles.filter(vehicle => 
    serviceSchedules.some(schedule => 
      (schedule.vehicle_id && 
        (typeof schedule.vehicle_id === 'string' 
          ? schedule.vehicle_id === vehicle._id 
          : schedule.vehicle_id._id === vehicle._id))
    )
  );

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
                <h1 className="text-2xl font-bold text-gray-800">Service Schedules Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage vehicle maintenance and service schedules</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold">{serviceSchedules.length}</span> schedules
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Add Service Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Stats Overview */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Schedules</p>
                    <p className="text-2xl font-bold text-gray-800">{serviceSchedules.length}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-[#1EA2E4]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">
                      {serviceSchedules.filter(isOverdue).length}
                    </p>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Due Soon</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {serviceSchedules.filter(isDueSoon).length}
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
                    <p className="text-sm text-gray-600">Active Vehicles</p>
                    <p className="text-2xl font-bold text-gray-800">{vehicles.length}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Car className="w-6 h-6 text-green-500" />
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
                      placeholder="Search by vehicle, model, or notes..."
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
                      <option value="overdue">Overdue</option>
                      <option value="due">Due Soon</option>
                      <option value="future">Future</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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

          {/* Service Schedules Grid/Table */}
          <div className="px-6 pb-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                  <p className="text-gray-600">Loading service schedules...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-red-600 text-center mb-4">{error}</p>
                <button
                  onClick={loadServiceSchedules}
                  className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : filteredSchedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <Wrench className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No service schedules found</p>
                <p className="text-gray-400 text-center mb-6">
                  {searchTerm || statusFilter !== "all" || vehicleFilter !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "Get started by adding your first service schedule"}
                </p>
                {!searchTerm && statusFilter === "all" && vehicleFilter === "all" && (
                  <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                  >
                    Add Service Schedule
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Grid */}
                <div className="hidden lg:block">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSchedules.map((schedule) => {
                      const vehicleInfo = getVehicleInfo(schedule);
                      const statusBadge = getStatusBadge(schedule);
                      const daysUntilDue = getDaysUntilDue(schedule);
                      const odometerProgress = getOdometerProgress(schedule);

                      return (
                        <div
                          key={schedule._id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Vehicle Image */}
                          {vehicleInfo.photos && vehicleInfo.photos.length > 0 && (
                            <div className="h-40 overflow-hidden">
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
                            </div>
                          )}

                          <div className="p-6">
                            {/* Schedule Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-bold text-gray-900">
                                    {vehicleInfo.make} {vehicleInfo.model} ({vehicleInfo.year})
                                  </h3>
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}
                                  >
                                    {statusBadge.text}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Tag className="w-4 h-4" />
                                  <span className="font-mono">{vehicleInfo.vin}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="font-medium">{vehicleInfo.plate}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => openViewModal(schedule)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Eye className="w-5 h-5 text-gray-600" />
                              </button>
                            </div>

                            {/* Next Due Date */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-600">Next Service</span>
                                <span className="text-sm font-semibold text-gray-800">
                                  {formatDate(schedule.next_due_at)}
                                </span>
                              </div>
                              {daysUntilDue !== null && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className={daysUntilDue <= 0 ? "text-red-600 font-medium" : "text-gray-600"}>
                                    {daysUntilDue <= 0 
                                      ? `${Math.abs(daysUntilDue)} days overdue` 
                                      : `Due in ${daysUntilDue} days`}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Service Intervals */}
                            <div className="space-y-3 mb-6">
                              {schedule.interval_km && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Gauge className="w-4 h-4" />
                                    <span>Every {schedule.interval_km.toLocaleString()} km</span>
                                  </div>
                                  {odometerProgress !== null && (
                                    <div className="text-xs font-medium text-gray-700">
                                      {Math.round(odometerProgress)}% used
                                    </div>
                                  )}
                                </div>
                              )}

                              {schedule.interval_days && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span>Every {schedule.interval_days} days</span>
                                </div>
                              )}

                              {schedule.next_due_odo && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <BarChart3 className="w-4 h-4" />
                                  <span>Next at {schedule.next_due_odo.toLocaleString()} km</span>
                                </div>
                              )}
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
                                {schedule.createdAt && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(schedule.createdAt)}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditModal(schedule)}
                                  className="p-2 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                  title="Edit Service Schedule"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setScheduleToDelete(schedule._id)}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Service Schedule"
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
                  {filteredSchedules.map((schedule) => {
                    const vehicleInfo = getVehicleInfo(schedule);
                    const statusBadge = getStatusBadge(schedule);
                    const daysUntilDue = getDaysUntilDue(schedule);

                    return (
                      <div
                        key={schedule._id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                      >
                        {/* Vehicle Image for Mobile */}
                        {vehicleInfo.photos && vehicleInfo.photos.length > 0 && (
                          <div className="h-32 overflow-hidden">
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
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">
                                  {vehicleInfo.make} {vehicleInfo.model}
                                </h3>
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadge.color}`}
                                >
                                  {statusBadge.text}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {vehicleInfo.vin} • {vehicleInfo.plate}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openViewModal(schedule)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => openEditModal(schedule)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg"
                              >
                                <Edit className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center justify-between">
                                <span>Next Service:</span>
                                <span className="font-medium">
                                  {formatDate(schedule.next_due_at)}
                                </span>
                              </div>
                            </div>

                            <div className="text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {daysUntilDue !== null && daysUntilDue <= 0
                                    ? `${Math.abs(daysUntilDue)} days overdue`
                                    : daysUntilDue !== null
                                    ? `Due in ${daysUntilDue} days`
                                    : "No due date"}
                                </span>
                              </div>
                            </div>

                            {schedule.interval_km && (
                              <div className="text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Gauge className="w-4 h-4" />
                                  <span>Interval: {schedule.interval_km.toLocaleString()} km</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            {schedule.createdAt && (
                              <div className="text-xs text-gray-500">
                                {formatDate(schedule.createdAt)}
                              </div>
                            )}
                            <button
                              onClick={() => setScheduleToDelete(schedule._id)}
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

      {/* All Modals remain exactly the same */}
      {/* View Service Schedule Details Modal */}
      {isViewModalOpen && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Service Schedule Details</h2>
                <p className="text-sm text-gray-600">View complete service schedule information</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedSchedule);
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
                          const vehicleInfo = getVehicleInfo(selectedSchedule);
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
                                const vehicleInfo = getVehicleInfo(selectedSchedule);
                                return `${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.year})`;
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedSchedule).color}`}>
                              {getStatusBadge(selectedSchedule).text}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">VIN</p>
                            <p className="text-sm font-mono text-gray-900">{getVehicleInfo(selectedSchedule).vin}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Plate Number</p>
                            <p className="text-sm font-semibold text-gray-900">{getVehicleInfo(selectedSchedule).plate}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Color</p>
                            <p className="text-sm text-gray-900">{getVehicleInfo(selectedSchedule).color}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Current Odometer</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {getVehicleInfo(selectedSchedule).odometer.toLocaleString()} km
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500">Branch Location</p>
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Building className="w-4 h-4" />
                            <span>{getVehicleInfo(selectedSchedule).branch}</span>
                            <span className="text-gray-400">({getVehicleInfo(selectedSchedule).branchCode})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Schedule Details */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Service Schedule Details
                  </h4>
                  <div className="space-y-6">
                    {/* Next Service Date */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Next Service</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Calendar className="w-5 h-5 text-[#1EA2E4]" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Due Date</p>
                              <p className="text-lg font-bold text-gray-900">
                                {formatDate(selectedSchedule.next_due_at)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {(() => {
                                  const daysUntilDue = getDaysUntilDue(selectedSchedule);
                                  if (daysUntilDue === null) return "No due date set";
                                  if (daysUntilDue <= 0) {
                                    return `${Math.abs(daysUntilDue)} days overdue`;
                                  }
                                  return `Due in ${daysUntilDue} days`;
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {selectedSchedule.next_due_odo && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-50 rounded-lg">
                                <Gauge className="w-5 h-5 text-green-500" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Due Odometer</p>
                                <p className="text-lg font-bold text-gray-900">
                                  {selectedSchedule.next_due_odo.toLocaleString()} km
                                </p>
                                <p className="text-sm text-gray-600">
                                  {(() => {
                                    const progress = getOdometerProgress(selectedSchedule);
                                    if (progress === null) return "N/A";
                                    return `${Math.round(progress)}% of interval used`;
                                  })()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Service Intervals */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Service Intervals</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedSchedule.interval_km && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Gauge className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Distance Interval</p>
                                  <p className="text-lg font-bold text-gray-900">
                                    {selectedSchedule.interval_km.toLocaleString()} km
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {selectedSchedule.interval_days && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Time Interval</p>
                                  <p className="text-lg font-bold text-gray-900">
                                    {selectedSchedule.interval_days} days
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Odometer Progress Bar */}
                    {selectedSchedule.interval_km && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-700">Odometer Progress</p>
                          <span className="text-sm font-medium text-gray-700">
                            {(() => {
                              const progress = getOdometerProgress(selectedSchedule);
                              return progress !== null ? `${Math.round(progress)}%` : "N/A";
                            })()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-[#1EA2E4] h-3 rounded-full transition-all duration-300"
                            style={{ width: `${getOdometerProgress(selectedSchedule) || 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>
                            Last Service: {getVehicleInfo(selectedSchedule).lastServiceOdo?.toLocaleString() || "N/A"} km
                          </span>
                          <span>
                            Current: {getVehicleInfo(selectedSchedule).odometer.toLocaleString()} km
                          </span>
                          <span>
                            Next Due: {selectedSchedule.next_due_odo?.toLocaleString() || "N/A"} km
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Last Service Information */}
                    {getVehicleInfo(selectedSchedule).lastService && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Last Service</h5>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Date</p>
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(getVehicleInfo(selectedSchedule).lastService)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Odometer</p>
                              <p className="text-sm font-medium text-gray-900">
                                {getVehicleInfo(selectedSchedule).lastServiceOdo?.toLocaleString() || "N/A"} km
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedSchedule.notes && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Notes</h5>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {selectedSchedule.notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Meta Information */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Meta Information</h5>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedSchedule.createdAt && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500">Created</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDateTime(selectedSchedule.createdAt)}
                            </p>
                          </div>
                        )}
                        {selectedSchedule.updatedAt && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500">Last Updated</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDateTime(selectedSchedule.updatedAt)}
                            </p>
                          </div>
                        )}
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

      {/* Add/Edit Service Schedule Modal */}
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
                        {isEditModalOpen ? "Edit Service Schedule" : "Add New Service Schedule"}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {isEditModalOpen
                          ? "Update service schedule information"
                          : "Create a new service schedule"}
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
                      <div className="space-y-6">
                        {/* Vehicle Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Specific Vehicle
                          </label>
                          <select
                            value={selectedVehicle?._id || ""}
                            onChange={(e) => handleVehicleSelect(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          >
                            <option value="">Select a vehicle...</option>
                            {vehicles.map((vehicle) => (
                              <option key={vehicle._id} value={vehicle._id}>
                                {vehicle.vin} - {vehicle.plate_number} - {vehicle.color}
                                {vehicle.vehicle_model_id && typeof vehicle.vehicle_model_id === 'object' && 
                                  ` (${vehicle.vehicle_model_id.make} ${vehicle.vehicle_model_id.model})`}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-2">
                            Select a specific vehicle unit for this service schedule
                          </p>
                        </div>

                        {/* OR Separator */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">OR</span>
                          </div>
                        </div>

                        {/* Vehicle Model Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Vehicle Model
                          </label>
                          <select
                            value={selectedVehicleModel?._id || ""}
                            onChange={(e) => handleVehicleModelSelect(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          >
                            <option value="">Select a vehicle model...</option>
                            {vehicleModels.map((model) => (
                              <option key={model._id} value={model._id}>
                                {model.make} {model.model} ({model.year}) - {model.class}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-2">
                            Apply this service schedule to all vehicles of this model
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Service Intervals */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Service Intervals
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Distance Interval (km)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={formData.interval_km || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({ 
                                  ...prev, 
                                  interval_km: e.target.value ? parseInt(e.target.value) : null 
                                }))
                              }
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                              placeholder="e.g., 5000"
                            />
                            <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Service every X kilometers (0 for no distance-based interval)
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time Interval (days)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={formData.interval_days || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({ 
                                  ...prev, 
                                  interval_days: e.target.value ? parseInt(e.target.value) : null 
                                }))
                              }
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                              placeholder="e.g., 90"
                            />
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Service every X days (0 for no time-based interval)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Next Service Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Next Service Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Next Due Date
                          </label>
                          <input
                            type="date"
                            value={formData.next_due_at || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ 
                                ...prev, 
                                next_due_at: e.target.value || null 
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Next Due Odometer (km)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={formData.next_due_odo || ""}
                              onChange={(e) =>
                                setFormData((prev) => ({ 
                                  ...prev, 
                                  next_due_odo: e.target.value ? parseInt(e.target.value) : null 
                                }))
                              }
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                              placeholder="e.g., 15000"
                            />
                            <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        At least one interval (distance or time) must be specified
                      </p>
                    </div>

                    {/* Notes */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Notes
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Notes
                        </label>
                        <textarea
                          value={formData.notes || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, notes: e.target.value }))
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          placeholder="Enter any additional notes or specific instructions for this service schedule..."
                          rows={4}
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
                        onClick={isEditModalOpen ? handleUpdateServiceSchedule : handleAddServiceSchedule}
                        disabled={(!formData.vehicle_id && !formData.vehicle_model_id) || 
                                (!formData.interval_km && !formData.interval_days) ||
                                isCreating || isUpdating}
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
                            <span>{isEditModalOpen ? "Update Service Schedule" : "Create Service Schedule"}</span>
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

      {/* Delete Confirmation Modal */}
      {scheduleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setScheduleToDelete(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Service Schedule</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this service schedule? This will remove all schedule
                information and cannot be recovered.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setScheduleToDelete(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteServiceSchedule(scheduleToDelete)}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Service Schedule
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

export default ManagerServiceSchedules;