import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Download,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Eye,
  DollarSign,
  Car,
  AlertTriangle,
  Wrench,
  CreditCard,
  FileText,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Loader,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import ReportsService, { 
  type ReportType, 
  type ReservationReportRow,
  type PaymentReportRow,
  type IncidentReportRow,
  type FleetReportRow,
  type ServiceReportRow,
  type StatusSummary
} from "../../../Services/adminAndManager/admin_reports_service";

// Helper functions
const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value: any): string => {
  if (value === null || value === undefined) return "$0.00";
  
  let num = 0;
  if (typeof value === 'number') num = value;
  else if (typeof value === 'string') num = parseFloat(value);
  else if (value && typeof value === 'object' && '$numberDecimal' in value) {
    num = parseFloat(value.$numberDecimal);
  }
  
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    active: "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
    open: "bg-red-100 text-red-800",
    under_review: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    written_off: "bg-gray-100 text-gray-800",
    in_progress: "bg-blue-100 text-blue-800",
    available: "bg-green-100 text-green-800",
    rented: "bg-blue-100 text-blue-800",
    maintenance: "bg-yellow-100 text-yellow-800",
  };
  return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
};

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    minor: "bg-green-100 text-green-800",
    major: "bg-red-100 text-red-800",
  };
  return colors[severity?.toLowerCase()] || "bg-gray-100 text-gray-800";
};

const getPaymentStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    sent: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    failed: "bg-red-100 text-red-800",
  };
  return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
};

