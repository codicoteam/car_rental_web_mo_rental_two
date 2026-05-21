import axios from "axios";

const BASE_URL = "http://13.61.185.238:5050/api/v1/driver-bookings";

interface Location {
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface DriverProfile {
  _id: string;
  user_id: string;
  display_name: string;
  base_city: string;
  base_region: string;
  base_country: string;
  hourly_rate: number;
  bio: string;
  years_experience: number;
  languages: string[];
  status: string;
  is_available: boolean;
  rating_average: number;
  rating_count: number;
  profile_image?: string;
}

interface Pricing {
  currency: string;
  hourly_rate_snapshot: number;  
  hours_requested: number;
  estimated_total_amount: number;
}

interface Customer {
  _id: string;
  email: string;
  phone: string;
  full_name: string;
}

export interface DriverBooking {
  _id: string;
  code: string;
  customer_id: Customer | null;
  created_by: string;
  created_channel: string;
  driver_profile_id: DriverProfile;
  driver_user_id: string;
  start_at: string;
  end_at: string;
  pickup_location: Location;
  dropoff_location: Location;
  notes: string;
  pricing: Pricing;
  status: string;
  requested_at: string;
  driver_responded_at: string | null;
  payment_deadline_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  payment_id: string | null;
  payment_status_snapshot: string;
  created_at: string;
  updated_at: string;
}

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
 * Service for handling driver booking-related API requests
 */
const BookingDriverService = {
  /**
   * Create a new driver booking (POST)
   */
  createBooking: async (data: any): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.post(`${BASE_URL}`, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to create driver booking";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
   * Get my own bookings (GET)
   * GET /api/v1/driver-bookings/me
   */
  getMyBookings: async (): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${BASE_URL}/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to retrieve your bookings";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  getAllBookings: async (): Promise<any> => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${BASE_URL}/admin`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw error.response?.data || "Failed to retrieve driver bookings";
    } else {
      throw "An unexpected error occurred";
    }
  }
},

  /**
   * Confirm payment for a booking (PATCH)
   * PATCH /api/v1/driver-bookings/me/{id}/confirm-payment
   */
  confirmPayment: async (id: string): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.patch(
        `${BASE_URL}/me/${id}/confirm-payment`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to confirm payment";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },

  /**
 * Delete a driver booking (DELETE)
 * DELETE /api/v1/driver-bookings/admin/{id}
 */
  deleteBooking: async (id: string): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.delete(`${BASE_URL}/admin/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to delete driver booking";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },
};

export default BookingDriverService;
