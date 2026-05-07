import React, { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  onLogin: (values: { email: string; password: string }) => Promise<void>;
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
    badge: "Sign in",
    title: "Sign in to your AI Mail Agent",
    description: "Use your registered email and app password to access your account and continue managing replies.",
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
  const authInputSx = {
    "& .MuiOutlinedInput-root": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(94,231,255,0.22) !important",
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(94,231,255,0.22) !important",
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(94,231,255,0.22) !important",
      },
      "&.Mui-focused": {
        boxShadow: "none",
      },
    },
    "& .MuiInputBase-input:focus": {
      outline: "none",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "text.secondary",
    },
  };

  const authInputClassName = "auth-input-no-blue";

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
        nextErrors.identifier = "Enter your email address.";
      } else if (!/\S+@\S+\.\S+/.test(identifier.trim())) {
        nextErrors.identifier = "Enter a valid email address.";
      }

      if (!password.trim()) {
        nextErrors.password = "Enter your app password.";
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
        email: identifier.trim().toLowerCase(),
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
        minHeight: "100svh",
        display: "grid",
        alignItems: { xs: "start", lg: "center" },
        justifyItems: "center",
        p: { xs: 1.5, sm: 2.5, md: 3 },
        pb: { xs: "max(24px, env(safe-area-inset-bottom))", md: 3 },
        overflowX: "hidden",
        background:
          "radial-gradient(circle at 10% 15%, rgba(94,231,255,0.18), transparent 24%), radial-gradient(circle at 88% 10%, rgba(139,92,246,0.16), transparent 20%), radial-gradient(circle at 50% 100%, rgba(34,197,94,0.14), transparent 32%), linear-gradient(180deg, #020816 0%, #071322 45%, #020816 100%)",
        "@media (min-width: 481px) and (max-width: 1024px)": {
          alignItems: "start",
          p: 3,
          pb: "max(32px, env(safe-area-inset-bottom))",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: 520, md: 760, lg: 1180 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.05fr) minmax(420px, 0.95fr)" },
          gap: { xs: 1.5, md: 2 },
          alignItems: "stretch",
          "@media (min-width: 481px) and (max-width: 767px)": {
            maxWidth: 620,
            gap: 2,
          },
          "@media (min-width: 768px) and (max-width: 899px)": {
            maxWidth: 720,
            gap: 2.25,
          },
          "@media (min-width: 900px) and (max-width: 1024px)": {
            maxWidth: 980,
            gridTemplateColumns: "minmax(0, 0.92fr) minmax(360px, 1.08fr)",
            gap: 2,
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            order: { xs: 2, lg: 1 },
            p: { xs: 2.25, sm: 3, md: 4 },
            borderRadius: 1,
            border: "1px solid rgba(94,231,255,0.16)",
            background:
              "linear-gradient(160deg, rgba(8, 18, 32, 0.96) 0%, rgba(6, 13, 24, 0.98) 100%)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.34)",
            position: "relative",
            overflow: "hidden",
            "@media (min-width: 481px) and (max-width: 899px)": {
              p: 3,
            },
            "@media (min-width: 900px) and (max-width: 1024px)": {
              order: 1,
              p: 3,
            },
          }}
        >
          <Stack spacing={{ xs: 2, md: 3 }} sx={{ height: "100%", position: "relative", zIndex: 1 }}>
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
                    width: { xs: 42, sm: 48, md: 56 },
                    height: { xs: 42, sm: 48, md: 56 },
                    borderRadius: 1,
                    border: "1px solid rgba(94,231,255,0.25)",
                    boxShadow: "0 10px 30px rgba(94,231,255,0.16)",
                  }}
                />
                <Typography variant="h6" fontWeight={800}>
                  AI Mail Agent
                </Typography>
              </Stack>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "1.85rem", sm: "2.25rem", md: "3rem" },
                  maxWidth: 580,
                  "@media (min-width: 768px) and (max-width: 1024px)": {
                    fontSize: "2.35rem",
                  },
                  "@media (min-width: 900px) and (max-width: 1024px)": {
                    fontSize: "2.15rem",
                  },
                }}
              >
                Connect a mailbox and let the AI agent reply from it.
              </Typography>
              <Typography variant="body1" color="text.secondary" mt={1.5} maxWidth={560}>
                The frontend sends the mailbox email and app password to your Node.js API. The backend validates
                the inbox, stores the linked account, and starts the reply agent for that mailbox.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} useFlexGap flexWrap="wrap">
              <FeaturePill icon={<EmailRoundedIcon />} label="IMAP verification" />
              <FeaturePill icon={<LockRoundedIcon />} label="App password link" />
              <FeaturePill icon={<MarkEmailReadRoundedIcon />} label="AI auto replies" />
            </Stack>

            <Box
              sx={{
                mt: "auto",
                p: { xs: 1.5, sm: 2 },
                borderRadius: 1,
                background: "linear-gradient(135deg, rgba(94,231,255,0.09), rgba(34,197,94,0.08))",
                border: "1px solid rgba(94,231,255,0.12)",
              }}
            >
              <Typography variant="subtitle1" fontWeight={800}>
                What this setup includes
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                React mailbox linking, token storage, MongoDB EmailAccount documents, and per-mailbox reply
                sessions that send from the connected address.
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            order: { xs: 1, lg: 2 },
            p: { xs: 2.25, sm: 3, md: 4 },
            borderRadius: 1,
            border: "1px solid rgba(94,231,255,0.14)",
            background:
              "linear-gradient(180deg, rgba(8, 18, 32, 0.96) 0%, rgba(4, 10, 18, 0.98) 100%)",
            boxShadow: "0 28px 90px rgba(0,0,0,0.34)",
            "@media (min-width: 481px) and (max-width: 899px)": {
              p: 3,
            },
            "@media (min-width: 900px) and (max-width: 1024px)": {
              order: 2,
              p: 3,
            },
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
                    className={authInputClassName}
                    label="Email address"
                    type="email"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    error={Boolean(validationErrors.identifier)}
                    helperText={validationErrors.identifier}
                    autoComplete="email"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={authInputSx}
                  />
                ) : null}

                {mode === "register" ? (
                  <TextField
                    className={authInputClassName}
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
                    sx={authInputSx}
                  />
                ) : null}

                {mode === "register" || mode === "forgot" ? (
                  <TextField
                    className={authInputClassName}
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
                    sx={authInputSx}
                  />
                ) : null}

                {mode === "reset" ? (
                  <TextField
                    className={authInputClassName}
                    label="Reset token"
                    value={manualToken}
                    onChange={(event) => setManualToken(event.target.value)}
                    error={Boolean(validationErrors.token)}
                    helperText={validationErrors.token || "Paste the token if you are not using the reset link."}
                    sx={authInputSx}
                  />
                ) : null}

                {mode !== "forgot" ? (
                  <TextField
                    className={authInputClassName}
                    label={mode === "login" ? "App password" : "Password"}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    error={Boolean(validationErrors.password)}
                    helperText={
                      validationErrors.password ||
                      (mode === "login" ? "Use a Gmail/Yahoo app password, not the normal mailbox password." : "")
                    }
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
                    sx={authInputSx}
                  />
                ) : null}

                {mode === "register" || mode === "reset" ? (
                  <TextField
                    className={authInputClassName}
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
                    sx={authInputSx}
                  />
                ) : null}

                <Button type="submit" size="large" variant="contained" disabled={submitting} sx={{ py: 1.3 }}>
                  {submitting ? (
                    <span className="ai-button-loader" aria-label="Loading">
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : (
                    copy.primaryAction
                  )}
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
