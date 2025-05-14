import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getRecipientSocketId, io } from "../socket/socket.js";
import { v2 as cloudinary } from "cloudinary";

// Send a new message
export async function sendMessage(req, res) {
  try {
    const senderId = req.user._id.toString();
    const { recipientId, type = "text", text, img, payload, replyTo } = req.body;

    // Validate recipientId
    if (!recipientId) {
      return res.status(400).json({ error: "recipientId is required" });
    }

    // 1) Find or create the conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
    });

    if (!conversation) {
      // Create a new conversation if it doesn't exist
      conversation = await Conversation.create({
        participants: [senderId, recipientId],
        lastMessage: { text: type === "gif" ? "[GIF]" : text || "", sender: senderId },
      });
    }

    // 2) If the message is an image, upload it to Cloudinary
    let imgUrl = "";
    if (type === "image" && img) {
      const uploadRes = await cloudinary.uploader.upload(img);
      imgUrl = uploadRes.secure_url;
    }

    // 3) Create the message document in the database
    const newMessage = await Message.create({
      conversationId: conversation._id,
      sender: senderId,
      recipientId,
      type,
      text: type === "text" ? text : (type === "gif" ? "[GIF]" : undefined),
      img: type === "image" ? imgUrl : undefined,
      payload: type === "gif" ? payload : undefined,
      replyTo: replyTo || null, // Support for replying to a previous message
    });

    // 4) Update the conversation's last message
    conversation.lastMessage = {
      text: type === "gif" ? "[GIF]" : text || "",
      sender: senderId,
      seen: false,
    };
    await conversation.save();

    // 5) Emit the real-time event to the recipient
    const recipientSocketId = getRecipientSocketId(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: error.message });
  }
}

// Retrieve all messages in a conversation
export async function getMessages(req, res) {
  try {
    const userId = req.user._id.toString();
    const otherUserId = req.params.otherUserId;

    // Find the conversation between the user and the other participant
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Fetch all messages in chronological order
    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error retrieving messages:", error);
    return res.status(500).json({ error: error.message });
  }
}

// Retrieve all conversations for the current user
export async function getConversations(req, res) {
  try {
    const userId = req.user._id.toString();

    // Find all conversations involving the current user
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate({ path: "participants", select: "username profilePic" })
      .sort({ updatedAt: -1 })
      .lean();

    // Filter out the current user from the participants list in each conversation
    conversations.forEach((conv) => {
      conv.participants = conv.participants.filter(
        (p) => p._id.toString() !== userId
      );
    });

    return res.status(200).json(conversations);
  } catch (error) {
    console.error("Error retrieving conversations:", error);
    return res.status(500).json({ error: error.message });
  }
}

// Add or remove reactions from a message
export const toggleReaction = async (req, res) => {
  const { id } = req.params; // Message ID
  const { emoji } = req.body; // Reaction emoji
  const userId = req.user._id.toString();

  const message = await Message.findById(id);
  if (!message) return res.status(404).json({ error: "Message not found" });

  // Check if the user already reacted with this emoji
  const existingReaction = message.reactions.find(
    (r) => r.userId.toString() === userId && r.emoji === emoji
  );

  if (existingReaction) {
    // Remove reaction if already exists
    message.reactions = message.reactions.filter(
      (r) => !(r.userId.toString() === userId && r.emoji === emoji)
    );
  } else {
    // Add new reaction
    message.reactions.push({ userId, emoji });
  }

  await message.save();
  res.status(200).json(message);
};

// Edit a message
export const editMessage = async (req, res) => {
  const { id } = req.params; // Message ID to edit
  const { newText } = req.body; // New text for the message
  const userId = req.user._id.toString();

  const message = await Message.findById(id);
  if (!message) return res.status(404).json({ error: "Message not found" });

  // Check if the sender is the current user
  if (message.sender.toString() !== userId) {
    return res.status(403).json({ error: "Unauthorized to edit this message" });
  }

  // Prevent editing if no changes detected
  if (message.text === newText) {
    return res.status(400).json({ error: "No changes detected" });
  }

  // Edit the message
  message.text = newText;
  message.edited = true; // Mark as edited
  await message.save();

  res.status(200).json(message);
};
