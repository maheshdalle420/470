import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation ID is required"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },

    // Content (only one of these should be used)
    text: {
      type: String,
      default: "",
      trim: true,
    },
    img: {
      type: String,
      default: "",
    },
    payload: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["text", "image", "gif"],
      default: "text",
    },

    seen: {
      type: Boolean,
      default: false,
    },

    // ✅ Reply support
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // ✅ Reactions support
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String,
      },
    ],

    // ✅ Edited flag
    edited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
