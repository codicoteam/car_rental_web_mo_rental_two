import { useState } from "react";
import {
  Users,
  Plus,
  X,
  Menu,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  FileText,
  CreditCard,
  Flag,
  Eye,
  UserCheck,
  UserX,
  Clock,
  DollarSign,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinedDate: string;
  status: string;
  kycStatus: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking: string;
  verifiedDL: boolean;
  verifiedPassport: boolean;
  riskFlag: boolean;
  riskReason?: string;
  avatar?: string;
};

const Customers = () => {
  const [isDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterKYC, setFilterKYC] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'view', 'edit', 'verify', 'flag', 'suspend'
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

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

  const customers: Customer[] = [
    {
      id: "CUST-001",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1 234 567 890",
      address: "123 Main St, New York, NY 10001",
      joinedDate: "2024-01-15",
      status: "Active",
      kycStatus: "Verified",
      totalBookings: 12,
      totalSpent: 4800,
      lastBooking: "2024-10-15",
      verifiedDL: true,
      verifiedPassport: true,
      riskFlag: false,
    },
    {
      id: "CUST-002",
      name: "Michael Brown",
      email: "m.brown@email.com",
      phone: "+1 234 567 891",
      address: "456 Oak Ave, Los Angeles, CA 90001",
      joinedDate: "2024-02-20",
      status: "Active",
      kycStatus: "Pending",
      totalBookings: 5,
      totalSpent: 1200,
      lastBooking: "2024-10-10",
      verifiedDL: true,
      verifiedPassport: false,
      riskFlag: false,
    },
    {
      id: "CUST-003",
      name: "Emily Davis",
      email: "emily.d@email.com",
      phone: "+1 234 567 892",
      address: "789 Pine Rd, Chicago, IL 60601",
      joinedDate: "2024-03-10",
      status: "Active",
      kycStatus: "Verified",
      totalBookings: 8,
      totalSpent: 3200,
      lastBooking: "2024-10-12",
      verifiedDL: true,
      verifiedPassport: true,
      riskFlag: false,
    },
    {
      id: "CUST-004",
      name: "James Wilson",
      email: "j.wilson@email.com",
      phone: "+1 234 567 893",
      address: "321 Elm St, Houston, TX 77001",
      joinedDate: "2024-04-05",
      status: "Suspended",
      kycStatus: "Verified",
      totalBookings: 15,
      totalSpent: 2800,
      lastBooking: "2024-09-20",
      verifiedDL: true,
      verifiedPassport: true,
      riskFlag: true,
      riskReason: "Multiple late returns",
    },
    {
      id: "CUST-005",
      name: "Lisa Anderson",
      email: "lisa.a@email.com",
      phone: "+1 234 567 894",
      address: "654 Maple Dr, Miami, FL 33101",
      joinedDate: "2024-05-12",
      status: "Active",
      kycStatus: "Not Submitted",
      totalBookings: 2,
      totalSpent: 600,
      lastBooking: "2024-10-08",
      verifiedDL: false,
      verifiedPassport: false,
      riskFlag: false,
    },
    {
      id: "CUST-006",
      name: "Robert Taylor",
      email: "r.taylor@email.com",
      phone: "+1 234 567 895",
      address: "987 Cedar Ln, Seattle, WA 98101",
      joinedDate: "2024-06-18",
      status: "Active",
      kycStatus: "Verified",
      totalBookings: 20,
      totalSpent: 8500,
      lastBooking: "2024-10-16",
      verifiedDL: true,
      verifiedPassport: true,
      riskFlag: false,
    },
    {
      id: "CUST-007",
      name: "Amanda White",
      email: "a.white@email.com",
      phone: "+1 234 567 896",
      address: "147 Birch Ave, Boston, MA 02101",
      joinedDate: "2024-07-22",
      status: "Inactive",
      kycStatus: "Pending",
      totalBookings: 3,
      totalSpent: 900,
      lastBooking: "2024-08-05",
      verifiedDL: true,
      verifiedPassport: false,
      riskFlag: false,
    },
    {
      id: "CUST-008",
      name: "David Martinez",
      email: "d.martinez@email.com",
      phone: "+1 234 567 897",
      address: "258 Spruce St, Phoenix, AZ 85001",
      joinedDate: "2024-08-30",
      status: "Active",
      kycStatus: "Rejected",
      totalBookings: 1,
      totalSpent: 250,
      lastBooking: "2024-09-15",
      verifiedDL: false,
      verifiedPassport: false,
      riskFlag: true,
      riskReason: "Invalid documentation",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Inactive":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      case "Suspended":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const getKYCColor = (status: string) => {
    switch (status) {
      case "Verified":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "Not Submitted":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      case "Rejected":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      customer.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesKYC =
      filterKYC === "all" ||
      customer.kycStatus.toLowerCase().replace(" ", "") ===
        filterKYC.toLowerCase();
    return matchesSearch && matchesStatus && matchesKYC;
  });

  const handleViewProfile = (customer: Customer) => {
    setModalType("view");
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleVerifyDocuments = (customer: Customer) => {
    setModalType("verify");
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleFlagCustomer = (customer: Customer) => {
    setModalType("flag");
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleSuspendCustomer = (customer: Customer) => {
    setModalType("suspend");
    setSelectedCustomer(customer);
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
                  Customers
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
                  Customers Management
                </h1>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Manage customer profiles, verification, and account status
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/25 hover:shadow-md hover:shadow-blue-500/30 transition-all duration-200">
                  <Plus className="w-4 h-4" />
                  <span>Add Customer</span>
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      isDarkMode ? "bg-gray-700" : "bg-slate-100"
                    }`}
                  >
                    <Users className={`w-4 h-4 ${themeClasses.text}`} />
                  </div>
                  <span className={`text-2xl font-bold ${themeClasses.text}`}>
                    {customers.length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Total Customers
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
                    {customers.filter((c) => c.status === "Active").length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Active
                </div>
              </div>

              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {customers.filter((c) => c.kycStatus === "Verified").length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Verified KYC
                </div>
              </div>

              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-2xl font-bold text-amber-600">
                    {customers.filter((c) => c.kycStatus === "Pending").length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Pending KYC
                </div>
              </div>

              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-red-50">
                    <Flag className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    {customers.filter((c) => c.riskFlag).length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Flagged
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
                    placeholder="Search customers..."
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
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="relative">
                  <Shield
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textSecondary} pointer-events-none`}
                  />
                  <select
                    value={filterKYC}
                    onChange={(e) => setFilterKYC(e.target.value)}
                    className={`w-full pl-10 pr-8 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all appearance-none cursor-pointer`}
                  >
                    <option value="all">All KYC Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="notsubmitted">Not Submitted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customers Table */}
            <div
              className={`${themeClasses.card} rounded-xl border ${themeClasses.border} shadow-sm overflow-hidden`}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead
                    className={`${
                      isDarkMode ? "bg-gray-800/50" : "bg-slate-50"
                    } border-b ${themeClasses.border}`}
                  >
                    <tr>
                      <th
                        className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Customer
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Contact
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Status
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        KYC Status
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Documents
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Activity
                      </th>
                      <th
                        className={`px-4 py-3 text-right text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className={`${
                          isDarkMode
                            ? "hover:bg-gray-800/30"
                            : "hover:bg-slate-50/50"
                        } transition-colors`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {customer.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              {customer.riskFlag && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                  <Flag className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div
                                className={`text-sm font-semibold ${themeClasses.text}`}
                              >
                                {customer.name}
                              </div>
                              <div
                                className={`text-xs ${themeClasses.textSecondary}`}
                              >
                                {customer.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail
                                className={`w-3.5 h-3.5 ${themeClasses.textSecondary}`}
                              />
                              <span
                                className={`text-xs ${themeClasses.textSecondary}`}
                              >
                                {customer.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone
                                className={`w-3.5 h-3.5 ${themeClasses.textSecondary}`}
                              />
                              <span
                                className={`text-xs ${themeClasses.textSecondary}`}
                              >
                                {customer.phone}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                              customer.status
                            )}`}
                          >
                            {customer.status === "Active" && (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            {customer.status === "Suspended" && (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {customer.status === "Inactive" && (
                              <AlertCircle className="w-3.5 h-3.5" />
                            )}
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getKYCColor(
                              customer.kycStatus
                            )}`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            {customer.kycStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                                customer.verifiedDL
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              <span className="text-xs font-medium">DL</span>
                            </div>
                            <div
                              className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                                customer.verifiedPassport
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              <span className="text-xs font-medium">PP</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <CreditCard
                                className={`w-3.5 h-3.5 ${themeClasses.textSecondary}`}
                              />
                              <span
                                className={`text-xs ${themeClasses.text} font-medium`}
                              >
                                {customer.totalBookings} bookings
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign
                                className={`w-3.5 h-3.5 ${themeClasses.textSecondary}`}
                              />
                              <span
                                className={`text-xs ${themeClasses.textSecondary}`}
                              >
                                ${customer.totalSpent.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewProfile(customer)}
                              className={`p-2 rounded-lg ${
                                isDarkMode
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-slate-100"
                              } transition-colors`}
                              title="View Profile"
                            >
                              <Eye
                                className={`w-4 h-4 ${themeClasses.textSecondary}`}
                              />
                            </button>
                            {customer.kycStatus === "Pending" && (
                              <button
                                onClick={() => handleVerifyDocuments(customer)}
                                className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Verify Documents"
                              >
                                <Shield className="w-4 h-4 text-blue-600" />
                              </button>
                            )}
                            {!customer.riskFlag &&
                              customer.status === "Active" && (
                                <button
                                  onClick={() => handleFlagCustomer(customer)}
                                  className="p-2 rounded-lg hover:bg-amber-50 transition-colors"
                                  title="Flag Customer"
                                >
                                  <Flag className="w-4 h-4 text-amber-600" />
                                </button>
                              )}
                            {customer.status === "Active" && (
                              <button
                                onClick={() => handleSuspendCustomer(customer)}
                                className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                                title="Suspend Account"
                              >
                                <UserX className="w-4 h-4 text-red-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredCustomers.length === 0 && (
                <div className="py-12 text-center">
                  <Users
                    className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-3`}
                  />
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    No customers found matching your filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`${themeClasses.card} rounded-xl border ${themeClasses.border} shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
          >
            <div className="sticky top-0 bg-inherit border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                {modalType === "view" && "Customer Profile"}
                {modalType === "verify" && "Verify Documents"}
                {modalType === "flag" && "Flag Customer"}
                {modalType === "suspend" && "Suspend Account"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className={`w-5 h-5 ${themeClasses.textSecondary}`} />
              </button>
            </div>

            <div className="p-6">
              {modalType === "view" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-xl">
                        {selectedCustomer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold ${themeClasses.text}`}>
                        {selectedCustomer.name}
                      </h4>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>
                        {selectedCustomer.id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`text-xs font-semibold ${themeClasses.textSecondary} uppercase`}
                      >
                        Email
                      </label>
                      <p className={`text-sm ${themeClasses.text} mt-1`}>
                        {selectedCustomer.email}
                      </p>
                    </div>
                    <div>
                      <label
                        className={`text-xs font-semibold ${themeClasses.textSecondary} uppercase`}
                      >
                        Phone
                      </label>
                      <p className={`text-sm ${themeClasses.text} mt-1`}>
                        {selectedCustomer.phone}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <label
                        className={`text-xs font-semibold ${themeClasses.textSecondary} uppercase`}
                      >
                        Address
                      </label>
                      <p className={`text-sm ${themeClasses.text} mt-1`}>
                        {selectedCustomer.address}
                      </p>
                    </div>
                    <div>
                      <label
                        className={`text-xs font-semibold ${themeClasses.textSecondary} uppercase`}
                      >
                        Status
                      </label>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                            selectedCustomer.status
                          )}`}
                        >
                          {selectedCustomer.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label
                        className={`text-xs font-semibold ${themeClasses.textSecondary} uppercase`}
                      >
                        KYC Status
                      </label>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getKYCColor(
                            selectedCustomer.kycStatus
                          )}`}
                        >
                          {selectedCustomer.kycStatus}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label
                        className={`text-xs font-semibold ${themeClasses.textSecondary} uppercase`}
                      >
                        Joined Date
                      </label>
                      <p className={`text-sm ${themeClasses.text} mt-1`}>
                        {new Date(
                          selectedCustomer.joinedDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label
                        className={`text-xs font-semibold ${themeClasses.textSecondary} uppercase`}
                      >
                        Last Booking
                      </label>
                      <p className={`text-sm ${themeClasses.text} mt-1`}>
                        {new Date(
                          selectedCustomer.lastBooking
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label
                        className={`text-xs font-semibold ${themeClasses.textSecondary} uppercase`}
                      >
                        Total Bookings
                      </label>
                      <p className={`text-sm ${themeClasses.text} mt-1`}>
                        {selectedCustomer.totalBookings}
                      </p>
                    </div>
                    <div>
                      <label
                        className={`text-xs font-semibold ${themeClasses.textSecondary} uppercase`}
                      >
                        Total Spent
                      </label>
                      <p className={`text-sm ${themeClasses.text} mt-1`}>
                        ${selectedCustomer.totalSpent.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {selectedCustomer.riskFlag && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Flag className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <h5 className="text-sm font-semibold text-red-900">
                            Risk Flag Active
                          </h5>
                          <p className="text-sm text-red-700 mt-1">
                            {selectedCustomer.riskReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalType === "verify" && (
                <div className="space-y-4">
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    Review and verify customer documents for{" "}
                    {selectedCustomer.name}
                  </p>
                  <div className="space-y-3">
                    <div className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p
                              className={`text-sm font-medium ${themeClasses.text}`}
                            >
                              Driver's License
                            </p>
                            <p
                              className={`text-xs ${themeClasses.textSecondary}`}
                            >
                              Pending verification
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors">
                            Approve
                          </button>
                          <button className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors">
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p
                              className={`text-sm font-medium ${themeClasses.text}`}
                            >
                              Passport
                            </p>
                            <p
                              className={`text-xs ${themeClasses.textSecondary}`}
                            >
                              Not submitted
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalType === "flag" && (
                <div className="space-y-4">
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    Flag {selectedCustomer.name} for administrative review
                  </p>
                  <div>
                    <label
                      className={`text-xs font-semibold ${themeClasses.textSecondary} uppercase mb-2 block`}
                    >
                      Reason for Flag
                    </label>
                    <textarea
                      className={`w-full px-3 py-2 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40`}
                      rows={4}
                      placeholder="Enter reason for flagging this customer..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                      Flag Customer
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {modalType === "suspend" && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-semibold text-red-900">
                          Warning
                        </h5>
                        <p className="text-sm text-red-700 mt-1">
                          Suspending this account will prevent the customer from
                          making new bookings.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      className={`text-xs font-semibold ${themeClasses.textSecondary} uppercase mb-2 block`}
                    >
                      Reason for Suspension
                    </label>
                    <textarea
                      className={`w-full px-3 py-2 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40`}
                      rows={4}
                      placeholder="Enter reason for suspending this customer..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                      Suspend Account
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Cancel
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

export default Customers;
