import axiosInstance from "../../api/axiosInstance";
import { loadAuthFromStorage } from "../auth/authService"; 


const BASE_URL = "http://13.61.185.238:5050/api/v1/vehicles";

// ----------------------
// Interfaces
// ----------------------
export interface Vehicle {
  id: number;
  plate_number: string;
  vin: string;
  branch_id: string;
  status: string;
  availability_state: string;
  color: string;
  odometer: number;
  make: string;
  model: string;
  year: number;
  image: string;
  price: number;
  location: string;
  mileage: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: string;
}

export interface VehiclesResponse {
  items: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
// Vehicles Service
// ----------------------
export const vehiclesService = {
  // Get all vehicles
  getAllVehicles: async (): Promise<Vehicle[]> => {
    try {
      attachToken();

      const response = await axiosInstance.get<ApiResponse<VehiclesResponse>>(BASE_URL);

      console.log("API Response:", response.data);

      if (response.data?.data?.items) {
        return response.data.data.items;
      }

      throw new Error("Invalid API response format: missing data.items");
    } catch (error: any) {
      console.error("Failed to fetch vehicles:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch vehicles");
    }
  },

  // Get vehicles with any query parameters
  getVehiclesWithParams: async (params?: {
    plate_number?: string;
    vin?: string;
    branch_id?: string;
    status?: string;
    availability_state?: string;
    color?: string;
    odometer_min?: number;
    odometer_max?: number;
    page?: number;
    limit?: number;
  }): Promise<VehiclesResponse> => {
    try {
      attachToken();

      // Build query params
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query.append(key, value.toString());
          }
        });
      }

      const url = query.toString() ? `${BASE_URL}?${query.toString()}` : BASE_URL;

      const response = await axiosInstance.get<ApiResponse<VehiclesResponse>>(url);

      if (!response.data?.data) {
        throw new Error("Invalid response format from API");
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching filtered vehicles:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch vehicles with filters");
    }
  }
};
