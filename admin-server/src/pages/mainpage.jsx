import React, { useState, useEffect } from "react";

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
    <div
      style={{
        color: "#fff",
        background: "#121212",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h1>mainpage.jsx</h1>
    </div>
  );
}
