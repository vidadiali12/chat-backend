import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  senderId: { type: Number, required: true },
  groupId: { type: [Number], required: true },  // həm sender, həm receiver
  message: { type: String, required: true },
  time: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Message", MessageSchema);
