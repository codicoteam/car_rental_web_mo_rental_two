// audit_service.tsx
import axios, { AxiosError } from "axios";

const API_BASE = import.meta.env?.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

const getToken = (): string | null => {
  try {
    const raw = localStorage.getItem("car_rental_auth");
    if (!raw) return null;
    return JSON.parse(raw)?.token || null;
  } catch { return null; }
};

const authHeaders = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

function toApiError(err: unknown, fallback: string): Error {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<any>;
    const msg = ax.response?.data?.message || ax.response?.data?.error || ax.message;
    return new Error(msg || fallback);
  }
  return err instanceof Error ? err : new Error(fallback);
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface IAuditLog {
  _id: string;
  user_id: string;
  actor_id?: { _id: string; full_name: string; email: string } | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  description?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface IUserStats {
  summary: {
    reservations: { total: number; active: number; cancelled: number; completed: number };
    payments: { paid_total_usd: number; paid_count: number };
    driver_bookings: { total: number; completed: number };
    profiles: string[];
  };
  charts: {
    reservations_by_month: { month: string; count: number }[];
    payments_by_month: { month: string; total: number }[];
    activity_breakdown: { action: string; count: number }[];
  };
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function fetchUserAuditLogs(
  userId: string,
  { page = 1, limit = 20, action }: { page?: number; limit?: number; action?: string } = {}
): Promise<{ logs: IAuditLog[]; total: number; page: number; totalPages: number }> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (action) params.append("action", action);
    const res = await axios.get(`${API_BASE}/audit/users/${userId}/logs?${params}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch audit logs");
  }
}

export async function fetchUserStats(userId: string): Promise<IUserStats> {
  try {
    const res = await axios.get(`${API_BASE}/audit/users/${userId}/stats`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch user stats");
  }
}

export default {};
