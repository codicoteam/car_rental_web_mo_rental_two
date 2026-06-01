import axios from 'axios';

const BASE_URL = "http://13.61.185.238:5050/api/v1/dashboard/admin"; 

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

// Types based on your API response
export interface DashboardRange {
  from: string;
  to: string;
}

export interface DashboardKPIs {
  total_branches: number;
  total_vehicles: number;
  active_fleet: number;
  reservations_in_range: number;
  active_reservations_now: number;
  open_or_review_incidents: number;
  open_or_in_progress_services: number;
  due_service_schedules_by_date: number;
  driver_bookings_in_range: number | null;
  total_revenue_paid_in_range: number | null;
}

export interface PieChartItem {
  label: string;
  value: number;
}

export interface LineChartItem {
  date: string;
  value: number;
}

export interface BarChartItem {
  value: number;
  label: string;
}

export interface DashboardCharts {
  pie: {
    reservations_by_status: PieChartItem[];
  };
  lines: {
    reservations_per_day: LineChartItem[];
    revenue_per_day: LineChartItem[];
  };
  bars: {
    revenue_by_branch: BarChartItem[];
    vehicles_by_class: BarChartItem[];
  };
}

export interface DashboardData {
  success: boolean;
  data: {
    range: DashboardRange;
    kpis: DashboardKPIs;
    charts: DashboardCharts;
  };
}

/**
 * Service for dashboard-related API requests
 */
const DashboardService = {
  /**
   * Get dashboard data for a specific date range
   * @param from - Start date (ISO string)
   * @param to - End date (ISO string)
   */
  getDashboardData: async (from?: string, to?: string): Promise<DashboardData> => {
    try {
      const token = getAuthToken();
      
      // Build query parameters
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      
      const response = await axios.get<DashboardData>(
        BASE_URL,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params,
        }
      );
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error("Failed to fetch dashboard data");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to fetch dashboard data";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Get dashboard data for current month (default)
   */
  getCurrentMonthData: async (): Promise<DashboardData> => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    return DashboardService.getDashboardData(from, to);
  },

  /**
   * Get dashboard data for last N days
   */
  getLastNDaysData: async (days: number = 30): Promise<DashboardData> => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return DashboardService.getDashboardData(from.toISOString(), to.toISOString());
  },
};

export default DashboardService;