import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import driverService from '../../features/driver/driverService';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  status: string;
  [key: string]: any;
}

interface DriverState {
  drivers: Driver[];
  loading: boolean;
  error: string | null;
}

const initialState: DriverState = {
  drivers: [],
  loading: false,
  error: null,
};

export const fetchDrivers = createAsyncThunk(
  'drivers/fetchDrivers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await driverService.getAllDrivers();
      return response.data; // This should be Driver[] based on your service
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch drivers');
    }
  }
);

const driverSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false;
        // Make sure the payload is an array
        state.drivers = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.loading = false;
        // Handle both payload and error message
        state.error = action.payload as string || action.error.message || 'Failed to fetch drivers';
      });
  },
});

export default driverSlice.reducer;