import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { Worker } from "worker_threads";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./src/db.js";
import archiver from "archiver";
import fs from "fs";
import { reportToAdmin } from "./src/adminReporter.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_123";
const PORT = 3000;

async function startServer() {
  const app = express();

  // Ведение журналов
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url === "/api/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      return;
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    try {
      // Проверка ДБ
      db.prepare("SELECT 1").get();
      res.json({ status: "ok", db: "connected" });
    } catch (err: any) {
      console.error("[Server] Health check failed:", err);
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  //  API админа
  /*
  app.get("/api/admin/transfers", (req, res) => {
    const transfers = db
      .prepare("SELECT * FROM transfers ORDER BY start_time DESC LIMIT 50")
      .all();
    res.json(transfers);
  });
  */

  /*
  app.delete("/api/admin/transfers/:id", (req, res) => {
    const transfer = db
      .prepare("SELECT * FROM transfers WHERE id = ?")
      .get(req.params.id) as any;
    if (!transfer) return res.status(404).json({ error: "Transfer not found" });

    try {
      // Удалить, есми файл существует
      if (transfer.file_path && fs.existsSync(transfer.file_path)) {
        fs.unlinkSync(transfer.file_path);
      }

      // Удалить связные записи
      db.prepare("DELETE FROM packets WHERE transfer_id = ?").run(
        req.params.id,
      );
      db.prepare("DELETE FROM transfer_metrics WHERE transfer_id = ?").run(
        req.params.id,
      );
      db.prepare("DELETE FROM transfers WHERE id = ?").run(req.params.id);

      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to delete transfer", err);
      res.status(500).json({ error: "Failed to delete transfer" });
    }
  });
  */

  /*
  app.put("/api/admin/transfers/:id", (req, res) => {
    const { filename, status } = req.body;
    db.prepare(
      "UPDATE transfers SET filename = ?, status = ? WHERE id = ?",
    ).run(filename, status, req.params.id);
    res.json({ success: true });
  });
  */

  app.get("/api/files", (req, res) => {
    const files = db
      .prepare(
        `SELECT id, filename, total_size, end_time, user_id FROM transfers WHERE status = 'completed' AND file_path IS NOT NULL ORDER BY end_time DESC`,
      )
      .all();
    res.json(files);
  });

  app.get("/api/files/:id/download", (req, res) => {
    const transfer = db
      .prepare("SELECT * FROM transfers WHERE id = ?")
      .get(req.params.id) as any;
    if (!transfer || !transfer.file_path)
      return res.status(404).json({ error: "File not found" });

    if (!fs.existsSync(transfer.file_path)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    res.download(transfer.file_path, transfer.filename);
  });

  /*/
  app.get("/api/admin/transfers/:id", (req, res) => {
    const transfer = db
      .prepare("SELECT * FROM transfers WHERE id = ?")
      .get(req.params.id);
    if (!transfer) return res.status(404).json({ error: "Transfer not found" });

    // Ограничьте количество пакетов до 200 в последнюю секунду, чтобы предотвратить сбои браузера при работе с большими файлами
    const packets = db
      .prepare(
        "SELECT * FROM packets WHERE transfer_id = ? ORDER BY timestamp DESC LIMIT 200",
      )
      .all(req.params.id);

    const metrics = db
      .prepare(
        "SELECT * FROM transfer_metrics WHERE transfer_id = ? ORDER BY timestamp DESC LIMIT 1000",
      )
      .all(req.params.id);

    res.json({
      transfer,
      packets: packets.reverse(),
      metrics: metrics.reverse(),
    });
  });
  */

  /*
  app.get("/api/admin/packets", (req, res) => {
    const packets = db
      .prepare("SELECT * FROM packets ORDER BY timestamp DESC LIMIT 200")
      .all();
    res.json(packets);
  });
  */

  /*
  app.put("/api/admin/logs/:id", (req, res) => {
    const { action, details } = req.body;
    db.prepare("UPDATE logs SET action = ?, details = ? WHERE id = ?").run(
      action,
      details,
      req.params.id,
    );
    res.json({ success: true });
  });
  */

  app.get("/api/download-source", (req, res) => {
    console.log("[Server] Download source request received");
    try {
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Устанавливает уровень сжатия
      });

      res.attachment("project-source.zip");

      archive.on("error", (err) => {
        console.error("[Server] Archiver error:", err);
        if (!res.headersSent) {
          res.status(500).send({ error: err.message });
        }
      });

      archive.on("warning", (err) => {
        if (err.code === "ENOENT") {
          console.warn("[Server] Archiver warning:", err);
        } else {
          console.error("[Server] Archiver error:", err);
          if (!res.headersSent) {
            res.status(500).send({ error: err.message });
          }
        }
      });

      archive.pipe(res);

      archive.glob("**/*", {
        cwd: process.cwd(),
        ignore: [
          "node_modules/**",
          "dist/**",
          "uploads/**",
          ".git/**",
          "data.db",
          "data.db-journal",
          ".env",
        ],
      });

      archive.finalize();
    } catch (err) {
      console.error("[Server] Download source unexpected error:", err);
      if (!res.headersSent) {
        res
          .status(500)
          .send({ error: "Internal server error during download" });
      }
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    console.log("[Server] Register request received:", req.body.username);
    const { username, password, role } = req.body;
    try {
      const hash = await bcrypt.hash(password, 10);
      const stmt = db.prepare(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      );
      const info = stmt.run(username, hash, role || "user");
      console.log("[Server] Register success:", username);
      res.json({ success: true, userId: info.lastInsertRowid });
    } catch (err: any) {
      console.error("[Server] Register error:", err.message);
      if (err.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ error: "Username already exists" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    console.log("[Server] Login request received:", req.body.username);
    const { username, password } = req.body;
    try {
      const user = db
        .prepare("SELECT * FROM users WHERE username = ?")
        .get(username) as any;
      if (!user) {
        console.log("[Server] Login failed: User not found");
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        console.log("[Server] Login failed: Invalid password");
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      reportToAdmin("/api/events/log", {
        user_id: user.id,
        username: user.username,
        action: "login",
        details: "User logged in",
      });

      console.log("[Server] Login success:", username);
      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role },
      });
    } catch (error) {
      console.error("[Server] Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /*
  app.get("/api/admin/stats", (req, res) => {
    const stats = db.prepare("SELECT * FROM stats WHERE id = 1").get();
    const activeConnections = wss.clients.size;
    res.json({ ...stats, activeConnections });
  });
  */

  /*
  app.get("/api/admin/logs", (req, res) => {
    const logs = db
      .prepare(
        `
      SELECT id, username, action, details, timestamp
      FROM logs
      ORDER BY timestamp DESC
      LIMIT 100
    `,
      )
      .all();
    res.json(logs);
  });
  */

  /*
  app.delete("/api/admin/logs/:id", (req, res) => {
    db.prepare("DELETE FROM logs WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });
  */

  /*
  app.put("/api/admin/logs/:id", (req, res) => {
    const { action, details, username, timestamp } = req.body;
    db.prepare(
      `
      UPDATE logs
      SET action = ?, details = ?, username = ?, timestamp = ?
      WHERE id = ?
    `,
    ).run(action, details, username, timestamp, req.params.id);
    res.json({ success: true });
  });
  */

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  const fileWorker = new Worker(path.join(process.cwd(), "src", "worker.js"));

  fileWorker.on("error", (err) => {
    console.error("Worker error:", err);
  });

  fileWorker.on("message", (msg) => {
    if (msg.type === "ack_start") {
      db.prepare("UPDATE transfers SET file_path = ? WHERE file_id = ?").run(
        msg.filePath,
        msg.fileId.toString(),
      );
      reportToAdmin("/api/events/transfer/path", {
        file_id: msg.fileId.toString(),
        file_path: msg.filePath,
      });
    }
  });

  wss.on("connection", (ws: WebSocket, req) => {
    if (wss.clients.size > 3) {
      ws.close(1008, "Server full (max 3 clients)");
      return;
    }

    let authenticatedUser: any = null;
    let currentFileId: number | null = null;
    // let dbTransferId: number | null = null;
    let currentBytesReceived = 0;
    let lastMetricTime = Date.now();
    let bytesSinceLastMetric = 0;

    // Ведение журналов пакетной обработки пакетов для предотвращения блокировки базы данных при высокоскоростной передаче данных
    let packetLogBuffer: any[] = [];
    let packetLogTimeout: NodeJS.Timeout | null = null;

    const flushPacketLogs = () => {
      if (packetLogBuffer.length === 0) return;

      const bufferToSend = [...packetLogBuffer];
      packetLogBuffer = [];

      const validPackets = bufferToSend.filter((pkt) => pkt.file_id !== null);
      if (validPackets.length === 0) return;

      reportToAdmin("/api/events/packet/batch", { packets: validPackets });
    };

    const logPacket = (
      direction: "in" | "out",
      type: string,
      size: number,
      payload: Buffer | string,
    ) => {
      try {
        const preview = Buffer.isBuffer(payload)
          ? payload.subarray(0, 20).toString("hex")
          : payload.toString().substring(0, 50);

        packetLogBuffer.push({
          transferId: currentFileId ? currentFileId.toString() : null,
          direction,
          type,
          size,
          payload_preview: preview,
        });

        if (packetLogBuffer.length >= 100) {
          if (packetLogTimeout) clearTimeout(packetLogTimeout);
          packetLogTimeout = null;
          flushPacketLogs();
        } else if (!packetLogTimeout) {
          packetLogTimeout = setTimeout(() => {
            flushPacketLogs();
            packetLogTimeout = null;
          }, 1000);
        }
      } catch (e) {
        console.error("Packet log error", e);
      }
    };

    // Функция обнаружения неработающих соединений
    (ws as any).isAlive = true;
    ws.on("pong", () => {
      (ws as any).isAlive = true;
    });

    ws.on("message", (message: Buffer) => {
      try {
        const type = message[0];
        const size = message.length;

        if (type === 0x00) {
          logPacket("in", "auth", size, message);
          const token = message.subarray(1).toString("utf-8");
          try {
            authenticatedUser = jwt.verify(token, JWT_SECRET);
            (ws as any).username = authenticatedUser.username;
            (ws as any).connectedAt = Date.now();
            ws.send(JSON.stringify({ type: "auth_success" }));
            logPacket("out", "auth_ack", 0, "auth_success");

            reportToAdmin("/api/events/connection", {
              user_id: authenticatedUser.id,
              username: authenticatedUser.username,
              event: "connect",
            });
          } catch (err) {
            ws.send(
              JSON.stringify({ type: "error", message: "Invalid token" }),
            );
            logPacket("out", "auth_error", 0, "Invalid token");
            ws.close();
          }
        } else if (type === 0x01) {
          if (!authenticatedUser) return ws.close();
          const fileId = message.readUInt32LE(1);
          const metadataStr = message.subarray(5).toString("utf-8");
          const metadata = JSON.parse(metadataStr);
          currentFileId = fileId;
          currentBytesReceived = 0;

          reportToAdmin("/api/events/transfer/start", {
            file_id: fileId.toString(),
            filename: metadata.filename,
            user_id: authenticatedUser.id,
            total_size: metadata.size,
            file_path: null, // путь потом
          });

          logPacket("in", "start", size, message);

          reportToAdmin("/api/events/log", {
            user_id: authenticatedUser.id,
            username: authenticatedUser.username,
            action: "upload_start",
            details: `Started uploading ${metadata.filename}`,
          });

          fileWorker.postMessage({
            type: "start",
            fileId,
            filename: metadata.filename,
          });
        } else if (type === 0x02) {
          if (!authenticatedUser) return ws.close();
          const fileId = message.readUInt32LE(1);
          const chunk = message.subarray(5);
          currentBytesReceived += chunk.length;
          bytesSinceLastMetric += chunk.length;

          logPacket("in", "chunk", size, chunk);

          const now = Date.now();
          if (now - lastMetricTime > 1000 && currentFileId) {
            const duration = (now - lastMetricTime) / 1000;
            const speed = Math.round(bytesSinceLastMetric / duration);

            reportToAdmin("/api/events/transfer/progress", {
              file_id: currentFileId.toString(),
              bytes_transferred: currentBytesReceived,
              speed_bps: speed,
            });

            lastMetricTime = now;
            bytesSinceLastMetric = 0;
          }

          fileWorker.postMessage({ type: "chunk", fileId, data: chunk });
        } else if (type === 0x03) {
          if (!authenticatedUser) return ws.close();
          const fileId = message.readUInt32LE(1);

          logPacket("in", "end", size, message);

          if (currentFileId) {
            reportToAdmin("/api/events/transfer/end", {
              file_id: currentFileId.toString(),
              status: "completed",
            });
          }

          reportToAdmin("/api/events/log", {
            user_id: authenticatedUser.id,
            username: authenticatedUser.username,
            action: "upload_end",
            details: `Finished uploading file ID ${fileId}, total bytes: ${currentBytesReceived}`,
          });

          fileWorker.postMessage({ type: "end", fileId });
          ws.send(JSON.stringify({ type: "file_success", fileId }));
          logPacket("out", "ack", 0, "file_success");

          const updateMsg = JSON.stringify({ type: "file_list_update" });
          wss.clients.forEach((client: any) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(updateMsg);
            }
          });
        } else if (type === 0x04) {
          if (!authenticatedUser) return ws.close();
          const fileId = message.readUInt32LE(1);

          logPacket("in", "download_req", size, message);

          const transfer = db
            .prepare("SELECT * FROM transfers WHERE id = ?")
            .get(fileId) as any;

          if (
            !transfer ||
            !transfer.file_path ||
            !fs.existsSync(transfer.file_path)
          ) {
            ws.send(
              JSON.stringify({ type: "error", message: "File not found" }),
            );
            logPacket("out", "error", 0, "File not found");
            return;
          }

          const metadata = JSON.stringify({
            filename: transfer.filename,
            size: transfer.total_size,
          });
          const metaBytes = new TextEncoder().encode(metadata);
          const startMsg = new Uint8Array(1 + metaBytes.length);
          startMsg[0] = 0x05;
          startMsg.set(metaBytes, 1);
          ws.send(startMsg);
          logPacket("out", "download_start", startMsg.length, startMsg);

          const fileStream = fs.createReadStream(transfer.file_path, {
            highWaterMark: 64 * 1024,
          });

          fileStream.on("data", (chunk) => {
            const chunkData = new Uint8Array(chunk as Buffer);
            const chunkMsg = new Uint8Array(1 + chunkData.length);
            chunkMsg[0] = 0x06;
            chunkMsg.set(chunkData, 1);
            ws.send(chunkMsg);
          });

          fileStream.on("end", () => {
            const endMsg = new Uint8Array(1);
            endMsg[0] = 0x07;
            ws.send(endMsg);
            logPacket("out", "download_end", 1, endMsg);

            reportToAdmin("/api/events/log", {
              user_id: authenticatedUser.id,
              username: authenticatedUser.username,
              action: "download",
              details: `Downloaded file ${transfer.filename}`,
            });
          });

          fileStream.on("error", (err) => {
            console.error("File read error", err);
            ws.send(
              JSON.stringify({ type: "error", message: "Error reading file" }),
            );
          });
        }
      } catch (err) {
        console.error("[Server] Error in WS message handler:", err);
        ws.send(
          JSON.stringify({ type: "error", message: "Internal server error" }),
        );
      }
    });

    ws.on("close", () => {
      if (authenticatedUser) {
        reportToAdmin("/api/events/log", {
          user_id: authenticatedUser.id,
          username: authenticatedUser.username,
          action: "disconnect",
          details: "User disconnected",
        });

        reportToAdmin("/api/events/connection", {
          user_id: authenticatedUser.id,
          username: authenticatedUser.username,
          event: "disconnect",
        });
      }
    });
  });

  // Интервал для проверки наличия неработающих соединений
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 10000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  app.get("/api/admin/connections", (req, res) => {
    const connections: any[] = [];
    wss.clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN) {
        connections.push({
          username: client.username || "Anonymous",
          ip: client._socket?.remoteAddress,
          connectedAt: client.connectedAt,
        });
      }
    });
    res.json(connections);
  });
}

startServer();
