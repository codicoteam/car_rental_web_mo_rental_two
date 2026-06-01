import axios from 'axios';

const BASE_URL = "http://13.61.185.238:5050/api/v1/notifications";

/**
 * Helper to get the stored auth token
 */
const getAuthToken = (): string | null => {
  const stored = localStorage.getItem("car_rental_auth");
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    return parsed.token || null;
  } catch {
    return null;
  }
};

// Notification Types
export type NotificationType = 'info' | 'payment' | 'alert' | 'reminder';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';
export type AudienceScope = 'all' | 'user' | 'role' | 'branch';

// User reference interface
export interface UserReference {
  _id: string;
  email: string;
  full_name: string;
}

// Audience interface
export interface Audience {
  scope: AudienceScope;
  user_id?: string | UserReference | null;
  roles?: string[];
  branch_ids?: string[];
}

// Acknowledgement interface
export interface Acknowledgement {
  user_id: string | UserReference;
  read_at: string | null;
  acted_at: string | null;
  action: string | null;
}

// Notification interface
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  audience: Audience;
  channels: string[];
  send_at: string | null;
  sent_at: string | null;
  expires_at: string | null;
  status: NotificationStatus;
  is_active: boolean;
  action_text: string | null;
  action_url: string | null;
  data?: Record<string, any>;
  created_by: UserReference | null;
  acknowledgements: Acknowledgement[];
  created_at: string;
  updated_at: string;
  __v: number;
}

// Create Notification Payload
export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  audience: Audience;
  channels?: string[];
  send_at?: string | null;
  expires_at?: string | null;
  action_text?: string | null;
  action_url?: string | null;
  data?: Record<string, any>;
  acknowledgements?: Acknowledgement[];  // Add this - required by your backend
}

// Update Notification Payload
export interface UpdateNotificationPayload {
  title?: string;
  message?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  audience?: Audience;
  channels?: string[];
  send_at?: string | null;
  expires_at?: string | null;
  status?: NotificationStatus;
  is_active?: boolean;
  action_text?: string | null;
  action_url?: string | null;
  data?: Record<string, any>;
}

// API Response
export interface NotificationsResponse {
  success: boolean;
  items: Notification[];
  total?: number;
  page?: number;
  limit?: number;
}

// Query parameters
export interface NotificationsQueryParams {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  search?: string;
  from?: string;
  to?: string;
}

/**
 * Helper function to format date for API
 */
const formatDateForAPI = (date: Date): string => {
  return date.toISOString();
};

/**
 * Service for notification-related API requests
 */
const NotificationsService = {
  /**
   * Get all notifications with optional filters
   */
  getAllNotifications: async (params?: NotificationsQueryParams): Promise<NotificationsResponse> => {
    try {
      const token = getAuthToken();
      
      const queryParams: Record<string, any> = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.status) queryParams.status = params.status;
      if (params?.type) queryParams.type = params.type;
      if (params?.priority) queryParams.priority = params.priority;
      if (params?.search) queryParams.search = params.search;
      if (params?.from) queryParams.from = params.from;
      if (params?.to) queryParams.to = params.to;
      
      const response = await axios.get<NotificationsResponse>(
        BASE_URL,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: queryParams,
        }
      );
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error("Failed to fetch notifications");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to fetch notifications";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Get notification by ID
   */
  getNotificationById: async (id: string): Promise<Notification> => {
    try {
      const token = getAuthToken();
      const response = await axios.get<{ success: boolean; data: Notification }>(
        `${BASE_URL}/${id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Failed to fetch notification");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to fetch notification";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Create a new notification
   */
  createNotification: async (payload: CreateNotificationPayload): Promise<Notification> => {
    try {
      const token = getAuthToken();
      const response = await axios.post<{ success: boolean; data: Notification }>(
        BASE_URL,
        payload,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Failed to create notification");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to create notification";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Update a notification
   */
  updateNotification: async (id: string, payload: UpdateNotificationPayload): Promise<Notification> => {
    try {
      const token = getAuthToken();
      const response = await axios.patch<{ success: boolean; data: Notification }>(
        `${BASE_URL}/${id}`,
        payload,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Failed to update notification");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to update notification";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },
  /**
 * Schedule a notification (set send_at time)
 */
scheduleNotification: async (id: string, sendAt: string): Promise<Notification> => {
  try {
    const token = getAuthToken();
    const response = await axios.post<{ success: boolean; data: Notification }>(
      `${BASE_URL}/${id}/schedule`,
      { send_at: sendAt },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error("Failed to schedule notification");
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data?.message || error.response?.data || "Failed to schedule notification";
    } else {
      throw "An unexpected error occurred";
    }
  }
},
  /**
   * Delete a notification
   */
  deleteNotification: async (id: string): Promise<void> => {
    try {
      const token = getAuthToken();
      const response = await axios.delete<{ success: boolean }>(
        `${BASE_URL}/${id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (!response.data.success) {
        throw new Error("Failed to delete notification");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to delete notification";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Send notification now (if scheduled)
   */
  sendNotificationNow: async (id: string): Promise<Notification> => {
    try {
      const token = getAuthToken();
      const response = await axios.post<{ success: boolean; data: Notification }>(
        `${BASE_URL}/${id}/send`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Failed to send notification");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to send notification";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Cancel a scheduled notification
   */
  cancelNotification: async (id: string): Promise<Notification> => {
    try {
      const token = getAuthToken();
      const response = await axios.post<{ success: boolean; data: Notification }>(
        `${BASE_URL}/${id}/cancel`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Failed to cancel notification");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to cancel notification";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Get notification statistics
   */
  getNotificationStats: async (): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(
        `${BASE_URL}/stats`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to fetch notification statistics";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },
};

export default NotificationsService;