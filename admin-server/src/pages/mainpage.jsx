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
import {
  Activity,
  Wifi,
  HardDrive,
  FolderCheck,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Eye,
  Trash2,
  UserPlus,
  Shield,
  ShieldCheck,
  Repeat,
  X,
  ScrollText,
  Users as UsersIcon,
  Gauge,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

const colors = {
  bg: "#0b0b0c",
  surface: "#161617",
  surface2: "#1e1e20",
  border: "#2a2a2d",
  text: "#eef0ee",
  textMuted: "#8b8b8f",
  accent: "#fbb931",
  accentDim: "rgba(251, 185, 49, 0.12)",
  danger: "#c97b73",
  dangerDim: "rgba(201, 123, 115, 0.12)",
};

const fontStack =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const pageStyle = {
  color: colors.text,
  background: colors.bg,
  minHeight: "100vh",
  fontFamily: fontStack,
  boxSizing: "border-box",
};

const containerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "32px 24px 80px",
};

const cardStyle = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: "12px",
  padding: "20px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  textAlign: "left",
  padding: "10px 16px",
  color: colors.textMuted,
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  borderBottom: `1px solid ${colors.border}`,
};

const tdStyle = {
  padding: "14px 16px",
  borderBottom: `1px solid ${colors.border}`,
  fontSize: "14px",
};

function IconButton({ icon: Icon, label, onClick, variant = "ghost" }) {
  const [hover, setHover] = useState(false);

  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    border: "none",
    borderRadius: "8px",
    padding: "7px 12px",
    fontSize: "13px",
    fontFamily: fontStack,
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease",
  };

  const variants = {
    ghost: {
      background: hover ? colors.surface2 : "transparent",
      color: hover ? colors.text : colors.textMuted,
    },
    accent: {
      background: hover ? "#e0a72b" : colors.accent,
      color: "#1a1200",
      fontWeight: 600,
    },
    danger: {
      background: hover ? colors.dangerDim : "transparent",
      color: colors.danger,
    },
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...variants[variant] }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function StatusTag({ status }) {
  const map = {
    completed: { icon: CheckCircle2, label: "completed", color: colors.accent },
    failed: { icon: XCircle, label: "failed", color: colors.danger },
    in_progress: {
      icon: Loader2,
      label: "in progress",
      color: colors.textMuted,
    },
  };
  const entry = map[status] || map.in_progress;
  const Icon = entry.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        color: entry.color,
        fontSize: "13px",
      }}
    >
      <Icon size={14} />
      {entry.label}
    </span>
  );
}

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

const TABS = [
  { id: "overview", label: "Обзор", icon: Gauge },
  { id: "transfers", label: "Передачи", icon: HardDrive },
  { id: "logs", label: "Логи", icon: ScrollText },
  { id: "users", label: "Пользователи", icon: UsersIcon },
];

