// reservations_service.tsx
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

/** ===== Types ===== */

// Address
export interface IAddress {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  [key: string]: any;
}

// Geo coordinates
export interface IGeoPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

// Opening hours
export interface IOpeningHourSlot {
  open: string;
  close: string;
}

export interface IOpeningHours {
  mon?: IOpeningHourSlot[];
  tue?: IOpeningHourSlot[];
  wed?: IOpeningHourSlot[];
  thu?: IOpeningHourSlot[];
  fri?: IOpeningHourSlot[];
  sat?: IOpeningHourSlot[];
  sun?: IOpeningHourSlot[];
  [key: string]: IOpeningHourSlot[] | undefined;
}

// Branch reference
export interface IBranchRef {
  _id: string;
  name?: string;
  code?: string;
  address?: IAddress;
  geo?: IGeoPoint;
  opening_hours?: IOpeningHours;
  phone?: string;
  email?: string;
  imageLoc?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: any;
}

// User reference
export interface IUserRef {
  _id: string;
  email?: string;
  full_name?: string;
  [key: string]: any;
}

// Vehicle reference
export interface IVehicleRef {
  _id: string;
  vin?: string;
  plate_number?: string;
  vehicle_model_id?: string | any;
  branch_id?: string | any;
  odometer_km?: number | null;
  color?: string;
  status?: string;
  availability_state?: string;
  photos?: string[];
  last_service_at?: string | null;
  last_service_odometer_km?: number | null;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  __v?: number;
  [key: string]: any;
}

// Vehicle model reference
export interface IVehicleModelRef {
  _id: string;
  make?: string;
  model?: string;
  year?: number;
  class?: string;
  transmission?: string;
  fuel_type?: string;
  seats?: number;
  doors?: number;
  features?: string[];
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: any;
}

// Driver license snapshot
export interface IDriverLicenseSnapshot {
  number: string;
  country: string;
  class: string;
  expires_at: string;
  verified: boolean;
  [key: string]: any;
}

// Driver snapshot
export interface IDriverSnapshot {
  driver_license: IDriverLicenseSnapshot;
  full_name: string;
  phone: string;
  email: string;
  [key: string]: any;
}

// Pricing breakdown item
export interface IPricingBreakdownItem {
  label: string;
  quantity: number;
  unit_amount: {
    $numberDecimal: string;
  };
  total: {
    $numberDecimal: string;
  };
  [key: string]: any;
}

// Fee item
export interface IFeeItem {
  code: string;
  amount: {
    $numberDecimal: string;
  };
  [key: string]: any;
}

// Tax item
export interface ITaxItem {
  code: string;
  rate: number;
  amount: {
    $numberDecimal: string;
  };
  [key: string]: any;
}

// Discount item
export interface IDiscountItem {
  promo_code_id?: string;
  amount?: {
    $numberDecimal: string;
  };
  [key: string]: any;
}

// Pricing details
export interface IPricingDetails {
  currency: string;
  breakdown: IPricingBreakdownItem[];
  fees?: IFeeItem[];
  taxes?: ITaxItem[];
  discounts?: IDiscountItem[];
  grand_total: {
    $numberDecimal: string;
  };
  computed_at: string;
  [key: string]: any;
}

// Payment summary
export interface IPaymentSummary {
  status: "unpaid" | "partially_paid" | "paid" | "refunded" | "cancelled";
  paid_total: {
    $numberDecimal: string;
  };
  outstanding: {
    $numberDecimal: string;
  };
  last_payment_at: string | null;
  [key: string]: any;
}

// Pickup/Dropoff details
export interface IPickupDropoff {
  branch_id: string | IBranchRef | null;
  at: string;
  [key: string]: any;
}

// Reservation status
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "checked_out"
  | "checked_in"
  | "returned"
  | "closed"
  | "completed"
  | "cancelled"
  | "no_show";

// Created channel
export type CreatedChannel = "web" | "mobile" | "agent" | "api";

// Main Reservation interface
export interface IReservation {
  _id: string;
  code: string;
  user_id: string | IUserRef | null;
  created_by: string | IUserRef | null;
  created_channel: CreatedChannel;
  vehicle_id: string | IVehicleRef | null;
  vehicle_model_id: string | IVehicleModelRef | null;
  pickup: IPickupDropoff;
  dropoff: IPickupDropoff;
  status: ReservationStatus;
  pricing: IPricingDetails;
  payment_summary: IPaymentSummary;
  driver_snapshot: IDriverSnapshot;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  __v?: number;
  [key: string]: any;
}

// Create Reservation Payload
export type CreateReservationPayload = {
  _id?: string;
  user_id?: string | null;
  created_by?: string | null;
  created_channel?: CreatedChannel;
  vehicle_id?: string | null;
  vehicle_model_id?: string | null;
  pickup?: Partial<IPickupDropoff>;
  dropoff?: Partial<IPickupDropoff>;
  status?: ReservationStatus;
  pricing?: Partial<IPricingDetails>;
  payment_summary?: Partial<IPaymentSummary>;
  driver_snapshot?: Partial<IDriverSnapshot>;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

// Update Reservation Payload
export type UpdateReservationPayload = {
  _id?: string;
  user_id?: string | null;
  created_by?: string | null;
  created_channel?: CreatedChannel;
  vehicle_id?: string | null;
  vehicle_model_id?: string | null;
  pickup?: Partial<IPickupDropoff>;
  dropoff?: Partial<IPickupDropoff>;
  status?: ReservationStatus;
  pricing?: Partial<IPricingDetails>;
  payment_summary?: Partial<IPaymentSummary>;
  driver_snapshot?: Partial<IDriverSnapshot>;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
};

// API Response for list
export interface IReservationsResponse {
  success: boolean;
  data: IReservation[];
}

// API Error
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

  if (err instanceof Error) {
    return new ApiError({ message: err.message || fallbackMsg });
  }

  return new ApiError({ message: fallbackMsg });
}

