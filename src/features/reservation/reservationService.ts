// src/features/reservations/reservationService.ts
import axiosInstance from "../../api/axiosInstance";
import { loadAuthFromStorage } from "../auth/authService"; 

const BASE_URL = "http://13.61.185.238:5050";

export interface Reservation {
  id: string;
  [key: string]: any;
}

export const getAllReservations = async (): Promise<Reservation[]> => {
  // Get the stored token
  const token = loadAuthFromStorage();

  // Attach the token manually (only for this request)
  const response = await axiosInstance.get<Reservation[]>(
    `${BASE_URL}/api/v1/reservations`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );

  return response.data;
};

export const deleteReservation = async (reservationId: string): Promise<void> => {
  const token = loadAuthFromStorage();

  await axiosInstance.delete(
    `${BASE_URL}/api/v1/reservations/${reservationId}`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );
};

export const updateReservationStatus = async (reservationId: string, status: string): Promise<any> => {
  const token = loadAuthFromStorage();

  const response = await axiosInstance.patch(
    `${BASE_URL}/api/v1/reservations/${reservationId}/status`,
    { status },
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};
