import axios from "axios";

const BASE_URL = "http://13.61.185.238:5050/api/v1/notifications";

/**
 * Helper to get the stored token
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

/**
 * Service for handling notification-related API requests
 */
const NotificationService = {
  /**
   * List all notifications (global)
   * GET /api/v1/notifications
   */
  getAllNotifications: async (): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${BASE_URL}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to retrieve notifications";
      }
      throw "An unexpected error occurred";
    }
  },

  /**
   * Get my notifications
   * GET /api/v1/notifications/mine
   */
  getMyNotifications: async (): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${BASE_URL}/mine`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to retrieve your notifications";
      }
      throw "An unexpected error occurred";
    }
  },

  /**
   * Get a single notification by ID
   * GET /api/v1/notifications/{id}
   */
  getNotificationById: async (id: string): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${BASE_URL}/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to retrieve notification";
      }
      throw "An unexpected error occurred";
    }
  },

  /**
   * Mark a notification as read
   * POST /api/v1/notifications/{id}/read
   */
  markAsRead: async (id: string): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/${id}/read`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to mark notification as read";
      }
      throw "An unexpected error occurred";
    }
  },

  /**
   * Perform an action on a notification
   * POST /api/v1/notifications/{id}/action
   */
  performAction: async (
    id: string,
    payload?: Record<string, any>
  ): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/${id}/action`,
        payload || {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to perform notification action";
      }
      throw "An unexpected error occurred";
    }
  },

  /**
   * Create a notification
   * POST /api/v1/notifications
   * status: draft | scheduled | sent
   */
  createNotification: async (
    payload: Record<string, any>
  ): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.post(`${BASE_URL}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to create notification";
      }
      throw "An unexpected error occurred";
    }
  },

  /**
   * Update a notification
   * PATCH /api/v1/notifications/{id}
   * Not allowed if sent or cancelled
   */
  updateNotification: async (
    id: string,
    payload: Record<string, any>
  ): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.patch(`${BASE_URL}/${id}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to update notification";
      }
      throw "An unexpected error occurred";
    }
  },

  /**
   * Disable (soft-delete) a notification
   * DELETE /api/v1/notifications/{id}
   * Sets is_active = false
   */
  deleteNotification: async (id: string): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.delete(`${BASE_URL}/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to delete notification";
      }
      throw "An unexpected error occurred";
    }
  },

  /**
   * Send a notification immediately
   * POST /api/v1/notifications/{id}/send
   */
  sendNotification: async (id: string): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/${id}/send`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to send notification";
      }
      throw "An unexpected error occurred";
    }
  },

  /**
   * Cancel a notification
   * POST /api/v1/notifications/{id}/cancel
   */
  cancelNotification: async (id: string): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/${id}/cancel`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to cancel notification";
      }
      throw "An unexpected error occurred";
    }
  },

  /**
   * List notifications visible/sent to a specific user
   * GET /api/v1/notifications/for-user/{userId}
   */
  getNotificationsForUser: async (userId: string): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(
        `${BASE_URL}/for-user/${userId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw (
          error.response?.data ||
          "Failed to retrieve notifications for user"
        );
      }
      throw "An unexpected error occurred";
    }
  },

  /**
   * List notifications created by a specific user
   * GET /api/v1/notifications/created-by/{userId}
   */
  getNotificationsCreatedByUser: async (
    userId: string
  ): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(
        `${BASE_URL}/created-by/${userId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw (
          error.response?.data ||
          "Failed to retrieve created notifications"
        );
      }
      throw "An unexpected error occurred";
    }
  },
};

export default NotificationService;
