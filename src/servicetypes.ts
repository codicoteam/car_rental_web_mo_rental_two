import type { ReactNode } from "react";

export interface Branch {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface VehicleMetadata {
  gps_device_id?: string;
  notes?: string;
  seats?: number;
  doors?: number;
  features?: string[];
  fuel_type?: string;
  transmission?: string;
  year?: number;
}

export interface Vehicle {
  license_plate: string;
  make: string;
  name: string;
  model: string;
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
}

export interface SeasonalOverride {
  season: {
    name: string;
    start: string;
    end: string;
  };
  daily_rate: { $numberDecimal: string };
  weekly_rate: { $numberDecimal: string };
  monthly_rate: { $numberDecimal: string };
  weekend_rate: { $numberDecimal: string };
  _id: string;
}

export interface Tax {
  code: string;
  rate: number;
  description: string;
  _id: string;
}

export interface Fee {
  code: string;
  amount: { $numberDecimal: string };
  description: string;
  _id: string;
}

export interface Pricing {
  dailyRate: any;
  plan_name: string;
  _id: string;
  branch_id: Branch;
  vehicle_class: string;
  vehicle_model_id: string | null;
  vehicle_id: Vehicle;
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
}

export interface ServiceOrder {
  type: ReactNode;
  odometer_km: ReactNode;
  cost(cost: any): import("react").ReactNode;
  performed_by: ReactNode;
  _id: string;
  vehicle_id: string;
  vehicle_vin?: string;
  vehicle_plate_number?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  service_type: string;
  description: string;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  cost_estimate?: { $numberDecimal: string };
  actual_cost?: { $numberDecimal: string };
  service_items: Array<{
    item: string;
    quantity: number;
    unit_price: { $numberDecimal: string };
    total: { $numberDecimal: string };
  }>;
  notes?: string;
  mechanic_notes?: string;
  branch_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceSchedule {
  description: any;
  next_due_at: any;
  interval_days: any;
  interval_km: any;
  next_due_odo: any;
  vehicle_model_id: any;
  __v: undefined;
  _id: string;
  vehicle_id: string;
  vehicle_vin?: string;
  vehicle_plate_number?: string;
  service_type: string;
  schedule_type: 'mileage' | 'time' | 'hybrid';
  interval_miles?: number;
  interval_months?: number;
  next_service_due_miles?: number;
  next_service_due_date?: string;
  last_service_miles?: number;
  last_service_date?: string;
  status: 'active' | 'completed' | 'overdue' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// User Types
export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface UserLicense {
  number?: string;
  country?: string;
  state?: string;
  class?: string;
  expires_at?: string;
  verified?: boolean;
}

export interface UserPreferences {
  notifications?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  language?: string;
  currency?: string;
}

export interface UserType {
  roles: boolean;
  full_name: ReactNode;
  _id: string;
  email: string;
  phone?: string;
  name: string;
  role: 'customer' | 'agent' | 'admin' | 'mechanic' | 'staff';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  avatar?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  address?: UserAddress;
  driver_license?: UserLicense;
  preferences?: UserPreferences;
  email_verified?: boolean;
  phone_verified?: boolean;
  last_login_at?: string;
  created_by?: string; // For agent-created users
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// For API responses
export interface UserResponse {
  data: UserType | UserType[];
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
}

// For user creation/update
export interface CreateUserDTO {
  email: string;
  phone?: string;
  name: string;
  role?: UserType['role'];
  password?: string;
  date_of_birth?: string;
  gender?: UserType['gender'];
  address?: UserAddress;
  driver_license?: UserLicense;
  preferences?: UserPreferences;
  notes?: string;
}

export interface UpdateUserDTO {
  email?: string;
  phone?: string;
  name?: string;
  role?: UserType['role'];
  status?: UserType['status'];
  date_of_birth?: string;
  gender?: UserType['gender'];
  address?: UserAddress;
  driver_license?: UserLicense;
  preferences?: UserPreferences;
  avatar?: string;
  notes?: string;
}

// For user authentication
export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  role: UserType['role'];
  avatar?: string;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

// For user filtering/pagination
export interface UserFilter {
  search?: string;
  role?: UserType['role'];
  status?: UserType['status'];
  email_verified?: boolean;
  phone_verified?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}


export type { UserType as User };