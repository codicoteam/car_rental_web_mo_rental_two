// payment_service.tsx
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

/** ===== Pull current user id from storage ===== */
const getStoredUserId = (): string | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const user = parsed?.user;
    return (user?._id as string) || (user?.id as string) || null;
  } catch {
    return null;
  }
};

/** ===== Types (aligned to your sample response) ===== */

export type PaymentStatus =
  | "pending"
  | "sent"
  | "paid"
  | "cancelled"
  | "failed"
  | "refunded"
  | "partially_refunded"
  | string;

export type PaymentProvider = "paynow" | "stripe" | "paypal" | "other" | string;
export type PaymentMethod = "card" | "wallet" | "cash" | "bank_transfer" | string;

export interface IDecimal {
  $numberDecimal: string;
}

export interface ILatLngLocation {
  label?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

export interface IDriverBookingPricing {
  currency?: string;
  hourly_rate_snapshot?: IDecimal;
  hours_requested?: number;
  estimated_total_amount?: IDecimal;
  [key: string]: any;
}

export interface IDriverBookingRef {
  _id: string;
  code?: string;
  customer_id?: string;
  created_by?: string;
  created_channel?: string;
  driver_profile_id?: string;
  driver_user_id?: string;
  start_at?: string;
  end_at?: string;
  pickup_location?: ILatLngLocation;
  dropoff_location?: ILatLngLocation;
  notes?: string;
  pricing?: IDriverBookingPricing;
  status?: string;
  requested_at?: string;
  driver_responded_at?: string | null;
  payment_deadline_at?: string | null;
  paid_at?: string | null;
  cancelled_at?: string | null;
  completed_at?: string | null;
  payment_id?: string | null;
  payment_status_snapshot?: string;
  last_status_update_by?: string | null;
  customer_rating_of_driver?: number | null;
  customer_review_text?: string;
  created_at?: string;
  updated_at?: string;
  __v?: number;
  [key: string]: any;
}

// Minimal reservation ref (you can swap this for your full IReservation if you want)
export interface IReservationRef {
  _id: string;
  code?: string;
  user_id?: string;
  created_by?: string;
  created_channel?: string;
  vehicle_id?: string;
  vehicle_model_id?: string;
  pickup?: any;
  dropoff?: any;
  status?: string;
  pricing?: any;
  payment_summary?: any;
  driver_snapshot?: any;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  __v?: number;
  [key: string]: any;
}

export interface IPayment {
  _id: string;
  reservation_id: string | IReservationRef | null;
  driver_booking_id: string | IDriverBookingRef | null;
  user_id: string | null;

  provider: PaymentProvider;
  method: PaymentMethod;

  amount: IDecimal;
  currency: string;

  paymentStatus: PaymentStatus;
  pollUrl?: string;

  pricePaid?: number;
  promotionApplied?: boolean;
  promotionDiscount?: number;

  captured_at?: string | null;

  promo_code_id?: string | null;
  promo_code?: string | null;

  boughtAt?: string;
  refunds?: any[];

  created_at?: string;
  updated_at?: string;
  __v?: number;

  [key: string]: any;
}

export interface IPaymentsListResponse {
  success: boolean;
  items: IPayment[];
  total: number;
}

export interface IPaymentResponse {
  success: boolean;
  data: IPayment;
}

/** API Error */
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

/** ===== Error handling ===== */
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

  if (err instanceof Error) return new ApiError({ message: err.message || fallbackMsg });
  return new ApiError({ message: fallbackMsg });
}

/** ===== Small helpers ===== */
const is2xx = (status?: number) => !!status && status >= 200 && status < 300;

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

/** Helper to parse decimal values from MongoDB format */
export function parseDecimalValue(decimalObj: IDecimal | string | number): number {
  if (decimalObj == null) return 0;

  if (typeof decimalObj === "object" && "$numberDecimal" in decimalObj) {
    return parseFloat(decimalObj.$numberDecimal);
  }
  if (typeof decimalObj === "string") return parseFloat(decimalObj);
  if (typeof decimalObj === "number") return decimalObj;
  return 0;
}

