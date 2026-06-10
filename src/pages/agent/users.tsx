import { useState, useEffect } from 'react';
import { User, Eye, X, Mail, Phone, Shield, CheckCircle, XCircle, Calendar, Menu, RefreshCw, Search, Filter, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/agentsidebar';
import UserService from '../../Services/users_service';

interface UserData {
  _id: string;
  email: string;
  phone: string;
  roles: string[];
  full_name: string;
  status: string;
  email_verified: boolean;
  auth_providers: string[];
  created_at: string;
  updated_at: string;
  __v: number;
}

const UsersListScreen = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await UserService.getAllUsers();
      
      console.log('API Response:', response);
      
      let usersData = [];
      
      if (Array.isArray(response)) {
        usersData = response;
      } else if (response && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response && response.data && Array.isArray(response.data.users)) {
        usersData = response.data.users;
      } else if (response && response.users && Array.isArray(response.users)) {
        usersData = response.users;
      } else {
        console.warn('Unexpected API response format:', response);
        setUsers([]);
        return;
      }
      
      const transformedUsers = usersData.map((user: any) => ({
        _id: user._id,
        email: user.email || 'No email provided',
        phone: user.phone || 'No phone provided',
        roles: user.roles || [],
        full_name: user.full_name || 'Unknown User',
        status: user.status || 'unknown',
        email_verified: user.email_verified || false,
        auth_providers: user.auth_providers || [],
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString(),
        __v: user.__v || 0
      }));
      
      setUsers(transformedUsers);
      
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMore = (userId: string) => {
    const user = users.find(u => u._id === userId);
    if (user) {
      setSelectedUser(user);
    }
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };


  const getAvatarInitials = (name: string): string => {
    if (!name || name === 'Unknown User') return 'UU';
    
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
      inactive: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white',
      pending: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
      suspended: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
    };
    return colors[status.toLowerCase()] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
      driver: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
      user: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
      agent: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
      manager: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
    };
    return colors[role.toLowerCase()] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  const filteredUsers = users.filter(user => {
    const matchesTab = selectedTab === 'all' || user.status.toLowerCase() === selectedTab;
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col lg:ml-74">
        {/* Navbar */}
        <nav className="fixed top-0 right-0 left-0 lg:left-74 z-40 bg-white/95 backdrop-blur-xl shadow-lg border-b border-slate-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              <div className="flex items-center">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3 p-2 rounded-xl bg-gradient-to-r from-slate-100 to-blue-50 hover:from-slate-200 hover:to-blue-100 transition-all">
                  <Menu className="w-5 h-5 text-slate-700" />
                </button>
                <div className="hidden sm:flex items-center space-x-2 text-sm">
                  <span className="text-slate-600">Dashboard</span>
                  <span className="text-slate-300">›</span>
                  <span className="font-bold bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent">Users Management</span>
                </div>
                <div className="sm:hidden">
                  <span className="font-bold text-lg bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent">Users</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-800">System Admin</p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-700 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">SA</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pt-16 sm:pt-20">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

            {/* Error State */}
            {error && (
              <div className="bg-gradient-to-r from-rose-50/90 to-rose-100/70 rounded-2xl shadow-xl p-5 sm:p-7 mb-7 sm:mb-9 border border-rose-200/60 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 flex items-center justify-center shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-rose-800 font-bold text-lg">Error loading users</p>
                    <p className="text-rose-700 text-sm mt-1">{error}</p>
                  </div>
                  <button
                    onClick={fetchUsers}
                    className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Header with Stats */}
            <div className="mb-7 sm:mb-9">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Users Directory</h1>
                  <p className="text-slate-600">Manage and view all registered users in the system</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50/80 to-cyan-50/50 rounded-xl px-4 py-2.5 border border-slate-200/60">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-slate-700">
                      <span className="font-bold text-slate-900">{users.length}</span> user{users.length !== 1 ? 's' : ''} total
                    </p>
                  </div>
                  <button
                    onClick={fetchUsers}
                    className="p-3 rounded-xl bg-gradient-to-r from-slate-100 to-blue-50 hover:from-slate-200 hover:to-blue-100 text-slate-700 shadow-sm"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-7 mb-7 sm:mb-9 border border-slate-200/60">
              <div className="flex flex-col gap-5">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-cyan-500/5 rounded-2xl -m-1 group-hover:opacity-100 opacity-0 transition-opacity"></div>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, phone, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="relative w-full pl-12 pr-4 py-3.5 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white/50"
                  />
                </div>
                <div className="hidden sm:flex gap-2">
                  {['all', 'active', 'inactive', 'pending', 'suspended'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        selectedTab === tab
                          ? 'bg-gradient-to-r from-blue-700 to-cyan-500 text-white shadow-lg'
                          : 'bg-gradient-to-r from-slate-100 to-blue-50 text-slate-700 hover:shadow-md'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setShowMobileFilters(true)} 
                  className="sm:hidden flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-100 to-blue-50 text-slate-700 rounded-xl font-bold"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Users Count */}
            <div className="mb-5">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-50/80 to-green-50/50 rounded-xl px-4 py-2.5 border border-slate-200/60">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-600 to-green-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <p className="text-slate-700">
                  Showing <span className="font-bold text-slate-900">{filteredUsers.length}</span> user{filteredUsers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Users Grid */}
            {filteredUsers.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-10 sm:p-14 text-center border border-slate-200/60">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400" />
                </div>
                <p className="text-xl sm:text-2xl text-slate-700 font-bold mb-2">No users found</p>
                <p className="text-slate-500">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
                {filteredUsers.map((user) => (
                  <div 
                    key={user._id}
                    className="group bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-xl overflow-hidden border border-slate-200/60 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {getAvatarInitials(user.full_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 truncate mb-1">{user.full_name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(user.status)}`}>
                              {user.status}
                            </span>
                            {user.email_verified ? (
                              <span className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700 rounded-lg text-xs">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-rose-500/10 to-rose-600/10 text-rose-700 rounded-lg text-xs">
                                <XCircle className="w-3 h-3" />
                                Unverified
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {user.roles.map((role, index) => (
                              <span key={index} className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getRoleBadgeColor(role)}`}>
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-slate-700">
                          <Mail className="w-4 h-4 text-blue-500 mr-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-700">
                          <Phone className="w-4 h-4 text-blue-500 mr-3 flex-shrink-0" />
                          <span className="truncate">{user.phone}</span>
                        </div>
                        <div className="flex items-center text-sm text-slate-700">
                          <Calendar className="w-4 h-4 text-blue-500 mr-3 flex-shrink-0" />
                          <span className="truncate">Joined {formatDate(user.created_at).split(',')[0]}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewMore(user._id)}
                        className="w-full py-3 bg-gradient-to-r from-blue-700 to-cyan-500 hover:from-blue-800 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                      >
                        <Eye className="w-5 h-5" />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-white to-slate-50/80 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/60">
              <div className="sticky top-0 bg-gradient-to-r from-white to-blue-50/50 backdrop-blur-sm border-b border-slate-200/60 px-7 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">User Details</h2>
                    <p className="text-slate-600 text-sm">ID: {selectedUser._id}</p>
                  </div>
                </div>
                <button onClick={handleCloseModal} className="p-2.5 hover:bg-slate-100 rounded-xl">
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              <div className="p-7 space-y-7">
                {/* User Profile Section */}
                <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 border border-slate-200/60">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                      {getAvatarInitials(selectedUser.full_name)}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedUser.full_name}</h3>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-3">
                        <span className={`px-4 py-2 rounded-xl font-bold ${getStatusColor(selectedUser.status)}`}>
                          {selectedUser.status}
                        </span>
                        {selectedUser.email_verified ? (
                          <span className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700 font-bold rounded-xl">
                            <CheckCircle className="w-4 h-4" />
                            Email Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500/10 to-rose-600/10 text-rose-700 font-bold rounded-xl">
                            <XCircle className="w-4 h-4" />
                            Email Unverified
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        {selectedUser.roles.map((role, index) => (
                          <span key={index} className={`px-3 py-1.5 rounded-lg font-bold ${getRoleBadgeColor(role)}`}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl p-6 border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Contact Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className="w-5 h-5 text-blue-500" />
                          <p className="text-sm text-slate-500">Email Address</p>
                        </div>
                        <p className="font-bold text-slate-800 text-lg">{selectedUser.email}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                        <div className="flex items-center gap-3 mb-2">
                          <Phone className="w-5 h-5 text-blue-500" />
                          <p className="text-sm text-slate-500">Phone Number</p>
                        </div>
                        <p className="font-bold text-slate-800 text-lg">{selectedUser.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl p-6 border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-r from-purple-500/10 to-violet-500/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Account Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                          <p className="text-sm text-slate-500 mb-2">User ID</p>
                          <p className="font-bold text-slate-800 text-sm truncate">{selectedUser._id}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                          <p className="text-sm text-slate-500 mb-2">Database Version</p>
                          <p className="font-bold text-slate-800 text-lg">v{selectedUser.__v}</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                        <p className="text-sm text-slate-500 mb-2">Authentication Providers</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.auth_providers.length > 0 ? (
                            selectedUser.auth_providers.map((provider, index) => (
                              <span key={index} className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 font-bold rounded-lg">
                                {provider}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500">No external auth providers</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-white to-amber-50/30 rounded-2xl p-6 border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Timestamps</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Account Created</p>
                            <p className="font-bold text-slate-800">{formatDate(selectedUser.created_at)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-emerald-50/50 to-green-50/50 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Last Updated</p>
                            <p className="font-bold text-slate-800">{formatDate(selectedUser.updated_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-gradient-to-r from-slate-100 to-blue-50 hover:from-slate-200 hover:to-blue-100 text-slate-700 font-bold rounded-xl"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setShowMobileFilters(false)}>
            <div className="absolute right-0 top-0 h-full w-64 bg-white p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Filter Users</h3>
                <button onClick={() => setShowMobileFilters(false)} className="p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {['all', 'active', 'inactive', 'pending', 'suspended'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setSelectedTab(tab);
                      setShowMobileFilters(false);
                    }}
                    className={`w-full px-4 py-3 rounded-lg font-semibold text-left ${
                      selectedTab === tab 
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white' 
                        : 'bg-gradient-to-r from-slate-100 to-blue-50 text-slate-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UsersListScreen;