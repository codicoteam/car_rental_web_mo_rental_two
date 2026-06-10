// prom_code_service.tsx
import axios, { AxiosError } from "axios";

const API_BASE =
    import.meta.env?.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

/** ===== Auth helpers (same pattern as user_service/rate_plan_service) ===== */
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

export type PromoCodeType = "percent" | "fixed";

export interface IPromoConstraints {
    allowed_classes?: VehicleClass[];
    min_days?: number;
    branch_ids?: string[];
    [key: string]: any;
}

export interface IPromoCode {
    _id: string;

    code: string; // e.g. "WELCOME10"
    type: PromoCodeType; // "percent" | "fixed"
    value: number; // for percent=10, fixed can be amount in currency units
    currency?: string; // required when type=fixed; optional for percent if your API allows

    active?: boolean;
    valid_from?: string | null; // ISO
    valid_to?: string | null; // ISO

    usage_limit?: number | null;
    used_count?: number;

    constraints?: IPromoConstraints;

    notes?: string;

    createdAt?: string;
    updatedAt?: string;
    __v?: number;

    [key: string]: any;
}

export type CreatePromoCodePayload = {
    code: string;
    type: PromoCodeType;
    value: number;
    currency?: string;

    active?: boolean;
    valid_from?: string | null;
    valid_to?: string | null;

    usage_limit?: number | null;

    constraints?: {
        allowed_classes?: VehicleClass[];
        min_days?: number;
        branch_ids?: string[];
    };

    notes?: string;
};

export type UpdatePromoCodePayload = Partial<CreatePromoCodePayload> & {
    _id?: string;
    used_count?: number;
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

/** ===== Error handling (same pattern as user_service/rate_plan_service) ===== */
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

/** POST /promo-codes */
export async function createPromoCode(
    payload: CreatePromoCodePayload
): Promise<IPromoCode | { success: boolean; data?: any }> {
    try {
        const res = await axios.post(`${API_BASE}/promo-codes`, payload, {
            headers: {
                ...authHeaders(),
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        const body = res.data;
        const maybeCode = body?.data?.promo_code || body?.data || body?.promo_code;

        return maybeCode || body;
    } catch (err) {
        throw toApiError(err, "Failed to create promo code");
    }
}

/** GET /promo-codes */
export async function fetchAllPromoCodes(): Promise<{
    success: boolean;
    data: IPromoCode[];
}> {
    try {
        const res = await axios.get(`${API_BASE}/promo-codes`, {
            headers: { ...authHeaders(), Accept: "application/json" },
        });
        return res.data as { success: boolean; data: IPromoCode[] };
    } catch (err) {
        throw toApiError(err, "Failed to fetch promo codes");
    }
}

/** GET /promo-codes/:id */
export async function fetchPromoCodeById(promoId: string): Promise<IPromoCode> {
    try {
        const res = await axios.get(`${API_BASE}/promo-codes/${promoId}`, {
            headers: { ...authHeaders(), Accept: "application/json" },
        });
        return res.data?.data || res.data;
    } catch (err) {
        throw toApiError(err, "Failed to fetch promo code");
    }
}

/** PATCH /promo-codes/:id */
export async function updatePromoCode(
    promoId: string,
    payload: UpdatePromoCodePayload
): Promise<IPromoCode> {
    try {
        const jsonPayload = JSON.stringify(payload);

        console.log("Updating promo code payload (object):", payload);
        console.log("Updating promo code payload (JSON):", jsonPayload);

        const res = await axios.patch(
            `${API_BASE}/promo-codes/${promoId}`,
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
        throw toApiError(err, "Failed to update promo code");
    }
}

/** DELETE /promo-codes/:id */
export async function deletePromoCode(
    promoId: string
): Promise<{ success: boolean }> {
    try {
        const res = await axios.delete(`${API_BASE}/promo-codes/${promoId}`, {
            headers: { ...authHeaders(), Accept: "application/json" },
        });

        if (res.status === 204) return { success: true };
        const data = res.data?.data || res.data;
        if (typeof data?.success === "boolean") return { success: data.success };
        return { success: true };
    } catch (err) {
        throw toApiError(err, "Failed to delete promo code");
    }
}

/** Helper for error display (same as user_service/rate_plan_service) */
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