/** ===== Small helpers ===== */
const is2xx = (status?: number) => !!status && status >= 200 && status < 300;

/** ===== API functions ===== */

/** GET /reservations - Fetch all reservations */
export async function fetchAllReservations(): Promise<IReservationsResponse> {
  try {
    const res = await axios.get(`${API_BASE}/reservations`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data as IReservationsResponse;
  } catch (err) {
    throw toApiError(err, "Failed to fetch reservations");
  }
}

/** GET /reservations/:id - Fetch single reservation by ID */
export async function fetchReservationById(reservationId: string): Promise<IReservation> {
  try {
    const res = await axios.get(`${API_BASE}/reservations/${reservationId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch reservation");
  }
}

/** POST /reservations - Create new reservation */
export async function createReservation(
  payload: CreateReservationPayload
): Promise<IReservation> {
  try {
    const ensuredPayload: CreateReservationPayload = { ...payload };
    
    // Auto-fill created_by if not provided
    if (!ensuredPayload.created_by) {
      const uid = getStoredUserId();
      if (uid) ensuredPayload.created_by = uid;
    }
    
    // Auto-fill user_id if not provided (same as created_by)
    if (!ensuredPayload.user_id && ensuredPayload.created_by) {
      ensuredPayload.user_id = ensuredPayload.created_by;
    }

    const res = await axios.post(`${API_BASE}/reservations`, ensuredPayload, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const body = res.data;
    return body?.data || body;
  } catch (err) {
    throw toApiError(err, "Failed to create reservation");
  }
}

/** PUT /reservations/:id - Full update reservation */
export async function updateReservation(
  reservationId: string,
  payload: UpdateReservationPayload
): Promise<IReservation> {
  try {
    const res = await axios.put(
      `${API_BASE}/reservations/${reservationId}`,
      payload,
      {
        headers: {
          ...authHeaders(),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to update reservation");
  }
}

/** PATCH /reservations/:id - Partial update reservation */
export async function patchReservation(
  reservationId: string,
  payload: Partial<UpdateReservationPayload>
): Promise<IReservation> {
  try {
    const res = await axios.patch(
      `${API_BASE}/reservations/${reservationId}`,
      payload,
      {
        headers: {
          ...authHeaders(),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to patch reservation");
  }
}

/** PATCH /reservations/:id — Update reservation status only */
export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus
): Promise<IReservation> {
  // Try the dedicated /status sub-route first; fall back to the root PATCH
  const tryRequest = async (url: string, body: object) => {
    const res = await axios.patch(url, body, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return res.data?.data || res.data;
  };

  try {
    return await tryRequest(`${API_BASE}/reservations/${reservationId}/status`, { status });
  } catch (firstErr: any) {
    // If the /status sub-route returns 404/405 try the root endpoint
    const status4xx = firstErr?.status ?? firstErr?.response?.status;
    if (status4xx === 404 || status4xx === 405) {
      try {
        return await tryRequest(`${API_BASE}/reservations/${reservationId}`, { status });
      } catch (secondErr) {
        throw toApiError(secondErr, "Failed to update reservation status");
      }
    }
    throw toApiError(firstErr, "Failed to update reservation status");
  }
}

/** DELETE /reservations/:id - Delete reservation */
export async function deleteReservation(
  reservationId: string
): Promise<{ success: boolean }> {
  try {
    const res = await axios.delete(`${API_BASE}/reservations/${reservationId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });

    // Treat any 2xx as success
    if (is2xx(res.status)) return { success: true };

    const data = res.data?.data || res.data;
    if (typeof data?.success === "boolean") return { success: data.success };
    return { success: false };
  } catch (err) {
    throw toApiError(err, "Failed to delete reservation");
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

/** Helper to parse decimal values from MongoDB format */
export function parseDecimalValue(decimalObj: { $numberDecimal: string } | string | number): number {
  if (!decimalObj) return 0;
  
  if (typeof decimalObj === 'object' && '$numberDecimal' in decimalObj) {
    return parseFloat(decimalObj.$numberDecimal);
  }
  
  if (typeof decimalObj === 'string') {
    return parseFloat(decimalObj);
  }
  
  if (typeof decimalObj === 'number') {
    return decimalObj;
  }
  
  return 0;
}

/** Helper to format currency display */
export function formatCurrencyDisplay(
  amount: { $numberDecimal: string } | string | number,
  currency: string = 'USD'
): string {
  const value = parseDecimalValue(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Calculate total days from pickup and dropoff */
export function calculateTotalDays(pickupAt: string, dropoffAt: string): number {
  const pickup = new Date(pickupAt);
  const dropoff = new Date(dropoffAt);
  const diffTime = Math.abs(dropoff.getTime() - pickup.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default {};