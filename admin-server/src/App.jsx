import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import Login from "./pages/login.jsx";
import MainPage from "./pages/mainpage.jsx";

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return <MainPage />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
