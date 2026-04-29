const Email = require("../models/Email");
const { generateAiReplyDraft } = require("../utils/replyGenerator");

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }

  return fallback;
}

function toApiMail(emailDoc) {
  return {
    _id: emailDoc._id,
    threadId: emailDoc.threadId,
    sender: emailDoc.sender,
    receiver: emailDoc.receiver,
    subject: emailDoc.subject,
    content: emailDoc.content,
    isInbound: emailDoc.isInbound ? 1 : 0,
    aiGenerated: Boolean(emailDoc.aiGenerated),
    cc: emailDoc.cc || [],
    bcc: emailDoc.bcc || [],
    createdAt: emailDoc.createdAt,
    updatedAt: emailDoc.updatedAt,
  };
}

async function listEmails(req, res) {
  const emails = await Email.find({ owner: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json(emails.map(toApiMail));
}

async function getThread(req, res) {
  const threadId = String(req.params.threadId || "").trim();
  const emails = await Email.find({ owner: req.user._id, threadId }).sort({ createdAt: 1 });
  return res.status(200).json(emails.map(toApiMail));
}

async function createEmail(req, res) {
  const sender = String(req.body.sender || "").trim();
  const receiver = String(req.body.receiver || "").trim();
  const subject = String(req.body.subject || "No subject").trim() || "No subject";
  const content = String(req.body.content || "");
  const threadId = String(req.body.threadId || `thread-${Date.now()}`).trim();
  const isInbound = normalizeBoolean(req.body.isInbound, true);
  const aiGenerated = normalizeBoolean(req.body.aiGenerated, false);

  if (!sender || !receiver) {
    return res.status(400).json({ message: "Sender and receiver are required." });
  }

  const email = await Email.create({
    owner: req.user._id,
    sender,
    receiver,
    subject,
    content,
    threadId,
    isInbound,
    aiGenerated,
  });

  let aiReply = null;
  if (isInbound) {
    const replySubject = subject.startsWith("Re:") ? subject : `Re: ${subject}`;
    const draft = generateAiReplyDraft({
      latestMessage: content,
      sender,
      recipient: receiver,
      subject,
    });

    aiReply = await Email.create({
      owner: req.user._id,
      sender: receiver,
      receiver: sender,
      subject: replySubject,
      content: draft,
      threadId,
      isInbound: false,
      aiGenerated: true,
    });
  }

  return res.status(201).json({
    threadId,
    email: toApiMail(email),
    aiReply: aiReply ? toApiMail(aiReply) : null,
  });
}

async function generateReply(req, res) {
  const reply = generateAiReplyDraft({
    latestMessage: req.body.latestMessage,
    sender: req.body.sender,
    recipient: req.body.recipient,
    subject: req.body.subject,
  });

  return res.status(200).json({ reply });
}

async function stats(req, res) {
  const emails = await Email.find({ owner: req.user._id }).select("isInbound aiGenerated threadId");
  const inboundCount = emails.filter((email) => email.isInbound).length;
  const outboundCount = emails.filter((email) => !email.isInbound).length;
  const autoReplyCount = emails.filter((email) => !email.isInbound && email.aiGenerated).length;
  const threadIds = new Set(emails.map((email) => email.threadId));

  return res.status(200).json({
    inboundCount,
    outboundCount,
    autoReplyCount,
    threadCount: threadIds.size,
  });
}

module.exports = {
  listEmails,
  getThread,
  createEmail,
  generateReply,
  stats,
};

