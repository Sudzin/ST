const ADMIN_URL = process.env.ADMIN_SERVER_URL || "http://localhost:3001";

export function reportToAdmin(path, data) {
  const serviceKey = process.env.SERVICE_KEY;

  fetch(`${ADMIN_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-service-key": serviceKey,
    },
    body: JSON.stringify(data),
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        console.error(
          `[AdminReporter] Admin-server ответил с ошибкой ${response.status}:`,
          text,
        );
      }
    })
    .catch((err) => {
      console.error(
        "[AdminReporter] Не удалось отправить событие:",
        err.message,
      );
    });
}
