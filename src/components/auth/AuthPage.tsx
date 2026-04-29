import React, { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import { PasswordResetRequestResponse } from "../../services/authService";
import logo from "../../assets/ai-mail-agent-logo.svg";

export type AuthMode = "login" | "register" | "forgot" | "reset";

type Props = {
  mode: AuthMode;
  resetToken?: string;
  submitting: boolean;
  error: string | null;
  notice: string | null;
  forgotPasswordResult: PasswordResetRequestResponse | null;
  onLogin: (values: { identifier: string; password: string }) => Promise<void>;
  onRegister: (values: { username: string; email: string; password: string }) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  onResetPassword: (values: { token: string; password: string }) => Promise<void>;
  onNavigate: (mode: AuthMode, token?: string) => void;
  onClearFeedback: () => void;
};

type ValidationErrors = {
  identifier?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  token?: string;
};

function getModeCopy(mode: AuthMode) {
  if (mode === "register") {
    return {
      badge: "Create account",
      title: "Connect your mailbox brain",
      description: "Create a user in MongoDB and unlock the AI mail dashboard for that account.",
      primaryAction: "Create account",
    };
  }

  if (mode === "forgot") {
    return {
      badge: "Forgot password",
      title: "Recover access safely",
      description: "Enter your email and the backend will generate a reset token stored against your MongoDB user.",
      primaryAction: "Send reset link",
    };
  }

  if (mode === "reset") {
    return {
      badge: "Reset password",
      title: "Choose a new password",
      description: "Use the reset token from the backend response or your email link to finish the password reset.",
      primaryAction: "Update password",
    };
  }

  return {
    badge: "Welcome back",
    title: "Sign in to your AI mail workspace",
    description: "Use your username or email with your password to access the protected mailbox dashboard.",
    primaryAction: "Sign in",
  };
}

export function AuthPage({
  mode,
  resetToken = "",
  submitting,
  error,
  notice,
  forgotPasswordResult,
  onLogin,
  onRegister,
  onForgotPassword,
  onResetPassword,
  onNavigate,
  onClearFeedback,
}: Props) {
  const copy = useMemo(() => getModeCopy(mode), [mode]);
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [manualToken, setManualToken] = useState(resetToken);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    setValidationErrors({});
    setPassword("");
    setConfirmPassword("");
    setManualToken(resetToken);
  }, [mode, resetToken]);

  const validate = () => {
    const nextErrors: ValidationErrors = {};

    if (mode === "login") {
      if (!identifier.trim()) {
        nextErrors.identifier = "Enter your email or username.";
      }

      if (!password.trim()) {
        nextErrors.password = "Enter your password.";
      }
    }

    if (mode === "register") {
      if (!username.trim()) {
        nextErrors.username = "Choose a username.";
      }

      if (!email.trim()) {
        nextErrors.email = "Enter your email address.";
      } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
        nextErrors.email = "Enter a valid email address.";
      }

      if (password.length < 6) {
        nextErrors.password = "Password must be at least 6 characters.";
      }

      if (confirmPassword !== password) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    if (mode === "forgot") {
      if (!email.trim()) {
        nextErrors.email = "Enter your email address.";
      } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
        nextErrors.email = "Enter a valid email address.";
      }
    }

    if (mode === "reset") {
      if (!(manualToken || resetToken).trim()) {
        nextErrors.token = "Paste the reset token.";
      }

      if (password.length < 6) {
        nextErrors.password = "Password must be at least 6 characters.";
      }

      if (confirmPassword !== password) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onClearFeedback();

    if (mode === "login") {
      await onLogin({
        identifier: identifier.trim(),
        password,
      });
      return;
    }

    if (mode === "register") {
      await onRegister({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      return;
    }

    if (mode === "forgot") {
      await onForgotPassword(email.trim().toLowerCase());
      return;
    }

    await onResetPassword({
      token: (manualToken || resetToken).trim(),
      password,
    });
  };

  const helperResetLink = forgotPasswordResult?.resetToken ?? resetToken;

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        p: { xs: 2, md: 3 },
        background:
          "radial-gradient(circle at 10% 15%, rgba(94,231,255,0.18), transparent 24%), radial-gradient(circle at 88% 10%, rgba(139,92,246,0.16), transparent 20%), radial-gradient(circle at 50% 100%, rgba(34,197,94,0.14), transparent 32%), linear-gradient(180deg, #020816 0%, #071322 45%, #020816 100%)",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1180,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.05fr) minmax(420px, 0.95fr)" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 1,
            border: "1px solid rgba(94,231,255,0.16)",
            background:
              "linear-gradient(160deg, rgba(8, 18, 32, 0.96) 0%, rgba(6, 13, 24, 0.98) 100%)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.34)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Stack spacing={3} sx={{ height: "100%", position: "relative", zIndex: 1 }}>
            <Box>
              <Chip
                label="AI Mail Agent"
                sx={{
                  mb: 2,
                  bgcolor: "rgba(94,231,255,0.12)",
                  color: "primary.main",
                  border: "1px solid rgba(94,231,255,0.18)",
                }}
              />
              <Stack direction="row" spacing={1.25} alignItems="center" mb={2}>
                <Box
                  component="img"
                  src={logo}
                  alt="AI Mail Agent"
                  sx={{
                    width: { xs: 46, md: 56 },
                    height: { xs: 46, md: 56 },
                    borderRadius: 1,
                    border: "1px solid rgba(94,231,255,0.25)",
                    boxShadow: "0 10px 30px rgba(94,231,255,0.16)",
                  }}
                />
                <Typography variant="h6" fontWeight={800}>
                  AI Mail Agent
                </Typography>
              </Stack>
              <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "3rem" }, maxWidth: 580 }}>
                Login, mailbox sync, and password recovery in one flow.
              </Typography>
              <Typography variant="body1" color="text.secondary" mt={1.5} maxWidth={560}>
                The frontend talks to a protected Node.js API, user data is stored in MongoDB, and mailbox
                routes unlock only after a valid JWT session is present.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} useFlexGap flexWrap="wrap">
              <FeaturePill icon={<PersonRoundedIcon />} label="Username + email sign-in" />
              <FeaturePill icon={<LockRoundedIcon />} label="Hashed passwords" />
              <FeaturePill icon={<MarkEmailReadRoundedIcon />} label="Forgot / reset password" />
            </Stack>

            <Box
              sx={{
                mt: "auto",
                p: 2,
                borderRadius: 1,
                background: "linear-gradient(135deg, rgba(94,231,255,0.09), rgba(34,197,94,0.08))",
                border: "1px solid rgba(94,231,255,0.12)",
              }}
            >
              <Typography variant="subtitle1" fontWeight={800}>
                What this setup includes
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                React auth screens, JWT token storage, MongoDB user documents, protected email APIs, and a
                development-friendly reset token flow.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 1,
            border: "1px solid rgba(94,231,255,0.14)",
            background:
              "linear-gradient(180deg, rgba(8, 18, 32, 0.96) 0%, rgba(4, 10, 18, 0.98) 100%)",
            boxShadow: "0 28px 90px rgba(0,0,0,0.34)",
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Chip
                label={copy.badge}
                sx={{
                  mb: 2,
                  bgcolor: "rgba(139,92,246,0.14)",
                  color: "secondary.light",
                }}
              />
              <Typography variant="h4" fontWeight={900}>
                {copy.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {copy.description}
              </Typography>
            </Box>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {notice ? <Alert severity="success">{notice}</Alert> : null}

            {forgotPasswordResult?.resetUrl ? (
              <Alert
                severity="info"
                action={
                  <Button color="inherit" size="small" onClick={() => onNavigate("reset", helperResetLink || undefined)}>
                    Reset now
                  </Button>
                }
              >
                Development reset link generated for {email || "your account"}.
              </Alert>
            ) : null}

            <Box component="form" onSubmit={(event) => void handleSubmit(event)}>
              <Stack spacing={2}>
                {mode === "login" ? (
                  <TextField
                    label="Email or username"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    error={Boolean(validationErrors.identifier)}
                    helperText={validationErrors.identifier}
                    autoComplete="username"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                ) : null}

                {mode === "register" ? (
                  <TextField
                    label="Username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    error={Boolean(validationErrors.username)}
                    helperText={validationErrors.username}
                    autoComplete="username"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                ) : null}

                {mode === "register" || mode === "forgot" ? (
                  <TextField
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    error={Boolean(validationErrors.email)}
                    helperText={validationErrors.email}
                    autoComplete="email"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                ) : null}

                {mode === "reset" ? (
                  <TextField
                    label="Reset token"
                    value={manualToken}
                    onChange={(event) => setManualToken(event.target.value)}
                    error={Boolean(validationErrors.token)}
                    helperText={validationErrors.token || "Paste the token if you are not using the reset link."}
                  />
                ) : null}

                {mode !== "forgot" ? (
                  <TextField
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={Boolean(validationErrors.password)}
                    helperText={validationErrors.password}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword((current) => !current)} edge="end" aria-label="Toggle password visibility">
                            {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                ) : null}

                {mode === "register" || mode === "reset" ? (
                  <TextField
                    label="Confirm password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    error={Boolean(validationErrors.confirmPassword)}
                    helperText={validationErrors.confirmPassword}
                    autoComplete="new-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword((current) => !current)} edge="end" aria-label="Toggle confirm password visibility">
                            {showConfirmPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                ) : null}

                <Button type="submit" size="large" variant="contained" disabled={submitting} sx={{ py: 1.3 }}>
                  {submitting ? "Please wait..." : copy.primaryAction}
                </Button>
              </Stack>
            </Box>

            <Divider flexItem />

            <Stack spacing={1}>
              {mode !== "login" ? (
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{" "}
                  <Link component="button" type="button" underline="hover" onClick={() => onNavigate("login")}>
                    Sign in
                  </Link>
                </Typography>
              ) : null}

              {mode !== "register" ? (
                <Typography variant="body2" color="text.secondary">
                  Need a new account?{" "}
                  <Link component="button" type="button" underline="hover" onClick={() => onNavigate("register")}>
                    Create one
                  </Link>
                </Typography>
              ) : null}

              {mode !== "forgot" ? (
                <Typography variant="body2" color="text.secondary">
                  Forgot your password?{" "}
                  <Link component="button" type="button" underline="hover" onClick={() => onNavigate("forgot")}>
                    Reset it
                  </Link>
                </Typography>
              ) : null}

              {mode === "reset" ? (
                <Typography variant="body2" color="text.secondary">
                  Want to go back?{" "}
                  <Link component="button" type="button" underline="hover" onClick={() => onNavigate("login")}>
                    Return to login
                  </Link>
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

function FeaturePill({ icon, label }: { icon: React.ReactElement; label: string }) {
  return (
    <Chip
      icon={icon}
      label={label}
      sx={{
        px: 0.5,
        bgcolor: "rgba(94,231,255,0.08)",
        color: "text.primary",
        border: "1px solid rgba(94,231,255,0.12)",
      }}
    />
  );
}
