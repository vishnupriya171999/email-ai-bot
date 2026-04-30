import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../config/locator";
import { clearSession, setSession, setUser } from "../store/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  fetchCurrentUser,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
} from "../services/authService";

function persistSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.token);
  window.localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(session.user));
}

function clearStoredSession() {
  window.localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  window.localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
}

export function useAuthSession() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const activeToken = storedToken || token;

    if (!activeToken) {
      dispatch(clearSession());
      setBootstrapping(false);
      return;
    }

    if (!storedToken) {
      window.localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, activeToken);
    }

    let active = true;

    void (async () => {
      try {
        const currentUser = await fetchCurrentUser();

        if (active) {
          window.localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(currentUser));
          dispatch(setUser(currentUser));
        }
      } catch {
        if (active) {
          clearStoredSession();
          dispatch(clearSession());
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
  }, [dispatch, token]);

  const login = useCallback(async (payload: LoginPayload) => {
    const session = await loginUser(payload);
    persistSession(session);
    dispatch(setSession(session));
    return session.user;
  }, [dispatch]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const session = await registerUser(payload);
    persistSession(session);
    dispatch(setSession(session));
    return session.user;
  }, [dispatch]);

  const forgotPassword = useCallback(async (email: string) => requestPasswordReset(email), []);

  const completePasswordReset = useCallback(async (payload: ResetPasswordPayload) => {
    const session = await resetPassword(payload);
    persistSession(session);
    dispatch(setSession(session));
    return session.user;
  }, [dispatch]);

  const logout = useCallback(() => {
    clearStoredSession();
    dispatch(clearSession());
  }, [dispatch]);

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
