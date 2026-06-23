import axios from 'axios';

const BASE_URL = 'http://13.61.185.238:5050/api/v1/dashboard/admin';

const getAuthToken = (): string | null => {
  const stored = localStorage.getItem('car_rental_auth');
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed.token || null;
  } catch {
    return null;
  }
};

// ── Types ────────────────────────────────────────────────────────────────────

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
  driver_bookings_in_range: number;
  total_revenue_paid_in_range: number;
}

export interface AdditionalStats {
  total_customers: number | null;
  completion_rate: number | null;
  avg_rental_duration_days: number | null;
  mom_revenue_growth: number | null;
}

export interface PieChartItem {
  label: string;
  value: number;
}

export interface LineChartItem {
  date: string;
  value: number;
  count?: number;
}

export interface BarChartItem {
  label: string;
  value: number;
  count?: number;
  branch_id?: string;
}

export interface BranchMapItem {
  _id: string;
  name: string;
  code: string;
  address: { city?: string | null; country?: string | null };
  lat: number | null;
  lng: number | null;
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

export interface IAdminDashboardData {
  range: DashboardRange;
  kpis: DashboardKPIs;
  additional_stats: AdditionalStats;
  branches: BranchMapItem[];
  charts: DashboardCharts;
}

// ── API helpers ───────────────────────────────────────────────────────────────

const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Coerce a value that may be a raw MongoDB Decimal128 object
 * ({ $numberDecimal: "123.45" }) or any other non-number into a plain float.
 * Returns 0 for null/undefined so KPI cards always get a usable number.
 */
function toFloat(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null && '$numberDecimal' in val) {
    return parseFloat((val as Record<string, string>)['$numberDecimal']) || 0;
  }
  const n = parseFloat(String(val));
  return isNaN(n) ? 0 : n;
}

/** Same as toFloat but returns null for missing/zero-ish optional stats. */
function toFloatOrNull(val: unknown): number | null {
  if (val == null) return null;
  const n = toFloat(val);
  return n;
}

/**
 * Normalize the raw API payload to ensure:
 * - All revenue values are plain JS numbers (not Decimal128 objects)
 * - additional_stats is always present with sensible defaults
 * - Chart bar/line values are numbers
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any): IAdminDashboardData {
  const k = raw?.kpis ?? {};
  const s = raw?.additional_stats ?? {};
  const charts = raw?.charts ?? {};

  return {
    range: raw?.range ?? { from: '', to: '' },
    branches: (raw?.branches ?? []).map((b: BranchMapItem) => ({
      _id: String(b._id ?? ''),
      name: b.name ?? '',
      code: b.code ?? '',
      address: { city: b.address?.city ?? null, country: b.address?.country ?? null },
      lat: b.lat != null ? Number(b.lat) : null,
      lng: b.lng != null ? Number(b.lng) : null,
    })),
    kpis: {
      total_branches:               Number(k.total_branches               ?? 0),
      total_vehicles:               Number(k.total_vehicles               ?? 0),
      active_fleet:                 Number(k.active_fleet                 ?? 0),
      reservations_in_range:        Number(k.reservations_in_range        ?? 0),
      active_reservations_now:      Number(k.active_reservations_now      ?? 0),
      open_or_review_incidents:     Number(k.open_or_review_incidents     ?? 0),
      open_or_in_progress_services: Number(k.open_or_in_progress_services ?? 0),
      due_service_schedules_by_date:Number(k.due_service_schedules_by_date?? 0),
      driver_bookings_in_range:     Number(k.driver_bookings_in_range     ?? 0),
      total_revenue_paid_in_range:  toFloat(k.total_revenue_paid_in_range),
    },
    additional_stats: {
      total_customers:          s.total_customers   != null ? Number(s.total_customers)   : null,
      completion_rate:          s.completion_rate   != null ? Number(s.completion_rate)   : null,
      avg_rental_duration_days: toFloatOrNull(s.avg_rental_duration_days),
      mom_revenue_growth:       toFloatOrNull(s.mom_revenue_growth),
    },
    charts: {
      pie: {
        reservations_by_status: (charts?.pie?.reservations_by_status ?? []).map(
          (x: PieChartItem) => ({ label: x.label, value: Number(x.value) })
        ),
      },
      lines: {
        reservations_per_day: (charts?.lines?.reservations_per_day ?? []).map(
          (x: LineChartItem) => ({ date: x.date, value: Number(x.value) })
        ),
        revenue_per_day: (charts?.lines?.revenue_per_day ?? []).map(
          (x: LineChartItem) => ({ date: x.date, value: toFloat(x.value), count: x.count })
        ),
      },
      bars: {
        revenue_by_branch: (charts?.bars?.revenue_by_branch ?? []).map(
          (x: BarChartItem) => ({ label: x.label, value: toFloat(x.value), count: x.count, branch_id: x.branch_id })
        ),
        vehicles_by_class: (charts?.bars?.vehicles_by_class ?? []).map(
          (x: BarChartItem) => ({ label: x.label, value: Number(x.value) })
        ),
      },
    },
  };
}

export async function fetchAdminDashboardData(params?: {
  from?: string;
  to?: string;
}): Promise<IAdminDashboardData> {
  const res = await axios.get<{ success: boolean; data: unknown }>(
    BASE_URL,
    { headers: authHeaders(), params }
  );
  if (!res.data.success) throw new Error('Dashboard fetch failed');
  return normalize(res.data.data);
}

export function getErrorDisplay(err: unknown): { message: string } {
  if (axios.isAxiosError(err)) {
    const msg =
      err.response?.data?.message ||
      err.response?.data ||
      err.message ||
      'Failed to load dashboard.';
    return { message: String(msg) };
  }
  return { message: String(err) };
}

// ── Legacy default export (keeps old DashboardService imports working) ────────

const DashboardService = {
  getDashboardData: (from?: string, to?: string) =>
    fetchAdminDashboardData({ from, to }),
  getCurrentMonthData: () => {
    const now = new Date();
    return fetchAdminDashboardData({
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
    });
  },
  getLastNDaysData: (days = 30) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return fetchAdminDashboardData({
      from: from.toISOString(),
      to: to.toISOString(),
    });
  },
};

export default DashboardService;
