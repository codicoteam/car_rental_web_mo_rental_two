import { createAsyncThunk } from '@reduxjs/toolkit';
import { vehiclesService } from './vehiclesService';

export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await vehiclesService.getAllVehicles();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch vehicles');
    }
  }
);