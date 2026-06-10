// import axiosInstance from "../../api/axiosInstance";
// import { loadAuthFromStorage } from "../auth/authService";
import axiosInstance from "../api/axiosInstance";
import { loadAuthFromStorage } from "../features/auth/authService"; 

const BASE_URL = "http://13.61.185.238:5050/api/v1/branches";

// ----------------------
// Interfaces
// ----------------------
export interface BranchAddress {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
}

export interface BranchGeo {
  type: string;
  coordinates: number[];
}

export interface BranchHours {
  open: string;
  close: string;
}

export interface BranchOpeningHours {
  mon: BranchHours[];
  tue: BranchHours[];
  wed: BranchHours[];
  thu: BranchHours[];
  fri: BranchHours[];
  sat: BranchHours[];
  sun: BranchHours[];
}

export interface Branch {
  _id: string;
  name: string;
  code: string;
  address: BranchAddress;
  geo: BranchGeo;
  opening_hours: BranchOpeningHours;
  phone: string;
  email: string;
  imageLoc: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
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
// Branches Service
// ----------------------
export const branchesService = {
  // Get all branches
  getAllBranches: async (): Promise<Branch[]> => {
    try {
      attachToken();

      const response = await axiosInstance.get<ApiResponse<Branch[]>>(BASE_URL);

      console.log("Branches API Response:", response.data);

      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      throw new Error("Invalid API response format: missing data array");
    } catch (error: any) {
      console.error("Failed to fetch branches:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch branches");
    }
  },

  // Get branch by ID
  getBranchById: async (branchId: string): Promise<Branch> => {
    try {
      attachToken();

      const response = await axiosInstance.get<ApiResponse<Branch>>(`${BASE_URL}/${branchId}`);

      console.log("Branch API Response:", response.data);

      if (response.data?.success && response.data.data) {
        return response.data.data;
      }

      throw new Error("Invalid API response format: missing data");
    } catch (error: any) {
      console.error(`Failed to fetch branch with ID ${branchId}:`, error);
      throw new Error(error.response?.data?.message || "Failed to fetch branch");
    }
  },

  // Get branches by manager ID
   getBranchesByManagerId: async (managerId: string): Promise<Branch[]> => {
  try {
    attachToken();

    const response = await axiosInstance.get<ApiResponse<Branch[]>>(`${BASE_URL}/manager/${managerId}`);

    console.log("Manager Branches API Response:", response.data);

    if (response.data?.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    throw new Error("Invalid API response format: missing data array");
  } catch (error: any) {
    console.error(`Failed to fetch branches for manager ${managerId}:`, error);
    throw new Error(error.response?.data?.message || "Failed to fetch branches for manager");
  }
},

  // Get active branches only
  getActiveBranches: async (): Promise<Branch[]> => {
    try {
      const branches = await branchesService.getAllBranches();
      return branches.filter(branch => branch.active === true);
    } catch (error: any) {
      console.error("Failed to fetch active branches:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch active branches");
    }
  },

  // Get branches with filters
  getBranchesWithFilters: async (filters?: {
    name?: string;
    code?: string;
    city?: string;
    region?: string;
    active?: boolean;
  }): Promise<Branch[]> => {
    try {
      attachToken();

      // Build query params
      const query = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query.append(key, value.toString());
          }
        });
      }

      const url = query.toString() ? `${BASE_URL}?${query.toString()}` : BASE_URL;

      const response = await axiosInstance.get<ApiResponse<Branch[]>>(url);

      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      throw new Error("Invalid response format from API");
    } catch (error: any) {
      console.error("Error fetching filtered branches:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch branches with filters");
    }
  },

  // Get branch by code
  getBranchByCode: async (code: string): Promise<Branch | null> => {
    try {
      const branches = await branchesService.getAllBranches();
      const branch = branches.find(b => b.code === code);
      return branch || null;
    } catch (error: any) {
      console.error(`Failed to fetch branch with code ${code}:`, error);
      throw new Error(error.response?.data?.message || "Failed to fetch branch by code");
    }
  },

  // Get branches by city
  getBranchesByCity: async (city: string): Promise<Branch[]> => {
    try {
      const branches = await branchesService.getAllBranches();
      return branches.filter(branch => 
        branch.address.city.toLowerCase() === city.toLowerCase()
      );
    } catch (error: any) {
      console.error(`Failed to fetch branches in city ${city}:`, error);
      throw new Error(error.response?.data?.message || "Failed to fetch branches by city");
    }
  },

  // Get branches by region
  getBranchesByRegion: async (region: string): Promise<Branch[]> => {
    try {
      const branches = await branchesService.getAllBranches();
      return branches.filter(branch => 
        branch.address.region.toLowerCase() === region.toLowerCase()
      );
    } catch (error: any) {
      console.error(`Failed to fetch branches in region ${region}:`, error);
      throw new Error(error.response?.data?.message || "Failed to fetch branches by region");
    }
  }
};