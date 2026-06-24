import React, { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Car,
  AlertTriangle,
  Wrench,
  CreditCard,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  FileSpreadsheet,
  Activity,
  Users,
  MapPin,
  Search,
  ChevronUp,
  Eye,
  Clock,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import ReportsService, {
  type ReportType,
  type ReservationReportRow,
  type PaymentReportRow,
  type IncidentReportRow,
  type FleetReportRow,
  type ServiceReportRow,
  type StatusSummary,
  ChartsService,
  type ChartsData,
  type FinancialData,
} from "../../../Services/adminAndManager/admin_reports_service";

// ─── Colour palettes ──────────────────────────────────────────────────────────
const CHART_COLORS = ["#0EA5E9","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#14B8A6","#F97316","#6366F1"];

const STATUS_COLORS: Record<string, string> = {
  completed: "#10B981", pending: "#F59E0B", active: "#0EA5E9",
  cancelled: "#EF4444", confirmed: "#3B82F6", available: "#10B981",
  rented: "#0EA5E9", maintenance: "#F59E0B", open: "#EF4444",
  under_review: "#F59E0B", resolved: "#10B981", written_off: "#6B7280",
  in_progress: "#0EA5E9", card: "#8B5CF6", wallet: "#EC4899",
  bank: "#06B6D4", cash: "#14B8A6",
};

const getColor = (key: string, idx: number) =>
  STATUS_COLORS[key?.toLowerCase()] || CHART_COLORS[idx % CHART_COLORS.length];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A";
const fmtCurrency = (v: any): string => {
  if (v === null || v === undefined) return "$0.00";
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : v?.$numberDecimal ? parseFloat(v.$numberDecimal) : 0;
  return fmt(isNaN(n) ? 0 : n);
};

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
    active: "bg-sky-100 text-sky-800", completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800", open: "bg-red-100 text-red-800",
    under_review: "bg-yellow-100 text-yellow-800", resolved: "bg-green-100 text-green-800",
    in_progress: "bg-blue-100 text-blue-800", available: "bg-green-100 text-green-800",
    rented: "bg-blue-100 text-blue-800", maintenance: "bg-yellow-100 text-yellow-800",
    written_off: "bg-gray-100 text-gray-700", paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };
  return map[s?.toLowerCase()] || "bg-gray-100 text-gray-700";
};

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = "overview" | "financial" | "reservations" | "payments" | "fleet" | "incidents" | "services";

