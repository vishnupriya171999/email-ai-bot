import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createOutboundMail,
  createKnowledgeSnippet,
  createSampleInboundMail,
  deleteKnowledgeSnippet,
  fetchInboxMails,
  fetchKnowledgeBase,
  fetchThread,
  KnowledgeSnippet,
  MailItem,
  MailThread,
  searchKnowledgeBase,
  seedKnowledgeBase,
  summarizeThreads,
} from "../services/mailService";

const STORAGE_KEYS = {
  FLAGGED_THREADS: "ai-agent-flagged-threads",
  HIDDEN_THREADS: "ai-agent-hidden-threads",
};

const DEFAULT_KNOWLEDGE_BASE: KnowledgeSnippet[] = [
  {
    id: "kb-1",
    title: "Reply Tone",
    category: "Style",
    content: "Respond in a friendly, concise, and professional tone. Keep answers clear and helpful.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-2",
    title: "Support Policy",
    category: "Operations",
    content: "If a request needs manual review, say it will be handled by the support team within one business day.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "kb-3",
    title: "Working Hours",
    category: "Company",
    content: "Office hours are Monday to Friday, 9:00 AM to 6:00 PM IST.",
    updatedAt: new Date().toISOString(),
  },
];

export type ViewKey = "home" | "inbox" | "knowledge" | "analytics";

export type ThreadSummary = MailThread & {
  flagged: boolean;
};

