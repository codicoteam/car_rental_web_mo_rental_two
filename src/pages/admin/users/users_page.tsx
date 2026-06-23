import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllUsers,
  deleteUser,
  createUser,
  createManagerProfile,
  createBranchReceptionistProfile,
  getErrorDisplay,
  type IUser,
  type IUsersResponse,
  type CreateUserPayload,
} from "../../../Services/adminAndManager/admi_users_service";
import {
  fetchBranches,
  type IBranch,
} from "../../../Services/adminAndManager/admin_branch_service";
import Sidebar from "../../../components/Sidebar";
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
  Building2,
  Users,
  Crown,
  Headphones,
  BarChart3,
  UserCheck,
  ChevronDown,
  MapPin,
} from "lucide-react";

// ── Role configuration ──────────────────────────────────────────────────────

const ROLE_CONFIG: {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  selectedBg: string;
  selectedBorder: string;
  needsBranch?: boolean;
}[] = [
  {
    id: "customer",
    label: "Customer",
    description: "Can browse and book vehicles",
    icon: User,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-gray-200",
    selectedBg: "bg-teal-50",
    selectedBorder: "border-teal-500",
  },
  {
    id: "agent",
    label: "Agent",
    description: "Assists customers with reservations",
    icon: UserCheck,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-gray-200",
    selectedBg: "bg-indigo-50",
    selectedBorder: "border-indigo-500",
  },
  {
    id: "manager",
    label: "Branch Manager",
    description: "Manages branch operations & staff",
    icon: Building2,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-gray-200",
    selectedBg: "bg-amber-50",
    selectedBorder: "border-amber-500",
    needsBranch: true,
  },
  {
    id: "branch_receptionist",
    label: "Receptionist",
    description: "Front-desk operations at a branch",
    icon: Headphones,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-gray-200",
    selectedBg: "bg-sky-50",
    selectedBorder: "border-sky-500",
    needsBranch: true,
  },
  {
    id: "executive_admin",
    label: "Executive Admin",
    description: "Read-only business overview & reports",
    icon: BarChart3,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-gray-200",
    selectedBg: "bg-purple-50",
    selectedBorder: "border-purple-500",
  },
  {
    id: "admin",
    label: "Administrator",
    description: "Full system access & configuration",
    icon: Crown,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-gray-200",
    selectedBg: "bg-rose-50",
    selectedBorder: "border-rose-500",
  },
];

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-rose-100 text-rose-800",
  driver: "bg-blue-100 text-blue-800",
  agent: "bg-indigo-100 text-indigo-800",
  customer: "bg-teal-100 text-teal-800",
  manager: "bg-amber-100 text-amber-800",
  branch_receptionist: "bg-sky-100 text-sky-800",
  executive_admin: "bg-purple-100 text-purple-800",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const getStatusColor = (status?: string) => {
  switch (status) {
    case "active": return "bg-green-100 text-green-800";
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "suspended": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

const formatRoleLabel = (role: string) => {
  const found = ROLE_CONFIG.find(r => r.id === role);
  return found ? found.label : role;
};

// ── Component ────────────────────────────────────────────────────────────────

const UsersPage: React.FC = () => {
  const navigate = useNavigate();

  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal states
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Add-user form
  const [addForm, setAddForm] = useState<CreateUserPayload>({
    full_name: "", email: "", phone: "", password: "", roles: [],
  });
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  // Branches
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false, message: "", type: "info",
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Derived ──
  const needsBranch = (addForm.roles || []).some(r => r === "manager" || r === "branch_receptionist");

  // ── Data loading ──
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: IUsersResponse = await fetchAllUsers(pagination.page, pagination.limit, searchTerm || undefined);
      setUsers(response.data.users);
      setPagination({ page: response.data.page, limit: response.data.limit, total: response.data.total, totalPages: response.data.totalPages });
    } catch (err) {
      const e = getErrorDisplay(err);
      setError(e.message || "Failed to load users");
      showSnackbar(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const loadBranches = async () => {
    if (branches.length > 0) return;
    setBranchesLoading(true);
    try {
      const res = await fetchBranches();
      setBranches(res.data || []);
    } catch {
      /* silently fail — user can still submit without branch */
    } finally {
      setBranchesLoading(false);
    }
  };

  useEffect(() => {
    if (needsBranch) loadBranches();
  }, [needsBranch]);

  // ── Snackbar ──
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => setSnackbar(prev => ({ ...prev, show: false })), 4000);
  };

  // ── Handlers ──
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      showSnackbar("User deleted successfully", "success");
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      showSnackbar(getErrorDisplay(err).message, "error");
    }
  };

  const handleAddUser = async () => {
    if (!addForm.full_name || !addForm.email || !addForm.password) return;
    setIsSubmitting(true);
    try {
      const created = await createUser(addForm) as any;
      const newUserId: string = created?._id || created?.data?._id || created?.userId || created?.id;
      const newUserName: string = addForm.full_name;

      // Create branch-linked profiles if needed
      if (newUserId && selectedBranchIds.length > 0) {
        const roles = addForm.roles || [];
        if (roles.includes("manager")) {
          await createManagerProfile(newUserId, selectedBranchIds, addForm.full_name).catch(() => {});
        }
        if (roles.includes("branch_receptionist")) {
          await createBranchReceptionistProfile(newUserId, selectedBranchIds, addForm.full_name).catch(() => {});
        }
      }

      setIsAddModalOpen(false);
      resetForm();
      loadUsers();

      // Prompt to create customer profile if customer role included
      const isCustomer = (addForm.roles || []).includes("customer");
      if (isCustomer && newUserId) {
        const go = window.confirm(
          `User "${newUserName}" created successfully.\n\nWould you like to create their customer profile now?`
        );
        if (go) {
          navigate(`/admin/user-profiles/${newUserId}`, {
            state: { user: { _id: newUserId, full_name: newUserName, email: addForm.email, roles: addForm.roles } },
          });
          return;
        }
      }

      showSnackbar("User created successfully", "success");
    } catch (err) {
      showSnackbar(getErrorDisplay(err).message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAddForm({ full_name: "", email: "", phone: "", password: "", roles: [] });
    setSelectedBranchIds([]);
    setShowPassword(false);
    setBranchDropdownOpen(false);
  };

  const toggleRole = (role: string) => {
    const current = addForm.roles || [];
    const updated = current.includes(role) ? current.filter(r => r !== role) : [...current, role];
    setAddForm(prev => ({ ...prev, roles: updated }));
    if (!updated.includes("manager") && !updated.includes("branch_receptionist")) {
      setSelectedBranchIds([]);
    }
  };

  const toggleBranch = (branchId: string) => {
    setSelectedBranchIds(prev =>
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  const handleViewProfiles = (user: IUser) => {
    navigate(`/admin/user-profiles/${user._id}`, { state: { user } });
  };

  const filteredUsers = users.filter(u => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (roleFilter !== "all" && !u.roles?.includes(roleFilter)) return false;
    return true;
  });

  const selectedBranchNames = selectedBranchIds
    .map(id => branches.find(b => b._id === id)?.name)
    .filter(Boolean)
    .join(", ");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#0A1628]">Users Management</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage accounts, roles, and branch assignments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                Total: <span className="font-semibold text-[#0A1628]">{pagination.total}</span> users
              </div>
              <button
                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#00AEEF] text-white rounded-xl hover:bg-[#0099D4] transition-colors font-semibold shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable area */}
        <div className="flex-1 overflow-y-auto">
          {/* Filters */}
          <div className="p-6 pb-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white appearance-none pr-9 min-w-[130px]"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF] bg-white appearance-none pr-9 min-w-[150px]"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="branch_receptionist">Receptionist</option>
                      <option value="executive_admin">Executive Admin</option>
                      <option value="agent">Agent</option>
                      <option value="customer">Customer</option>
                      <option value="driver">Driver</option>
                    </select>
                    <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="px-6 pb-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#00AEEF]" />
                    <p className="text-sm text-gray-500">Loading users…</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <AlertCircle className="w-14 h-14 text-red-400 mb-3" />
                  <p className="text-red-600 text-center mb-4 text-sm">{error}</p>
                  <button onClick={loadUsers} className="px-4 py-2 bg-[#00AEEF] text-white rounded-lg text-sm hover:bg-[#0099D4]">Retry</button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <Users className="w-16 h-16 text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium mb-1">No users found</p>
                  <p className="text-gray-400 text-sm text-center mb-5">
                    {searchTerm || statusFilter !== "all" || roleFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Get started by adding your first user"}
                  </p>
                  {!searchTerm && statusFilter === "all" && roleFilter === "all" && (
                    <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-[#00AEEF] text-white rounded-lg text-sm hover:bg-[#0099D4]">Add User</button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          {["User", "Contact", "Roles", "Status", "Joined", "Actions"].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredUsers.map(user => (
                          <tr key={user._id} className="hover:bg-[#F0F9FF] transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#1A5FA8] flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                                  {user.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-[#0A1628]">{user.full_name}</div>
                                  <div className="text-xs text-gray-400 font-mono">…{user._id.slice(-8)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-sm text-gray-700 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />{user.email}
                              </div>
                              {user.phone && (
                                <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                                  <Phone className="w-3 h-3" />{user.phone}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1">
                                {user.roles?.map(r => (
                                  <span key={r} className={`px-2 py-0.5 text-xs font-medium rounded-full ${ROLE_BADGE[r] || "bg-gray-100 text-gray-700"}`}>
                                    {formatRoleLabel(r)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                                  {(user.status || "pending").toUpperCase()}
                                </span>
                                {user.email_verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />{formatDate(user.created_at)}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleViewProfiles(user)} className="p-2 text-gray-400 hover:text-[#00AEEF] hover:bg-[#00AEEF]/10 rounded-lg transition-colors" title="Manage Profiles">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={() => setUserToDelete(user._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="lg:hidden divide-y divide-gray-100">
                    {filteredUsers.map(user => (
                      <div key={user._id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#1A5FA8] flex items-center justify-center text-white font-bold">
                              {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-[#0A1628]">{user.full_name}</h3>
                              <p className="text-xs text-gray-400 truncate max-w-[160px]">{user.email}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>{user.status || "pending"}</span>
                                {user.roles?.slice(0, 2).map(r => (
                                  <span key={r} className={`px-2 py-0.5 text-xs font-medium rounded-full ${ROLE_BADGE[r] || "bg-gray-100 text-gray-700"}`}>{formatRoleLabel(r)}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleViewProfiles(user)} className="p-2 text-gray-400 hover:text-[#00AEEF] rounded-lg"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => setUserToDelete(user._id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-sm text-gray-500">
                        Showing <span className="font-semibold text-[#0A1628]">{((pagination.page - 1) * pagination.limit) + 1}</span>–
                        <span className="font-semibold text-[#0A1628]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                        <span className="font-semibold text-[#0A1628]">{pagination.total}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={pagination.page === 1}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-600 px-2">Page {pagination.page} / {pagination.totalPages}</span>
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={pagination.page >= pagination.totalPages}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
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

      {/* ── Add User Side Panel ──────────────────────────────────────────── */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isAddModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-[#0A1628]/60 backdrop-blur-sm transition-opacity duration-300 ${isAddModalOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => { if (!isSubmitting) { setIsAddModalOpen(false); resetForm(); } }}
        />

        {/* Panel */}
        <div className={`absolute inset-y-0 right-0 flex max-w-full transition-transform duration-300 ease-out ${isAddModalOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="relative w-screen max-w-2xl">
            <div className="flex flex-col h-full bg-white shadow-2xl">

              {/* Panel header */}
              <div className="flex-shrink-0 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] px-8 py-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Add New User</h2>
                    </div>
                    <p className="text-[#00AEEF]/80 text-sm ml-12">Create an account and assign roles &amp; branches</p>
                  </div>
                  <button
                    onClick={() => { if (!isSubmitting) { setIsAddModalOpen(false); resetForm(); } }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white mt-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="flex-shrink-0 border-b border-gray-100 bg-gray-50 px-8 py-3">
                <div className="flex items-center gap-6 text-xs font-medium">
                  <div className="flex items-center gap-2 text-[#00AEEF]">
                    <div className="w-5 h-5 rounded-full bg-[#00AEEF] text-white flex items-center justify-center text-[10px] font-bold">1</div>
                    Basic Info
                  </div>
                  <div className="h-px flex-1 bg-gray-200" />
                  <div className={`flex items-center gap-2 transition-colors ${(addForm.roles || []).length > 0 ? "text-[#00AEEF]" : "text-gray-400"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${(addForm.roles || []).length > 0 ? "bg-[#00AEEF] text-white" : "bg-gray-200 text-gray-500"}`}>2</div>
                    Roles
                  </div>
                  <div className="h-px flex-1 bg-gray-200" />
                  <div className={`flex items-center gap-2 transition-colors ${needsBranch ? "text-[#00AEEF]" : "text-gray-400"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${needsBranch ? "bg-[#00AEEF] text-white" : "bg-gray-200 text-gray-500"}`}>3</div>
                    Branch
                  </div>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-8 py-7 space-y-8">

                  {/* ── Section 1: Basic info ── */}
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Account Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Full name — full width */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-[#0A1628] mb-1.5">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={addForm.full_name}
                            onChange={e => setAddForm(prev => ({ ...prev, full_name: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40 focus:border-[#00AEEF] transition-all"
                            placeholder="e.g. John Moyo"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-[#0A1628] mb-1.5">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="email"
                            value={addForm.email}
                            onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40 focus:border-[#00AEEF] transition-all"
                            placeholder="john@morental.co.zw"
                          />
                        </div>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-[#0A1628] mb-1.5">Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            value={addForm.phone || ""}
                            onChange={e => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40 focus:border-[#00AEEF] transition-all"
                            placeholder="077XXXXXXX"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-sm font-medium text-[#0A1628] mb-1.5">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={addForm.password}
                            onChange={e => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40 focus:border-[#00AEEF] transition-all"
                            placeholder="Min. 6 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(p => !p)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Divider */}
                  <div className="h-px bg-gray-100" />

                  {/* ── Section 2: Roles ── */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assign Roles</h3>
                      {(addForm.roles || []).length > 0 && (
                        <span className="text-xs text-[#00AEEF] font-medium bg-[#00AEEF]/10 px-2.5 py-1 rounded-full">
                          {(addForm.roles || []).length} selected
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {ROLE_CONFIG.map(role => {
                        const isSelected = (addForm.roles || []).includes(role.id);
                        const Icon = role.icon;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => toggleRole(role.id)}
                            className={`relative text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                              isSelected
                                ? `${role.selectedBg} ${role.selectedBorder} shadow-sm`
                                : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? role.bg : "bg-gray-100"}`}>
                                <Icon className={`w-4.5 h-4.5 ${isSelected ? role.color : "text-gray-400"}`} style={{ width: 18, height: 18 }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-semibold leading-tight ${isSelected ? "text-[#0A1628]" : "text-gray-700"}`}>
                                  {role.label}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5 leading-snug">{role.description}</div>
                                {role.needsBranch && (
                                  <div className="flex items-center gap-1 mt-1.5">
                                    <MapPin className="w-3 h-3 text-[#00AEEF]" />
                                    <span className="text-[10px] text-[#00AEEF] font-medium">Branch required</span>
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${role.selectedBorder.replace("border-", "bg-")} text-white`}>
                                  <CheckCircle className="w-4 h-4" style={{ color: "white" }} />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {(addForm.roles || []).length === 0 && (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        Select at least one role for this user
                      </p>
                    )}
                  </section>

                  {/* ── Section 3: Branch assignment (conditional) ── */}
                  {needsBranch && (
                    <>
                      <div className="h-px bg-gray-100" />
                      <section>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Branch Assignment</h3>
                          <span className="text-[10px] text-rose-500 font-medium bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">Recommended</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                          Select one or more branches for this user. They will be linked to these branches immediately.
                        </p>

                        {/* Custom multi-select dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setBranchDropdownOpen(p => !p)}
                            className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl text-sm transition-all ${
                              branchDropdownOpen
                                ? "border-[#00AEEF] bg-[#F0F9FF]"
                                : selectedBranchIds.length > 0
                                  ? "border-[#00AEEF]/50 bg-[#F0F9FF]"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              {selectedBranchIds.length === 0 ? (
                                <span className="text-gray-400">
                                  {branchesLoading ? "Loading branches…" : "Select branches…"}
                                </span>
                              ) : (
                                <span className="text-[#0A1628] font-medium truncate">
                                  {selectedBranchNames}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {selectedBranchIds.length > 0 && (
                                <span className="bg-[#00AEEF] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                  {selectedBranchIds.length}
                                </span>
                              )}
                              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${branchDropdownOpen ? "rotate-180" : ""}`} />
                            </div>
                          </button>

                          {branchDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto">
                              {branchesLoading ? (
                                <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400">
                                  <div className="animate-spin w-4 h-4 border-2 border-gray-200 border-t-[#00AEEF] rounded-full" />
                                  Loading…
                                </div>
                              ) : branches.length === 0 ? (
                                <div className="py-6 text-center text-sm text-gray-400">No branches found</div>
                              ) : (
                                branches.map(branch => {
                                  const checked = selectedBranchIds.includes(branch._id);
                                  return (
                                    <button
                                      key={branch._id}
                                      type="button"
                                      onClick={() => toggleBranch(branch._id)}
                                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F0F9FF] transition-colors text-left ${checked ? "bg-[#F0F9FF]" : ""}`}
                                    >
                                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? "bg-[#00AEEF] border-[#00AEEF]" : "border-gray-300"}`}>
                                        {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-[#0A1628] truncate">{branch.name}</div>
                                        <div className="text-xs text-gray-400 truncate">
                                          {branch.address?.city}{branch.address?.city && branch.code ? " · " : ""}{branch.code}
                                        </div>
                                      </div>
                                      {branch.active === false && (
                                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">Inactive</span>
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>

                        {selectedBranchIds.length === 0 && (
                          <p className="text-xs text-gray-400 mt-2">
                            Branch assignment is optional — the user can be linked to a branch later via profile management.
                          </p>
                        )}
                      </section>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50 px-8 py-5">
                {/* Summary chips */}
                {(addForm.roles || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(addForm.roles || []).map(r => {
                      const cfg = ROLE_CONFIG.find(c => c.id === r);
                      return (
                        <span key={r} className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${ROLE_BADGE[r] || "bg-gray-100 text-gray-700"}`}>
                          {cfg && <cfg.icon className="w-3 h-3" />}
                          {formatRoleLabel(r)}
                        </span>
                      );
                    })}
                    {selectedBranchIds.length > 0 && (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[#00AEEF]/10 text-[#00AEEF] flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {selectedBranchIds.length} branch{selectedBranchIds.length > 1 ? "es" : ""}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => { if (!isSubmitting) { setIsAddModalOpen(false); resetForm(); } }}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    disabled={isSubmitting || !addForm.full_name || !addForm.email || !addForm.password || (addForm.roles || []).length === 0}
                    className="px-6 py-2.5 bg-[#00AEEF] text-white rounded-xl hover:bg-[#0099D4] transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── User Details Modal ──────────────────────────────────────────── */}
      {isDetailsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A1628]/60 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0A1628]">User Details</h2>
                <p className="text-xs text-gray-500">Account and role information</p>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 72px)" }}>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00AEEF] to-[#1A5FA8] flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {selectedUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-[#0A1628]">{selectedUser.full_name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedUser.status)}`}>
                      {(selectedUser.status || "PENDING").toUpperCase()}
                    </span>
                    {selectedUser.email_verified && (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</h4>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div><p className="text-[10px] text-gray-400">Email</p><p className="text-sm text-[#0A1628] font-medium">{selectedUser.email}</p></div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div><p className="text-[10px] text-gray-400">Phone</p><p className="text-sm text-[#0A1628] font-medium">{selectedUser.phone || "Not provided"}</p></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Roles</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.roles?.map(r => (
                      <span key={r} className={`px-2.5 py-1 text-xs font-medium rounded-full ${ROLE_BADGE[r] || "bg-gray-100 text-gray-700"}`}>
                        {formatRoleLabel(r)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => { setIsDetailsModalOpen(false); handleViewProfiles(selectedUser); }}
                  className="w-full px-4 py-2.5 bg-[#00AEEF] text-white rounded-xl hover:bg-[#0099D4] transition-colors font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" /> View All Profiles
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ─────────────────────────────────────────── */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0A1628]/60 backdrop-blur-sm" onClick={() => setUserToDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0A1628]">Delete User</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">All profiles and associated data for this user will be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setUserToDelete(null)} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">
                Cancel
              </button>
              <button onClick={() => handleDeleteUser(userToDelete)} className="px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Snackbar ─────────────────────────────────────────────────────── */}
      {snackbar.show && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] border ${
            snackbar.type === "success" ? "bg-green-50 border-green-200 text-green-800" :
            snackbar.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
            "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{snackbar.message}</span>
            <button onClick={() => setSnackbar(prev => ({ ...prev, show: false }))} className="text-current opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