interface Branch { _id: string; name: string }
interface Snack { show: boolean; message: string; type: "success" | "error" | "info" }

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const MoneyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name?.toLowerCase().includes("revenue") || p.name?.toLowerCase().includes("cost") || p.name?.toLowerCase().includes("profit") || p.name?.toLowerCase().includes("total") ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminReports: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [snackbar, setSnackbar] = useState<Snack>({ show: false, message: "", type: "info" });
  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Date range (default: current month start → today)
  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");

  // Overview charts
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState<string | null>(null);

  // Financial tab
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  // Table tabs (existing)
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [reservationsData, setReservationsData] = useState<ReservationReportRow[]>([]);
  const [paymentsData, setPaymentsData] = useState<PaymentReportRow[]>([]);
  const [fleetData, setFleetData] = useState<FleetReportRow[]>([]);
  const [incidentsData, setIncidentsData] = useState<IncidentReportRow[]>([]);
  const [servicesData, setServicesData] = useState<ServiceReportRow[]>([]);
  const [summaryData, setSummaryData] = useState<StatusSummary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Excel export
  const [exporting, setExporting] = useState(false);

  const showSnack = useCallback((message: string, type: Snack["type"]) => {
    if (snackTimer.current) clearTimeout(snackTimer.current);
    setSnackbar({ show: true, message, type });
    snackTimer.current = setTimeout(() => setSnackbar((p) => ({ ...p, show: false })), 3500);
  }, []);

  // Fetch branches for filter
  useEffect(() => {
    const token = (() => { try { return JSON.parse(localStorage.getItem("car_rental_auth") || "{}").token; } catch { return null; } })();
    if (!token) return;
    fetch("http://13.61.185.238:5050/api/v1/branches", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.success && Array.isArray(d.data)) setBranches(d.data); })
      .catch(() => {});
  }, []);

  // ── Load overview charts ──────────────────────────────────────────────────
  const loadCharts = useCallback(async () => {
    setChartsLoading(true);
    setChartsError(null);
    try {
      const data = await ChartsService.getChartsData(dateFrom, dateTo, branchId || undefined);
      setChartsData(data);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load chart data";
      setChartsError(msg);
      showSnack(msg, "error");
    } finally {
      setChartsLoading(false);
    }
  }, [dateFrom, dateTo, branchId, showSnack]);

  // ── Load financial tab ────────────────────────────────────────────────────
  const loadFinancial = useCallback(async () => {
    setFinancialLoading(true);
    try {
      const data = await ChartsService.getFinancialData(dateFrom, dateTo, branchId || undefined);
      setFinancialData(data);
    } catch (e: any) {
      showSnack(e?.response?.data?.message || "Failed to load financial data", "error");
    } finally {
      setFinancialLoading(false);
    }
  }, [dateFrom, dateTo, branchId, showSnack]);

  // ── Load table tabs ───────────────────────────────────────────────────────
  const loadTable = useCallback(async (type: ReportType) => {
    setTableLoading(true);
    setTableError(null);
    try {
      const params: Record<string, string> = {};
      if (branchId) params.branch_id = branchId;
      Object.assign(params, filters);
      const resp = await ReportsService.getReports(type, dateFrom, dateTo, currentPage, 25, params);
      const { rows, summary, paging } = resp.data;
      if (type === "reservations") setReservationsData(rows as ReservationReportRow[]);
      if (type === "payments") setPaymentsData(rows as PaymentReportRow[]);
      if (type === "fleet") setFleetData(rows as FleetReportRow[]);
      if (type === "incidents") setIncidentsData(rows as IncidentReportRow[]);
      if (type === "services") setServicesData(rows as ServiceReportRow[]);
      setSummaryData(summary.by_status || summary.by_payment_status || []);
      setTotalRows(summary.total_rows);
      setTotalPages(paging.total_pages);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to load report";
      setTableError(msg);
      showSnack(msg, "error");
    } finally {
      setTableLoading(false);
    }
  }, [dateFrom, dateTo, branchId, currentPage, filters, showSnack]);

  // Trigger loads when tab or params change
  useEffect(() => {
    if (activeTab === "overview") loadCharts();
    else if (activeTab === "financial") loadFinancial();
    else loadTable(activeTab as ReportType);
  }, [activeTab, dateFrom, dateTo, branchId, currentPage, filters]);

  useEffect(() => { setCurrentPage(1); setFilters({}); }, [activeTab]);

  // ── Excel export ──────────────────────────────────────────────────────────
  const handleExcelExport = async () => {
    setExporting(true);
    try {
      showSnack("Preparing Excel export…", "info");
      const params: Record<string, string> = { limit: "200", page: "1" };
      if (branchId) params.branch_id = branchId;

      const [resData, payData, fleetD, incData, svcData, finData] = await Promise.all([
        ReportsService.getReports<ReservationReportRow>("reservations", dateFrom, dateTo, 1, 200, params),
        ReportsService.getReports<PaymentReportRow>("payments", dateFrom, dateTo, 1, 200, params),
        ReportsService.getReports<FleetReportRow>("fleet", dateFrom, dateTo, 1, 200, params),
        ReportsService.getReports<IncidentReportRow>("incidents", dateFrom, dateTo, 1, 200, params),
        ReportsService.getReports<ServiceReportRow>("services", dateFrom, dateTo, 1, 200, params),
        ChartsService.getFinancialData(dateFrom, dateTo, branchId || undefined),
      ]);

      const wb = XLSX.utils.book_new();

      // Sheet 1: Financial Summary
      const finRows = [
        ["MoRental Zimbabwe – Financial Report"],
        [`Period: ${dateFrom} to ${dateTo}`],
        [],
        ["Month", "Revenue ($)", "Service Costs ($)", "Incident Costs ($)", "Total Costs ($)", "Gross Profit ($)", "Transactions"],
        ...finData.monthly_pl.map((r) => [r.month, r.revenue, r.service_cost, r.incident_cost, r.total_cost, r.gross_profit, r.transactions]),
        [],
        ["TOTALS", finData.totals.revenue, finData.totals.service_cost, finData.totals.incident_cost, finData.totals.total_cost, finData.totals.gross_profit, finData.totals.transactions],
        ["Gross Margin %", `${finData.totals.gross_margin_pct}%`],
      ];
      const wsFinancial = XLSX.utils.aoa_to_sheet(finRows);
      wsFinancial["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsFinancial, "Financial Summary");

      // Sheet 2: Reservations
      const resRows = resData.data.rows.map((r) => ({
        Code: r.code,
        Status: r.status,
        "Created At": fmtDate(r.created_at),
        "Pickup Date": fmtDate(r.pickup?.at),
        "Dropoff Date": fmtDate(r.dropoff?.at),
        "Currency": r.pricing?.currency,
        "Grand Total ($)": r.pricing?.grand_total?.$numberDecimal ? parseFloat(r.pricing.grand_total.$numberDecimal) : 0,
      }));
      const wsRes = XLSX.utils.json_to_sheet(resRows);
      wsRes["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsRes, "Reservations");

      // Sheet 3: Payments
      const payRows = payData.data.rows.map((r) => ({
        "Reservation Code": r.reservation_code,
        Status: r.paymentStatus,
        Method: r.method,
        Provider: r.provider,
        Currency: r.currency,
        "Amount ($)": r.amount?.$numberDecimal ? parseFloat(r.amount.$numberDecimal) : 0,
        Date: fmtDate(r.boughtAt),
      }));
      const wsPay = XLSX.utils.json_to_sheet(payRows);
      wsPay["!cols"] = [{ wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsPay, "Payments");

      // Sheet 4: Fleet
      const fleetRows = fleetD.data.rows.map((r) => ({
        "Plate Number": r.plate_number,
        Status: r.status,
        Availability: r.availability_state,
        "Odometer (km)": r.odometer_km,
        "Added On": fmtDate(r.created_at),
      }));
      const wsFleet = XLSX.utils.json_to_sheet(fleetRows);
      wsFleet["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsFleet, "Fleet");

      // Sheet 5: Incidents
      const incRows = incData.data.rows.map((r) => ({
        Type: r.type,
        Severity: r.severity,
        Status: r.status,
        "Estimated Cost ($)": r.estimated_cost?.$numberDecimal ? parseFloat(r.estimated_cost.$numberDecimal) : 0,
        "Final Cost ($)": r.final_cost?.$numberDecimal ? parseFloat(r.final_cost.$numberDecimal) : 0,
        "Occurred At": fmtDate(r.occurred_at),
      }));
      const wsInc = XLSX.utils.json_to_sheet(incRows);
      wsInc["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsInc, "Incidents");

      // Sheet 6: Services
      const svcRows = svcData.data.rows.map((r) => ({
        Type: r.type,
        Status: r.status,
        "Odometer (km)": r.odometer_km,
        "Cost ($)": r.cost || 0,
        Date: fmtDate(r.created_at),
      }));
      const wsSvc = XLSX.utils.json_to_sheet(svcRows);
      wsSvc["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsSvc, "Services");

      const filename = `MoRental_Report_${dateFrom}_to_${dateTo}.xlsx`;
      XLSX.writeFile(wb, filename);
      showSnack("Excel report downloaded successfully", "success");
    } catch (e: any) {
      showSnack(e?.message || "Excel export failed", "error");
    } finally {
      setExporting(false);
    }
  };

  // ── Filter helpers ────────────────────────────────────────────────────────
  const getFilterOptions = () => {
    switch (activeTab) {
      case "reservations": return [{ key: "status", label: "Status", options: ["pending","confirmed","active","completed","cancelled"] }];
      case "payments": return [{ key: "payment_status", label: "Status", options: ["pending","sent","paid","failed","cancelled"] }];
      case "incidents": return [
        { key: "status", label: "Status", options: ["open","under_review","resolved","written_off"] },
        { key: "severity", label: "Severity", options: ["minor","major"] },
      ];
      case "fleet": return [
        { key: "status", label: "Status", options: ["active","inactive"] },
        { key: "availability", label: "Availability", options: ["available","rented","maintenance"] },
      ];
      case "services": return [
        { key: "status", label: "Status", options: ["open","in_progress","completed"] },
        { key: "type", label: "Type", options: ["scheduled_service","repair","inspection"] },
      ];
      default: return [];
    }
  };

  const getCurrentTableData = () => {
    const q = searchQuery.toLowerCase();
    const search = <T extends Record<string, any>>(rows: T[], fields: string[]) =>
      q ? rows.filter((r) => fields.some((f) => r[f]?.toString().toLowerCase().includes(q))) : rows;

    if (activeTab === "reservations") return search(reservationsData, ["code","status"]);
    if (activeTab === "payments") return search(paymentsData, ["reservation_code","paymentStatus","method"]);
    if (activeTab === "fleet") return search(fleetData, ["plate_number","status","availability_state"]);
    if (activeTab === "incidents") return search(incidentsData, ["type","severity","status"]);
    if (activeTab === "services") return search(servicesData, ["type","status"]);
    return [];
  };

  // ── Renderers ─────────────────────────────────────────────────────────────

  const renderKPICards = () => {
    if (!chartsData) return null;
    const k = chartsData.kpis;
    const cards = [
      { label: "Total Revenue", value: fmt(k.total_revenue), icon: <DollarSign className="w-5 h-5" />, color: "text-green-600 bg-green-100" },
      { label: "Total Bookings", value: k.total_bookings.toLocaleString(), icon: <Calendar className="w-5 h-5" />, color: "text-blue-600 bg-blue-100" },
      { label: "Avg Booking Value", value: fmt(k.avg_booking_value), icon: <TrendingUp className="w-5 h-5" />, color: "text-purple-600 bg-purple-100" },
      { label: "Fleet Utilisation", value: `${k.fleet_utilization_pct}%`, icon: <Car className="w-5 h-5" />, color: "text-orange-600 bg-orange-100" },
      { label: "Active Reservations", value: k.active_reservations.toLocaleString(), icon: <Activity className="w-5 h-5" />, color: "text-sky-600 bg-sky-100" },
      { label: "Pending Incidents", value: k.pending_incidents.toLocaleString(), icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-600 bg-red-100" },
      { label: "Fleet (Rented)", value: `${k.fleet_rented} / ${k.fleet_total}`, icon: <MapPin className="w-5 h-5" />, color: "text-teal-600 bg-teal-100" },
      { label: "Transactions", value: k.total_transactions.toLocaleString(), icon: <CreditCard className="w-5 h-5" />, color: "text-indigo-600 bg-indigo-100" },
    ];
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{c.label}</p>
              <span className={`p-1.5 rounded-lg ${c.color}`}>{c.icon}</span>
            </div>
            <p className="text-xl font-bold text-gray-800">{c.value}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderOverviewCharts = () => {
    if (chartsLoading) return <div className="flex items-center justify-center h-64"><Loader className="w-8 h-8 animate-spin text-blue-500" /></div>;
    if (chartsError) return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-600">{chartsError}</p>
        <button onClick={loadCharts} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Retry</button>
      </div>
    );
    if (!chartsData) return null;

    const { monthly_revenue, booking_status_dist, fleet_utilization, revenue_by_branch, payment_method_split, monthly_bookings, incident_costs_by_type } = chartsData;

    return (
      <div>
        {renderKPICards()}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Chart 1 – Monthly Revenue Trend (full width) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" />Monthly Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthly_revenue} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<MoneyTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0EA5E9" fill="url(#revGrad)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="transactions" name="Transactions" stroke="#10B981" strokeWidth={1.5} dot={false} yAxisId={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2 – Booking Status Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-500" />Reservation Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={booking_status_dist} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {booking_status_dist.map((e, i) => <Cell key={i} fill={getColor(e.status, i)} />)}
                </Pie>
                <Tooltip formatter={(v: any, n: string) => [v, n]} />
                <Legend formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3 – Fleet Utilisation */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Car className="w-4 h-4 text-orange-500" />Fleet Utilisation</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={fleet_utilization} dataKey="count" nameKey="state" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {fleet_utilization.map((e, i) => <Cell key={i} fill={getColor(e.state, i)} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} vehicles`]} />
                <Legend formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4 – Revenue by Branch (full width) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-green-500" />Revenue by Branch</h3>
            {revenue_by_branch.length === 0 ? (
              <p className="text-gray-400 text-center py-10 text-sm">No branch revenue data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenue_by_branch} margin={{ top: 5, right: 20, bottom: 30, left: 10 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="branch" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip content={<MoneyTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                    {revenue_by_branch.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart 5 – Payment Method Split */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-500" />Payment Method Split</h3>
            {payment_method_split.length === 0 ? (
              <p className="text-gray-400 text-center py-10 text-sm">No payment data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={payment_method_split} dataKey="total" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
                    {payment_method_split.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`]} />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart 6 – Monthly Bookings vs Completions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-teal-500" />Monthly Bookings vs Completions</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly_bookings} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={10} />
                <Bar dataKey="created" name="Created" fill="#0EA5E9" radius={[3, 3, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 7 – Incident Costs by Type (full width) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" />Incident Costs by Type</h3>
            {incident_costs_by_type.length === 0 ? (
              <p className="text-gray-400 text-center py-10 text-sm">No incident data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={incident_costs_by_type} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<MoneyTooltip />} />
                  <Legend iconType="circle" iconSize={10} />
                  <Bar dataKey="estimated_cost" name="Estimated Cost" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="final_cost" name="Final Cost" fill="#EF4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFinancialTab = () => {
    if (financialLoading) return <div className="flex items-center justify-center h-64"><Loader className="w-8 h-8 animate-spin text-blue-500" /></div>;
    if (!financialData) return null;
    const { totals, monthly_pl } = financialData;

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: fmt(totals.revenue), color: "border-l-4 border-green-500", icon: <DollarSign className="w-5 h-5 text-green-500" /> },
            { label: "Total Costs", value: fmt(totals.total_cost), color: "border-l-4 border-red-400", icon: <TrendingUp className="w-5 h-5 text-red-400" /> },
            { label: "Gross Profit", value: fmt(totals.gross_profit), color: `border-l-4 ${totals.gross_profit >= 0 ? "border-blue-500" : "border-red-600"}`, icon: <Activity className="w-5 h-5 text-blue-500" /> },
            { label: "Gross Margin", value: `${totals.gross_margin_pct}%`, color: "border-l-4 border-purple-500", icon: <BarChart3 className="w-5 h-5 text-purple-500" /> },
          ].map((c) => (
            <div key={c.label} className={`bg-white rounded-xl ${c.color} p-4 shadow-sm`}>
              <div className="flex items-center gap-2 mb-1">{c.icon}<p className="text-xs text-gray-500 font-medium">{c.label}</p></div>
              <p className="text-2xl font-bold text-gray-800">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue vs Costs chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue vs Costs</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly_pl} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<MoneyTooltip />} />
              <Legend iconType="circle" iconSize={10} />
              <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="total_cost" name="Total Cost" fill="#EF4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="gross_profit" name="Gross Profit" fill="#0EA5E9" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly P&L Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Monthly Profit & Loss Statement</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Month","Revenue","Service Costs","Incident Costs","Total Costs","Gross Profit","Transactions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly_pl.map((row) => (
                  <tr key={row.month} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{row.month}</td>
                    <td className="px-4 py-3 text-green-700 font-semibold">{fmt(row.revenue)}</td>
                    <td className="px-4 py-3 text-red-600">{fmt(row.service_cost)}</td>
                    <td className="px-4 py-3 text-orange-600">{fmt(row.incident_cost)}</td>
                    <td className="px-4 py-3 text-red-700 font-medium">{fmt(row.total_cost)}</td>
                    <td className={`px-4 py-3 font-bold ${row.gross_profit >= 0 ? "text-blue-700" : "text-red-700"}`}>{fmt(row.gross_profit)}</td>
                    <td className="px-4 py-3 text-gray-600">{row.transactions}</td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                  <td className="px-4 py-3 text-gray-800">TOTAL</td>
                  <td className="px-4 py-3 text-green-700">{fmt(totals.revenue)}</td>
                  <td className="px-4 py-3 text-red-600">{fmt(totals.service_cost)}</td>
                  <td className="px-4 py-3 text-orange-600">{fmt(totals.incident_cost)}</td>
                  <td className="px-4 py-3 text-red-700">{fmt(totals.total_cost)}</td>
                  <td className={`px-4 py-3 ${totals.gross_profit >= 0 ? "text-blue-700" : "text-red-700"}`}>{fmt(totals.gross_profit)}</td>
                  <td className="px-4 py-3 text-gray-700">{totals.transactions}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTableTab = () => {
    const data = getCurrentTableData();

    const colHeaders: Record<TabType, string[]> = {
      overview: [], financial: [],
      reservations: ["Code","Status","Created","Pickup","Dropoff","Total"],
      payments: ["Reservation","Status","Method","Provider","Amount","Date"],
      fleet: ["Plate","Status","Availability","Odometer","Added"],
      incidents: ["Vehicle","Type","Severity","Status","Est. Cost","Date"],
      services: ["Vehicle","Type","Status","Odometer","Cost","Date"],
    };

    const renderRow = (item: any, i: number) => {
      if (activeTab === "reservations") {
        const r = item as ReservationReportRow;
        return (
          <tr key={i} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3 font-mono text-sm">{r.code}</td>
            <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadge(r.status)}`}>{r.status}</span></td>
            <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(r.created_at)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(r.pickup?.at)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(r.dropoff?.at)}</td>
            <td className="px-4 py-3 text-sm font-semibold">{fmtCurrency(r.pricing?.grand_total)}</td>
          </tr>
        );
      }
      if (activeTab === "payments") {
        const r = item as PaymentReportRow;
        return (
          <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-sm">{r.reservation_code}</td>
            <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadge(r.paymentStatus)}`}>{r.paymentStatus}</span></td>
            <td className="px-4 py-3 text-sm capitalize">{r.method}</td>
            <td className="px-4 py-3 text-sm uppercase">{r.provider}</td>
            <td className="px-4 py-3 text-sm font-semibold">{fmtCurrency(r.amount)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(r.boughtAt)}</td>
          </tr>
        );
      }
      if (activeTab === "fleet") {
        const r = item as FleetReportRow;
        return (
          <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-sm font-semibold">{r.plate_number}</td>
            <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadge(r.status)}`}>{r.status}</span></td>
            <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadge(r.availability_state)}`}>{r.availability_state}</span></td>
            <td className="px-4 py-3 text-sm text-gray-600">{r.odometer_km?.toLocaleString()} km</td>
            <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(r.created_at)}</td>
          </tr>
        );
      }
      if (activeTab === "incidents") {
        const r = item as IncidentReportRow;
        return (
          <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-sm">{r.vehicle_id?.slice(-8)}</td>
            <td className="px-4 py-3 text-sm capitalize">{r.type?.replace(/_/g, " ")}</td>
            <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadge(r.severity)}`}>{r.severity}</span></td>
            <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadge(r.status)}`}>{r.status?.replace(/_/g, " ")}</span></td>
            <td className="px-4 py-3 text-sm font-semibold">{fmtCurrency(r.estimated_cost)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(r.occurred_at)}</td>
          </tr>
        );
      }
      if (activeTab === "services") {
        const r = item as ServiceReportRow;
        return (
          <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 font-mono text-sm">{r.vehicle_id?.slice(-8)}</td>
            <td className="px-4 py-3 text-sm capitalize">{r.type?.replace(/_/g, " ")}</td>
            <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusBadge(r.status)}`}>{r.status?.replace(/_/g, " ")}</span></td>
            <td className="px-4 py-3 text-sm text-gray-600">{r.odometer_km?.toLocaleString()} km</td>
            <td className="px-4 py-3 text-sm font-semibold">{fmtCurrency(r.cost)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(r.created_at)}</td>
          </tr>
        );
      }
      return null;
    };

    return (
      <div className="space-y-4">
        {/* Summary badges */}
        {summaryData.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {summaryData.map((s) => (
              <span key={s.status} className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge(s.status)}`}>
                {s.status}: {s.count}{s.total_amount ? ` (${fmtCurrency(s.total_amount)})` : ""}
              </span>
            ))}
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Total: {totalRows}</span>
          </div>
        )}

        {/* Search + Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <Filter className="w-4 h-4" /> Filters {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getFilterOptions().map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <select value={filters[f.key] || ""} onChange={(e) => { if (e.target.value) setFilters({ ...filters, [f.key]: e.target.value }); else { const nf = { ...filters }; delete nf[f.key]; setFilters(nf); } setCurrentPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All</option>
                    {f.options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ").toUpperCase()}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button onClick={() => { setFilters({}); setCurrentPage(1); }} className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline">Clear filters</button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {tableLoading ? (
            <div className="flex items-center justify-center h-48"><Loader className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : tableError ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-red-600 text-sm">{tableError}</p>
              <button onClick={() => loadTable(activeTab as ReportType)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Retry</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {(colHeaders[activeTab] || []).map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400"><FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />No data found</td></tr>
                  ) : data.map((item, i) => renderRow(item, i))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm">
              <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100">Previous</button>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Tabs config ───────────────────────────────────────────────────────────
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "financial", label: "Financial", icon: <DollarSign className="w-4 h-4" /> },
    { id: "reservations", label: "Reservations", icon: <Calendar className="w-4 h-4" /> },
    { id: "payments", label: "Payments", icon: <CreditCard className="w-4 h-4" /> },
    { id: "fleet", label: "Fleet", icon: <Car className="w-4 h-4" /> },
    { id: "incidents", label: "Incidents", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: "services", label: "Services", icon: <Wrench className="w-4 h-4" /> },
  ];

  // ── Quick date presets ────────────────────────────────────────────────────
  const applyPreset = (days: number) => {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    setDateFrom(from.toISOString().split("T")[0]);
    setDateTo(to.toISOString().split("T")[0]);
    setShowDatePicker(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" />Reports & Analytics</h1>
                <p className="text-xs text-gray-500 mt-0.5">Car rental performance insights — MoRental Zimbabwe</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date range picker */}
              <div className="relative">
                <button onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{dateFrom} → {dateTo}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {showDatePicker && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-30 p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[["7d",7],["30d",30],["90d",90],["12m",365]].map(([l, d]) => (
                        <button key={l} onClick={() => applyPreset(Number(d))} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">{l}</button>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">From</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">To</label>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <button onClick={() => setShowDatePicker(false)} className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Apply</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Branch filter */}
              {branches.length > 0 && (
                <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Branches</option>
                  {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              )}

              {/* Refresh */}
              <button onClick={() => { if (activeTab === "overview") loadCharts(); else if (activeTab === "financial") loadFinancial(); else loadTable(activeTab as ReportType); }}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>

              {/* Excel Export */}
              <button onClick={handleExcelExport} disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {exporting ? <Loader className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-0">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === "overview" && renderOverviewCharts()}
          {activeTab === "financial" && renderFinancialTab()}
          {["reservations","payments","fleet","incidents","services"].includes(activeTab) && renderTableTab()}
        </div>
      </div>

      {/* Snackbar */}
      {snackbar.show && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[280px] ${
            snackbar.type === "success" ? "bg-green-50 border-green-200 text-green-800" :
            snackbar.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
            "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {snackbar.type === "info" && <Clock className="w-5 h-5 flex-shrink-0" />}
            <p className="text-sm font-medium flex-1">{snackbar.message}</p>
            <button onClick={() => setSnackbar((p) => ({ ...p, show: false }))}><X className="w-4 h-4 opacity-60 hover:opacity-100" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
