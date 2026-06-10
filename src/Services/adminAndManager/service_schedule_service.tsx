// service_schedule_service.tsx
import axios, { AxiosError } from "axios";

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

/** ===== Auth helpers (same pattern as user_service/prom_code_service) ===== */
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
export interface IVehicleRef {
  _id: string;
  vin?: string;
  plate_number?: string;
  vehicle_model_id?: string;
  branch_id?: string;
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

export interface IServiceSchedule {
  _id: string;

  vehicle_id: string | IVehicleRef | null;
  vehicle_model_id: string | IVehicleModelRef | null;

  interval_km?: number | null;
  interval_days?: number | null;

  next_due_at?: string | null; // ISO date
  next_due_odo?: number | null;

  notes?: string | null;

  created_at?: string;
  updated_at?: string;
  createdAt?: string; // some APIs use camelCase
  updatedAt?: string;
  __v?: number;

  [key: string]: any;
}

export type CreateServiceSchedulePayload = {
  _id?: string; // API example includes _id in POST body; allow it
  vehicle_id?: string | null;
  vehicle_model_id?: string | null;
  interval_km?: number | null;
  interval_days?: number | null;
  next_due_at?: string | null; // ISO
  next_due_odo?: number | null;
  notes?: string | null;

  // some backends may accept these on create
  created_at?: string;
  updated_at?: string;
};

export type UpdateServiceSchedulePayload = {
  // PUT expects the full resource in your example; keep all fields optional to be flexible
  _id?: string;
  vehicle_id?: string | null;
  vehicle_model_id?: string | null;
  interval_km?: number | null;
  interval_days?: number | null;
  next_due_at?: string | null;
  next_due_odo?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  // accept alternate camelCase just in case
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

/** ===== Error handling (same pattern) ===== */
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

/** POST /service-schedules */
export async function createServiceSchedule(
  payload: CreateServiceSchedulePayload
): Promise<IServiceSchedule | { success: boolean; data?: any }> {
  try {
    const res = await axios.post(`${API_BASE}/service-schedules`, payload, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const body = res.data;
    const maybe = body?.data?.service_schedule || body?.data || body?.service_schedule;
    return maybe || body;
  } catch (err) {
    throw toApiError(err, "Failed to create service schedule");
  }
}

/** GET /service-schedules */
export async function fetchAllServiceSchedules(): Promise<{
  success: boolean;
  data: IServiceSchedule[];
}> {
  try {
    const res = await axios.get(`${API_BASE}/service-schedules`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data as { success: boolean; data: IServiceSchedule[] };
  } catch (err) {
    throw toApiError(err, "Failed to fetch service schedules");
  }
}

/** GET /service-schedules/:id */
export async function fetchServiceScheduleById(
  scheduleId: string
): Promise<IServiceSchedule> {
  try {
    const res = await axios.get(`${API_BASE}/service-schedules/${scheduleId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch service schedule");
  }
}

/** PUT /service-schedules/:id */
export async function updateServiceSchedule(
  scheduleId: string,
  payload: UpdateServiceSchedulePayload
): Promise<IServiceSchedule> {
  try {
    const jsonPayload = JSON.stringify(payload);

    console.log("Updating service schedule payload (object):", payload);
    console.log("Updating service schedule payload (JSON):", jsonPayload);

    const res = await axios.put(
      `${API_BASE}/service-schedules/${scheduleId}`,
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
    throw toApiError(err, "Failed to update service schedule");
  }
}

/** DELETE /service-schedules/:id */
export async function deleteServiceSchedule(
  scheduleId: string
): Promise<{ success: boolean }> {
  try {
    const res = await axios.delete(`${API_BASE}/service-schedules/${scheduleId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });

    // Treat any 2xx as success (your preference)
    if (is2xx(res.status)) return { success: true };

    const data = res.data?.data || res.data;
    if (typeof data?.success === "boolean") return { success: data.success };
    return { success: false };
  } catch (err) {
    throw toApiError(err, "Failed to delete service schedule");
  }
}

/** Helper for error display (same pattern) */
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
