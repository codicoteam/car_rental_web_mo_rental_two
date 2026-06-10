import { useState } from "react";
import {
  Calendar,
  Plus,
  Edit,
  X,
  Menu,
  Search,
  Filter,
  Download,
  MapPin,
  Car,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import Sidebar from "../../components/Sidebar";

type Booking = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  vehicle: string;
  branch: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  overridden: boolean;
  createdAt: string;
  overrideReason?: string;
  cancellationReason?: string;
};

const Bookings = () => {
  const [isDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'create', 'edit', 'cancel', 'swap', 'override'
  const [, setSelectedBooking] = useState<Booking | null>(null);

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

  const bookings = [
    {
      id: "BK-2024-001",
      customer: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1 234 567 890",
      vehicle: "Tesla Model 3",
      branch: "Downtown",
      startDate: "2024-10-20",
      endDate: "2024-10-25",
      status: "Active",
      totalPrice: 600,
      overridden: false,
      createdAt: "2024-10-15",
    },
    {
      id: "BK-2024-002",
      customer: "Michael Brown",
      email: "m.brown@email.com",
      phone: "+1 234 567 891",
      vehicle: "BMW X5",
      branch: "Airport",
      startDate: "2024-10-18",
      endDate: "2024-10-22",
      status: "Confirmed",
      totalPrice: 720,
      overridden: false,
      createdAt: "2024-10-14",
    },
    {
      id: "BK-2024-003",
      customer: "Emily Davis",
      email: "emily.d@email.com",
      phone: "+1 234 567 892",
      vehicle: "Mercedes C-Class",
      branch: "Downtown",
      startDate: "2024-10-22",
      endDate: "2024-10-28",
      status: "Pending",
      totalPrice: 900,
      overridden: true,
      overrideReason: "Corporate discount applied",
      createdAt: "2024-10-16",
    },
    {
      id: "BK-2024-004",
      customer: "James Wilson",
      email: "j.wilson@email.com",
      phone: "+1 234 567 893",
      vehicle: "Audi A4",
      branch: "Westside",
      startDate: "2024-10-17",
      endDate: "2024-10-19",
      status: "Completed",
      totalPrice: 280,
      overridden: false,
      createdAt: "2024-10-10",
    },
    {
      id: "BK-2024-005",
      customer: "Lisa Anderson",
      email: "lisa.a@email.com",
      phone: "+1 234 567 894",
      vehicle: "Range Rover Sport",
      branch: "Airport",
      startDate: "2024-10-15",
      endDate: "2024-10-17",
      status: "Cancelled",
      totalPrice: 440,
      overridden: false,
      cancellationReason: "Customer request",
      createdAt: "2024-10-12",
    },
    {
      id: "BK-2024-006",
      customer: "Robert Taylor",
      email: "r.taylor@email.com",
      phone: "+1 234 567 895",
      vehicle: "Porsche 911",
      branch: "Downtown",
      startDate: "2024-10-25",
      endDate: "2024-10-27",
      status: "Confirmed",
      totalPrice: 700,
      overridden: true,
      overrideReason: "VIP customer - 10% discount",
      createdAt: "2024-10-16",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Confirmed":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "Completed":
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      case "Cancelled":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="w-4 h-4" />;
      case "Confirmed":
        return <Clock className="w-4 h-4" />;
      case "Pending":
        return <AlertCircle className="w-4 h-4" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4" />;
      case "Cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.vehicle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      booking.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesBranch =
      filterBranch === "all" ||
      booking.branch.toLowerCase() === filterBranch.toLowerCase();
    const matchesDate =
      !dateFilter ||
      booking.startDate === dateFilter ||
      booking.endDate === dateFilter;
    return matchesSearch && matchesStatus && matchesBranch && matchesDate;
  });

  const handleCreateBooking = () => {
    setModalType("create");
    setSelectedBooking(null);
    setShowModal(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setModalType("edit");
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleCancelBooking = (booking: Booking) => {
    setModalType("cancel");
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleSwapVehicle = (booking: Booking) => {
    setModalType("swap");
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleOverridePrice = (booking: Booking) => {
    setModalType("override");
    setSelectedBooking(booking);
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
                  Bookings
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
                  Bookings Management
                </h1>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Manage reservations, assignments, and customer bookings
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateBooking}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/25 hover:shadow-md hover:shadow-blue-500/30 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Booking</span>
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
                    <Calendar className={`w-4 h-4 ${themeClasses.text}`} />
                  </div>
                  <span className={`text-2xl font-bold ${themeClasses.text}`}>
                    {bookings.length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Total Bookings
                </div>
              </div>

              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">
                    {bookings.filter((b) => b.status === "Active").length}
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
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {bookings.filter((b) => b.status === "Confirmed").length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Confirmed
                </div>
              </div>

              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-2xl font-bold text-amber-600">
                    {bookings.filter((b) => b.status === "Pending").length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Pending
                </div>
              </div>

              <div
                className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <CheckCircle className={`w-4 h-4 ${themeClasses.text}`} />
                  </div>
                  <span className={`text-2xl font-bold ${themeClasses.text}`}>
                    {bookings.filter((b) => b.status === "Completed").length}
                  </span>
                </div>
                <div
                  className={`text-xs font-medium ${themeClasses.textSecondary}`}
                >
                  Completed
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div
              className={`${themeClasses.card} rounded-xl p-4 border ${themeClasses.border} shadow-sm`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textSecondary}`}
                  />
                  <input
                    type="text"
                    placeholder="Search bookings..."
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
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="relative">
                  <MapPin
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textSecondary} pointer-events-none`}
                  />
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className={`w-full pl-10 pr-8 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all appearance-none cursor-pointer`}
                  >
                    <option value="all">All Branches</option>
                    <option value="downtown">Downtown</option>
                    <option value="airport">Airport</option>
                    <option value="westside">Westside</option>
                  </select>
                </div>

                <div className="relative">
                  <Calendar
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textSecondary} pointer-events-none`}
                  />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border ${themeClasses.input} focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all`}
                  />
                </div>
              </div>
            </div>

            {/* Bookings Table */}
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
                        Booking ID
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Customer
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Vehicle
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Branch
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Dates
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Status
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Total
                      </th>
                      <th
                        className={`px-4 py-3 text-right text-xs font-semibold ${themeClasses.text} uppercase tracking-wider`}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className={`${
                          isDarkMode
                            ? "hover:bg-gray-800/30"
                            : "hover:bg-slate-50/50"
                        } transition-colors`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${themeClasses.text}`}
                            >
                              {booking.id}
                            </span>
                            {booking.overridden && (
                              <div className="group relative">
                                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  Price Override
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-semibold text-xs">
                                {booking.customer
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            </div>
                            <div>
                              <div
                                className={`text-sm font-medium ${themeClasses.text}`}
                              >
                                {booking.customer}
                              </div>
                              <div
                                className={`text-xs ${themeClasses.textSecondary}`}
                              >
                                {booking.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Car
                              className={`w-4 h-4 ${themeClasses.textSecondary}`}
                            />
                            <span
                              className={`text-sm ${themeClasses.text} font-medium`}
                            >
                              {booking.vehicle}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin
                              className={`w-4 h-4 ${themeClasses.textSecondary}`}
                            />
                            <span
                              className={`text-sm ${themeClasses.textSecondary}`}
                            >
                              {booking.branch}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div
                            className={`text-xs ${themeClasses.textSecondary}`}
                          >
                            <div>{booking.startDate}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span>to</span>
                              <span>{booking.endDate}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {getStatusIcon(booking.status)}
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`text-sm font-bold ${themeClasses.text}`}
                          >
                            ${booking.totalPrice}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditBooking(booking)}
                              className={`p-2 rounded-lg ${
                                isDarkMode
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-slate-100"
                              } transition-colors group`}
                              title="Edit Booking"
                            >
                              <Edit
                                className={`w-4 h-4 ${themeClasses.textSecondary} group-hover:text-blue-500 transition-colors`}
                              />
                            </button>
                            <button
                              onClick={() => handleSwapVehicle(booking)}
                              className={`p-2 rounded-lg ${
                                isDarkMode
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-slate-100"
                              } transition-colors group`}
                              title="Swap Vehicle"
                            >
                              <RefreshCw
                                className={`w-4 h-4 ${themeClasses.textSecondary} group-hover:text-purple-500 transition-colors`}
                              />
                            </button>
                            <button
                              onClick={() => handleOverridePrice(booking)}
                              className={`p-2 rounded-lg ${
                                isDarkMode
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-slate-100"
                              } transition-colors group`}
                              title="Override Price"
                            >
                              <DollarSign
                                className={`w-4 h-4 ${themeClasses.textSecondary} group-hover:text-amber-500 transition-colors`}
                              />
                            </button>
                            {booking.status !== "Cancelled" &&
                              booking.status !== "Completed" && (
                                <button
                                  onClick={() => handleCancelBooking(booking)}
                                  className={`p-2 rounded-lg ${
                                    isDarkMode
                                      ? "hover:bg-gray-700"
                                      : "hover:bg-slate-100"
                                  } transition-colors group`}
                                  title="Cancel Booking"
                                >
                                  <X
                                    className={`w-4 h-4 ${themeClasses.textSecondary} group-hover:text-red-500 transition-colors`}
                                  />
                                </button>
                              )}
                            <button
                              className={`p-2 rounded-lg ${
                                isDarkMode
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-slate-100"
                              } transition-colors group`}
                              title="View Details"
                            >
                              <FileText
                                className={`w-4 h-4 ${themeClasses.textSecondary} group-hover:text-slate-700 transition-colors`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredBookings.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle
                    className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-3`}
                  />
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    No bookings found matching your criteria
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`${themeClasses.card} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                  {modalType === "create" && "Create New Booking"}
                  {modalType === "edit" && "Edit Booking"}
                  {modalType === "cancel" && "Cancel Booking"}
                  {modalType === "swap" && "Swap Vehicle"}
                  {modalType === "override" && "Override Price"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className={`p-2 rounded-lg ${
                    isDarkMode ? "hover:bg-gray-700" : "hover:bg-slate-100"
                  } transition-colors`}
                >
                  <X className={`w-5 h-5 ${themeClasses.textSecondary}`} />
                </button>
              </div>

              <div className="space-y-4">
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Modal content for {modalType} would go here.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg border ${themeClasses.border} ${themeClasses.text} hover:bg-slate-50 transition-colors`}
                >
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all">
                  {modalType === "create" && "Create Booking"}
                  {modalType === "edit" && "Save Changes"}
                  {modalType === "cancel" && "Confirm Cancellation"}
                  {modalType === "swap" && "Confirm Swap"}
                  {modalType === "override" && "Apply Override"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
