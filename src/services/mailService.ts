import apiClient from "./apiClient";
import { API_BASE_URL, EMAIL_ENDPOINTS, KNOWLEDGE_ENDPOINTS } from "../config/locator";

export type RawMail = Record<string, any>;

export type MailItem = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  createdAt: string;
  isInbound: 0 | 1;
  aiGenerated: boolean;
  cc?: string[];
  bcc?: string[];
};

export type MailThread = {
  threadId: string;
  subject: string;
  from: string;
  to: string;
  preview: string;
  createdAt: string;
  latestMessage: MailItem;
  messages: MailItem[];
  messageCount: number;
  inboundCount: number;
  outboundCount: number;
};

export type InboundMailPayload = {
  sender: string;
  receiver: string;
  subject: string;
  content: string;
  threadId: string;
  isInbound: true;
};

export type OutboundMailPayload = {
  sender: string;
  receiver: string;
  subject: string;
  content: string;
  threadId: string;
  isInbound: false;
  aiGenerated?: boolean;
};

export type KnowledgeSnippet = {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: string;
  tags?: string[];
};

export type ThreadResponse = {
  threadId: string;
  email: MailItem;
  aiReply: MailItem | null;
};

export type AiReplyDraftPayload = {
  threadId: string;
  subject: string;
  sender: string;
  recipient: string;
  latestMessage: string;
  messages: Array<{
    from: string;
    to: string;
    subject: string;
    body: string;
    isInbound: 0 | 1;
    createdAt: string;
  }>;
};

const DEFAULT_EMAIL = "aireplybot123@gmail.com";

const toText = (value: unknown, fallback = "") => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return fallback;
};

const toTextList = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => toText(item)).filter((item) => item.length > 0);
};

