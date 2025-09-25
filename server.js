import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import User from "./models/User.js";
import Message from "./models/Message.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB qoşulma
mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

/* ---------- USER ROUTES ---------- */
// bütün userləri götür
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// yeni user əlavə et
app.post("/users", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.json(newUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ---------- MESSAGE ROUTES ---------- */
// bütün mesajları götür
app.get("/messages", async (req, res) => {
  try {
    const msgs = await Message.find().sort({ createdAt: -1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// yeni mesaj əlavə et
app.post("/messages", async (req, res) => {
  try {
    const newMsg = new Message(req.body);
    await newMsg.save();
    res.json(newMsg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// mesaj update et (read/delete status və s.)
app.put("/messages/:id", async (req, res) => {
  try {
    const updated = await Message.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ---------- SERVER START ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
