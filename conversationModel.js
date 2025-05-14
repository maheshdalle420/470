import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      text: {
        type: String,
        default: "",
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      seen: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

// Ensure uniqueness for a pair of participants
conversationSchema.index(
  { participants: 1 },
  { unique: true, sparse: true, collation: { locale: 'en', strength: 2 } }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