function requestToMailThreadList(mails: MailItem[]): MailThread[] {
  const grouped = mails.reduce<Record<string, MailItem[]>>((acc, mail) => {
    if (!acc[mail.threadId]) {
      acc[mail.threadId] = [];
    }

    acc[mail.threadId].push(mail);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([threadId, items]) => {
      const messages = [...items].sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      );
      const latestMessage = messages[messages.length - 1];
      const firstInbound = messages.find((message) => message.isInbound === 1) ?? messages[0];
      const inboundCount = messages.filter((message) => message.isInbound === 1).length;
      const outboundCount = messages.filter((message) => message.isInbound === 0).length;

      return {
        threadId,
        subject: firstInbound.subject || latestMessage.subject,
        from: firstInbound.from,
        to: firstInbound.to,
        preview: latestMessage.body || latestMessage.subject,
        createdAt: latestMessage.createdAt,
        latestMessage,
        messages,
        messageCount: messages.length,
        inboundCount,
        outboundCount,
      };
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function normalizeMail(raw: RawMail): MailItem {
  const inboundValue = raw.isInbound ?? raw.is_inbound ?? raw.inbound ?? 1;
  const isInbound = Number(inboundValue) === 1 || inboundValue === true ? 1 : 0;
  const threadIdFallback = toText(raw._id ?? raw.id ?? "", `thread-${Date.now()}`);

  return {
    id: String(raw._id ?? raw.id ?? `${Date.now()}-${Math.random()}`),
    threadId: toText(raw.threadId ?? raw.thread_id ?? raw.thread ?? raw.conversationId, threadIdFallback),
    subject: toText(raw.subject, "No subject"),
    from: toText(raw.sender ?? raw.from ?? raw.emailFrom, DEFAULT_EMAIL),
    to: toText(raw.receiver ?? raw.to ?? raw.emailTo, DEFAULT_EMAIL),
    body: toText(raw.content ?? raw.body ?? raw.message, ""),
    createdAt: toText(raw.createdAt ?? raw.updatedAt ?? raw.created_at ?? raw.date ?? new Date().toISOString(), new Date().toISOString()),
    isInbound,
    aiGenerated: Boolean(raw.aiGenerated ?? raw.ai_generated ?? isInbound === 0),
    cc: toTextList(raw.cc),
    bcc: toTextList(raw.bcc),
  };
}

export async function fetchInboxMails(): Promise<MailItem[]> {
  const response = await apiClient.get(EMAIL_ENDPOINTS.LIST);
  const items = Array.isArray(response.data) ? response.data : [];

  return items
    .map(normalizeMail)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export async function fetchThread(threadId: string): Promise<MailItem[]> {
  const response = await apiClient.get(`${EMAIL_ENDPOINTS.THREAD}/${encodeURIComponent(threadId)}`);
  const items = Array.isArray(response.data) ? response.data : [];

  return items
    .map(normalizeMail)
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

export async function createInboundMail(payload: Omit<InboundMailPayload, "isInbound">) {
  const response = await apiClient.post(EMAIL_ENDPOINTS.CREATE, {
    ...payload,
    isInbound: true,
  });

  const data = response.data as RawMail;
  const email = data?.email ? normalizeMail(data.email) : normalizeMail(data);
  const aiReply = data?.aiReply ? normalizeMail(data.aiReply) : null;

  return {
    email,
    aiReply,
  };
}

export async function createOutboundMail(payload: Omit<OutboundMailPayload, "isInbound">) {
  const response = await apiClient.post(EMAIL_ENDPOINTS.CREATE, {
    ...payload,
    isInbound: false,
    aiGenerated: Boolean(payload.aiGenerated ?? false),
  });

  const data = response.data as RawMail;
  return data?.email ? normalizeMail(data.email) : normalizeMail(data);
}

function normalizeKnowledge(raw: RawMail): KnowledgeSnippet {
  return {
    id: String(raw.id ?? raw._id ?? `${Date.now()}-${Math.random()}`),
    title: toText(raw.title ?? raw.question, "Untitled knowledge"),
    category: toText(raw.category, "general"),
    content: toText(raw.content ?? raw.answer, ""),
    updatedAt: toText(raw.updatedAt ?? raw.createdAt, new Date().toISOString()),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
  };
}

export async function fetchKnowledgeBase(): Promise<KnowledgeSnippet[]> {
  const response = await apiClient.get(KNOWLEDGE_ENDPOINTS.LIST);
  const items = Array.isArray(response.data?.documents) ? response.data.documents : [];

  return items.map(normalizeKnowledge);
}

export async function createKnowledgeSnippet(payload: Omit<KnowledgeSnippet, "id" | "updatedAt">) {
  const response = await apiClient.post(KNOWLEDGE_ENDPOINTS.CREATE, {
    title: payload.title,
    category: payload.category,
    content: payload.content,
    tags: payload.tags ?? [],
  });
  const documents = Array.isArray(response.data?.documents) ? response.data.documents : [];

  return documents[0] ? normalizeKnowledge(documents[0]) : null;
}

export async function deleteKnowledgeSnippet(id: string) {
  await apiClient.delete(`${KNOWLEDGE_ENDPOINTS.DOCUMENT}/${encodeURIComponent(id)}`);
}

export async function seedKnowledgeBase() {
  await apiClient.post(KNOWLEDGE_ENDPOINTS.SEED);
}

export async function searchKnowledgeBase(query: string): Promise<KnowledgeSnippet[]> {
  if (!query.trim()) {
    return fetchKnowledgeBase();
  }

  const response = await apiClient.get(KNOWLEDGE_ENDPOINTS.SEARCH, {
    params: { q: query, limit: 25 },
  });
  const items = Array.isArray(response.data?.hits) ? response.data.hits : [];

  return items.map(normalizeKnowledge);
}

function extractReplyDraft(data: unknown) {
  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed || null;
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  const typed = data as Record<string, unknown>;
  const candidate = typed.reply ?? typed.content ?? typed.message ?? typed.text ?? typed.draft;

  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
}

export async function generateAiReplyDraft(payload: AiReplyDraftPayload) {
  const replyEndpoints = [
    EMAIL_ENDPOINTS.AI_REPLY,
    `${API_BASE_URL}/emails/reply`,
    `${API_BASE_URL}/emails/generate-reply`,
  ];

  let lastError: unknown = null;

  for (const endpoint of replyEndpoints) {
    try {
      const response = await apiClient.post(endpoint, payload);
      const draft = extractReplyDraft(response.data);

      if (draft) {
        return draft;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to generate AI reply draft.");
}

export function createSampleInboundMail(overrides: Partial<Omit<InboundMailPayload, "isInbound">> = {}) {
  const now = new Date();
  const threadId = overrides.threadId || `thread-${now.getTime()}`;

  return createInboundMail({
    sender: overrides.sender || "customer@example.com",
    receiver: overrides.receiver || DEFAULT_EMAIL,
    subject: overrides.subject || "New customer inquiry",
    content:
      overrides.content || "Hi team, I need help with my account setup and would love a quick reply.",
    threadId,
  });
}

export function summarizeThreads(mails: MailItem[]): MailThread[] {
  return requestToMailThreadList(mails);
}

export const DEFAULT_USER_EMAIL = DEFAULT_EMAIL;
