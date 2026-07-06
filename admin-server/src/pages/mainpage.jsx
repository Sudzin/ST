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
  FileArchive,
  FileVideo,
  FileImage,
  FileText,
  File as FileIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const colors = {
  bg: "#0b0b0c",
  surface: "#161617",
  surface2: "#1e1e20",
  border: "#2a2a2d",
  text: "#eef0ee",
  textMuted: "#8b8b8f",
  accent: "#fbb931",
  accentDim: "rgba(251, 185, 49, 0.14)",
  danger: "#c97b73",
  dangerDim: "rgba(201, 123, 115, 0.12)",
};

const fontStack =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const SIDEBAR_WIDTH = 232;

const cardStyle = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: "12px",
  padding: "20px",
};

const tableStyle = { width: "100%", borderCollapse: "collapse" };

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

function RingStat({ icon: Icon, label, value, percent, color }) {
  const [hover, setHover] = useState(false);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...cardStyle,
        flex: "1 1 200px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? `0 8px 20px rgba(251, 185, 49, 0.08)` : "none",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={colors.surface2}
          strokeWidth="7"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <foreignObject x="14" y="14" width="60" height="60">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Icon size={22} color={color} />
          </div>
        </foreignObject>
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "16px", fontWeight: 700 }}>{value}</div>
        <div
          style={{
            fontSize: "11px",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ currentUser, isFullAdmin, currentTime }) {
  const initials = currentUser.username
    ? currentUser.username.slice(0, 2).toUpperCase()
    : "??";
  const hour = currentTime.getHours();
  const greeting =
    hour < 6
      ? "Доброй ночи"
      : hour < 12
        ? "Доброе утро"
        : hour < 18
          ? "Добрый день"
          : "Добрый вечер";
  return (
    <div
      style={{
        ...cardStyle,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "16px",
        minWidth: "220px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: colors.accentDim,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: 700,
            color: colors.accent,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600 }}>
            {currentUser.username}
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
            {currentUser.role}
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: "13px", color: colors.textMuted }}>
          {greeting}
        </div>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {currentTime.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

function PixelHeading({ children }) {
  return (
    <div
      style={{
        display: "inline-block",
        border: `2px solid ${colors.accent}`,
        borderRadius: "10px",
        padding: "10px 24px",
        background: colors.surface,
      }}
    >
      <span
        style={{
          fontFamily: '"Courier New", monospace',
          fontWeight: 900,
          fontSize: "22px",
          letterSpacing: "4px",
          textTransform: "uppercase",
          color: colors.accent,
          textShadow: `2px 2px 0 rgba(251, 185, 49, 0.25), 4px 4px 0 rgba(0, 0, 0, 0.5)`,
        }}
      >
        {children}
      </span>
    </div>
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

function getFileIcon(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  if (["mp4", "mkv", "avi", "mov"].includes(ext)) return FileVideo;
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return FileImage;
  if (["pdf", "doc", "docx", "txt", "pkt"].includes(ext)) return FileText;
  return FileIcon;
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}ч ${m}м`;
}

function formatDate(timestamp) {
  return new Date(timestamp + "Z").toLocaleString();
}

const NAV_ITEMS = [
  { id: "overview", label: "Обзор", icon: Gauge },
  { id: "transfers", label: "Передачи", icon: HardDrive },
  { id: "logs", label: "Логи", icon: ScrollText },
  { id: "users", label: "Пользователи", icon: UsersIcon },
];

function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  isFullAdmin,
  onLogout,
  onRefresh,
}) {
  return (
    <div
      style={{
        width: SIDEBAR_WIDTH,
        height: "100vh",
        background: colors.surface,
        borderRight: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "20px 14px",
        boxSizing: "border-box",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "0 8px",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "9px",
            background: colors.accentDim,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Activity size={18} color={colors.accent} />
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: colors.text,
            lineHeight: 1.2,
          }}
        >
          Admin
          <br />
          <span
            style={{
              fontSize: "11px",
              color: colors.textMuted,
              fontWeight: 400,
            }}
          >
            Server Panel
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          flex: 1,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 10px",
                borderRadius: "8px",
                border: "none",
                background: active ? colors.accentDim : "transparent",
                color: active ? colors.accent : colors.textMuted,
                fontSize: "14px",
                fontFamily: fontStack,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                borderLeft: active
                  ? `2px solid ${colors.accent}`
                  : "2px solid transparent",
              }}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginBottom: "8px" }}>
        <IconButton icon={RefreshCw} label="Обновить" onClick={onRefresh} />
      </div>

      <div
        style={{
          borderTop: `1px solid ${colors.border}`,
          paddingTop: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: colors.textMuted,
            overflow: "hidden",
          }}
        >
          {isFullAdmin ? (
            <ShieldCheck size={14} color={colors.accent} />
          ) : (
            <Shield size={14} />
          )}
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentUser.username}
          </span>
        </div>
        <button
          onClick={onLogout}
          title="Выйти"
          style={{
            background: "transparent",
            border: "none",
            color: colors.danger,
            cursor: "pointer",
            padding: "6px",
            display: "flex",
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

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
  const [ping, setPing] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [logFilterUser, setLogFilterUser] = useState("");
  const [logFilterAction, setLogFilterAction] = useState("all");
  const [logFilterFrom, setLogFilterFrom] = useState("");
  const [logFilterTo, setLogFilterTo] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchPing = () => {
    fetch("http://localhost:3001/api/admin/ping", { headers: authHeader() })
      .then((res) => res.json())
      .then(setPing)
      .catch((err) => console.error("Не удалось получить пинг:", err));
  };

  const fetchUserStats = () => {
    fetch("http://localhost:3001/api/admin/user-stats", {
      headers: authHeader(),
    })
      .then((res) => res.json())
      .then(setUserStats)
      .catch((err) =>
        console.error("Не удалось получить статистику пользователей:", err),
      );
  };

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
    fetchPing();
    fetchUserStats();
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
  useEffect(() => {
    fetchPing();
    fetchUserStats();
    const i = setInterval(() => {
      fetchPing();
      fetchUserStats();
    }, 5000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    const i = setInterval(() => setCurrentTime(new Date()), 1000);
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
        } else alert(data.error || "Не удалось создать пользователя");
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
        if (data.success)
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
          );
        else alert(data.error || "Не удалось изменить роль");
      })
      .catch((err) => console.error("Не удалось изменить роль:", err));
  };

  const handleToggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    setExpandedId(id);
    fetch(`http://localhost:3001/api/admin/transfers/${id}`, {
      headers: authHeader(),
    })
      .then((res) => res.json())
      .then(setExpandedData)
      .catch((err) =>
        console.error("Не удалось получить детали передачи:", err),
      );
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

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action))).sort();

  const filteredLogs = logs.filter((log) => {
    if (
      logFilterUser &&
      !log.username.toLowerCase().includes(logFilterUser.toLowerCase())
    ) {
      return false;
    }
    if (logFilterAction !== "all" && log.action !== logFilterAction) {
      return false;
    }
    const logDate = new Date(log.timestamp + "Z");
    if (logFilterFrom && logDate < new Date(logFilterFrom)) {
      return false;
    }
    if (logFilterTo) {
      const toDate = new Date(logFilterTo);
      toDate.setHours(23, 59, 59, 999);
      if (logDate > toDate) return false;
    }
    return true;
  });

  return (
    <div
      style={{
        display: "flex",
        background: colors.bg,
        color: colors.text,
        fontFamily: fontStack,
        minHeight: "100vh",
      }}
    >
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        isFullAdmin={isFullAdmin}
        onLogout={onLogout}
        onRefresh={refreshAll}
      />

      <div
        style={{
          flex: 1,
          padding: "32px 36px 80px",
          minWidth: 0,
          marginLeft: SIDEBAR_WIDTH,
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <PixelHeading>
            {NAV_ITEMS.find((t) => t.id === activeTab)?.label}
          </PixelHeading>
        </div>

        {error && (
          <p style={{ color: colors.danger, fontSize: "14px" }}>{error}</p>
        )}

        {activeTab === "overview" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <ProfileCard
              currentUser={currentUser}
              isFullAdmin={isFullAdmin}
              currentTime={currentTime}
            />
            <RingStat
              icon={Wifi}
              label="file-server"
              value={
                ping
                  ? ping.fileServer.online
                    ? `${ping.fileServer.latencyMs} мс`
                    : "офлайн"
                  : "..."
              }
              percent={ping?.fileServer.online ? 100 : 0}
              color={ping?.fileServer.online ? colors.accent : colors.danger}
            />
            <RingStat
              icon={Activity}
              label="аптайм сервера"
              value={
                ping ? formatUptime(ping.adminServer.uptimeSeconds) : "..."
              }
              percent={
                ping ? Math.min(100, ping.adminServer.uptimeSeconds / 36) : 0
              }
              color={colors.accent}
            />
            <RingStat
              icon={UsersIcon}
              label="пользователей"
              value={userStats ? userStats.totalUniqueUsers : "..."}
              percent={
                userStats ? Math.min(100, userStats.totalUniqueUsers * 10) : 0
              }
              color={colors.accent}
            />
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
                    fontSize: "13px",
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

            {/* <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ ...cardStyle, flex: 1, minWidth: "220px" }}>
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
                  file-server
                </div>
                {ping ? (
                  <>
                    <div
                      style={{
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
                          background: ping.fileServer.online
                            ? colors.accent
                            : colors.danger,
                        }}
                      />
                      <span style={{ fontSize: "20px", fontWeight: 700 }}>
                        {ping.fileServer.online
                          ? `${ping.fileServer.latencyMs} мс`
                          : "офлайн"}
                      </span>
                    </div>
                  </>
                ) : (
                  <span style={{ color: colors.textMuted }}>...</span>
                )}
              </div>

              <div style={{ ...cardStyle, flex: 1, minWidth: "220px" }}>
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
                  <Activity size={15} />
                  admin-server
                </div>
                {ping ? (
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: colors.accent,
                    }}
                  >
                    {formatUptime(ping.adminServer.uptimeSeconds)}
                  </div>
                ) : (
                  <span style={{ color: colors.textMuted }}>...</span>
                )}
              </div>

              <div style={{ ...cardStyle, flex: 1, minWidth: "220px" }}>
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
                  <UsersIcon size={15} />
                  Всего пользователей
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700 }}>
                  {userStats ? userStats.totalUniqueUsers : "..."}
                </div>
              </div>
            </div> */}

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
                  <th style={thStyle}></th>
                  <th style={thStyle}>Файл</th>
                  <th style={thStyle}>Размер</th>
                  <th style={thStyle}>Статус</th>
                  <th style={thStyle}>Начало</th>
                  <th style={thStyle}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {transfer.map((t) => {
                  const FileTypeIcon = getFileIcon(t.filename);
                  const isExpanded = expandedId === t.id;
                  const progress = t.total_size
                    ? Math.min(
                        100,
                        Math.round((t.transferred_size / t.total_size) * 100),
                      )
                    : 0;

                  return (
                    <React.Fragment key={t.id}>
                      <tr
                        onClick={() => handleToggleExpand(t.id)}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = colors.surface2)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <td
                          style={{
                            ...tdStyle,
                            width: "32px",
                            color: colors.textMuted,
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown size={15} />
                          ) : (
                            <ChevronRight size={15} />
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <FileTypeIcon size={15} color={colors.textMuted} />
                            {t.filename}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: colors.textMuted }}>
                          {formatBytes(t.total_size)}
                        </td>
                        <td style={tdStyle}>
                          {t.status === "in_progress" ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "60px",
                                  height: "5px",
                                  borderRadius: "3px",
                                  background: colors.surface2,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${progress}%`,
                                    height: "100%",
                                    background: colors.accent,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: colors.textMuted,
                                }}
                              >
                                {progress}%
                              </span>
                            </div>
                          ) : (
                            <StatusTag status={t.status} />
                          )}
                        </td>
                        <td style={{ ...tdStyle, color: colors.textMuted }}>
                          {formatDate(t.start_time)}
                        </td>
                        <td
                          style={tdStyle}
                          onClick={(e) => e.stopPropagation()}
                        >
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

                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={6}
                            style={{
                              padding: "16px 16px 24px 48px",
                              background: colors.surface2,
                              borderBottom: `1px solid ${colors.border}`,
                            }}
                          >
                            {!expandedData ? (
                              <span
                                style={{
                                  color: colors.textMuted,
                                  fontSize: "13px",
                                }}
                              >
                                Загрузка...
                              </span>
                            ) : expandedData.metrics.length === 0 ? (
                              <span
                                style={{
                                  color: colors.textMuted,
                                  fontSize: "13px",
                                }}
                              >
                                Недостаточно данных для графика
                              </span>
                            ) : (
                              <ResponsiveContainer width="100%" height={140}>
                                <LineChart
                                  data={expandedData.metrics.map(
                                    (m, index) => ({
                                      index,
                                      speedKBs: Math.round(m.speed_bps / 1024),
                                    }),
                                  )}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={colors.border}
                                  />
                                  <XAxis
                                    dataKey="index"
                                    stroke={colors.textMuted}
                                    fontSize={11}
                                  />
                                  <YAxis
                                    stroke={colors.textMuted}
                                    fontSize={11}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      background: colors.surface,
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
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {transfer.length === 0 && (
                  <tr>
                    <td
                      style={{ ...tdStyle, color: colors.textMuted }}
                      colSpan={6}
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                ...cardStyle,
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="Поиск по пользователю"
                value={logFilterUser}
                onChange={(e) => setLogFilterUser(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  background: colors.surface2,
                  color: colors.text,
                  fontFamily: fontStack,
                  fontSize: "13px",
                  minWidth: "180px",
                }}
              />

              <select
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  background: colors.surface2,
                  color: colors.text,
                  fontFamily: fontStack,
                  fontSize: "13px",
                }}
              >
                <option value="all">Все действия</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={logFilterFrom}
                onChange={(e) => setLogFilterFrom(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  background: colors.surface2,
                  color: colors.text,
                  fontFamily: fontStack,
                  fontSize: "13px",
                }}
              />
              <span style={{ color: colors.textMuted, fontSize: "13px" }}>
                —
              </span>
              <input
                type="date"
                value={logFilterTo}
                onChange={(e) => setLogFilterTo(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${colors.border}`,
                  background: colors.surface2,
                  color: colors.text,
                  fontFamily: fontStack,
                  fontSize: "13px",
                }}
              />

              {(logFilterUser ||
                logFilterAction !== "all" ||
                logFilterFrom ||
                logFilterTo) && (
                <IconButton
                  icon={X}
                  label="Сбросить"
                  onClick={() => {
                    setLogFilterUser("");
                    setLogFilterAction("all");
                    setLogFilterFrom("");
                    setLogFilterTo("");
                  }}
                />
              )}

              <span
                style={{
                  marginLeft: "auto",
                  color: colors.textMuted,
                  fontSize: "13px",
                }}
              >
                {filteredLogs.length} из {logs.length}
              </span>
            </div>

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
                  {filteredLogs.map((log) => (
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
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td
                        style={{ ...tdStyle, color: colors.textMuted }}
                        colSpan={4}
                      >
                        Ничего не найдено по заданным фильтрам
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
