import axios from 'axios';

const BASE_URL = "http://13.61.185.238:5050/api/v1/reports/admin";
const CHARTS_URL = `${BASE_URL}/charts`;
const FINANCIAL_URL = `${BASE_URL}/financial`;

/**
 * Helper to get the stored auth token
 */
const getAuthToken = (): string | null => {
  const stored = localStorage.getItem("car_rental_auth");
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    return parsed.token || null;
  } catch {
    return null;
  }
};

// Report Types
export type ReportType = 'reservations' | 'services' | 'incidents' | 'fleet' | 'payments';

// Reservation Report Types
export interface ReservationReportRow {
  _id: string;
  code: string;
  user_id: string;
  vehicle_id: string;
  vehicle_model_id: string;
  pickup: {
    branch_id: string;
    at: string;
  };
  dropoff: {
    branch_id: string;
    at: string;
  };
  status: string;
  pricing: {
    currency: string;
    grand_total: {
      $numberDecimal: string;
    };
  };
  created_at: string;
}

// Payment Report Types
export interface PaymentReportRow {
  _id: string;
  reservation_id: string;
  reservation_code: string;
  branch_id: string;
  provider: string;
  method: string;
  currency: string;
  amount: {
    $numberDecimal: string;
  };
  paymentStatus: string;
  boughtAt: string;
}

// Incident Report Types
export interface IncidentReportRow {
  _id: string;
  vehicle_id: string;
  reservation_id: string;
  branch_id: string;
  type: string;
  severity: string;
  status: string;
  occurred_at: string;
  estimated_cost: {
    $numberDecimal: string;
  };
  final_cost: {
    $numberDecimal: string;
  };
}

// Fleet Report Types
export interface FleetReportRow {
  _id: string;
  plate_number: string;
  branch_id: string;
  status: string;
  availability_state: string;
  odometer_km: number;
  created_at: string;
}

// Service Report Types
export interface ServiceReportRow {
  _id: string;
  vehicle_id: string;
  branch_id: string;
  type: string;
  status: string;
  odometer_km: number;
  cost: number;
  created_at: string;
}

// Summary Types
export interface StatusSummary {
  status: string;
  count: number;
  total_amount?: {
    $numberDecimal: string;
  };
}

export interface AvailabilitySummary {
  state: string;
  count: number;
}

export interface PagingInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Generic Report Response
export interface ReportResponse<T> {
  success: boolean;
  data: {
    type: ReportType;
    columns: string[];
    rows: T[];
    summary: {
      by_status?: StatusSummary[];
      by_payment_status?: StatusSummary[];
      by_availability?: AvailabilitySummary[];
      total_rows: number;
    };
    paging: PagingInfo;
  };
}

/**
 * Service for report-related API requests
 */
