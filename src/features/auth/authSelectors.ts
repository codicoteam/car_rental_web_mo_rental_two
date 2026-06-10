import { type RootState } from "../../app/store";

export const selectAuthState = (state: RootState) => state.auth;

export const selectCurrentUser = (state: RootState) => state.auth.user;

export const selectAuthToken = (state: RootState) => state.auth.token;

export const selectIsAuthenticated = (state: RootState) =>
  Boolean(state.auth.token && state.auth.user);

export const selectAuthStatus = (state: RootState) => state.auth.status;

export const selectAuthError = (state: RootState) => state.auth.error;

export const selectUserRoles = (state: RootState) =>
  state.auth.user?.roles ?? [];

export const selectEmailVerificationRequired = (state: RootState) =>
  state.auth.emailVerificationRequired;

export const selectPendingVerificationEmail = (state: RootState) =>
  state.auth.pendingVerificationEmail;

export const selectAuthLoading = (state: RootState) => state.auth.loading;