import React, { useState, useEffect } from "react";

const pageStyle = {
  color: "#f5f5f5",
  background: "#121212",
  minHeight: "100vh",
  padding: "20px",
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

const cardLaberStyle = {
  color: "#888",
  fontSize: "32px",
  marginBottom: "8px",
};

const cardValueStyle = {
  fontSize: "32px",
  fontWeight: "bold",
};

export default function MainPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    fetch("http://localhost:3001/api/admin/stats", {
      headers: { Authorization: `Bearee ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error("Не удалось загрузить статистику: ", err);
        setError("Не удалось загрузить статистику");
      });
  }, []);

  return (
    <div style={pageStyle}>
      <h1>Панель администрирования</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {!stats && error && <p>Загрузка...</p>}

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
