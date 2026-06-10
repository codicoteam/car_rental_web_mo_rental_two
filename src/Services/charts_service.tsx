import axios from "axios";

const BASE_URL = "http://13.61.185.238:5050/api/v1/users"; 

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
 * Service for handling user-related API requests
 */
const UserService = {
  /**
   * Fetch all users
   */
  getAllUsers: async (): Promise<any> => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`${BASE_URL}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data || "Failed to retrieve users";
      } else {
        throw "An unexpected error occurred";
      }
    }
  },
};

export default UserService;
