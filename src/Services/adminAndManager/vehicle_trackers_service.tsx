import axios from 'axios';

const BASE_URL = "http://13.61.185.238:5050/api/v1/vehicle-trackers";

/**
 * Helper to get the stored auth token
 * Matches the pattern from PaymentService
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

export interface TrackerSettings {
  reporting_interval_sec: number;
  allow_background_tracking: boolean;
}

export interface VehicleTracker {
  _id: string;
  device_id: string;
  label: string;
  vehicle_id: string | null;
  branch_id: string | null;
  status: 'active' | 'inactive';
  last_seen_at: string | null;
  last_seen_ip: string;
  last_seen_user_agent: string;
  created_by: string;
  attached_at: string | null;
  detached_at: string | null;
  detach_reason: string;
  notes: string;
  settings: TrackerSettings;
  created_at: string;
  updated_at: string;
  __v: number;
}

export interface CreateTrackerPayload {
  device_id: string;
  label: string;
  notes?: string;
}

export interface UpdateTrackerPayload {
  label?: string;
  notes?: string;
  status?: 'active' | 'inactive';
  settings?: Partial<TrackerSettings>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Service for handling vehicle tracker-related API requests
 */
const VehicleTrackerService = {
  /**
   * Get all vehicle trackers (GET)
   * GET /api/v1/vehicle-trackers
   */
  getAllTrackers: async (): Promise<VehicleTracker[]> => {
    try {
      const token = getAuthToken();
      const response = await axios.get<ApiResponse<VehicleTracker[]>>(
        BASE_URL,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to fetch vehicle trackers");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to fetch vehicle trackers";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Get vehicle tracker by ID (GET)
   * GET /api/v1/vehicle-trackers/{id}
   */
  getTrackerById: async (id: string): Promise<VehicleTracker> => {
    try {
      const token = getAuthToken();
      const response = await axios.get<ApiResponse<VehicleTracker>>(
        `${BASE_URL}/${id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to fetch vehicle tracker");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to fetch vehicle tracker";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Create a new vehicle tracker (POST)
   * POST /api/v1/vehicle-trackers
   */
  createTracker: async (payload: CreateTrackerPayload): Promise<VehicleTracker> => {
    try {
      const token = getAuthToken();
      const response = await axios.post<ApiResponse<VehicleTracker>>(
        BASE_URL,
        payload,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to create vehicle tracker");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to create vehicle tracker";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Update a vehicle tracker (PUT)
   * PUT /api/v1/vehicle-trackers/{id}
   */
  updateTracker: async (id: string, payload: UpdateTrackerPayload): Promise<VehicleTracker> => {
    try {
      const token = getAuthToken();
      const response = await axios.patch<ApiResponse<VehicleTracker>>(
        `${BASE_URL}/${id}`,
        payload,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to update vehicle tracker");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to update vehicle tracker";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Delete a vehicle tracker (DELETE)
   * DELETE /api/v1/vehicle-trackers/{id}
   */
  deleteTracker: async (id: string): Promise<void> => {
    try {
      const token = getAuthToken();
      const response = await axios.delete<ApiResponse<void>>(
        `${BASE_URL}/${id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete vehicle tracker");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to delete vehicle tracker";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Bulk update tracker status (optional - if endpoint exists)
   * PATCH /api/v1/vehicle-trackers/bulk-status
   */
  bulkUpdateStatus: async (ids: string[], status: 'active' | 'inactive'): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.patch(
        `${BASE_URL}/bulk-status`,
        { ids, status },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to bulk update tracker status";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Get tracker statistics (optional - if endpoint exists)
   * GET /api/v1/vehicle-trackers/statistics
   */
  getTrackerStatistics: async (): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(
        `${BASE_URL}/statistics`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to fetch tracker statistics";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Attach tracker to vehicle (optional - if endpoint exists)
   * POST /api/v1/vehicle-trackers/{id}/attach
   */
  attachToVehicle: async (id: string, vehicleId: string): Promise<VehicleTracker> => {
    try {
      const token = getAuthToken();
      const response = await axios.patch<ApiResponse<VehicleTracker>>(
        `${BASE_URL}/${id}/attach`,
        { vehicle_id: vehicleId },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to attach tracker to vehicle");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to attach tracker to vehicle";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Detach tracker from vehicle (optional - if endpoint exists)
   * POST /api/v1/vehicle-trackers/{id}/detach
   */
  detachFromVehicle: async (id: string, reason?: string): Promise<VehicleTracker> => {
    try {
      const token = getAuthToken();
      const response = await axios.patch<ApiResponse<VehicleTracker>>(
        `${BASE_URL}/${id}/detach`,
        { reason: reason || "" },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to detach tracker from vehicle");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data?.message || error.response?.data || "Failed to detach tracker from vehicle";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  getVehicleLastLocation: async (vehicleId: string): Promise<{
    tracker: VehicleTracker;
    last_location: { latitude: number; longitude: number; speed_kmh?: number; heading_deg?: number; accuracy_m?: number; at?: string; source?: string } | null;
  } | null> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(
        `${BASE_URL}/vehicle/${vehicleId}/location`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      return response.data?.data || response.data || null;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 204)) {
        return null;
      }
      return null;
    }
  },
};

export default VehicleTrackerService;