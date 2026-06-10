// admin_vehicle_model.tsx
import axios, { AxiosError } from "axios";

/** ===== Base URL ===== */
const API_BASE =
  import.meta.env?.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

/** ===== Auth helpers ===== */
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
export interface IVehicleModel {
  _id: string;
  make: string;
  model: string;
  year: number;
  class?: string; // e.g., "compact", "luxury"
  transmission?: "auto" | "manual" | string;
  fuel_type?: "petrol" | "diesel" | "electric" | "hybrid" | string;
  seats?: number;
  doors?: number;
  features?: string[];
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export type CreateVehicleModelPayload = {
  make: string;
  model: string;
  year: number;
  class?: string;
  transmission?: string;
  fuel_type?: string;
  seats?: number;
  doors?: number;
  features?: string[];
  images?: string[];
};

export type UpdateVehicleModelPayload = Partial<CreateVehicleModelPayload> & {
  _id?: string;
};

export interface IVehicleModelsResponse {
  success: boolean;
  data: {
    items: IVehicleModel[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

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

/** ===== API functions ===== */

/**
 * POST /vehicle-models
 * Creates a new vehicle model
 */
export async function createVehicleModel(
  payload: CreateVehicleModelPayload
): Promise<IVehicleModel | { success: boolean; data?: any }> {
  try {
    // 🔍 Log payload exactly as sent to API
    console.log(
      "Create Vehicle Model Payload:",
      JSON.stringify(payload, null, 2)
    );

    const res = await axios.post(`${API_BASE}/vehicle-models`, payload, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const body = res.data;
    const maybe = body?.data?.item || body?.data || body?.item;
    return maybe || body;
  } catch (err) {
    throw toApiError(err, "Failed to create vehicle model");
  }
}


/**
 * GET /vehicle-models
 * Supports optional pagination / search if your API supports them.
 */
export async function fetchVehicleModels(
  page?: number,
  limit?: number,
  search?: string
): Promise<IVehicleModelsResponse> {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));
    if (search) params.append("search", search);

    const query = params.toString();
    const url = query
      ? `${API_BASE}/vehicle-models?${query}`
      : `${API_BASE}/vehicle-models`;

    const res = await axios.get(url, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });

    return res.data as IVehicleModelsResponse;
  } catch (err) {
    throw toApiError(err, "Failed to fetch vehicle models");
  }
}

/**
 * GET /vehicle-models/:id
 */
export async function fetchVehicleModelById(
  id: string
): Promise<IVehicleModel> {
  try {
    const res = await axios.get(`${API_BASE}/vehicle-models/${id}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    // Many APIs return { data: { item } } or { data } or the object directly
    return res.data?.data?.item || res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch vehicle model");
  }
}

/**
 * PATCH /vehicle-models/:id
 */
export async function updateVehicleModel(
  id: string,
  payload: UpdateVehicleModelPayload
): Promise<IVehicleModel> {
  try {
    const jsonPayload = JSON.stringify(payload);

    // Optional: helpful when debugging
    console.log("Updating vehicle model payload (object):", payload);
    console.log("Updating vehicle model payload (JSON):", jsonPayload);

    const res = await axios.patch(`${API_BASE}/vehicle-models/${id}`, jsonPayload, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return res.data?.data?.item || res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to update vehicle model");
  }
}

/**
 * DELETE /vehicle-models/:id
 */
export async function deleteVehicleModel(
  id: string
): Promise<{ success: boolean }> {
  try {
    const res = await axios.delete(`${API_BASE}/vehicle-models/${id}`, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
      },
    });

    if (res.status === 204) return { success: true };
    const data = res.data?.data || res.data;
    if (typeof data?.success === "boolean") return { success: data.success };
    return { success: true };
  } catch (err) {
    throw toApiError(err, "Failed to delete vehicle model");
  }
}

/**
 * Helper for error display
 */
export function getVehicleModelErrorDisplay(err: unknown): {
  message: string;
  status?: number;
  method?: string;
  url?: string;
  data?: any;
} {
  const apiErr =
    err instanceof ApiError ? err : toApiError(err, "Request failed");
  return {
    message: apiErr.message,
    status: apiErr.status,
    method: apiErr.method,
    url: apiErr.url,
    data: apiErr.data,
  };
}

export default {};
