import axios from "axios";
import { AUTH_ENDPOINTS } from "../config/locator";
import apiClient from "./apiClient";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type PasswordResetRequestResponse = {
  message: string;
  resetToken?: string | null;
  resetUrl?: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
};

function normalizeUser(raw: Record<string, unknown>): AuthUser {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    username: String(raw.username ?? raw.name ?? ""),
    email: String(raw.email ?? ""),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
  };
}

function normalizeSession(data: Record<string, unknown>): AuthSession {
  return {
    token: String(data.token ?? ""),
    user: normalizeUser((data.user as Record<string, unknown>) ?? {}),
  };
}

export function getServiceErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message =
      typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : typeof error.response?.data?.error === "string"
          ? error.response.data.error
          : error.message;

    return message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export async function registerUser(payload: RegisterPayload) {
  const response = await apiClient.post(AUTH_ENDPOINTS.REGISTER, payload);
  return normalizeSession((response.data ?? {}) as Record<string, unknown>);
}

export async function loginUser(payload: LoginPayload) {
  const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, payload);
  return normalizeSession((response.data ?? {}) as Record<string, unknown>);
}

export async function logoutUser() {
  await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
}

export async function requestPasswordReset(email: string) {
  const response = await apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
  const data = (response.data ?? {}) as Record<string, unknown>;

  return {
    message: typeof data.message === "string" ? data.message : "Password reset instructions sent.",
    resetToken: typeof data.resetToken === "string" ? data.resetToken : null,
    resetUrl: typeof data.resetUrl === "string" ? data.resetUrl : null,
  } as PasswordResetRequestResponse;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const response = await apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, payload);
  return normalizeSession((response.data ?? {}) as Record<string, unknown>);
}

export async function fetchCurrentUser() {
  const response = await apiClient.get(AUTH_ENDPOINTS.ME);
  const data = (response.data ?? {}) as Record<string, unknown>;
  const rawUser = (data.user as Record<string, unknown>) ?? data;
  return normalizeUser(rawUser);
}
