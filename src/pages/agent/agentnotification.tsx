import { useState, useEffect } from 'react';
import { 
  Bell, Check, CheckCircle, AlertCircle, Info, Clock, Menu, X, Search, Plus, 
  Send, Users, ChevronDown, User, Calendar, Tag, Shield, Mail, 
  Eye, EyeOff, Trash2, Copy, Filter, Calendar as CalendarIcon,
  Sparkles,
  MoreVertical,
  Zap,
  Star,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import Sidebar from '../../components/agentsidebar';
import NotificationService from '../../Services/notification_service';
import UserService from '../../Services/users_service';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  send_at?: string;
  read: boolean;
  type: 'info' | 'warning' | 'error' | 'success' | 'normal';
  details?: string;
  sender?: string;
  category?: 'booking' | 'payment' | 'system' | 'promotion' | 'alert';
  priority?: 'low' | 'normal' | 'medium' | 'high';
  status?: 'draft' | 'scheduled' | 'sent' | 'cancelled' | 'failed';
  user_id?: string;
  metadata?: Record<string, any>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface NewNotificationData {
  title: string;
  message: string;
  type: string;
  priority: string;
  userId: string;
  category?: string;
  details?: string;
  send_at?: string;
}

export default function AgentNotificationScreen() {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [creatingNotification, setCreatingNotification] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [newNotification, setNewNotification] = useState<NewNotificationData>({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    userId: '',
    category: 'system',
    details: '',
    send_at: ''
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await NotificationService.getAllNotifications();
      
      let notificationsArray = [];
      
      if (Array.isArray(response)) {
        notificationsArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        notificationsArray = response.data;
      } else if (response?.notifications) {
        notificationsArray = response.notifications;
      } else if (response?.success && response?.data) {
        notificationsArray = response.data;
      } else {
        notificationsArray = Object.values(response || {}).find(val => Array.isArray(val)) || [];
      }

      const transformedNotifications = notificationsArray.map((item: any) => ({
        id: item.id || item._id || `notif-${Date.now()}`,
        title: item.title || 'Untitled Notification',
        message: item.message || 'No message content',
        created_at: item.created_at || new Date().toISOString(),
        send_at: item.send_at || item.scheduled_at,
        read: item.read || false,
        type: getNotificationType(item),
        details: item.details,
        sender: item.sender || 'System',
        category: getNotificationCategory(item.category),
        priority: getPriority(item.priority),
        status: item.status || 'sent',
        user_id: item.user_id,
        metadata: item.metadata || {}
      })).sort((a: Notification, b: Notification) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setNotifications(transformedNotifications);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await UserService.getAllUsers();
      
      let usersArray = [];
      
      if (response?.success && response?.data?.users) {
        usersArray = response.data.users;
      } else if (Array.isArray(response)) {
        usersArray = response;
      } else if (response?.users) {
        usersArray = response.users;
      } else {
        usersArray = Object.values(response || {}).find(val => Array.isArray(val)) || [];
      }
      
      const transformedUsers: User[] = usersArray.map((user: any) => ({
        id: user._id || user.id,
        name: user.full_name || user.name || user.email,
        email: user.email || '',
        role: user.roles?.[0] || user.role || 'customer'
      }));
      
      setUsers([{
        id: 'all',
        name: 'All Users',
        email: 'all@example.com',
        role: 'All'
      }, ...transformedUsers]);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setUsers([{
        id: 'all',
        name: 'All Users',
        email: 'all@example.com',
        role: 'All'
      }]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const getNotificationType = (item: any): Notification['type'] => {
    const type = (item.type || '').toLowerCase();
    if (type.includes('success')) return 'success';
    if (type.includes('warning')) return 'warning';
    if (type.includes('error')) return 'error';
    if (type.includes('info')) return 'info';
    return 'normal';
  };

  const getNotificationCategory = (category: string = ''): Notification['category'] => {
    const catLower = category.toLowerCase();
    if (catLower.includes('booking')) return 'booking';
    if (catLower.includes('payment')) return 'payment';
    if (catLower.includes('promotion')) return 'promotion';
    if (catLower.includes('alert')) return 'alert';
    return 'system';
  };

  const getPriority = (priority: string = 'normal'): Notification['priority'] => {
    const priorityLower = priority.toLowerCase();
    if (priorityLower === 'low') return 'low';
    if (priorityLower === 'high' || priorityLower === 'urgent') return 'high';
    if (priorityLower === 'medium') return 'medium';
    return 'normal';
  };

  const markAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(prev => prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
      setSelectedNotification(prev => prev?.id === id ? { ...prev, read: true } : prev);
      setSelectedNotifications(prev => prev.filter(notifId => notifId !== id));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markMultipleAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      await Promise.all(selectedNotifications.map(id => NotificationService.markAsRead(id)));
      setNotifications(prev => prev.map(notif => 
        selectedNotifications.includes(notif.id) ? { ...notif, read: true } : notif
      ));
      setSelectedNotifications([]);
    } catch (err) {
      console.error('Error marking multiple as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await NotificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      if (selectedNotification?.id === id) setSelectedNotification(null);
      setSelectedNotifications(prev => prev.filter(notifId => notifId !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const deleteMultipleNotifications = async () => {
    if (selectedNotifications.length === 0) return;
    
    if (!confirm(`Delete ${selectedNotifications.length} notification(s)?`)) return;
    
    try {
      await Promise.all(selectedNotifications.map(id => NotificationService.deleteNotification(id)));
      setNotifications(prev => prev.filter(notif => !selectedNotifications.includes(notif.id)));
      setSelectedNotifications([]);
    } catch (err) {
      console.error('Error deleting multiple notifications:', err);
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      alert('Title and message are required');
      return;
    }

    setCreatingNotification(true);
    try {
      const payload: Record<string, any> = {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        priority: newNotification.priority,
        category: newNotification.category,
        status: newNotification.send_at ? 'scheduled' : 'sent',
        details: newNotification.details,
        created_at: new Date().toISOString(),
        send_at: newNotification.send_at
      };

      if (newNotification.userId && newNotification.userId !== 'all') {
        payload.user_id = newNotification.userId;
      }

      const response = await NotificationService.createNotification(payload);
      
      const newNotif: Notification = {
        id: response.id || `notif-${Date.now()}`,
        title: response.title || newNotification.title,
        message: response.message || newNotification.message,
        created_at: response.created_at || new Date().toISOString(),
        send_at: response.send_at || newNotification.send_at,
        read: false,
        type: getNotificationType(response),
        sender: 'You',
        category: getNotificationCategory(response.category),
        priority: getPriority(response.priority),
        status: response.status || (newNotification.send_at ? 'scheduled' : 'sent'),
        user_id: response.user_id || newNotification.userId,
        details: response.details || newNotification.details
      };
      
      setNotifications(prev => [newNotif, ...prev]);
      setShowCreateModal(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        priority: 'normal',
        userId: '',
        category: 'system',
        details: '',
        send_at: ''
      });
    } catch (err: any) {
      console.error('Error creating notification:', err);
      alert(err?.message || 'Failed to create notification');
    } finally {
      setCreatingNotification(false);
    }
  };

  const openNotification = (notif: Notification) => {
    setSelectedNotification(notif);
    if (!notif.read) markAsRead(notif.id);
  };

  const toggleNotificationSelection = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(notifId => notifId !== id)
        : [...prev, id]
    );
  };

  const selectAllNotifications = () => {
    setSelectedNotifications(prev =>
      prev.length === filteredNotifications.length
        ? []
        : filteredNotifications.map(notif => notif.id)
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = !searchQuery || 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || notif.type === filterType;
    const matchesPriority = filterPriority === 'all' || notif.priority === filterPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getCardColors = (type: string) => {
    const colors: Record<string, { 
      bg: string; 
      border: string; 
      text: string; 
      accent: string;
      gradient: string;
      shadow: string;
    }> = {
      success: {
        bg: 'bg-gradient-to-br from-emerald-400/5 via-emerald-50 to-emerald-100/30',
        border: 'border-emerald-200/40',
        text: 'text-emerald-800',
        accent: 'from-emerald-400 to-emerald-500',
        gradient: 'from-emerald-400/10 via-emerald-50/30 to-emerald-100/20',
        shadow: 'shadow-emerald-100/30'
      },
      warning: {
        bg: 'bg-gradient-to-br from-amber-400/5 via-amber-50 to-amber-100/30',
        border: 'border-amber-200/40',
        text: 'text-amber-800',
        accent: 'from-amber-400 to-amber-500',
        gradient: 'from-amber-400/10 via-amber-50/30 to-amber-100/20',
        shadow: 'shadow-amber-100/30'
      },
      error: {
        bg: 'bg-gradient-to-br from-rose-400/5 via-rose-50 to-rose-100/30',
        border: 'border-rose-200/40',
        text: 'text-rose-800',
        accent: 'from-rose-400 to-rose-500',
        gradient: 'from-rose-400/10 via-rose-50/30 to-rose-100/20',
        shadow: 'shadow-rose-100/30'
      },
      info: {
        bg: 'bg-gradient-to-br from-blue-400/5 via-blue-50 to-blue-100/30',
        border: 'border-blue-200/40',
        text: 'text-blue-800',
        accent: 'from-blue-400 to-blue-500',
        gradient: 'from-blue-400/10 via-blue-50/30 to-blue-100/20',
        shadow: 'shadow-blue-100/30'
      },
      normal: {
        bg: 'bg-gradient-to-br from-indigo-400/5 via-indigo-50 to-indigo-100/30',
        border: 'border-indigo-200/40',
        text: 'text-indigo-800',
        accent: 'from-indigo-400 to-indigo-500',
        gradient: 'from-indigo-400/10 via-indigo-50/30 to-indigo-100/20',
        shadow: 'shadow-indigo-100/30'
      }
    };
    return colors[type] || colors.normal;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, { bg: string; text: string; dot: string }> = {
      low: {
        bg: 'bg-gradient-to-r from-gray-100/80 to-gray-50/80 backdrop-blur-sm',
        text: 'text-gray-700',
        dot: 'bg-gray-400'
      },
      normal: {
        bg: 'bg-gradient-to-r from-blue-100/80 to-blue-50/80 backdrop-blur-sm',
        text: 'text-blue-700',
        dot: 'bg-blue-400'
      },
      medium: {
        bg: 'bg-gradient-to-r from-amber-100/80 to-amber-50/80 backdrop-blur-sm',
        text: 'text-amber-700',
        dot: 'bg-amber-400'
      },
      high: {
        bg: 'bg-gradient-to-r from-rose-100/80 to-rose-50/80 backdrop-blur-sm',
        text: 'text-rose-700',
        dot: 'bg-rose-400'
      }
    };
    return colors[priority] || colors.normal;
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  const formatDateTime = (timeString?: string) => {
    if (!timeString) return 'Not scheduled';
    try {
      const date = new Date(timeString);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  useEffect(() => { 
    fetchNotifications();
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 flex overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : ''} flex flex-col h-screen overflow-hidden`}>
        {/* Fixed Header */}
        <nav className="shrink-0 top-0 z-40 bg-white/95 backdrop-blur-xl shadow-sm border-b border-blue-100/50">
          <div className="px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button 
                  onClick={() => setSidebarOpen(true)} 
                  className="lg:hidden mr-4 p-2 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200"
                >
                  <Menu className="w-5 h-5 text-blue-600" />
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900 font-semibold text-lg">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={fetchNotifications} 
                  className="p-2.5 bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200/50 rounded-xl hover:bg-blue-200/50"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-base">A</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl shadow-lg">
                  <Bell className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
                  <p className="text-gray-600 text-sm">
                    {notifications.length} total • {unreadCount} unread • {selectedNotifications.length} selected
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedNotifications.length > 0 && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100/80 border border-blue-200/50 rounded-xl px-4 py-2 shadow-sm backdrop-blur-sm">
                    <span className="text-blue-700 text-sm font-medium">{selectedNotifications.length} selected</span>
                    <button onClick={markMultipleAsRead} className="p-1.5 hover:bg-emerald-50/50 rounded-lg transition-colors">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </button>
                    <button onClick={deleteMultipleNotifications} className="p-1.5 hover:bg-rose-50/50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Notification</span>
                </button>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-200/50 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-400 shadow-sm transition-all duration-300"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-2xl hover:bg-gray-50/80 transition-all duration-300 shadow-sm hover:shadow"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  {showFilters && (
                    <div className="flex items-center gap-3 animate-fadeIn">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 transition-all"
                      >
                        <option value="all">All Types</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                        <option value="success">Success</option>
                      </select>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400/50 transition-all"
                      >
                        <option value="all">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                    onChange={selectAllNotifications}
                    className="w-5 h-5 text-blue-600 rounded-xl focus:ring-blue-500/50 focus:ring-offset-2 cursor-pointer transition-all"
                  />
                  <span className="text-sm text-gray-600">Select all</span>
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Bell className="w-8 h-8 text-blue-400 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="bg-gradient-to-br from-white to-rose-50/30 rounded-3xl border border-rose-200/50 shadow-lg p-8 text-center backdrop-blur-sm">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full blur-lg opacity-20"></div>
                  <AlertCircle className="relative w-20 h-20 text-rose-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Unable to Load</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <button 
                  onClick={fetchNotifications} 
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                {filteredNotifications.length === 0 ? (
                  <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-3xl border border-blue-200/50 shadow-lg p-8 text-center backdrop-blur-sm">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full blur-lg opacity-20"></div>
                      <Bell className="relative w-24 h-24 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">No notifications found</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your search or create a new notification</p>
                    <button 
                      onClick={() => setShowCreateModal(true)} 
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      Create First Notification
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing <span className="font-semibold text-gray-800">{filteredNotifications.length}</span> notifications
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></div>
                          <span>{unreadCount} unread</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"></div>
                          <span>{notifications.length - unreadCount} read</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredNotifications.map((notif) => {
                        const cardColors = getCardColors(notif.type);
                        const priorityColors = getPriorityColor(notif.priority || 'normal');
                        
                        return (
                          <div
                            key={notif.id}
                            className={`relative group rounded-3xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
                              selectedNotifications.includes(notif.id) 
                                ? 'ring-3 ring-blue-400/50 ring-offset-2' 
                                : ''
                            }`}
                            onClick={(e) => {
                              if (!(e.target as HTMLElement).closest('.action-button')) {
                                openNotification(notif);
                              }
                            }}
                          >
                            {/* Background gradient effect */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${cardColors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                            
                            {/* Main card */}
                            <div className={`relative ${cardColors.bg} border ${cardColors.border} backdrop-blur-sm shadow-lg ${cardColors.shadow} hover:shadow-2xl transition-shadow duration-500`}>
                              
                              {/* Accent strip */}
                              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${cardColors.accent}`}></div>
                              
                              {/* Unread indicator */}
                              {!notif.read && (
                                <div className="absolute top-4 left-4 flex items-center gap-1.5">
                                  <div className="relative">
                                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full animate-pulse"></div>
                                    <div className="absolute inset-0 w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full animate-ping opacity-75"></div>
                                  </div>
                                  <span className="text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">NEW</span>
                                </div>
                              )}
                              
                              {/* Selection checkbox */}
                              <div className="absolute top-4 right-4 z-10 action-button">
                                <input
                                  type="checkbox"
                                  checked={selectedNotifications.includes(notif.id)}
                                  onChange={() => toggleNotificationSelection(notif.id)}
                                  className="w-5 h-5 text-blue-600 rounded-xl border-gray-300/50 focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 cursor-pointer transform transition-transform hover:scale-110 bg-white/80 backdrop-blur-sm"
                                />
                              </div>
                              
                              <div className="p-6">
                                {/* Header */}
                                <div className="mb-5">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className={`font-bold text-lg ${cardColors.text} line-clamp-1`}>
                                      {notif.title}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600 text-xs">
                                    <div className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      <span className="opacity-75">{notif.sender}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span className="opacity-75">{formatTime(notif.created_at)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Message preview with decorative quote */}
                                <div className="relative mb-6">
                                  <div className="absolute -left-1 top-0 text-4xl opacity-20" style={{ fontFamily: 'serif' }}>"</div>
                                  <p className="text-gray-700 text-sm pl-4 line-clamp-3 leading-relaxed">
                                    {notif.message}
                                  </p>
                                </div>
                                
                                {/* Footer with tags and actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-white/20">
                                  <div className="flex flex-wrap gap-2">
                                    <span className={`text-xs px-3 py-1.5 rounded-full ${priorityColors.bg} ${priorityColors.text} font-medium shadow-sm border border-white/30`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${priorityColors.dot} inline-block mr-1.5`}></span>
                                      {notif.priority}
                                    </span>
                                    <span className={`text-xs px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-sm ${cardColors.text} font-medium shadow-sm border border-white/50`}>
                                      {notif.category}
                                    </span>
                                  </div>
                                  
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 action-button">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); openNotification(notif); }} 
                                      className="p-2 hover:bg-white/50 backdrop-blur-sm rounded-xl transition-all duration-300 hover:scale-110 shadow-sm"
                                      title="View details"
                                    >
                                      <Eye className="w-4 h-4 text-blue-600" />
                                    </button>
                                    {!notif.read && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }} 
                                        className="p-2 hover:bg-white/50 backdrop-blur-sm rounded-xl transition-all duration-300 hover:scale-110 shadow-sm"
                                        title="Mark as read"
                                      >
                                        <Check className="w-4 h-4 text-emerald-600" />
                                      </button>
                                    )}
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} 
                                      className="p-2 hover:bg-white/50 backdrop-blur-sm rounded-xl transition-all duration-300 hover:scale-110 shadow-sm"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4 text-rose-600" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Bottom gradient accent */}
                              <div className={`h-1 w-full bg-gradient-to-r ${cardColors.accent} opacity-60`}></div>
                            </div>
                            
                            {/* Glow effect on hover */}
                            <div className={`absolute -inset-1 bg-gradient-to-r ${cardColors.accent} rounded-3xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10`}></div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-white via-white to-blue-50/30 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-white/50 backdrop-blur-xl">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Create Notification</h2>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Send To <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  {loadingUsers ? (
                    <div className="flex items-center px-4 py-3.5 bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200/50 rounded-2xl backdrop-blur-sm">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading users...</span>
                    </div>
                  ) : (
                    <select
                      value={newNotification.userId}
                      onChange={(e) => setNewNotification({ ...newNotification, userId: e.target.value })}
                      className="w-full px-4 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-300/50 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300"
                    >
                      <option value="">Select recipient...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="Enter notification title"
                  className="w-full px-4 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-300/50 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  placeholder="Enter your notification message..."
                  rows={4}
                  className="w-full px-4 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-300/50 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Schedule (Optional)
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-blue-500" />
                  <input
                    type="datetime-local"
                    value={newNotification.send_at}
                    onChange={(e) => setNewNotification({ ...newNotification, send_at: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-300/50 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300"
                  />
                </div>
                <p className="text-sm text-gray-500 pl-1">
                  {newNotification.send_at 
                    ? `created on: ${formatDateTime(newNotification.send_at)}`
                    : 'Will be sent immediately'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Category</label>
                  <select
                    value={newNotification.category}
                    onChange={(e) => setNewNotification({ ...newNotification, category: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-300/50 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300"
                  >
                    <option value="system">normal</option>
                   
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Type</label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-300/50 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300"
                  >
                    <option value="info">payment</option>
                    
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Priority</label>
                  <select
                    value={newNotification.priority}
                    onChange={(e) => setNewNotification({ ...newNotification, priority: e.target.value })}
                    className="w-full px-4 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-300/50 rounded-2xl focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/30 p-6 rounded-b-3xl backdrop-blur-sm">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-gray-300/50 hover:bg-gray-50/80 text-gray-700 rounded-2xl font-bold transition-all duration-300 hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNotification}
                  disabled={creatingNotification || !newNotification.title || !newNotification.message || !newNotification.userId}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl font-bold disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  {creatingNotification ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </span>
                  ) : 'Create Notification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-white via-white to-blue-50/30 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-white/50 backdrop-blur-xl">
            <div className={`p-6 rounded-t-3xl bg-gradient-to-r ${getCardColors(selectedNotification.type).accent}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedNotification.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-white/90 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {selectedNotification.sender}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateTime(selectedNotification.created_at)}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedNotification(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 border border-gray-200/50 backdrop-blur-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Message</h3>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{selectedNotification.message}</p>
                </div>
                
                {selectedNotification.details && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200/50 backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Details</h3>
                    <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">{selectedNotification.details}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/50 rounded-2xl p-4 backdrop-blur-sm">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2">Priority</h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedNotification.priority === 'high' ? 'bg-gradient-to-r from-rose-500 to-pink-500' :
                        selectedNotification.priority === 'medium' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                        'bg-gradient-to-r from-blue-500 to-cyan-500'
                      }`}></div>
                      <p className="font-bold text-lg">{selectedNotification.priority}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200/50 rounded-2xl p-4 backdrop-blur-sm">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2">Scheduled Time</h3>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <p className="font-bold text-lg">{formatDateTime(selectedNotification.send_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => navigator.clipboard.writeText(selectedNotification.message)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-50/80 hover:from-gray-200 hover:to-gray-100 text-gray-700 rounded-2xl font-medium transition-all duration-300 backdrop-blur-sm border border-gray-200/50"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Message
                  </button>
                  {!selectedNotification.read && (
                    <button 
                      onClick={() => {
                        markAsRead(selectedNotification.id);
                        setSelectedNotification(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                    >
                      <Check className="w-4 h-4" />
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/30 p-6 rounded-b-3xl backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  ID: {selectedNotification.id.substring(0, 8)}...
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => deleteNotification(selectedNotification.id)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-50 to-pink-50/80 hover:from-rose-100 hover:to-pink-100 text-rose-700 rounded-2xl font-medium transition-all duration-300 border border-rose-200/50 backdrop-blur-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button 
                    onClick={() => setSelectedNotification(null)}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}