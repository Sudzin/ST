require("dotenv").config();

const http = require("http");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const FILE_SERVER_URL = "http://localhost:3000/api/ping";
const INTERVAL_MS = 100000; // чтобы не заполняло консоль
const ADMIN_SERVER_PORT = 3001;
const db = require("../file-server/src/db.js");
const JWT_SECRET = process.env.JWT_SECRET;

let adminServerOnline = false;

if (!JWT_SECRET) {
  throw new Error("JWT token not found");
}
//console.log(`Начинаю пинговать файловый сервер: ${FILE_SERVER_URL}\n`);

function checkFileServer() {
  http
    .get(FILE_SERVER_URL, (res) => {
      if (res.statusCode === 200) {
        console.log(
          `[${new Date().toLocaleTimeString()}] -> Файловый сервер работает (Код: 200)`,
        );
      } else {
        console.log(
          `[${new Date().toLocaleTimeString()}] -> Сервер ответил (Код: ${res.statusCode})`,
        );
      }
    })
    .on("error", (err) => {
      console.log(
        `[${new Date().toLocaleTimeString()}] -> Сервер 3000 отключен. Ошибка: ${err.message}`,
      );
    });
}

setInterval(checkFileServer, INTERVAL_MS);
checkFileServer();

const adminServer = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5174");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/api/login" && req.method === "POST") {
    let body = ""; // тело запроса

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { username, password } = JSON.parse(body);
        console.log("[Admin Server] Получен запрос на вход:", username);
        const user = db
          .prepare("SELECT * FROM users WHERE username = ?")
          .get(username);

        if (!user) {
          console.log("[Admin Server] Пользователь не найден");
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid credentials" }));
          return;
        }

        const passValidation = await bcrypt.compare(
          password,
          user.password_hash,
        );
        if (!passValidation) {
          console.log("[Admin Server] Ошибка авторизации: Неверный пароль");
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid credentials" }));
          return;
        }

        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: "24h" },
        );

        // место под логирование

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            token,
            user: { id: user.id, username: user.username, role: user.role },
          }),
        );
      } catch (error) {
        console.error("[Admin Server] Ошибка авторизации:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Внутренняя ошибка сервера" }));
      }
    });
    return;
  }

  if (req.url === "/api/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });

    res.end(JSON.stringify({ status: "ok" }));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

adminServer.listen(ADMIN_SERVER_PORT, () => {
  console.log(
    `[Administration server] Работает на http://localhost:${ADMIN_SERVER_PORT}`,
  );
  console.log(`Начинаю пинговать файловый сервер: ${FILE_SERVER_URL}\n`);
});

//setInterval(checkFileServer, INTERVAL_MS);
//checkFileServer();
