// vehicle_incident_manager.tsx (service module style, similar to reservation_manager.tsx)
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
export type MoneyDecimal =
  | string
  | number
  | { $numberDecimal: string }
  | null
  | undefined;

export interface IVehicleIncidentVehicleRef {
  _id: string;
  vin?: string;
  plate_number?: string;
  status?: string;
  photos?: string[];
  [key: string]: any;
}

export interface IVehicleIncidentReservationRef {
  _id: string;
  status?: string;
  [key: string]: any;
}

export interface IBranchRef {
  _id: string;
  name?: string;
  code?: string;
  address?: any;
  [key: string]: any;
}

export type VehicleIncidentType =
  | "accident"
  | "damage"
  | "theft"
  | "breakdown"
  | "violation"
  | string;

export type VehicleIncidentSeverity = "minor" | "moderate" | "major" | string;

export type VehicleIncidentStatus =
  | "open"
  | "in_review"
  | "resolved"
  | "closed"
  | string;

export interface IVehicleIncident {
  _id: string;

  vehicle_id?: string | IVehicleIncidentVehicleRef | null;
  reservation_id?: string | IVehicleIncidentReservationRef | null;

  reported_by?: string | null;
  branch_id?: string | IBranchRef | null;

  type: VehicleIncidentType;
  severity: VehicleIncidentSeverity;

  photos?: string[];

  description?: string;
  occurred_at: string; // ISO

  estimated_cost?: MoneyDecimal;
  final_cost?: MoneyDecimal;

  status?: VehicleIncidentStatus;

  chargeable_to_customer_amount?: MoneyDecimal;

  payment_id?: string | null;

  created_at?: string;
  updated_at?: string;
  __v?: number;

  [key: string]: any;
}

export type CreateVehicleIncidentPayload = {
  vehicle_id?: string | null;
  reservation_id?: string | null;
  reported_by?: string | null;
  branch_id?: string | null;

  type: VehicleIncidentType;
  severity: VehicleIncidentSeverity;

  photos?: string[];

  description?: string;
  occurred_at: string; // ISO

  estimated_cost?: number | string; // API accepts number in your curl
  final_cost?: number | string;

  status?: VehicleIncidentStatus;

  chargeable_to_customer_amount?: number | string;

  payment_id?: string | null;

  created_at?: string;
  updated_at?: string;
};

export type UpdateVehicleIncidentPayload = Partial<CreateVehicleIncidentPayload> & {
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

/** POST /vehicle-incidents */
export async function createVehicleIncident(
  payload: CreateVehicleIncidentPayload
): Promise<IVehicleIncident | { success: boolean; data?: any }> {
  try {
    const res = await axios.post(`${API_BASE}/vehicle-incidents`, payload, {
      headers: {
        ...authHeaders(),
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    });

    // supports shapes:
    // - { success: true, data: {...} }
    // - { data: {...} }
    // - { ... }
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to create vehicle incident");
  }
}

/** GET /vehicle-incidents */
export async function fetchAllVehicleIncidents(): Promise<{
  success: boolean;
  data: IVehicleIncident[];
}> {
  try {
    const res = await axios.get(`${API_BASE}/vehicle-incidents`, {
      headers: { ...authHeaders(), Accept: "*/*" },
    });
    return res.data as { success: boolean; data: IVehicleIncident[] };
  } catch (err) {
    throw toApiError(err, "Failed to fetch vehicle incidents");
  }
}

/** GET /vehicle-incidents/:id (optional convenience) */
export async function fetchVehicleIncidentById(
  incidentId: string
): Promise<IVehicleIncident> {
  try {
    const res = await axios.get(`${API_BASE}/vehicle-incidents/${incidentId}`, {
      headers: { ...authHeaders(), Accept: "*/*" },
    });
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch vehicle incident");
  }
}

/** PUT /vehicle-incidents/:id */
export async function updateVehicleIncident(
  incidentId: string,
  payload: UpdateVehicleIncidentPayload
): Promise<IVehicleIncident | { success: boolean; data?: any }> {
  try {
    const jsonPayload = JSON.stringify(payload);

    console.log("Updating vehicle incident payload (object):", payload);
    console.log("Updating vehicle incident payload (JSON):", jsonPayload);

    const res = await axios.put(
      `${API_BASE}/vehicle-incidents/${incidentId}`,
      jsonPayload,
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
    throw toApiError(err, "Failed to update vehicle incident");
  }
}

/** DELETE /vehicle-incidents/:id */
export async function deleteVehicleIncident(
  incidentId: string
): Promise<{ success: boolean }> {
  try {
    const res = await axios.delete(
      `${API_BASE}/vehicle-incidents/${incidentId}`,
      {
        headers: { ...authHeaders(), Accept: "*/*" },
      }
    );

    if (res.status === 204) return { success: true };
    const data = res.data?.data || res.data;
    if (typeof data?.success === "boolean") return { success: data.success };
    return { success: true };
  } catch (err) {
    throw toApiError(err, "Failed to delete vehicle incident");
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
