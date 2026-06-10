import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllUsers , 
    deleteUser,
  createUser,
  getErrorDisplay,
  type IUser,
  type IUsersResponse,
  type CreateUserPayload
} from "../../Services/adminAndManager/admi_users_service";
import ManagerSidebar from "../../components/ManagerSideBar";
import {
  Search,
  Trash2,
  Eye,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Calendar,
  Key,
  Save,
} from "lucide-react";

const ManagerUsersPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Modal states
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Form states
  const [addForm, setAddForm] = useState<CreateUserPayload>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    roles: ["customer"],
  });

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response: IUsersResponse = await fetchAllUsers(
        pagination.page,
        pagination.limit,
        searchTerm || undefined
      );

      setUsers(response.data.users);
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages,
      });
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      setError(errorDisplay.message || "Failed to load users");
      showSnackbar(errorDisplay.message, "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm]);

  // Initial load
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      showSnackbar("User deleted successfully", "success");
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle add user
  const handleAddUser = async () => {
    try {
      setIsCreatingUser(true);
      await createUser(addForm);
      showSnackbar("User created successfully", "success");
      setIsAddModalOpen(false);
      setAddForm({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        roles: ["customer"],
      });
      loadUsers();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
    finally{
        setIsCreatingUser(false);
    }
  };

  // View profiles for user
  const handleViewProfiles = (user: IUser) => {
    navigate(`/admin/user-profiles/${user._id}`, {
      state: { user }
    });
  };

  const handleViewDetails = (user: IUser) => {
  setSelectedUser(user);
  setIsDetailsModalOpen(true);
};

  // Filter users
  const filteredUsers = users.filter(user => {
    if (statusFilter !== "all" && user.status !== statusFilter) return false;
    if (roleFilter !== "all" && !user.roles?.includes(roleFilter)) return false;
    return true;
  });

  // Get status badge color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "suspended": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-800";
      case "driver": return "bg-blue-100 text-blue-800";
      case "agent": return "bg-indigo-100 text-indigo-800";
      case "customer": return "bg-cyan-100 text-cyan-800";
      case "manager": return "bg-amber-100 text-amber-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar - Fixed */}
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area - Flex column to stack header and scrollable content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage users and their profiles</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold">{pagination.total}</span> users
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
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
                      placeholder="Search users by name, email, or phone..."
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
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="agent">Agent</option>
                      <option value="manager">Manager</option>
                      <option value="customer">Customer</option>
                    </select>
                    <Shield className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="px-6 pb-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                  <p className="text-red-600 text-center mb-4">{error}</p>
                  <button
                    onClick={loadUsers}
                    className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <User className="w-20 h-20 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No users found</p>
                  <p className="text-gray-400 text-center mb-6">
                    {searchTerm || statusFilter !== "all" || roleFilter !== "all"
                      ? "Try adjusting your filters or search terms"
                      : "Get started by adding your first user"}
                  </p>
                  {!searchTerm && statusFilter === "all" && roleFilter === "all" && (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                    >
                      Add User
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Roles</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1EA2E4] to-[#0F6FA8] flex items-center justify-center text-white font-semibold shadow-sm">
                                    {user.full_name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-semibold text-gray-900">{user.full_name}</div>
                                  <div className="text-xs text-gray-500 font-mono">ID: {user._id.slice(-8)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                              {user.phone && (
                                <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                  <Phone className="w-3 h-3" />
                                  {user.phone}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {user.roles?.map((role) => (
                                  <span
                                    key={role}
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(role)}`}
                                  >
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                                  {user.status?.toUpperCase() || "PENDING"}
                                </span>
                                {user.email_verified && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(user.created_at)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                               <button
                                    onClick={() => handleViewDetails(user)}
                                    className="p-2 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                    title="View Details"
                                    >
                                    <Eye className="w-4 h-4" />
                                    </button>
                                <button
                                  onClick={() => setUserToDelete(user._id)}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden">
                    {filteredUsers.map((user) => (
                      <div key={user._id} className="p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1EA2E4] to-[#0F6FA8] flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <h3 className="text-sm font-semibold text-gray-900">{user.full_name}</h3>
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</p>
                              <div className="flex items-center mt-1 space-x-2">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                                  {user.status || "pending"}
                                </span>
                                {user.roles?.slice(0, 2).map((role) => (
                                  <span
                                    key={role}
                                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor(role)}`}
                                  >
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                           <button
                                onClick={() => handleViewDetails(user)}
                                className="p-2 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                title="View Details"
                                >
                                <Eye className="w-4 h-4" />
                                </button>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone || "No phone"}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(user.created_at)}
                            </div>
                          </div>
                          <button
                            onClick={() => setUserToDelete(user._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{" "}
                        <span className="font-semibold">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{" "}
                        of <span className="font-semibold">{pagination.total}</span> users
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={pagination.page === 1}
                          className={`px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${pagination.page === 1
                              ? "text-gray-400 cursor-not-allowed bg-gray-50"
                              : "text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                            }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-700 px-2">
                          Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={pagination.page >= pagination.totalPages}
                          className={`px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${pagination.page >= pagination.totalPages
                              ? "text-gray-400 cursor-not-allowed bg-gray-50"
                              : "text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                            }`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDetailsModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">User Details</h2>
                <p className="text-sm text-gray-600">View user information</p>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="flex items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1EA2E4] to-[#0F6FA8] flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                  {selectedUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-6">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedUser.full_name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status?.toUpperCase() || "PENDING"}
                    </span>
                    {selectedUser.email_verified && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-gray-900 font-medium">{selectedUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-gray-900 font-medium">{selectedUser.phone || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Account Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">User ID</p>
                        <p className="text-sm font-mono text-gray-900 break-all">{selectedUser._id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-sm text-gray-900 font-medium">{formatDate(selectedUser.created_at)}</p>
                      </div>
                      {selectedUser.updated_at && (
                        <div>
                          <p className="text-xs text-gray-500">Last Updated</p>
                          <p className="text-sm text-gray-900 font-medium">{formatDate(selectedUser.updated_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Roles & Permissions</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Assigned Roles</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.roles?.map((role) => (
                            <span
                              key={role}
                              className={`px-3 py-1.5 text-sm font-medium rounded-full ${getRoleColor(role)}`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Online Status</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${selectedUser.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm text-gray-900">
                            {selectedUser.isOnline ? 'Currently Online' : 'Offline'}
                          </span>
                        </div>
                        {selectedUser.lastSeen && (
                          <p className="text-xs text-gray-500 mt-1">
                            Last seen: {formatDate(selectedUser.lastSeen.toString())}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Profile Information</h4>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        This user has {selectedUser.roles?.length || 0} assigned roles and can have multiple profiles.
                      </p>
                      <button
                        onClick={() => {
                          setIsDetailsModalOpen(false);
                          handleViewProfiles(selectedUser);
                        }}
                        className="w-full px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View All Profiles
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Side Modal */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ease-in-out ${isAddModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isAddModalOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsAddModalOpen(false)}
        />

        <div className={`absolute inset-y-0 right-0 flex max-w-full pl-10 transition-transform duration-300 ease-in-out ${isAddModalOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="relative w-screen max-w-md">
            <div className="flex flex-col h-full bg-white shadow-xl">
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Add New User</h2>
                    <p className="text-sm text-gray-600">Create a new user account</p>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addForm.full_name}
                      onChange={(e) => setAddForm(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={addForm.phone || ''}
                      onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      placeholder="+1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={addForm.password}
                        onChange={(e) => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent pr-10"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Assign Roles
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['customer', 'agent', 'manager', 'admin'].map((role) => (
                        <label
                          key={role}
                          className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${addForm.roles?.includes(role)
                              ? 'border-[#1EA2E4] bg-[#1EA2E4]/5'
                              : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={addForm.roles?.includes(role) || false}
                            onChange={(e) => {
                              const newRoles = e.target.checked
                                ? [...(addForm.roles || []), role]
                                : (addForm.roles || []).filter(r => r !== role);
                              setAddForm(prev => ({ ...prev, roles: newRoles }));
                            }}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${addForm.roles?.includes(role)
                                ? 'bg-[#1EA2E4] text-white'
                                : 'bg-gray-100 text-gray-400'
                              }`}>
                              <Shield className="w-4 h-4" />
                            </div>
                            <span className={`text-sm font-medium capitalize ${addForm.roles?.includes(role)
                                ? 'text-[#1EA2E4]'
                                : 'text-gray-700'
                              }`}>
                              {role}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      User will be able to create profiles for selected roles
                    </p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                 <button
                    onClick={handleAddUser}
                    disabled={!addForm.full_name || !addForm.email || !addForm.password || isCreatingUser}
                    className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCreatingUser ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Create User</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setUserToDelete(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this user? All associated profiles and data will be permanently removed.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(userToDelete)}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${snackbar.type === "success" ? "bg-green-50 border border-green-200 text-green-800" :
              snackbar.type === "error" ? "bg-red-50 border border-red-200 text-red-800" :
                "bg-blue-50 border border-blue-200 text-blue-800"
            }`}>
            {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{snackbar.message}</span>
            <button
              onClick={() => setSnackbar(prev => ({ ...prev, show: false }))}
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

export default ManagerUsersPage;