const AdminReports: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReportType, setActiveReportType] = useState<ReportType>("reservations");
  
  // Data states
  const [reservationsData, setReservationsData] = useState<ReservationReportRow[]>([]);
  const [paymentsData, setPaymentsData] = useState<PaymentReportRow[]>([]);
  const [incidentsData, setIncidentsData] = useState<IncidentReportRow[]>([]);
  const [fleetData, setFleetData] = useState<FleetReportRow[]>([]);
  const [servicesData, setServicesData] = useState<ServiceReportRow[]>([]);
  
  // Summary states
  const [summaryData, setSummaryData] = useState<StatusSummary[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(25);
  
  // Date range
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  
  // Modal states
  const [selectedReservation, setSelectedReservation] = useState<ReservationReportRow | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentReportRow | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReportRow | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<FleetReportRow | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceReportRow | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Export loading
  const [exporting, setExporting] = useState(false);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });
  
  // Report type configurations
  const reportTypes: { value: ReportType; label: string; icon: React.ReactNode }[] = [
    { value: "reservations", label: "Reservations", icon: <Calendar className="w-5 h-5" /> },
    { value: "payments", label: "Payments", icon: <CreditCard className="w-5 h-5" /> },
    { value: "incidents", label: "Incidents", icon: <AlertTriangle className="w-5 h-5" /> },
    { value: "fleet", label: "Fleet", icon: <Car className="w-5 h-5" /> },
    { value: "services", label: "Services", icon: <Wrench className="w-5 h-5" /> },
  ];
  
  // Filter options for each report type
  const getFilterOptions = () => {
    switch (activeReportType) {
      case "reservations":
        return [
          { key: "status", label: "Status", options: ["pending", "confirmed", "active", "completed", "cancelled"] }
        ];
      case "payments":
        return [
          { key: "payment_status", label: "Payment Status", options: ["pending", "sent", "completed", "cancelled", "failed"] }
        ];
      case "incidents":
        return [
          { key: "status", label: "Status", options: ["open", "under_review", "resolved", "written_off"] },
          { key: "severity", label: "Severity", options: ["minor", "major"] },
          { key: "type", label: "Type", options: ["accident", "tyre", "scratch", "windshield", "mechanical_issue", "other"] }
        ];
      case "fleet":
        return [
          { key: "status", label: "Status", options: ["active", "inactive"] },
          { key: "availability", label: "Availability", options: ["available", "rented", "maintenance"] }
        ];
      case "services":
        return [
          { key: "status", label: "Status", options: ["open", "in_progress", "completed"] },
          { key: "type", label: "Type", options: ["scheduled_service", "repair", "inspection"] }
        ];
      default:
        return [];
    }
  };
  
  // Load data based on active report type
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      switch (activeReportType) {
        case "reservations":
          response = await ReportsService.getReservationsReport(
            dateRange.from,
            dateRange.to,
            currentPage,
            itemsPerPage,
            filters.status
          );
          setReservationsData(response.data.rows);
          setSummaryData(response.data.summary.by_status || []);
          setTotalRows(response.data.summary.total_rows);
          setTotalPages(response.data.paging.total_pages);
          break;
          
        case "payments":
          response = await ReportsService.getPaymentsReport(
            dateRange.from,
            dateRange.to,
            currentPage,
            itemsPerPage,
            filters.payment_status
          );
          setPaymentsData(response.data.rows);
          setSummaryData(response.data.summary.by_payment_status || []);
          setTotalRows(response.data.summary.total_rows);
          setTotalPages(response.data.paging.total_pages);
          break;
          
        case "incidents":
          response = await ReportsService.getIncidentsReport(
            dateRange.from,
            dateRange.to,
            currentPage,
            itemsPerPage,
            filters.status,
            filters.severity
          );
          setIncidentsData(response.data.rows);
          setSummaryData(response.data.summary.by_status || []);
          setTotalRows(response.data.summary.total_rows);
          setTotalPages(response.data.paging.total_pages);
          break;
          
        case "fleet":
          response = await ReportsService.getFleetReport(
            dateRange.from,
            dateRange.to,
            currentPage,
            itemsPerPage,
            filters.status,
            filters.availability
          );
          setFleetData(response.data.rows);
          setSummaryData(response.data.summary.by_status || []);
          setTotalRows(response.data.summary.total_rows);
          setTotalPages(response.data.paging.total_pages);
          break;
          
        case "services":
          response = await ReportsService.getServicesReport(
            dateRange.from,
            dateRange.to,
            currentPage,
            itemsPerPage,
            filters.status,
            filters.type
          );
          setServicesData(response.data.rows);
          setSummaryData(response.data.summary.by_status || []);
          setTotalRows(response.data.summary.total_rows);
          setTotalPages(response.data.paging.total_pages);
          break;
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(err instanceof Error ? err.message : "Failed to load reports");
      showSnackbar("Failed to load reports", "error");
    } finally {
      setLoading(false);
    }
  }, [activeReportType, dateRange, currentPage, itemsPerPage, filters]);
  
  // Initial load and when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Reset page when report type changes
  useEffect(() => {
    setCurrentPage(1);
    setFilters({});
  }, [activeReportType]);
  
  // Show snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  };
  
  // Handle export
  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await ReportsService.exportReportToCSV(
        activeReportType,
        dateRange.from,
        dateRange.to
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeReportType}_report_${dateRange.from}_to_${dateRange.to}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showSnackbar("Report exported successfully", "success");
    } catch (err) {
      console.error("Export failed:", err);
      showSnackbar("Failed to export report", "error");
    } finally {
      setExporting(false);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    if (value) {
      setFilters(prev => ({ ...prev, [key]: value }));
    } else {
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
    }
    setCurrentPage(1);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };
  
  // Get current data based on active report type
  const getCurrentData = () => {
    const searchLower = searchQuery.toLowerCase();
    
    const filterBySearch = <T extends Record<string, any>>(item: T, searchFields: string[]): boolean => {
      if (!searchQuery) return true;
      return searchFields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value?.toString().toLowerCase().includes(searchLower);
      });
    };
    
    switch (activeReportType) {
      case "reservations":
        return reservationsData.filter(item => 
          filterBySearch(item, ['code', 'status', 'user_id', 'vehicle_id'])
        );
      case "payments":
        return paymentsData.filter(item =>
          filterBySearch(item, ['reservation_code', 'paymentStatus', 'method', 'provider'])
        );
      case "incidents":
        return incidentsData.filter(item =>
          filterBySearch(item, ['type', 'severity', 'status', 'vehicle_id'])
        );
      case "fleet":
        return fleetData.filter(item =>
          filterBySearch(item, ['plate_number', 'status', 'availability_state'])
        );
      case "services":
        return servicesData.filter(item =>
          filterBySearch(item, ['type', 'status', 'vehicle_id'])
        );
      default:
        return [];
    }
  };
  
  const currentData = getCurrentData();
  
  // Calculate summary statistics
  const getSummaryStats = () => {
    switch (activeReportType) {
      case "payments": {
        const payments = paymentsData as PaymentReportRow[];
        const totalAmount = payments.reduce((sum, p) => {
          const amount = p.amount?.$numberDecimal ? parseFloat(p.amount.$numberDecimal) : 0;
          return sum + amount;
        }, 0);
        return { totalAmount, totalCount: payments.length };
      }
      case "incidents": {
        const incidents = incidentsData as IncidentReportRow[];
        const totalEstimatedCost = incidents.reduce((sum, i) => {
          const cost = i.estimated_cost?.$numberDecimal ? parseFloat(i.estimated_cost.$numberDecimal) : 0;
          return sum + cost;
        }, 0);
        return { totalEstimatedCost, totalCount: incidents.length };
      }
      case "fleet": {
        const fleet = fleetData as FleetReportRow[];
        const availableCount = fleet.filter(v => v.availability_state === "available").length;
        const rentedCount = fleet.filter(v => v.availability_state === "rented").length;
        return { availableCount, rentedCount, totalCount: fleet.length };
      }
      default:
        return { totalCount: currentData.length };
    }
  };
  
  const summaryStats = getSummaryStats();
  
  // Render table rows based on report type
  const renderTableRows = () => {
    const data = currentData;
    
    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={10} className="text-center py-12">
            <div className="flex flex-col items-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">No data found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or date range</p>
            </div>
          </td>
        </tr>
      );
    }
    
    switch (activeReportType) {
      case "reservations":
        return (data as ReservationReportRow[]).map((reservation) => (
          <tr
            key={reservation._id}
            className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedReservation(reservation);
              setIsDetailsModalOpen(true);
            }}
          >
            <td className="px-4 py-3">
              <span className="font-mono text-sm">{reservation.code}</span>
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                {reservation.status}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(reservation.created_at)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(reservation.pickup.at)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(reservation.dropoff.at)}</td>
            <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(reservation.pricing.grand_total)}</td>
          </tr>
        ));
        
      case "payments":
        return (data as PaymentReportRow[]).map((payment) => (
          <tr
            key={payment._id}
            className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedPayment(payment);
              setIsDetailsModalOpen(true);
            }}
          >
            <td className="px-4 py-3">
              <span className="font-mono text-sm">{payment.reservation_code}</span>
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(payment.paymentStatus)}`}>
                {payment.paymentStatus}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 capitalize">{payment.method}</td>
            <td className="px-4 py-3 text-sm text-gray-600 uppercase">{payment.provider}</td>
            <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(payment.amount)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(payment.boughtAt)}</td>
          </tr>
        ));
        
      case "incidents":
        return (data as IncidentReportRow[]).map((incident) => (
          <tr
            key={incident._id}
            className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedIncident(incident);
              setIsDetailsModalOpen(true);
            }}
          >
            <td className="px-4 py-3">
              <span className="font-mono text-sm">{incident.vehicle_id?.slice(-8)}</span>
            </td>
            <td className="px-4 py-3">
              <span className="capitalize text-sm">{incident.type?.replace('_', ' ')}</span>
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(incident.severity)}`}>
                {incident.severity}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                {incident.status?.replace('_', ' ')}
              </span>
            </td>
            <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(incident.estimated_cost)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(incident.occurred_at)}</td>
          </tr>
        ));
        
      case "fleet":
        return (data as FleetReportRow[]).map((vehicle) => (
          <tr
            key={vehicle._id}
            className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedVehicle(vehicle);
              setIsDetailsModalOpen(true);
            }}
          >
            <td className="px-4 py-3">
              <span className="font-mono text-sm font-semibold">{vehicle.plate_number}</span>
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                {vehicle.status}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.availability_state)}`}>
                {vehicle.availability_state}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{vehicle.odometer_km.toLocaleString()} km</td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(vehicle.created_at)}</td>
          </tr>
        ));
        
      case "services":
        return (data as ServiceReportRow[]).map((service) => (
          <tr
            key={service._id}
            className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedService(service);
              setIsDetailsModalOpen(true);
            }}
          >
            <td className="px-4 py-3">
              <span className="font-mono text-sm">{service.vehicle_id?.slice(-8)}</span>
            </td>
            <td className="px-4 py-3">
              <span className="capitalize text-sm">{service.type?.replace('_', ' ')}</span>
            </td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                {service.status?.replace('_', ' ')}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{service.odometer_km.toLocaleString()} km</td>
            <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(service.cost)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(service.created_at)}</td>
          </tr>
        ));
        
      default:
        return null;
    }
  };
  
  // Render column headers
  const renderColumnHeaders = () => {
    switch (activeReportType) {
      case "reservations":
        return (
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pickup</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dropoff</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
          </tr>
        );
      case "payments":
        return (
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reservation</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Method</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Provider</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
          </tr>
        );
      case "incidents":
        return (
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Severity</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Est. Cost</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
          </tr>
        );
      case "fleet":
        return (
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate Number</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Availability</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Odometer</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Added</th>
          </tr>
        );
      case "services":
        return (
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Odometer</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cost</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
          </tr>
        );
      default:
        return null;
    }
  };
  
  // Render summary cards
  const renderSummaryCards = () => {
    switch (activeReportType) {
      case "payments":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-800">{summaryStats.totalCount}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(summaryStats.totalAmount)}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Summary by Status</p>
                  <div className="flex gap-2 mt-1">
                    {summaryData.map(s => (
                      <span key={s.status} className={`text-xs px-2 py-0.5 rounded-full ${getPaymentStatusColor(s.status)}`}>
                        {s.status}: {s.count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case "incidents":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Incidents</p>
                  <p className="text-2xl font-bold text-gray-800">{summaryStats.totalCount}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Estimated Cost</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(summaryStats.totalEstimatedCost)}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Summary by Status</p>
                  <div className="flex gap-2 mt-1">
                    {summaryData.map(s => (
                      <span key={s.status} className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(s.status)}`}>
                        {s.status}: {s.count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case "fleet":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Vehicles</p>
                  <p className="text-2xl font-bold text-gray-800">{summaryStats.totalCount}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">{summaryStats.availableCount}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rented</p>
                  <p className="text-2xl font-bold text-orange-600">{summaryStats.rentedCount}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-gray-800">{summaryStats.totalCount}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Summary by Status</p>
                  <div className="flex gap-2 mt-1">
                    {summaryData.map(s => (
                      <span key={s.status} className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(s.status)}`}>
                        {s.status}: {s.count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };
  
  // Details Modal Component
  const renderDetailsModal = () => {
    if (!isDetailsModalOpen) return null;
    
    let content = null;
    
    if (selectedReservation) {
      content = (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Reservation Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Code</label>
              <p className="font-mono text-sm">{selectedReservation.code}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Status</label>
              <p><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedReservation.status)}`}>{selectedReservation.status}</span></p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Created At</label>
              <p className="text-sm">{formatDate(selectedReservation.created_at)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Pickup Date</label>
              <p className="text-sm">{formatDate(selectedReservation.pickup.at)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Dropoff Date</label>
              <p className="text-sm">{formatDate(selectedReservation.dropoff.at)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Total Amount</label>
              <p className="text-lg font-bold">{formatCurrency(selectedReservation.pricing.grand_total)}</p>
            </div>
          </div>
        </div>
      );
    } else if (selectedPayment) {
      content = (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Payment Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Reservation Code</label>
              <p className="font-mono text-sm">{selectedPayment.reservation_code}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Status</label>
              <p><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedPayment.paymentStatus)}`}>{selectedPayment.paymentStatus}</span></p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Method</label>
              <p className="text-sm capitalize">{selectedPayment.method}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Provider</label>
              <p className="text-sm uppercase">{selectedPayment.provider}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Amount</label>
              <p className="text-lg font-bold">{formatCurrency(selectedPayment.amount)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Date</label>
              <p className="text-sm">{formatDate(selectedPayment.boughtAt)}</p>
            </div>
          </div>
        </div>
      );
    } else if (selectedIncident) {
      content = (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Incident Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Vehicle ID</label>
              <p className="font-mono text-sm">{selectedIncident.vehicle_id}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Type</label>
              <p className="text-sm capitalize">{selectedIncident.type?.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Severity</label>
              <p><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(selectedIncident.severity)}`}>{selectedIncident.severity}</span></p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Status</label>
              <p><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedIncident.status)}`}>{selectedIncident.status?.replace('_', ' ')}</span></p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Estimated Cost</label>
              <p className="text-lg font-bold">{formatCurrency(selectedIncident.estimated_cost)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Final Cost</label>
              <p className="text-lg font-bold">{formatCurrency(selectedIncident.final_cost)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Occurred At</label>
              <p className="text-sm">{formatDate(selectedIncident.occurred_at)}</p>
            </div>
          </div>
        </div>
      );
    } else if (selectedVehicle) {
      content = (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Vehicle Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Plate Number</label>
              <p className="font-mono text-sm font-semibold">{selectedVehicle.plate_number}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Status</label>
              <p><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedVehicle.status)}`}>{selectedVehicle.status}</span></p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Availability</label>
              <p><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedVehicle.availability_state)}`}>{selectedVehicle.availability_state}</span></p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Odometer</label>
              <p className="text-sm">{selectedVehicle.odometer_km.toLocaleString()} km</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Added On</label>
              <p className="text-sm">{formatDate(selectedVehicle.created_at)}</p>
            </div>
          </div>
        </div>
      );
    } else if (selectedService) {
      content = (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">Service Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">Vehicle ID</label>
              <p className="font-mono text-sm">{selectedService.vehicle_id}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Type</label>
              <p className="text-sm capitalize">{selectedService.type?.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Status</label>
              <p><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedService.status)}`}>{selectedService.status?.replace('_', ' ')}</span></p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Odometer</label>
              <p className="text-sm">{selectedService.odometer_km.toLocaleString()} km</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Cost</label>
              <p className="text-lg font-bold">{formatCurrency(selectedService.cost)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500">Date</label>
              <p className="text-sm">{formatDate(selectedService.created_at)}</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDetailsModalOpen(false)} />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Details</h2>
            <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">{content}</div>
          <div className="flex justify-end p-6 border-t border-gray-200">
            <button onClick={() => setIsDetailsModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex h-screen bg-gray-50 font-sans relative overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => navigate("/manager-dashboard")}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
                <p className="text-sm text-gray-600 mt-1">View and export detailed reports</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className="font-semibold">{totalRows}</span> record(s)
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {exporting ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span>Export CSV</span>
              </button>
              <button
                onClick={loadData}
                className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Report Type Tabs */}
          <div className="px-6 pt-6">
            <div className="flex flex-wrap gap-2 border-b border-gray-200">
              {reportTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setActiveReportType(type.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                    activeReportType === type.value
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300"
                  }`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Date Range and Filters */}
          <div className="px-6 pt-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Date Range */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="text-sm">
                        {dateRange.from} to {dateRange.to}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    {showDatePicker && (
                      <div className="absolute top-full left-0 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[300px]">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">From Date</label>
                            <input
                              type="date"
                              value={dateRange.from}
                              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">To Date</label>
                            <input
                              type="date"
                              value={dateRange.to}
                              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => {
                                setShowDatePicker(false);
                                loadData();
                              }}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => setShowDatePicker(false)}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Filters Panel */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {getFilterOptions().map(filter => (
                      <div key={filter.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{filter.label}</label>
                        <select
                          value={filters[filter.key] || ""}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">All</option>
                          {filter.options.map(opt => (
                            <option key={opt} value={opt}>{opt.replace('_', ' ').toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="px-6 pt-6">
            {renderSummaryCards()}
          </div>
          
          {/* Data Table */}
          <div className="px-6 pb-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading reports...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 p-6">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                  <p className="text-red-600 text-center mb-4">{error}</p>
                  <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10">
                      {renderColumnHeaders()}
                    </thead>
                    <tbody>
                      {renderTableRows()}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Details Modal */}
      {renderDetailsModal()}
      
      {/* Snackbar */}
      {snackbar.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${
            snackbar.type === "success" ? "bg-green-50 border border-green-200 text-green-800" :
            snackbar.type === "error" ? "bg-red-50 border border-red-200 text-red-800" :
            "bg-blue-50 border border-blue-200 text-blue-800"
          }`}>
            {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{snackbar.message}</span>
            <button onClick={() => setSnackbar(prev => ({ ...prev, show: false }))}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;