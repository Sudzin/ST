const bcrypt = require("bcryptjs");
const db = require("../src/db.js");

async function seedAdmin() {
  const existing = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get("admin");
  if (existing) {
    console.log('Пользователь "admin" уже существует');
    return;
  }

  const hash = await bcrypt.hash("admin", 10);
  db.prepare(
    "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
  ).run("admin", hash, "admin");
  console.log('Создан пользователь "admin" с паролем "admin"');
}

seedAdmin();
