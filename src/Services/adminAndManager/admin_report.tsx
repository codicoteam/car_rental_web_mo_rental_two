// admin_report.tsx
import axios, { AxiosError } from "axios";

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

const AUTH_STORAGE_KEY = "car_rental_auth";

/** ===== Auth helpers ===== */
const getToken = (): string | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** ===== Types ===== */

export type AdminReportType =
  | "reservations"
  | "payments"
  | "vehicles"
  | "users"
  | "incidents"
  | "services"
  | string;

export interface IAdminReportPaging {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface IAdminReportStatusCount {
  status: string;
  count: number;
}

export interface IAdminReportSummary {
  by_status?: IAdminReportStatusCount[];
  total_rows?: number;
  // allow server to add more aggregations later without breaking TS
  [key: string]: any;
}

/**
 * Your API returns rows with nested fields (pickup.branch_id, pricing.grand_total, etc).
 * Keep it flexible so it works across report types.
 */
export type AdminReportRow = Record<string, any>;

export interface IAdminReportData {
  type: string;
  columns: string[];
  rows: AdminReportRow[];
  summary?: IAdminReportSummary;
  paging: IAdminReportPaging;
}

export interface IAdminReportResponse {
  success: boolean;
  data: IAdminReportData;
}

/** ===== API Error ===== */

export type ApiErrorDetails = {
  message?: string;
  error?: string;
  details?: any;
  statusCode?: number;
  [key: string]: any;
};

export class ApiError extends Error {
  status?: number;
  data?: ApiErrorDetails;
  url?: string;
  method?: string;

  constructor(opts: {
    message: string;
    status?: number;
    data?: ApiErrorDetails;
    url?: string;
    method?: string;
  }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.data = opts.data;
    this.url = opts.url;
    this.method = opts.method;
  }
}

function toApiError(err: unknown, fallbackMsg: string): ApiError {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<any>;
    const status = ax.response?.status;
    const data = ax.response?.data;
    const method = ax.config?.method?.toUpperCase();
    const url = ax.config?.url;

    const serverMsg =
      data?.message ||
      data?.error ||
      data?.msg ||
      (typeof data === "string" ? data : undefined);

    return new ApiError({
      message: serverMsg || ax.message || fallbackMsg,
      status,
      data,
      url,
      method,
    });
  }

  if (err instanceof Error) {
    return new ApiError({ message: err.message || fallbackMsg });
  }

  return new ApiError({ message: fallbackMsg });
}

/** ===== API functions ===== */

/**
 * admin-reports
 * GET /reports/admin?type=reservations&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=25
 */
export async function fetchAdminReport(params: {
  type: AdminReportType; // "reservations"
  from: string; // "2025-12-01"
  to: string; // "2025-12-30"
  page?: number; // default 1
  limit?: number; // default 25
}): Promise<IAdminReportResponse> {
  try {
    console.log("fetchAdminReport", params);
    const res = await axios.get(`${API_BASE}/reports/admin`, {
      params: {
        type: params.type,
        from: params.from,
        to: params.to,
        page: params.page ?? 1,
        limit: params.limit ?? 25,
      },
      headers: { ...authHeaders(), Accept: "application/json" },
    });

    return res.data as IAdminReportResponse;
  } catch (err) {
    throw toApiError(err, "Failed to fetch admin report");
  }
}

/** Convenience: return just the data object */
export async function fetchAdminReportData(params: {
  type: AdminReportType;
  from: string;
  to: string;
  page?: number;
  limit?: number;
}): Promise<IAdminReportData> {
  const res = await fetchAdminReport(params);
  return res.data;
}

/**
 * Optional helper: transform the "columns" list into a flat row for table rendering.
 * - Supports dot-path columns like "pickup.branch_id" and "pricing.grand_total"
 * - Also unwraps Mongo Decimal128 objects: { $numberDecimal: "179.00" }
 */
export function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;

  const parts = path.split(".");
  let cur: any = obj;

  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }

  // unwrap Mongo Decimal128 shape if present
  if (cur && typeof cur === "object" && "$numberDecimal" in cur) {
    return cur.$numberDecimal;
  }

  return cur;
}

export function mapReportRowToColumns(row: AdminReportRow, columns: string[]) {
  const out: Record<string, any> = {};
  for (const col of columns) out[col] = getValueByPath(row, col);
  return out;
}

/** Helper for error display (same pattern as your other services) */
export function getErrorDisplay(err: unknown): {
  message: string;
  status?: number;
  method?: string;
  url?: string;
  data?: any;
} {
  const apiErr = err instanceof ApiError ? err : toApiError(err, "Request failed");
  return {
    message: apiErr.message,
    status: apiErr.status,
    method: apiErr.method,
    url: apiErr.url,
    data: apiErr.data,
  };
}

export default {};
