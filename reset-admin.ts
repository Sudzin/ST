import db from "./src/db.js";
import bcrypt from "bcryptjs";

async function resetAdmin() {
  const hash = await bcrypt.hash("admin", 10);

  // Есть ли админ
  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get("admin");

  if (user) {
    db.prepare("UPDATE users SET password_hash = ? WHERE username = ?").run(
      hash,
      "admin",
    );
    console.log('Password for user "admin" reset to "admin"');
  } else {
    // Создать если ещё нет
    db.prepare(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
    ).run("admin", hash, "admin");
    console.log('Created user "admin" with password "admin"');
  }
}

resetAdmin();
