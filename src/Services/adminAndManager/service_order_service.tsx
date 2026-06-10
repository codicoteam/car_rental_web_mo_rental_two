// service_order_service.tsx
import axios, { AxiosError } from "axios";

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

const AUTH_STORAGE_KEY = "car_rental_auth";

/** ===== Auth helpers (same pattern as other services) ===== */
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

/** ===== Pull current user id from storage =====
 * Expects localStorage "car_rental_auth" to contain:
 * { token: string, user: { _id?: string, id?: string, ... } }
 */
const getStoredUserId = (): string | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const user = parsed?.user;
    // Prefer Mongo-style _id, fallback to generic id
    return (user?._id as string) || (user?.id as string) || null;
  } catch {
    return null;
  }
};

/** ===== Types ===== */
export interface IVehicleModelRef {
  _id: string;
  make: string;
  model: string;
  year: number;
  class: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  doors: number;
  features: string[];
  images?: string[];
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface IBranchRef {
  _id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  __v?: number;
}

export interface IVehicleRef {
  _id: string;
  vin?: string;
  plate_number?: string;
  // vehicle_model_id?: string;
  // branch_id?: string;
   vehicle_model_id?: string | IVehicleModelRef;  // Change this line
  branch_id?: string | IBranchRef;  // Change this line
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

export type ServiceOrderType =
  | "scheduled_service"
  | "repair"
  | "tyre_change"
  | "inspection";

export type ServiceOrderStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface IServiceOrder {
  _id: string;

 
  vehicle_id: string | IVehicleRef | null;
  vehicle_model_id?: string | IVehicleModelRef | null;

  type: ServiceOrderType;
  status: ServiceOrderStatus;

  odometer_km?: number | null;
  cost?: number | null;
  notes?: string | null;

  created_by?: string | null;   // user id
  performed_by?: string | null; // user id

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;

  [key: string]: any;
}

export type CreateServiceOrderPayload = {
  _id?: string;
  vehicle_id?: string | null;
  type: ServiceOrderType;
  status?: ServiceOrderStatus; // backend default is "open"
  odometer_km?: number | null;
  cost?: number | null;
  notes?: string | null;
  created_by?: string | null;   // auto-filled from local storage if missing
  performed_by?: string | null;

  created_at?: string;
  updated_at?: string;
};

export type UpdateServiceOrderPayload = {
  _id?: string;
  vehicle_id?: string | null;
  type?: ServiceOrderType;
  status?: ServiceOrderStatus;
  odometer_km?: number | null;
  cost?: number | null;
  notes?: string | null;
  created_by?: string | null;
  performed_by?: string | null;
  created_at?: string;
  updated_at?: string;
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

/** GET /service-orders */
export async function fetchAllServiceOrders(): Promise<{
  success: boolean;
  data: IServiceOrder[];
}> {
  try {
    const res = await axios.get(`${API_BASE}/service-orders`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data as { success: boolean; data: IServiceOrder[] };
  } catch (err) {
    throw toApiError(err, "Failed to fetch service orders");
  }
}

/** GET /service-orders/:id */
export async function fetchServiceOrderById(orderId: string): Promise<IServiceOrder> {
  try {
    const res = await axios.get(`${API_BASE}/service-orders/${orderId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch service order");
  }
}

/** POST /service-orders
 * Auto-injects `created_by` from local storage if not provided in payload.
 */
export async function createServiceOrder(
  payload: CreateServiceOrderPayload
): Promise<IServiceOrder | { success: boolean; data?: any }> {
  try {
    const ensuredPayload: CreateServiceOrderPayload = { ...payload };
    if (!ensuredPayload.created_by) {
      const uid = getStoredUserId();
      if (uid) ensuredPayload.created_by = uid;
    }

    const res = await axios.post(`${API_BASE}/service-orders`, ensuredPayload, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const body = res.data;
    const maybe = body?.data?.service_order || body?.data || body?.service_order;
    return maybe || body;
  } catch (err) {
    throw toApiError(err, "Failed to create service order");
  }
}

/** PUT /service-orders/:id */
export async function updateServiceOrder(
  orderId: string,
  payload: UpdateServiceOrderPayload
): Promise<IServiceOrder> {
  try {
    const jsonPayload = JSON.stringify(payload);

    console.log("Updating service order payload (object):", payload);
    console.log("Updating service order payload (JSON):", jsonPayload);

    const res = await axios.put(
      `${API_BASE}/service-orders/${orderId}`,
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
    throw toApiError(err, "Failed to update service order");
  }
}

/** PATCH /service-orders/:id — convenience for status-only updates */
export async function updateServiceOrderStatus(
  orderId: string,
  status: ServiceOrderStatus
): Promise<IServiceOrder> {
  try {
    const res = await axios.patch(
      `${API_BASE}/service-orders/${orderId}`,
      { status },
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
    throw toApiError(err, "Failed to update service order status");
  }
}

/** DELETE /service-orders/:id */
export async function deleteServiceOrder(
  orderId: string
): Promise<{ success: boolean }> {
  try {
    const res = await axios.delete(`${API_BASE}/service-orders/${orderId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });

    // Treat any 2xx as success (not just 204)
    if (is2xx(res.status)) return { success: true };

    const data = res.data?.data || res.data;
    if (typeof data?.success === "boolean") return { success: data.success };
    return { success: false };
  } catch (err) {
    throw toApiError(err, "Failed to delete service order");
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
