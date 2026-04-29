function generateAiReplyDraft({
  latestMessage = "",
  sender = "Customer",
  recipient = "User",
  subject = "",
}) {
  const normalizedSubject = subject.startsWith("Re:") ? subject : `Re: ${subject || "Your request"}`;
  const trimmedMessage = latestMessage.trim();
  const summary =
    trimmedMessage.length > 220 ? `${trimmedMessage.slice(0, 220).trim()}...` : trimmedMessage || "your message";

  return [
    `Hi ${sender},`,
    "",
    `Thanks for your email regarding "${normalizedSubject.replace(/^Re:\s*/i, "")}".`,
    `We reviewed ${summary}.`,
    "",
    "Our team is on it and will share the next update within one business day.",
    "",
    `Best regards,`,
    recipient,
  ].join("\n");
}

module.exports = {
  generateAiReplyDraft,
};

