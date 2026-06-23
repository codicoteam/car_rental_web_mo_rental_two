import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../../components/Sidebar";
import {
  fetchAllNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  scheduleNotification,
  sendNotification,
  cancelNotification,
  getErrorDisplay,
  type INotification,
  type NotificationType,
  type NotificationPriority,
  type NotificationStatus,
  type CreateNotificationPayload,
  type UpdateNotificationPayload,
  type IAudience,
  type IAcknowledgement,
} from "../../../Services/adminAndManager/notification_service";
import {
  fetchAllUsers,
  type IUser,
} from "../../../Services/chat_api";
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
  Bell,
  Send,
  Users,
  AlertTriangle,
  Info,
  Mail,
  MessageSquare,
  Globe,
  User,
  Shield,
  Target,
  Clock3,
  CalendarClock,
  Check,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Save,
  Tag,
  FileText,
  TrendingUp,
  Calendar as CalendarIcon,
  UserCog,
  UserCheck,
  AlertOctagon,
  BellRing,
  BellOff,
  Timer,
  TimerOff,
  Inbox,
  BellDot,
  Megaphone,
  Volume2,
  VolumeX,
  MailCheck,
  Smartphone,
  Tablet,
  Laptop,
  Download,
  Upload,
  Copy,
  Share2,
  BarChart3,
  PieChart,
  TrendingDown,
  ExternalLink,
  Link,
  Lock,
  Unlock,
  Archive,
  ArchiveRestore,
  FolderOpen,
  FolderClosed,
  Hash,
  Building,
  Car,
  CreditCard,
  ShoppingCart,
  Package,
  Wrench,
  ClipboardCheck,
  FileWarning,
  FileQuestion,
  Star,
  Award,
  Gift,
  DollarSign,
  Percent,
  TrendingUp as TrendingUpIcon,
} from "lucide-react";

