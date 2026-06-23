// driver_booking_service.tsx
import axios, { AxiosError } from "axios";

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

const AUTH_STORAGE_KEY = "car_rental_auth";

/** ===== Auth helpers (same pattern as your other services) ===== */
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

/** ===== Types (matching your sample payloads) ===== */
export interface IUserRef {
  _id: string;
  email?: string;
  phone?: string;
  full_name?: string;
}

export interface IDriverProfileLite {
  _id: string;
  user_id: string;
  display_name?: string;
  base_city?: string;
  base_region?: string;
  base_country?: string;
  hourly_rate?: number;
  bio?: string;
  years_experience?: number;
  languages?: string[];
  status?: string;
}

export interface ILocation {
  label?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface IMoneyDecimal {
  $numberDecimal?: string;
}

export interface IPricing {
  currency?: string;
  hourly_rate_snapshot?: IMoneyDecimal;
  hours_requested?: number;
  estimated_total_amount?: IMoneyDecimal;
}

export interface IDriverBooking {
  _id: string;
  code: string;
  customer_id: IUserRef;
  created_by?: string;
  created_channel?: string;
  driver_profile_id: IDriverProfileLite;
  driver_user_id?: string;
  start_at?: string;
  end_at?: string;
  pickup_location?: ILocation;
  dropoff_location?: ILocation;
  notes?: string;
  pricing?: IPricing;
  status?: string; // e.g. "requested"
  requested_at?: string | null;
  driver_responded_at?: string | null;
  payment_deadline_at?: string | null;
  paid_at?: string | null;
  cancelled_at?: string | null;
  completed_at?: string | null;
  payment_id?: string | null;
  payment_status_snapshot?: string | null;
  last_status_update_by?: string | null;
  customer_rating_of_driver?: number | null;
  customer_review_text?: string;
  created_at?: string;
  updated_at?: string;
  __v?: number;
}

/** ===== Error shaping ===== */
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

const is2xx = (status?: number) => !!status && status >= 200 && status < 300;

/** ===== API functions ===== */

/** GET /driver-bookings/admin — list all driver bookings (admin) */
export async function fetchAdminDriverBookings(): Promise<{
  success?: boolean;
  data?: IDriverBooking[];
  items?: IDriverBooking[]; // in case backend uses items
  total?: number;
}> {
  try {
    const res = await axios.get(`${API_BASE}/driver-bookings/admin`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch driver bookings (admin)");
  }
}

/** DELETE /driver-bookings/admin/:customerId — delete bookings by customer */
export async function deleteDriverBookingsByCustomer(
  customerId: string
): Promise<{ success: boolean } | { success?: boolean; [k: string]: any }> {
  try {
    const res = await axios.delete(
      `${API_BASE}/driver-bookings/admin/${customerId}`,
      {
        headers: { ...authHeaders(), Accept: "application/json" },
      }
    );

    // Some backends return { success: true }, others empty with 204
    if (is2xx(res.status)) {
      return res.data && typeof res.data?.success !== "undefined"
        ? res.data
        : { success: true };
    }
    return { success: false };
  } catch (err) {
    throw toApiError(err, "Failed to delete bookings by customer");
  }
}

/** Helper for error display */
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
