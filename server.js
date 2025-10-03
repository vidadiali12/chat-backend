import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";
import { Client as StompServer } from "@stomp/stompjs"; // server üçün istifadə olunur

import User from "./models/User.js";
import Message from "./models/Message.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB qoşulma
mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

/* ---------- USER ROUTES ---------- */
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/users", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();

    // Token yaradılır
    const token = jwt.sign(
      { username: newUser.username, userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ user: newUser, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ---------- MESSAGE ROUTES ---------- */
app.get("/messages", async (req, res) => {
  try {
    const msgs = await Message.find().sort({ createdAt: -1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/messages", async (req, res) => {
  try {
    const newMsg = new Message(req.body);
    await newMsg.save();
    res.json(newMsg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ---------- WEBSOCKET ---------- */
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server listening on ${process.env.PORT || 5000}`);
});

// Native WebSocket server
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  console.log("WebSocket: connection attempt");

  // Token yoxlaması
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    ws.send(JSON.stringify({ error: "No token provided" }));
    return ws.close();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("WebSocket authorized:", decoded.username);

    // STOMP kimi mesaj göndərmək
    ws.on("message", async (msg) => {
      try {
        const data = JSON.parse(msg);

        // Mesaj DB-yə əlavə et
        const newMsg = new Message({
          chatId: data.chatId,
          senderId: decoded.userId,
          cipherText: data.cipherText,
          createdAt: new Date(),
        });
        await newMsg.save();

        // Bütün bağlı client-lərə göndər
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({
              chatId: data.chatId,
              senderId: decoded.userId,
              cipherText: data.cipherText,
              createdAt: newMsg.createdAt,
            }));
          }
        });
      } catch (err) {
        console.error("WS message error:", err.message);
      }
    });

  } catch (err) {
    ws.send(JSON.stringify({ error: "Invalid token" }));
    ws.close();
  }
});
