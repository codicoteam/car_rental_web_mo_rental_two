import { createAsyncThunk } from '@reduxjs/toolkit';
import profileService, { type Profile } from './profileService';

// POST /api/v1/profiles/self
export const createProfileThunk = createAsyncThunk<
  Profile,
  Profile,
  { rejectValue: string }
>(
  'profile/createProfile',
  async (profileData: Profile, { rejectWithValue }) => {
    try {
      return await profileService.createProfile(profileData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// GET /api/v1/profiles/me/{role}
export const getProfileByRoleThunk = createAsyncThunk<
  Profile,
  string,
  { rejectValue: string }
>(
  'profile/getProfileByRole',
  async (role: string, { rejectWithValue }) => {
    try {
      return await profileService.getProfileByRole(role);
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// PATCH /api/v1/profiles/{id}
export const updateProfileThunk = createAsyncThunk<
  Profile,
  { id: string; profileData: Partial<Profile> },
  { rejectValue: string }
>(
  'profile/updateProfile',
  async ({ id, profileData }, { rejectWithValue }) => {
    try {
      return await profileService.updateProfile(id, profileData);
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);