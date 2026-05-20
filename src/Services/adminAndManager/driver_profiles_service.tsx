import axios from "axios";



const BASE_URL = "http://13.61.185.238:5050/api/v1/driver-profiles";

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

// ============= INTERFACES =============

// User interface (nested in driver)
export interface User {
  _id: string;
  email: string;
  phone?: string;
  roles: string[];
  full_name: string;
  status: string;
}

// Identity document interface
export interface IdentityDocument {
  type: string;
  imageUrl: string;
}

// Driver license interface
export interface DriverLicense {
  number: string;
  imageUrl: string;
  country: string;
  class: string;
  expires_at: string;
  verified: boolean;
}

// Admin who approved the driver
export interface ApprovedByAdmin {
  _id: string;
  email: string;
  full_name: string;
}

// Main Driver Profile interface
export interface DriverProfile {
  _id: string;
  user_id: User;
  display_name: string;
  base_city: string;
  base_region: string;
  base_country: string;
  hourly_rate: number;
  bio: string;
  years_experience: number;
  languages: string[];
  identity_document: IdentityDocument;
  driver_license: DriverLicense;
  status: "pending" | "approved" | "rejected";
  approved_by_admin?: ApprovedByAdmin;
  approved_at?: string;
  rejection_reason: string;
  is_available: boolean;
  rating_average: number;
  rating_count: number;
  profile_image?: string;
  created_at: string;
  updated_at: string;
  __v: number;
}

export interface UpdateDriverPayload {
  display_name: string;
  base_city: string;
  base_region: string;
  base_country: string;
  hourly_rate: number;
  bio: string;
  years_experience: number;
  languages: string[];
  is_available: boolean;
  profile_image: string;
  driver_license: {
    number: string;
    imageUrl: string;
    country: string;
    class: string;
    expires_at: string;
    verified: boolean;
  };
  identity_document: {
    type: string;
    imageUrl: string;
  };
}

// API Response wrapper
export interface DriverProfilesResponse {
  success: boolean;
  data: DriverProfile[];
}

// Single driver response (if needed)
export interface DriverProfileResponse {
  success: boolean;
  data: DriverProfile;
}

/**
 * Service for handling driver profile-related API requests
 */
const DriverProfileService = {
  /**
   * Get all driver profiles (GET)
   * GET /api/v1/drivers
   */
  getAllDriverProfiles: async (): Promise<DriverProfilesResponse> => {
    try {
      const token = getAuthToken();
      const response = await axios.get<DriverProfilesResponse>(`${BASE_URL}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to fetch driver profiles";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Get a single driver by ID (GET)
   * GET /api/v1/drivers/:id
   */
  getDriverProfileById: async (driverId: string): Promise<DriverProfileResponse> => {
    try {
      const token = getAuthToken();
      const response = await axios.get<DriverProfileResponse>(`${BASE_URL}/api/v1/drivers/${driverId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to fetch driver profile";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
 * Update a driver profile (PATCH)
 * PATCH /api/v1/driver-profiles/{id}
 */
updateDriverProfile: async (driverId: string, updateData: Partial<DriverProfile>): Promise<DriverProfileResponse> => {
  try {
    const token = getAuthToken();
    const response = await axios.patch<DriverProfileResponse>(`${BASE_URL}/${driverId}`, updateData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || "Failed to update driver profile";
    } else {
      throw "An unexpected error occurred";
    }
  }
},

  /**
 * Delete a driver profile (DELETE)
 * DELETE /api/v1/driver-profiles/{id}
 */
deleteDriverProfile: async (driverId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(`${BASE_URL}/${driverId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || "Failed to delete driver profile";
    } else {
      throw "An unexpected error occurred";
    }
  }
},

/**
 * Approve a driver profile (POST)
 * POST /api/v1/driver-profiles/{id}/approve
 */
approveDriverProfile: async (driverId: string): Promise<{ success: boolean; data?: DriverProfile; message?: string }> => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${BASE_URL}/${driverId}/approve`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || "Failed to approve driver profile";
    } else {
      throw "An unexpected error occurred";
    }
  }
},

/**
 * Reject a driver profile (POST)
 * POST /api/v1/driver-profiles/{id}/reject
 */
rejectDriverProfile: async (driverId: string, reason: string): Promise<{ success: boolean; data?: DriverProfile; message?: string }> => {
  try {
    const token = getAuthToken();
    const response = await axios.post(`${BASE_URL}/${driverId}/reject`, { reason }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || "Failed to reject driver profile";
    } else {
      throw "An unexpected error occurred";
    }
  }
},

};

export default DriverProfileService;