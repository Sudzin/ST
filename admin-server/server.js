const http = require("http");

const FILE_SERVER_URL = "http://localhost:3000/api/ping";
const INTERVAL_MS = 5000;

console.log(`Начинаю пинговать файловый сервер: ${FILE_SERVER_URL}\n`);

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
