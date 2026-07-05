const { spawn } = require("child_process");
const waitOn = require("wait-on");

const server = spawn("npx", ["nodemon", "server.js"], {
  stdio: "inherit",
  shell: true,
});

waitOn({ resources: ["http://localhost:3001/api/health"], timeout: 15000 })
  .then(() => {
    console.log("\n[Tests] Сервер готов, запускаю тесты...\n");

    const tests = spawn("node", ["--test", "tests/api.tests.js"], {
      stdio: "inherit",
      shell: true,
    });

    tests.on("exit", (code) => {
      console.log(
        `\n[Tests] Тесты завершены (код ${code}). Сервер продолжает работать.\n`,
      );
    });
  })
  .catch((err) => {
    console.error("[Tests] Сервер не поднялся вовремя:", err.message);
  });

process.on("SIGINT", () => {
  server.kill();
  process.exit();
});
