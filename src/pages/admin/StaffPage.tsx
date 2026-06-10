import { useState } from "react";
import {
  Users,
  Plus,
  Edit,
  X,
  Menu,
  Search,
  Filter,
  Download,
  Shield,
  Lock,
  Unlock,
  UserCheck,
  Clock,
  Activity,
  Key,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  History,
  LogIn,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions: string[];
  status: string;
  branch: string;
  createdDate: string;
  lastLogin: string;
  loginCount: number;
  avatar?: string;
};

type ActivityLog = {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details: string;
};

const Staff = () => {
  const [isDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'create', 'edit', 'permissions', 'disable', 'logs'
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedPermissions, setExpandedPermissions] = useState<string | null>(null);

  const firstName = "John Doe";

  const themeClasses = {
    bg: isDarkMode
      ? "bg-gray-900"
      : "bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100",
    card: isDarkMode ? "bg-gray-800/90" : "bg-white",
    text: isDarkMode ? "text-white" : "text-slate-900",
    textSecondary: isDarkMode ? "text-gray-400" : "text-slate-500",
    border: isDarkMode ? "border-gray-700/50" : "border-slate-200/60",
    header: isDarkMode ? "bg-gray-900/95" : "bg-white/95",
    input: isDarkMode
      ? "bg-gray-800 border-gray-700 text-white"
      : "bg-slate-50/80 border-slate-200 text-slate-900",
  };

  const users: User[] = [
    {
      id: "USR-001",
      name: "Michael Chen",
      email: "m.chen@carrentals.com",
      phone: "+1 555 123 4567",
      role: "Owner Admin",
      permissions: ["all"],
      status: "Active",
      branch: "All Branches",
      createdDate: "2024-01-15",
      lastLogin: "2024-10-17 09:45:00",
      loginCount: 342,
    },
    {
      id: "USR-002",
      name: "Sarah Williams",
      email: "s.williams@carrentals.com",
      phone: "+1 555 234 5678",
      role: "Branch Manager",
      permissions: ["bookings", "customers", "vehicles", "pricing", "reports"],
      status: "Active",
      branch: "Downtown Branch",
      createdDate: "2024-02-20",
      lastLogin: "2024-10-17 08:30:00",
      loginCount: 256,
    },
    {
      id: "USR-003",
      name: "James Rodriguez",
      email: "j.rodriguez@carrentals.com",
      phone: "+1 555 345 6789",
      role: "Branch Staff",
      permissions: ["bookings", "customers", "vehicles"],
      status: "Active",
      branch: "Airport Branch",
      createdDate: "2024-03-10",
      lastLogin: "2024-10-16 17:20:00",
      loginCount: 189,
    },
    {
      id: "USR-004",
      name: "Emily Thompson",
      email: "e.thompson@carrentals.com",
      phone: "+1 555 456 7890",
      role: "Branch Staff",
      permissions: ["bookings", "customers"],
      status: "Active",
      branch: "Downtown Branch",
      createdDate: "2024-04-05",
      lastLogin: "2024-10-17 07:15:00",
      loginCount: 145,
    },
    {
      id: "USR-005",
      name: "David Kim",
      email: "d.kim@carrentals.com",
      phone: "+1 555 567 8901",
      role: "Branch Manager",
      permissions: ["bookings", "customers", "vehicles", "pricing", "reports"],
      status: "Disabled",
      branch: "City Center Branch",
      createdDate: "2024-02-28",
      lastLogin: "2024-09-15 16:45:00",
      loginCount: 98,
    },
    {
      id: "USR-006",
      name: "Lisa Martinez",
      email: "l.martinez@carrentals.com",
      phone: "+1 555 678 9012",
      role: "Support Staff",
      permissions: ["customers", "reports"],
      status: "Active",
      branch: "All Branches",
      createdDate: "2024-05-12",
      lastLogin: "2024-10-16 19:30:00",
      loginCount: 112,
    },
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: "LOG-001",
      userId: "USR-002",
      action: "Updated Booking",
      timestamp: "2024-10-17 09:15:00",
      details: "Modified booking BK-2024-1045 - Extended rental period",
    },
    {
      id: "LOG-002",
      userId: "USR-003",
      action: "Created Customer",
      timestamp: "2024-10-17 08:45:00",
      details: "Added new customer: John Smith (CUST-145)",
    },
    {
      id: "LOG-003",
      userId: "USR-004",
      action: "Processed Refund",
      timestamp: "2024-10-16 16:30:00",
      details: "Refunded $250 to booking BK-2024-1038",
    },
  ];

  const allPermissions = [
    { id: "bookings", label: "Manage Bookings", description: "Create, edit, cancel bookings" },
    { id: "customers", label: "Manage Customers", description: "View and edit customer profiles" },
    { id: "vehicles", label: "Manage Vehicles", description: "Add, edit, assign vehicles" },
    { id: "pricing", label: "Edit Pricing", description: "Modify rental rates and fees" },
    { id: "refunds", label: "Process Refunds", description: "Issue refunds to customers" },
    { id: "reports", label: "View Reports", description: "Access analytics and reports" },
    { id: "staff", label: "Manage Staff", description: "Create and manage user accounts" },
    { id: "settings", label: "System Settings", description: "Configure system preferences" },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Owner Admin":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "Branch Manager":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Branch Staff":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Support Staff":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Active"
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      : "bg-red-500/10 text-red-600 border-red-500/20";
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      user.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    setModalType("create");
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setModalType("edit");
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleManagePermissions = (user: User) => {
    setModalType("permissions");
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleViewLogs = (user: User) => {
    setModalType("logs");
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDisableUser = (user: User) => {
    setModalType("disable");
    setSelectedUser(user);
    setShowModal(true);
  };

  return (
    <div
      className={`flex h-screen ${themeClasses.bg} transition-colors duration-300`}
    >
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className={`${themeClasses.header} backdrop-blur-xl border-b ${themeClasses.border} px-4 sm:px-6 py-3.5 sticky top-0 z-30`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden p-2 rounded-lg ${
                  isDarkMode ? "bg-gray-800" : "bg-slate-100"
                } hover:bg-opacity-80 transition-colors`}
              >
                <Menu className={`w-5 h-5 ${themeClasses.textSecondary}`} />
              </button>
              <div className="flex items-center gap-2 text-sm">
                <span className={themeClasses.textSecondary}>Dashboard</span>
                <span className={themeClasses.textSecondary}>›</span>
                <span className={`${themeClasses.text} font-medium`}>
                  Staff & Users
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`hidden sm:flex items-center gap-3 pl-3 border-l ${themeClasses.border}`}
              >
                <div className="text-right">
                  <div className={`text-sm font-semibold ${themeClasses.text}`}>
                    {firstName}
                  </div>
                  <div className={`text-xs ${themeClasses.textSecondary}`}>
                    Admin
                  </div>
                </div>
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {firstName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1
                  className={`text-2xl sm:text-3xl font-bold ${themeClasses.text} mb-1`}
                >
                  Staff & Users Management
                </h1>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Manage system users, roles, and permissions
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateUser}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/25 hover:shadow-md hover:shadow-blue-500/30 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add User</span>
                </button>
                <button
                  className={`flex items-center gap-2 px-4 py-2.5 ${
                    isDarkMode
                      ? "bg-gray-800 hover:bg-gray-700"
                      : "bg-white hover:bg-slate-50"
                  } border ${
                    themeClasses.border
                  } text-sm font-medium rounded-lg transition-colors`}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {users.length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Total Users
                </div>
              </div>

              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">
                    {users.filter((u) => u.status === "Active").length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Active Users
                </div>
              </div>

              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {users.filter((u) => u.role === "Owner Admin").length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Admins
                </div>
              </div>

              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <Activity className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-2xl font-bold text-amber-600">
                    {activityLogs.length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Recent Activities
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div
              className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textSecondary}`}
                  />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-200 transition-colors`}
                    >
                      <X
                        className={`w-3.5 h-3.5 ${themeClasses.textSecondary}`}
                      />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Shield
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textSecondary} pointer-events-none`}
                  />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className={`w-full pl-10 pr-8 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all appearance-none cursor-pointer`}
                  >
                    <option value="all">All Roles</option>
                    <option value="Owner Admin">Owner Admin</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Branch Staff">Branch Staff</option>
                    <option value="Support Staff">Support Staff</option>
                  </select>
                </div>

                <div className="relative">
                  <Filter
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textSecondary} pointer-events-none`}
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className={`w-full pl-10 pr-8 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all appearance-none cursor-pointer`}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Users List */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className={`text-lg font-semibold ${themeClasses.text}`}>
                  Users ({filteredUsers.length})
                </h2>
                
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`${themeClasses.card} rounded-xl p-5 border ${themeClasses.border} shadow-sm hover:shadow-md transition-all`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                              <span className="text-white font-semibold">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            {user.status === "Active" && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0 flex-1">
                                <h3
                                  className={`text-base font-semibold ${themeClasses.text} truncate`}
                                >
                                  {user.name}
                                </h3>
                                <p
                                  className={`text-xs ${themeClasses.textSecondary} truncate`}
                                >
                                  {user.email}
                                </p>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border flex-shrink-0 ${getStatusColor(
                                  user.status
                                )}`}
                              >
                                {user.status === "Active" ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {user.status}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getRoleColor(
                                  user.role
                                )}`}
                              >
                                <Shield className="w-3 h-3" />
                                {user.role}
                              </span>
                              <span
                                className={`text-xs ${themeClasses.textSecondary}`}
                              >
                                {user.branch}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <LogIn
                                  className={`w-3.5 h-3.5 ${themeClasses.textSecondary}`}
                                />
                                <span className={themeClasses.textSecondary}>
                                  Last login:{" "}
                                  {new Date(user.lastLogin).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Activity
                                  className={`w-3.5 h-3.5 ${themeClasses.textSecondary}`}
                                />
                                <span className={themeClasses.textSecondary}>
                                  {user.loginCount} logins
                                </span>
                              </div>
                            </div>

                            <div className="mt-3">
                              <button
                                onClick={() =>
                                  setExpandedPermissions(
                                    expandedPermissions === user.id
                                      ? null
                                      : user.id
                                  )
                                }
                                className={`flex items-center gap-1.5 text-xs font-medium ${
                                  isDarkMode
                                    ? "text-blue-400 hover:text-blue-300"
                                    : "text-blue-600 hover:text-blue-700"
                                } transition-colors`}
                              >
                                <Key className="w-3.5 h-3.5" />
                                {user.permissions[0] === "all"
                                  ? "All Permissions"
                                  : `${user.permissions.length} Permissions`}
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform ${
                                    expandedPermissions === user.id
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              </button>
                              {expandedPermissions === user.id && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {user.permissions[0] === "all" ? (
                                    <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-md border border-purple-200">
                                      Full System Access
                                    </span>
                                  ) : (
                                    user.permissions.map((perm) => (
                                      <span
                                        key={perm}
                                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-200 capitalize"
                                      >
                                        {perm}
                                      </span>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleEditUser(user)}
                            className={`p-2 rounded-lg ${
                              isDarkMode
                                ? "hover:bg-gray-700"
                                : "hover:bg-slate-100"
                            } transition-colors`}
                            title="Edit User"
                          >
                            <Edit
                              className={`w-4 h-4 ${themeClasses.textSecondary}`}
                            />
                          </button>
                          <button
                            onClick={() => handleManagePermissions(user)}
                            className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Manage Permissions"
                          >
                            <Key className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleViewLogs(user)}
                            className="p-2 rounded-lg hover:bg-purple-50 transition-colors"
                            title="View Activity Logs"
                          >
                            <History className="w-4 h-4 text-purple-600" />
                          </button>
                          {user.status === "Active" ? (
                            <button
                              onClick={() => handleDisableUser(user)}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Disable User"
                            >
                              <Lock className="w-4 h-4 text-red-600" />
                            </button>
                          ) : (
                            <button
                              className="p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                              title="Enable User"
                            >
                              <Unlock className="w-4 h-4 text-emerald-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredUsers.length === 0 && (
                  <div
                    className={`${themeClasses.card} rounded-xl p-12 border ${themeClasses.border} shadow-sm text-center`}
                  >
                    <Users
                      className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-3`}
                    />
                    <p className={`text-sm${themeClasses.textSecondary}`}>
                      No users found matching your filters
                    </p>
                  </div>
                )}
              </div>

              {/* Recent Activity Sidebar */}
              <div className="space-y-4">
                <h2 className={`text-lg font-semibold ${themeClasses.text}`}>
                  Recent Activity
                </h2>
                
                <div className="space-y-3">
                  {activityLogs.map((log) => {
                    return (
                      <div
                        key={log.id}
                        className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-50 flex-shrink-0">
                            <Activity className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`text-sm font-semibold ${themeClasses.text} mb-1`}
                            >
                              {log.action}
                            </h4>
                            <p
                              className={`text-xs ${themeClasses.textSecondary} mb-2`}
                            >
                              {log.details}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <Clock
                                className={`w-3 h-3 ${themeClasses.textSecondary}`}
                              />
                              <span className={themeClasses.textSecondary}>
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${themeClasses.card} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
          >
            <div className="sticky top-0 bg-inherit border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className={`text-xl font-bold ${themeClasses.text}`}>
                {modalType === "create" && "Add New User"}
                {modalType === "edit" && "Edit User"}
                {modalType === "permissions" && "Manage Permissions"}
                {modalType === "logs" && "Activity Logs"}
                {modalType === "disable" && "Disable User"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {(modalType === "create" || modalType === "edit") && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedUser?.name}
                        className={`w-full px-4 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={selectedUser?.email}
                        className={`w-full px-4 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                        placeholder="Enter email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                        Phone
                      </label>
                      <input
                        type="tel"
                        defaultValue={selectedUser?.phone}
                        className={`w-full px-4 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                        Role
                      </label>
                      <select
                        defaultValue={selectedUser?.role}
                        className={`w-full px-4 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                      >
                        <option>Owner Admin</option>
                        <option>Branch Manager</option>
                        <option>Branch Staff</option>
                        <option>Support Staff</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                      Branch
                    </label>
                    <select
                      defaultValue={selectedUser?.branch}
                      className={`w-full px-4 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
                    >
                      <option>All Branches</option>
                      <option>Downtown Branch</option>
                      <option>Airport Branch</option>
                      <option>City Center Branch</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className={`px-5 py-2.5 rounded-lg border ${themeClasses.border} hover:bg-slate-50 transition-colors font-medium`}
                    >
                      Cancel
                    </button>
                    <button className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all">
                      {modalType === "create" ? "Create User" : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}

              {modalType === "permissions" && selectedUser && (
                <div className="space-y-4">
                  <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                    Manage permissions for {selectedUser.name}
                  </p>
                  <div className="space-y-3">
                    {allPermissions.map((perm) => (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border ${themeClasses.border} hover:bg-slate-50 cursor-pointer transition-colors`}
                      >
                        <input
                          type="checkbox"
                          defaultChecked={
                            selectedUser.permissions.includes(perm.id) ||
                            selectedUser.permissions[0] === "all"
                          }
                          className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${themeClasses.text}`}>
                            {perm.label}
                          </div>
                          <div className={`text-xs ${themeClasses.textSecondary} mt-0.5`}>
                            {perm.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className={`px-5 py-2.5 rounded-lg border ${themeClasses.border} hover:bg-slate-50 transition-colors font-medium`}
                    >
                      Cancel
                    </button>
                    <button className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all">
                      Save Permissions
                    </button>
                  </div>
                </div>
              )}

              {modalType === "logs" && selectedUser && (
                <div className="space-y-4">
                  <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                    Activity history for {selectedUser.name}
                  </p>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activityLogs
                      .filter((log) => log.userId === selectedUser.id)
                      .map((log) => (
                        <div
                          key={log.id}
                          className={`p-4 rounded-lg border ${themeClasses.border}`}
                        >
                          <div className="flex items-start gap-3">
                            <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className={`text-sm font-semibold ${themeClasses.text}`}>
                                {log.action}
                              </h4>
                              <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                                {log.details}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                <Clock className={`w-3 h-3 ${themeClasses.textSecondary}`} />
                                <span className={themeClasses.textSecondary}>
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {modalType === "disable" && selectedUser && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-900 mb-1">
                        Disable User Account
                      </h4>
                      <p className="text-xs text-red-700">
                        Are you sure you want to disable <strong>{selectedUser.name}</strong>? 
                        This user will no longer be able to access the system.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className={`px-5 py-2.5 rounded-lg border ${themeClasses.border} hover:bg-slate-50 transition-colors font-medium`}
                    >
                      Cancel
                    </button>
                    <button className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all">
                      Disable User
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;