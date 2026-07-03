const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(process.cwd(), "data.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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
    transferred_size INTEGER DEFAULT 0,
    file_path TEXT
  );

  CREATE TABLE IF NOT EXISTS packets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    direction TEXT,
    type TEXT,
    size INTEGER,
    payload_preview TEXT
  );

  CREATE TABLE IF NOT EXISTS transfer_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    bytes_transferred INTEGER,
    speed_bps INTEGER
  );

  INSERT INTO stats (id, total_files, total_bytes)
  SELECT 1, 0, 0
  WHERE NOT EXISTS (SELECT 1 FROM stats WHERE id = 1);
`);

module.exports = db;
