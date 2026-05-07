import React, { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Popover,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DraftsRoundedIcon from "@mui/icons-material/DraftsRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import ForwardRoundedIcon from "@mui/icons-material/ForwardRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { generateAiReplyDraft, KnowledgeSnippet, MailItem, MailThread } from "../../services/mailService";
import logo from "../../assets/ai-mail-agent-logo.svg";

export type ThreadSummary = MailThread & {
  flagged: boolean;
};

export type ViewKey = "home" | "inbox" | "knowledge" | "analytics";

export type AgentStats = {
  inboundCount: number;
  outboundCount: number;
  unreadCount: number;
  autoReplyCount: number;
  pendingCount: number;
  avgReplyMinutes: number;
  knowledgeCount: number;
  replyRate: number;
};

function BrandMark({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
      <Avatar
        sx={{
          width: compact ? 42 : 50,
          height: compact ? 42 : 50,
          background: "rgba(5, 16, 29, 0.96)",
          border: "1px solid rgba(94,231,255,0.24)",
          boxShadow: "0 10px 24px rgba(94,231,255,0.12)",
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="AI Mail Agent logo"
          sx={{
            width: compact ? 30 : 34,
            height: compact ? 30 : 34,
            borderRadius: 1,
            objectFit: "cover",
          }}
        />
      </Avatar>
      <Box minWidth={0}>
        <Typography variant={compact ? "subtitle1" : "h6"} fontWeight={900} noWrap>
          AI Mail Agent
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          Business email copilot
        </Typography>
      </Box>
    </Stack>
  );
}

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();

  if (!source) {
    return "U";
  }

  const words = source.split(/[.\s@_-]+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
  return initials || "U";
}

export const panelStyle = {
  p: { xs: 1.5, md: 2 },
  borderRadius: 1,
  border: "1px solid rgba(94,231,255,0.12)",
  background: "linear-gradient(180deg, rgba(10, 20, 35, 0.98), rgba(4, 10, 18, 0.98))",
  boxShadow: "0 20px 70px rgba(0,0,0,0.26)",
};

export function AgentSidebar({
  isMobile,
  view,
  onNavigate,
  onClose,
  accountName,
  defaultUserEmail,
  onLogout,
}: {
  isMobile: boolean;
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onClose?: () => void;
  accountName: string;
  defaultUserEmail: string;
  onLogout: () => void;
}) {
  const navItems: Array<{ key: ViewKey; label: string; icon: React.ReactNode }> = [
    { key: "home", label: "Home", icon: <HomeRoundedIcon /> },
    { key: "inbox", label: "Inbox", icon: <InboxRoundedIcon /> },
    { key: "knowledge", label: "Knowledge Base", icon: <LightbulbRoundedIcon /> },
    { key: "analytics", label: "Analytics", icon: <AnalyticsRoundedIcon /> },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 2,
        borderRadius: 1,
        border: "1px solid rgba(94,231,255,0.12)",
        background: "linear-gradient(180deg, rgba(7, 16, 30, 0.98), rgba(4, 10, 18, 0.98))",
        backdropFilter: "blur(18px)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box>
        <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between">
          <BrandMark />

          {isMobile ? (
            <IconButton onClick={onClose} aria-label="Close navigation">
              <CloseRoundedIcon />
            </IconButton>
          ) : null}
        </Stack>
      </Box>

      <Box>
        <Typography variant="overline" color="text.secondary" letterSpacing={2}>
          Navigation
        </Typography>
        <Stack spacing={1} mt={1.25}>
          {navItems.map((item) => (
            <Button
              key={item.key}
              fullWidth
              onClick={() => onNavigate(item.key)}
              startIcon={item.icon}
              variant={view === item.key ? "contained" : "text"}
              sx={{
                justifyContent: "flex-start",
                py: 1.05,
                px: 1.5,
                textTransform: "none",
                borderRadius: 1,
                bgcolor: view === item.key ? "rgba(94,231,255,0.12)" : "transparent",
                color: "text.primary",
                border: view === item.key ? "1px solid rgba(94,231,255,0.22)" : "1px solid transparent",
                "&:hover": {
                  bgcolor: "rgba(94,231,255,0.08)",
                  borderColor: "rgba(94,231,255,0.18)",
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Stack>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 1,
          background: "linear-gradient(135deg, rgba(94,231,255,0.12), rgba(139,92,246,0.1))",
          border: "1px solid rgba(94,231,255,0.12)",
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          Agent Brain
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Incoming messages are scanned, knowledge is applied, and replies are generated
          automatically.
        </Typography>
      </Paper>

      <Box sx={{ mt: "auto" }} />
    </Paper>
  );
}

export function AgentHeader({
  isMobile,
  view,
  stats,
  loading,
  refreshing,
  accountName,
  defaultUserEmail,
  onOpenNav,
  onRefresh,
  onLogout,
}: {
  isMobile: boolean;
  view: ViewKey;
  stats: AgentStats;
  loading: boolean;
  refreshing: boolean;
  accountName: string;
  defaultUserEmail: string;
  onOpenNav: () => void;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  const title =
    view === "home" ? "Home" : view === "inbox" ? "Inbox" : view === "knowledge" ? "Knowledge Base" : "Analytics";
  const initials = getInitials(accountName, defaultUserEmail);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);
  const profileOpen = Boolean(profileAnchor);

  const openProfile = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchor(event.currentTarget);
  };

  const closeProfile = () => {
    setProfileAnchor(null);
  };

  const handleLogoutClick = () => {
    closeProfile();
    onLogout();
  };

  const profileButton = (
    <IconButton
      onClick={openProfile}
      aria-label="Open profile"
      aria-haspopup="dialog"
      aria-expanded={profileOpen ? "true" : undefined}
      sx={{
        p: 0.35,
        borderRadius: 999,
        border: "1px solid transparent",
        bgcolor: "transparent",
        "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
      }}
    >
      <Avatar
        sx={{
          width: { xs: 34, md: 38 },
          height: { xs: 34, md: 38 },
          fontSize: { xs: "0.78rem", md: "0.85rem" },
          bgcolor: "rgba(255,255,255,0.07)",
          color: "text.primary",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {initials}
      </Avatar>
    </IconButton>
  );

  return (
    <Stack spacing={1.25} mb={1.5}>
      {isMobile ? (
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} width="100%">
          <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
            <IconButton
              onClick={onOpenNav}
              aria-label="Open navigation"
              sx={{
                borderRadius: 1,
                border: "1px solid rgba(94,231,255,0.12)",
                bgcolor: "rgba(94,231,255,0.06)",
              }}
              >
                <MenuRoundedIcon />
              </IconButton>
            <BrandMark compact />
          </Stack>

          {profileButton}
        </Stack>
      ) : (
        <Box
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box minWidth={0} sx={{ width: "100%" }}>
            <Typography variant="h4" fontWeight={900}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              The agent replies automatically, learns from your knowledge base, and tracks performance.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
            sx={{ justifySelf: { md: "end" } }}
          >
            <Button
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              onClick={onRefresh}
              disabled={refreshing || loading}
              sx={{ borderRadius: 999, px: 2, width: { xs: "100%", sm: "auto" } }}
            >
              Sync
            </Button>
            {profileButton}
          </Stack>
        </Box>
      )}

      <Popover
        open={profileOpen}
        anchorEl={profileAnchor}
        onClose={closeProfile}
        disableScrollLock
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            width: 280,
            maxWidth: "calc(100vw - 24px)",
            p: 1.5,
            borderRadius: 1,
            border: "1px solid rgba(94,231,255,0.16)",
            bgcolor: "rgba(7, 16, 30, 0.98)",
            backgroundImage: "linear-gradient(180deg, rgba(8, 18, 32, 0.98), rgba(4, 10, 18, 0.98))",
            boxShadow: "0 22px 70px rgba(0,0,0,0.36)",
          },
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: "rgba(94,231,255,0.14)",
                color: "primary.main",
                border: "1px solid rgba(94,231,255,0.22)",
              }}
            >
              {initials}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="subtitle1" fontWeight={900} noWrap>
                {accountName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {defaultUserEmail}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ borderColor: "rgba(94,231,255,0.12)" }} />

          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            startIcon={<LogoutRoundedIcon />}
            onClick={handleLogoutClick}
            sx={{ justifyContent: "flex-start", borderRadius: 1 }}
          >
            Log out
          </Button>
        </Stack>
      </Popover>
    </Stack>
  );
}

export function HomeView({
  loading,
  recentThreads,
  selectedThreadId,
  stats,
  onOpenThread,
  onOpenInbox,
  onOpenKnowledge,
  onOpenAnalytics,
  onSeedSampleMail,
}: {
  loading: boolean;
  recentThreads: ThreadSummary[];
  selectedThreadId: string | null;
  stats: AgentStats;
  onOpenThread: (thread: ThreadSummary) => void;
  onOpenInbox: () => void;
  onOpenKnowledge: () => void;
  onOpenAnalytics: () => void;
  onSeedSampleMail: () => void;
}) {
  return (
    <Stack spacing={1.75} sx={{ height: "100%", minHeight: 0, overflow: "hidden" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 1.25 }}>
        <MetricCard icon={<InboxRoundedIcon />} title="Inbound" value={stats.inboundCount} accent="rgba(94,231,255,0.18)" />
        <MetricCard icon={<ReplyRoundedIcon />} title="Auto replies" value={stats.autoReplyCount} accent="rgba(34,197,94,0.18)" />
        <MetricCard icon={<AnalyticsRoundedIcon />} title="Reply rate" value={`${Math.round(stats.replyRate * 100)}%`} accent="rgba(139,92,246,0.18)" />
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.2fr) minmax(320px, 0.8fr)" },
            gap: 2,
            alignItems: "start",
            height: "100%",
            minHeight: 0,
          }}
        >
          <Paper sx={{ ...panelStyle, width: "100%", minWidth: 0, height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
          mb={1.25}
        >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Recent threads
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The latest incoming mail and auto-generated responses.
              </Typography>
            </Box>
            <Chip icon={<TrendingUpRoundedIcon />} label="Live" color="primary" sx={{ flexShrink: 0 }} />
          </Stack>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              pr: 0.5,
              pb: { xs: "max(16px, env(safe-area-inset-bottom))", sm: 2 },
              scrollbarGutter: "stable",
              overscrollBehaviorY: "contain",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {loading ? (
              <Stack spacing={1.25}>
                <Skeleton variant="rounded" height={86} />
                <Skeleton variant="rounded" height={86} />
                <Skeleton variant="rounded" height={86} />
              </Stack>
            ) : recentThreads.length === 0 ? (
              <EmptyState
                icon={<MailOutlineRoundedIcon fontSize="large" />}
                title="No messages yet"
                description="As soon as mail arrives, the agent will answer and track the thread."
              />
            ) : (
              <Stack spacing={1.25}>
                {recentThreads.slice(0, 4).map((thread) => (
                  <MailPreview
                    key={thread.threadId}
                    thread={thread}
                    active={selectedThreadId === thread.threadId}
                    onClick={() => onOpenThread(thread)}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Paper>

          <Paper
            sx={{
              ...panelStyle,
              width: "100%",
              minWidth: 0,
              height: "100%",
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
          <Typography variant="h6" fontWeight={800} mb={1.25}>
            Quick access
          </Typography>
          <Stack spacing={1.25} className="hide-scrollbar" sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 0.25 }}>
            <ActionCard
              icon={<InboxRoundedIcon />}
              title="Inbox"
              description="Review incoming messages and the AI replies."
              actionLabel="Open inbox"
              onAction={onOpenInbox}
            />
            <ActionCard
              icon={<LightbulbRoundedIcon />}
              title="Knowledge base"
              description="Add snippets the agent can use when answering mail."
              actionLabel="Open knowledge"
              onAction={onOpenKnowledge}
            />
            <ActionCard
              icon={<AnalyticsRoundedIcon />}
              title="Analytics"
              description="Measure response speed, reply rate, and pending items."
              actionLabel="Open analytics"
              onAction={onOpenAnalytics}
            />
            <ActionCard
              icon={<AddRoundedIcon />}
              title="Simulate inbound mail"
              description="Create a sample customer mail so the backend auto-replies instantly."
              actionLabel="Create sample"
              onAction={onSeedSampleMail}
            />
          </Stack>
        </Paper>
        </Box>
      </Box>
    </Stack>
  );
}

export function InboxView({
  loading,
  threadLoading,
  search,
  onSearchChange,
  filteredThreads,
  selectedThreadId,
  selectedThread,
  threadMessages,
  mobileThreadOpen,
  onSelectThread,
  onCloseThread,
  onToggleFlag,
  onDeleteThread,
  onSendThreadMessage,
}: {
  loading: boolean;
  threadLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filteredThreads: ThreadSummary[];
  selectedThreadId: string | null;
  selectedThread: ThreadSummary | null;
  threadMessages: MailItem[];
  mobileThreadOpen: boolean;
  onSelectThread: (thread: ThreadSummary) => void;
  onCloseThread: () => void;
  onToggleFlag: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onSendThreadMessage: (message: { threadId: string; receiver: string; subject: string; content: string }) => Promise<void>;
}) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("lg"));
  const inboxPanelStyle = {
    ...panelStyle,
    background: "linear-gradient(180deg, rgba(8, 18, 32, 0.96), rgba(4, 10, 18, 0.96))",
    border: "1px solid rgba(94,231,255,0.08)",
    boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
  };
  const [composeMode, setComposeMode] = useState<"reply" | "forward" | null>(null);
  const [draftRecipient, setDraftRecipient] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const replyCount = threadMessages.filter((message) => message.isInbound === 0).length;
  const replyLabel = `${replyCount} repl${replyCount === 1 ? "y" : "ies"}`;
  const renderedThreads = filteredThreads.filter((thread) => {
    const hasVisibleText = [thread.from, thread.subject, thread.preview].some((value) => value.trim().length > 0);
    return hasVisibleText;
  });
  const subjectBase = selectedThread?.subject || "No subject";
  const latestInbound = [...threadMessages].reverse().find((message) => message.isInbound === 1) ?? threadMessages[0] ?? null;

  useEffect(() => {
    if (!selectedThread) {
      setComposeMode(null);
      setDraftRecipient("");
      setDraftSubject("");
      setDraftBody("");
      setDraftLoading(false);
      return;
    }

    if (composeMode === "reply") {
      const recipient = latestInbound?.from || selectedThread.from;
      const replySubject = subjectBase.startsWith("Re:") ? subjectBase : `Re: ${subjectBase}`;
      const fallbackBody = `Hi ${recipient},\n\nThanks for your message. We are reviewing it and will reply shortly.\n\nBest,\n${selectedThread.to}`;
      let isActive = true;

      setDraftRecipient(recipient);
      setDraftSubject(replySubject);
      setDraftBody(fallbackBody);
      setDraftLoading(true);

      void (async () => {
        try {
          const draft = await generateAiReplyDraft({
            threadId: selectedThread.threadId,
            subject: selectedThread.subject,
            sender: latestInbound?.from || selectedThread.from,
            recipient,
            latestMessage: latestInbound?.body || selectedThread.latestMessage.body || "",
            messages: threadMessages.map((message) => ({
              from: message.from,
              to: message.to,
              subject: message.subject,
              body: message.body,
              isInbound: message.isInbound,
              createdAt: message.createdAt,
            })),
          });

          if (isActive) {
            setDraftBody(draft);
          }
        } catch {
          if (isActive) {
            setDraftBody(fallbackBody);
          }
        } finally {
          if (isActive) {
            setDraftLoading(false);
          }
        }
      })();

      return () => {
        isActive = false;
      };
    }

    if (composeMode === "forward") {
      setDraftLoading(false);
      setDraftRecipient("");
      setDraftSubject(subjectBase.startsWith("Fwd:") ? subjectBase : `Fwd: ${subjectBase}`);
      const quotedThread = threadMessages
        .map((message) => `${message.isInbound === 1 ? "From" : "Reply"}: ${message.from}\nDate: ${formatDate(message.createdAt)}\n\n${message.body}`)
        .join("\n\n---\n\n");
      setDraftBody(`Forwarding thread for review.\n\n${quotedThread}`);
    }
  }, [composeMode, selectedThread, latestInbound, subjectBase, threadMessages]);

  useEffect(() => {
    if (!composeMode) {
      return;
    }

    const id = window.requestAnimationFrame(() => {
      threadScrollRef.current?.scrollTo({
        top: threadScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(id);
  }, [composeMode, selectedThread?.threadId]);

  const renderEmailBody = (body: string) => {
    const lines = body.replace(/\r\n/g, "\n").split("\n");
    const blocks: Array<{ type: "text" | "quote"; lines: string[] }> = [];
    let current: { type: "text" | "quote"; lines: string[] } | null = null;

    const pushCurrent = () => {
      if (current && current.lines.length > 0) {
        blocks.push(current);
      }
      current = null;
    };

    for (const rawLine of lines) {
      const isQuote = /^\s*>/.test(rawLine);
      const cleanLine = isQuote ? rawLine.replace(/^\s*>+\s?/, "") : rawLine;

      if (!current || current.type !== (isQuote ? "quote" : "text")) {
        pushCurrent();
        current = { type: isQuote ? "quote" : "text", lines: [] };
      }

      current.lines.push(cleanLine);
    }

    pushCurrent();

    return blocks.map((block, index) => {
      const content = block.lines.join("\n");

      if (block.type === "quote") {
        return (
          <Box
            key={`quote-${index}`}
            sx={{
              mt: index === 0 ? 0 : 1.5,
              p: 1.5,
              borderRadius: 1,
              borderLeft: "3px solid rgba(94,231,255,0.6)",
              background: "rgba(94,231,255,0.05)",
              color: "text.secondary",
              whiteSpace: "pre-wrap",
              lineHeight: 1.7,
            }}
          >
            {content}
          </Box>
        );
      }

      return (
        <Typography
          key={`text-${index}`}
          variant="body2"
          sx={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.8,
            mt: index === 0 ? 0 : 1.25,
          }}
        >
          {content}
        </Typography>
      );
    });
  };

  const handleStartReply = () => setComposeMode("reply");
  const handleStartForward = () => setComposeMode("forward");
  const handleCancelCompose = () => {
    setDraftLoading(false);
    setComposeMode(null);
  };
  const handleSendCompose = async () => {
    if (!selectedThread || draftLoading || !draftRecipient.trim() || !draftSubject.trim() || !draftBody.trim()) {
      return;
    }

    await onSendThreadMessage({
      threadId: selectedThread.threadId,
      receiver: draftRecipient.trim(),
      subject: draftSubject.trim(),
      content: draftBody.trim(),
    });

    setComposeMode(null);
  };

  const handleCloseThread = () => {
    setDraftLoading(false);
    setComposeMode(null);
    onCloseThread();
  };

  const threadPanel = (showCloseButton: boolean) => (
    <Stack spacing={2} sx={{ flex: 1, height: "100%", minHeight: 0, overflow: "visible" }}>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={900}>
              {selectedThread?.subject}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              From {selectedThread?.from} to {selectedThread?.to || "you@company.com"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
            {showCloseButton ? (
              <IconButton
                onClick={handleCloseThread}
                aria-label="Close conversation"
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: 1,
                  border: "1px solid rgba(94,231,255,0.12)",
                }}
              >
                <CloseRoundedIcon />
              </IconButton>
            ) : null}
            <Chip
              icon={<InboxRoundedIcon />}
              label={`${selectedThread?.messageCount ?? 0} messages`}
              sx={{ bgcolor: "rgba(94,231,255,0.08)" }}
            />
            <Chip
              icon={<FlagRoundedIcon />}
              label={selectedThread?.flagged ? "Flagged" : "Not flagged"}
              color={selectedThread?.flagged ? "warning" : "default"}
              variant={selectedThread?.flagged ? "filled" : "outlined"}
            />
          </Stack>
        </Stack>
      </Box>

      <Divider sx={{ borderColor: "rgba(94,231,255,0.12)" }} />

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="contained" startIcon={<ReplyRoundedIcon />} onClick={handleStartReply}>
          Reply
        </Button>
        <Button variant="outlined" startIcon={<ForwardRoundedIcon />} onClick={handleStartForward}>
          Forward
        </Button>
        <Button
          variant={selectedThread?.flagged ? "contained" : "outlined"}
          color="warning"
          startIcon={<FlagRoundedIcon />}
          onClick={() => selectedThread && onToggleFlag(selectedThread.threadId)}
        >
          {selectedThread?.flagged ? "Unflag" : "Flag"}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlineRoundedIcon />}
          onClick={() => selectedThread && onDeleteThread(selectedThread.threadId)}
        >
          Delete
        </Button>
      </Stack>

      {threadLoading ? (
        <Stack spacing={1}>
          <Skeleton variant="rounded" height={104} />
          <Skeleton variant="rounded" height={104} />
        </Stack>
      ) : (
        <Box
          ref={threadScrollRef}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            pr: 0.5,
            pb: { xs: "max(16px, env(safe-area-inset-bottom))", sm: 2 },
            scrollbarGutter: "stable",
            overscrollBehaviorY: "contain",
            WebkitOverflowScrolling: "touch",
            contain: "paint",
          }}
        >
          <Stack spacing={1.25}>
            {threadMessages.length > 0 ? (
              threadMessages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    alignSelf: message.isInbound === 1 ? "flex-start" : "flex-end",
                    maxWidth: "min(92%, 680px)",
                    p: 1.5,
                    borderRadius: 1,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.8,
                    border: "1px solid rgba(94,231,255,0.12)",
                    background: message.isInbound === 1 ? "rgba(255,255,255,0.02)" : "rgba(94,231,255,0.06)",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={2} mb={1}>
                    <Typography variant="subtitle2" fontWeight={800}>
                      {message.isInbound === 1 ? message.from : "AI Agent"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(message.createdAt)}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    To {message.to}
                  </Typography>
                  {message.cc && message.cc.length > 0 ? (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Cc {message.cc.join(", ")}
                    </Typography>
                  ) : null}
                {message.bcc && message.bcc.length > 0 ? (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Bcc {message.bcc.join(", ")}
                  </Typography>
                ) : null}
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {message.subject}
                </Typography>
                <Box>{renderEmailBody(message.body)}</Box>
                </Box>
              ))
            ) : (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(94,231,255,0.12)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.8,
                }}
              >
                {selectedThread?.latestMessage.body ? renderEmailBody(selectedThread.latestMessage.body) : null}
              </Box>
            )}

            {composeMode ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: "1px solid rgba(94,231,255,0.14)",
                  bgcolor: "rgba(94,231,255,0.03)",
                  scrollMarginBottom: 24,
                }}
              >
                <Stack spacing={1.25}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    {composeMode === "reply" ? "Reply draft" : "Forward draft"}
                  </Typography>
                  <TextField
                    label="Recipient"
                    value={draftRecipient}
                    onChange={(event) => setDraftRecipient(event.target.value)}
                    fullWidth
                    disabled={composeMode === "reply"}
                    helperText={composeMode === "reply" ? "Replies go back to the original sender." : "Forward the thread to any address."}
                  />
                  <TextField
                    label="Subject"
                    value={draftSubject}
                    onChange={(event) => setDraftSubject(event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Message"
                    value={draftBody}
                    onChange={(event) => setDraftBody(event.target.value)}
                    fullWidth
                    multiline
                    minRows={isCompact ? 6 : 8}
                    disabled={draftLoading}
                    helperText={draftLoading ? "AI is generating a reply draft..." : undefined}
                  />
                  <Stack direction="row" spacing={0.75}>
                    <Button variant="contained" startIcon={<SendRoundedIcon />} onClick={() => void handleSendCompose()} disabled={draftLoading}>
                      Send
                    </Button>
                    <Button variant="outlined" onClick={handleCancelCompose}>
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ) : null}
          </Stack>
        </Box>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label={selectedThread?.latestMessage.isInbound === 1 ? "Inbound mail" : "Outbound mail"} variant="outlined" />
        <Chip label={selectedThread ? formatDate(selectedThread.createdAt) : ""} variant="outlined" />
        <Chip label={replyLabel} variant="outlined" />
      </Stack>

      <Divider sx={{ borderColor: "rgba(94,231,255,0.12)" }} />
    </Stack>
  );

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", xl: "420px 1fr" },
        gridTemplateRows: "minmax(0, 1fr)",
        gap: 1.75,
        alignItems: "stretch",
        width: "100%",
        minWidth: 0,
      }}
    >
      <Paper
        sx={{
          ...inboxPanelStyle,
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" mb={1.25}>
          <SearchRoundedIcon />
          <TextField
            fullWidth
            size="small"
            placeholder="Search sender, subject, or content"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </Stack>

        <Divider sx={{ mb: 1.25, borderColor: "rgba(94,231,255,0.12)" }} />

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            pr: 0.5,
            scrollbarGutter: "stable",
            overscrollBehaviorY: "contain",
            WebkitOverflowScrolling: "touch",
            contain: "paint",
          }}
        >
          {loading ? (
            <Stack spacing={1}>
              <Skeleton variant="rounded" height={76} />
              <Skeleton variant="rounded" height={76} />
              <Skeleton variant="rounded" height={76} />
            </Stack>
          ) : renderedThreads.length === 0 ? (
            <EmptyState
              icon={<DraftsRoundedIcon fontSize="large" />}
              title="Inbox is empty"
              description="Once mail arrives, you will see the thread list here."
            />
          ) : (
            <List disablePadding>
              {renderedThreads.map((thread) => (
                <ListItemButton
                  key={thread.threadId}
                  selected={selectedThreadId === thread.threadId}
                  onClick={() => onSelectThread(thread)}
                  disableGutters
                  sx={{
                    mb: 1,
                    p: 1.25,
                    borderRadius: 1,
                    border: "1px solid rgba(94,231,255,0.12)",
                    bgcolor: selectedThreadId === thread.threadId ? "rgba(94,231,255,0.08)" : "rgba(255,255,255,0.015)",
                    "&.Mui-selected": {
                      bgcolor: "rgba(94,231,255,0.1)",
                      borderColor: "rgba(94,231,255,0.2)",
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" justifyContent="space-between" gap={1}>
                        <Typography fontWeight={700} noWrap>
                          {thread.from}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {formatDate(thread.createdAt)}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Box mt={0.75}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {thread.subject}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {thread.preview}
                        </Typography>
                        <Stack direction="row" spacing={0.75} mt={0.75} flexWrap="wrap" useFlexGap>
                          <Chip size="small" label={`${thread.messageCount} msgs`} variant="outlined" />
                          <Chip
                            size="small"
                            icon={<FlagRoundedIcon />}
                            label={thread.flagged ? "Flagged" : "Inbox"}
                            color={thread.flagged ? "warning" : "default"}
                            variant={thread.flagged ? "filled" : "outlined"}
                          />
                        </Stack>
                      </Box>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      {!isCompact ? (
        <Paper
          sx={{
          ...inboxPanelStyle,
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {selectedThread ? threadPanel(false) : (
            <EmptyState
              icon={<MailOutlineRoundedIcon fontSize="large" />}
              title="Select a thread"
              description="Pick an email to inspect the inbound message and its auto reply."
            />
          )}
        </Paper>
      ) : mobileThreadOpen && selectedThread ? (
        <Drawer
          anchor="right"
          open={mobileThreadOpen}
          onClose={handleCloseThread}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              width: "min(92vw, 480px)",
              height: "100%",
              background: "linear-gradient(180deg, rgba(8, 18, 32, 0.98), rgba(4, 10, 18, 0.98))",
              backdropFilter: "none",
              borderLeft: "1px solid rgba(94,231,255,0.08)",
              p: 1.25,
            },
          }}
        >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  minWidth: 0,
                }}
              >
                {threadPanel(true)}
              </Box>
            </Drawer>
      ) : null}
    </Box>
  );
}

export function KnowledgeBaseView({
  items,
  loading,
  onAddItem,
  onDeleteItem,
  onSeedKnowledge,
  onSearchKnowledge,
}: {
  items: KnowledgeSnippet[];
  loading: boolean;
  onAddItem: (item: Omit<KnowledgeSnippet, "id" | "updatedAt">) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onSeedKnowledge: () => Promise<void>;
  onSearchKnowledge: (query: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Support");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    setSaving(true);
    try {
      await onAddItem({
        title: title.trim(),
        category: category.trim() || "General",
        content: content.trim(),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setTitle("");
      setCategory("Support");
      setContent("");
      setTags("");
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = () => {
    void onSearchKnowledge(query);
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "420px 1fr" },
        gap: 1.75,
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        pr: 0.5,
        pb: { xs: "max(16px, env(safe-area-inset-bottom))", sm: 2 },
      }}
    >
      <Paper sx={panelStyle}>
        <Typography variant="h6" fontWeight={800} mb={1.25}>
          Add knowledge
        </Typography>
        <Stack spacing={1.25}>
          <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} fullWidth />
          <TextField label="Category" value={category} onChange={(event) => setCategory(event.target.value)} fullWidth />
          <TextField label="Tags" value={tags} onChange={(event) => setTags(event.target.value)} fullWidth placeholder="billing, refund, setup" />
          <TextField
            label="Content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            fullWidth
            multiline
            minRows={8}
          />
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleAdd} disabled={saving || loading}>
            Save snippet
          </Button>
          <Button variant="outlined" startIcon={<LightbulbRoundedIcon />} onClick={() => void onSeedKnowledge()} disabled={saving || loading}>
            Add starter snippets
          </Button>
        </Stack>
      </Paper>

      <Paper sx={panelStyle}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} gap={1} mb={1.25}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Knowledge base
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Snippets saved in Meilisearch and used by the AI before it replies.
            </Typography>
          </Box>
          <Chip icon={<LightbulbRoundedIcon />} label={`${items.length} snippets`} color="primary" />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mb={1.25}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search FAQs, policies, templates"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <Button variant="outlined" startIcon={<SearchRoundedIcon />} onClick={handleSearch} disabled={loading}>
            Search
          </Button>
        </Stack>

        {loading ? <LinearProgress sx={{ mb: 1.25, borderRadius: 999 }} /> : null}

        <Stack spacing={1.25}>
          {loading && items.length === 0 ? (
            <>
              <Skeleton variant="rounded" height={108} />
              <Skeleton variant="rounded" height={108} />
            </>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<LightbulbRoundedIcon fontSize="large" />}
              title="No matching snippets"
              description="Add knowledge or search for another policy, FAQ, or template."
            />
          ) : (
            items.map((item) => (
                <Paper
                  key={item.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: "1px solid rgba(94,231,255,0.12)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.25}>
                  <Box minWidth={0}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Chip size="small" label={item.category} variant="outlined" />
                      <Typography variant="subtitle1" fontWeight={800}>
                        {item.title}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {item.content}
                    </Typography>
                    {item.tags?.length ? (
                      <Stack direction="row" spacing={0.75} mt={1} flexWrap="wrap" useFlexGap>
                        {item.tags.map((tag) => (
                          <Chip key={tag} size="small" label={tag} variant="outlined" />
                        ))}
                      </Stack>
                    ) : null}
                    <Typography variant="caption" color="text.secondary">
                      Updated {formatDate(item.updatedAt)}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => void onDeleteItem(item.id)} aria-label={`Delete ${item.title}`}>
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

export function AnalyticsView({
  stats,
}: {
  stats: AgentStats;
}) {
  const replyHealth = Math.min(100, Math.max(0, Math.round(stats.replyRate * 100)));
  const knowledgeHealth = Math.min(100, stats.knowledgeCount * 20);
  const latencyHealth = Math.max(0, 100 - Math.min(100, Math.round(stats.avgReplyMinutes * 5)));

  return (
    <Stack
      spacing={2}
      sx={{
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        pr: 0.5,
        pb: { xs: "max(16px, env(safe-area-inset-bottom))", sm: 2 },
      }}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 1.25 }}>
        <MetricCard icon={<ReplyRoundedIcon />} title="Auto replies" value={stats.autoReplyCount} accent="rgba(34,197,94,0.18)" />
        <MetricCard icon={<InboxRoundedIcon />} title="Pending" value={stats.pendingCount} accent="rgba(245,158,11,0.18)" />
        <MetricCard icon={<LightbulbRoundedIcon />} title="Knowledge" value={stats.knowledgeCount} accent="rgba(94,231,255,0.18)" />
        <MetricCard icon={<AnalyticsRoundedIcon />} title="Avg reply" value={`${stats.avgReplyMinutes.toFixed(1)}m`} accent="rgba(168,85,247,0.18)" />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 1.75 }}>
        <Paper sx={panelStyle}>
          <Typography variant="h6" fontWeight={800} mb={1.25}>
            Agent health
          </Typography>
          <Stack spacing={1.75}>
            <ProgressRow label="Reply rate" value={replyHealth} helper={`${Math.round(stats.replyRate * 100)}% of inbound messages auto-replied`} />
            <ProgressRow label="Knowledge coverage" value={knowledgeHealth} helper="More knowledge snippets improve reply relevance" />
            <ProgressRow label="Speed score" value={latencyHealth} helper={`Average reply time: ${stats.avgReplyMinutes.toFixed(1)} min`} />
          </Stack>
        </Paper>

        <Paper sx={panelStyle}>
          <Typography variant="h6" fontWeight={800} mb={1.25}>
            Operational summary
          </Typography>
          <Stack spacing={1.1}>
            <InfoRow label="Inbound messages" value={String(stats.inboundCount)} />
            <InfoRow label="Outbound replies" value={String(stats.outboundCount)} />
            <InfoRow label="Pending threads" value={String(stats.pendingCount)} />
            <InfoRow label="Knowledge snippets" value={String(stats.knowledgeCount)} />
          </Stack>
        </Paper>
      </Box>
    </Stack>
  );
}

function MetricCard({
  icon,
  title,
  value,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  accent: string;
}) {
  return (
      <Paper
      sx={{
        p: 1.75,
        borderRadius: 1,
        background: `linear-gradient(180deg, ${accent}, rgba(255,255,255,0.02))`,
        border: "1px solid rgba(94,231,255,0.12)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={900} mt={1}>
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: "rgba(255,255,255,0.08)", color: "primary.main" }}>{icon}</Avatar>
      </Stack>
    </Paper>
  );
}

function MailPreview({
  thread,
  active,
  onClick,
}: {
  thread: ThreadSummary;
  active: boolean;
  onClick: () => void;
}) {
  return (
      <Paper
      onClick={onClick}
      sx={{
        p: 1.5,
        cursor: "pointer",
        borderRadius: 1,
        background: active ? "rgba(94,231,255,0.08)" : "rgba(255,255,255,0.02)",
        border: active ? "1px solid rgba(94,231,255,0.22)" : "1px solid rgba(94,231,255,0.12)",
        transition: "transform 160ms ease, border-color 160ms ease, background 160ms ease",
        "&:hover": {
          transform: "translateY(-1px)",
          borderColor: "rgba(94,231,255,0.18)",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" gap={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={800} noWrap>
            {thread.subject}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {thread.from} to {thread.to}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }} noWrap>
            {thread.preview}
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={1} flexShrink={0}>
          <Typography variant="caption" color="text.secondary">
            {formatDate(thread.createdAt)}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" justifyContent="flex-end" useFlexGap>
            <Chip size="small" label={`${thread.messageCount} msgs`} variant="outlined" />
            <Chip
              size="small"
              icon={<FlagRoundedIcon />}
              label={thread.flagged ? "Flagged" : thread.latestMessage.isInbound === 1 ? "Inbound" : "Reply"}
              color={thread.flagged ? "warning" : thread.latestMessage.isInbound === 1 ? "secondary" : "primary"}
              variant={thread.flagged ? "filled" : "outlined"}
            />
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

function ActionCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
      <Paper
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: "1px solid rgba(94,231,255,0.12)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Avatar sx={{ bgcolor: "rgba(94,231,255,0.12)", color: "primary.main" }}>{icon}</Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={800}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {description}
          </Typography>
          <Button size="small" sx={{ mt: 1, borderRadius: 1 }} onClick={onAction}>
            {actionLabel}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

function ProgressRow({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle2" fontWeight={800}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {value}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 10,
          borderRadius: 1,
          bgcolor: "rgba(255,255,255,0.05)",
          "& .MuiLinearProgress-bar": {
            borderRadius: 1,
          },
        }}
      />
      <Typography variant="body2" color="text.secondary" mt={1}>
        {helper}
      </Typography>
    </Box>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle2" fontWeight={800}>
        {value}
      </Typography>
    </Stack>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Stack alignItems="center" justifyContent="center" textAlign="center" py={4} spacing={1.5}>
      <Avatar
        sx={{
          width: 60,
          height: 60,
          bgcolor: "rgba(94,231,255,0.12)",
          color: "primary.main",
          border: "1px solid rgba(94,231,255,0.18)",
        }}
      >
        {icon}
      </Avatar>
      <Box>
        <Typography variant="h6" fontWeight={800}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.75}>
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
