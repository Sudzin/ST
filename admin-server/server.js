require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./src/db.js");
const activeConnections = new Map();

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
    console.error("[Admin server] Ошибка при записи лога:", err);
    res.status(500).json({ error: "Внутренняя ошибка" });
  }
});

app.post("/api/events/transfer/start", (req, res) => {
  const key = req.headers["x-service-key"];
  if (key !== process.env.SERVICE_KEY) {
    return res.status(401).json({ error: "Invalid secret key" });
  }
  try {
    const { file_id, filename, user_id, total_size, file_path } = req.body;
    db.prepare(
      "INSERT INTO transfers (file_id, filename, user_id, total_size, file_path, status) VALUES (?, ?, ?, ?, ?, 'in_progress')",
    ).run(file_id, filename, user_id, total_size, file_path);
    console.log(`[Admin server] Начало передачи: ${filename}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Внутренняя ошибка" });
  }
});

app.post("/api/events/transfer/progress", (req, res) => {
  const key = req.headers["x-service-key"];
  if (key !== process.env.SERVICE_KEY) {
    return res.status(401).json({ error: "Invalid secret key" });
  }
  try {
    const { file_id, bytes_transferred, speed_bps } = req.body;
    const transfer = db
      .prepare("SELECT id FROM transfers WHERE file_id = ?")
      .get(file_id);
    if (!transfer) return res.status(404).json({ error: "Трансфер не найден" });

    db.prepare(
      "INSERT INTO transfer_metrics (transfer_id, bytes_transferred, speed_bps) VALUES (?, ?, ?)",
    ).run(transfer.id, bytes_transferred, speed_bps);

    db.prepare("UPDATE transfers SET transferred_size = ? WHERE id = ?").run(
      bytes_transferred,
      transfer.id,
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Внутренняя ошибка" });
  }
});

app.post("/api/events/transfer/end", (req, res) => {
  const key = req.headers["x-service-key"];
  if (key !== process.env.SERVICE_KEY) {
    return res.status(401).json({ error: "Invalid secret key" });
  }
  try {
    const { file_id, status } = req.body;
    const transfer = db
      .prepare("SELECT id FROM transfers WHERE file_id = ?")
      .get(file_id);
    if (!transfer) return res.status(404).json({ error: "Трансфер не найден" });

    db.prepare(
      "UPDATE transfers SET status = ?, end_time = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(status, transfer.id);

    if (status === "completed") {
      const t = db
        .prepare("SELECT total_size FROM transfers WHERE id = ?")
        .get(transfer.id);
      db.prepare(
        "UPDATE stats SET total_files = total_files + 1, total_bytes = total_bytes + ? WHERE id = 1",
      ).run(t.total_size || 0);
    }

    console.log(
      `[Admin server] Передача завершена: file_id=${file_id}, статус=${status}`,
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Внутренняя ошибка" });
  }
});

app.post("/api/events/packet", (req, res) => {
  const key = req.headers["x-service-key"];
  if (key !== process.env.SERVICE_KEY) {
    return res.status(401).json({ error: "Invalid secret key" });
  }
  try {
    const { file_id, direction, type, size, payload_preview } = req.body;
    const transfer = db
      .prepare("SELECT id FROM transfers WHERE file_id = ?")
      .get(file_id);
    if (!transfer) return res.status(404).json({ error: "Трансфер не найден" });

    db.prepare(
      "INSERT INTO packets (transfer_id, direction, type, size, payload_preview) VALUES (?, ?, ?, ?, ?)",
    ).run(transfer.id, direction, type, size, payload_preview);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Внутренняя ошибка" });
  }
});

app.post("/api/events/transfer/path", (req, res) => {
  const key = req.headers["x-service-key"];
  if (key !== process.env.SERVICE_KEY) {
    return res.status(401).json({ error: "Invalid secret key" });
  }
  try {
    const { file_id, file_path } = req.body;
    db.prepare("UPDATE transfers SET file_path = ? WHERE file_id = ?").run(
      file_path,
      file_id,
    );
    res.json({ success: true });
  } catch (err) {
    console.error("[Admin server] Ошибка обновления пути:", err);
    res.status(500).json({ error: "Внутренняя ошибка" });
  }
});

app.post("/api/events/connection", (req, res) => {
  const key = req.headers["x-service-key"];
  if (key !== process.env.SERVICE_KEY) {
    return res.status(401).json({ error: "invalid secret key" });
  }

  try {
    const { user_id, username, event } = req.body;

    if (event === "connect") {
      activeConnections.set(user_id, { username, connectedAt: Date.now() });
      console.log(`[Admin server] Подключение: ${username}`);
    } else if (event === "disconnect") {
      activeConnections.delete(user_id);
      console.log(`[Admin server] Отключение: ${username}`);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[Admin server] Ошибка обработки подключения", err);
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
      .prepare("SELECT * FROM logs ORDER BY timestamp DESC, id DESC LIMIT 500")
      .all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Не удалось загрузить системные логи" });
  }
});

app.get("/api/admin/connections", authenticateAdmin, (req, res) => {
  const list = Array.from(activeConnections.entries()).map(
    ([user_id, info]) => ({
      user_id,
      username: info.username,
      connectedAt: info.connectedAt,
    }),
  );
  res.json(list);
});

app.get("/api/admin/users", authenticateAdmin, (req, res) => {
  try {
    const users = db
      .prepare("SELECT id, username, role FROM users ORDER BY id ASC")
      .all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Не удалось загрузить пользователей" });
  }
});

app.post("/api/admin/users", authenticateAdmin, (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Укажите имя пользователя и пароль" });
    }

    const hash = await bcrypt.hash(password, 10);
    const info = db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)").run(username, hash, role || "admin");
    res.json({success:true, id:info.lastInsertRowid});
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      res.status(500).json({ error: "Такого пользователя не существует" });
    }
    console.error("[Admin server] Ошибка создания пользователя:", err);
    res.status(500).json({error: "Внутренняя ошибка"})
  }
});

app.listen(ADMIN_SERVER_PORT, () => {
  console.log(
    `[Admin server] Работает на http://localhost:${ADMIN_SERVER_PORT}`,
  );
});
