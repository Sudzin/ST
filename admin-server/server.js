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
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Service-Key",
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    req.user = decoded; // сохраняем данные юзера в запрос
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
}

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

app.get("/api/admin/stats", authenticateAdmin, (req, res) => {
  try {
    const totalBytes =
      db
        .prepare(
          "SELECT SUM(total_size) as total FROM transfers WHERE status = 'completed'",
        )
        .get().total || 0;
    const totalFiles =
      db
        .prepare(
          "SELECT COUNT(*) as count FROM transfers WHERE status = 'completed'",
        )
        .get().count || 0;
    const totalErrors =
      db
        .prepare(
          "SELECT COUNT(*) as count FROM transfers WHERE status = 'failed'",
        )
        .get().count || 0;

    res.json({
      totalBytes,
      totalFiles,
      totalErrors,
    });
  } catch (err) {
    res.status(500).json({ error: "Ошибка при получении статистики" });
  }
});

app.get("/api/admin/transfers", authenticateAdmin, (req, res) => {
  try {
    const transfers = db
      .prepare("SELECT * FROM transfers ORDER BY start_time DESC")
      .all();
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: "Ошибка базы данных" });
  }
});

app.get("/api/admin/transfers/:id", authenticateAdmin, (req, res) => {
  try {
    const transferId = req.params.id;

    const transfer = db
      .prepare("SELECT * FROM transfers WHERE id = ?")
      .get(transferId);
    if (!transfer) return res.status(404).json({ error: "Трансфер не найден" });

    const metrics = db
      .prepare(
        "SELECT timestamp, speed_bps, progress FROM transfer_metrics WHERE transfer_id = ? ORDER BY timestamp ASC",
      )
      .all();

    res.json({
      transfer,
      metrics,
    });
  } catch (err) {
    res.status(500).json({ error: "Ошибка БД" });
  }
});

app.put("/api/admin/transfers/:id", authenticateAdmin, (req, res) => {
  try {
    const transferId = req.params.id;
    const { filename, status } = req.body;

    db.prepare(
      "UPDATE transfers SET filename = ?, status = ? WHERE id = ?",
    ).run(filename, status, transferId);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Не удалось обновить трансфер" });
  }
});

app.delete("/api/admin/transfers/:id", authenticateAdmin, (req, res) => {
  try {
    const transferId = req.params.id;

    const deleteTx = db.transaction(() => {
      db.prepare("DELETE FROM packets WHERE transfer_id = ?").run(transferId);
      db.prepare("DELETE FROM transfer_metrics WHERE transfer_id = ?").run(
        transferId,
      );
      db.prepare("DELETE FROM transfers WHERE id = ?").run(transferId);
    });

    deleteTx();

    res.json({ success: true, message: "Запись успешно удалена из истории" });
  } catch (err) {
    res.status(500).json({ error: "Ошибка при удалении записи" });
  }
});

app.get("/api/admin/logs", authenticateAdmin, (req, res) => {
  try {
    const logs = db
      .prepare("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 500")
      .all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Не удалось загрузить системные логи" });
  }
});

app.listen(ADMIN_SERVER_PORT, () => {
  console.log(
    `[Admin server] Работает на http://localhost:${ADMIN_SERVER_PORT}`,
  );
});
