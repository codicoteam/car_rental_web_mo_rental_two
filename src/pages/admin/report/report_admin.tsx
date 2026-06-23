// AdminReportScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAdminReport,
//   fetchAdminReportData,
  getErrorDisplay,
  mapReportRowToColumns,
  type AdminReportType,
  type IAdminReportData,

} from "../../../Services/adminAndManager/admin_report";
import Sidebar from "../../../components/Sidebar";
import {
  ArrowLeft,

  Calendar,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  MoreVertical,
  X,
  AlertCircle,
  CheckCircle,
  DownloadCloud,
  Printer,
  FileDown,
  FileSpreadsheet,
  Users,
  Car,
  CreditCard,
  AlertTriangle,
  Settings,
  User,
  DollarSign,
  CalendarDays,
  Clock,
  Building2,
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Layers,
  Grid,
  Table,
  PieChart as PieChartIcon,
  BarChart,
  Activity,
  Briefcase,
  Shield,
  Tag,
  CheckSquare,
  XCircle,
  Truck,
} from "lucide-react";

// Report types with icons
const REPORT_TYPES: Array<{
  value: AdminReportType;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    value: "reservations",
    label: "Reservations",
    icon: <Calendar className="w-4 h-4" />,
    description: "Detailed reservation reports and analytics",
  },
  {
    value: "payments",
    label: "Payments",
    icon: <CreditCard className="w-4 h-4" />,
    description: "Payment transactions and financial reports",
  },
  {
    value: "vehicles",
    label: "Vehicles",
    icon: <Car className="w-4 h-4" />,
    description: "Vehicle fleet status and utilization",
  },
{
  value: "fleet",
  label: "Fleet",
  icon: <Truck className="w-4 h-4" />,
  description: "Fleet management and vehicle reports",
}
,
  {
    value: "incidents",
    label: "Incidents",
    icon: <AlertTriangle className="w-4 h-4" />,
    description: "Incident reports and safety records",
  },
  {
    value: "services",
    label: "Services",
    icon: <Settings className="w-4 h-4" />,
    description: "Maintenance and service history",
  },
];

// Status colors for visual indicators
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  completed: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  cancelled: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
  paid: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200" },
  unpaid: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
  confirmed: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200" },
  returned: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  available: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  rented: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  maintenance: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  resolved: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  open: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
};

interface AdminReportScreenProps {}

