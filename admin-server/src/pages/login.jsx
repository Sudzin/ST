import React, { useState, useEffect } from "react";
//import ReactDOM from "react-dom/client";

const mainContainer = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  backgroundColor: "#121212",
  fontFamily: "sans-serif",
  boxSizing: "border-box",
  color: "#f5f5f5",
};

const cardStyle = {
  background: "#1e1e1e",
  padding: "40px",
  borderRadius: "12px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
  display: "flex",
  flexDirection: "column",
  width: "100%",
  maxWidth: "400px",
  boxSizing: "border-box",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  width: "100%",
};

const inputGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  width: "100%",
};

const labelStyle = {
  fontSize: "14px",
  color: "#ccc",
  fontWeight: "500",
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "6px",
  border: "1px solid #444",
  background: "#2e2e2e",
  color: "#fff",
  fontSize: "16px",
  outline: "none",
  boxSizing: "border-box",
};

const errorBadgeStyle = {
  padding: "12px",
  marginBottom: "16px",
  borderRadius: "6px",
  fontSize: "14px",
  backgroundColor: "rgba(244, 67, 54, 0.1)",
  color: "#f44336",
  border: "1px solid rgba(244, 67, 54, 0.3)",
};

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    let isChecking = false;

    const fetchServerStatus = async () => {
      if (isChecking) return;
      isChecking = true;

      try {
        const reqController = new AbortController();
        const timeoutId = setTimeout(() => reqController.abort(), 3000);

        const statusResponse = await fetch("http://localhost:3001/api/health", {
          signal: reqController.signal,
        });
        clearTimeout(timeoutId);

        const statusData = await statusResponse.json();

        if (statusData && statusData.status === "ok") {
          setServerStatus("ok");
        } else {
          setServerStatus("error");
        }
      } catch (error) {
        setServerStatus("error"); // если бек выключен
      } finally {
        isChecking = false;
      }
    };

    fetchServerStatus();
    const statusCheckInterval = setInterval(fetchServerStatus, 5000);
    return () => clearInterval(statusCheckInterval); // очистка, интервалы между сессиями почему-то складывались
  }, []);

  const getADMServerStatus = () => {
    switch (serverStatus) {
      case "ok":
        return { text: "Server Online", color: "#4caf50" };
      case "error":
        return { text: "Server Offline", color: "#f44336" };
      case "checking":
        return { text: "Checking server status", color: "#ffeb3b" };
    }
  };

  const status = getADMServerStatus();

  // тут будет логика авторизации

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authController = new AbortController();
      const authTimeoutId = setTimeout(() => authController.abort(), 10000);

      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: authController.signal,
      });
      clearTimeout(authTimeoutId);

      const authData = await res.json();

      if (!res.ok) {
        throw new Error(authData.error || "Что-то пошло не так");
      }

      if (authData.success) {
        sessionStorage.setItem("token", authData.token);
        sessionStorage.setItem("user", JSON.stringify(authData.user));
        onLogin(authData.user);
      }
    } catch (err) {
      console.error("Ошибка входа:", err);
      if (err.name === "AbortError") {
        setError(
          "Время ожидания запроса истекло. Пожалуйста, попробуйте еще раз",
        );
      } else {
        setError(err.message || "Не удается подключиться к серверу");
      }
    } finally {
      setLoading(false);
    }

    // console.log(Форма отправлена:", { username, password }); -?
  };

  return (
    <div style={mainContainer}>
      <div style={cardStyle}>
        {/* заголовок */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: "28px",
              fontWeight: "bold",
            }}
          >
            <span style={{ color: "#4285F4" }}>G</span>
            <span style={{ color: "#EA4335" }}>o</span>
            <span style={{ color: "#FBBC05" }}>o</span>
            <span style={{ color: "#4285F4" }}>g</span>
            <span style={{ color: "#34A853" }}>l</span>
            <span style={{ color: "#EA4335" }}>e</span>
          </h1>
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              color: "#888",
              fontWeight: "normal",
            }}
          >
            Sign in to continue
          </h2>

          {/* берётся из status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginTop: "12px",
              fontSize: "12px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: status.color,
                transition: "background-color 0.3s ease",
              }}
            ></span>
            <span style={{ color: "#888" }}>{status.text}</span>
          </div>
        </div>

        {/* форма */}
        <form onSubmit={handleSubmit} style={formStyle}>
          {/* поле имя */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              required
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* поле пароля */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Кнопка отправки */}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "6px",
              border: "none",
              background: "#2196F3",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "500",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              marginTop: "10px",
            }}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

//ReactDOM.createRoot(document.getElementById("root")).render(
//  <React.StrictMode>
//    <Login />
//  </React.StrictMode>,
//);
