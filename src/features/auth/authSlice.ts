import { createSlice } from "@reduxjs/toolkit";
import { type User, loadAuthFromStorage, authService } from "./authService";
import { registerUser, verifyEmail, loginUser } from "./authThunks";

export type AuthStatus = "idle" | "loading" | "succeeded" | "failed";

export interface AuthState {
  loading: boolean;
  user: User | null;
  token: string | null;
  status: AuthStatus;
  error: string | null;
  emailVerificationRequired: boolean;
  pendingVerificationEmail: string | null;
}

const stored = loadAuthFromStorage();

const initialState: AuthState = {
    user: stored.user,
    token: stored.token,
    status: "idle",
    error: null,
    emailVerificationRequired: false,
    loading: false,
    pendingVerificationEmail: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthError(state) {
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
      state.emailVerificationRequired = false;
      state.pendingVerificationEmail = null;
      authService.logout();
    },
    setPendingVerificationEmail(state, action) {
      state.pendingVerificationEmail = action.payload;
    },
    clearPendingVerificationEmail(state) {
      state.pendingVerificationEmail = null;
    }
  },
  extraReducers: (builder) => {
    // -------- REGISTER --------
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        
        // Store the email for verification
        state.pendingVerificationEmail = action.payload.email;
        state.emailVerificationRequired = true;
        
        // Don't set user or token yet - wait for email verification
        state.user = null;
        state.token = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload || "Registration failed.";
        state.pendingVerificationEmail = null;
      });

    // -------- VERIFY EMAIL --------
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.emailVerificationRequired = false;
        state.pendingVerificationEmail = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload || "Email verification failed.";
        // Keep pendingVerificationEmail so user can retry
      });

    // -------- LOGIN --------
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;
        state.error = null;
        state.user = action.payload.user;
        state.token = action.payload.token;

        const needsVerification =
          !action.payload.user.email_verified ||
          action.payload.user.status === "pending";

        state.emailVerificationRequired = needsVerification;
        
        if (needsVerification) {
          state.pendingVerificationEmail = action.payload.user.email;
        } else {
          state.pendingVerificationEmail = null;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.error = action.payload || "Login failed.";
        state.pendingVerificationEmail = null;
      });
  },
});

export const { resetAuthError, logout, setPendingVerificationEmail, clearPendingVerificationEmail } = authSlice.actions;

export default authSlice.reducer;