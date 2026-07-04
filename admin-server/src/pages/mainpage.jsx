import React, { useState, useEffect } from "react";

const pageStyle = {
  color: "#f5f5f5",
  background: "#121212",
  minHeight: "100vh",
  padding: "40px",
  fontFamily: "sans-serif",
  boxSizing: "border-box",
};

const cardsContainerStyle = {
  display: "flex",
  gap: "20px",
  flexWrap: "wrap",
};

const cardStyle = {
  background: "#1e1e1e",
  padding: "24px",
  borderRadius: "12px",
  minWidth: "200px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
};

const cardLabelStyle = {
  color: "#888",
  fontSize: "14px",
  marginBottom: "8px",
};

const cardValueStyle = {
  fontSize: "32px",
  fontWeight: "bold",
};

const tableContainerStyle = {
  marginTop: "40px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#1e1e1e",
  borderRadius: "12px",
  overflow: "hidden",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  color: "#888",
  fontSize: "14px",
  borderBottom: "1px solid #333",
};

const tdStyle = {
  padding: "12px 16px",
  borderBottom: "1px solid #2a2a2a",
};

const statusBadgeStyle = (status) => ({
  padding: "4px 10px",
  borderRadius: "6px",
  fontSize: "13px",
  display: "inline-block",
  background:
    status === "completed"
      ? "#1f4d2e"
      : status === "failed"
        ? "#4d1f1f"
        : "#4d451f",
  color:
    status === "completed"
      ? "4ade80"
      : status === "failed"
        ? "facc15"
        : "#facc15",
});

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

export default function MainPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [transfer, setTransfer] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    fetch("http://localhost:3001/api/admin/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error("Не удалось загрузить статистику:", err);
        setError("Не удалось загрузить статистику");
      });
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    fetch("http://localhost:3001/api/admin/transfers", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setTransfer(data);
      })
      .catch((err) => {
        console.error("Не удалось загрузить трансферы:", err);
      });
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    fetch("http://localhost:3001/api/admin/logs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setLogs(data))
      .catch((err) => {
        console.error("Не удалось загрузить логи:", err);
      });
  }, []);

  return (
    <div style={pageStyle}>
      <h1>Панель администратора</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!stats && !error && <p>Загрузка...</p>}

      {stats && (
        <div style={cardsContainerStyle}>
          <div style={cardStyle}>
            <div style={cardLabelStyle}>Передано файлов</div>
            <div style={cardValueStyle}>{stats.totalFiles}</div>
          </div>
          <div style={cardStyle}>
            <div style={cardLabelStyle}>Общий трафик</div>
            <div style={cardValueStyle}>{formatBytes(stats.totalBytes)}</div>
          </div>
          <div style={cardStyle}>
            <div style={cardLabelStyle}>Ошибок передачи</div>
            <div style={cardValueStyle}>{stats.totalErrors}</div>
          </div>
        </div>
      )}

      <div style={tableContainerStyle}>
        <h2>История передач</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Файл</th>
              <th style={thStyle}>Размер</th>
              <th style={thStyle}>Статус</th>
              <th style={thStyle}>Начало</th>
            </tr>
          </thead>
          <tbody>
            {transfer.map((t) => (
              <tr key={t.id}>
                <td style={tdStyle}>{t.filename}</td>
                <td style={tdStyle}>{formatBytes(t.total_size)}</td>
                <td style={tdStyle}>
                  <span style={statusBadgeStyle(t.status)}>{t.status}</span>
                </td>
                <td style={tdStyle}>
                  {new Date(t.start_time).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={tableContainerStyle}>
        <h2>Системные логи</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Пользователь</th>
              <th style={thStyle}>Действие</th>
              <th style={thStyle}>Детали</th>
              <th style={thStyle}>Время</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={tdStyle}>{log.username}</td>
                <td style={tdStyle}>{log.action}</td>
                <td style={tdStyle}>{log.details}</td>
                <td style={tdStyle}>
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
