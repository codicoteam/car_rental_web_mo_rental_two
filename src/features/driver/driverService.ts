import axios from 'axios';

const BASE_URL = 'http://13.61.185.238:5050/api/v1/driver-profiles/public';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface ApiResponse {
  data: Driver[];
  message: string;
  status: string;
  total?: number;
}

const driverService = {
  async getAllDrivers(): Promise<ApiResponse> {
    const response = await axios.get(BASE_URL);
    return response.data;
  }
};

export default driverService;