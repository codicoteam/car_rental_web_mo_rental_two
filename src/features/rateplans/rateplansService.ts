// services/ratePlansService.ts
import axiosInstance from "../../api/axiosInstance";
import { loadAuthFromStorage } from "../auth/authService";

const BASE_URL = "http://13.61.185.238:5050/api/v1/rate-plans";

// ----------------------
// Interfaces
// ----------------------

// Branch interface
export interface Branch {
  _id: string;
  name: string;
  code?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postal_code: string;
  };
  phone?: string;
  email?: string;
}

// Vehicle metadata interface
export interface VehicleMetadata {
  gps_device_id?: string;
  notes?: string;
  seats: number;
  doors: number;
  features: string[];
}

// Vehicle details interface (matches the vehicle_id object in rate plan response)
export interface VehicleDetails {
  _id: string;
  vin: string;
  plate_number: string;
  vehicle_model_id: string;
  branch_id: string;
  odometer_km: number;
  color: string;
  status: string;
  availability_state: string;
  photos: string[];
  last_service_at: string | null;
  last_service_odometer_km: number | null;
  metadata: VehicleMetadata;
  created_at: string;
  updated_at: string;
  __v: number;
}

// Season interface
export interface Season {
  name: string;
  start: string;
  end: string;
}

// Seasonal override interface
export interface SeasonalOverride {
  season: Season;
  daily_rate: { $numberDecimal: string };
  weekly_rate: { $numberDecimal: string };
  monthly_rate: { $numberDecimal: string };
  weekend_rate: { $numberDecimal: string };
  _id: string;
}

// Tax interface
export interface Tax {
  code: string;
  rate: number;
  _id: string;
}

// Fee interface
export interface Fee {
  code: string;
  amount: { $numberDecimal: string };
  _id: string;
}

