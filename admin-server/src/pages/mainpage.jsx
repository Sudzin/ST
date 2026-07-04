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
    </div>
  );
}
