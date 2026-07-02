import React from "react";
import ReactDOM from "react-dom/client";

const cardStyle = {
  background: "#1e1e1e",
  padding: "40px",
};

export default function Login() {
  return (
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
  );
}

ReactDOM.createRoot(document.getElementByID("root")).render(
  <React.StrictMode>
    <Login />
  </React.StrictMode>,
);
