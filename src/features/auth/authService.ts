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

// Set auth token for axios requests
export function setAuthToken(token: string | null) {
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
}

// Save auth data to localStorage
export function saveAuthToStorage(auth: StoredAuth) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch (e) {
    console.error("Failed to save auth to storage:", e);
  }
}

// Load auth data from localStorage
export function loadAuthFromStorage(): StoredAuth {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    
    const parsed = JSON.parse(raw);
    
    // Validate the stored data structure
    if (parsed && typeof parsed === 'object' && 'token' in parsed && 'user' in parsed) {
      if (parsed.token) {
        setAuthToken(parsed.token);
      }
      return parsed;
    }
    
    return { token: null, user: null };
  } catch (e) {
    console.error("Failed to load auth from storage:", e);
    return { token: null, user: null };
  }
}

// Normalize auth response from API
function normalizeAuthResponse(resp: AuthApiResponse): { user: User; token: string } {
  if (!resp.success || !resp.data) {
    throw new Error(resp.message || "Authentication failed");
  }
  
  if (!resp.data.user || !resp.data.token) {
    throw new Error("Invalid response format from server");
  }
  
  return {
    user: resp.data.user,
    token: resp.data.token,
  };
}

// Normalize verify email response
function normalizeVerifyEmailResponse(resp: VerifyEmailResponse): { user: User; token: string } {
  if (!resp.success || !resp.data) {
    throw new Error(resp.message || "Email verification failed");
  }
  
  if (!resp.data.user || !resp.data.token) {
    throw new Error("Invalid response format from server");
  }
  
  return {
    user: resp.data.user,
    token: resp.data.token,
  };
}

// Extract error message from various error types
function extractErrorMessage(error: unknown): string {
  // Check if it's an Axios error
  if (typeof error === 'object' && error !== null && 'isAxiosError' in error) {
    const axiosError = error as any;
    
    // Handle 500 errors specifically
    if (axiosError.response?.status === 500) {
      return "Server error. Please try again later or contact support.";
    }
    
    // Handle 400 errors with detailed message
    if (axiosError.response?.status === 400) {
      const message = axiosError.response?.data?.message || axiosError.response?.data?.error;
      if (message) {
        return message;
      }
    }
    
    const msg =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message;
    return msg || "Request failed. Please try again.";
  }
  
  // Check if it's a standard Error
  if (error instanceof Error) {
    return error.message;
  }
  
  // Fallback for unknown error types
  return "Unexpected error. Please try again.";
}

// Clear auth data completely
export function clearAuthStorage() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('manager_branch_id');
  } catch (e) {
    console.error("Failed to clear auth storage:", e);
  }
  setAuthToken(null);
}

export const authService = {
  async register(payload: RegisterPayload): Promise<{ userId: string; email: string; status: string }> {
    console.log("Registering user:", payload);

    try {
      const res = await axios.post<RegisterResponse>(
        "http://13.61.185.238:5050/api/v1/users/register",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Registration response:", res.data);

      if (!res.data.success) {
        throw new Error(res.data.message || "Registration failed");
      }

      if (!res.data.data?.userId) {
        throw new Error("User ID not received from server");
      }

      return {
        userId: res.data.data.userId,
        email: res.data.data.email,
        status: res.data.data.status
      };

    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

   async verifyEmail(payload: VerifyEmailPayload): Promise<{ user: User; token: string }> {
  try {
    // Convert payload to JSON
    const jsonPayload = JSON.stringify(payload);
    console.log("Verifying email with JSON payload:", jsonPayload);

    const res = await axios.post<VerifyEmailResponse>(
      "http://13.61.185.238:5050/api/v1/users/verify-email",
      jsonPayload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Verify email response:", res.data);

    if (!res.data.success) {
      throw new Error(res.data.message || "Email verification failed");
    }

    const { user, token } = normalizeVerifyEmailResponse(res.data);

    setAuthToken(token);
    saveAuthToStorage({ token, user });

    return { user, token };

  } catch (error) {
    console.error("Verify email error:", error);
    throw new Error(extractErrorMessage(error));
  }
}
,

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

  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
    try {
      const res = await axiosInstance.post<AuthApiResponse>(
        "http://13.61.185.238:5050/api/v1/users/forgot-password",
        payload
      );

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to send reset email");
      }

      return { message: res.data.message || "Reset email sent successfully" };
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    try {
      const res = await axiosInstance.post<AuthApiResponse>(
        "http://13.61.185.238:5050/api/v1/users/reset-password",
        payload
      );

      if (!res.data.success) {
        throw new Error(res.data.message || "Failed to reset password");
      }

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

  // Utility function to check if user is authenticated based on stored data
  isAuthenticated(): boolean {
    const stored = loadAuthFromStorage();
    return Boolean(stored.token && stored.user);
  },

  // Utility function to get stored user
  getStoredUser(): User | null {
    const stored = loadAuthFromStorage();
    return stored.user;
  },

  // Utility function to get stored token
  getStoredToken(): string | null {
    const stored = loadAuthFromStorage();
    return stored.token;
  }
};