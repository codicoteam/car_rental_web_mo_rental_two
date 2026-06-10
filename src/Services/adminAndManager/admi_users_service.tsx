// user_service.tsx
import axios, { AxiosError } from "axios";

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
export interface IUser {
  _id: string;
  full_name: string;
  email?: string;
  phone?: string;
  roles?: string[];
  status?: "active" | "pending" | "suspended" | string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string | Date;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IUsersResponse {
  success: boolean;
  data: {
    users: IUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type UpdateUserPayload = {
  full_name?: string;
  phone?: string;
  roles?: string[];
  status?: string;
  email_verified?: boolean;
};

export type CreateUserPayload = {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  roles?: string[];
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

/** ===== API functions with pagination ===== */

/** GET /users with pagination */
export async function fetchAllUsers(
  page: number = 1,
  limit: number = 5,
  search?: string
): Promise<IUsersResponse> {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);

    const res = await axios.get(`${API_BASE}/users?${params.toString()}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });

    return res.data as IUsersResponse;
  } catch (err) {
    throw toApiError(err, "Failed to fetch users");
  }
}

/** GET /users/:id */
export async function fetchUserById(userId: string): Promise<IUser> {
  try {
    const res = await axios.get(`${API_BASE}/users/${userId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch user");
  }
}

/**
 * POST /users/admin-create
 * Creates a new user (admin-create endpoint)
 */
export async function createUser(
  payload: CreateUserPayload
): Promise<IUser | { success: boolean; data?: any }> {
  try {
    const res = await axios.post(`${API_BASE}/users/admin-create`, payload, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // Supports common API shapes:
    // - { success: true, data: {...user} }
    // - { data: {...user} }
    // - { ...user }
    const body = res.data;
    const maybeUser = body?.data?.user || body?.data || body?.user;

    return maybeUser || body;
  } catch (err) {
    throw toApiError(err, "Failed to create user");
  }
}

/**
 * PATCH /users/:id
 */
export async function updateUser(
  userId: string,
  payload: UpdateUserPayload
): Promise<IUser> {
  try {
    // 1. Convert payload to JSON
    const jsonPayload = JSON.stringify(payload);

    // 2. Log payload (both object + JSON for debugging)
    console.log("Updating user payload (object):", payload);
    console.log("Updating user payload (JSON):", jsonPayload);

    // 3. Send JSON to SPI
    const res = await axios.patch(
      `${API_BASE}/users/${userId}`,
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
    throw toApiError(err, "Failed to update user");
  }
}


/** DELETE /users/:id */
export async function deleteUser(userId: string): Promise<{ success: boolean }> {
  try {
    const res = await axios.delete(`${API_BASE}/users/${userId}`, {
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
    throw toApiError(err, "Failed to delete user");
  }
}

/** Get current user roles from localStorage */
export function getCurrentUserRoles(): string[] {
  try {
    const raw = localStorage.getItem("car_rental_auth");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed?.user?.roles || [];
  } catch {
    return [];
  }
}

/**
 * Helper for error display
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
