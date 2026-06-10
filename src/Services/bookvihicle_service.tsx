import axios from "axios";

const BASE_URL = "http://13.61.185.238:5050/api/v1/reservations";

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
 * Service for handling vehicle reservation-related API requests
 */
const ReservationService = {
  /**
   * Create a new vehicle reservation (POST)
   */
  createReservation: async (data: any): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.post(`${BASE_URL}`, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to create vehicle reservation";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },
};

export default ReservationService;
