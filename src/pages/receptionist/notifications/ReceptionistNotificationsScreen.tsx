import React, { useState, useEffect, useCallback } from "react";
import ReceptionistSideBar from "../../../components/ReceptionistSideBar";
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
import { fetchAllUsers, type IUser } from "../../../Services/adminAndManager/admi_users_service";
import { fetchAllPromoCodes, type IPromoCode } from "../../../Services/adminAndManager/promo_code_service";
import {
  Search, Trash2, Eye, Edit, Plus, X, AlertCircle, CheckCircle,
  MoreVertical, Bell, Mail, Users, User, Calendar, Clock, Send,
  RefreshCw, ChevronDown, Globe, AlertTriangle, Info, CreditCard,
  Calendar as CalendarIcon, Zap, Ban, Check, DollarSign, Car,
  Ticket, Filter, ChevronUp, MessageSquare, Smartphone,
} from "lucide-react";

const ManagerNotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const [users, setUsers] = useState<IUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedScheduleNotification, setSelectedScheduleNotification] = useState<Notification | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Promo code state
  const [promoCodes, setPromoCodes] = useState<IPromoCode[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [showPromoDropdown, setShowPromoDropdown] = useState(false);
  const [promoSearchTerm, setPromoSearchTerm] = useState("");
  const [selectedPromoCode, setSelectedPromoCode] = useState<IPromoCode | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false, message: "", type: "info",
  });

  const notificationTypes: NotificationType[] = ["info", "payment", "alert", "reminder"];
  const notificationPriorities: NotificationPriority[] = ["low", "normal", "high", "urgent"];
  const availableRoles = ["customer", "manager", "admin", "driver", "agent"];

  const [formData, setFormData] = useState<CreateNotificationPayload>({
    title: "", message: "", type: "info", priority: "normal",
    audience: { scope: "all", user_id: null, roles: [] },
    channels: ["in_app"], send_at: null, expires_at: null,
    action_text: null, action_url: null, data: {},
  });

  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar(p => ({ ...p, show: false })), 3000);
  };

  const resetForm = () => {
    setFormData({
      title: "", message: "", type: "info", priority: "normal",
      audience: { scope: "all", user_id: null, roles: [] },
      channels: ["in_app"], send_at: null, expires_at: null,
      action_text: null, action_url: null, data: {}, acknowledgements: [],
    });
    setSelectedPromoCode(null);
    setShowPromoDropdown(false);
    setPromoSearchTerm("");
  };

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: NotificationsQueryParams = { page: currentPage, limit: itemsPerPage };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter as NotificationStatus;
      if (typeFilter !== "all") params.type = typeFilter as NotificationType;
      if (priorityFilter !== "all") params.priority = priorityFilter as NotificationPriority;
      const response = await NotificationsService.getAllNotifications(params);
      setNotifications(response.items);
      setTotalItems(response.total || response.items.length);
      setTotalPages(Math.ceil((response.total || response.items.length) / itemsPerPage));
    } catch (err) {
      setError("Failed to load notifications");
      showSnackbar("Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, typeFilter, priorityFilter]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, typeFilter, priorityFilter]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetchAllUsers(1, 50, userSearchTerm);
      setUsers(res.data.users);
    } catch { /* silent */ }
    finally { setLoadingUsers(false); }
  }, [userSearchTerm]);

  useEffect(() => { if (showUserDropdown) fetchUsers(); }, [showUserDropdown, userSearchTerm, fetchUsers]);

  const loadPromoCodes = useCallback(async () => {
    setLoadingPromos(true);
    try {
      const res = await fetchAllPromoCodes();
      setPromoCodes(res.data);
    } catch { /* silent */ }
    finally { setLoadingPromos(false); }
  }, []);

  useEffect(() => {
    if (showPromoDropdown && promoCodes.length === 0) loadPromoCodes();
  }, [showPromoDropdown, promoCodes.length, loadPromoCodes]);

  const getPromoDisplayValue = (p: IPromoCode) =>
    p.type === "percent" ? `${p.value}%` : `$${p.value.toFixed(2)}`;

  const filteredPromos = promoCodes.filter(p => {
    const s = promoSearchTerm.toLowerCase();
    return p.code.toLowerCase().includes(s) || (p.notes || "").toLowerCase().includes(s);
  });

  const applyPromoToForm = (promo: IPromoCode) => {
    const val = getPromoDisplayValue(promo);
    const expiry = promo.valid_to ? new Date(promo.valid_to).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
    setFormData(prev => ({
      ...prev,
      title: prev.title || `Special Offer: Use ${promo.code} for ${val} OFF!`,
      message: prev.message || `Use promo code ${promo.code} to enjoy ${val} off your next rental${expiry ? ` — valid until ${expiry}` : ""}. ${promo.notes || "Don't miss this exclusive deal!"}`,
      data: {
        ...prev.data,
        promo_code_id: promo._id,
        promo_code: promo.code,
        promo_discount: val,
        promo_type: promo.type,
        promo_valid_to: promo.valid_to || null,
      },
    }));
    setSelectedPromoCode(promo);
    setShowPromoDropdown(false);
    setPromoSearchTerm("");
  };

  const clearPromoFromForm = () => {
    setSelectedPromoCode(null);
    setFormData(prev => ({
      ...prev,
      data: { ...prev.data, promo_code_id: undefined, promo_code: undefined, promo_discount: undefined, promo_type: undefined, promo_valid_to: undefined },
    }));
  };

  const openAddModal = () => { resetForm(); setIsAddModalOpen(true); };

  const openEditModal = (n: Notification) => {
    setSelectedNotification(n);
    setFormData({
      title: n.title, message: n.message, type: n.type, priority: n.priority,
      audience: n.audience, channels: n.channels, expires_at: n.expires_at,
      action_text: n.action_text, action_url: n.action_url, data: n.data || {},
      acknowledgements: n.acknowledgements || [],
    });
    if (n.data?.promo_code_id) {
      const found = promoCodes.find(p => p._id === n.data!.promo_code_id);
      setSelectedPromoCode(found || null);
    } else {
      setSelectedPromoCode(null);
    }
    setIsEditModalOpen(true);
    setIsViewModalOpen(false);
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.message) { showSnackbar("Title and message are required", "error"); return; }
    setIsCreating(true);
    try {
      const payload = {
        ...formData,
        acknowledgements: formData.audience.scope === "user" && formData.audience.user_id
          ? [{ user_id: formData.audience.user_id, read_at: null, acted_at: null, action: null }]
          : [],
      };
      await NotificationsService.createNotification(payload);
      showSnackbar("Notification created!", "success");
      setIsAddModalOpen(false);
      resetForm();
      loadNotifications();
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to create notification", "error");
    } finally { setIsCreating(false); }
  };

  const handleUpdate = async () => {
    if (!selectedNotification) return;
    setIsUpdating(true);
    try {
      await NotificationsService.updateNotification(selectedNotification._id, formData);
      showSnackbar("Notification updated!", "success");
      setIsEditModalOpen(false);
      loadNotifications();
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to update", "error");
    } finally { setIsUpdating(false); }
  };

  const handleDelete = async () => {
    if (!notificationToDelete) return;
    setIsDeleting(true);
    try {
      await NotificationsService.deleteNotification(notificationToDelete);
      showSnackbar("Deleted", "success");
      setNotificationToDelete(null);
      loadNotifications();
    } catch { showSnackbar("Failed to delete", "error"); }
    finally { setIsDeleting(false); }
  };

  const handleSendNow = async (id: string) => {
    setSendingId(id);
    try {
      await NotificationsService.sendNotificationNow(id);
      showSnackbar("Notification sent!", "success");
      loadNotifications();
    } catch { showSnackbar("Failed to send", "error"); }
    finally { setSendingId(null); }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await NotificationsService.cancelNotification(id);
      showSnackbar("Cancelled", "success");
      loadNotifications();
    } catch { showSnackbar("Failed to cancel", "error"); }
    finally { setCancellingId(null); }
  };

  const handleSchedule = async () => {
    if (!selectedScheduleNotification || !scheduleDateTime) { showSnackbar("Select a date/time", "error"); return; }
    setIsScheduling(true);
    try {
      await NotificationsService.scheduleNotification(selectedScheduleNotification._id, new Date(scheduleDateTime).toISOString());
      showSnackbar("Scheduled!", "success");
      setIsScheduleModalOpen(false);
      setScheduleDateTime("");
      loadNotifications();
    } catch { showSnackbar("Failed to schedule", "error"); }
    finally { setIsScheduling(false); }
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const STATUS_COLOR: Record<NotificationStatus, string> = {
    draft: "bg-gray-100 text-gray-700",
    scheduled: "bg-yellow-100 text-yellow-800",
    sent: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  const TYPE_COLOR: Record<NotificationType, string> = {
    info: "bg-blue-100 text-blue-800",
    payment: "bg-green-100 text-green-800",
    alert: "bg-red-100 text-red-800",
    reminder: "bg-purple-100 text-purple-800",
  };
  const PRIORITY_COLOR: Record<NotificationPriority, string> = {
    low: "bg-gray-100 text-gray-700",
    normal: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  const typeIcon = (type: NotificationType) => {
    if (type === "info") return <Info className="w-4 h-4" />;
    if (type === "payment") return <CreditCard className="w-4 h-4" />;
    if (type === "alert") return <AlertTriangle className="w-4 h-4" />;
    return <Bell className="w-4 h-4" />;
  };

  const audienceLabel = (a: Audience) => {
    if (a.scope === "all") return "All Users";
    if (a.scope === "user") return `User: ${typeof a.user_id === "object" ? a.user_id?.email : a.user_id || "—"}`;
    return `Role: ${a.roles?.join(", ") || "—"}`;
  };

  const PromoSection = () => (
    <div className="border-t border-gray-200 pt-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <Ticket className="w-4 h-4 text-emerald-600" />
        <label className="text-sm font-semibold text-gray-700">
          Promo Code <span className="text-xs text-gray-500 font-normal">(Optional — auto-fills title &amp; message)</span>
        </label>
      </div>

      <div className="relative mb-2">
        <div
          className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white flex justify-between items-center hover:border-emerald-400 transition-colors"
          onClick={() => setShowPromoDropdown(p => !p)}
        >
          <span className={selectedPromoCode || formData.data?.promo_code ? "text-gray-900 font-medium" : "text-gray-400"}>
            {selectedPromoCode
              ? `${selectedPromoCode.code} — ${getPromoDisplayValue(selectedPromoCode)} OFF`
              : formData.data?.promo_code
              ? `${formData.data.promo_code} — ${formData.data.promo_discount} OFF`
              : "Select a promo code (optional)"}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        {showPromoDropdown && (
          <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by code or notes..."
                  value={promoSearchTerm}
                  onChange={e => setPromoSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-56">
              {loadingPromos ? (
                <div className="p-4 text-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500 mx-auto" /></div>
              ) : filteredPromos.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No promo codes found</div>
              ) : (
                filteredPromos.map(promo => (
                  <div
                    key={promo._id}
                    className="px-3 py-2.5 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                    onClick={() => applyPromoToForm(promo)}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-mono font-bold text-gray-900 text-sm tracking-wider">{promo.code}</span>
                      <span className="text-emerald-700 font-semibold text-sm">{getPromoDisplayValue(promo)} OFF</span>
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {promo.type === "percent" ? "Percentage" : `Fixed ${promo.currency || "USD"}`}
                      {promo.valid_to && ` · Expires ${new Date(promo.valid_to).toLocaleDateString()}`}
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${promo.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {promo.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {promo.notes && <div className="text-xs text-gray-400 mt-0.5 truncate">{promo.notes}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {(selectedPromoCode || formData.data?.promo_code) && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono font-bold text-emerald-800 text-sm">{selectedPromoCode?.code || formData.data?.promo_code}</span>
              <span className="text-emerald-700 font-semibold text-sm">
                {selectedPromoCode ? getPromoDisplayValue(selectedPromoCode) : formData.data?.promo_discount} OFF
              </span>
            </div>
            <p className="text-xs text-emerald-600">Title &amp; message auto-filled — edit them freely above.</p>
          </div>
          <button type="button" onClick={clearPromoFromForm} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 flex-shrink-0">
            <X className="w-3 h-3" /> Remove
          </button>
        </div>
      )}
    </div>
  );

  const FormBody = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
        <input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
          placeholder="Notification title" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message <span className="text-red-500">*</span></label>
        <textarea value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} rows={4}
          placeholder="Notification message" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value as NotificationType }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]">
            {notificationTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value as NotificationPriority }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]">
            {notificationPriorities.map(pr => <option key={pr} value={pr}>{pr.charAt(0).toUpperCase() + pr.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
        <select value={formData.audience.scope}
          onChange={e => setFormData(p => ({ ...p, audience: { scope: e.target.value as AudienceScope, user_id: null, roles: [] } }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]">
          <option value="all">All Users</option>
          <option value="user">Specific User</option>
          <option value="role">Specific Role(s)</option>
        </select>
      </div>

      {formData.audience.scope === "user" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
          <div className="relative">
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white flex justify-between items-center"
              onClick={() => setShowUserDropdown(p => !p)}>
              <span className={formData.audience.user_id ? "text-gray-900" : "text-gray-400"}>
                {(() => {
                  if (!formData.audience.user_id) return "Select a user";
                  const uid = typeof formData.audience.user_id === "object" ? formData.audience.user_id._id : formData.audience.user_id;
                  const u = users.find(u => u._id === uid);
                  return u ? `${u.full_name} (${u.email})` : uid;
                })()}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            {showUserDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Search users..." value={userSearchTerm}
                      onChange={e => setUserSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]"
                      onClick={e => e.stopPropagation()} />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-60">
                  {loadingUsers ? (
                    <div className="p-3 text-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1EA2E4] mx-auto" /></div>
                  ) : users.length === 0 ? (
                    <div className="p-3 text-center text-gray-500">No users found</div>
                  ) : users.map(u => (
                    <div key={u._id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                      onClick={() => { setFormData(p => ({ ...p, audience: { ...p.audience, user_id: u._id } })); setShowUserDropdown(false); setUserSearchTerm(""); }}>
                      <div className="font-medium text-gray-900">{u.full_name}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                      <div className="text-xs text-gray-400 capitalize">Role: {u.roles?.join(", ") || "N/A"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {formData.audience.scope === "role" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
          <div className="flex flex-wrap gap-3 p-3 border border-gray-300 rounded-lg">
            {availableRoles.map(role => (
              <label key={role} className="flex items-center gap-2">
                <input type="checkbox" checked={formData.audience.roles?.includes(role) || false}
                  onChange={e => {
                    const roles = formData.audience.roles || [];
                    setFormData(p => ({ ...p, audience: { ...p.audience, roles: e.target.checked ? [...roles, role] : roles.filter(r => r !== role) } }));
                  }}
                  className="rounded border-gray-300 text-[#1EA2E4] focus:ring-[#1EA2E4]" />
                <span className="text-sm text-gray-700">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Delivery Channels
          <span className="ml-1.5 text-xs text-gray-400 font-normal">(select at least one)</span>
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { id: "in_app", label: "In-App", desc: "Real-time alert in the app", Icon: Bell, color: "#1EA2E4" },
            { id: "email", label: "Email", desc: "Send to user's email inbox", Icon: Mail, color: "#6366f1" },
            { id: "sms", label: "SMS", desc: "Text message to phone", Icon: MessageSquare, color: "#10b981" },
            { id: "push", label: "Push", desc: "Mobile push notification", Icon: Smartphone, color: "#f59e0b" },
          ].map(({ id, label, desc, Icon, color }) => {
            const active = formData.channels?.includes(id) || false;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  const chs = formData.channels || [];
                  setFormData(p => ({ ...p, channels: active ? chs.filter(c => c !== id) : [...chs, id] }));
                }}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full ${
                  active ? "border-[#1EA2E4] bg-blue-50/60" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: active ? `${color}1a` : "#f3f4f6" }}>
                  <Icon className="w-4 h-4" style={{ color: active ? color : "#9ca3af" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold ${active ? "text-gray-900" : "text-gray-500"}`}>{label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-[#1EA2E4]" />}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
        <input type="datetime-local" value={formData.expires_at || ""}
          onChange={e => setFormData(p => ({ ...p, expires_at: e.target.value || null }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action Text (Optional)</label>
          <input type="text" value={formData.action_text || ""} onChange={e => setFormData(p => ({ ...p, action_text: e.target.value || null }))}
            placeholder="e.g., Book Now" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action URL (Optional)</label>
          <input type="url" value={formData.action_url || ""} onChange={e => setFormData(p => ({ ...p, action_url: e.target.value || null }))}
            placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
        </div>
      </div>

      <PromoSection />
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <ReceptionistSideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Bell className="w-6 h-6 text-[#1EA2E4]" /> Notifications
                </h1>
                <p className="text-sm text-gray-500">Send and manage branch notifications</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold">{totalItems}</span>
              </div>
              <button onClick={loadNotifications} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-xl font-semibold shadow-sm hover:bg-[#1A8BC9] transition-colors">
                <Plus className="w-5 h-5" /> Create Notification
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search notifications..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] text-sm" />
              </div>
              <button onClick={() => setShowFilters(p => !p)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filters</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Status", value: statusFilter, setter: setStatusFilter, options: [{ v: "all", l: "All Status" }, { v: "draft", l: "Draft" }, { v: "scheduled", l: "Scheduled" }, { v: "sent", l: "Sent" }, { v: "cancelled", l: "Cancelled" }] },
                  { label: "Type", value: typeFilter, setter: setTypeFilter, options: [{ v: "all", l: "All Types" }, { v: "info", l: "Info" }, { v: "payment", l: "Payment" }, { v: "alert", l: "Alert" }, { v: "reminder", l: "Reminder" }] },
                  { label: "Priority", value: priorityFilter, setter: setPriorityFilter, options: [{ v: "all", l: "All Priorities" }, { v: "low", l: "Low" }, { v: "normal", l: "Normal" }, { v: "high", l: "High" }, { v: "urgent", l: "Urgent" }] },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <select value={f.value} onChange={e => f.setter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] text-sm">
                      {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cards */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4" />
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64">
              <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={loadNotifications} className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg text-sm">Retry</button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-600 font-semibold mb-1">No notifications found</p>
              <button onClick={openAddModal} className="mt-4 px-5 py-2.5 bg-[#1EA2E4] text-white rounded-xl font-semibold">
                + Create Notification
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {notifications.map(n => (
                  <div key={n._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                    <div className="p-5 pb-3 border-b border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${TYPE_COLOR[n.type]}`}>{typeIcon(n.type)}</div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLOR[n.status]}`}>
                            {n.status.charAt(0).toUpperCase() + n.status.slice(1)}
                          </span>
                        </div>
                        {n.priority !== "normal" && (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLOR[n.priority]}`}>
                            {n.priority.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">{n.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{n.message}</p>
                      {n.data?.promo_code && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1 w-fit">
                          <Ticket className="w-3 h-3" />
                          <span className="font-mono font-bold">{n.data.promo_code}</span>
                          <span>{n.data.promo_discount} OFF</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {n.audience.scope === "all" ? <Globe className="w-4 h-4" /> : n.audience.scope === "user" ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                        <span className="truncate">{audienceLabel(n.audience)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(n.created_at)}</span>
                      </div>
                      {n.channels?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {n.channels.map(ch => {
                            const chIcon = ch === "in_app" ? <Bell className="w-3 h-3" /> : ch === "email" ? <Mail className="w-3 h-3" /> : ch === "sms" ? <MessageSquare className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />;
                            const chLabel = ch === "in_app" ? "In-App" : ch.charAt(0).toUpperCase() + ch.slice(1);
                            return (
                              <span key={ch} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {chIcon}{chLabel}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex gap-1">
                        <button onClick={() => { setSelectedNotification(n); setIsViewModalOpen(true); }}
                          className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-blue-50 rounded-lg" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {n.status !== "cancelled" && n.status !== "sent" && (
                          <button onClick={() => openEditModal(n)} className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {n.status === "draft" && (
                          <button onClick={() => { setSelectedScheduleNotification(n); setIsScheduleModalOpen(true); }}
                            className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Schedule">
                            <CalendarIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setNotificationToDelete(n._id)} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {(n.status === "scheduled" || n.status === "draft") && (
                        <div className="flex gap-1">
                          <button onClick={() => handleSendNow(n._id)} disabled={sendingId === n._id}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50" title="Send Now">
                            {sendingId === n._id ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-600 border-t-transparent" /> : <Send className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleCancel(n._id)} disabled={cancellingId === n._id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50" title="Cancel">
                            {cancellingId === n._id ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent" /> : <Ban className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm">Previous</button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Notification Details</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditModal(selectedNotification)}
                  className="px-3 py-1.5 text-sm bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9]">Edit</button>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: "calc(90vh - 80px)" }}>
              <h3 className="text-xl font-bold text-gray-900">{selectedNotification.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${TYPE_COLOR[selectedNotification.type]}`}>{selectedNotification.type}</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLOR[selectedNotification.status]}`}>{selectedNotification.status}</span>
                {selectedNotification.priority !== "normal" && <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLOR[selectedNotification.priority]}`}>{selectedNotification.priority.toUpperCase()}</span>}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Message</p>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedNotification.message}</p>
              </div>
              {selectedNotification.data?.promo_code && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                  <p className="text-xs font-semibold text-emerald-700 uppercase mb-2">Attached Promo Code</p>
                  <div className="flex items-center gap-3">
                    <Ticket className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-mono font-bold text-emerald-800">{selectedNotification.data.promo_code}</p>
                      <p className="text-sm text-emerald-700">{selectedNotification.data.promo_discount} OFF · {selectedNotification.data.promo_type}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Audience</p>
                <p className="text-gray-700">{audienceLabel(selectedNotification.audience)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Created</p>
                  <p className="text-sm text-gray-700">{formatDate(selectedNotification.created_at)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Expires</p>
                  <p className="text-sm text-gray-700">{selectedNotification.expires_at ? formatDate(selectedNotification.expires_at) : "No expiration"}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
              <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Drawer */}
      {isAddModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => { setIsAddModalOpen(false); resetForm(); }} />
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Create Notification</h2>
                <p className="text-sm text-gray-500">Send updates to users — attach a promo code to share deals</p>
              </div>
              <button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6"><FormBody /></div>
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium">Cancel</button>
              <button onClick={handleCreate} disabled={isCreating || !formData.title || !formData.message}
                className="px-5 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] font-medium flex items-center gap-2 disabled:opacity-50">
                {isCreating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</> : <><Send className="w-4 h-4" />Create</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Drawer */}
      {isEditModalOpen && selectedNotification && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => { setIsEditModalOpen(false); resetForm(); }} />
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Edit Notification</h2>
                <p className="text-sm text-gray-500">Modify notification details</p>
              </div>
              <button onClick={() => { setIsEditModalOpen(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6"><FormBody /></div>
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => { setIsEditModalOpen(false); resetForm(); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium">Cancel</button>
              <button onClick={handleUpdate} disabled={isUpdating}
                className="px-5 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] font-medium flex items-center gap-2 disabled:opacity-50">
                {isUpdating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</> : <><Send className="w-4 h-4" />Update</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && selectedScheduleNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isScheduling && setIsScheduleModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Schedule Notification</h3>
                <p className="text-sm text-gray-500 truncate max-w-[260px]">{selectedScheduleNotification.title}</p>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send Date &amp; Time</label>
            <input type="datetime-local" value={scheduleDateTime} onChange={e => setScheduleDateTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4" />
            {scheduleDateTime && (
              <div className="mb-4 p-3 bg-purple-50 rounded-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-700">{new Date(scheduleDateTime).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsScheduleModalOpen(false)} disabled={isScheduling}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleSchedule} disabled={isScheduling || !scheduleDateTime}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                {isScheduling ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Scheduling...</> : <><CalendarIcon className="w-4 h-4" />Schedule</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {notificationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setNotificationToDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete Notification</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setNotificationToDelete(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.show && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[280px] ${
            snackbar.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : snackbar.type === "error" ? "bg-red-50 border-red-200 text-red-800"
            : "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{snackbar.message}</span>
            <button onClick={() => setSnackbar(p => ({ ...p, show: false }))}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerNotificationsScreen;
