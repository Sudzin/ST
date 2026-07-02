import Database from 'better-sqlite3';
try {
  const db = new Database('test.db');
  db.pragma('journal_mode = WAL');
  console.log('DB works');
} catch (e) {
  console.error('DB error', e);
}