const AdminReportScreen: React.FC<AdminReportScreenProps> = () => {
  const navigate = useNavigate();

  // State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<IAdminReportData | null>(null);
  
  // Filters and pagination
  const [reportType, setReportType] = useState<AdminReportType>("reservations");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  
  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Load report data
  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAdminReport({
        type: reportType,
        from: dateRange.from,
        to: dateRange.to,
        page: pagination.page,
        limit: pagination.limit,
      });

      const data = response.data;
      setReportData(data);
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        total: data.paging.total,
        totalPages: data.paging.total_pages,
      }));

      // Initialize column visibility (show all by default)
      const initialVisibility: Record<string, boolean> = {};
      data.columns.forEach(col => {
        initialVisibility[col] = true;
      });
      setColumnVisibility(initialVisibility);

      showSnackbar(`${data.type.charAt(0).toUpperCase() + data.type.slice(1)} report loaded successfully`, "success");
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      setError(errorDisplay.message || "Failed to load report data");
      showSnackbar(errorDisplay.message || "Failed to load report", "error");
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange, pagination.page, pagination.limit]);

  // Initial load
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Format currency
  const formatCurrency = (value: any, currency: string = "USD") => {
    if (!value) return "$0.00";
    
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : Number(value);
    if (isNaN(num)) return "$0.00";
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Format date
  const formatDate = (dateString: any) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Format date for display (date only)
  const formatDateOnly = (dateString: any) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Get value display with type detection
  const getDisplayValue = (value: any, columnName: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">N/A</span>;
    }

    // Check if it's a date
    if (typeof value === 'string' && (
      columnName.toLowerCase().includes('date') ||
      columnName.toLowerCase().includes('at') ||
      columnName.toLowerCase().includes('time') ||
      (new Date(value).toString() !== 'Invalid Date' && !isNaN(new Date(value).getTime()))
    )) {
      return formatDate(value);
    }

    // Check if it's currency
    if (typeof value === 'number' || 
        (typeof value === 'string' && (
          columnName.toLowerCase().includes('amount') ||
          columnName.toLowerCase().includes('price') ||
          columnName.toLowerCase().includes('total') ||
          columnName.toLowerCase().includes('cost') ||
          columnName.toLowerCase().includes('fee')
        ))) {
      return formatCurrency(value);
    }

    // Check if it's a status
    if (typeof value === 'string' && STATUS_COLORS[value.toLowerCase()]) {
      const statusKey = value.toLowerCase();
      const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.pending;
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      );
    }

    // Check if it's boolean
    if (typeof value === 'boolean') {
      return value ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckSquare className="w-3 h-3 mr-1" /> Yes
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3 h-3 mr-1" /> No
        </span>
      );
    }

    // Default string display
    return String(value);
  };

  // Toggle row expansion
  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!reportData) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const { columns, rows, type, summary } = reportData;
    const visibleColumns = columns.filter(col => columnVisibility[col]);

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${dateRange.from} to ${dateRange.to}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #1f2937; background: #fff; }
            .header { border-bottom: 2px solid #1EA2E4; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; color: #1EA2E4; margin-bottom: 5px; }
            .title { font-size: 24px; font-weight: 600; margin: 10px 0; color: #111827; }
            .subtitle { color: #6b7280; margin-bottom: 15px; }
            .meta { display: flex; justify-content: space-between; background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e5e7eb; }
            .meta-item { text-align: center; flex: 1; }
            .meta-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta-value { font-size: 16px; font-weight: 600; color: #111827; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 25px 0; }
            th { background: #f3f4f6; text-align: left; padding: 12px 15px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
            td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
            tr:hover td { background: #f9fafb; }
            .summary { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-top: 30px; }
            .summary-title { font-size: 18px; font-weight: 600; color: #0369a1; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .summary-item { background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; }
            .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
            .summary-value { font-size: 20px; font-weight: bold; color: #111827; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
            .page-break { page-break-before: always; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              @page { margin: 20mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">MORENTAL</div>
            <h1 class="title">${type.charAt(0).toUpperCase() + type.slice(1)} Report</h1>
            <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>

          <div class="meta">
            <div class="meta-item">
              <div class="meta-label">Report Period</div>
              <div class="meta-value">${dateRange.from} to ${dateRange.to}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Total Records</div>
              <div class="meta-value">${pagination.total.toLocaleString()}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Current Page</div>
              <div class="meta-value">${pagination.page} of ${pagination.totalPages}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Generated By</div>
              <div class="meta-value">Admin Report System</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                ${visibleColumns.map(col => `<th>${col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => {
                const mappedRow = mapReportRowToColumns(row, visibleColumns);
                return `
                  <tr>
                    ${visibleColumns.map(col => `<td>${getDisplayValue(mappedRow[col], col)}</td>`).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          ${summary && Object.keys(summary).length > 0 ? `
          <div class="summary">
            <div class="summary-title">
              <BarChart3 size={18} />
              Report Summary
            </div>
            <div class="summary-grid">
              ${summary.by_status ? summary.by_status.map((item: any) => `
                <div class="summary-item">
                  <div class="summary-label">${item.status}</div>
                  <div class="summary-value">${item.count.toLocaleString()}</div>
                </div>
              `).join('') : ''}
              ${summary.total_rows ? `
                <div class="summary-item">
                  <div class="summary-label">Total Rows</div>
                  <div class="summary-value">${summary.total_rows.toLocaleString()}</div>
                </div>
              ` : ''}
              ${Object.entries(summary)
                .filter(([key]) => !['by_status', 'total_rows'].includes(key))
                .map(([key, value]) => `
                  <div class="summary-item">
                    <div class="summary-label">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    <div class="summary-value">${typeof value === 'number' ? formatCurrency(value) : value}</div>
                  </div>
                `).join('')}
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p>© ${new Date().getFullYear()} Morental. All rights reserved.</p>
            <p>This report is confidential and intended for authorized personnel only.</p>
            <p>Report ID: ${Date.now()}-${type}-${Math.random().toString(36).substr(2, 9)}</p>
          </div>

          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #1EA2E4; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500; display: inline-flex; align-items: center; gap: 8px;">
              <Printer size={18} />
              Print Report
            </button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    showSnackbar("PDF generated successfully. Click Print in the opened window.", "success");
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!reportData) return;

    const { columns, rows, type } = reportData;
    const visibleColumns = columns.filter(col => columnVisibility[col]);

    // Create CSV content
    const headers = visibleColumns.map(col => 
      `"${col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}"`
    ).join(',');

    const csvRows = rows.map(row => {
      const mappedRow = mapReportRowToColumns(row, visibleColumns);
      return visibleColumns.map(col => {
        const value = mappedRow[col];
        if (value === null || value === undefined) return '""';
        // Escape quotes and wrap in quotes
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',');
    });

    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${type}-report-${dateRange.from}-to-${dateRange.to}.csv`;
    link.click();

    showSnackbar("CSV exported successfully", "success");
  };

  // Handle pagination
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page }));
  };

  // Toggle column visibility
  const toggleColumnVisibility = (column: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Filtered rows based on search
  const filteredRows = reportData?.rows.filter(row => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return reportData.columns.some(column => {
      const value = mapReportRowToColumns(row, [column])[column];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchLower);
    });
  }) || [];

  // Get summary stats
  const getSummaryStats = () => {
    if (!reportData?.summary) return null;

    const summary = reportData.summary;
    const stats = [];

    if (summary.by_status && Array.isArray(summary.by_status)) {
      stats.push({
        label: "Status Breakdown",
        value: summary.by_status.length,
        icon: <PieChartIcon className="w-5 h-5" />,
        color: "bg-indigo-500",
      });
    }

    if (summary.total_rows !== undefined) {
      stats.push({
        label: "Total Records",
        value: summary.total_rows.toLocaleString(),
        icon: <Database className="w-5 h-5" />,
        color: "bg-emerald-500",
      });
    }

    // Add other summary metrics
    Object.entries(summary).forEach(([key, value]) => {
      if (key !== 'by_status' && key !== 'total_rows' && typeof value === 'number') {
        stats.push({
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: formatCurrency(value),
          icon: <DollarSign className="w-5 h-5" />,
          color: "bg-green-500",
        });
      }
    });

    return stats;
  };

  // Get visible columns
  const visibleColumns = reportData?.columns.filter(col => columnVisibility[col]) || [];

  // Get current report type info
  const currentReportType = REPORT_TYPES.find(rt => rt.value === reportType) || REPORT_TYPES[0];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans relative">
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
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigate("/admin-dashboard")}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Reports</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Generate and analyze detailed system reports
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className="font-semibold">{pagination.total.toLocaleString()}</span> total records
              </div>
            </div>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="px-6 pt-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">Select Report Type</h2>
                <p className="text-sm text-gray-600">
                  Choose a report category to analyze specific data
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Export to CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden md:inline">Export CSV</span>
                </button>
                <button
                  onClick={exportToPDF}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="hidden md:inline">Export PDF</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setReportType(type.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                    reportType === type.value
                      ? "border-[#1EA2E4] bg-blue-50 ring-2 ring-blue-100 ring-opacity-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      reportType === type.value ? "bg-[#1EA2E4] text-white" : "bg-gray-100 text-gray-600"
                    }`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{type.label}</h3>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      reportType === type.value
                        ? "bg-[#1EA2E4] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      Select Report
                    </span>
                    {reportType === type.value && (
                      <div className="w-2 h-2 rounded-full bg-[#1EA2E4] animate-pulse" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="px-6 pb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Date Range */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Search and Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search within report..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="w-5 h-5 text-gray-600" />
                    <span className="hidden sm:inline">Columns</span>
                  </button>
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-3 py-2.5 transition-colors ${
                        viewMode === "table"
                          ? "bg-[#1EA2E4] text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                      title="Table View"
                    >
                      <Table className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-2.5 border-l border-gray-300 transition-colors ${
                        viewMode === "grid"
                          ? "bg-[#1EA2E4] text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                      title="Grid View"
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                  </div>
                  <button
                    onClick={loadReportData}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Column Visibility Toggles */}
            {showFilters && reportData && (
              <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top duration-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Visible Columns</h4>
                <div className="flex flex-wrap gap-2">
                  {reportData.columns.map((column) => (
                    <button
                      key={column}
                      onClick={() => toggleColumnVisibility(column)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        columnVisibility[column]
                          ? "bg-[#1EA2E4] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {columnVisibility[column] ? (
                        <CheckSquare className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      const allVisible: Record<string, boolean> = {};
                      reportData.columns.forEach(col => {
                        allVisible[col] = true;
                      });
                      setColumnVisibility(allVisible);
                    }}
                    className="text-sm text-[#1EA2E4] hover:text-[#1A8BC9] font-medium"
                  >
                    Show All Columns
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {reportData?.summary && (
          <div className="px-6 pb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BarChart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Report Summary</h3>
                  <p className="text-sm text-gray-600">
                    Key metrics for {currentReportType.label} report
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {getSummaryStats()?.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                        <div className="text-white">
                          {stat.icon}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-500">{stat.label}</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Status Breakdown Chart */}
              {reportData.summary.by_status && (
                <div className="mt-6 pt-6 border-t border-blue-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Status Distribution</h4>
                  <div className="flex flex-wrap gap-3">
                    {reportData.summary.by_status.map((item: any) => (
                      <div
                        key={item.status}
                        className="flex-1 min-w-[120px] bg-white rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {item.status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            STATUS_COLORS[item.status]?.bg || 'bg-gray-100'
                          } ${STATUS_COLORS[item.status]?.text || 'text-gray-800'}`}>
                            {item.count}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-[#1EA2E4] transition-all duration-500"
                            style={{
                              width: `${(item.count / reportData.summary.total_rows) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="px-6 pb-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                <p className="text-gray-600 mb-2">Loading {currentReportType.label} report...</p>
                <p className="text-sm text-gray-500">Fetching data for {dateRange.from} to {dateRange.to}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="px-6 pb-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-red-600 text-center mb-2">{error}</p>
                <p className="text-gray-600 text-center mb-6 max-w-md">
                  Unable to load {currentReportType.label} report data. Please check your filters and try again.
                </p>
                <button
                  onClick={loadReportData}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Data */}
        {!loading && !error && reportData && (
          <div className="px-6 pb-6">
            {/* Report Header */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {currentReportType.label} Report
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {dateRange.from} to {dateRange.to}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Database className="w-4 h-4" />
                        {filteredRows.length.toLocaleString()} of {pagination.total.toLocaleString()} records
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-600">
                      Page <span className="font-semibold">{pagination.page}</span> of{" "}
                      <span className="font-semibold">{pagination.totalPages}</span>
                    </div>
                    <select
                      value={pagination.limit}
                      onChange={(e) => {
                        setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent text-sm"
                    >
                      <option value="10">10 per page</option>
                      <option value="25">25 per page</option>
                      <option value="50">50 per page</option>
                      <option value="100">100 per page</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table View */}
              {viewMode === "table" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        {visibleColumns.map((column) => (
                          <th
                            key={column}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            <div className="flex items-center gap-2">
                              <span>{column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                              <button
                                onClick={() => toggleColumnVisibility(column)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          </th>
                        ))}
                        <th className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={visibleColumns.length + 2} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <Database className="w-12 h-12 text-gray-300 mb-4" />
                              <p className="text-gray-500">No records found for the selected criteria</p>
                              <p className="text-sm text-gray-400 mt-1">
                                Try adjusting your search or date range
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, index) => {
                          const rowNumber = (pagination.page - 1) * pagination.limit + index + 1;
                          const mappedRow = mapReportRowToColumns(row, visibleColumns);
                          const rowId = row._id || `row-${index}`;
                          const isExpanded = expandedRows.has(rowId);

                          return (
                            <React.Fragment key={rowId}>
                              <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {rowNumber}
                                </td>
                                {visibleColumns.map((column) => (
                                  <td
                                    key={`${rowId}-${column}`}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                  >
                                    {getDisplayValue(mappedRow[column], column)}
                                  </td>
                                ))}
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <button
                                    onClick={() => toggleRowExpansion(rowId)}
                                    className="p-1 text-gray-400 hover:text-[#1EA2E4] hover:bg-blue-50 rounded transition-colors"
                                    title={isExpanded ? "Collapse details" : "Expand details"}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-blue-50">
                                  <td colSpan={visibleColumns.length + 2} className="px-6 py-4">
                                    <div className="bg-white rounded-lg border border-blue-100 p-4">
                                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        Detailed Record View
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(row).map(([key, value]) => (
                                          <div key={key} className="space-y-1">
                                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                              {key.replace(/_/g, ' ')}
                                            </div>
                                            <div className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                                              {getDisplayValue(value, key)}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Grid View */}
              {viewMode === "grid" && filteredRows.length > 0 && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRows.map((row, index) => {
                      const rowNumber = (pagination.page - 1) * pagination.limit + index + 1;
                      const mappedRow = mapReportRowToColumns(row, visibleColumns.slice(0, 5)); // Show first 5 columns in grid
                      const rowId = row._id || `row-${index}`;
                      const isExpanded = expandedRows.has(rowId);

                      return (
                        <div
                          key={rowId}
                          className="bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-blue-600">
                                    #{rowNumber}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {mappedRow[visibleColumns[0]] || `Record ${rowNumber}`}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {Object.keys(row).length} fields
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleRowExpansion(rowId)}
                                className="p-1 text-gray-400 hover:text-[#1EA2E4] hover:bg-blue-50 rounded transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                            <div className="space-y-3">
                              {visibleColumns.slice(1, 5).map((column) => (
                                <div key={column} className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {column.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 truncate ml-2 max-w-[120px]">
                                    {getDisplayValue(mappedRow[column], column)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
                              <div className="space-y-3">
                                {visibleColumns.slice(5).map((column) => (
                                  <div key={column} className="flex items-start justify-between">
                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                      {column.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-sm text-gray-900 text-right ml-2">
                                      {getDisplayValue(mappedRow[column], column)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {filteredRows.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-semibold">{Math.min(filteredRows.length, pagination.limit)}</span> of{" "}
                      <span className="font-semibold">{pagination.total.toLocaleString()}</span> records
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => goToPage(1)}
                        disabled={pagination.page === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                                pagination.page === pageNum
                                  ? "bg-[#1EA2E4] text-white"
                                  : "border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => goToPage(pagination.totalPages)}
                        disabled={pagination.page === pagination.totalPages}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Empty State */}
            {filteredRows.length === 0 && !loading && !error && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <Database className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Report Data Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? "No records match your search criteria. Try a different search term."
                    : "No data available for the selected report type and date range."}
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear Search
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
                      setDateRange({ from: thirtyDaysAgo, to: today });
                    }}
                    className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                  >
                    Reset to Last 30 Days
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Snackbar */}
      {snackbar.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${
              snackbar.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : snackbar.type === "error"
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}
          >
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

export default AdminReportScreen;