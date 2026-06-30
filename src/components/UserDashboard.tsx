import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Download,
  File,
  RefreshCw,
} from "lucide-react";

export default function UserDashboard({ user }: { user: any }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "connecting" | "uploading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const fileIdRef = useRef<number>(0);

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const downloadBufferRef = useRef<Uint8Array[]>([]);
  const downloadMetaRef = useRef<{ filename: string; size: number } | null>(
    null,
  );

  useEffect(() => {
    fetchFiles();
    const token = sessionStorage.getItem("token");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    // Небольшая задержка для закрытия предыдущего соединения (обработка в режиме React Strict Mode)
    const connectTimeout = setTimeout(() => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        // Отправьте аутентификацию немедленно при подключении
        if (!token) return;
        const tokenBytes = new TextEncoder().encode(token);
        const authMsg = new Uint8Array(1 + tokenBytes.length);
        authMsg[0] = 0x00;
        authMsg.set(tokenBytes, 1);
        ws.send(authMsg);
      };

      ws.onmessage = async (event) => {
        if (typeof event.data === "string") {
          const data = JSON.parse(event.data);

          if (data.type === "auth_success") {
            setIsConnected(true);
          } else if (data.type === "error") {
            setStatus("error");
            setErrorMsg(data.message);
            setDownloadingFile(null);
            // Если сервер переполнен, разорвите соединение
            if (data.message.includes("full")) {
              ws.close();
            }
          } else if (data.type === "file_success") {
            setStatus("success");
            fetchFiles(); // Обновите список файлов после загрузки.
          } else if (data.type === "file_list_update") {
            fetchFiles(); // Обновлять список файлов при загрузке другим клиентом.
          }
        } else if (event.data instanceof ArrayBuffer) {
          const view = new DataView(event.data);
          const type = view.getUint8(0);

          if (type === 0x05) {
            // Загрузить Начало
            const metaBytes = new Uint8Array(event.data.slice(1));
            const metaStr = new TextDecoder().decode(metaBytes);
            downloadMetaRef.current = JSON.parse(metaStr);
            downloadBufferRef.current = [];
            setDownloadProgress(0);
            if (downloadMetaRef.current)
              setDownloadingFile(downloadMetaRef.current.filename);
          } else if (type === 0x06) {
            // Скачать чанк
            const chunk = new Uint8Array(event.data.slice(1));
            downloadBufferRef.current.push(chunk);

            // Рассчитать прогресс
            if (downloadMetaRef.current) {
              const currentSize = downloadBufferRef.current.reduce(
                (acc, val) => acc + val.length,
                0,
              );
              setDownloadProgress(
                Math.round((currentSize / downloadMetaRef.current.size) * 100),
              );
            }
          } else if (type === 0x07) {
            // Конец загрузки
            const blob = new Blob(downloadBufferRef.current);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = downloadMetaRef.current?.filename || "downloaded_file";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setDownloadingFile(null);
            setDownloadProgress(0);
            downloadBufferRef.current = [];
          }
        }
      };

      ws.onerror = () => {
        if (!isConnected) {
          setStatus("error");
          setErrorMsg(
            "Connection failed. Server might be full (max 3 clients).",
          );
        }
      };

      ws.onclose = (e) => {
        setIsConnected(false);
        if (e.code === 1008) {
          setStatus("error");
          setErrorMsg("Server full (max 3 clients). Please try again later.");
        }
      };
    }, 300); // 300ms задержка

    return () => {
      clearTimeout(connectTimeout);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchFiles = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        setAvailableFiles(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch files", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const downloadFile = (id: number) => {
    if (!wsRef.current || !isConnected) {
      alert("Not connected to server");
      return;
    }

    // Отправить запрос на загрузку (0x04)
    const reqMsg = new Uint8Array(5);
    reqMsg[0] = 0x04;
    new DataView(reqMsg.buffer).setUint32(1, id, true);
    wsRef.current.send(reqMsg);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setProgress(0);
    }
  };

  const uploadFile = () => {
    if (!file || !wsRef.current || !isConnected) {
      if (!isConnected) setErrorMsg("Not connected to server. Refresh page.");
      return;
    }

    setStatus("uploading");
    fileIdRef.current = Math.floor(Math.random() * 1000000);

    // Отправить файл Начало
    const metadata = JSON.stringify({ filename: file.name, size: file.size });
    const metaBytes = new TextEncoder().encode(metadata);

    const startMsg = new Uint8Array(5 + metaBytes.length);
    startMsg[0] = 0x01;
    new DataView(startMsg.buffer).setUint32(1, fileIdRef.current, true);
    startMsg.set(metaBytes, 5);

    wsRef.current.send(startMsg);

    // Начните отправлять фрагменты
    sendFileChunks(wsRef.current, file, fileIdRef.current);
  };

  const sendFileChunks = async (ws: WebSocket, file: File, fileId: number) => {
    const CHUNK_SIZE = 1024 * 64; // 64KB chunks
    let offset = 0;

    const readChunk = (offset: number, size: number): Promise<ArrayBuffer> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file.slice(offset, offset + size));
      });
    };

    while (offset < file.size) {
      if (ws.readyState !== WebSocket.OPEN) break;

      const chunk = await readChunk(offset, CHUNK_SIZE);

      const chunkMsg = new Uint8Array(5 + chunk.byteLength);
      chunkMsg[0] = 0x02;
      new DataView(chunkMsg.buffer).setUint32(1, fileId, true);
      chunkMsg.set(new Uint8Array(chunk), 5);

      ws.send(chunkMsg);

      offset += chunk.byteLength;
      setProgress(Math.round((offset / file.size) * 100));

      if (ws.bufferedAmount > 1024 * 1024 * 5) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    if (ws.readyState === WebSocket.OPEN) {
      const endMsg = new Uint8Array(5);
      endMsg[0] = 0x03;
      new DataView(endMsg.buffer).setUint32(1, fileId, true);
      ws.send(endMsg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-medium text-gray-900 mb-6 flex justify-between items-center">
          Upload File
          <span
            className={`text-xs px-2 py-1 rounded-full ${isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </h2>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors relative">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={status === "uploading" || status === "connecting"}
          />
          <UploadCloud className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            {file ? file.name : "Drag and drop a file or click to browse"}
          </p>
          {file && (
            <p className="text-sm text-gray-400 mt-2">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>

        {file && status !== "idle" && (
          <div className="mt-8">
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
              <span>
                {status === "connecting"
                  ? "Connecting..."
                  : status === "uploading"
                    ? "Uploading..."
                    : status === "success"
                      ? "Upload Complete"
                      : "Error"}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${status === "error" ? "bg-red-500" : status === "success" ? "bg-green-500" : "bg-blue-600"}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">File uploaded successfully!</p>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={uploadFile}
            disabled={
              !file ||
              status === "uploading" ||
              status === "connecting" ||
              status === "success"
            }
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Upload
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-900">Available Files</h2>
          <button
            onClick={fetchFiles}
            disabled={isRefreshing}
            className={`p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors ${isRefreshing ? "animate-spin" : ""}`}
            title="Refresh List"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        {availableFiles.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No files available for download.
          </p>
        ) : (
          <div className="space-y-3">
            {availableFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <File className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{f.filename}</p>
                    <p className="text-xs text-gray-500">
                      {(f.total_size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {new Date(f.end_time).toLocaleString()}
                    </p>
                    {downloadingFile === f.filename && (
                      <div className="mt-2 w-48 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(f.id)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Download"
                  disabled={!!downloadingFile}
                >
                  {downloadingFile === f.filename ? (
                    <span className="text-xs font-medium text-blue-600">
                      {downloadProgress}%
                    </span>
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