const ReportsService = {
  /**
   * Get reports by type with filters
   * @param type - Report type (reservations, services, incidents, fleet, payments)
   * @param from - Start date (YYYY-MM-DD)
   * @param to - End date (YYYY-MM-DD)
   * @param page - Page number
   * @param limit - Items per page
   * @param additionalParams - Additional query parameters
   */
  getReports: async <T = any>(
    type: ReportType,
    from?: string,
    to?: string,
    page: number = 1,
    limit: number = 25,
    additionalParams?: Record<string, any>
  ): Promise<ReportResponse<T>> => {
    try {
      const token = getAuthToken();
      
      // Build query parameters
      const params: Record<string, any> = {
        type,
        page,
        limit,
      };
      
      if (from) params.from = from;
      if (to) params.to = to;
      if (additionalParams) {
        Object.assign(params, additionalParams);
      }
      
      const response = await axios.get<ReportResponse<T>>(
        BASE_URL,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params,
        }
      );
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error("Failed to fetch reports");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to fetch reports";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Get reservations report
   */
  getReservationsReport: async (
    from?: string,
    to?: string,
    page: number = 1,
    limit: number = 25,
    status?: string
  ): Promise<ReportResponse<ReservationReportRow>> => {
    return ReportsService.getReports<ReservationReportRow>(
      'reservations',
      from,
      to,
      page,
      limit,
      status ? { status } : undefined
    );
  },

  /**
   * Get payments report
   */
  getPaymentsReport: async (
    from?: string,
    to?: string,
    page: number = 1,
    limit: number = 25,
    paymentStatus?: string
  ): Promise<ReportResponse<PaymentReportRow>> => {
    return ReportsService.getReports<PaymentReportRow>(
      'payments',
      from,
      to,
      page,
      limit,
      paymentStatus ? { payment_status: paymentStatus } : undefined
    );
  },

  /**
   * Get incidents report
   */
  getIncidentsReport: async (
    from?: string,
    to?: string,
    page: number = 1,
    limit: number = 25,
    status?: string,
    severity?: string
  ): Promise<ReportResponse<IncidentReportRow>> => {
    const params: Record<string, any> = {};
    if (status) params.status = status;
    if (severity) params.severity = severity;
    
    return ReportsService.getReports<IncidentReportRow>(
      'incidents',
      from,
      to,
      page,
      limit,
      params
    );
  },

  /**
   * Get fleet report
   */
  getFleetReport: async (
    from?: string,
    to?: string,
    page: number = 1,
    limit: number = 25,
    status?: string,
    availability?: string
  ): Promise<ReportResponse<FleetReportRow>> => {
    const params: Record<string, any> = {};
    if (status) params.status = status;
    if (availability) params.availability = availability;
    
    return ReportsService.getReports<FleetReportRow>(
      'fleet',
      from,
      to,
      page,
      limit,
      params
    );
  },

  /**
   * Get services report
   */
  getServicesReport: async (
    from?: string,
    to?: string,
    page: number = 1,
    limit: number = 25,
    status?: string,
    type?: string
  ): Promise<ReportResponse<ServiceReportRow>> => {
    const params: Record<string, any> = {};
    if (status) params.status = status;
    if (type) params.type = type;
    
    return ReportsService.getReports<ServiceReportRow>(
      'services',
      from,
      to,
      page,
      limit,
      params
    );
  },

  /**
   * Export report to CSV
   */
  exportReportToCSV: async (
    type: ReportType,
    from?: string,
    to?: string
  ): Promise<Blob> => {
    try {
      const token = getAuthToken();
      
      const params: Record<string, any> = { type };
      if (from) params.from = from;
      if (to) params.to = to;
      
      const response = await axios.get(
        `${BASE_URL}/export`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params,
          responseType: 'blob',
        }
      );
      
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to export report";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },
};

export default ReportsService;

// ─── Chart / Financial Types ──────────────────────────────────────────────────

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
  transactions: number;
}

export interface BookingStatusPoint {
  status: string;
  count: number;
  percentage: number;
}

export interface FleetUtilizationPoint {
  state: string;
  count: number;
  percentage: number;
}

export interface RevenueBranchPoint {
  branch: string;
  branch_id: string;
  revenue: number;
  bookings: number;
}

export interface PaymentMethodPoint {
  method: string;
  label: string;
  count: number;
  total: number;
  percentage: number;
}

export interface MonthlyBookingsPoint {
  month: string;
  created: number;
  completed: number;
  cancelled: number;
}

export interface IncidentCostPoint {
  type: string;
  label: string;
  count: number;
  estimated_cost: number;
  final_cost: number;
}

export interface ChartsKPIs {
  total_revenue: number;
  total_transactions: number;
  total_bookings: number;
  completed_bookings: number;
  avg_booking_value: number;
  fleet_utilization_pct: number;
  fleet_rented: number;
  fleet_total: number;
  active_reservations: number;
  pending_incidents: number;
}

export interface ChartsData {
  period: { from: string; to: string };
  kpis: ChartsKPIs;
  monthly_revenue: MonthlyRevenuePoint[];
  booking_status_dist: BookingStatusPoint[];
  fleet_utilization: FleetUtilizationPoint[];
  revenue_by_branch: RevenueBranchPoint[];
  payment_method_split: PaymentMethodPoint[];
  monthly_bookings: MonthlyBookingsPoint[];
  incident_costs_by_type: IncidentCostPoint[];
}

export interface MonthlyPLRow {
  month: string;
  revenue: number;
  service_cost: number;
  incident_cost: number;
  total_cost: number;
  gross_profit: number;
  transactions: number;
}

export interface FinancialTotals {
  revenue: number;
  service_cost: number;
  incident_cost: number;
  total_cost: number;
  gross_profit: number;
  transactions: number;
  gross_margin_pct: number;
}

export interface FinancialData {
  period: { from: string; to: string };
  monthly_pl: MonthlyPLRow[];
  totals: FinancialTotals;
}

// ─── Chart & Financial Service ────────────────────────────────────────────────

const getAuthHeader = () => {
  const stored = localStorage.getItem("car_rental_auth");
  if (!stored) return {};
  try {
    const { token } = JSON.parse(stored);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

export const ChartsService = {
  getChartsData: async (from?: string, to?: string, branchId?: string): Promise<ChartsData> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (branchId) params.branch_id = branchId;

    const res = await axios.get<{ success: boolean; data: ChartsData }>(CHARTS_URL, {
      headers: getAuthHeader(),
      params,
    });
    return res.data.data;
  },

  getFinancialData: async (from?: string, to?: string, branchId?: string): Promise<FinancialData> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (branchId) params.branch_id = branchId;

    const res = await axios.get<{ success: boolean; data: FinancialData }>(FINANCIAL_URL, {
      headers: getAuthHeader(),
      params,
    });
    return res.data.data;
  },
};