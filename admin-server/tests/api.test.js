require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert/strict");
const db = require("../src/db.js");

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
  assert.ok(adminToken, "Не удалось залогиниться как admin перед тестами");
});

test("логин с неверным паролем возвращает 401", async () => {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "wrong_password" }),
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
  assert.ok(data.token);
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

test("/api/events/log с верным ключом создаёт запись в базе", async () => {
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
      details: "created by automated test",
    }),
  });
  assert.equal(res.status, 200);

  const row = db
    .prepare("SELECT * FROM logs WHERE action = ? ORDER BY id DESC LIMIT 1")
    .get("test_action");
  assert.ok(row, "Запись не найдена в базе");
  assert.equal(row.username, "test_user");
});

test("/api/admin/users без токена возвращает 401", async () => {
  const res = await fetch(`${BASE_URL}/api/admin/users`);
  assert.equal(res.status, 401);
});

test("создание пользователя с существующим именем возвращает 400", async () => {
  const res = await fetch(`${BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ username: "admin", password: "irrelevant" }),
  });
  assert.equal(res.status, 400);
});

test("удаление самого себя возвращает 400", async () => {
  const me = db.prepare("SELECT id FROM users WHERE username = ?").get("admin");

  const res = await fetch(`${BASE_URL}/api/admin/users/${me.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(res.status, 400);
});

test("полный цикл создания и удаления тестового пользователя", async () => {
  const createRes = await fetch(`${BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      username: "temp_test_user",
      password: "temp123",
      role: "admin",
    }),
  });
  const created = await createRes.json();
  assert.equal(createRes.status, 200);
  assert.ok(created.id);

  const deleteRes = await fetch(`${BASE_URL}/api/admin/users/${created.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(deleteRes.status, 200);
});