function loadIdList(storageKey: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

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

type SendThreadMessageArgs = {
  threadId: string;
  receiver: string;
  subject: string;
  content: string;
};

type UseAgentMailboxOptions = {
  userEmail: string;
  enabled?: boolean;
};

export function useAgentMailbox({ userEmail, enabled = true }: UseAgentMailboxOptions) {
  const [view, setView] = useState<ViewKey>("home");
  const [mails, setMails] = useState<MailItem[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeSnippet[]>(DEFAULT_KNOWLEDGE_BASE);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [threadsById, setThreadsById] = useState<Record<string, MailItem[]>>({});
  const [flaggedThreadIds, setFlaggedThreadIds] = useState<string[]>(() => loadIdList(STORAGE_KEYS.FLAGGED_THREADS));
  const [hiddenThreadIds, setHiddenThreadIds] = useState<string[]>(() => loadIdList(STORAGE_KEYS.HIDDEN_THREADS));

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.FLAGGED_THREADS, JSON.stringify(flaggedThreadIds));
    } catch {
      // Best effort only.
    }
  }, [flaggedThreadIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.HIDDEN_THREADS, JSON.stringify(hiddenThreadIds));
    } catch {
      // Best effort only.
    }
  }, [hiddenThreadIds]);

  const loadThread = useCallback(
    async (threadId: string) => {
      if (!enabled) {
        return [];
      }

      setThreadLoading(true);
      try {
        if (threadsById[threadId]) {
          return threadsById[threadId];
        }

        const thread = await fetchThread(threadId);
        setThreadsById((current) => ({
          ...current,
          [threadId]: thread,
        }));
        return thread;
      } finally {
        setThreadLoading(false);
      }
    },
    [enabled, threadsById]
  );

  const loadMailbox = useCallback(async ({ showSpinner = true }: { showSpinner?: boolean } = {}) => {
    if (!enabled) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const inbox = await fetchInboxMails();
      const uniqueThreadIds = Array.from(new Set(inbox.map((mail) => mail.threadId)));

      const threadEntries = await Promise.all(
        uniqueThreadIds.map(async (threadId) => {
          try {
            return [threadId, await fetchThread(threadId)] as [string, MailItem[]];
          } catch {
            return [threadId, [] as MailItem[]] as [string, MailItem[]];
          }
        })
      );

      setMails(inbox);
      setThreadsById(
        threadEntries.reduce<Record<string, MailItem[]>>((acc, [threadId, thread]) => {
          acc[threadId] = thread;
          return acc;
        }, {})
      );

      setSelectedThreadId((current) => {
        if (current && uniqueThreadIds.includes(current) && !hiddenThreadIds.includes(current)) {
          return current;
        }

        return null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load messages.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [enabled, hiddenThreadIds]);

  const loadKnowledge = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setKnowledgeLoading(true);
    try {
      const items = await fetchKnowledgeBase();
      setKnowledgeBase(items.length ? items : DEFAULT_KNOWLEDGE_BASE);
    } catch (knowledgeError) {
      setError(knowledgeError instanceof Error ? knowledgeError.message : "Unable to load knowledge base.");
    } finally {
      setKnowledgeLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setRefreshing(false);
      setThreadLoading(false);
      setMails([]);
      setThreadsById({});
      setSelectedThreadId(null);
      return;
    }

    void loadMailbox();
    void loadKnowledge();

    const interval = window.setInterval(() => {
      void loadMailbox({ showSpinner: false });
    }, 45000);

    return () => window.clearInterval(interval);
  }, [enabled, loadKnowledge, loadMailbox]);

  const threads = useMemo<ThreadSummary[]>(
    () =>
      summarizeThreads(mails).map((thread) => ({
        ...thread,
        flagged: flaggedThreadIds.includes(thread.threadId),
      })),
    [flaggedThreadIds, mails]
  );

  const visibleThreads = useMemo(
    () => threads.filter((thread) => !hiddenThreadIds.includes(thread.threadId)),
    [hiddenThreadIds, threads]
  );

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return visibleThreads;
    }

    return visibleThreads.filter((thread) =>
      [
        thread.subject,
        thread.from,
        thread.to,
        thread.preview,
        thread.messages.map((message) => `${message.subject} ${message.body} ${message.from} ${message.to}`).join(" "),
      ].some((field) => field.toLowerCase().includes(query))
    );
  }, [search, visibleThreads]);

  const selectedThread = useMemo(
    () => visibleThreads.find((thread) => thread.threadId === selectedThreadId) ?? null,
    [selectedThreadId, visibleThreads]
  );

  const threadMessages = useMemo(() => {
    if (!selectedThread) {
      return [];
    }

    return threadsById[selectedThread.threadId] ?? selectedThread.messages;
  }, [selectedThread, threadsById]);

  useEffect(() => {
    if (!selectedThread) {
      return;
    }

    if (!threadsById[selectedThread.threadId]) {
      void loadThread(selectedThread.threadId);
    }
  }, [loadThread, selectedThread, threadsById]);

  const stats: AgentStats = useMemo(() => {
    const threadList = Object.values(threadsById);
    const inboundCount = mails.filter((mail) => mail.isInbound === 1).length;
    const outboundCount = mails.filter((mail) => mail.isInbound === 0).length;
    const pendingCount = threadList.filter((thread) => thread.filter((item) => item.isInbound === 0).length === 0).length;
    const unreadCount = 0;
    const autoReplyCount = outboundCount;
    const replyRate = inboundCount === 0 ? 0 : Math.min(1, outboundCount / inboundCount);
    const repliedThreads = threadList
      .map((thread) => {
        const firstInbound = thread.find((item) => item.isInbound === 1);
        const firstReply = thread.find((item) => item.isInbound === 0);

        if (!firstInbound || !firstReply) {
          return null;
        }

        return (new Date(firstReply.createdAt).getTime() - new Date(firstInbound.createdAt).getTime()) / 60000;
      })
      .filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0);
    const avgReplyMinutes =
      repliedThreads.length === 0 ? 0 : repliedThreads.reduce((sum, value) => sum + value, 0) / repliedThreads.length;

    return {
      inboundCount,
      outboundCount,
      unreadCount,
      autoReplyCount,
      pendingCount,
      avgReplyMinutes,
      knowledgeCount: knowledgeBase.length,
      replyRate,
    };
  }, [knowledgeBase.length, mails, threadsById]);

  const handleAddKnowledge = async (item: Omit<KnowledgeSnippet, "id" | "updatedAt">) => {
    try {
      setError(null);
      await createKnowledgeSnippet(item);
      await loadKnowledge();
      setStatusMessage("Knowledge snippet added to Meilisearch.");
    } catch (knowledgeError) {
      setError(knowledgeError instanceof Error ? knowledgeError.message : "Unable to add knowledge snippet.");
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    try {
      setError(null);
      await deleteKnowledgeSnippet(id);
      setKnowledgeBase((current) => current.filter((item) => item.id !== id));
      setStatusMessage("Knowledge snippet removed from Meilisearch.");
    } catch (knowledgeError) {
      setError(knowledgeError instanceof Error ? knowledgeError.message : "Unable to remove knowledge snippet.");
    }
  };

  const handleSeedKnowledge = async () => {
    try {
      setError(null);
      await seedKnowledgeBase();
      await loadKnowledge();
      setStatusMessage("Starter knowledge added to Meilisearch.");
    } catch (knowledgeError) {
      setError(knowledgeError instanceof Error ? knowledgeError.message : "Unable to seed knowledge base.");
    }
  };

  const handleSearchKnowledge = async (query: string) => {
    try {
      setError(null);
      setKnowledgeLoading(true);
      const results = await searchKnowledgeBase(query);
      setKnowledgeBase(results.length ? results : []);
    } catch (knowledgeError) {
      setError(knowledgeError instanceof Error ? knowledgeError.message : "Unable to search knowledge base.");
    } finally {
      setKnowledgeLoading(false);
    }
  };

  const handleSeedSampleMail = async () => {
    try {
      setError(null);
      await createSampleInboundMail({
        sender: "customer@example.com",
        receiver: userEmail,
        subject: "Help needed with my account",
        content: "Hi team, I am unable to access my account and need help please.",
      });
      setStatusMessage("Sample inbound email created and auto-replied by the backend.");
      await loadMailbox({ showSpinner: false });
    } catch (sampleError) {
      setError(sampleError instanceof Error ? sampleError.message : "Unable to create sample email.");
    }
  };

  const handleToggleFlag = (threadId: string) => {
    setFlaggedThreadIds((current) => {
      const nextFlagged = current.includes(threadId)
        ? current.filter((item) => item !== threadId)
        : [threadId, ...current];

      setStatusMessage(nextFlagged.includes(threadId) ? "Thread flagged." : "Thread unflagged.");
      return nextFlagged;
    });
  };

  const handleDeleteThread = (threadId: string) => {
    setHiddenThreadIds((current) => (current.includes(threadId) ? current : [threadId, ...current]));
    setStatusMessage("Thread removed from the inbox view.");

    if (selectedThreadId === threadId) {
      setSelectedThreadId(null);
    }
  };

  const handleSendThreadMessage = async ({ threadId, receiver, subject, content }: SendThreadMessageArgs) => {
    try {
      setError(null);
      await createOutboundMail({
        sender: userEmail,
        receiver,
        subject,
        content,
        threadId,
      });
      setStatusMessage("Message sent.");
      await loadMailbox({ showSpinner: false });
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send message.");
    }
  };

  return {
    view,
    setView,
    mails,
    threads,
    visibleThreads,
    filteredThreads,
    selectedThreadId,
    setSelectedThreadId,
    search,
    setSearch,
    loading,
    refreshing,
    threadLoading,
    statusMessage,
    setStatusMessage,
    error,
    setError,
    mobileNavOpen,
    setMobileNavOpen,
    knowledgeBase,
    knowledgeLoading,
    handleAddKnowledge,
    handleDeleteKnowledge,
    handleSeedKnowledge,
    handleSearchKnowledge,
    handleSeedSampleMail,
    handleToggleFlag,
    handleDeleteThread,
    handleSendThreadMessage,
    selectedThread,
    threadMessages,
    stats,
    loadMailbox,
  };
}
