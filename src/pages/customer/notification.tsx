import { useState, useEffect } from 'react';
import { Bell, Check, CheckCircle, AlertCircle, Info, Clock, Menu, X, Search } from 'lucide-react';
import Sidebar from '../../components/CustomerSidebar';
import NotificationService from '../../Services/notification_service';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
  details?: string;
  sender?: string;
  category?: 'booking' | 'payment' | 'system' | 'promotion' | 'alert';
  priority?: 'low' | 'medium' | 'high';
  metadata?: any;
}

export default function NotificationScreen() {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get notifications from the service
      // If it fails, fall back to a different approach
      let response;
      try {
        // First try the main notifications endpoint via getAllNotifications
        response = await NotificationService.getAllNotifications();
      } catch (serviceError: any) {
        console.log('Service error, trying alternative approach:', serviceError);
        // If service fails, we'll show empty state
        throw new Error('Unable to fetch notifications at this time');
      }
      
      let notificationsArray = [];
      
      if (Array.isArray(response)) {
        notificationsArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        notificationsArray = response.data;
      } else if (response?.notifications && Array.isArray(response.notifications)) {
        notificationsArray = response.notifications;
      } else if (response?.items && Array.isArray(response.items)) {
        notificationsArray = response.items;
      }

      if (notificationsArray.length === 0) {
        setNotifications([]);
      } else {
        const transformedNotifications = notificationsArray.map((item: any, index: number) => ({
          id: item.id || item._id || `notif-${Date.now()}-${index}`,
          title: item.title || item.subject || `Notification ${index + 1}`,
          message: item.message || item.content || item.body || item.description || 'New notification received',
          created_at: item.created_at || item.createdAt || item.timestamp || new Date().toISOString(),
          read: item.read || item.isRead || item.status === 'read' || false,
          type: getNotificationType(item.type, item.priority),
          details: item.details || item.message || item.content || '',
          sender: item.sender || item.from || item.createdBy || 'System',
          category: getNotificationCategory(item.category),
          priority: item.priority || (item.urgent ? 'high' : 'medium'),
          metadata: item.metadata || item.data || item.payload || {}
        }));
        
        setNotifications(transformedNotifications);
      }
    } catch (err: any) {
      console.error('API Error:', err);
      
      // Check for specific backend error
      if (err.message?.includes('buildMineAudienceFilter') || 
          err.response?.data?.message?.includes('buildMineAudienceFilter')) {
        setError('Notification service is temporarily undergoing maintenance. Please check back later.');
      } else {
        setError(err.message || 'Failed to load notifications. Please try again.');
      }
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationType = (type: string, priority: string): Notification['type'] => {
    if (!type) {
      if (priority === 'high') return 'error';
      if (priority === 'medium') return 'warning';
      return 'info';
    }
    
    const typeLower = type.toLowerCase();
    if (typeLower.includes('success')) return 'success';
    if (typeLower.includes('warning') || typeLower.includes('alert')) return 'warning';
    if (typeLower.includes('error') || typeLower.includes('failed')) return 'error';
    if (typeLower.includes('promotion') || typeLower.includes('offer') || typeLower.includes('discount')) return 'promotion';
    return 'info';
  };

  const getNotificationCategory = (category: string): Notification['category'] => {
    if (!category) return 'system';
    const catLower = category.toLowerCase();
    if (catLower.includes('booking') || catLower.includes('reservation')) return 'booking';
    if (catLower.includes('payment') || catLower.includes('billing')) return 'payment';
    if (catLower.includes('promotion') || catLower.includes('marketing')) return 'promotion';
    if (catLower.includes('alert') || catLower.includes('security')) return 'alert';
    return 'system';
  };

  const markAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(prev => prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
      if (selectedNotification?.id === id) {
        setSelectedNotification(prev => prev ? { ...prev, read: true } : null);
      }
    } catch (err) {
      console.error('Error marking as read:', err);
      // Still update UI even if API fails
      setNotifications(prev => prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
    }
  };

  const performNotificationAction = async (id: string) => {
    try {
      await NotificationService.performAction(id);
      // Refresh notifications after performing action
      fetchNotifications();
    } catch (err) {
      console.error('Error performing action:', err);
      alert('Action could not be completed. Please try again.');
    }
  };

  const openNotification = (notif: Notification) => {
    setSelectedNotification(notif);
    if (!notif.read) markAsRead(notif.id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const closePopup = () => setSelectedNotification(null);

  const filteredNotifications = notifications.filter(notif => 
    searchQuery === '' || 
    notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notif.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notif.sender?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeColor = (type: string) => {
    const colors = {
      success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      warning: 'bg-amber-100 text-amber-800 border-amber-200',
      error: 'bg-rose-100 text-rose-800 border-rose-200',
      promotion: 'bg-violet-100 text-violet-800 border-violet-200',
      info: 'bg-sky-100 text-sky-800 border-sky-200'
    };
    return colors[type as keyof typeof colors] || colors.info;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      success: <CheckCircle className="w-5 h-5" />,
      warning: <AlertCircle className="w-5 h-5" />,
      error: <X className="w-5 h-5" />,
      promotion: <Bell className="w-5 h-5" />,
      info: <Info className="w-5 h-5" />
    };
    return icons[type as keyof typeof icons] || icons.info;
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const badges = {
      high: <span className="px-2 py-1 bg-rose-100 text-rose-800 text-xs rounded-full">High</span>,
      medium: <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">Medium</span>,
      low: <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded-full">Low</span>
    };
    return badges[priority as keyof typeof badges];
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
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  useEffect(() => { 
    fetchNotifications(); 
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/5 via-cyan-100/30 to-blue-500/10 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content - Aligned to Left */}
      <div className="flex-1">
        <nav className="fixed top-0 right-0 left-0 z-40 bg-white/90 backdrop-blur-xl shadow-sm border-b border-blue-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3 sm:mr-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200">
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Notifications</span>
                  <span className="text-gray-300">›</span>
                  <span className="text-gray-900 font-semibold">All Notifications</span>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={fetchNotifications} className="p-2 hover:bg-gray-100 rounded-xl" title="Refresh">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <div className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 cursor-pointer">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-800">John Doe</p>
                    <p className="text-xs text-gray-500">Customer</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-800 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-semibold text-xs sm:text-sm">JD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-16 sm:pt-20">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 bg-blue-100 rounded-xl">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Notifications</h1>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {loading ? 'Loading...' : `${unreadCount} unread • ${notifications.length} total`}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setOnlyUnread(!onlyUnread)}
                  disabled={loading}
                  className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 justify-center sm:justify-start ${
                    loading ? 'bg-gray-100 text-gray-400' :
                    onlyUnread ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span className="text-sm sm:text-base">{onlyUnread ? 'Show All' : 'Unread Only'}</span>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">Loading notifications...</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Fetching your notifications...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 text-center">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2 sm:mb-3">Unable to Load Notifications</h3>
                <p className="text-gray-500 text-sm sm:text-base mb-4">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={fetchNotifications} className="px-5 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm sm:text-base">
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Grid */}
            {!loading && !error && (
              <>
                {filteredNotifications.length === 0 ? (
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-12 text-center">
                    <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2 sm:mb-3">
                      {onlyUnread ? 'No unread notifications' : 'No notifications found'}
                    </h3>
                    <p className="text-gray-500 text-sm sm:text-base mb-4">
                      {searchQuery ? 'Try a different search term' : 'You don\'t have any notifications yet'}
                    </p>
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="px-5 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm sm:text-base">
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => openNotification(notif)}
                        className={`bg-white rounded-xl sm:rounded-2xl shadow-lg border hover:shadow-xl hover:-translate-y-0.5 sm:hover:-translate-y-1 cursor-pointer transition-all duration-300 ${
                          notif.read ? 'border-gray-100 hover:border-blue-200' : 'border-blue-300 border-l-4 border-l-blue-500'
                        }`}
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 sm:p-2 rounded-lg ${getTypeColor(notif.type)}`}>
                                {getTypeIcon(notif.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className={`font-bold text-base sm:text-lg truncate ${!notif.read ? 'text-blue-900' : 'text-gray-800'}`}>
                                  {notif.title}
                                </h3>
                                <div className="mt-1 flex items-center gap-2 flex-wrap">
                                  {getPriorityBadge(notif.priority)}
                                  {notif.category && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full truncate max-w-[120px]">
                                      {notif.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {!notif.read && <span className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full animate-pulse flex-shrink-0 mt-2"></span>}
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{notif.message}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatTime(notif.created_at)}</span>
                              </div>
                              {notif.sender && notif.sender !== 'System' && (
                                <span className="bg-gray-100 px-2 py-1 rounded-full truncate max-w-[80px] sm:max-w-[100px]">
                                  {notif.sender}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notif.read && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }} 
                                  className="p-1 sm:p-1.5 hover:bg-emerald-50 rounded-lg"
                                  title="Mark as read"
                                >
                                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white w-full max-w-3xl lg:max-w-4xl max-h-[90vh] sm:max-h-[85vh] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className={`p-4 sm:p-6 ${getTypeColor(selectedNotification.type)} relative`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 sm:gap-4 max-w-[85%]">
                  <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white shadow-lg ${getTypeColor(selectedNotification.type).split(' ')[2]} flex-shrink-0`}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                      {getTypeIcon(selectedNotification.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 truncate sm:line-clamp-2">{selectedNotification.title}</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-gray-700 text-xs sm:text-sm">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="font-medium truncate">{selectedNotification.sender || 'System'}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span>{formatTime(selectedNotification.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={closePopup} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-xl flex-shrink-0 ml-2">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-blue-50 rounded-xl p-4 sm:p-6 border border-blue-100">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Message</h3>
                  <p className="text-gray-700 text-sm sm:text-base">{selectedNotification.message}</p>
                </div>
                
                {selectedNotification.details && selectedNotification.details.trim() !== '' && (
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Details</h3>
                    <div className="text-gray-600 text-sm sm:text-base whitespace-pre-line">
                      {selectedNotification.details}
                    </div>
                  </div>
                )}

                {/* Action Button if needed */}
                {selectedNotification.metadata?.actionUrl && (
                  <div className="mt-6">
                    <button 
                      onClick={() => performNotificationAction(selectedNotification.id)}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm sm:text-base"
                    >
                      Perform Action
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                  <span className="font-medium">Notification ID:</span> {selectedNotification.id}
                </div>
                <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-2">
                  <button onClick={closePopup} className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex-1 sm:flex-none text-sm sm:text-base">
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