import axios from "axios";

const BASE_URL = "http://13.61.185.238:5050";

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
 * Service for handling service order-related API requests
 */
const ServiceOrderService = {
  /**
   * Get all service orders (GET)
   * GET /api/v1/service-orders
   */
  getAllServiceOrders: async (): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${BASE_URL}/api/v1/service-orders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to fetch service orders";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },
};

export default ServiceOrderService;
