import React from "react";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallbackTitle?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || "Something went wrong.",
    };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    // The app can log this to your backend later if needed.
    // For now we keep the fallback local and visible.
    // eslint-disable-next-line no-console
    console.error("Agent app crashed", error, info);
  }

  reset = () => {
    this.setState({
      hasError: false,
      errorMessage: "",
    });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            p: 2,
            background:
              "radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 28%), linear-gradient(180deg, #08111d 0%, #050b16 100%)",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: "min(640px, 100%)",
              p: 2,
              borderRadius: 2,
              border: "1px solid rgba(148,163,184,0.16)",
              background: "rgba(8, 14, 25, 0.86)",
              backdropFilter: "blur(20px)",
            }}
          >
            <Stack spacing={1.5}>
              <Alert severity="error" sx={{ borderRadius: 1.5 }}>
                {this.props.fallbackTitle || "The AI mail agent hit a problem."}
              </Alert>
              <Typography variant="h5" fontWeight={900}>
                We could not render this screen.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {this.state.errorMessage || "Please try again. If this keeps happening, check the browser console."}
              </Typography>
              <Button variant="contained" onClick={this.reset} sx={{ width: "fit-content" }}>
                Try again
              </Button>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
