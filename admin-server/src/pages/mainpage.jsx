import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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
      ? "#4ade80"
      : status === "failed"
        ? "#facc15"
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

function formatDate(timestamp) {
  return new Date(timestamp + "Z").toLocaleString();
}

export default function MainPage({ onLogout }) {
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const isFullAdmin = currentUser.role === "admin";

  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [transfer, setTransfer] = useState([]);
  const [logs, setLogs] = useState([]);
  const [onlineUser, setOnlineUser] = useState([]);
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectTransfer, setSelectTransfer] = useState(null);

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

    const fetchTransfers = () => {
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
    };

    fetchTransfers();
    const interval = setInterval(fetchTransfers, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    const fetchLogs = () => {
      fetch("http://localhost:3001/api/admin/logs", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setLogs(data))
        .catch((err) => {
          console.error("Не удалось загрузить логи:", err);
        });
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    const fetchConnectons = () => {
      fetch("http://localhost:3001/api/admin/connections", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setOnlineUser(data);
        })
        .catch((err) => {
          console.log("Не удалось загрузить подключения: ", error);
        });
    };

    fetchConnectons();
    const interval = setInterval(fetchConnectons, 3000);

    return () => clearInterval(interval);
  }, [error]);

  const fetchUsers = () => {
    const token = sessionStorage.getItem("token");

    fetch("http://localhost:3001/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Не удалось загрузить пользователей", err);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = () => {
    if (!newUsername || !newPassword) {
      alert("Запомните логин и пароль");
      return;
    }

    const token = sessionStorage.getItem("token");

    fetch("http://localhost:3001/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: newUsername,
        password: newPassword,
        role: "admin",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNewUsername("");
          setNewPassword("");
          fetchUsers();
        } else {
          alert(data.error || "Не удалось создать пользователя");
        }
      })
      .catch((err) => {
        console.error("Не удалось создать пользователя", err);
      });
  };

  const handleDeleteUser = (id) => {
    const confirmed = window.confirm("Удалить пользователя?");
    if (!confirmed) return;
    const token = sessionStorage.getItem("token");

    fetch(`http://localhost:3001/api/admin/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers((prev) => prev.filter((u) => u.id !== id));
        } else {
          alert(data.error || "Не удалось удалить пользователя");
        }
      })
      .catch((err) => {
        console.error("Не удалось удалить пользователя", err);
      });
  };

  const handleToggleRole = (user) => {
    const newRole = user.role === "admin" ? "moderator" : "admin";
    const token = sessionStorage.getItem("token");

    fetch(`http://localhost:3001/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: newRole }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
          );
        } else {
          alert(data.error || "Не удалось изменить роль");
        }
      })
      .catch((err) => {
        console.error("Не удалось изменить роль", err);
      });
  };

  const handleDeleteTransfer = (id) => {
    const confirmed = window.confirm("Удалить эту запись из истории?");
    if (!confirmed) return;

    const token = sessionStorage.getItem("token");

    fetch(`http://localhost:3001/api/admin/transfers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTransfer((prev) => prev.filter((t) => t.id !== id));
        }
      })
      .catch((err) => {
        console.error("Не удалось удалить запись:", err);
      });
  };

  const handleViewDetails = (id) => {
    const token = sessionStorage.getItem("token");

    fetch(`http://localhost:3001/api/admin/transfers/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setSelectTransfer(data);
      })
      .catch((err) => {
        console.error("Не удалось получить детали передачи:", err);
      });
  };

  return (
    <div style={pageStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Панель администратора</h1>
        <button
          onClick={onLogout}
          style={{
            background: "#4d1f1f",
            color: "#f87171",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Выйти
        </button>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h2>Сейчас в сети</h2>
        {onlineUser.length === 0 && (
          <p style={{ color: "#888" }}>Нет подключений</p>
        )}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {onlineUser.map((u) => (
            <div
              key={u.user_id}
              style={{
                background: "#1e1e1e",
                padding: "12px 20px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#4ade80",
                  flexShrink: 0,
                }}
              ></span>
              {u.username}
            </div>
          ))}
        </div>
      </div>

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
              <th style={thStyle}>Действия</th>
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
                <td style={tdStyle}>{formatDate(t.start_time)}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleViewDetails(t.id)}
                    style={{
                      background: "#1f2d4d",
                      color: "#60a5fa",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      cursor: "pointer",
                      marginRight: "8px",
                    }}
                  >
                    Подробнее
                  </button>
                  {isFullAdmin && (
                    <button
                      onClick={() => handleDeleteTransfer(t.id)}
                      style={{
                        background: "#4d1f1f",
                        color: "#f87171",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        cursor: "pointer",
                      }}
                    >
                      Удалить
                    </button>
                  )}
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
                <td style={tdStyle}>{formatDate(log.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={tableContainerStyle}>
        <h2>Пользователи-администраторы</h2>

        {isFullAdmin && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Имя пользователя"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #333",
                background: "#1e1e1e",
                color: "#fff",
              }}
            />
            <input
              type="password"
              placeholder="Пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #333",
                background: "#1e1e1e",
                color: "#fff",
              }}
            />
            <button
              onClick={handleCreateUser}
              style={{
                background: "#1f4d2e",
                color: "#4ade80",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              Создать
            </button>
          </div>
        )}

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Имя</th>
              <th style={thStyle}>Роль</th>
              <th style={thStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={tdStyle}>{u.username}</td>
                <td style={tdStyle}>{u.role}</td>
                <td style={tdStyle}>
                  {isFullAdmin && (
                    <>
                      <button
                        onClick={() => handleToggleRole(u)}
                        style={{
                          background: "#1f2d4d",
                          color: "#60a5fa",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          cursor: "pointer",
                          marginRight: "8px",
                        }}
                      >
                        Сменить роль
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        style={{
                          background: "#4d1f1f",
                          color: "#f87171",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          cursor: "pointer",
                        }}
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectTransfer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setSelectTransfer(null)}
        >
          <div
            style={{
              background: "#1e1e1e",
              padding: "30px",
              borderRadius: "12px",
              width: "700px",
              maxWidth: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2>{selectTransfer.transfer.filename}</h2>
              <button
                onClick={() => setSelectTransfer(null)}
                style={{
                  background: "transparent",
                  color: "#888",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <p style={{ color: "#888" }}>
              Размер: {formatBytes(selectTransfer.transfer.total_size)} ·
              Статус: {selectTransfer.transfer.status}
            </p>

            <h3>Скорость передачи</h3>

            {selectTransfer.metrics.length === 0 ? (
              <p style={{ color: "#888" }}>Недостаточно данных для графика</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={selectTransfer.metrics.map((m, index) => ({
                    index,
                    speedKBs: Math.round(m.speed_bps / 1024),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="index"
                    stroke="#888"
                    label={{
                      value: "Секунды",
                      position: "insideBottom",
                      offset: -5,
                      fill: "#888",
                    }}
                  />
                  <YAxis
                    stroke="#888"
                    label={{
                      value: "KB/s",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#888",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#121212",
                      border: "1px solid #333",
                    }}
                    formatter={(value) => [`${value} KB/s`, "Скорость"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="speedKBs"
                    stroke="#4ade80"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
