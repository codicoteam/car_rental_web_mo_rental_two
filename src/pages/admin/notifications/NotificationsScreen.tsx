import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../../components/Sidebar";
import NotificationsService, {
  type Notification,
  type NotificationType,
  type NotificationPriority,
  type NotificationStatus,
  type NotificationsQueryParams,
  type AudienceScope,
  type Audience,
  type CreateNotificationPayload,
} from "../../../Services/adminAndManager/notifications_service";
import {
  fetchAllUsers,
  type IUser
 
} from "../../../Services/adminAndManager/admi_users_service";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../../app/store";
import { fetchReservations } from "../../../features/reservation/reservationthunks";

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
  Bell,
  Mail,
  Users,
  User,
  Calendar,
  Clock,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Globe,
  AlertTriangle,
  Info,
  CreditCard,
  Target,
  Calendar as CalendarIcon,
  Zap,
  Ban,
  Check,
  DollarSign,
  Car,
} from "lucide-react";

const AdminNotificationsScreen: React.FC = () => {
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  // User state for dropdown
const [users, setUsers] = useState<IUser[]>([]);
const [loadingUsers, setLoadingUsers] = useState(false);
const [userSearchTerm, setUserSearchTerm] = useState("");
const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Modal states
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Reservation state
const dispatch = useDispatch<AppDispatch>();
const [reservations, setReservations] = useState<any[]>([]);
const [loadingReservations, setLoadingReservations] = useState(false);
const [showReservationDropdown, setShowReservationDropdown] = useState(false);
const [reservationSearchTerm, setReservationSearchTerm] = useState("");
const [selectedReservationData, setSelectedReservationData] = useState<any>(null);
const [isCreating, setIsCreating] = useState(false);
const [isUpdating, setIsUpdating] = useState(false);
const [isDeleting , setIsDeleting] = useState(false);
// Schedule modal states
const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
const [selectedScheduleNotification, setSelectedScheduleNotification] = useState<Notification | null>(null);
const [scheduleDateTime, setScheduleDateTime] = useState("");
const [isScheduling, setIsScheduling] = useState(false);
const [scheduleId, setScheduleId] = useState<string | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState<CreateNotificationPayload>({
    title: "",
    message: "",
    type: "info",
    priority: "normal",
    audience: {
      scope: "all",
      user_id: null,
      roles: [],
    },
    channels: ["in_app"],
    send_at: null,
    expires_at: null,
    action_text: null,
    action_url: null,
    data: {},
  });

  // Audience options
  const audienceScopes: AudienceScope[] = ["all", "user", "role"];
  const notificationTypes: NotificationType[] = ["info", "payment", "alert", "reminder"];
  const notificationPriorities: NotificationPriority[] = ["low", "normal", "high", "urgent"];
  const notificationStatuses: NotificationStatus[] = ["draft", "scheduled", "sent", "cancelled"];
  const availableRoles = ["customer", "manager", "admin", "driver"];

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Fetch users for dropdown
const fetchUsers = useCallback(async () => {
  try {
    setLoadingUsers(true);
    const response = await fetchAllUsers(1, 50, userSearchTerm);
    setUsers(response.data.users);
  } catch (err) {
    console.error("Failed to fetch users:", err);
  } finally {
    setLoadingUsers(false);
  }
}, [userSearchTerm]);

// Fetch reservations from Redux store
useEffect(() => {
  const fetchReservationsData = async () => {
    try {
      setLoadingReservations(true);
      await dispatch(fetchReservations());
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
    } finally {
      setLoadingReservations(false);
    }
  };
  
  if (showReservationDropdown) {
    fetchReservationsData();
  }
}, [dispatch, showReservationDropdown]);

// Get reservations from Redux store
const apiReservations = useSelector((state: any) => state.reservations?.reservations);
const reservationsList: any[] = apiReservations?.data || [];

// Filter reservations based on search
const filteredReservations = reservationsList.filter((res: any) => {
  const search = reservationSearchTerm.toLowerCase();
  return (
    res.code?.toLowerCase().includes(search) ||
    res.driver_snapshot?.full_name?.toLowerCase().includes(search) ||
    res.vehicle_model_id?.make?.toLowerCase().includes(search) ||
    res.vehicle_model_id?.model?.toLowerCase().includes(search)
  );
});

// Load users when dropdown is opened or search changes
useEffect(() => {
  if (showUserDropdown) {
    fetchUsers();
  }
}, [showUserDropdown, userSearchTerm, fetchUsers]);

  

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: NotificationsQueryParams = {
        page: currentPage,
        limit: itemsPerPage,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter as NotificationStatus;
      if (typeFilter !== "all") params.type = typeFilter as NotificationType;
      if (priorityFilter !== "all") params.priority = priorityFilter as NotificationPriority;
      
      const response = await NotificationsService.getAllNotifications(params);
      setNotifications(response.items);
      setTotalItems(response.total || response.items.length);
      setTotalPages(Math.ceil((response.total || response.items.length) / itemsPerPage));
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError(err instanceof Error ? err.message : "Failed to load notifications");
      showSnackbar("Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, typeFilter, priorityFilter]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, priorityFilter]);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Reset form
 const resetForm = () => {
  setFormData({
    title: "",
    message: "",
    type: "info",
    priority: "normal",
    audience: {
      scope: "all",
      user_id: null,
      roles: [],
    },
    channels: ["in_app"],
   
    expires_at: null,
    action_text: null,
    action_url: null,
    data: {},
    acknowledgements: [],
  });
};

  // Open add modal
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  

  // Open view modal
  const openViewModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewModalOpen(true);
  };

  const openEditModal = (notification: Notification) => {
  setSelectedNotification(notification);
  setFormData({
    title: notification.title,
    message: notification.message,
    type: notification.type,
    priority: notification.priority,
    audience: notification.audience,
    channels: notification.channels,
    expires_at: notification.expires_at,
    action_text: notification.action_text,
    action_url: notification.action_url,
    data: notification.data || {},
    acknowledgements: notification.acknowledgements || [],
  });
  
  // Set selected reservation data if exists
  if (notification.data?.reservation_id) {
    setSelectedReservationData({
      _id: notification.data.reservation_id,
      code: notification.data.reservation_code,
      customerName: notification.data.customer_name,
      amount: notification.data.amount
    });
  } else {
    setSelectedReservationData(null);
  }
  
  setIsEditModalOpen(true);
};

  // Handle create notification
 const handleCreateNotification = async () => {
  if (!formData.title || !formData.message) {
    showSnackbar("Please fill in all required fields", "error");
    return;
  }
   setIsCreating(true)

  try {
    const payload = {
      ...formData,
  
      acknowledgements: formData.audience.scope === "user" && formData.audience.user_id ? [
        {
          user_id: formData.audience.user_id,
          read_at: null,
          acted_at: null,
          action: null
        }
      ] : [],
    };
    
    await NotificationsService.createNotification(payload);
    showSnackbar("Notification created successfully", "success");
    setIsAddModalOpen(false);
    resetForm();
    loadNotifications();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to create notification";
    showSnackbar(errorMessage, "error");
  }
  finally{
     setIsCreating(false);
  }
};

  // Handle update notification
  const handleUpdateNotification = async () => {
    if (!selectedNotification) return;
     setIsUpdating(true);

    try {
      await NotificationsService.updateNotification(selectedNotification._id, formData);
      showSnackbar("Notification updated successfully", "success");
      setIsEditModalOpen(false);
      setSelectedNotification(null);
      loadNotifications();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update notification";
      showSnackbar(errorMessage, "error");
    }
    finally{
        setIsUpdating(false);
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return;
    setIsDeleting(true);
    try {
      await NotificationsService.deleteNotification(notificationToDelete);
      showSnackbar("Notification deleted successfully", "success");
      setNotificationToDelete(null);
      loadNotifications();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete notification";
      showSnackbar(errorMessage, "error");
    }
    finally{
      setIsDeleting(false);
    }
  };

  // Handle send notification now
  const handleSendNow = async (id: string) => {
    setSendingId(id);
    try {
      await NotificationsService.sendNotificationNow(id);
      showSnackbar("Notification sent successfully", "success");
      loadNotifications();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send notification";
      showSnackbar(errorMessage, "error");
    } finally {
      setSendingId(null);
    }
  };
  // Handle cancel scheduled notification
const handleCancelNotification = async (id: string) => {
  setCancellingId(id);
  try {
    await NotificationsService.cancelNotification(id);
    showSnackbar("Notification cancelled successfully", "success");
    loadNotifications();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to cancel notification";
    showSnackbar(errorMessage, "error");
  } finally {
    setCancellingId(null);
  }
};

 // Handle schedule notification
const handleScheduleNotification = async () => {
  if (!selectedScheduleNotification || !scheduleDateTime) {
    showSnackbar("Please select a date and time", "error");
    return;
  }

  setScheduleId(selectedScheduleNotification._id);
  setIsScheduling(true);
  
  try {
    const sendAtDate = new Date(scheduleDateTime).toISOString();
    await NotificationsService.scheduleNotification(selectedScheduleNotification._id, sendAtDate);
    showSnackbar("Notification scheduled successfully", "success");
    setIsScheduleModalOpen(false);
    setSelectedScheduleNotification(null);
    setScheduleDateTime("");
    loadNotifications();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to schedule notification";
    showSnackbar(errorMessage, "error");
  } finally {
    setScheduleId(null);
    setIsScheduling(false);
  }
};

// Open schedule modal
const openScheduleModal = (notification: Notification) => {
  setSelectedScheduleNotification(notification);
  setScheduleDateTime("");
  setIsScheduleModalOpen(true);
};

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge color
  const getStatusColor = (status: NotificationStatus) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-yellow-100 text-yellow-800",
      sent: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Get type badge color
  const getTypeColor = (type: NotificationType) => {
    const colors = {
      info: "bg-blue-100 text-blue-800",
      payment: "bg-green-100 text-green-800",
      alert: "bg-red-100 text-red-800",
      reminder: "bg-purple-100 text-purple-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  // Get priority badge color
  const getPriorityColor = (priority: NotificationPriority) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      normal: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  // Get type icon
  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "info": return <Info className="w-4 h-4" />;
      case "payment": return <CreditCard className="w-4 h-4" />;
      case "alert": return <AlertTriangle className="w-4 h-4" />;
      case "reminder": return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  // Get audience display text
  const getAudienceDisplay = (audience: Audience) => {
    if (audience.scope === "all") return "All Users";
    if (audience.scope === "user") return `User: ${typeof audience.user_id === 'object' ? audience.user_id?.email : audience.user_id || "Specific User"}`;
    if (audience.scope === "role") return `Role: ${audience.roles?.join(", ")}`;
    return "Unknown";
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
                <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                <p className="text-sm text-gray-600 mt-1">Manage system notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold">{totalItems}</span> notifications
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Create Notification</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Filters & Search */}
          <div className="p-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search notifications by title or message..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Filter Button */}
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

                {/* Refresh Button */}
                <button
                  onClick={loadNotifications}
                  className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]"
                      >
                        <option value="all">All Statuses</option>
                        {notificationStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]"
                      >
                        <option value="all">All Types</option>
                        {notificationTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]"
                      >
                        <option value="all">All Priorities</option>
                        {notificationPriorities.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setStatusFilter("all");
                        setTypeFilter("all");
                        setPriorityFilter("all");
                        setSearchTerm("");
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notifications Cards Grid */}
          <div className="px-6 pb-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                  <p className="text-gray-600">Loading notifications...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-red-600 text-center mb-4">{error}</p>
                <button
                  onClick={loadNotifications}
                  className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <Bell className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No notifications found</p>
                <p className="text-gray-400 text-center mb-6">
                  {searchTerm || statusFilter !== "all" || typeFilter !== "all" || priorityFilter !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "Get started by creating your first notification"}
                </p>
                {!searchTerm && statusFilter === "all" && typeFilter === "all" && priorityFilter === "all" && (
                  <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                  >
                    Create Notification
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
                    >
                      {/* Card Header */}
                      <div className="p-5 pb-3 border-b border-gray-100">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                              {getTypeIcon(notification.type)}
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                              {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                            </span>
                          </div>
                          {notification.priority && notification.priority !== "normal" && (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(notification.priority)}`}>
                              {notification.priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{notification.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 space-y-3 flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {notification.audience.scope === "all" ? (
                            <Globe className="w-4 h-4" />
                          ) : notification.audience.scope === "user" ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Users className="w-4 h-4" />
                          )}
                          <span className="truncate">{getAudienceDisplay(notification.audience)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{notification.send_at ? formatDate(notification.send_at) : "Send Now"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>Created: {formatDate(notification.created_at)}</span>
                        </div>
                        {notification.channels && notification.channels.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {notification.channels.map((channel) => (
                              <span key={channel} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {channel === "in_app" ? <Bell className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                                {channel}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openViewModal(notification)}
                            className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {notification.status !== "cancelled" && notification.status !== "sent" && (
                              <button
                                onClick={() => openEditModal(notification)}
                                className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                             {notification.status === "draft" && (
                              <button
                                onClick={() => openScheduleModal(notification)}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                                title="Schedule"
                              >
                                <CalendarIcon className="w-4 h-4" />
                                
                              </button>
                            )}
                         
                          <button
                            onClick={() => setNotificationToDelete(notification._id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                          {(notification.status === "scheduled" || notification.status === "draft") && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSendNow(notification._id)}
                                disabled={sendingId === notification._id}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Send Now">
                                {sendingId === notification._id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent" ></div>
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                                
                              </button>
                              <button
                                onClick={() => handleCancelNotification(notification._id)}
                                disabled={cancellingId === notification._id}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Cancel">
                                {cancellingId === notification._id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent"></div>
                                ) : (
                                  <Ban className="w-4 h-4" />
                                )}
                                
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8 px-4 py-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* View Notification Modal */}
      {isViewModalOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Notification Details</h2>
                <p className="text-sm text-gray-600">View notification information</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedNotification);
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

            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 80px)" }}>
              <div className="space-y-6">
                {/* Title and Status */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedNotification.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedNotification.type)}`}>
                        {getTypeIcon(selectedNotification.type)}
                        {selectedNotification.type}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedNotification.status)}`}>
                        {selectedNotification.status}
                      </span>
                      {selectedNotification.priority && selectedNotification.priority !== "normal" && (
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedNotification.priority)}`}>
                          {selectedNotification.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Message</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>

                {/* Audience */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Audience</h4>
                  <div className="flex items-center gap-2">
                    {selectedNotification.audience.scope === "all" ? (
                      <Globe className="w-5 h-5 text-gray-400" />
                    ) : selectedNotification.audience.scope === "user" ? (
                      <User className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Users className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="text-gray-700">{getAudienceDisplay(selectedNotification.audience)}</span>
                  </div>
                  {selectedNotification.audience.roles && selectedNotification.audience.roles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedNotification.audience.roles.map((role) => (
                        <span key={role} className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Channels */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Channels</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNotification.channels.map((channel) => (
                      <span key={channel} className="flex items-center gap-1 px-2 py-1 text-sm bg-white rounded-lg border border-gray-200">
                        {channel === "in_app" ? <Bell className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Send Schedule</h4>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedNotification.send_at ? formatDate(selectedNotification.send_at) : "Send immediately"}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Expires</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedNotification.expires_at ? formatDate(selectedNotification.expires_at) : "No expiration"}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                {selectedNotification.action_text && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Action</h4>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{selectedNotification.action_text}</span>
                      {selectedNotification.action_url && (
                        <a href={selectedNotification.action_url} target="_blank" rel="noopener noreferrer" className="text-[#1EA2E4] hover:underline text-sm">
                          {selectedNotification.action_url}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Meta Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Meta Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Notification ID</p>
                      <p className="text-xs font-mono text-gray-600 break-all">{selectedNotification._id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Created By</p>
                        <p className="text-sm text-gray-700">{selectedNotification.created_by?.full_name || selectedNotification.created_by?.email || "System"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Created At</p>
                        <p className="text-sm text-gray-700">{formatDate(selectedNotification.created_at)}</p>
                      </div>
                    </div>
                    {selectedNotification.acknowledgements && selectedNotification.acknowledgements.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Acknowledgements ({selectedNotification.acknowledgements.length})</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {selectedNotification.acknowledgements.map((ack, idx) => (
                            <div key={idx} className="text-xs text-gray-600">
                              {typeof ack.user_id === 'object' ? ack.user_id?.full_name || ack.user_id?.email : ack.user_id}
                              {ack.read_at && ` - Read: ${formatDate(ack.read_at)}`}
                            </div>
                          ))}
                        </div>
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

      {/* Add/Edit Notification Modal - You'll need to add this back from your original code */}
      {/* Add Notification Side Modal */}
{isAddModalOpen && (
  <>
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40"
      onClick={() => {
        setIsAddModalOpen(false);
        resetForm();
      }}
    />
    <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Create Notification</h2>
            <p className="text-sm text-gray-600">Send important updates to users</p>
          </div>
          <button
            onClick={() => {
              setIsAddModalOpen(false);
              resetForm();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter notification title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                placeholder="Enter notification message"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent resize-none"
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]"
                >
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as NotificationPriority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]"
                >
                  {notificationPriorities.map((priority) => (
                    <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audience Scope */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
              <select
                value={formData.audience.scope}
                onChange={(e) => {
                  const scope = e.target.value as AudienceScope;
                  setFormData({
                    ...formData,
                    audience: { scope, user_id: null, roles: [] }
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]"
              >
                <option value="all">All Users</option>
                <option value="user">Specific User</option>
                <option value="role">Specific Role(s)</option>
              </select>
            </div>

        

            {/* User ID */}
{formData.audience.scope === "user" && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
    <div className="relative">
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent cursor-pointer bg-white flex justify-between items-center"
        onClick={() => setShowUserDropdown(!showUserDropdown)}
      >
        <span className={formData.audience.user_id ? "text-gray-900" : "text-gray-400"}>
          {(() => {
            if (!formData.audience.user_id) return "Select a user";
            const userId = typeof formData.audience.user_id === 'object' 
              ? formData.audience.user_id._id 
              : formData.audience.user_id;
            const selectedUser = users.find(u => u._id === userId);
            return selectedUser ? `${selectedUser.full_name} (${selectedUser.email})` : userId;
          })()}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
      
      {showUserDropdown && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          {/* Users list */}
          <div className="overflow-y-auto max-h-60">
            {loadingUsers ? (
              <div className="p-3 text-center text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1EA2E4] mx-auto"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="p-3 text-center text-gray-500">No users found</div>
            ) : (
              users.map((user) => (
                <div
                  key={user._id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      audience: { ...formData.audience, user_id: user._id }
                    });
                    setShowUserDropdown(false);
                    setUserSearchTerm("");
                  }}
                >
                  <div className="font-medium text-gray-900">{user.full_name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400 capitalize">Role: {user.roles?.join(", ") || "N/A"}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
    {formData.audience.user_id && (
      <div className="mt-1 text-xs text-gray-500">
        Selected User ID: {typeof formData.audience.user_id === 'object' 
          ? formData.audience.user_id._id 
          : formData.audience.user_id}
      </div>
    )}
  </div>
)}
           

            {/* Roles */}
            {formData.audience.scope === "role" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                <div className="flex flex-wrap gap-3 p-3 border border-gray-300 rounded-lg">
                  {availableRoles.map((role) => (
                    <label key={role} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.audience.roles?.includes(role) || false}
                        onChange={(e) => {
                          const roles = formData.audience.roles || [];
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              audience: { ...formData.audience, roles: [...roles, role] }
                            });
                          } else {
                            setFormData({
                              ...formData,
                              audience: { ...formData.audience, roles: roles.filter(r => r !== role) }
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-[#1EA2E4] focus:ring-[#1EA2E4]"
                      />
                      <span className="text-sm text-gray-700">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channels</label>
              <div className="flex gap-4 p-3 border border-gray-300 rounded-lg">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.channels?.includes("in_app") || false}
                    onChange={(e) => {
                      const channels = formData.channels || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, channels: [...channels, "in_app"] });
                      } else {
                        setFormData({ ...formData, channels: channels.filter(c => c !== "in_app") });
                      }
                    }}
                    className="rounded border-gray-300 text-[#1EA2E4] focus:ring-[#1EA2E4]"
                  />
                  <Bell className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">In-App</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.channels?.includes("email") || false}
                    onChange={(e) => {
                      const channels = formData.channels || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, channels: [...channels, "email"] });
                      } else {
                        setFormData({ ...formData, channels: channels.filter(c => c !== "email") });
                      }
                    }}
                    className="rounded border-gray-300 text-[#1EA2E4] focus:ring-[#1EA2E4]"
                  />
                  <Mail className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Email</span>
                </label>
              </div>
            </div>

            {/* Expires At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
              <input
                type="datetime-local"
                value={formData.expires_at || ""}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]"
              />
            </div>

            {/* Action Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Text (Optional)</label>
              <input
                type="text"
                value={formData.action_text || ""}
                onChange={(e) => setFormData({ ...formData, action_text: e.target.value || null })}
                placeholder="e.g., View Details, Book Now"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]"
              />
            </div>

            {/* Action URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action URL (Optional)</label>
              <input
                type="url"
                value={formData.action_url || ""}
                onChange={(e) => setFormData({ ...formData, action_url: e.target.value || null })}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]"
              />
            </div>
          </div>
        {/* Reservation Section - Optional */}
<div className="border-t border-gray-200 pt-4 mt-2">
  <div className="flex items-center gap-2 mb-3">
    <Car className="w-4 h-4 text-[#1EA2E4]" />
    <label className="text-sm font-semibold text-gray-700">
      Reservation Details <span className="text-xs text-gray-500 font-normal">(Optional)</span>
    </label>
  </div>
  
  {/* Select Reservation */}
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">Select Reservation</label>
    <div className="relative">
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent cursor-pointer bg-white flex justify-between items-center"
        onClick={() => setShowReservationDropdown(!showReservationDropdown)}
      >
        <span className={selectedReservationData ? "text-gray-900" : "text-gray-400"}>
          {selectedReservationData 
            ? `${selectedReservationData.code} - ${selectedReservationData.customerName || selectedReservationData.driver_snapshot?.full_name}` 
            : "Select a reservation (optional)"}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
      
      {showReservationDropdown && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code, customer, or vehicle..."
                value={reservationSearchTerm}
                onChange={(e) => setReservationSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-60">
            {loadingReservations ? (
              <div className="p-3 text-center text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1EA2E4] mx-auto"></div>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="p-3 text-center text-gray-500">No reservations found</div>
            ) : (
              filteredReservations.map((res: any) => (
                <div
                  key={res._id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                  onClick={() => {
                    const totalAmount = res.pricing?.grand_total?.$numberDecimal || "0";
                    setSelectedReservationData({
                      _id: res._id,
                      code: res.code,
                      customerName: res.driver_snapshot?.full_name,
                      amount: parseFloat(totalAmount)
                    });
                    // Update formData.data with reservation info
                    setFormData({
                      ...formData,
                      data: {
                        ...formData.data,
                        reservation_id: res._id,
                        amount: totalAmount,
                        reservation_code: res.code,
                        customer_name: res.driver_snapshot?.full_name
                      }
                    });
                    setShowReservationDropdown(false);
                    setReservationSearchTerm("");
                  }}
                >
                  <div className="font-medium text-gray-900">{res.code}</div>
                  <div className="text-sm text-gray-600">{res.driver_snapshot?.full_name}</div>
                  <div className="text-xs text-gray-500">
                    {res.vehicle_model_id?.make} {res.vehicle_model_id?.model}
                  </div>
                  <div className="text-xs text-[#1EA2E4] font-medium mt-1">
                    Amount: ${parseFloat(res.pricing?.grand_total?.$numberDecimal || "0").toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  </div>
  
  {/* Amount Field - Auto-populated from selected reservation */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
    <div className="relative">
      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="number"
        step="0.01"
        value={(() => {
          const amount = formData.data?.amount || "";
          return amount;
        })()}
        onChange={(e) => {
          setFormData({
            ...formData,
            data: {
              ...formData.data,
              amount: e.target.value
            }
          });
        }}
        placeholder="0.00"
        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
      />
    </div>
    <p className="text-xs text-gray-500 mt-1">
      Amount will be auto-populated when you select a reservation
    </p>
  </div>
  
  {/* Clear Reservation Button */}
  {selectedReservationData && (
    <button
      type="button"
      onClick={() => {
        setSelectedReservationData(null);
        setFormData({
          ...formData,
          data: {
            ...formData.data,
            reservation_id: undefined,
            amount: undefined,
            reservation_code: undefined,
            customer_name: undefined
          }
        });
      }}
      className="text-xs text-red-600 hover:text-red-700 mt-2 flex items-center gap-1"
    >
      <X className="w-3 h-3" />
      Clear selected reservation
    </button>
  )}
</div>

        </div>
        

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={() => {
              setIsAddModalOpen(false);
              resetForm();
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateNotification}
            disabled={isCreating}
            className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Create Notification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </>
)}

{/* Edit Notification Side Modal */}
  {/* Edit Notification Side Modal */}
{isEditModalOpen && selectedNotification && (
  <>
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-40"
      onClick={() => {
        setIsEditModalOpen(false);
        resetForm();
      }}
    />
    <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Edit Notification</h2>
            <p className="text-sm text-gray-600">Modify notification details</p>
          </div>
          <button
            onClick={() => {
              setIsEditModalOpen(false);
              resetForm();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent resize-none"
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as NotificationType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as NotificationPriority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {notificationPriorities.map((priority) => (
                    <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audience Scope */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
              <select
                value={formData.audience.scope}
                onChange={(e) => {
                  const scope = e.target.value as AudienceScope;
                  setFormData({
                    ...formData,
                    audience: { scope, user_id: null, roles: [] }
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Users</option>
                <option value="user">Specific User</option>
                <option value="role">Specific Role(s)</option>
              </select>
            </div>

            {/* User ID Dropdown for Edit */}
            {formData.audience.scope === "user" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
                <div className="relative">
                  <div
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent cursor-pointer bg-white flex justify-between items-center"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <span className={formData.audience.user_id ? "text-gray-900" : "text-gray-400"}>
                      {(() => {
                        if (!formData.audience.user_id) return "Select a user";
                        const userId = typeof formData.audience.user_id === 'object' 
                          ? formData.audience.user_id._id 
                          : formData.audience.user_id;
                        const selectedUser = users.find(u => u._id === userId);
                        return selectedUser ? `${selectedUser.full_name} (${selectedUser.email})` : userId;
                      })()}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  {showUserDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      
                      <div className="overflow-y-auto max-h-60">
                        {loadingUsers ? (
                          <div className="p-3 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1EA2E4] mx-auto"></div>
                          </div>
                        ) : users.length === 0 ? (
                          <div className="p-3 text-center text-gray-500">No users found</div>
                        ) : (
                          users.map((user) => (
                            <div
                              key={user._id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  audience: { ...formData.audience, user_id: user._id }
                                });
                                setShowUserDropdown(false);
                                setUserSearchTerm("");
                              }}
                            >
                              <div className="font-medium text-gray-900">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              <div className="text-xs text-gray-400 capitalize">Role: {user.roles?.join(", ") || "N/A"}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {formData.audience.user_id && (
                  <div className="mt-1 text-xs text-gray-500">
                    Selected User ID: {typeof formData.audience.user_id === 'object' 
                      ? formData.audience.user_id._id 
                      : formData.audience.user_id}
                  </div>
                )}
              </div>
            )}

            {/* Roles */}
            {formData.audience.scope === "role" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                <div className="flex flex-wrap gap-3 p-3 border border-gray-300 rounded-lg">
                  {availableRoles.map((role) => (
                    <label key={role} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.audience.roles?.includes(role) || false}
                        onChange={(e) => {
                          const roles = formData.audience.roles || [];
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              audience: { ...formData.audience, roles: [...roles, role] }
                            });
                          } else {
                            setFormData({
                              ...formData,
                              audience: { ...formData.audience, roles: roles.filter(r => r !== role) }
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-[#1EA2E4] focus:ring-[#1EA2E4]"
                      />
                      <span className="text-sm text-gray-700">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Channels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channels</label>
              <div className="flex gap-4 p-3 border border-gray-300 rounded-lg">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.channels?.includes("in_app") || false}
                    onChange={(e) => {
                      const channels = formData.channels || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, channels: [...channels, "in_app"] });
                      } else {
                        setFormData({ ...formData, channels: channels.filter(c => c !== "in_app") });
                      }
                    }}
                  />
                  <Bell className="w-4 h-4" />
                  <span>In-App</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.channels?.includes("email") || false}
                    onChange={(e) => {
                      const channels = formData.channels || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, channels: [...channels, "email"] });
                      } else {
                        setFormData({ ...formData, channels: channels.filter(c => c !== "email") });
                      }
                    }}
                  />
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </label>
              </div>
            </div>

            {/* Expires At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
              <input
                type="datetime-local"
                value={formData.expires_at || ""}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Action Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Text (Optional)</label>
              <input
                type="text"
                value={formData.action_text || ""}
                onChange={(e) => setFormData({ ...formData, action_text: e.target.value || null })}
                placeholder="e.g., View Details"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Action URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action URL (Optional)</label>
              <input
                type="url"
                value={formData.action_url || ""}
                onChange={(e) => setFormData({ ...formData, action_url: e.target.value || null })}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Reservation Section for Edit */}
            <div className="border-t border-gray-200 pt-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <Car className="w-4 h-4 text-[#1EA2E4]" />
                <label className="text-sm font-semibold text-gray-700">
                  Reservation Details <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                </label>
              </div>
              
              {/* Select Reservation */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Reservation</label>
                <div className="relative">
                  <div
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent cursor-pointer bg-white flex justify-between items-center"
                    onClick={() => setShowReservationDropdown(!showReservationDropdown)}
                  >
                    <span className={selectedReservationData ? "text-gray-900" : "text-gray-400"}>
                      {selectedReservationData 
                        ? `${selectedReservationData.code} - ${selectedReservationData.customerName || selectedReservationData.driver_snapshot?.full_name}` 
                        : (formData.data?.reservation_code ? `${formData.data.reservation_code} - ${formData.data.customer_name || ""}` : "Select a reservation (optional)")}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  {showReservationDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search by code, customer, or vehicle..."
                            value={reservationSearchTerm}
                            onChange={(e) => setReservationSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      
                      <div className="overflow-y-auto max-h-60">
                        {loadingReservations ? (
                          <div className="p-3 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1EA2E4] mx-auto"></div>
                          </div>
                        ) : filteredReservations.length === 0 ? (
                          <div className="p-3 text-center text-gray-500">No reservations found</div>
                        ) : (
                          filteredReservations.map((res: any) => (
                            <div
                              key={res._id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                              onClick={() => {
                                const totalAmount = res.pricing?.grand_total?.$numberDecimal || "0";
                                setSelectedReservationData({
                                  _id: res._id,
                                  code: res.code,
                                  customerName: res.driver_snapshot?.full_name,
                                  amount: parseFloat(totalAmount)
                                });
                                setFormData({
                                  ...formData,
                                  data: {
                                    ...formData.data,
                                    reservation_id: res._id,
                                    amount: totalAmount,
                                    reservation_code: res.code,
                                    customer_name: res.driver_snapshot?.full_name
                                  }
                                });
                                setShowReservationDropdown(false);
                                setReservationSearchTerm("");
                              }}
                            >
                              <div className="font-medium text-gray-900">{res.code}</div>
                              <div className="text-sm text-gray-600">{res.driver_snapshot?.full_name}</div>
                              <div className="text-xs text-gray-500">
                                {res.vehicle_model_id?.make} {res.vehicle_model_id?.model}
                              </div>
                              <div className="text-xs text-[#1EA2E4] font-medium mt-1">
                                Amount: ${parseFloat(res.pricing?.grand_total?.$numberDecimal || "0").toLocaleString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Amount Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.data?.amount || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        data: {
                          ...formData.data,
                          amount: e.target.value
                        }
                      });
                    }}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Amount will be auto-populated when you select a reservation
                </p>
              </div>
              
              {/* Clear Reservation Button */}
              {(selectedReservationData || formData.data?.reservation_id) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReservationData(null);
                    setFormData({
                      ...formData,
                      data: {
                        ...formData.data,
                        reservation_id: undefined,
                        amount: undefined,
                        reservation_code: undefined,
                        customer_name: undefined
                      }
                    });
                  }}
                  className="text-xs text-red-600 hover:text-red-700 mt-2 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear selected reservation
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={() => {
              setIsEditModalOpen(false);
              resetForm();
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateNotification}
            disabled={isUpdating}
            className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Update Notification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </>
)}

 {/* Schedule Notification Modal */}
{isScheduleModalOpen && selectedScheduleNotification && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={() => !isScheduling && setIsScheduleModalOpen(false)}
    />
    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in duration-300">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4 animate-pulse">
            <CalendarIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Schedule Notification</h3>
            <p className="text-sm text-gray-600">
              Set date and time for: <span className="font-medium">{selectedScheduleNotification.title}</span>
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date & Time
          </label>
          <input
            type="datetime-local"
            value={scheduleDateTime}
            onChange={(e) => setScheduleDateTime(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
            disabled={isScheduling}
          />
          <p className="text-xs text-gray-500 mt-2">
            The notification will be sent at the specified date and time
          </p>
        </div>

        {/* Preview selected time */}
        {scheduleDateTime && (
          <div className="mb-4 p-3 bg-purple-50 rounded-lg animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-700">
                Scheduled for: {new Date(scheduleDateTime).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsScheduleModalOpen(false)}
            disabled={isScheduling}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleScheduleNotification}
            disabled={isScheduling || !scheduleDateTime}
            className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
          >
            {isScheduling && scheduleId === selectedScheduleNotification._id ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Scheduling...
              </>
            ) : (
              <>
                <CalendarIcon className="w-4 h-4" />
                Schedule Notification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
     
      {/* Delete Confirmation Modal */}
      {notificationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setNotificationToDelete(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Notification</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this notification? This will permanently remove it from the system.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setNotificationToDelete(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                 <button
                onClick={handleDeleteNotification}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Notification"
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

export default AdminNotificationsScreen;