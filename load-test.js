// load-test.js
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} starting workers...`);
  
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }
  
  // Track worker usage
  const workerRequests = {};
  
  cluster.on('message', (worker, message) => {
    if (message.type === 'request_handled') {
      workerRequests[worker.id] = (workerRequests[worker.id] || 0) + 1;
      console.log(`Worker ${worker.id} (PID: ${worker.process.pid}) has handled ${workerRequests[worker.id]} requests`);
    }
  });
} else {
  // Worker process
  import('./index.js').then(mod => mod.default());
}