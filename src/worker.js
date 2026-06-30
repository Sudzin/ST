import { parentPort } from "worker_threads";
import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const activeStreams = new Map();

parentPort?.on("message", (msg) => {
  const { type, fileId, data, filename } = msg;

  if (type === "start") {
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadsDir, `${Date.now()}_${safeFilename}`);
    const stream = fs.createWriteStream(filePath);
    activeStreams.set(fileId, stream);
    parentPort.postMessage({ type: "ack_start", fileId, filePath });
  } else if (type === "chunk") {
    const stream = activeStreams.get(fileId);
    if (stream) {
      stream.write(Buffer.from(data));
      parentPort.postMessage({ type: "ack_chunk", fileId });
    }
  } else if (type === "end") {
    const stream = activeStreams.get(fileId);
    if (stream) {
      stream.end();
      activeStreams.delete(fileId);
      parentPort.postMessage({ type: "ack_end", fileId });
    }
  }
});
