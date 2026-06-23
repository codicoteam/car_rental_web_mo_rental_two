import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, CheckCheck, Clock, Tag, CreditCard, AlertTriangle, Info } from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

interface InAppNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  created_at: string;
  acknowledgements?: { read_at?: string | null }[];
}

function getAuthToken(): string | null {
  try {
    const stored = localStorage.getItem("car_rental_auth");
    return stored ? JSON.parse(stored).token : null;
  } catch {
    return null;
  }
}

function typeIcon(type: string) {
  if (type === "payment") return <CreditCard className="w-3.5 h-3.5" />;
  if (type === "alert") return <AlertTriangle className="w-3.5 h-3.5" />;
  if (type === "promo") return <Tag className="w-3.5 h-3.5" />;
  return <Info className="w-3.5 h-3.5" />;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/notifications/mine`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 15 },
      });
      const items: InAppNotification[] = res.data?.data?.items || res.data?.data || res.data?.items || [];
      setNotifications(items);
      const unreadCount = items.filter(n =>
        !n.acknowledgements?.some(a => a.read_at)
      ).length;
      setUnread(unreadCount);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNotifications]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
    }
  }, [open, fetchNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAsRead = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      await axios.post(`${API_BASE}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => n._id === id
          ? { ...n, acknowledgements: [{ read_at: new Date().toISOString() }] }
          : n
        )
      );
      setUnread(prev => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const markAllRead = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const unreadIds = notifications
        .filter(n => !n.acknowledgements?.some(a => a.read_at))
        .map(n => n._id);
      if (unreadIds.length === 0) return;
      await axios.post(`${API_BASE}/notifications/bulk/read`, { ids: unreadIds }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev =>
        prev.map(n => ({ ...n, acknowledgements: [{ read_at: new Date().toISOString() }] }))
      );
      setUnread(0);
    } catch {
      // silent
    }
  };

  const isRead = (n: InAppNotification) =>
    n.acknowledgements?.some(a => a.read_at) ?? false;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(p => !p)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1EA2E4]" />
              <span className="font-semibold text-gray-800 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="px-2 py-0.5 bg-[#1EA2E4] text-white text-xs font-bold rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-[#1EA2E4] hover:text-[#1A8BC9] font-medium px-2 py-1 rounded-lg hover:bg-blue-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-200 rounded-lg">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1EA2E4]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const read = isRead(n);
                return (
                  <div
                    key={n._id}
                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!read ? "bg-blue-50/40" : ""}`}
                    onClick={() => !read && markAsRead(n._id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        n.type === "alert" ? "bg-red-100 text-red-600"
                        : n.type === "payment" ? "bg-green-100 text-green-600"
                        : n.type === "promo" ? "bg-emerald-100 text-emerald-600"
                        : "bg-blue-100 text-blue-600"
                      }`}>
                        {typeIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-sm font-semibold truncate ${read ? "text-gray-600" : "text-gray-900"}`}>
                            {n.title}
                          </p>
                          {!read && (
                            <span className="w-2 h-2 bg-[#1EA2E4] rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-center">
              <button
                onClick={fetchNotifications}
                className="text-xs text-[#1EA2E4] hover:text-[#1A8BC9] font-medium"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
