// src/api/axiosInstance.ts
import axios from "axios";

// Key used in localStorage by authService
const AUTH_STORAGE_KEY = "car_rental_auth";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://13.61.185.238:5050",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Load token from localStorage safely
 */
function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

/**
 * REQUEST INTERCEPTOR — Attach Authorization token
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR — Normalize API errors & auto-logout on 401
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // No response (network error)
    if (!error.response) {
      return Promise.reject(new Error("Network error. Check your connection."));
    }

    const { status, data } = error.response;

    // Auto logout handler (optional)
    if (status === 401) {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
      return Promise.reject(
        new Error(data?.message || "Session expired. Please log in again.")
      );
    }

    const message =
      data?.message ||
      data?.error ||
      error.message ||
      "Unexpected server error";

    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;