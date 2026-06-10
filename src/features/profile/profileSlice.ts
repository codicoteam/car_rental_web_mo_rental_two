import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Profile } from './profileService';
import { createProfileThunk, getProfileByRoleThunk, updateProfileThunk } from './profileThunks';

interface ProfileState {
  data: Profile | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ProfileState = {
  data: null,
  status: 'idle',
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.data = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Profile
      .addCase(createProfileThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createProfileThunk.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(createProfileThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Failed to create profile';
      })
      // Get Profile by Role
      .addCase(getProfileByRoleThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getProfileByRoleThunk.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(getProfileByRoleThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Failed to fetch profile';
      })
      // Update Profile
      .addCase(updateProfileThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateProfileThunk.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Failed to update profile';
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;