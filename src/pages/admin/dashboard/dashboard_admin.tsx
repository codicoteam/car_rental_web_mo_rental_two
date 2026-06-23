// AdminDashboard.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Menu,
  Calendar,
  RefreshCw,
  Download,
  Building,
  Car,
  Users,
  DollarSign,
  AlertCircle,
  Wrench,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart,
  MapPin,
  Clock,
  CheckCircle,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import {
  fetchAdminDashboardData,
  getErrorDisplay,
} from "../../../Services/adminAndManager/admin_dashboard_service";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
} from "recharts";

// -------------------- helpers --------------------
const formatDate = (date: Date) => date.toISOString().split("T")[0];

const formatShortDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const currency = (n?: number) =>
  typeof n === "number" ? `$${n.toLocaleString()}` : "$0";

// -------------------- shimmer components --------------------
const Shimmer = ({ className = "" }: { className?: string }) => (
  <div
    className={[
      "relative overflow-hidden rounded-md bg-gray-100",
      "before:absolute before:inset-0",
      "before:-translate-x-full before:animate-[shimmer_1.2s_infinite]",
      "before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent",
      className,
    ].join(" ")}
  />
);

const DashboardSkeleton = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1">
        {/* Top Nav Skeleton */}
        <div className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Shimmer className="h-6 w-48" />
                <Shimmer className="h-4 w-72" />
              </div>
              <div className="flex items-center gap-3">
                <Shimmer className="h-10 w-56 rounded-lg" />
                <Shimmer className="h-10 w-10 rounded-lg" />
                <Shimmer className="h-10 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="mx-auto px-6 py-6 space-y-6">
          {/* KPI grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Shimmer className="h-4 w-28" />
                    <Shimmer className="h-7 w-20" />
                  </div>
                  <Shimmer className="h-10 w-10 rounded-lg" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Shimmer className="h-4 w-32" />
                  <Shimmer className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>

          {/* charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Shimmer className="h-5 w-48" />
                    <Shimmer className="h-4 w-64" />
                  </div>
                  <Shimmer className="h-8 w-8 rounded-lg" />
                </div>
                <div className="mt-5">
                  <Shimmer className="h-64 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

// -------------------- main component --------------------
const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<IAdminDashboardData | null>(
    null
  );

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  // Chart colors
  const CHART_COLORS = useMemo(
    () => [
      "#1EA2E4", // brand blue
      "#22C55E", // green
      "#F59E0B", // amber
      "#A855F7", // purple
      "#EF4444", // red
      "#14B8A6", // teal
      "#64748B", // slate
      "#F97316", // orange
    ],
    []
  );

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchAdminDashboardData({
        from: formatDate(dateRange.from),
        to: formatDate(dateRange.to),
      });
      setDashboardData(data);
    } catch (err) {
      const display = getErrorDisplay(err);
      setError(display.message);
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange.from, dateRange.to]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    if (start && end) setDateRange({ from: start, to: end });
  };

  // ---- format chart data consistently ----
  const revenueByBranch = useMemo(() => {
    const raw = dashboardData?.charts.bars.revenue_by_branch ?? [];
    return raw.map((x) => ({ name: x.label, value: x.value }));
  }, [dashboardData]);

  const vehiclesByClass = useMemo(() => {
    const raw = dashboardData?.charts.bars.vehicles_by_class ?? [];
    return raw.map((x) => ({ name: x.label, value: x.value }));
  }, [dashboardData]);

  const reservationsPerDay = useMemo(() => {
    const raw = dashboardData?.charts.lines.reservations_per_day ?? [];
    return raw.map((x) => ({ date: formatShortDate(x.date), value: x.value }));
  }, [dashboardData]);

  const revenuePerDay = useMemo(() => {
    const raw = dashboardData?.charts.lines.revenue_per_day ?? [];
    return raw.map((x) => ({ date: formatShortDate(x.date), value: x.value }));
  }, [dashboardData]);

  const reservationsByStatus = useMemo(() => {
    return dashboardData?.charts.pie.reservations_by_status ?? [];
  }, [dashboardData]);

  const kpis = useMemo(() => {
    const k = dashboardData?.kpis;
    if (!k) return [];
    return [
      {
        id: "branches",
        title: "Active Branches",
        value: k.total_branches,
        icon: Building,
        color: "bg-blue-50 text-blue-600",
        iconColor: "text-blue-600",
        change: dashboardData?.additionalStats?.branch_change || "N/A",
        changeType: "increase",
        description: "Total active locations",
      },
      {
        id: "fleet",
        title: "Total Fleet",
        value: k.total_vehicles,
        icon: Car,
        color: "bg-emerald-50 text-emerald-600",
        iconColor: "text-emerald-600",
        change: `${k.active_fleet} active`,
        changeType: "active",
        description: "Vehicles available",
      },
      {
        id: "reservations",
        title: "Reservations",
        value: k.reservations_in_range,
        icon: Users,
        color: "bg-purple-50 text-purple-600",
        iconColor: "text-purple-600",
        change: `${k.active_reservations_now} active`,
        changeType: "active",
        description: "In selected period",
      },
      {
        id: "revenue",
        title: "Revenue",
        value: currency(k.total_revenue_paid_in_range),
        icon: DollarSign,
        color: "bg-amber-50 text-amber-600",
        iconColor: "text-amber-600",
        change: `${k.driver_bookings_in_range || 0} driver bookings`,
        changeType: "info",
        description: "Paid revenue",
      },
      {
        id: "incidents",
        title: "Pending Incidents",
        value: k.open_or_review_incidents,
        icon: AlertCircle,
        color: "bg-red-50 text-red-600",
        iconColor: "text-red-600",
        change: "Needs attention",
        changeType: "warning",
        description: "Open / under review",
      },
      {
        id: "services",
        title: "Active Services",
        value: k.open_or_in_progress_services,
        icon: Wrench,
        color: "bg-gray-50 text-gray-600",
        iconColor: "text-gray-600",
        change: `${k.due_service_schedules_by_date} due soon`,
        changeType: "info",
        description: "Maintenance in progress",
      },
    ];
  }, [dashboardData]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Performance overview, operations health, and revenue analytics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Date Range Picker */}
              <div className="relative">
                <DatePicker
                  selectsRange
                  startDate={dateRange.from}
                  endDate={dateRange.to}
                  onChange={handleDateChange}
                  dateFormat="MMM d, yyyy"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent bg-white"
                  placeholderText="Select date range"
                />
                <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-5 h-5 text-gray-600 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
              </button>


            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Error State */}
          {error ? (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-red-900">
                      Couldn't load dashboard data
                    </h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                    <div className="mt-4">
                      <button
                        onClick={handleRefresh}
                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : !dashboardData ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-600">No data available.</p>
            </div>
          ) : (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
                {kpis.map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={kpi.id}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={kpi.color + " p-2 rounded-lg"}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-gray-500">
                            {kpi.change}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{kpi.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {kpi.value}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {kpi.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Trend Chart */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Revenue Trend
                      </h3>
                      <p className="text-sm text-gray-600">
                        Daily revenue over time
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">
                        {dashboardData.charts.lines.revenue_per_day.length} days
                      </span>
                    </div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={revenuePerDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#64748B", fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: "#E2E8F0" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748B", fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: "#E2E8F0" }}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip
                          formatter={(value) => [
                            `$${Number(value).toLocaleString()}`,
                            "Revenue",
                          ]}
                          labelFormatter={(label) => `Date: ${label}`}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#1EA2E4"
                          strokeWidth={3}
                          dot={{ fill: "#1EA2E4", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Reservations by Status */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Reservations by Status
                      </h3>
                      <p className="text-sm text-gray-600">
                        Current distribution of bookings
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">
                        {reservationsByStatus.length} statuses
                      </span>
                    </div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reservationsByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {reservationsByStatus.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            `Reservations (${name})`,
                          ]}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "12px",
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value, entry) => (
                            <span className="text-sm text-gray-700">
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Daily Reservations */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Daily Reservations
                      </h3>
                      <p className="text-sm text-gray-600">
                        Booking demand trend
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">
                        {reservationsPerDay.length} days
                      </span>
                    </div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reservationsPerDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: "#64748B", fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: "#E2E8F0" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748B", fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: "#E2E8F0" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#22C55E"
                          fill="url(#colorReservations)"
                          strokeWidth={2}
                        />
                        <defs>
                          <linearGradient
                            id="colorReservations"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#22C55E"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#22C55E"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Revenue by Branch */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Revenue by Branch
                      </h3>
                      <p className="text-sm text-gray-600">
                        Top performing locations
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">
                        {revenueByBranch.length} branches
                      </span>
                    </div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueByBranch}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748B", fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: "#E2E8F0" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748B", fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: "#E2E8F0" }}
                          tickFormatter={(v) => `$${v / 1000}k`}
                        />
                        <Tooltip
                          formatter={(value) => [
                            `$${Number(value).toLocaleString()}`,
                            "Revenue",
                          ]}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "12px",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#1EA2E4"
                          radius={[6, 6, 0, 0]}
                          barSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Full Width Chart - Fleet by Class */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Fleet Distribution by Vehicle Class
                      </h3>
                      <p className="text-sm text-gray-600">
                        Number of vehicles per class
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">
                        Total fleet: {dashboardData.kpis.total_vehicles}
                      </span>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vehiclesByClass}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748B", fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: "#E2E8F0" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748B", fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: "#E2E8F0" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: 10,
                            padding: "12px",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#F59E0B"
                          radius={[6, 6, 0, 0]}
                          barSize={50}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Activity / Stats Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Stats */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Avg. Rental Duration
                          </p>
                          <p className="font-semibold text-gray-900">
                            {dashboardData.additionalStats?.avg_rental_duration || "N/A"} days
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Completion Rate
                          </p>
                          <p className="font-semibold text-gray-900">
                            {dashboardData.additionalStats?.completion_rate || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <TrendingUp className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            MoM Growth
                          </p>
                          <p className="font-semibold text-gray-900">
                            {dashboardData.additionalStats?.mom_growth || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Alerts */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Recent Alerts
                    </h3>
                    <span className="text-xs font-medium text-gray-500">
                      Last 24 hours
                    </span>
                  </div>
                  <div className="space-y-4">
                    {dashboardData.kpis.open_or_review_incidents > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-red-900">
                            {dashboardData.kpis.open_or_review_incidents} incidents require attention
                          </p>
                          <p className="text-sm text-red-700 mt-1">
                            Review and take necessary actions
                          </p>
                        </div>
                      </div>
                    )}
                    {dashboardData.kpis.due_service_schedules_by_date > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <Wrench className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-amber-900">
                            {dashboardData.kpis.due_service_schedules_by_date} vehicles due for service
                          </p>
                          <p className="text-sm text-amber-700 mt-1">
                            Schedule maintenance appointments
                          </p>
                        </div>
                      </div>
                    )}
                    {dashboardData.kpis.driver_bookings_in_range > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-blue-900">
                            {dashboardData.kpis.driver_bookings_in_range} driver bookings in period
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            Driver-assisted rentals completed
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>
                      Data range: {formatDate(dateRange.from)} →{" "}
                      {formatDate(dateRange.to)}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      Last updated:{" "}
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <span>© {new Date().getFullYear()} Morental Admin Dashboard</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;