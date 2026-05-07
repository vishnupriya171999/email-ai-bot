const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: String,
      required: true,
      trim: true,
    },
    receiver: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      default: "No subject",
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    threadId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    isInbound: {
      type: Boolean,
      default: true,
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    cc: {
      type: [String],
      default: [],
    },
    bcc: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    imageAlt: {
      type: String,
      default: "Email visual attachment",
      trim: true,
    },
    attachments: {
      type: [
        {
          id: {
            type: String,
            default: "",
            trim: true,
          },
          name: {
            type: String,
            default: "Attachment",
            trim: true,
          },
          url: {
            type: String,
            required: true,
            trim: true,
          },
          type: {
            type: String,
            default: "file",
            trim: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

emailSchema.index({ owner: 1, threadId: 1, createdAt: 1 });

module.exports = mongoose.model("Email", emailSchema);