/** Helper to format currency display */
export function formatCurrencyDisplay(
  amount: IDecimal | string | number,
  currency: string = "USD"
): string {
  const value = parseDecimalValue(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** ===== API functions ===== */

/** GET /payments - Fetch all payments (expects { success, items, total }) */
export async function fetchAllPayments(): Promise<IPaymentsListResponse> {
  try {
    const res = await axios.get(`${API_BASE}/payments`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data as IPaymentsListResponse;
  } catch (err) {
    throw toApiError(err, "Failed to fetch payments");
  }
}

/** GET /payments/:id - Fetch single payment by ID (common pattern; keep if backend supports it) */
export async function fetchPaymentById(paymentId: string): Promise<IPayment> {
  try {
    const res = await axios.get(`${API_BASE}/payments/${paymentId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch payment");
  }
}

/**
 * POST /payments/:id/poll - Poll status by payment ID
 * Matches your curl:
 * POST http://13.61.185.238:5050/api/v1/payments/{id}/poll  -d ''
 */
export async function pollPaymentStatusById(paymentId: string): Promise<IPayment> {
  try {
    const res = await axios.post(
      `${API_BASE}/payments/${paymentId}/poll`,
      "", // send empty body like curl -d ''
      {
        headers: {
          ...authHeaders(),
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to poll payment status");
  }
}

/**
 * POST /payments/:id/cancel - Cancel payment by ID
 * Matches your curl:
 * POST http://13.61.185.238:5050/api/v1/payments/{id}/cancel -d ''
 */
export async function cancelPaymentById(paymentId: string): Promise<{ success: boolean; data?: any }> {
  try {
    const res = await axios.post(
      `${API_BASE}/payments/${paymentId}/cancel`,
      "", // empty body
      {
        headers: {
          ...authHeaders(),
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      }
    );

    const body = res.data;
    if (typeof body?.success === "boolean") return { success: body.success, data: body?.data ?? body };
    if (is2xx(res.status)) return { success: true, data: body };
    return { success: false, data: body };
  } catch (err) {
    throw toApiError(err, "Failed to cancel payment");
  }
}

/** POST /payments — Record a cash payment for a reservation */
export async function recordCashPayment(
  reservationId: string,
  amount: number,
  currency: string,
  notes?: string
): Promise<IPayment> {
  try {
    const res = await axios.post(
      `${API_BASE}/payments`,
      { reservation_id: reservationId, method: "cash", provider: "cash", amount, currency, notes },
      { headers: { ...authHeaders(), "Content-Type": "application/json" } }
    );
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to record cash payment");
  }
}

/** POST /payments/initiate — Paynow / card redirect payment */
export async function initiateOnlinePayment(
  reservationId: string,
  amount: number,
  currency: string
): Promise<{ redirectUrl?: string; redirectLink?: string; [key: string]: any }> {
  try {
    const res = await axios.post(
      `${API_BASE}/payments/initiate`,
      { reservation_id: reservationId, amount, currency },
      { headers: { ...authHeaders(), "Content-Type": "application/json" } }
    );
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to initiate online payment");
  }
}

/** POST /payments/mobile — EcoCash / TeleCash / OneMoney */
export async function initiateMobileMoneyPayment(
  reservationId: string,
  phone: string,
  mobileMethod: "ecocash" | "telecash" | "onemoney",
  amount: number,
  currency: string
): Promise<any> {
  try {
    const res = await axios.post(
      `${API_BASE}/payments/mobile`,
      { reservation_id: reservationId, phone, mobileMethod, amount, currency },
      { headers: { ...authHeaders(), "Content-Type": "application/json" } }
    );
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to initiate mobile payment");
  }
}

export default {};