export default function MainPage({ onLogout }) {
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const isFullAdmin = currentUser.role === "admin";

  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [transfer, setTransfer] = useState([]);
  const [logs, setLogs] = useState([]);
  const [onlineUser, setOnlineUser] = useState([]);
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectTransfer, setSelectTransfer] = useState(null);

  const authHeader = () => ({
    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
  });

  const fetchStats = () => {
    fetch("http://localhost:3001/api/admin/stats", { headers: authHeader() })
      .then((res) => res.json())
      .then(setStats)
      .catch((err) => {
        console.error("Не удалось загрузить статистику:", err);
        setError("Не удалось загрузить статистику");
      });
  };

  const fetchTransfers = () => {
    fetch("http://localhost:3001/api/admin/transfers", {
      headers: authHeader(),
    })
      .then((res) => res.json())
      .then(setTransfer)
      .catch((err) => console.error("Не удалось загрузить трансферы:", err));
  };

  const fetchLogs = () => {
    fetch("http://localhost:3001/api/admin/logs", { headers: authHeader() })
      .then((res) => res.json())
      .then(setLogs)
      .catch((err) => console.error("Не удалось загрузить логи:", err));
  };

  const fetchConnections = () => {
    fetch("http://localhost:3001/api/admin/connections", {
      headers: authHeader(),
    })
      .then((res) => res.json())
      .then(setOnlineUser)
      .catch((err) => console.error("Не удалось загрузить подключения:", err));
  };

  const fetchUsers = () => {
    fetch("http://localhost:3001/api/admin/users", { headers: authHeader() })
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) =>
        console.error("Не удалось загрузить пользователей:", err),
      );
  };

  const refreshAll = () => {
    fetchStats();
    fetchTransfers();
    fetchLogs();
    fetchConnections();
    fetchUsers();
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTransfers();
    const i = setInterval(fetchTransfers, 3000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    fetchLogs();
    const i = setInterval(fetchLogs, 3000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    fetchConnections();
    const i = setInterval(fetchConnections, 3000);
    return () => clearInterval(i);
  }, []);

  const handleCreateUser = () => {
    if (!newUsername || !newPassword) {
      alert("Укажите логин и пароль");
      return;
    }
    fetch("http://localhost:3001/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
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
      .catch((err) => console.error("Не удалось создать пользователя:", err));
  };

  const handleDeleteUser = (id) => {
    if (!window.confirm("Удалить пользователя?")) return;
    fetch(`http://localhost:3001/api/admin/users/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers((prev) => prev.filter((u) => u.id !== id));
        else alert(data.error || "Не удалось удалить пользователя");
      })
      .catch((err) => console.error("Не удалось удалить пользователя:", err));
  };

  const handleToggleRole = (user) => {
    const newRole = user.role === "admin" ? "moderator" : "admin";
    fetch(`http://localhost:3001/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader() },
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
      .catch((err) => console.error("Не удалось изменить роль:", err));
  };

  const handleDeleteTransfer = (id) => {
    if (!window.confirm("Удалить эту запись из истории?")) return;
    fetch(`http://localhost:3001/api/admin/transfers/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success)
          setTransfer((prev) => prev.filter((t) => t.id !== id));
      })
      .catch((err) => console.error("Не удалось удалить запись:", err));
  };

  const handleViewDetails = (id) => {
    fetch(`http://localhost:3001/api/admin/transfers/${id}`, {
      headers: authHeader(),
    })
      .then((res) => res.json())
      .then(setSelectTransfer)
      .catch((err) =>
        console.error("Не удалось получить детали передачи:", err),
      );
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "9px",
                background: colors.accentDim,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Activity size={18} color={colors.accent} />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 600 }}>
                Панель администратора
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: colors.textMuted,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {isFullAdmin ? <ShieldCheck size={12} /> : <Shield size={12} />}
                {currentUser.username} · {currentUser.role}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <IconButton
              icon={RefreshCw}
              label="Обновить"
              onClick={refreshAll}
            />
            <IconButton
              icon={LogOut}
              label="Выйти"
              onClick={onLogout}
              variant="danger"
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "4px",
            borderBottom: `1px solid ${colors.border}`,
            marginBottom: "28px",
          }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "10px 16px",
                  background: "transparent",
                  border: "none",
                  borderBottom: active
                    ? `2px solid ${colors.accent}`
                    : "2px solid transparent",
                  color: active ? colors.text : colors.textMuted,
                  fontSize: "14px",
                  fontFamily: fontStack,
                  cursor: "pointer",
                  marginBottom: "-1px",
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {error && (
          <p style={{ color: colors.danger, fontSize: "14px" }}>{error}</p>
        )}

        {activeTab === "overview" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <Wifi size={16} color={colors.textMuted} />
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    margin: 0,
                    color: colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Сейчас в сети ({onlineUser.length})
                </h2>
              </div>
              {onlineUser.length === 0 ? (
                <p style={{ color: colors.textMuted, fontSize: "14px" }}>
                  Никого нет в сети
                </p>
              ) : (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {onlineUser.map((u) => (
                    <div
                      key={u.user_id}
                      style={{
                        ...cardStyle,
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: colors.accent,
                        }}
                      />
                      {u.username}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {stats && (
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ ...cardStyle, flex: 1, minWidth: "200px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: colors.textMuted,
                      fontSize: "13px",
                      marginBottom: "10px",
                    }}
                  >
                    <FolderCheck size={15} />
                    Передано файлов
                  </div>
                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: 700,
                      color: colors.accent,
                    }}
                  >
                    {stats.totalFiles}
                  </div>
                </div>
                <div style={{ ...cardStyle, flex: 1, minWidth: "200px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: colors.textMuted,
                      fontSize: "13px",
                      marginBottom: "10px",
                    }}
                  >
                    <HardDrive size={15} />
                    Общий трафик
                  </div>
                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: 700,
                      color: colors.accent,
                    }}
                  >
                    {formatBytes(stats.totalBytes)}
                  </div>
                </div>
                <div style={{ ...cardStyle, flex: 1, minWidth: "200px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: colors.textMuted,
                      fontSize: "13px",
                      marginBottom: "10px",
                    }}
                  >
                    <AlertTriangle size={15} />
                    Ошибок передачи
                  </div>
                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: 700,
                      color:
                        stats.totalErrors > 0 ? colors.danger : colors.text,
                    }}
                  >
                    {stats.totalErrors}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "transfers" && (
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
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
                    <td style={{ ...tdStyle, color: colors.textMuted }}>
                      {formatBytes(t.total_size)}
                    </td>
                    <td style={tdStyle}>
                      <StatusTag status={t.status} />
                    </td>
                    <td style={{ ...tdStyle, color: colors.textMuted }}>
                      {formatDate(t.start_time)}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <IconButton
                          icon={Eye}
                          label=""
                          onClick={() => handleViewDetails(t.id)}
                        />
                        {isFullAdmin && (
                          <IconButton
                            icon={Trash2}
                            label=""
                            onClick={() => handleDeleteTransfer(t.id)}
                            variant="danger"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {transfer.length === 0 && (
                  <tr>
                    <td
                      style={{ ...tdStyle, color: colors.textMuted }}
                      colSpan={5}
                    >
                      Пока нет ни одной передачи
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "logs" && (
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
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
                    <td style={{ ...tdStyle, color: colors.accent }}>
                      {log.action}
                    </td>
                    <td style={{ ...tdStyle, color: colors.textMuted }}>
                      {log.details}
                    </td>
                    <td style={{ ...tdStyle, color: colors.textMuted }}>
                      {formatDate(log.timestamp)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      style={{ ...tdStyle, color: colors.textMuted }}
                      colSpan={4}
                    >
                      Логов пока нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "users" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {isFullAdmin && (
              <div
                style={{
                  ...cardStyle,
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  placeholder="Имя пользователя"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${colors.border}`,
                    background: colors.surface2,
                    color: colors.text,
                    fontFamily: fontStack,
                    fontSize: "14px",
                    flex: 1,
                  }}
                />
                <input
                  type="password"
                  placeholder="Пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${colors.border}`,
                    background: colors.surface2,
                    color: colors.text,
                    fontFamily: fontStack,
                    fontSize: "14px",
                    flex: 1,
                  }}
                />
                <IconButton
                  icon={UserPlus}
                  label="Создать"
                  onClick={handleCreateUser}
                  variant="accent"
                />
              </div>
            )}

            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
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
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            color:
                              u.role === "admin"
                                ? colors.accent
                                : colors.textMuted,
                          }}
                        >
                          {u.role === "admin" ? (
                            <ShieldCheck size={14} />
                          ) : (
                            <Shield size={14} />
                          )}
                          {u.role}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {isFullAdmin && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <IconButton
                              icon={Repeat}
                              label=""
                              onClick={() => handleToggleRole(u)}
                            />
                            <IconButton
                              icon={Trash2}
                              label=""
                              onClick={() => handleDeleteUser(u.id)}
                              variant="danger"
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectTransfer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setSelectTransfer(null)}
        >
          <div
            style={{
              ...cardStyle,
              width: "700px",
              maxWidth: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              padding: "28px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                {selectTransfer.transfer.filename}
              </h2>
              <IconButton
                icon={X}
                label=""
                onClick={() => setSelectTransfer(null)}
              />
            </div>

            <p
              style={{
                color: colors.textMuted,
                fontSize: "13px",
                marginBottom: "20px",
              }}
            >
              {formatBytes(selectTransfer.transfer.total_size)} ·{" "}
              <StatusTag status={selectTransfer.transfer.status} />
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <Activity size={15} color={colors.accent} />
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
                Скорость передачи
              </h3>
            </div>

            {selectTransfer.metrics.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: "14px" }}>
                Недостаточно данных для графика
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={selectTransfer.metrics.map((m, index) => ({
                    index,
                    speedKBs: Math.round(m.speed_bps / 1024),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis
                    dataKey="index"
                    stroke={colors.textMuted}
                    label={{
                      value: "Секунды",
                      position: "insideBottom",
                      offset: -5,
                      fill: colors.textMuted,
                    }}
                  />
                  <YAxis
                    stroke={colors.textMuted}
                    label={{
                      value: "KB/s",
                      angle: -90,
                      position: "insideLeft",
                      fill: colors.textMuted,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: colors.surface2,
                      border: `1px solid ${colors.border}`,
                    }}
                    formatter={(v) => [`${v} KB/s`, "Скорость"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="speedKBs"
                    stroke={colors.accent}
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
