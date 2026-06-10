// services/authService.ts  (or wherever your current file lives)
import axios from "axios";
import axiosInstance from "../../api/axiosInstance";

export interface AuthProvider {
    provider: "google" | "apple" | "email";
    provider_user_id: string;
    added_at: string;
}

export interface User {
    id: string;
    name: string;
    _id: string;
    email: string;
    phone?: string;
    full_name: string;
    roles: string[];
    status: "pending" | "active" | "suspended" | "deleted";
    email_verified?: boolean;
    auth_providers: AuthProvider[];
    created_at: string;
    updated_at: string;
}

export interface AuthApiResponse {
    success: boolean;
    message: string;
    data?: any;
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    data?: {
        userId: string;
        email: string;
        status: string;
    };
}

export interface VerifyEmailResponse {
    success: boolean;
    message: string;
    data?: {
        user: User;
        token: string;
    };
}

export interface RegisterPayload {
    full_name: string;
    email: string;
    phone?: string;
    password: string;
    roles?: string[]; // <-- NEW
}

export interface VerifyEmailPayload {
    email: string;
    otp: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface StoredAuth {
    token: string | null;
    user: User | null;
}

export interface ForgotPasswordPayload {
    email: string;
}

export interface ResetPasswordPayload {
    token: string;
    password: string;
}

const AUTH_STORAGE_KEY = "car_rental_auth";

export function setAuthToken(token: string | null) {
    if (token) {
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete axiosInstance.defaults.headers.common["Authorization"];
    }
}

export function saveAuthToStorage(auth: StoredAuth) {
    try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } catch (e) {
        console.error("Failed to save auth to storage:", e);
    }
}

export function loadAuthFromStorage(): StoredAuth {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return { token: null, user: null };
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && "token" in parsed && "user" in parsed) {
            if (parsed.token) setAuthToken(parsed.token);
            return parsed;
        }
        return { token: null, user: null };
    } catch (e) {
        console.error("Failed to load auth from storage:", e);
        return { token: null, user: null };
    }
}

function normalizeAuthResponse(resp: AuthApiResponse): { user: User; token: string } {
    if (!resp.success || !resp.data) throw new Error(resp.message || "Authentication failed");
    if (!resp.data.user || !resp.data.token) throw new Error("Invalid response format from server");
    return { user: resp.data.user, token: resp.data.token };
}

function normalizeVerifyEmailResponse(resp: VerifyEmailResponse): { user: User; token: string } {
    if (!resp.success || !resp.data) throw new Error(resp.message || "Email verification failed");
    if (!resp.data.user || !resp.data.token) throw new Error("Invalid response format from server");
    return { user: resp.data.user, token: resp.data.token };
}

function extractErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "isAxiosError" in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 500) return "Server error. Please try again later or contact support.";
        if (axiosError.response?.status === 400) {
            const message = axiosError.response?.data?.message || axiosError.response?.data?.error;
            if (message) return message;
        }
        const msg =
            axiosError.response?.data?.message ||
            axiosError.response?.data?.error ||
            axiosError.message;
        return msg || "Request failed. Please try again.";
    }
    if (error instanceof Error) return error.message;
    return "Unexpected error. Please try again.";
}

export function clearAuthStorage() {
    try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
        console.error("Failed to clear auth storage:", e);
    }
    setAuthToken(null);
}

export const authService = {
    async register(payload: RegisterPayload): Promise<{ userId: string; email: string; status: string }> {
        console.log("Registering user:", payload);

        try {
            const body = {
                full_name: payload.full_name,
                email: payload.email,
                phone: payload.phone,
                password: payload.password,
                roles: payload.roles && payload.roles.length ? payload.roles : ["customer"], // <-- ensure roles sent
            };

            const res = await axios.post<RegisterResponse>(
                "http://13.61.185.238:5050/api/v1/users/register",
                body,
                { headers: { "Content-Type": "application/json" } }
            );

            console.log("Registration response:", res.data);

            if (!res.data.success) throw new Error(res.data.message || "Registration failed");
            if (!res.data.data?.userId) throw new Error("User ID not received from server");

            return {
                userId: res.data.data.userId,
                email: res.data.data.email,
                status: res.data.data.status,
            };
        } catch (error) {
            throw new Error(extractErrorMessage(error));
        }
    },

    async verifyEmail(payload: VerifyEmailPayload): Promise<{ user: User; token: string }> {
        try {
            const res = await axios.post<VerifyEmailResponse>(
                "http://13.61.185.238:5050/api/v1/users/verify-email",
                JSON.stringify(payload),
                { headers: { "Content-Type": "application/json" } }
            );

            console.log("Verify email response:", res.data);
            if (!res.data.success) throw new Error(res.data.message || "Email verification failed");

            const { user, token } = normalizeVerifyEmailResponse(res.data);
            setAuthToken(token);
            saveAuthToStorage({ token, user });
            return { user, token };
        } catch (error) {
            console.error("Verify email error:", error);
            throw new Error(extractErrorMessage(error));
        }
    },

    async login(payload: LoginPayload): Promise<{ user: User; token: string }> {
        try {
            const res = await axiosInstance.post<AuthApiResponse>(
                "http://13.61.185.238:5050/api/v1/users/login",
                payload
            );
            const { user, token } = normalizeAuthResponse(res.data);
            setAuthToken(token);
            saveAuthToStorage({ token, user });
            return { user, token };
        } catch (error) {
            throw new Error(extractErrorMessage(error));
        }
    },

    async forgotPassword(payload: { email: string }): Promise<{ message: string }> {
        try {
            const res = await axiosInstance.post<AuthApiResponse>(
                "http://13.61.185.238:5050/api/v1/users/forgot-password",
                payload
            );
            if (!res.data.success) throw new Error(res.data.message || "Failed to send reset email");
            return { message: res.data.message || "Reset email sent successfully" };
        } catch (error) {
            throw new Error(extractErrorMessage(error));
        }
    },

    async resetPassword(payload: { token: string; password: string }): Promise<{ message: string }> {
        try {
            const res = await axiosInstance.post<AuthApiResponse>(
                "http://13.61.185.238:5050/api/v1/users/reset-password",
                payload
            );
            if (!res.data.success) throw new Error(res.data.message || "Failed to reset password");
            return { message: res.data.message || "Password reset successfully" };
        } catch (error) {
            throw new Error(extractErrorMessage(error));
        }
    },

    async getCurrentUser(): Promise<User> {
        try {
            const res = await axiosInstance.get<AuthApiResponse>("/api/v1/users/me");
            if (!res.data.success || !res.data.data?.user) {
                throw new Error(res.data.message || "Failed to fetch user data");
            }
            return res.data.data.user;
        } catch (error) {
            throw new Error(extractErrorMessage(error));
        }
    },

    async updateProfile(userData: Partial<User>): Promise<User> {
        try {
            const res = await axiosInstance.put<AuthApiResponse>(
                "http://13.61.185.238:5050/api/v1/users/profile",
                userData
            );
            if (!res.data.success || !res.data.data?.user) {
                throw new Error(res.data.message || "Failed to update profile");
            }
            return res.data.data.user;
        } catch (error) {
            throw new Error(extractErrorMessage(error));
        }
    },

    logout() {
        clearAuthStorage();
    },

    isAuthenticated(): boolean {
        const stored = loadAuthFromStorage();
        return Boolean(stored.token && stored.user);
        // optionally also check token expiry if available
    },

    getStoredUser(): User | null {
        return loadAuthFromStorage().user;
    },

    getStoredToken(): string | null {
        return loadAuthFromStorage().token;
    },
};
