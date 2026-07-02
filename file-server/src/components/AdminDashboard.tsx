import { useState, useEffect } from "react";
import {
  Activity,
  HardDrive,
  Users,
  Trash2,
  RefreshCw,
  FileText,
  Network,
  Edit2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"logs" | "transfers" | "packets">(
    "logs",
  );
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [packets, setPackets] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Редактировать состояние журнала
  const [editingLog, setEditingLog] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    action: "",
    details: "",
    username: "",
    timestamp: "",
  });

  // Расширенное состояние передачи
  const [expandedTransferId, setExpandedTransferId] = useState<number | null>(
    null,
  );
  const [transferDetails, setTransferDetails] = useState<any>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Фильтры журналов
  const [logFilterUser, setLogFilterUser] = useState("");
  const [logFilterAction, setLogFilterAction] = useState("all");

  // Изменить состояние передачи
  const [editingTransfer, setEditingTransfer] = useState<any>(null);
  const [editTransferForm, setEditTransferForm] = useState({
    filename: "",
    status: "",
  });

  const handleEditTransfer = (transfer: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTransfer(transfer);
    setEditTransferForm({
      filename: transfer.filename,
      status: transfer.status,
    });
  };

  const saveTransferEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingTransfer) return;
    try {
      const res = await fetch(`/api/admin/transfers/${editingTransfer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTransferForm),
      });
      if (res.ok) {
        setTransfers(
          transfers.map((t) =>
            t.id === editingTransfer.id ? { ...t, ...editTransferForm } : t,
          ),
        );
        setEditingTransfer(null);
      }
    } catch (err) {
      console.error("Failed to update transfer", err);
    }
  };

  const deleteTransfer = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this transfer and its file?"))
      return;
    try {
      const res = await fetch(`/api/admin/transfers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTransfers(transfers.filter((t) => t.id !== id));
        if (expandedTransferId === id) setExpandedTransferId(null);
      }
    } catch (err) {
      console.error("Failed to delete transfer", err);
    }
  };

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const [statsRes, logsRes, transfersRes, packetsRes, connectionsRes] =
        await Promise.all([
          fetch("/api/admin/stats", { signal: controller.signal }).catch(
            (e) => null,
          ),
          fetch("/api/admin/logs", { signal: controller.signal }).catch(
            (e) => null,
          ),
          fetch("/api/admin/transfers", { signal: controller.signal }).catch(
            (e) => null,
          ),
          fetch("/api/admin/packets", { signal: controller.signal }).catch(
            (e) => null,
          ),
          fetch("/api/admin/connections", { signal: controller.signal }).catch(
            (e) => null,
          ),
        ]);

      clearTimeout(timeoutId);

      if (statsRes?.ok) setStats(await statsRes.json());
      if (logsRes?.ok) setLogs(await logsRes.json());
      if (transfersRes?.ok) setTransfers(await transfersRes.json());
      if (packetsRes?.ok) setPackets(await packetsRes.json());
      if (connectionsRes?.ok) setConnections(await connectionsRes.json());
    } catch (err: any) {
      console.error("Failed to fetch admin data", err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTransferDetails = async (id: number) => {
    if (expandedTransferId === id) {
      setExpandedTransferId(null);
      return;
    }
    try {
      const res = await fetch(`/api/admin/transfers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTransferDetails(data);
        setExpandedTransferId(id);
      }
    } catch (err) {
      console.error("Failed to fetch transfer details", err);
    }
  };

  const handleEditLog = (log: any) => {
    setEditingLog(log);
    setEditForm({
      action: log.action,
      details: log.details,
      username: log.username,
      timestamp: log.timestamp,
    });
  };

  const saveLogEdit = async () => {
    if (!editingLog) return;
    try {
      const res = await fetch(`/api/admin/logs/${editingLog.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setLogs(
          logs.map((l) => (l.id === editingLog.id ? { ...l, ...editForm } : l)),
        );
        setEditingLog(null);
      }
    } catch (err) {
      console.error("Failed to update log", err);
    }
  };

  const deleteLog = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/logs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLogs(logs.filter((log) => log.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete log", err);
    }
  };

  if (loading && !stats)
    return (
      <div className="text-center py-12 text-gray-500">
        Loading dashboard...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-medium text-gray-900">Admin Dashboard</h2>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className={`flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium ${isRefreshing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 relative group">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Active Connections
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats?.activeConnections || 0} / 3
            </p>
          </div>

          {/* Всплывающая подсказка для активных подключений */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 hidden group-hover:block z-10">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Connected Users
            </h4>
            {connections.length === 0 ? (
              <p className="text-xs text-gray-400">No active connections</p>
            ) : (
              <ul className="space-y-1">
                {connections.map((conn: any, i: number) => (
                  <li key={i} className="text-xs flex justify-between">
                    <span className="font-medium text-gray-700">
                      {conn.username}
                    </span>
                    <span className="text-gray-400">
                      {new Date(conn.connectedAt).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Files</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats?.total_files || 0}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Data</p>
            <p className="text-2xl font-semibold text-gray-900">
              {((stats?.total_bytes || 0) / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      </div>

      {/* Вкладки */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "logs" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> System Logs
            </div>
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "transfers" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> File Transfers
            </div>
          </button>
          <button
            onClick={() => setActiveTab("packets")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "packets" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
          >
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4" /> Packet Inspector
            </div>
          </button>
        </nav>
      </div>

      {/* Вкладка «Журналы» */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex gap-4 items-center bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Filter by User:
              </span>
              <input
                type="text"
                placeholder="Username..."
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={logFilterUser}
                onChange={(e) => setLogFilterUser(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Filter by Action:
              </span>
              <select
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
              >
                <option value="all">All Actions</option>
                <option value="login">Login</option>
                <option value="disconnect">Disconnect</option>
                <option value="upload_start">Upload Start</option>
                <option value="upload_end">Upload End</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody>
                {logs
                  .filter((log) => {
                    const matchesUser = logFilterUser
                      ? (log.username || "")
                          .toLowerCase()
                          .includes(logFilterUser.toLowerCase())
                      : true;
                    const matchesAction =
                      logFilterAction !== "all"
                        ? log.action === logFilterAction
                        : true;
                    return matchesUser && matchesAction;
                  })
                  .map((log) => (
                    <tr
                      key={log.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {editingLog?.id === log.id ? (
                          <input
                            value={editForm.timestamp}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                timestamp: e.target.value,
                              })
                            }
                            className="border rounded px-2 py-1 w-full text-xs"
                          />
                        ) : (
                          new Date(log.timestamp).toLocaleString()
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {editingLog?.id === log.id ? (
                          <input
                            value={editForm.username}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                username: e.target.value,
                              })
                            }
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          log.username || "System"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingLog?.id === log.id ? (
                          <input
                            value={editForm.action}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                action: e.target.value,
                              })
                            }
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                              log.action === "login"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : log.action === "disconnect"
                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                  : log.action === "upload_start"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : log.action === "upload_end"
                                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                      : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            {log.action === "upload_start"
                              ? "Upload Started"
                              : log.action === "upload_end"
                                ? "Upload Completed"
                                : log.action.charAt(0).toUpperCase() +
                                  log.action.slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {editingLog?.id === log.id ? (
                          <input
                            value={editForm.details}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                details: e.target.value,
                              })
                            }
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          log.details
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {editingLog?.id === log.id ? (
                          <>
                            <button
                              onClick={saveLogEdit}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingLog(null)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditLog(log)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteLog(log.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Вкладка «Трансферы» */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          {transfers.map((transfer) => (
            <div
              key={transfer.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => fetchTransferDetails(transfer.id)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${transfer.status === "completed" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    {editingTransfer?.id === transfer.id ? (
                      <input
                        value={editTransferForm.filename}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setEditTransferForm({
                            ...editTransferForm,
                            filename: e.target.value,
                          })
                        }
                        className="border rounded px-2 py-1 w-full text-sm font-medium text-gray-900 mb-1"
                      />
                    ) : (
                      <p className="font-medium text-gray-900">
                        {transfer.filename}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {(transfer.total_size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {new Date(transfer.start_time).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {editingTransfer?.id === transfer.id ? (
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={editTransferForm.status}
                        onChange={(e) =>
                          setEditTransferForm({
                            ...editTransferForm,
                            status: e.target.value,
                          })
                        }
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="uploading">Uploading</option>
                        <option value="completed">Completed</option>
                        <option value="error">Error</option>
                      </select>
                      <button
                        onClick={saveTransferEdit}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTransfer(null);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          transfer.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {transfer.status}
                      </span>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={(e) => handleEditTransfer(transfer, e)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => deleteTransfer(transfer.id, e)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {expandedTransferId === transfer.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </>
                  )}
                </div>
              </div>

              {expandedTransferId === transfer.id && transferDetails && (
                <div className="border-t border-gray-100 p-6 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">
                    Transfer Speed (Bytes/sec)
                  </h4>
                  <div className="h-64 bg-white rounded-lg p-4 border border-gray-200 mb-6">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minWidth={0}
                      minHeight={0}
                    >
                      <LineChart data={transferDetails.metrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(t) =>
                            new Date(t).toLocaleTimeString()
                          }
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(t) => new Date(t).toLocaleString()}
                        />
                        <Line
                          type="monotone"
                          dataKey="speed_bps"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <h4 className="text-sm font-medium text-gray-700 mb-4">
                    Packet Capture
                  </h4>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-xs text-left text-gray-500">
                      <thead className="bg-gray-100 text-gray-700 uppercase">
                        <tr>
                          <th className="px-4 py-2">Time</th>
                          <th className="px-4 py-2">Dir</th>
                          <th className="px-4 py-2">Type</th>
                          <th className="px-4 py-2">Size</th>
                          <th className="px-4 py-2">Payload (Hex)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transferDetails.packets.map((pkt: any) => (
                          <tr
                            key={pkt.id}
                            className="border-b hover:bg-gray-50 font-mono"
                          >
                            <td className="px-4 py-2">
                              {new Date(pkt.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={
                                  pkt.direction === "in"
                                    ? "text-green-600"
                                    : "text-blue-600"
                                }
                              >
                                {pkt.direction === "in" ? "← IN" : "→ OUT"}
                              </span>
                            </td>
                            <td className="px-4 py-2">{pkt.type}</td>
                            <td className="px-4 py-2">{pkt.size} B</td>
                            <td className="px-4 py-2 text-gray-400 truncate max-w-xs">
                              {pkt.payload_preview}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Вкладка «Пакеты» */}
      {activeTab === "packets" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-500 font-mono">
              <thead className="bg-gray-50 text-gray-700 uppercase">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Direction</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Payload Preview</th>
                </tr>
              </thead>
              <tbody>
                {packets.map((pkt) => (
                  <tr key={pkt.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {new Date(pkt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          pkt.direction === "in"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {pkt.direction === "in" ? "RX" : "TX"}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-semibold text-gray-700">
                      {pkt.type}
                    </td>
                    <td className="px-4 py-2">{pkt.size}</td>
                    <td className="px-4 py-2 text-gray-400 truncate max-w-md">
                      {pkt.payload_preview}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