// Main Rate Plan interface
export interface RatePlan {
  _id: string;
  branch_id: Branch;
  vehicle_class: string;
  vehicle_model_id: string | null;
  vehicle_id: VehicleDetails;
  currency: string;
  daily_rate: { $numberDecimal: string };
  weekly_rate: { $numberDecimal: string };
  monthly_rate: { $numberDecimal: string };
  weekend_rate: { $numberDecimal: string };
  seasonal_overrides: SeasonalOverride[];
  taxes: Tax[];
  fees: Fee[];
  active: boolean;
  valid_from: string;
  valid_to: string;
  name: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// API Response wrapper
export interface RatePlanApiResponse {
  success: boolean;
  data: RatePlan[];
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
// Rate Plans Service
// ----------------------
export const ratePlansService = {
  // Get rate plans for a specific vehicle
  getRatePlansByVehicleId: async (vehicleId: string): Promise<RatePlan[]> => {
    try {
      attachToken();

      const response = await axiosInstance.get<RatePlanApiResponse>(
        `${BASE_URL}/by-vehicle/${vehicleId}`
      );

      console.log("Rate Plans API Response:", response.data);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error("Invalid API response format: missing data");
    } catch (error: any) {
      console.error("Failed to fetch rate plans for vehicle:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch rate plans");
    }
  },

  // Get active rate plan for a vehicle (the one currently valid)
  getActiveRatePlanByVehicleId: async (vehicleId: string): Promise<RatePlan | null> => {
    try {
      const ratePlans = await ratePlansService.getRatePlansByVehicleId(vehicleId);
      const now = new Date();

      // Find active rate plan that's valid for current date
      const activePlan = ratePlans.find(plan => {
        const validFrom = new Date(plan.valid_from);
        const validTo = new Date(plan.valid_to);
        return plan.active && now >= validFrom && now <= validTo;
      });

      return activePlan || null;
    } catch (error: any) {
      console.error("Failed to fetch active rate plan:", error);
      throw new Error(error.message || "Failed to fetch active rate plan");
    }
  },

  // Get rate plans for multiple vehicles
  getRatePlansForVehicles: async (vehicleIds: string[]): Promise<Map<string, RatePlan[]>> => {
    try {
      attachToken();

      const promises = vehicleIds.map(id => 
        axiosInstance.get<RatePlanApiResponse>(`${BASE_URL}/by-vehicle/${id}`)
      );
      
      const results = await Promise.allSettled(promises);
      const ratePlansMap = new Map<string, RatePlan[]>();

      results.forEach((result, index) => {
        const vehicleId = vehicleIds[index];
        
        if (result.status === 'fulfilled' && result.value.data?.success) {
          ratePlansMap.set(vehicleId, result.value.data.data);
        } else {
          console.error(`Failed to fetch rate plans for vehicle ${vehicleId}`);
          ratePlansMap.set(vehicleId, []);
        }
      });

      return ratePlansMap;
    } catch (error: any) {
      console.error("Failed to fetch rate plans for vehicles:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch rate plans");
    }
  },

  // Get all rate plans (if you have an endpoint for all rate plans)
  getAllRatePlans: async (params?: {
    branch_id?: string;
    vehicle_class?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ items: RatePlan[]; total: number; page: number; limit: number; totalPages: number }> => {
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

      const response = await axiosInstance.get<{ success: boolean; data: { items: RatePlan[]; total: number; page: number; limit: number; totalPages: number } }>(url);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error("Invalid API response format");
    } catch (error: any) {
      console.error("Failed to fetch all rate plans:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch rate plans");
    }
  },

  // Calculate total price with taxes and fees
  calculateTotalPrice: (
    ratePlan: RatePlan,
    durationDays: number,
    includeFees: boolean = true,
    includeTaxes: boolean = true
  ): {
    basePrice: number;
    feesTotal: number;
    taxesTotal: number;
    totalPrice: number;
  } => {
    // Get base daily rate
    const dailyRate = parseFloat(ratePlan.daily_rate.$numberDecimal);
    const basePrice = dailyRate * durationDays;

    // Calculate fees
    let feesTotal = 0;
    if (includeFees && ratePlan.fees) {
      feesTotal = ratePlan.fees.reduce((total, fee) => {
        return total + parseFloat(fee.amount.$numberDecimal);
      }, 0);
    }

    // Calculate taxes (assuming taxes are applied to base price + fees)
    let taxesTotal = 0;
    if (includeTaxes && ratePlan.taxes) {
      const subtotal = basePrice + feesTotal;
      taxesTotal = ratePlan.taxes.reduce((total, tax) => {
        return total + subtotal * tax.rate;
      }, 0);
    }

    const totalPrice = basePrice + feesTotal + taxesTotal;

    return {
      basePrice,
      feesTotal,
      taxesTotal,
      totalPrice,
    };
  },

  // Get seasonal rate for a specific date
  getSeasonalRate: (
    ratePlan: RatePlan,
    date: Date
  ): {
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
    weekendRate: number;
  } => {
    // Check if date falls within any seasonal override
    const seasonalOverride = ratePlan.seasonal_overrides?.find((override) => {
      const startDate = new Date(override.season.start);
      const endDate = new Date(override.season.end);
      return date >= startDate && date <= endDate;
    });

    if (seasonalOverride) {
      return {
        dailyRate: parseFloat(seasonalOverride.daily_rate.$numberDecimal),
        weeklyRate: parseFloat(seasonalOverride.weekly_rate.$numberDecimal),
        monthlyRate: parseFloat(seasonalOverride.monthly_rate.$numberDecimal),
        weekendRate: parseFloat(seasonalOverride.weekend_rate.$numberDecimal),
      };
    }

    // Return standard rates
    return {
      dailyRate: parseFloat(ratePlan.daily_rate.$numberDecimal),
      weeklyRate: parseFloat(ratePlan.weekly_rate.$numberDecimal),
      monthlyRate: parseFloat(ratePlan.monthly_rate.$numberDecimal),
      weekendRate: parseFloat(ratePlan.weekend_rate.$numberDecimal),
    };
  },

  // Format rate plan for display
  formatRatePlan: (ratePlan: RatePlan): {
    dailyRateFormatted: string;
    weeklyRateFormatted: string;
    monthlyRateFormatted: string;
    weekendRateFormatted: string;
    validityPeriod: string;
    taxesList: string[];
    feesList: string[];
    seasonalOverridesCount: number;
  } => {
    return {
      dailyRateFormatted: `${ratePlan.currency} ${parseFloat(
        ratePlan.daily_rate.$numberDecimal
      ).toFixed(2)}`,
      weeklyRateFormatted: `${ratePlan.currency} ${parseFloat(
        ratePlan.weekly_rate.$numberDecimal
      ).toFixed(2)}`,
      monthlyRateFormatted: `${ratePlan.currency} ${parseFloat(
        ratePlan.monthly_rate.$numberDecimal
      ).toFixed(2)}`,
      weekendRateFormatted: `${ratePlan.currency} ${parseFloat(
        ratePlan.weekend_rate.$numberDecimal
      ).toFixed(2)}`,
      validityPeriod: `${new Date(ratePlan.valid_from).toLocaleDateString()} - ${new Date(
        ratePlan.valid_to
      ).toLocaleDateString()}`,
      taxesList:
        ratePlan.taxes?.map((tax) => `${tax.code} (${(tax.rate * 100).toFixed(0)}%)`) || [],
      feesList:
        ratePlan.fees?.map(
          (fee) => `${fee.code}: ${ratePlan.currency} ${parseFloat(fee.amount.$numberDecimal).toFixed(2)}`
        ) || [],
      seasonalOverridesCount: ratePlan.seasonal_overrides?.length || 0,
    };
  },
};