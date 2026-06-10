import axios, { AxiosError } from "axios";

const API_BASE_URL = "http://13.61.185.238:5050/api/v1/vehicle-incidents";

/** ===== Auth helpers (same pattern as rate_plan_service) ===== */
const getToken = (): string | null => {
  try {
    const raw = localStorage.getItem("car_rental_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** ===== Types ===== */
export type IncidentType = "accident" | "tyre" | "scratch" | "windshield" | "mechanical_issue" | "other";
export type IncidentSeverity = "minor" | "major";
export type IncidentStatus = "open" | "under_review" | "resolved" | "written_off";

export interface IVehicle {
  _id: string;
  vin: string;
  plate_number: string;
  status: string;
  photos?: string[];
}

export interface IReservation {
  _id: string;
  status: string;
}

export interface IBranch {
  _id: string;
  name: string;
  code: string;
  address: {
    line1: string;
    city: string;
    country: string;
  };
}

export interface IVehicleIncident {
  _id: string;
  vehicle_id: string | IVehicle;
  reservation_id: string | IReservation;
  reported_by: string;
  branch_id: string | IBranch;
  type: IncidentType;
  severity: IncidentSeverity;
  photos: string[];
  description: string;
  occurred_at: string;
  estimated_cost: number;
  final_cost: number;
  status: IncidentStatus;
  chargeable_to_customer_amount: number;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIncidentPayload {
  vehicle_id: string;
  reservation_id?: string;
  reported_by: string;
  branch_id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  photos: string[];
  description: string;
  occurred_at: string;
  estimated_cost?: number;
  final_cost?: number;
  status?: IncidentStatus;
  chargeable_to_customer_amount?: number;
  payment_id?: string;
}

export interface UpdateIncidentPayload {
  vehicle_id?: string;
  reservation_id?: string;
  type?: IncidentType;
  severity?: IncidentSeverity;
  photos?: string[];
  description?: string;
  occurred_at?: string;
  estimated_cost?: number;
  final_cost?: number;
  status?: IncidentStatus;
  chargeable_to_customer_amount?: number;
  payment_id?: string;
}

export interface IncidentsResponse {
  success: boolean;
  data: IVehicleIncident[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/** ===== Error handling ===== */
export const getIncidentErrorDisplay = (error: unknown): { message: string; status?: number } => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message;
    const status = error.response?.status;
    return { message, status };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: "An unexpected error occurred" };
};

/** ===== API Functions with Auth Headers ===== */

// GET all incidents
export const fetchAllIncidents = async (params?: {
  vehicle_id?: string;
  branch_id?: string;
  status?: IncidentStatus;
  type?: IncidentType;
}): Promise<IncidentsResponse> => {
  const response = await axios.get(`${API_BASE_URL}`, {
    params,
    headers: { ...authHeaders(), Accept: "application/json" },
  });
  return response.data;
};

// GET incident by ID
export const fetchIncidentById = async (id: string): Promise<{ success: boolean; data: IVehicleIncident }> => {
  const response = await axios.get(`${API_BASE_URL}/${id}`, {
    headers: { ...authHeaders(), Accept: "application/json" },
  });
  return response.data;
};

// POST create incident
export const createIncident = async (payload: CreateIncidentPayload): Promise<{ success: boolean; data: IVehicleIncident }> => {
  const response = await axios.post(`${API_BASE_URL}`, payload, {
    headers: {
      ...authHeaders(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

// PUT update incident
export const updateIncident = async (
  id: string,
  payload: UpdateIncidentPayload
): Promise<{ success: boolean; data: IVehicleIncident }> => {
  const response = await axios.put(`${API_BASE_URL}/${id}`, payload, {
    headers: {
      ...authHeaders(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

// DELETE incident
export const deleteIncident = async (id: string): Promise<{ success: boolean }> => {
  const response = await axios.delete(`${API_BASE_URL}/${id}`, {
    headers: { ...authHeaders(), Accept: "application/json" },
  });
  return response.data;
};