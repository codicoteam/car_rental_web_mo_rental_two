// rate_plan_service.tsx
import axios, { AxiosError } from "axios";

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

/** ===== Auth helpers (same pattern as user_service) ===== */
const getToken = (): string | null => {
  try {
    const raw = localStorage.getItem("car_rental_auth");
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
export type VehicleClass =
  | "economy"
  | "compact"
  | "midsize"
  | "standard"
  | "fullsize"
  | "suv"
  | "luxury"
  | "van"
  | string;

export type MoneyDecimal =
  | string
  | number
  | { $numberDecimal: string }
  | null
  | undefined;

export interface IRatePlanSeason {
  name: string;
  start: string; // ISO date
  end: string; // ISO date
}

export interface IRatePlanSeasonalOverride {
  season: IRatePlanSeason;
  daily_rate?: MoneyDecimal;
  weekly_rate?: MoneyDecimal;
  monthly_rate?: MoneyDecimal;
  weekend_rate?: MoneyDecimal;
  _id?: string;
}

export interface IRatePlanTax {
  code: string;
  rate: number; // e.g. 0.15
  _id?: string;
}

export interface IRatePlanFee {
  code: string;
  amount: MoneyDecimal; // e.g. "10.00"
  _id?: string;
}

export interface IBranchRef {
  _id: string;
  name?: string;
}

export interface IVehicleRef {
  _id: string;
  vin?: string;
  plate_number?: string;
  vehicle_model_id?: string;
  branch_id?: string;
  photos?: string[];
  status?: string;
  availability_state?: string;
  odometer_km?: number;
  color?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  __v?: number;
  [key: string]: any;
}

export interface IRatePlan {
  _id: string;

  // API seems to sometimes populate objects for branch_id/vehicle_id
  branch_id: string | IBranchRef | null;
  vehicle_class: VehicleClass;

  vehicle_model_id?: string | null;
  vehicle_id?: string | IVehicleRef | null;

  currency: string;

  daily_rate?: MoneyDecimal;
  weekly_rate?: MoneyDecimal;
  monthly_rate?: MoneyDecimal;
  weekend_rate?: MoneyDecimal;

  seasonal_overrides?: IRatePlanSeasonalOverride[];
  taxes?: IRatePlanTax[];
  fees?: IRatePlanFee[];

  active?: boolean;

  valid_from?: string | null;
  valid_to?: string | null;

  name: string;
  notes?: string;

  createdAt?: string;
  updatedAt?: string;
  __v?: number;

  [key: string]: any;
}

export type CreateRatePlanPayload = {
  branch_id: string;
  vehicle_class: VehicleClass;
  vehicle_model_id?: string | null;
  vehicle_id?: string | null;

  currency: string;

  daily_rate: string; // API examples use strings like "50.00"
  weekly_rate?: string;
  monthly_rate?: string;
  weekend_rate?: string;

  seasonal_overrides?: Array<{
    season: IRatePlanSeason;
    daily_rate?: string;
    weekly_rate?: string;
    monthly_rate?: string;
    weekend_rate?: string;
  }>;

  taxes?: Array<{
    code: string;
    rate: number;
  }>;

  fees?: Array<{
    code: string;
    amount: string;
  }>;

  active?: boolean;

  valid_from?: string; // ISO
  valid_to?: string | null; // ISO or null

  name: string;
  notes?: string;
};

export type UpdateRatePlanPayload = Partial<CreateRatePlanPayload> & {
  // some APIs accept _id in body; safe to allow it
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
};

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

/** ===== Error handling (same pattern as user_service) ===== */
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

/** ===== Helpers ===== */
export function normalizeDecimal(val: MoneyDecimal): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object" && "$numberDecimal" in val)
    return String((val as any).$numberDecimal);
  return String(val);
}

/** ===== API functions ===== */

/** POST /rate-plans */
export async function createRatePlan(
  payload: CreateRatePlanPayload
): Promise<IRatePlan | { success: boolean; data?: any }> {
  try {
    const res = await axios.post(`${API_BASE}/rate-plans`, payload, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const body = res.data;
    // supports common shapes:
    // - { success: true, data: {...} }
    // - { data: {...} }
    // - { ... }
    const maybePlan = body?.data?.rate_plan || body?.data || body?.rate_plan;

    return maybePlan || body;
  } catch (err) {
    throw toApiError(err, "Failed to create rate plan");
  }
}

/** GET /rate-plans */
export async function fetchAllRatePlans(): Promise<{
  success: boolean;
  data: IRatePlan[];
}> {
  try {
    const res = await axios.get(`${API_BASE}/rate-plans`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data as { success: boolean; data: IRatePlan[] };
  } catch (err) {
    throw toApiError(err, "Failed to fetch rate plans");
  }
}

/** GET /rate-plans/:id (included for convenience) */
export async function fetchRatePlanById(ratePlanId: string): Promise<IRatePlan> {
  try {
    const res = await axios.get(`${API_BASE}/rate-plans/${ratePlanId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch rate plan");
  }
}

/** PATCH /rate-plans/:id */
export async function updateRatePlan(
  ratePlanId: string,
  payload: UpdateRatePlanPayload
): Promise<IRatePlan> {
  try {
    // match your user_service style: stringify + logs
    const jsonPayload = JSON.stringify(payload);

    console.log("Updating rate plan payload (object):", payload);
    console.log("Updating rate plan payload (JSON):", jsonPayload);

    const res = await axios.patch(
      `${API_BASE}/rate-plans/${ratePlanId}`,
      jsonPayload,
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
    throw toApiError(err, "Failed to update rate plan");
  }
}

/** DELETE /rate-plans/:id */
export async function deleteRatePlan(
  ratePlanId: string
): Promise<{ success: boolean }> {
  try {
    const res = await axios.delete(`${API_BASE}/rate-plans/${ratePlanId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });

    if (res.status === 204) return { success: true };
    const data = res.data?.data || res.data;
    if (typeof data?.success === "boolean") return { success: data.success };
    return { success: true };
  } catch (err) {
    throw toApiError(err, "Failed to delete rate plan");
  }
}

/** Helper for error display (same as user_service) */
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
