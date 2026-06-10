// admin_branch_service.tsx
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
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface IOpeningHourSlot {
  open: string; // "08:30"
  close: string; // "17:30"
}

export type OpeningHours = Partial<Record<DayKey, IOpeningHourSlot[]>>;

export interface IBranchAddress {
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postal_code?: string;
  country: string;
}

export interface IBranchGeo {
  type: "Point" | string;
  coordinates: [number, number]; // [lng, lat]
}

export interface IBranch {
  _id: string;
  name: string;
  code: string;
  address: IBranchAddress;
  geo?: IBranchGeo;
  opening_hours?: OpeningHours | Record<string, any>;
  phone?: string;
  email?: string;
  imageLoc?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

/** GET /branches returns { success: true, data: IBranch[] } */
export interface IBranchesListResponse {
  success: boolean;
  data: IBranch[];
  message?: string;
}

/** Common create/update response shapes seen in your API */
export type BranchWriteResponse =
  | {
      success: boolean;
      message?: string;
      data?: IBranch | any;
    }
  | any;

export type CreateBranchPayload = {
  name: string;
  code: string;
  address: IBranchAddress;
  geo?: IBranchGeo;
  opening_hours?: OpeningHours | Record<string, any>;
  phone?: string;
  email?: string;
  imageLoc?: string;
  active?: boolean;
};

export type UpdateBranchPayload = Partial<CreateBranchPayload> & {
  _id?: string;
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

/** ===== Small helpers to normalize response shapes ===== */
function unwrapBranch(body: any): any {
  // Common possibilities:
  // { success, data: {...branch} }
  // { success, data: { item: {...branch} } }
  // { data: {...branch} }
  // {...branch}
  return body?.data?.item || body?.data || body?.item || body;
}

/** ===== API functions ===== */

/**
 * GET /branches
 * Returns: { success: true, data: Branch[] }
 */
export async function fetchBranches(): Promise<IBranchesListResponse> {
  try {
    const res = await axios.get(`${API_BASE}/branches`, {
      headers: { ...authHeaders(), Accept: "*/*" },
    });
    return res.data as IBranchesListResponse;
  } catch (err) {
    throw toApiError(err, "Failed to fetch branches");
  }
}

/**
 * GET /branches/:id
 * (Optional helper — useful for edit screens)
 */
export async function fetchBranchById(id: string): Promise<IBranch> {
  try {
    const res = await axios.get(`${API_BASE}/branches/${id}`, {
      headers: { ...authHeaders(), Accept: "*/*" },
    });
    const body = res.data;
    const maybe = unwrapBranch(body);
    return maybe as IBranch;
  } catch (err) {
    throw toApiError(err, "Failed to fetch branch");
  }
}

/**
 * POST /branches
 * Creates a new branch
 */
export async function createBranch(
  payload: CreateBranchPayload
): Promise<IBranch | BranchWriteResponse> {
  try {
    const res = await axios.post(`${API_BASE}/branches`, payload, {
      headers: {
        ...authHeaders(),
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    });

    const body = res.data;
    const maybe = unwrapBranch(body);
    return maybe || body;
  } catch (err) {
    throw toApiError(err, "Failed to create branch");
  }
}

/**
 * PATCH /branches/:id
 * Updates a branch
 */
export async function updateBranch(
  id: string,
  payload: UpdateBranchPayload
): Promise<IBranch | BranchWriteResponse> {
  try {
    // Send as object (axios will JSON serialize). Avoid manual JSON.stringify unless your backend requires raw string.
    // Debug logs (optional)
    console.log("Updating branch payload (object):", payload);

    const res = await axios.patch(`${API_BASE}/branches/${id}`, payload, {
      headers: {
        ...authHeaders(),
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    });

    const body = res.data;
    const maybe = unwrapBranch(body);
    return maybe || body;
  } catch (err) {
    throw toApiError(err, "Failed to update branch");
  }
}

/**
 * DELETE /branches/:id
 */
export async function deleteBranch(
  id: string
): Promise<{ success: boolean }> {
  try {
    const res = await axios.delete(`${API_BASE}/branches/${id}`, {
      headers: {
        ...authHeaders(),
        Accept: "*/*",
      },
    });

    if (res.status === 204) return { success: true };
    const data = res.data?.data || res.data;

    if (typeof data?.success === "boolean") return { success: data.success };
    if (typeof res.data?.success === "boolean") return { success: res.data.success };

    return { success: true };
  } catch (err) {
    throw toApiError(err, "Failed to delete branch");
  }
}

/**
 * Helper for error display
 */
export function getBranchErrorDisplay(err: unknown): {
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
