// admin_profiles_service.tsx
import axios, { AxiosError } from "axios";

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

/** ===== Auth helpers (same pattern as your users service) ===== */
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

/** ===== Error types/helpers ===== */
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

/** ===== Domain types ===== */

export type DriverLicense = {
  number?: string;
  imageUrl?: string;
  country?: string;
  class?: string;
  expires_at?: string | Date;
  verified?: boolean;
};

export type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
};

export type Preferences = {
  currency?: string;
  locale?: string;
};

export type Gdpr = {
  marketing_opt_in?: boolean;
};

export type ProfileRole = "customer" | "agent" | "manager" | string;

export interface IProfile {
  _id: string;
  id?: string;
  user: string; // userId
  role: ProfileRole;
  full_name: string;
  dob?: string | Date;
  national_id?: string;

  driver_license?: DriverLicense;
  address?: Address;
  preferences?: Preferences;
  gdpr?: Gdpr;

  // customer-only (often)
  loyalty_points?: number;

  // agent-only
  branch_id?: string;
  can_apply_discounts?: boolean;

  // manager-only
  branch_ids?: string[];
  approval_limit_usd?: number;

  verified?: boolean;
  created_at?: string;
  updated_at?: string;
  __v?: number;
}

export interface IProfilesByUserResponse {
  success: boolean;
  data: {
    profiles: IProfile[];
    total: number;
  };
}

/** ===== Payloads ===== */

type BaseCreateProfilePayload = {
  target_user_id: string;
  full_name: string;
  dob?: string | Date;
  national_id?: string;
  driver_license?: DriverLicense;
  address?: Address;
  preferences?: Preferences;
  gdpr?: Gdpr;
  verified?: boolean;
};

export type CreateCustomerProfilePayload = BaseCreateProfilePayload & {
  loyalty_points?: number;
};

export type CreateAgentProfilePayload = BaseCreateProfilePayload & {
  branch_id: string;
  can_apply_discounts?: boolean;
};

export type CreateManagerProfilePayload = BaseCreateProfilePayload & {
  branch_ids: string[];
  approval_limit_usd?: number;
};

/** For PATCH /profiles/:profileId you can send partial updates */
export type UpdateProfilePayload = Partial<
  Omit<IProfile, "_id" | "id" | "created_at" | "updated_at" | "__v">
> & {
  // some backends accept full body; keeping optional meta fields if you pass them
  _id?: string;
  id?: string;
  created_at?: string;
  updated_at?: string;
  __v?: number;
};

/** ===== API functions ===== */

/**
 * POST /profiles/customer/by-staff
 * Create customer profile by staff/admin
 */
export async function createCustomerProfileByStaff(
  payload: CreateCustomerProfilePayload
): Promise<IProfile | { success: boolean; data?: any }> {
  try {
    const res = await axios.post(
      `${API_BASE}/profiles/customer/by-staff`,
      payload,
      {
        headers: {
          ...authHeaders(),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const body = res.data;
    // common shapes:
    // - { success: true, data: { profile: {...} } }
    // - { success: true, data: {...} }
    // - { data: {...} }
    // - { ...profile }
    const maybeProfile =
      body?.data?.profile || body?.data?.profiles?.[0] || body?.data || body?.profile;

    return maybeProfile || body;
  } catch (err) {
    throw toApiError(err, "Failed to create customer profile");
  }
}

/**
 * POST /profiles/agent/by-staff
 * Create agent profile by staff/admin
 */
export async function createAgentProfileByStaff(
  payload: CreateAgentProfilePayload
): Promise<IProfile | { success: boolean; data?: any }> {
  try {
    const res = await axios.post(`${API_BASE}/profiles/agent/by-staff`, payload, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const body = res.data;
    const maybeProfile =
      body?.data?.profile || body?.data?.profiles?.[0] || body?.data || body?.profile;

    return maybeProfile || body;
  } catch (err) {
    throw toApiError(err, "Failed to create agent profile");
  }
}

/**
 * POST /profiles/manager/by-staff
 * Create manager profile by staff/admin
 */
export async function createManagerProfileByStaff(
  payload: CreateManagerProfilePayload
): Promise<IProfile | { success: boolean; data?: any }> {
  try {
    const res = await axios.post(
      `${API_BASE}/profiles/manager/by-staff`,
      payload,
      {
        headers: {
          ...authHeaders(),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const body = res.data;
    const maybeProfile =
      body?.data?.profile || body?.data?.profiles?.[0] || body?.data || body?.profile;

    return maybeProfile || body;
  } catch (err) {
    throw toApiError(err, "Failed to create manager profile");
  }
}

/**
 * GET /profiles/user/:userId
 * Get all profiles by user id (returns { success, data: { profiles, total }})
 */
export async function fetchProfilesByUserId(
  userId: string
): Promise<IProfilesByUserResponse> {
  try {
    const res = await axios.get(`${API_BASE}/profiles/user/${userId}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data as IProfilesByUserResponse;
  } catch (err) {
    throw toApiError(err, "Failed to fetch profiles by user id");
  }
}

/**
 * PATCH /profiles/:profileId
 * Update a profile by profile id
 */
export async function updateProfileById(
  profileId: string,
  payload: UpdateProfilePayload
): Promise<IProfile> {
  try {
    const res = await axios.patch(`${API_BASE}/profiles/${profileId}`, payload, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    // supports { success, data }, { data }, or raw profile
    return (res.data?.data || res.data) as IProfile;
  } catch (err) {
    throw toApiError(err, "Failed to update profile");
  }
}

/**
 * DELETE /profiles/:id
 * NOTE: Your curl shows DELETE /profiles/<someId>.
 * Many APIs expect profileId; if yours expects userId for delete, pass userId here.
 */
export async function deleteProfileById(
  id: string
): Promise<{ success: boolean }> {
  try {
    const res = await axios.delete(`${API_BASE}/profiles/${id}`, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
      },
    });

    if (res.status === 200) return { success: true };
    const data = res.data?.data || res.data;
    if (typeof data?.success === "boolean") return { success: data.success };
    return { success: true };
  } catch (err) {
    throw toApiError(err, "Failed to delete profile");
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
