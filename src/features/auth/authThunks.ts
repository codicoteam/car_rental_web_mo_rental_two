// src/features/auth/authThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { 
  authService, 
  type RegisterPayload, 
  type VerifyEmailPayload, 
  type LoginPayload, 
  type User,
  type ForgotPasswordPayload,
  type ResetPasswordPayload
} from "./authService";

export const registerUser = createAsyncThunk<
  { userId: string; email: string; status: string },
  RegisterPayload,
  { rejectValue: string }
>("auth/registerUser", async (payload, { rejectWithValue }) => {
  try {
    console.log("Registering user in thunk:", payload);
    return await authService.register(payload);
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

export const verifyEmail = createAsyncThunk<
  { user: User; token: string },
  VerifyEmailPayload,
  { rejectValue: string }
>("auth/verifyEmail", async (payload, { rejectWithValue }) => {
  try {
    console.log("Verifying email in thunk:", payload);
    const result = await authService.verifyEmail(payload);
    console.log("Verify email thunk result:", result);
    return result;
  } catch (error) {
    console.log("Verify email thunk error:", error);
    return rejectWithValue((error as Error).message);
  }
});

export const loginUser = createAsyncThunk<
  { user: User; token: string },
  LoginPayload,
  { rejectValue: string }
>("auth/loginUser", async (payload, { rejectWithValue }) => {
  try {
    return await authService.login(payload);
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

export const forgotPassword = createAsyncThunk<
  { message: string },
  ForgotPasswordPayload,
  { rejectValue: string }
>("auth/forgotPassword", async (payload, { rejectWithValue }) => {
  try {
    return await authService.forgotPassword(payload);
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

export const resetPassword = createAsyncThunk<
  { message: string },
  ResetPasswordPayload,
  { rejectValue: string }
>("auth/resetPassword", async (payload, { rejectWithValue }) => {
  try {
    return await authService.resetPassword(payload);
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

export const getCurrentUser = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>("auth/getCurrentUser", async (_, { rejectWithValue }) => {
  try {
    return await authService.getCurrentUser();
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

export const updateProfile = createAsyncThunk<
  User,
  Partial<User>,
  { rejectValue: string }
>("auth/updateProfile", async (userData, { rejectWithValue }) => {
  try {
    return await authService.updateProfile(userData);
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});

export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("auth/logoutUser", async (_, { rejectWithValue }) => {
  try {
    authService.logout();
  } catch (error) {
    return rejectWithValue((error as Error).message);
  }
});