import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  certId: { type: Number, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  name: String,
  surname: String,
  father: String,
  aseKey: String,
  isActive: { type: Boolean, default: true },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
