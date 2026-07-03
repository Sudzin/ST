require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./src/db.js");

const app = express();
const ADMIN_SERVER_PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5174");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS, POST, PUT, DELETE",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Service-Key");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" },
    );
    res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.post("/api/events/log", (req, res) => {
  const key = req.headers["x-service-key"];
  if (key !== process.env.SERVICE_KEY) {
    return res.status(401).json({ error: "Invalid secret key" });
  }

  try {
    const { user_id, username, action, details } = req.body;
    db.prepare(
      "INSERT INTO logs (user_id, username, action, details) VALUES (?, ?, ?, ?)",
    ).run(user_id, username, action, details);

    console.log(`[Admin server] Записан лог: ${username} -> ${action}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Внутренняя ошибка" });
  }
});

app.get("/api/admin/transfers/:id", (req, res) => {
  try {
    const transferId = req.params.id;
    const data = db
      .prepare("SELECT * FROM transfers WHERE id = ?")
      .get(transferId);
    if (!data) return res.status(404).json({ error: "Не найдено" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Ошибка БД" });
  }
});

app.listen(ADMIN_SERVER_PORT, () => {
  console.log(
    `[Admin server] Работает на http://localhost:${ADMIN_SERVER_PORT}`,
  );
});
