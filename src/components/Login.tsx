import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "ok" | "error">(
    "checking",
  );

  React.useEffect(() => {
    let isChecking = false;
    const checkServer = async () => {
      if (isChecking) {
        console.log("Skipping checkServer, already checking");
        return;
      }
      isChecking = true;
      console.log("Checking server health...");
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("Aborting health check due to timeout");
          controller.abort();
        }, 3000); // 3-секундный таймаут для проверки состояния.
        const res = await fetch("/api/health", {
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
        console.log("Health check response:", res.status);

        if (res.ok) {
          setServerStatus("ok");
          setError(""); // Ошибка должна быть устранена, если сервер снова подключен к сети
        } else {
          setServerStatus("error");
          // Отображать ошибку если ранее все было в порядке или проверка проходила корректно
          if (serverStatus !== "error")
            setError("Server is unreachable or database is locked.");
        }
      } catch (e: any) {
        console.error("Health check failed:", e.name, e.message);
        setServerStatus("error");
        if (serverStatus !== "error") setError("Cannot connect to server.");
      } finally {
        isChecking = false;
        console.log("Health check finished");
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, [serverStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    console.log("Form submitted", { isRegister, username, role });

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister
      ? { username, password, role }
      : { username, password };

    try {
      console.log("Sending request to", endpoint);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10с

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      const data = await res.json();
      console.log("Response:", res.status, data);

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (isRegister) {
        setIsRegister(false);
        setError("Registration successful. Please login.");
      } else {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-google-blue dark:border-google-blue transition-colors duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-google-blue">G</span>
            <span className="text-google-red">o</span>
            <span className="text-google-yellow">o</span>
            <span className="text-google-blue">g</span>
            <span className="text-google-green">l</span>
            <span className="text-google-red">e</span>
            <span className="text-gray-700 dark:text-gray-200 ml-2 text-xl font-normal">
              FileTransfer
            </span>
          </h1>
          <h2 className="text-xl font-medium text-gray-600 dark:text-gray-300">
            {isRegister ? "Create your account" : "Sign in to continue"}
          </h2>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${serverStatus === "ok" ? "bg-green-500" : serverStatus === "checking" ? "bg-yellow-500" : "bg-red-500"}`}
            ></span>
            <span className="text-gray-500 dark:text-gray-400">
              {serverStatus === "ok"
                ? "Server Online"
                : serverStatus === "checking"
                  ? "Checking Server..."
                  : "Server Offline"}
            </span>
          </div>
        </div>

        {error && (
          <div
            className={`p-3 mb-6 rounded-lg text-sm flex items-center gap-2 ${
              error.includes("successful")
                ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
            }`}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              name="username"
              autoComplete="username"
              required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Role
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-google-blue focus:border-google-blue outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 rounded-lg text-white font-medium transition-all transform active:scale-[0.98] shadow-md ${
              isRegister
                ? "bg-google-green hover:bg-green-600 shadow-green-200 dark:shadow-none"
                : "bg-google-blue hover:bg-blue-600 shadow-blue-200 dark:shadow-none"
            } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoading
              ? "Processing..."
              : isRegister
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {isRegister ? "Already have an account?" : "Don't have an account?"}
          </p>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className={`text-sm font-medium hover:underline ${
              isRegister ? "text-google-blue" : "text-google-blue"
            }`}
          >
            {isRegister ? "Sign in instead" : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}
