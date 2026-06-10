// vehicle_unit_service.ts
import axios, { AxiosError } from "axios";

/** ===== Base & Auth ===== */
const API_BASE =
  import.meta.env?.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

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
export type AvailabilityState =
  | "available"
  | "reserved"
  | "rented"
  | "out_of_service"
  | string;

export type VehicleStatus = "active" | "inactive" | "pending" | string;

export interface IVehicleMetadata {
  gps_device_id?: string;
  notes?: string;
  seats?: number;
  doors?: number;
  features?: string[];
  [key: string]: any;
}

export interface IVehicleModelSummary {
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
}

export interface IBranchSummary {
  _id: string;
  name?: string;
  code?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  geo?: {
    type?: "Point";
    coordinates?: [number, number]; // [lng, lat]
  };
  opening_hours?: Record<
    string,
    { open: string; close: string }[]
  >;
  phone?: string;
  email?: string;
  imageLoc?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface IVehicleUnit {
  _id: string;
  vin: string;
  plate_number: string;
  vehicle_model_id: string | IVehicleModelSummary;
  branch_id: string | IBranchSummary;
  odometer_km?: number;
  color?: string;
  status?: VehicleStatus;
  availability_state?: AvailabilityState;
  photos?: string[];
  last_service_at?: string | null;
  last_service_odometer_km?: number | null;
  metadata?: IVehicleMetadata;
  created_at?: string;
  updated_at?: string;
  __v?: number;
}

export interface IVehiclesResponse {
  success: boolean;
  data: {
    items: IVehicleUnit[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

/** Payloads */
export type CreateVehiclePayload = {
  vin: string;
  plate_number: string;
  vehicle_model_id: string;
  branch_id: string;
  odometer_km?: number;
  color?: string;
  status?: VehicleStatus;
  availability_state?: AvailabilityState;
  photos?: string[];
  metadata?: IVehicleMetadata;
};

// Add this type for service record payload
export type RecordServicePayload = {
  date: string; // ISO format: "2025-01-10T09:00:00Z"
  odometer_km: number;
};

export interface IServiceRecord {
  _id?: string;
  vehicle_id?: string;
  date: string;
  odometer_km: number;
  created_at?: string;
  updated_at?: string;
}
export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;

export type UpdateAvailabilityPayload = {
  availability_state: AvailabilityState;
};

/** ===== ApiError & helpers ===== */
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
 * POST /vehicles
 * Create a new vehicle unit.
 */
export async function createVehicleUnit(
  payload: CreateVehiclePayload
): Promise<IVehicleUnit | { success: boolean; data?: any }> {
  try {
    const res = await axios.post(`${API_BASE}/vehicles`, payload, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // Support multiple common response shapes
    const body = res.data;
    const maybeVehicle =
      body?.data?.vehicle || body?.data || body?.vehicle;

    return maybeVehicle || body;
  } catch (err) {
    throw toApiError(err, "Failed to create vehicle unit");
  }
}



/**
 * GET /vehicles
 * Fetch vehicle units with pagination and optional filters.
 */
export async function fetchVehicleUnits(
  page: number = 1,
  limit: number = 10,
  opts?: {
    search?: string;
    branch_id?: string;
    status?: VehicleStatus;
    availability_state?: AvailabilityState;
  }
): Promise<IVehiclesResponse> {
  try {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (opts?.search) params.append("search", opts.search);
    if (opts?.branch_id) params.append("branch_id", opts.branch_id);
    if (opts?.status) params.append("status", opts.status);
    if (opts?.availability_state)
      params.append("availability_state", opts.availability_state);

    const res = await axios.get(`${API_BASE}/vehicles?${params.toString()}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });

    return res.data as IVehiclesResponse;
  } catch (err) {
    throw toApiError(err, "Failed to fetch vehicle units");
  }
}

/**
 * GET /vehicles/:id
 */
export async function fetchVehicleUnitById(
  vehicleId: string
): Promise<IVehicleUnit> {
  try {
    const res = await axios.get(`${API_BASE}/vehicles/${vehicleId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    // some APIs return {data: {...}}, some return the object directly
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch vehicle unit");
  }
}

/**
 * PATCH /vehicles/:id
 * Update a vehicle unit.
 */
export async function updateVehicleUnit(
  vehicleId: string,
  payload: UpdateVehiclePayload
): Promise<IVehicleUnit> {
  try {
    // Log for debugging (mirror your style)
    const jsonPayload = JSON.stringify(payload);
    console.log("Updating vehicle payload (object):", payload);
    console.log("Updating vehicle payload (JSON):", jsonPayload);

    const res = await axios.patch(
      `${API_BASE}/vehicles/${vehicleId}`,
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
    throw toApiError(err, "Failed to update vehicle unit");
  }
}

/**
 * PATCH /vehicles/:id/availability
 * Update only the availability state.
 */
export async function updateVehicleAvailability(
  vehicleId: string,
  payload: UpdateAvailabilityPayload
): Promise<IVehicleUnit> {
  try {
    const res = await axios.patch(
      `${API_BASE}/vehicles/${vehicleId}/availability`,
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
    throw toApiError(err, "Failed to update vehicle availability");
  }
}


/**
 * POST /vehicles/:id/service
 * Record a service event for a vehicle.
 */
export async function recordVehicleService(
  vehicleId: string,
  payload: RecordServicePayload
): Promise<IServiceRecord> {
  try {
    const res = await axios.patch(
      `${API_BASE}/vehicles/${vehicleId}/service`,
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
    throw toApiError(err, "Failed to record vehicle service");
  }
}

/**
 * DELETE /vehicles/:id
 */
export async function deleteVehicleUnit(
  vehicleId: string
): Promise<{ success: boolean }> {
  try {
    const res = await axios.delete(`${API_BASE}/vehicles/${vehicleId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });

    if (res.status === 204) return { success: true };
    const body = res.data?.data || res.data;
    if (typeof body?.success === "boolean") return { success: body.success };
    return { success: true };
  } catch (err) {
    throw toApiError(err, "Failed to delete vehicle unit");
  }
}

/**
 * Helper for error display (same shape you use elsewhere)
 */
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
