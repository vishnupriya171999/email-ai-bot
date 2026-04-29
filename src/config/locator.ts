// Central place for app-wide constants and backend URLs.
// Set REACT_APP_API_URL in your .env file to override the default.

export const API_BASE_URL =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:5000/api";

export const FRONTEND_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  HOME: "/home",
  AI_CHAT: "/aichat",
  MAIL: "/mail",
  COMPOSE: "/compose",
};

export const EMAIL_ENDPOINTS = {
  LIST: `${API_BASE_URL}/emails`,
  CREATE: `${API_BASE_URL}/emails/add`,
  THREAD: `${API_BASE_URL}/emails/thread`,
  STATS: `${API_BASE_URL}/emails/stats`,
  AI_REPLY: `${API_BASE_URL}/emails/ai-reply`,
};

export const AUTH_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  ME: `${API_BASE_URL}/auth/me`,
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  AUTH_USER: "authUser",
};
