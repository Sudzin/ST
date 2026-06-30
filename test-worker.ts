import { Worker } from 'worker_threads';
import path from 'path';

const fileWorker = new Worker(path.join(process.cwd(), 'src', 'worker.js'));
fileWorker.on('error', (err) => {
  console.error('Worker error', err);
  process.exit(1);
});
fileWorker.on('online', () => {
  console.log('Worker online');
  process.exit(0);
});