const NotificationManagementScreen: React.FC = () => {
  // State
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  // Users for audience selection
  const [users, setUsers] = useState<IUser[]>([]);

  // Modal states
  const [selectedNotification, setSelectedNotification] = useState<INotification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusUpdateNotificationId, setStatusUpdateNotificationId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<NotificationStatus>("draft");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState<string>("");

  // Initial form state
  const initialFormData: CreateNotificationPayload = {
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
    status: "draft",
    is_active: true,
    action_text: null,
    action_url: null,
    data: {},
    acknowledgements: [],
    created_by: null,
  };

  // Form states
  const [formData, setFormData] = useState<CreateNotificationPayload>(initialFormData);
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["customer"]);
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAllNotifications();
      // Handle different response formats
      const notificationsData = response.items || response.data || [];
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      setError(errorDisplay.message || "Failed to load notifications");
      showSnackbar(errorDisplay.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      const usersData = await fetchAllUsers();
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Failed to load users:", err);
      showSnackbar("Failed to load users", "error");
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadNotifications();
    loadUsers();
  }, [loadNotifications, loadUsers]);

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
    setSelectedUsers([]);
    setSelectedRoles(["customer"]);
    setScheduleType("now");
    setScheduleDateTime("");
  };

  // Open add modal with empty form
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Open edit modal with notification data
  const openEditModal = (notification: INotification) => {
    setSelectedNotification(notification);
    
    // Parse audience data
    let selectedUserIds: string[] = [];
    let selectedRolesArray: string[] = [];
    
    if (notification.audience) {
      if (notification.audience.scope === "user" && notification.audience.user_id) {
        const userId = typeof notification.audience.user_id === 'string' 
          ? notification.audience.user_id 
          : notification.audience.user_id._id;
        selectedUserIds = [userId];
      } else if (notification.audience.scope === "roles" && notification.audience.roles) {
        selectedRolesArray = notification.audience.roles;
      }
    }
    
    // Find selected users
    const usersForForm = users.filter(user => selectedUserIds.includes(user._id));
    setSelectedUsers(usersForForm);
    setSelectedRoles(selectedRolesArray);
    
    // Set schedule type
    const isScheduled = notification.send_at && new Date(notification.send_at) > new Date();
    setScheduleType(isScheduled ? "later" : "now");
    setScheduleDateTime(notification.send_at || "");
    
    setFormData({
      title: notification.title || "",
      message: notification.message || "",
      type: notification.type || "info",
      priority: notification.priority || "normal",
      audience: notification.audience || {
        scope: "all",
        user_id: null,
        roles: [],
      },
      channels: notification.channels || ["in_app"],
      send_at: notification.send_at || null,
      expires_at: notification.expires_at || null,
      status: notification.status || "draft",
      is_active: notification.is_active !== false,
      action_text: notification.action_text || null,
      action_url: notification.action_url || null,
      data: notification.data || {},
      acknowledgements: notification.acknowledgements || [],
      created_by: notification.created_by || null,
    });
    
    setIsEditModalOpen(true);
  };

  // Open view modal
  const openViewModal = (notification: INotification) => {
    setSelectedNotification(notification);
    setIsViewModalOpen(true);
  };

  // Open status update modal
  const openStatusModal = (notification: INotification, newStatus: NotificationStatus) => {
    setSelectedNotification(notification);
    setStatusUpdateNotificationId(notification._id);
    setNewStatus(newStatus);
    setIsStatusModalOpen(true);
  };

  // Open schedule modal
  const openScheduleModal = (notification: INotification) => {
    setSelectedNotification(notification);
    setScheduleDateTime(notification.send_at || new Date().toISOString().slice(0, 16));
    setIsScheduleModalOpen(true);
  };

  // Handle audience scope change
  const handleAudienceScopeChange = (scope: "all" | "user" | "roles") => {
    setFormData(prev => ({
      ...prev,
      audience: {
        scope,
        user_id: scope === "user" && selectedUsers.length > 0 ? selectedUsers[0]._id : null,
        roles: scope === "roles" ? selectedRoles : [],
      },
    }));
  };

  // Handle user selection for audience
  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    const isSelected = selectedUsers.some(u => u._id === userId);
    let updatedUsers: IUser[];
    
    if (isSelected) {
      updatedUsers = selectedUsers.filter(u => u._id !== userId);
    } else {
      if (formData.audience?.scope === "user") {
        // For single user selection, replace the current selection
        updatedUsers = [user];
      } else {
        // For multiple user selection (if we support it)
        updatedUsers = [...selectedUsers, user];
      }
    }
    
    setSelectedUsers(updatedUsers);
    
    if (formData.audience?.scope === "user") {
      setFormData(prev => ({
        ...prev,
        audience: {
          scope: "user",
          user_id: updatedUsers.length > 0 ? updatedUsers[0]._id : null,
          roles: [],
        },
      }));
    }
  };

  // Handle role selection
  const handleRoleSelect = (role: string) => {
    const isSelected = selectedRoles.includes(role);
    let updatedRoles: string[];
    
    if (isSelected) {
      updatedRoles = selectedRoles.filter(r => r !== role);
    } else {
      updatedRoles = [...selectedRoles, role];
    }
    
    setSelectedRoles(updatedRoles);
    
    if (formData.audience?.scope === "roles") {
      setFormData(prev => ({
        ...prev,
        audience: {
          scope: "roles",
          user_id: null,
          roles: updatedRoles,
        },
      }));
    }
  };

  // Handle channel selection
  const handleChannelSelect = (channel: string) => {
    const currentChannels = formData.channels || [];
    const isSelected = currentChannels.includes(channel);
    let updatedChannels: string[];
    
    if (isSelected) {
      updatedChannels = currentChannels.filter(c => c !== channel);
    } else {
      updatedChannels = [...currentChannels, channel];
    }
    
    setFormData(prev => ({
      ...prev,
      channels: updatedChannels,
    }));
  };

  // Handle schedule type change
  const handleScheduleTypeChange = (type: "now" | "later") => {
    setScheduleType(type);
    if (type === "now") {
      setFormData(prev => ({ ...prev, send_at: null }));
    }
  };

  // Handle add notification
  const handleAddNotification = async () => {
    try {
      const payload: CreateNotificationPayload = {
        ...formData,
        send_at: scheduleType === "later" && scheduleDateTime 
          ? new Date(scheduleDateTime).toISOString()
          : null,
      };

      await createNotification(payload);
      showSnackbar("Notification created successfully", "success");
      setIsAddModalOpen(false);
      resetForm();
      loadNotifications();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle update notification
  const handleUpdateNotification = async () => {
    if (!selectedNotification) return;

    try {
      const payload: UpdateNotificationPayload = {
        ...formData,
        send_at: scheduleType === "later" && scheduleDateTime 
          ? new Date(scheduleDateTime).toISOString()
          : formData.send_at,
      };

      await updateNotification(selectedNotification._id, payload);
      showSnackbar("Notification updated successfully", "success");
      setIsEditModalOpen(false);
      setSelectedNotification(null);
      loadNotifications();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!statusUpdateNotificationId) return;

    try {
      const payload: UpdateNotificationPayload = {
        status: newStatus,
      };

      await updateNotification(statusUpdateNotificationId, payload);
      showSnackbar(`Notification status updated to ${newStatus}`, "success");
      setIsStatusModalOpen(false);
      setStatusUpdateNotificationId(null);
      loadNotifications();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle schedule notification
  const handleScheduleNotification = async () => {
    if (!selectedNotification || !scheduleDateTime) return;

    try {
      await scheduleNotification(selectedNotification._id, new Date(scheduleDateTime).toISOString());
      showSnackbar("Notification scheduled successfully", "success");
      setIsScheduleModalOpen(false);
      setSelectedNotification(null);
      loadNotifications();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle send notification now
  const handleSendNow = async (notificationId: string) => {
    try {
      await sendNotification(notificationId);
      showSnackbar("Notification sent successfully", "success");
      loadNotifications();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle cancel notification
  const handleCancelNotification = async (notificationId: string) => {
    try {
      await cancelNotification(notificationId);
      showSnackbar("Notification cancelled successfully", "success");
      loadNotifications();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      showSnackbar("Notification deleted successfully", "success");
      setNotificationToDelete(null);
      loadNotifications();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      searchTerm === "" ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification._id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = 
      typeFilter === "all" || notification.type === typeFilter;

    const matchesPriority = 
      priorityFilter === "all" || notification.priority === priorityFilter;

    const matchesStatus = 
      statusFilter === "all" || notification.status === statusFilter;

    const matchesAudience =
      audienceFilter === "all" ||
      (notification.audience?.scope === audienceFilter) ||
      (audienceFilter === "user" && notification.audience?.user_id) ||
      (audienceFilter === "roles" && notification.audience?.roles && notification.audience.roles.length > 0);

    const matchesChannel =
      channelFilter === "all" ||
      (notification.channels && notification.channels.includes(channelFilter));

    return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesAudience && matchesChannel;
  });

  // Get status badge
  const getStatusBadge = (notification: INotification) => {
    switch (notification.status) {
      case "draft":
        return { text: "DRAFT", color: "bg-gray-100 text-gray-800", icon: FileText };
      case "scheduled":
        return { text: "SCHEDULED", color: "bg-blue-100 text-blue-800", icon: CalendarClock };
      case "sent":
        return { text: "SENT", color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "cancelled":
        return { text: "CANCELLED", color: "bg-red-100 text-red-800", icon: XCircle };
      default:
        return { text: "UNKNOWN", color: "bg-gray-100 text-gray-800", icon: AlertCircle };
    }
  };

  // Get type badge
  const getTypeBadge = (notification: INotification) => {
    switch (notification.type) {
      case "info":
        return { text: "INFO", color: "bg-blue-50 text-blue-700", icon: Info };
      case "payment":
        return { text: "PAYMENT", color: "bg-green-50 text-green-700", icon: CreditCard };
      case "warning":
        return { text: "WARNING", color: "bg-yellow-50 text-yellow-700", icon: AlertTriangle };
      case "error":
        return { text: "ERROR", color: "bg-red-50 text-red-700", icon: AlertCircle };
      default:
        return { text: notification.type?.toUpperCase() || "INFO", color: "bg-gray-50 text-gray-700", icon: Bell };
    }
  };

  // Get priority badge
  const getPriorityBadge = (notification: INotification) => {
    switch (notification.priority) {
      case "low":
        return { text: "LOW", color: "bg-gray-100 text-gray-700", icon: TrendingDown };
      case "normal":
        return { text: "NORMAL", color: "bg-blue-50 text-blue-700", icon: TrendingUpIcon };
      case "high":
        return { text: "HIGH", color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle };
      case "critical":
        return { text: "CRITICAL", color: "bg-red-100 text-red-700", icon: AlertOctagon };
      default:
        return { text: "NORMAL", color: "bg-blue-50 text-blue-700", icon: TrendingUpIcon };
    }
  };

  // Get audience badge
  const getAudienceBadge = (notification: INotification) => {
    if (!notification.audience) {
      return { text: "ALL", color: "bg-purple-50 text-purple-700", icon: Globe };
    }

    switch (notification.audience.scope) {
      case "all":
        return { text: "ALL USERS", color: "bg-purple-50 text-purple-700", icon: Globe };
      case "user":
        return { text: "SINGLE USER", color: "bg-indigo-50 text-indigo-700", icon: User };
      case "roles":
        const roles = notification.audience.roles?.join(", ") || "ROLES";
        return { text: roles.toUpperCase(), color: "bg-cyan-50 text-cyan-700", icon: Users };
      default:
        return { text: "ALL", color: "bg-purple-50 text-purple-700", icon: Globe };
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

  // Get read statistics
  const getReadStats = (notification: INotification) => {
    const totalUsers = users.length;
    const acknowledgements = notification.acknowledgements || [];
    const readCount = acknowledgements.filter(a => a.read_at).length;
    const actedCount = acknowledgements.filter(a => a.acted_at).length;
    
    return {
      readCount,
      actedCount,
      readPercentage: totalUsers > 0 ? Math.round((readCount / totalUsers) * 100) : 0,
      actedPercentage: totalUsers > 0 ? Math.round((actedCount / totalUsers) * 100) : 0,
    };
  };

  // Get status statistics
  const statusStats = {
    draft: notifications.filter(n => n.status === "draft").length,
    scheduled: notifications.filter(n => n.status === "scheduled").length,
    sent: notifications.filter(n => n.status === "sent").length,
    cancelled: notifications.filter(n => n.status === "cancelled").length,
  };

  // Get type statistics
  const typeStats = {
    info: notifications.filter(n => n.type === "info").length,
    payment: notifications.filter(n => n.type === "payment").length,
    warning: notifications.filter(n => n.type === "warning").length,
    error: notifications.filter(n => n.type === "error").length,
  };

  // Quick actions
  const getQuickActions = (notification: INotification) => {
    const currentStatus = notification.status;
    const isScheduled = notification.send_at && new Date(notification.send_at) > new Date();

    return (
      <div className="flex flex-wrap gap-1">
        {currentStatus === "draft" && (
          <>
            <button
              onClick={() => handleSendNow(notification._id)}
              className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              Send Now
            </button>
            <button
              onClick={() => openScheduleModal(notification)}
              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              Schedule
            </button>
          </>
        )}
        
        {currentStatus === "scheduled" && (
          <>
            <button
              onClick={() => handleSendNow(notification._id)}
              className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              Send Now
            </button>
            <button
              onClick={() => handleCancelNotification(notification._id)}
              className="px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded flex items-center gap-1"
            >
              <XCircle className="w-3 h-3" />
              Cancel
            </button>
          </>
        )}
        
        {currentStatus !== "cancelled" && currentStatus !== "draft" && (
          <button
            onClick={() => openStatusModal(notification, "cancelled")}
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
                <h1 className="text-2xl font-bold text-gray-800">Notification Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage and send notifications to users</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold">{notifications.length}</span> notifications
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

        {/* Stats Overview */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Notifications</p>
                  <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Bell className="w-6 h-6 text-[#1EA2E4]" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {statusStats.scheduled}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CalendarClock className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statusStats.sent}
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
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {users.length}
                  </p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-500" />
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
                    placeholder="Search by title, message, or ID..."
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
                    <option value="info">Info</option>
                    <option value="payment">Payment</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                  <Bell className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <AlertTriangle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="sent">Sent</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={audienceFilter}
                    onChange={(e) => setAudienceFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                  >
                    <option value="all">All Audience</option>
                    <option value="all">All Users</option>
                    <option value="user">Single User</option>
                    <option value="roles">Roles</option>
                  </select>
                  <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Grid/Table */}
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
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-6">
              <Bell className="w-20 h-20 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg mb-2">No notifications found</p>
              <p className="text-gray-400 text-center mb-6">
                {searchTerm || typeFilter !== "all" || priorityFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Get started by creating your first notification"}
              </p>
              {!searchTerm && typeFilter === "all" && priorityFilter === "all" && statusFilter === "all" && (
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
              {/* Desktop Grid */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNotifications.map((notification) => {
                    const statusBadge = getStatusBadge(notification);
                    const typeBadge = getTypeBadge(notification);
                    const priorityBadge = getPriorityBadge(notification);
                    const audienceBadge = getAudienceBadge(notification);
                    const readStats = getReadStats(notification);
                    const StatusIcon = statusBadge.icon;
                    const TypeIcon = typeBadge.icon;
                    const PriorityIcon = priorityBadge.icon;
                    const AudienceIcon = audienceBadge.icon;

                    return (
                      <div
                        key={notification._id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="p-6">
                          {/* Notification Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                                  {notification.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Bell className="w-4 h-4" />
                                <span className="font-mono">{notification._id.substring(0, 8)}...</span>
                                {notification.created_at && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span>{formatDate(notification.created_at)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => openViewModal(notification)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>

                          {/* Message Preview */}
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mb-4">
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
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${priorityBadge.color}`}
                            >
                              <PriorityIcon className="w-3 h-3 inline mr-1" />
                              {priorityBadge.text}
                            </span>
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${audienceBadge.color}`}
                            >
                              <AudienceIcon className="w-3 h-3 inline mr-1" />
                              {audienceBadge.text}
                            </span>
                          </div>

                          {/* Channels */}
                          <div className="flex flex-wrap gap-1 mb-4">
                            {notification.channels?.map((channel) => (
                              <span
                                key={channel}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {channel === "in_app" && <Bell className="w-3 h-3 inline mr-1" />}
                                {channel === "email" && <Mail className="w-3 h-3 inline mr-1" />}
                                {channel === "sms" && <MessageSquare className="w-3 h-3 inline mr-1" />}
                                {channel === "push" && <Smartphone className="w-3 h-3 inline mr-1" />}
                                {channel}
                              </span>
                            ))}
                          </div>

                          {/* Stats */}
                          {notification.status === "sent" && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                <span>Read Rate:</span>
                                <span className="font-semibold">{readStats.readPercentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${readStats.readPercentage}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {readStats.readCount} of {users.length} users read
                              </div>
                            </div>
                          )}

                          {/* Schedule Info */}
                          {notification.send_at && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {notification.status === "scheduled" ? "Scheduled for:" : "Sent at:"}{" "}
                                {formatDateTime(notification.send_at)}
                              </span>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="pt-4 border-t border-gray-100">
                            {getQuickActions(notification)}
                          </div>

                          {/* Actions */}
                          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                              {notification.updated_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Updated: {formatDate(notification.updated_at)}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(notification)}
                                className="p-2 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                title="Edit Notification"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setNotificationToDelete(notification._id)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Notification"
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
                {filteredNotifications.map((notification) => {
                  const statusBadge = getStatusBadge(notification);
                  const typeBadge = getTypeBadge(notification);
                  const audienceBadge = getAudienceBadge(notification);

                  return (
                    <div
                      key={notification._id}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900 line-clamp-1">
                                {notification.title}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span>{formatDate(notification.created_at)}</span>
                              <span>•</span>
                              <span>ID: {notification._id.substring(0, 6)}...</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openViewModal(notification)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => openEditModal(notification)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${statusBadge.color}`}
                            >
                              {statusBadge.text}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${typeBadge.color}`}
                            >
                              {typeBadge.text}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${audienceBadge.color}`}
                            >
                              {audienceBadge.text}
                            </span>
                          </div>

                          {notification.send_at && (
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDateTime(notification.send_at)}</span>
                              </div>
                            </div>
                          )}

                          <div className="text-sm text-gray-600">
                            <div className="flex items-center justify-between">
                              <span>Channels:</span>
                              <div className="flex gap-1">
                                {notification.channels?.map((channel) => (
                                  <span key={channel} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                    {channel.charAt(0).toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500">
                            {notification.status === "sent" && "Sent"}
                            {notification.status === "scheduled" && "Scheduled"}
                            {notification.status === "draft" && "Draft"}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setNotificationToDelete(notification._id)}
                              className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
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

      {/* View Notification Details Modal */}
      {isViewModalOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Notification Details</h2>
                <p className="text-sm text-gray-600">View complete notification information</p>
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

            <div className="overflow-y-auto p-8" style={{ maxHeight: "calc(90vh - 80px)" }}>
              <div className="space-y-8">
                {/* Notification Overview */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Notification Overview
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <div className="lg:col-span-2">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedNotification.title}</h3>
                          <p className="text-gray-600 mt-2">{selectedNotification.message}</p>
                        </div>
                        
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusBadge(selectedNotification).color}`}>
                            {getStatusBadge(selectedNotification).text}
                          </span>
                          <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getTypeBadge(selectedNotification).color}`}>
                            {getTypeBadge(selectedNotification).text}
                          </span>
                          <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getPriorityBadge(selectedNotification).color}`}>
                            {getPriorityBadge(selectedNotification).text}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDateTime(selectedNotification.created_at)}
                        </p>
                      </div>
                      {selectedNotification.send_at && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">
                            {selectedNotification.status === "scheduled" ? "Scheduled For" : "Sent At"}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDateTime(selectedNotification.send_at)}
                          </p>
                        </div>
                      )}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500">Notification ID</p>
                        <p className="text-sm font-mono text-gray-900 break-all">
                          {selectedNotification._id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Delivery Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Channels */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Delivery Channels</h5>
                      <div className="space-y-2">
                        {selectedNotification.channels?.map((channel) => (
                          <div key={channel} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                            {channel === "in_app" && <Bell className="w-5 h-5 text-blue-500" />}
                            {channel === "email" && <Mail className="w-5 h-5 text-green-500" />}
                            {channel === "sms" && <MessageSquare className="w-5 h-5 text-purple-500" />}
                            {channel === "push" && <Smartphone className="w-5 h-5 text-orange-500" />}
                            <div>
                              <p className="font-medium text-gray-900 capitalize">{channel.replace('_', ' ')}</p>
                              <p className="text-xs text-gray-500">Delivery method</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Audience */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Target Audience</h5>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                          {(() => {
                            const AudienceIcon = getAudienceBadge(selectedNotification).icon;
                            return <AudienceIcon className="w-5 h-5 text-gray-600" />;
                          })()}
                          <div>
                            <p className="font-medium text-gray-900">
                              {getAudienceBadge(selectedNotification).text}
                            </p>
                            <p className="text-xs text-gray-500">Scope: {selectedNotification.audience?.scope}</p>
                          </div>
                        </div>
                        
                        {selectedNotification.audience?.scope === "user" && selectedNotification.audience.user_id && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Target User:</p>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {typeof selectedNotification.audience.user_id === 'object' 
                                  ? selectedNotification.audience.user_id.email || selectedNotification.audience.user_id._id
                                  : "User ID: " + selectedNotification.audience.user_id}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {selectedNotification.audience?.scope === "roles" && selectedNotification.audience.roles && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">Target Roles:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedNotification.audience.roles.map((role) => (
                                <span key={role} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                                  {role.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action & Data */}
                {(selectedNotification.action_text || selectedNotification.action_url || selectedNotification.data) && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                      Action & Metadata
                    </h4>
                    <div className="space-y-4">
                      {selectedNotification.action_text && selectedNotification.action_url && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Call to Action</p>
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                            <a
                              href={selectedNotification.action_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1EA2E4] hover:underline font-medium"
                            >
                              {selectedNotification.action_text}
                            </a>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 break-all">{selectedNotification.action_url}</p>
                        </div>
                      )}
                      
                      {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Additional Data</p>
                          <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-40">
                            {JSON.stringify(selectedNotification.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Analytics */}
                {selectedNotification.status === "sent" && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                      Delivery Analytics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                          </div>
                          <Users className="w-8 h-8 text-gray-300" />
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Read</p>
                            <p className="text-2xl font-bold text-green-600">
                              {getReadStats(selectedNotification).readCount}
                            </p>
                          </div>
                          <CheckCircle className="w-8 h-8 text-green-300" />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getReadStats(selectedNotification).readPercentage}% read rate
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Acted</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {getReadStats(selectedNotification).actedCount}
                            </p>
                          </div>
                          <Target className="w-8 h-8 text-blue-300" />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getReadStats(selectedNotification).actedPercentage}% action rate
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Quick Actions
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {getQuickActions(selectedNotification)}
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

      {/* Add/Edit Notification Modal */}
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
                        {isEditModalOpen ? "Edit Notification" : "Create New Notification"}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {isEditModalOpen
                          ? "Update notification information"
                          : "Create a new notification to send to users"}
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
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Basic Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, title: e.target.value }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                            placeholder="Enter notification title"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message *
                          </label>
                          <textarea
                            value={formData.message}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, message: e.target.value }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                            placeholder="Enter notification message"
                            rows={4}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Type & Priority */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Type & Priority
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                          </label>
                          <select
                            value={formData.type}
                            onChange={(e) =>
                              setFormData((prev) => ({ 
                                ...prev, 
                                type: e.target.value as NotificationType 
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          >
                            <option value="info">Info</option>
                            <option value="payment">Payment</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                          </label>
                          <select
                            value={formData.priority}
                            onChange={(e) =>
                              setFormData((prev) => ({ 
                                ...prev, 
                                priority: e.target.value as NotificationPriority 
                              }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          >
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Audience */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Target Audience
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Audience Scope
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                              type="button"
                              onClick={() => handleAudienceScopeChange("all")}
                              className={`px-4 py-3 border rounded-lg flex flex-col items-center justify-center ${
                                formData.audience?.scope === "all"
                                  ? "border-[#1EA2E4] bg-blue-50 text-[#1EA2E4]"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              <Globe className="w-5 h-5 mb-2" />
                              <span className="text-sm font-medium">All Users</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleAudienceScopeChange("user")}
                              className={`px-4 py-3 border rounded-lg flex flex-col items-center justify-center ${
                                formData.audience?.scope === "user"
                                  ? "border-[#1EA2E4] bg-blue-50 text-[#1EA2E4]"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              <User className="w-5 h-5 mb-2" />
                              <span className="text-sm font-medium">Single User</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleAudienceScopeChange("roles")}
                              className={`px-4 py-3 border rounded-lg flex flex-col items-center justify-center ${
                                formData.audience?.scope === "roles"
                                  ? "border-[#1EA2E4] bg-blue-50 text-[#1EA2E4]"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              <Users className="w-5 h-5 mb-2" />
                              <span className="text-sm font-medium">Roles</span>
                            </button>
                          </div>
                        </div>

                        {/* User Selection */}
                        {formData.audience?.scope === "user" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select User
                            </label>
                            <select
                              value={selectedUsers[0]?._id || ""}
                              onChange={(e) => handleUserSelect(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                            >
                              <option value="">Select a user...</option>
                              {users.map((user) => (
                                <option key={user._id} value={user._id}>
                                  {user.full_name} ({user.email})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Role Selection */}
                        {formData.audience?.scope === "roles" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select Roles
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {["customer", "agent", "manager", "admin", "driver"].map((role) => (
                                <button
                                  key={role}
                                  type="button"
                                  onClick={() => handleRoleSelect(role)}
                                  className={`px-3 py-2 border rounded-lg flex items-center gap-2 ${
                                    selectedRoles.includes(role)
                                      ? "border-[#1EA2E4] bg-blue-50 text-[#1EA2E4]"
                                      : "border-gray-300 hover:border-gray-400"
                                  }`}
                                >
                                  <Shield className="w-4 h-4" />
                                  <span className="text-sm capitalize">{role}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Channels */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Delivery Channels
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {["in_app", "email", "sms", "push"].map((channel) => (
                          <button
                            key={channel}
                            type="button"
                            onClick={() => handleChannelSelect(channel)}
                            className={`px-4 py-3 border rounded-lg flex flex-col items-center justify-center ${
                              formData.channels?.includes(channel)
                                ? "border-[#1EA2E4] bg-blue-50 text-[#1EA2E4]"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            {channel === "in_app" && <Bell className="w-5 h-5 mb-2" />}
                            {channel === "email" && <Mail className="w-5 h-5 mb-2" />}
                            {channel === "sms" && <MessageSquare className="w-5 h-5 mb-2" />}
                            {channel === "push" && <Smartphone className="w-5 h-5 mb-2" />}
                            <span className="text-sm font-medium capitalize">{channel.replace('_', ' ')}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scheduling */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Scheduling
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleScheduleTypeChange("now")}
                            className={`px-4 py-3 border rounded-lg flex items-center justify-center gap-2 ${
                              scheduleType === "now"
                                ? "border-[#1EA2E4] bg-blue-50 text-[#1EA2E4]"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <Send className="w-5 h-5" />
                            <span className="text-sm font-medium">Send Immediately</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleScheduleTypeChange("later")}
                            className={`px-4 py-3 border rounded-lg flex items-center justify-center gap-2 ${
                              scheduleType === "later"
                                ? "border-[#1EA2E4] bg-blue-50 text-[#1EA2E4]"
                                : "border-gray-300 hover:border-gray-400"
                            }`}
                          >
                            <Calendar className="w-5 h-5" />
                            <span className="text-sm font-medium">Schedule for Later</span>
                          </button>
                        </div>

                        {scheduleType === "later" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Schedule Date & Time
                            </label>
                            <input
                              type="datetime-local"
                              value={scheduleDateTime}
                              onChange={(e) => setScheduleDateTime(e.target.value)}
                              min={new Date().toISOString().slice(0, 16)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Call to Action (Optional)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Button Text
                          </label>
                          <input
                            type="text"
                            value={formData.action_text || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, action_text: e.target.value || null }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                            placeholder="e.g., View Details"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Action URL
                          </label>
                          <input
                            type="url"
                            value={formData.action_url || ""}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, action_url: e.target.value || null }))
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                            placeholder="e.g., https://example.com/action"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expiration */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Expiration (Optional)
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiration Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.expires_at ? new Date(formData.expires_at).toISOString().slice(0, 16) : ""}
                          onChange={(e) =>
                            setFormData((prev) => ({ 
                              ...prev, 
                              expires_at: e.target.value ? new Date(e.target.value).toISOString() : null 
                            }))
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Notifications will be automatically cleaned up after expiration
                        </p>
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
                      onClick={isEditModalOpen ? handleUpdateNotification : handleAddNotification}
                      disabled={!formData.title || !formData.message}
                      className="px-5 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isEditModalOpen ? "Update Notification" : "Create Notification"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsStatusModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                  newStatus === "sent" ? "bg-green-100" :
                  newStatus === "cancelled" ? "bg-red-100" : "bg-blue-100"
                }`}>
                  {(() => {
                    const StatusIcon = getStatusBadge({...selectedNotification, status: newStatus}).icon;
                    return <StatusIcon className="w-6 h-6" style={{
                      color: newStatus === "sent" ? "#10B981" :
                             newStatus === "cancelled" ? "#EF4444" : "#3B82F6"
                    }} />;
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Update Notification Status</h3>
                  <p className="text-sm text-gray-600">Change notification status to <span className="font-semibold">{newStatus}</span></p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-2">Notification:</p>
                  <p className="font-medium">{selectedNotification.title}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{selectedNotification.message}</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">Current Status:</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedNotification).color}`}>
                    {getStatusBadge(selectedNotification).text}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg mt-3">
                  <span className="text-sm text-gray-700">New Status:</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    newStatus === "sent" ? "bg-green-100 text-green-800" :
                    newStatus === "cancelled" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {newStatus.toUpperCase()}
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
                    newStatus === "sent" ? "bg-green-600 hover:bg-green-700" :
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

      {/* Schedule Modal */}
      {isScheduleModalOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsScheduleModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Schedule Notification</h3>
                  <p className="text-sm text-gray-600">Schedule this notification for later delivery</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-2">Notification:</p>
                  <p className="font-medium">{selectedNotification.title}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      The notification will be sent at the specified time
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Current time: {new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleNotification}
                  disabled={!scheduleDateTime}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule Notification
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
                  <AlertOctagon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Notification</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this notification? This will permanently remove all
                notification data and cannot be recovered.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setNotificationToDelete(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteNotification(notificationToDelete)}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Notification
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

export default NotificationManagementScreen;