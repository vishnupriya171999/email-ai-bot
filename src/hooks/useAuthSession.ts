import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../config/locator";
import {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  fetchCurrentUser,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
} from "../services/authService";

function loadStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.AUTH_USER);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.token);
  window.localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(session.user));
}

function clearStoredSession() {
  window.localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  window.localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
}

export function useAuthSession() {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (!token) {
      setBootstrapping(false);
      return;
    }

    let active = true;

    void (async () => {
      try {
        const currentUser = await fetchCurrentUser();

        if (active) {
          setUser(currentUser);
          window.localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(currentUser));
        }
      } catch {
        if (active) {
          clearStoredSession();
          setUser(null);
        }
      } finally {
        if (active) {
          setBootstrapping(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const session = await loginUser(payload);
    persistSession(session);
    setUser(session.user);
    return session.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const session = await registerUser(payload);
    persistSession(session);
    setUser(session.user);
    return session.user;
  }, []);

  const forgotPassword = useCallback(async (email: string) => requestPasswordReset(email), []);

  const completePasswordReset = useCallback(async (payload: ResetPasswordPayload) => {
    const session = await resetPassword(payload);
    persistSession(session);
    setUser(session.user);
    return session.user;
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    bootstrapping,
    login,
    register,
    forgotPassword,
    completePasswordReset,
    logout,
  };
}
