import { createAsyncThunk } from '@reduxjs/toolkit';
import driverService from '../../features/driver/driverService';

export const fetchDrivers = createAsyncThunk(
  'drivers/fetchDrivers',
  async () => {
    const response = await driverService.getAllDrivers();
    return response.data;
  }
);