const http = require("http");

const FILE_SERVER_URL = "http://localhost:3000/api/ping";
const INTERVAL_MS = 100000; // чтобы не заполняло консоль
const ADMIN_SERVER_PORT = 3001;

let adminServerOnline = false;

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
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
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
