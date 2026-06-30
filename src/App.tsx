import { useState, useEffect } from "react";
import Login from "./components/Login";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { Moon, Sun } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse user from session storage", e);
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    }

    const storedTheme = localStorage.getItem("theme");
    if (
      storedTheme === "dark" ||
      (!storedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
  };

  if (!user) {
    return (
      <div className={darkMode ? "dark" : ""}>
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
        <Login onLogin={setUser} />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? "dark bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}
    >
      <header className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4 flex justify-between items-center transition-colors duration-300">
        <h1 className="text-xl font-medium text-google-blue dark:text-google-blue">
          FileTransfer
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Logged in as <b>{user.username}</b> ({user.role})
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-google-red hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="p-6 max-w-5xl mx-auto">
        {user.role === "admin" ? (
          <AdminDashboard />
        ) : (
          <UserDashboard user={user} />
        )}
      </main>
    </div>
  );
}
