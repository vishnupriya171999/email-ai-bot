import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, CssBaseline, Drawer, LinearProgress, Paper, ThemeProvider, Typography, createTheme, useMediaQuery } from "@mui/material";
import { AgentHeader, AgentSidebar, AnalyticsView, HomeView, InboxView, KnowledgeBaseView, ViewKey } from "./components/agent/AgentViews";
import { AuthMode, AuthPage } from "./components/auth/AuthPage";
import { FRONTEND_ROUTES } from "./config/locator";
import { useAuthSession } from "./hooks/useAuthSession";
import { DEFAULT_USER_EMAIL } from "./services/mailService";
import { PasswordResetRequestResponse, getServiceErrorMessage } from "./services/authService";
import { useAgentMailbox } from "./hooks/useAgentMailbox";

type AppScreenRoute = {
  kind: "app";
  view: ViewKey;
  threadId: string | null;
};

type AuthScreenRoute = {
  kind: "auth";
  mode: AuthMode;
  token?: string;
};

type AppRoute = AppScreenRoute | AuthScreenRoute;

function stripThreadDecorators(threadId: string) {
  const trimmed = threadId.trim();

  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function restoreThreadDecorators(threadId: string) {
  const trimmed = threadId.trim();

  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed;
  }

  return `<${trimmed}>`;
}

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname || "/";
}

function parseRoute(pathname: string, search: string): AppRoute {
  const normalized = normalizePath(pathname);
  const params = new URLSearchParams(search);

  if (normalized === FRONTEND_ROUTES.LOGIN) {
    return { kind: "auth", mode: "login" };
  }

  if (normalized === FRONTEND_ROUTES.REGISTER) {
    return { kind: "auth", mode: "register" };
  }

  if (normalized === FRONTEND_ROUTES.FORGOT_PASSWORD) {
    return { kind: "auth", mode: "forgot" };
  }

  if (normalized === FRONTEND_ROUTES.RESET_PASSWORD) {
    return { kind: "auth", mode: "reset", token: params.get("token") ?? undefined };
  }

  if (normalized === "/" || normalized === "/home") {
    return { kind: "app", view: "home", threadId: null };
  }

  if (normalized === "/inbox") {
    return { kind: "app", view: "inbox", threadId: null };
  }

  if (normalized.startsWith("/inbox/")) {
    return {
      kind: "app",
      view: "inbox",
      threadId: restoreThreadDecorators(decodeURIComponent(normalized.slice("/inbox/".length))),
    };
  }

  if (normalized === "/knowledge" || normalized === "/knowledge-base") {
    return { kind: "app", view: "knowledge", threadId: null };
  }

  if (normalized === "/analytics") {
    return { kind: "app", view: "analytics", threadId: null };
  }

  return { kind: "auth", mode: "login" };
}

function buildPath(route: AppRoute) {
  if (route.kind === "auth") {
    if (route.mode === "register") {
      return FRONTEND_ROUTES.REGISTER;
    }

    if (route.mode === "forgot") {
      return FRONTEND_ROUTES.FORGOT_PASSWORD;
    }

    if (route.mode === "reset") {
      return route.token
        ? `${FRONTEND_ROUTES.RESET_PASSWORD}?token=${encodeURIComponent(route.token)}`
        : FRONTEND_ROUTES.RESET_PASSWORD;
    }

    return FRONTEND_ROUTES.LOGIN;
  }

  if (route.view === "home") {
    return "/home";
  }

  if (route.view === "inbox") {
    return route.threadId ? `/inbox/${encodeURIComponent(stripThreadDecorators(route.threadId))}` : "/inbox";
  }

  if (route.view === "knowledge") {
    return "/knowledge";
  }

  return "/analytics";
}

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#5ee7ff",
    },
    secondary: {
      main: "#8b5cf6",
    },
    info: {
      main: "#38bdf8",
    },
    success: {
      main: "#22c55e",
    },
    background: {
      default: "#020816",
      paper: "#071423",
    },
    text: {
      primary: "#f3f7ff",
      secondary: "#8ca0b8",
    },
    divider: "rgba(122, 146, 176, 0.22)",
  },
  shape: {
    borderRadius: 2,
  },
  typography: {
    fontFamily: ['"Inter"', '"Segoe UI"', "system-ui", "sans-serif"].join(","),
    h1: { fontWeight: 800, letterSpacing: "-0.04em" },
    h2: { fontWeight: 800, letterSpacing: "-0.035em" },
    h3: { fontWeight: 800, letterSpacing: "-0.03em" },
    h4: { fontWeight: 750, letterSpacing: "-0.025em" },
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700, letterSpacing: "-0.02em" },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#020816",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          boxShadow: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
  },
});

