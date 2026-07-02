import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data.db");

let db;
try {
  db = new Database(dbPath);
  // Проверочный запрос
  db.prepare("SELECT 1").get();
} catch (err) {
  console.error("Database corrupted or failed to open, recreating...", err);
  try {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    if (fs.existsSync(dbPath + "-shm")) fs.unlinkSync(dbPath + "-shm");
    if (fs.existsSync(dbPath + "-wal")) fs.unlinkSync(dbPath + "-wal");
  } catch (e) {
    console.error("Failed to delete corrupted DB files", e);
  }
  db = new Database(dbPath);
}

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Добавить столбец с именем пользователя если нет
  try {
    const columns = db.prepare("PRAGMA table_info(logs)").all() as any[];
    const hasUsername = columns.some((col) => col.name === "username");
    if (!hasUsername) {
      db.prepare("ALTER TABLE logs ADD COLUMN username TEXT").run();
    }
  } catch (e: any) {
    // console.error('Migration error:', e);
  }

  // Заполнение существующих журналов именами пользователей
  try {
    db.prepare(
      `
      UPDATE logs
      SET username = (SELECT username FROM users WHERE users.id = logs.user_id)
      WHERE username IS NULL
    `,
    ).run();
  } catch (e) {
    // console.error('Data migration error', e);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_files INTEGER DEFAULT 0,
      total_bytes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id TEXT,
      filename TEXT,
      user_id INTEGER,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      status TEXT,
      total_size INTEGER,
      transferred_size INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS packets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      direction TEXT, -- 'in' or 'out'
      type TEXT, -- 'auth', 'start', 'chunk', 'end', 'ack'
      size INTEGER,
      payload_preview TEXT,
      FOREIGN KEY(transfer_id) REFERENCES transfers(id)
    );

    CREATE TABLE IF NOT EXISTS transfer_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      bytes_transferred INTEGER,
      speed_bps INTEGER,
      FOREIGN KEY(transfer_id) REFERENCES transfers(id)
    );

    INSERT INTO stats (id, total_files, total_bytes)
    SELECT 1, 0, 0
    WHERE NOT EXISTS (SELECT 1 FROM stats WHERE id = 1);
  `);

  // Добавить столбец file_path к передаваемым данным если его нет
  try {
    const columns = db.prepare("PRAGMA table_info(transfers)").all() as any[];
    const hasFilePath = columns.some((col) => col.name === "file_path");
    if (!hasFilePath) {
      db.prepare("ALTER TABLE transfers ADD COLUMN file_path TEXT").run();
    }
  } catch (e: any) {
    // console.error('Migration error:', e);
  }
} catch (err) {
  console.error("Failed to initialize database schema:", err);
}

export default db;
