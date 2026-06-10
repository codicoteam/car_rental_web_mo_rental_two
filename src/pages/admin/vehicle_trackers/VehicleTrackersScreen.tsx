// Screens/VehicleTrackersScreen.tsx

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../../components/Sidebar";

import VehicleTrackerService , {type VehicleTracker, type CreateTrackerPayload,type UpdateTrackerPayload } from "../../../Services/adminAndManager/vehicle_trackers_service";
import { fetchVehicleUnits } from "../../../Services/adminAndManager/vehicle_units_services";
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
  Plus,
  Edit,
  Trash2,
  
  Activity,
  Wifi,
  WifiOff,
  Circle,
  Save,
} from "lucide-react";

const VehicleTrackersScreen: React.FC = () => {
  // State
  const [trackers, setTrackers] = useState<VehicleTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");


  const [selectedTracker, setSelectedTracker] = useState<VehicleTracker | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
const [loadingVehicles, setLoadingVehicles] = useState(false);
const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
const [selectedVehicleId, setSelectedVehicleId] = useState("");
const [attaching, setAttaching] = useState(false);
const [isDetachModalOpen, setIsDetachModalOpen] = useState(false);
const [detachReason, setDetachReason] = useState("");
const [detaching, setDetaching] = useState(false);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateTrackerPayload>({
    device_id: "",
    label: "",
    notes: "",
  });
  
  const [editForm, setEditForm] = useState<UpdateTrackerPayload>({
    label: "",
    notes: "",
    status: "inactive",
    settings: {
      reporting_interval_sec: 15,
      allow_background_tracking: true,
    },
  });
  
  // Form loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load trackers
  const loadTrackers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await VehicleTrackerService.getAllTrackers();
      setTrackers(data);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to load vehicle trackers";
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTrackers();
  }, [loadTrackers]);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Create tracker
  const handleCreateTracker = async () => {
    if (!createForm.device_id || !createForm.label) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await VehicleTrackerService.createTracker(createForm);
      showSnackbar("Tracker created successfully", "success");
      setIsCreateModalOpen(false);
      resetCreateForm();
      loadTrackers();
    } catch (err: any) {
      showSnackbar(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

//   Update tracker
  const handleUpdateTracker = async () => {
    if (!selectedTracker) return;
    if (!editForm.label) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await VehicleTrackerService.updateTracker(selectedTracker._id, editForm);
      showSnackbar("Tracker updated successfully", "success");
      setIsEditModalOpen(false);
      loadTrackers();
    } catch (err: any) {
      showSnackbar(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

 

  // Delete tracker
  const handleDeleteTracker = async () => {
    if (!selectedTracker) return;

    try {
      setIsSubmitting(true);
      await VehicleTrackerService.deleteTracker(selectedTracker._id);
      showSnackbar("Tracker deleted successfully", "success");
      setIsDeleteModalOpen(false);
      loadTrackers();
    } catch (err: any) {
      showSnackbar(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open view modal
  const openViewModal = (tracker: VehicleTracker) => {
    setSelectedTracker(tracker);
    setIsViewModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (tracker: VehicleTracker) => {
    setSelectedTracker(tracker);
    setEditForm({
      label: tracker.label,
      notes: tracker.notes,
      status: tracker.status,
      settings: { ...tracker.settings },
    });
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (tracker: VehicleTracker) => {
    setSelectedTracker(tracker);
    setIsDeleteModalOpen(true);
  };

  // Reset create form
  const resetCreateForm = () => {
    setCreateForm({
      device_id: "",
      label: "",
      notes: "",
    });
  };

  // Fetch available vehicles for attachment
const fetchAvailableVehicles = async () => {
  try {
    setLoadingVehicles(true);
    const response = await fetchVehicleUnits(1, 100);
    const vehicles = response.data.items || [];
    setAvailableVehicles(vehicles);
  } catch (err) {
    console.error("Failed to fetch vehicles:", err);
    showSnackbar("Failed to load vehicles", "error");
  } finally {
    setLoadingVehicles(false);
  }
};

// Attach tracker to vehicle using the service
const handleAttachToVehicle = async () => {
  if (!selectedTracker || !selectedVehicleId) {
    showSnackbar("Please select a vehicle", "error");
    return;
  }

  try {
    setAttaching(true);
    const updatedTracker = await VehicleTrackerService.attachToVehicle(
      selectedTracker._id,
      selectedVehicleId
    );
    showSnackbar(`Tracker attached to vehicle successfully`, "success");
    setIsAttachModalOpen(false);
    setSelectedVehicleId("");
    await loadTrackers(); // Refresh the list
  } catch (err: any) {
    const errorMessage = err?.message || err || "Failed to attach tracker";
    showSnackbar(errorMessage, "error");
  } finally {
    setAttaching(false);
  }
};

// Detach tracker from vehicle using the service


// Open attach modal
const openAttachModal = (tracker: VehicleTracker) => {
  setSelectedTracker(tracker);
  setSelectedVehicleId("");
  fetchAvailableVehicles();
  setIsAttachModalOpen(true);
};

// Detach tracker from vehicle with reason
const handleDetachWithReason = async () => {
  if (!selectedTracker) return;

  try {
    setDetaching(true);
    const updatedTracker = await VehicleTrackerService.detachFromVehicle(
      selectedTracker._id,
      detachReason || "Manually detached by admin"
    );
    showSnackbar(`Tracker detached from vehicle successfully`, "success");
    setIsDetachModalOpen(false);
    setDetachReason("");
    await loadTrackers(); // Refresh the list
  } catch (err: any) {
    const errorMessage = err?.message || err || "Failed to detach tracker";
    showSnackbar(errorMessage, "error");
  } finally {
    setDetaching(false);
  }
};

// Open detach modal
const openDetachModal = (tracker: VehicleTracker) => {
  setSelectedTracker(tracker);
  setDetachReason("");
  setIsDetachModalOpen(true);
};

  // Filter trackers
  const filteredTrackers = trackers.filter((tracker) => {
    const matchesSearch =
      searchTerm === "" ||
      tracker.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tracker.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tracker.notes || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || tracker.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { text: "ACTIVE", color: "bg-green-100 text-green-800", icon: Circle };
      case "inactive":
        return { text: "INACTIVE", color: "bg-red-100 text-red-800", icon: XCircle };
      default:
        return { text: "UNKNOWN", color: "bg-gray-100 text-gray-800", icon: AlertCircle };
    }
  };

  // Format date
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
                <h1 className="text-2xl font-bold text-gray-800">Vehicle Trackers</h1>
                <p className="text-sm text-gray-600 mt-1">Manage all vehicle tracking devices</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold">{trackers.length}</span> trackers
              </div>
              <button
                onClick={loadTrackers}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Add Tracker</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Trackers</p>
                    <p className="text-2xl font-bold text-gray-800">{trackers.length}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <MapPin className="w-6 h-6 text-[#1EA2E4]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Trackers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {trackers.filter(t => t.status === "active").length}
                    </p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Activity className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Inactive Trackers</p>
                    <p className="text-2xl font-bold text-red-600">
                      {trackers.filter(t => t.status === "inactive").length}
                    </p>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <WifiOff className="w-6 h-6 text-red-500" />
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
                      placeholder="Search by device ID, label, or notes..."
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
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Trackers Grid - Cards */}
            <div>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                    <p className="text-gray-600">Loading trackers...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                  <p className="text-red-600 text-center mb-4">{error}</p>
                  <button
                    onClick={loadTrackers}
                    className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              ) : filteredTrackers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <MapPin className="w-20 h-20 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No trackers found</p>
                  <p className="text-gray-400 text-center">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your filters or search terms"
                      : "Click 'Add Tracker' to create your first tracker"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTrackers.map((tracker) => {
                    const statusBadge = getStatusBadge(tracker.status);
                    const StatusIcon = statusBadge.icon;

                    return (
                      <div
                        key={tracker._id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                      >
                        {/* Card Header */}
                        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-5 h-5 text-[#1EA2E4]" />
                                <h3 className="font-semibold text-gray-900">{tracker.label}</h3>
                              </div>
                              <p className="text-xs text-gray-500 font-mono">{tracker.device_id}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusBadge.text}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3 flex-1">
                          {/* Notes */}
                          {tracker.notes && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-600">{tracker.notes}</p>
                              </div>
                            </div>
                          )}

                          {/* Details */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                Vehicle
                              </span>
                              <span className="text-sm font-medium text-gray-700">
                                 {tracker.vehicle_id 
                                
                                ? 
                                `ID: ${tracker.vehicle_id.slice(0, 8)}...`
                                : "Not assigned"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                Branch
                              </span>
                              <span className="text-sm font-medium text-gray-700">
                                {tracker.branch_id ? `ID: ${tracker.branch_id.slice(0, 8)}...` : "Not assigned" }
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Reporting Interval
                              </span>
                              <span className="text-sm font-medium text-gray-700">
                                {tracker.settings.reporting_interval_sec}s
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Created
                              </span>
                              <span className="text-sm text-gray-700">{formatDateTime(tracker.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer - Buttons at the bottom */}
                        <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openViewModal(tracker)}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                              
                            </button>
                            <button
                              onClick={() => openEditModal(tracker)}
                              className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                             title="Edit Tracker">
                              <Edit className="w-4 h-4" />
                              
                            </button>
                             {!tracker.vehicle_id ? (
                                <button
                                    onClick={() => openAttachModal(tracker)}
                                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                    title="Attach to Vehicle"
                                >
                                    <Car className="w-4 h-4" />
                                </button>
                                ) : (
                                <button
                                     onClick={() => openDetachModal(tracker)}
                                    className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                    title="Detach from Vehicle"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                                )}
                             <button
                              onClick={() => openDeleteModal(tracker)}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            title="Delete Tracker">
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* Create Tracker Modal (Side Modal) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative bg-white shadow-2xl w-full max-w-md h-full overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Create New Tracker</h2>
                <p className="text-sm text-gray-600">Add a new vehicle tracking device</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(100vh - 70px)" }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.device_id}
                    onChange={(e) => setCreateForm({ ...createForm, device_id: e.target.value })}
                    placeholder="e.g., TRACKER-005"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.label}
                    onChange={(e) => setCreateForm({ ...createForm, label: e.target.value })}
                    placeholder="e.g., Harare CBD Tracker 2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    placeholder="Additional information about the tracker..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTracker}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create Tracker
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tracker Modal (Side Modal) */}
      {isEditModalOpen && selectedTracker && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="relative bg-white shadow-2xl w-full max-w-md h-full overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Edit Tracker</h2>
                <p className="text-sm text-gray-600 font-mono">{selectedTracker.device_id}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(100vh - 70px)" }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reporting Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={editForm.settings?.reporting_interval_sec || 15}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      settings: { 
                        ...editForm.settings, 
                        reporting_interval_sec: parseInt(e.target.value) || 15 
                      } 
                    })}
                    min={1}
                    max={3600}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allow_background_tracking"
                    checked={editForm.settings?.allow_background_tracking || false}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      settings: { 
                        ...editForm.settings, 
                        allow_background_tracking: e.target.checked 
                      } 
                    })}
                    className="w-4 h-4 text-[#1EA2E4] rounded border-gray-300 focus:ring-[#1EA2E4]"
                  />
                  <label htmlFor="allow_background_tracking" className="text-sm font-medium text-gray-700">
                    Allow Background Tracking
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes || ""}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTracker}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Tracker
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Tracker Details Modal (Centered Modal) */}
      {isViewModalOpen && selectedTracker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Tracker Details</h2>
                <p className="text-sm text-gray-600 font-mono">{selectedTracker.device_id}</p>
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
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Device ID</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{selectedTracker.device_id}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Label</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedTracker.label}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Status</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusBadge(selectedTracker.status).color}`}>
                        {getStatusBadge(selectedTracker.status).text}
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Vehicle</p>
                      <p className="text-sm font-medium">{`${selectedTracker.vehicle_id?.slice(0,8)}...` || "Not assigned"}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Branch</p>
                      <p className="text-sm font-medium">{`${selectedTracker.branch_id?.slice(0,8)}...` || "Not assigned"}</p>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Tracker Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Reporting Interval</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedTracker.settings.reporting_interval_sec} seconds
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Background Tracking</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedTracker.settings.allow_background_tracking ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedTracker.notes && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                      Notes
                    </h4>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700">{selectedTracker.notes}</p>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Timeline
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Created At</p>
                      <p className="text-sm font-medium">{formatDateTime(selectedTracker.created_at)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="text-sm font-medium">{formatDateTime(selectedTracker.updated_at)}</p>
                    </div>
                    {selectedTracker.last_seen_at && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Last Seen</p>
                        <p className="text-sm font-medium">{formatDateTime(selectedTracker.last_seen_at)}</p>
                      </div>
                    )}
                    {selectedTracker.attached_at && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Attached At</p>
                        <p className="text-sm font-medium">{formatDateTime(selectedTracker.attached_at)}</p>
                      </div>
                    )}
                    {selectedTracker.detached_at && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Detached At</p>
                        <p className="text-sm font-medium">{formatDateTime(selectedTracker.detached_at)}</p>
                        {selectedTracker.detach_reason && (
                          <p className="text-xs text-gray-500 mt-2">Reason: {selectedTracker.detach_reason}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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

      {/* Delete Confirmation Modal (Popup Modal) */}
      {isDeleteModalOpen && selectedTracker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
                Delete Tracker
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete tracker "{selectedTracker.label}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTracker}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attach to Vehicle Modal */}
{isAttachModalOpen && selectedTracker && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={() => setIsAttachModalOpen(false)}
    />
    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Attach Tracker to Vehicle</h3>
            <p className="text-sm text-gray-600">
              Tracker: <span className="font-mono">{selectedTracker.device_id}</span> - {selectedTracker.label}
            </p>
          </div>
          <button
            onClick={() => setIsAttachModalOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Vehicle *
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
              disabled={loadingVehicles}
            >
              <option value="">-- Select a vehicle --</option>
              {availableVehicles.map((vehicle) => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.plate_number} - {vehicle.vin} ({vehicle.color || 'No color'})
                </option>
              ))}
            </select>
            {loadingVehicles && (
              <p className="text-xs text-gray-500 mt-1">Loading vehicles...</p>
            )}
            {availableVehicles.length === 0 && !loadingVehicles && (
              <p className="text-xs text-red-500 mt-1">No vehicles available. Please add vehicles first.</p>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Attaching this tracker will associate it with the selected vehicle.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setIsAttachModalOpen(false)}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAttachToVehicle}
            disabled={!selectedVehicleId || attaching}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {attaching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Attaching...
              </>
            ) : (
              <>
                <Car className="w-4 h-4" />
                Attach to Vehicle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    {/* Detach from Vehicle Modal with Reason */}
{isDetachModalOpen && selectedTracker && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={() => {
        setIsDetachModalOpen(false);
        setDetachReason("");
      }}
    />
    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Detach Tracker from Vehicle</h3>
            <p className="text-sm text-gray-600">
              Tracker: <span className="font-mono">{selectedTracker.device_id}</span> - {selectedTracker.label}
            </p>
           
          </div>
          <button
            onClick={() => {
              setIsDetachModalOpen(false);
              setDetachReason("");
            }}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detach Reason <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <textarea
              value={detachReason}
              onChange={(e) => setDetachReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent resize-none"
              placeholder="e.g., Tracker malfunction, Vehicle sold, Maintenance, etc."
            />
            <p className="text-xs text-gray-500 mt-1">
              {detachReason.length}/500 characters
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <strong>Warning:</strong> Detaching this tracker will remove its association with the current vehicle. The tracker will be marked as inactive.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              setIsDetachModalOpen(false);
              setDetachReason("");
            }}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDetachWithReason}
            disabled={detaching}
            className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {detaching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Detaching...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Detach Tracker
              </>
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

export default VehicleTrackersScreen;