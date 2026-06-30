import db from "./src/db.js";
import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  console.log("Uploads directory does not exist.");
  process.exit(1);
}

const files = fs.readdirSync(uploadsDir);
let importedCount = 0;

console.log(`Found ${files.length} files in uploads directory.`);

// Получите существующие пути к файлам из базы данных
const existingPaths = new Set(
  db
    .prepare("SELECT file_path FROM transfers WHERE file_path IS NOT NULL")
    .all()
    .map((row: any) => row.file_path),
);

// Поличить юзер ид
const adminUser = db
  .prepare('SELECT id FROM users WHERE role = "admin"')
  .get() as any;
const defaultUserId = adminUser ? adminUser.id : 1;

files.forEach((file) => {
  const filePath = path.join(uploadsDir, file);

  // Если есть пропускаем
  if (existingPaths.has(filePath)) {
    return;
  }

  try {
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      // Сгенерировать случайный идентификатор файла
      const fileId = Math.floor(Math.random() * 1000000);

      // Извлечь исходное имя файла
      let originalFilename = file;
      if (file.includes("_")) {
        const parts = file.split("_");
        if (parts.length > 1 && !isNaN(parseInt(parts[0]))) {
          originalFilename = parts.slice(1).join("_");
        }
      }

      db.prepare(
        `
        INSERT INTO transfers (file_id, filename, user_id, total_size, status, file_path, start_time, end_time, transferred_size)
        VALUES (?, ?, ?, ?, 'completed', ?, datetime('now'), datetime('now'), ?)
      `,
      ).run(
        fileId.toString(),
        originalFilename,
        defaultUserId,
        stats.size,
        filePath,
        stats.size,
      );

      console.log(`Imported: ${file} as ${originalFilename}`);
      importedCount++;
    }
  } catch (err) {
    console.error(`Failed to import ${file}:`, err);
  }
});

console.log(`\nImport complete. ${importedCount} new files added to database.`);
if (importedCount > 0) {
  db.prepare(
    "UPDATE stats SET total_files = total_files + ?, total_bytes = total_bytes + (SELECT SUM(total_size) FROM transfers WHERE id > (SELECT MAX(id) - ? FROM transfers)) WHERE id = 1",
  ).run(importedCount, importedCount);
}
