// notification_service.tsx
import axios, { AxiosError } from "axios";

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL || "http://13.61.185.238:5050/api/v1";

const AUTH_STORAGE_KEY = "car_rental_auth";

/** ===== Auth + storage helpers (same pattern as service_order_service) ===== */
const getToken = (): string | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
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

/** Pull current user id from storage */
const getStoredUserId = (): string | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const user = parsed?.user;
    return (user?._id as string) || (user?.id as string) || null;
  } catch {
    return null;
  }
};

/** ===== Types ===== */
export type NotificationType = "payment" | "info" | "warning" | "error";
export type NotificationPriority = "low" | "normal" | "high";
export type NotificationStatus = "draft" | "scheduled" | "sent" | "cancelled";

export interface IAudience {
  scope: "all" | "user" | "role";
  user_id?: string | null | IUserRef;
  roles?: string[];
}

export interface IUserRef {
  _id: string;
  email?: string;
  full_name?: string;
}

export interface IAcknowledgement {
  user_id: string | null | IUserRef;
  read_at?: string | null;
  acted_at?: string | null;
  action?: string | null;
}

export interface INotification {
  _id: string;

  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;

  audience?: IAudience;
  channels?: string[];

  send_at?: string | null;   // when to send (scheduled)
  sent_at?: string | null;   // when actually sent
  expires_at?: string | null;

  status?: NotificationStatus;
  is_active?: boolean;

  action_text?: string | null;
  action_url?: string | null;

  data?: Record<string, any>;

  acknowledgements?: IAcknowledgement[];

  created_by?: string | IUserRef | null;

  created_at?: string;
  updated_at?: string;
  __v?: number;

  [key: string]: any;
}

export type CreateNotificationPayload = {
  _id?: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;

  audience?: IAudience;
  channels?: string[];

  send_at?: string | null;
  sent_at?: string | null;
  expires_at?: string | null;

  status?: NotificationStatus;
  is_active?: boolean;

  action_text?: string | null;
  action_url?: string | null;

  data?: Record<string, any>;
  acknowledgements?: IAcknowledgement[];

  created_by?: string | null; // auto-filled from local storage if missing

  created_at?: string;
  updated_at?: string;
};

export type UpdateNotificationPayload = Partial<CreateNotificationPayload> & {
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

/** ===== Small helpers ===== */
const is2xx = (status?: number) => !!status && status >= 200 && status < 300;

/** ===== API functions ===== */

/** GET /notifications — list all notifications */
export async function fetchAllNotifications(): Promise<{
  success?: boolean;
  items?: INotification[];
  data?: INotification[]; // fallback shape just in case
  total?: number;
}> {
  try {
    const res = await axios.get(`${API_BASE}/notifications`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    // Some responses use { success, items }, others may use { data }
    return res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch notifications");
  }
}

/** GET /notifications/:id — (optional) fetch a single notification by id */
export async function fetchNotificationById(id: string): Promise<INotification> {
  try {
    const res = await axios.get(`${API_BASE}/notifications/${id}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch notification");
  }
}

/** GET /notifications/created-by/:userId — list notifications created by a user */
export async function fetchNotificationsCreatedBy(
  userId?: string | null
): Promise<{ success?: boolean; items?: INotification[]; total?: number }> {
  try {
    const uid = userId ?? getStoredUserId();
    if (!uid) throw new ApiError({ message: "Missing user id (created-by)" });

    const res = await axios.get(`${API_BASE}/notifications/created-by/${uid}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });

    return res.data;
  } catch (err) {
    throw toApiError(err, "Failed to fetch notifications by creator");
  }
}

/** POST /notifications — create a notification
 * Auto-injects `created_by` from local storage if not provided.
 */
export async function createNotification(
  payload: CreateNotificationPayload
): Promise<INotification | { success: boolean; data?: any }> {
  try {
    const ensured: CreateNotificationPayload = { ...payload };
    if (!ensured.created_by) {
      const uid = getStoredUserId();
      if (uid) ensured.created_by = uid;
    }

    const res = await axios.post(`${API_BASE}/notifications`, ensured, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const body = res.data;
    return body?.data?.notification || body?.data || body;
  } catch (err) {
    throw toApiError(err, "Failed to create notification");
  }
}

/** PATCH /notifications/:id — update a notification */
export async function updateNotification(
  id: string,
  payload: UpdateNotificationPayload
): Promise<INotification> {
  try {
    const res = await axios.patch(`${API_BASE}/notifications/${id}`, payload, {
      headers: {
        ...authHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to update notification");
  }
}

/** DELETE /notifications/:id — delete a notification */
export async function deleteNotification(id: string): Promise<{ success: boolean }> {
  try {
    const res = await axios.delete(`${API_BASE}/notifications/${id}`, {
      headers: { ...authHeaders(), Accept: "application/json" },
    });

    if (is2xx(res.status)) return { success: true };

    const data = res.data?.data || res.data;
    if (typeof data?.success === "boolean") return { success: data.success };
    return { success: false };
  } catch (err) {
    throw toApiError(err, "Failed to delete notification");
  }
}

/** POST /notifications/:id/schedule — schedule for later send */
export async function scheduleNotification(
  id: string,
  sendAtISO: string
): Promise<INotification> {
  try {
    const res = await axios.post(
      `${API_BASE}/notifications/${id}/schedule`,
      { send_at: sendAtISO },
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
    throw toApiError(err, "Failed to schedule notification");
  }
}

/** POST /notifications/:id/send — send now */
export async function sendNotification(id: string): Promise<INotification | { success?: boolean }> {
  try {
    const res = await axios.post(
      `${API_BASE}/notifications/${id}/send`,
      {},
      {
        headers: {
          ...authHeaders(),
          Accept: "application/json",
        },
      }
    );
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to send notification");
  }
}

/** POST /notifications/:id/cancel — cancel a scheduled notification */
export async function cancelNotification(id: string): Promise<INotification | { success?: boolean }> {
  try {
    const res = await axios.post(
      `${API_BASE}/notifications/${id}/cancel`,
      {},
      {
        headers: {
          ...authHeaders(),
          Accept: "application/json",
        },
      }
    );
    return res.data?.data || res.data;
  } catch (err) {
    throw toApiError(err, "Failed to cancel notification");
  }
}

/** Helper for error display (same shape as service_order_service) */
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