function App() {
  const isCompact = useMediaQuery(theme.breakpoints.down("lg"));
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.pathname, window.location.search));
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [forgotPasswordResult, setForgotPasswordResult] = useState<PasswordResetRequestResponse | null>(null);
  const { user, isAuthenticated, bootstrapping, login, register, forgotPassword, completePasswordReset, logout } =
    useAuthSession();
  const {
    view,
    setView,
    selectedThreadId,
    setSelectedThreadId,
    search,
    setSearch,
    loading,
    refreshing,
    statusMessage,
    setStatusMessage,
    error,
    setError,
    mobileNavOpen,
    setMobileNavOpen,
    knowledgeBase,
    handleAddKnowledge,
    handleDeleteKnowledge,
    handleSeedSampleMail,
    handleToggleFlag,
    handleDeleteThread,
    handleSendThreadMessage,
    visibleThreads,
    filteredThreads,
    selectedThread,
    threadLoading,
    threadMessages,
    stats,
    loadMailbox,
  } = useAgentMailbox({
    userEmail: user?.email || DEFAULT_USER_EMAIL,
    enabled: isAuthenticated,
  });

  const homeView = route.kind === "app" && view === "home";
  const inboxView = route.kind === "app" && view === "inbox";
  const activeAuthMode = route.kind === "auth" ? route.mode : "login";

  const clearAuthFeedback = useCallback(() => {
    setAuthError(null);
    setAuthNotice(null);
    setForgotPasswordResult(null);
  }, []);

  const commitRoute = useCallback((nextRoute: AppRoute, replace = false) => {
    const nextPath = buildPath(nextRoute);
    const currentPath = `${window.location.pathname}${window.location.search}`;

    if (currentPath !== nextPath) {
      if (replace) {
        window.history.replaceState({}, "", nextPath);
      } else {
        window.history.pushState({}, "", nextPath);
      }
    }

    setRoute(nextRoute);
  }, []);

  const navigateTo = useCallback(
    (nextView: ViewKey, threadId: string | null = null, replace = false) => {
      commitRoute(
        {
          kind: "app",
          view: nextView,
          threadId: nextView === "inbox" ? threadId : null,
        },
        replace
      );
    },
    [commitRoute]
  );

  const navigateToAuth = useCallback(
    (mode: AuthMode, token?: string, replace = false) => {
      commitRoute({ kind: "auth", mode, token }, replace);
      setMobileThreadOpen(false);
    },
    [commitRoute]
  );

  const authTitle = useMemo(() => {
    if (activeAuthMode === "register") {
      return "AI Mail Agent | Create Account";
    }

    if (activeAuthMode === "forgot") {
      return "AI Mail Agent | Forgot Password";
    }

    if (activeAuthMode === "reset") {
      return "AI Mail Agent | Reset Password";
    }

    return "AI Mail Agent | Connect Mailbox";
  }, [activeAuthMode]);

  useEffect(() => {
    const pageTitle = route.kind === "auth"
      ? authTitle
      : view === "home"
        ? "AI Mail Agent | Home"
        : view === "inbox"
          ? selectedThreadId
            ? "AI Mail Agent | Inbox Thread"
            : "AI Mail Agent | Inbox"
          : view === "knowledge"
            ? "AI Mail Agent | Knowledge Base"
            : "AI Mail Agent | Analytics";

    document.title = pageTitle;
  }, [authTitle, route.kind, selectedThreadId, view]);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoute(window.location.pathname, window.location.search));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (route.kind !== "app") {
      return;
    }

    if (view !== route.view) {
      setView(route.view);
    }

    if (route.view === "inbox") {
      if (selectedThreadId !== route.threadId) {
        setSelectedThreadId(route.threadId);
      }
      return;
    }

    if (selectedThreadId !== null) {
      setSelectedThreadId(null);
    }
  }, [route, selectedThreadId, setSelectedThreadId, setView, view]);

  useEffect(() => {
    if (bootstrapping) {
      return;
    }

    if (!isAuthenticated && route.kind !== "auth") {
      navigateToAuth("login", undefined, true);
      return;
    }

    if (isAuthenticated && route.kind === "auth") {
      navigateTo("home", null, true);
    }
  }, [bootstrapping, isAuthenticated, navigateTo, navigateToAuth, route.kind]);

  const handleLogin = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setAuthBusy(true);
      setAuthError(null);
      setAuthNotice(null);

      try {
        await login({ email, password });
        setAuthNotice("Mailbox connected successfully.");
        navigateTo("home", null, true);
      } catch (error) {
        setAuthError(getServiceErrorMessage(error, "Unable to connect mailbox."));
      } finally {
        setAuthBusy(false);
      }
    },
    [login, navigateTo]
  );

  const handleRegister = useCallback(
    async ({ username, email, password }: { username: string; email: string; password: string }) => {
      setAuthBusy(true);
      setAuthError(null);
      setAuthNotice(null);

      try {
        await register({ username, email, password });
        setAuthNotice("Account created successfully.");
        navigateTo("home", null, true);
      } catch (error) {
        setAuthError(getServiceErrorMessage(error, "Unable to create account."));
      } finally {
        setAuthBusy(false);
      }
    },
    [navigateTo, register]
  );

  const handleForgotPassword = useCallback(
    async (email: string) => {
      setAuthBusy(true);
      setAuthError(null);
      setAuthNotice(null);

      try {
        const result = await forgotPassword(email);
        setForgotPasswordResult(result);
        setAuthNotice(result.message);

        if (result.resetToken) {
          navigateToAuth("reset", result.resetToken, true);
        }
      } catch (error) {
        setAuthError(getServiceErrorMessage(error, "Unable to start password reset."));
      } finally {
        setAuthBusy(false);
      }
    },
    [forgotPassword, navigateToAuth]
  );

  const handleResetPassword = useCallback(
    async ({ token, password }: { token: string; password: string }) => {
      setAuthBusy(true);
      setAuthError(null);
      setAuthNotice(null);

      try {
        await completePasswordReset({ token, password });
        setAuthNotice("Password updated. You are signed in now.");
        navigateTo("home", null, true);
      } catch (error) {
        setAuthError(getServiceErrorMessage(error, "Unable to reset password."));
      } finally {
        setAuthBusy(false);
      }
    },
    [completePasswordReset, navigateTo]
  );

  const handleLogout = useCallback(() => {
    logout();
    clearAuthFeedback();
    navigateToAuth("login", undefined, true);
  }, [clearAuthFeedback, logout, navigateToAuth]);

  if (bootstrapping) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100dvh",
            display: "grid",
            placeItems: "center",
            background:
              "radial-gradient(circle at 15% 10%, rgba(94, 231, 255, 0.08), transparent 25%), radial-gradient(circle at 85% 0%, rgba(139, 92, 246, 0.1), transparent 22%), #020816",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              px: 4,
              py: 3,
              borderRadius: 1,
              border: "1px solid rgba(94,231,255,0.14)",
              background: "linear-gradient(180deg, rgba(8, 18, 32, 0.96), rgba(4, 10, 18, 0.98))",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CircularProgress size={26} />
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                Restoring session
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Checking your saved access token.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthPage
          mode={activeAuthMode}
          resetToken={route.kind === "auth" ? route.token : undefined}
          submitting={authBusy}
          error={authError}
          notice={authNotice}
          forgotPasswordResult={forgotPasswordResult}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onForgotPassword={handleForgotPassword}
          onResetPassword={handleResetPassword}
          onNavigate={(mode, token) => {
            clearAuthFeedback();
            navigateToAuth(mode, token);
          }}
          onClearFeedback={clearAuthFeedback}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: "100dvh",
          minHeight: "100dvh",
          background:
            "radial-gradient(circle at 12% 12%, rgba(94,231,255,0.18), transparent 26%), radial-gradient(circle at 88% 10%, rgba(139,92,246,0.16), transparent 22%), radial-gradient(circle at 50% 110%, rgba(56,189,248,0.14), transparent 28%), linear-gradient(180deg, #020816 0%, #050d1a 55%, #020816 100%)",
          color: "text.primary",
          position: "relative",
          overflowX: "hidden",
          overflowY: "hidden",
          display: "flex",
          flexDirection: "column",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,0.7), transparent 92%)",
            pointerEvents: "none",
          },
        }}
      >
        {isCompact ? (
          <Drawer
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            ModalProps={{ keepMounted: true }}
            PaperProps={{
              sx: {
                width: "min(88vw, 320px)",
                background: "transparent",
              },
            }}
          >
            <Box sx={{ p: 1, height: "100%" }}>
                <AgentSidebar
                  isMobile
                  view={view}
                  onNavigate={(nextView) => {
                    navigateTo(nextView);
                    setMobileNavOpen(false);
                  }}
                  onClose={() => setMobileNavOpen(false)}
                  accountName={user?.username || "Authenticated user"}
                  defaultUserEmail={user?.email || DEFAULT_USER_EMAIL}
                  onLogout={handleLogout}
                />
            </Box>
          </Drawer>
        ) : null}

        <Box
          sx={{
            display: "flex",
            flex: 1,
            height: "100%",
            minHeight: 0,
            position: "relative",
            zIndex: 1,
            alignItems: homeView ? "flex-start" : "stretch",
          }}
        >
          {!isCompact ? (
            <Box sx={{ width: 284, flexShrink: 0, p: 1.5 }}>
              <AgentSidebar
                isMobile={false}
                view={view}
                onNavigate={(nextView) => navigateTo(nextView)}
                accountName={user?.username || "Authenticated user"}
                defaultUserEmail={user?.email || DEFAULT_USER_EMAIL}
                onLogout={handleLogout}
              />
            </Box>
          ) : null}

          <Box
            sx={{
              flex: 1,
              height: "100%",
              minWidth: 0,
              p: { xs: 1, md: 1.5 },
              pl: { xs: 1, md: 0 },
              display: "flex",
              minHeight: 0,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, md: 2 },
                flex: 1,
                height: "100%",
                minHeight: 0,
                borderRadius: 1,
                border: inboxView ? "1px solid rgba(94,231,255,0.08)" : "1px solid rgba(94,231,255,0.12)",
                background:
                  inboxView
                    ? "linear-gradient(180deg, rgba(7, 16, 30, 0.98), rgba(4, 10, 18, 0.98))"
                    : "linear-gradient(180deg, rgba(8, 18, 32, 0.95), rgba(4, 10, 18, 0.98))",
                backdropFilter: inboxView ? "none" : "blur(18px)",
                boxShadow: inboxView ? "0 10px 28px rgba(0,0,0,0.18)" : "0 28px 90px rgba(0,0,0,0.34)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                overflowX: "hidden",
                overflowY: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    "linear-gradient(135deg, rgba(94,231,255,0.05), transparent 30%, rgba(139,92,246,0.05) 70%, transparent)",
                },
              }}
            >
              <AgentHeader
                isMobile={isCompact}
                view={view}
                stats={stats}
                loading={loading}
                refreshing={refreshing}
                accountName={user?.username || "Authenticated user"}
                defaultUserEmail={user?.email || DEFAULT_USER_EMAIL}
                onOpenNav={() => setMobileNavOpen(true)}
                onRefresh={() => void loadMailbox({ showSpinner: false })}
                onLogout={handleLogout}
              />

              {statusMessage ? (
                <Alert severity="success" sx={{ mb: 1.25, borderRadius: 1 }} onClose={() => setStatusMessage(null)}>
                  {statusMessage}
                </Alert>
              ) : null}

              {error ? (
                <Alert severity="error" sx={{ mb: 1.25, borderRadius: 1 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              ) : null}

              {refreshing ? <LinearProgress sx={{ mb: 1.25, borderRadius: 999 }} /> : null}

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {view === "home" ? (
                  <HomeView
                    loading={loading}
                    recentThreads={visibleThreads}
                    selectedThreadId={selectedThreadId}
                    stats={stats}
                    onSeedSampleMail={handleSeedSampleMail}
                    onOpenThread={(thread) => {
                      navigateTo("inbox", thread.threadId);
                      if (isCompact) {
                        setMobileThreadOpen(true);
                      }
                    }}
                    onOpenInbox={() => {
                      navigateTo("inbox");
                      setMobileThreadOpen(false);
                    }}
                    onOpenKnowledge={() => navigateTo("knowledge")}
                    onOpenAnalytics={() => navigateTo("analytics")}
                  />
                ) : null}

                {view === "inbox" ? (
                  <InboxView
                    loading={loading}
                    threadLoading={threadLoading}
                    search={search}
                    onSearchChange={setSearch}
                    filteredThreads={filteredThreads}
                    selectedThreadId={selectedThreadId}
                    selectedThread={selectedThread}
                    threadMessages={threadMessages}
                    mobileThreadOpen={mobileThreadOpen}
                    onSelectThread={(thread) => {
                      navigateTo("inbox", thread.threadId);
                      if (isCompact) {
                        setMobileThreadOpen(true);
                      }
                    }}
                    onCloseThread={() => {
                      navigateTo("inbox");
                      setMobileThreadOpen(false);
                    }}
                    onToggleFlag={handleToggleFlag}
                    onDeleteThread={(threadId) => {
                      const shouldClearRoute = selectedThreadId === threadId;
                      handleDeleteThread(threadId);

                      if (shouldClearRoute) {
                        navigateTo("inbox");
                        setMobileThreadOpen(false);
                      }
                    }}
                    onSendThreadMessage={handleSendThreadMessage}
                  />
                ) : null}

                {view === "knowledge" ? (
                  <KnowledgeBaseView
                    items={knowledgeBase}
                    onAddItem={handleAddKnowledge}
                    onDeleteItem={handleDeleteKnowledge}
                  />
                ) : null}

                {view === "analytics" ? <AnalyticsView stats={stats} /> : null}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
