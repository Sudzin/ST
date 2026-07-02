import React from "react";
import ReactDOM from "react-dom/client";

const cardStyle = {
  background: "#1e1e1e",
  padding: "40px",
};

const mainContainer = {
  display: flex,
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  boxSizing: "border-box",
};

export default function Login() {
  return (
    <div style={mainContainer}>
      <div style={cardStyle}>
        <h2
          style={{
            color: "#4caf50",
            textAlign: "center",
            marginTop: 0,
            marginBottom: "20px",
          }}
        >
          Login
        </h2>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Login />
  </React.StrictMode>,
);
