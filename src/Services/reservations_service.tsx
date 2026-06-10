// import axiosInstance from "../../api/axiosInstance";
// import { loadAuthFromStorage } from "../auth/authService";
import axiosInstance from "../api/axiosInstance";
import { loadAuthFromStorage } from "../features/auth/authService";

const BASE_URL = "http://13.61.185.238:5050/api/v1/reservations";

// ----------------------
// Interfaces
// ----------------------
export interface Tax {
  code: string;
  rate: number;
  amount: string;
}

export interface Discount {
  promo_code_id: string;
  amount: string;
}

export interface BreakdownItem {
  label: string;
  quantity: number;
  unit_amount: string;
  total: string;
}

export interface DriverLicense {
  number: string;
  country: string;
  class: string;
  expires_at: string;
  verified: boolean;
}

export interface DriverSnapshot {
  full_name: string;
  phone: string;
  email: string;
  driver_license: DriverLicense;
}

export interface Pricing {
  currency: string;
  breakdown: BreakdownItem[];
  taxes: Tax[];
  discounts?: Discount[];
  grand_total: string;
  computed_at: string;
}

export interface PickupDropoff {
  branch_id: string;
  at: string;
}

export interface CreateReservationPayload {
  code: string;
  user_id: string;
  vehicle_id: string;
  vehicle_model_id: string;
  pickup: PickupDropoff;
  dropoff: PickupDropoff;
  pricing: Pricing;
  driver_snapshot?: DriverSnapshot;
}

export interface ReservationResponse {
  _id: string;
  code: string;
  user_id: string;
  vehicle_id: string;
  vehicle_model_id: string;
  pickup: PickupDropoff;
  dropoff: PickupDropoff;
  pricing: Pricing;
  driver_snapshot?: DriverSnapshot;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ----------------------
// Helper: Ensure token is attached
// ----------------------
function attachToken() {
  const stored = loadAuthFromStorage();
  if (stored.token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${stored.token}`;
  }
}

// ----------------------
// Reservations Service
// ----------------------
export const reservationsService = {
  // Create a new reservation
  createReservation: async (payload: CreateReservationPayload): Promise<ReservationResponse> => {
    try {
      attachToken();

      const response = await axiosInstance.post<ApiResponse<ReservationResponse>>(BASE_URL, payload);

      console.log("Create Reservation Response:", response.data);

      if (response.data?.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data?.message || "Failed to create reservation");
    } catch (error: any) {
      console.error("Failed to create reservation:", error);
      throw new Error(error.response?.data?.message || "Failed to create reservation");
    }
  },

  // Get reservation by ID
  getReservationById: async (reservationId: string): Promise<ReservationResponse> => {
    try {
      attachToken();

      const response = await axiosInstance.get<ApiResponse<ReservationResponse>>(`${BASE_URL}/${reservationId}`);

      if (response.data?.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data?.message || "Failed to fetch reservation");
    } catch (error: any) {
      console.error(`Failed to fetch reservation ${reservationId}:`, error);
      throw new Error(error.response?.data?.message || "Failed to fetch reservation");
    }
  },

  // Get all reservations for current user
  getUserReservations: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ items: ReservationResponse[]; total: number; page: number; limit: number; totalPages: number }> => {
    try {
      attachToken();

      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query.append(key, value.toString());
          }
        });
      }

      const url = query.toString() ? `${BASE_URL}/user?${query.toString()}` : `${BASE_URL}/user`;

      const response = await axiosInstance.get<ApiResponse<{
        items: ReservationResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>>(url);

      if (response.data?.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data?.message || "Failed to fetch reservations");
    } catch (error: any) {
      console.error("Failed to fetch user reservations:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch reservations");
    }
  },

  // Update reservation status
  updateReservationStatus: async (reservationId: string, status: string): Promise<ReservationResponse> => {
    try {
      attachToken();

      const response = await axiosInstance.patch<ApiResponse<ReservationResponse>>(
        `${BASE_URL}/${reservationId}/status`,
        { status }
      );

      if (response.data?.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data?.message || "Failed to update reservation status");
    } catch (error: any) {
      console.error(`Failed to update reservation ${reservationId} status:`, error);
      throw new Error(error.response?.data?.message || "Failed to update reservation status");
    }
  },

  // Cancel reservation
  cancelReservation: async (reservationId: string): Promise<ReservationResponse> => {
    try {
      attachToken();

      const response = await axiosInstance.patch<ApiResponse<ReservationResponse>>(
        `${BASE_URL}/${reservationId}/cancel`,
        {}
      );

      if (response.data?.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data?.message || "Failed to cancel reservation");
    } catch (error: any) {
      console.error(`Failed to cancel reservation ${reservationId}:`, error);
      throw new Error(error.response?.data?.message || "Failed to cancel reservation");
    }
  },

  // Update reservation (for modifications)
  updateReservation: async (reservationId: string, updates: Partial<CreateReservationPayload>): Promise<ReservationResponse> => {
    try {
      attachToken();

      const response = await axiosInstance.put<ApiResponse<ReservationResponse>>(
        `${BASE_URL}/${reservationId}`,
        updates
      );

      if (response.data?.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data?.message || "Failed to update reservation");
    } catch (error: any) {
      console.error(`Failed to update reservation ${reservationId}:`, error);
      throw new Error(error.response?.data?.message || "Failed to update reservation");
    }
  },

  // Delete reservation
  deleteReservation: async (reservationId: string): Promise<{ success: boolean; message: string }> => {
    try {
      attachToken();

      const response = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/${reservationId}`);

      if (response.data?.success) {
        return { success: true, message: "Reservation deleted successfully" };
      }

      throw new Error(response.data?.message || "Failed to delete reservation");
    } catch (error: any) {
      console.error(`Failed to delete reservation ${reservationId}:`, error);
      throw new Error(error.response?.data?.message || "Failed to delete reservation");
    }
  }
};