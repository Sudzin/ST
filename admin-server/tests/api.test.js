require("dotenv").config();
const test = require("node:test");
const db = require("../src/db.js");
const assert = require("node:assert/strict");

const BASE_URL = "http://localhost:3001";
const SERVICE_KEY = process.env.SERVICE_KEY;

let adminToken;

test.before(async () => {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin" }),
  });
  const data = await res.json();
  adminToken = data.token;
  assert.ok(adminToken, "Не удалось зайти за админа перед тестами");
});

test("сервер отвечает на /api/health", async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.equal(res.status, 200);
});

test("логин с неверным паролем возвращает 401", async () => {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "wrong" }),
  });
  assert.equal(res.status, 401);
});

test("логин с верным паролем возвращает токен", async () => {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin" }),
  });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.ok(data.token, "Не удалось получить токен после успешного логина");
});

test("/api/events/log без ключа возвращает 401", async () => {
  const res = await fetch(`${BASE_URL}/api/events/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: 1,
      username: "test",
      action: "test_action",
    }),
  });
  assert.equal(res.status, 401);
});

test("/api/events/log с вернымм ключом делает запись", async () => {
  const res = await fetch(`${BASE_URL}/api/events/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-service-key": SERVICE_KEY,
    },
    body: JSON.stringify({
      user_id: 1,
      username: "test_user",
      action: "test_action",
      details: "для теста",
    }),
  });
  assert.equal(res.status, 200);

  const row = db
    .prepare("SELECT * FROM logs WHERE action = ? ORDER BY id DESC LIMIT 1")
    .get("test_action");
  assert.ok(
    row,
    "Не удалось получить запись из базы данных после успешного логина",
  );
  assert.equal(row.username, "test_user");
});
