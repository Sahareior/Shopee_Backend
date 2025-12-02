// const cluster = require('node:cluster');
// const os = require('node:os');

// cluster.schedulingPolicy = cluster.SCHED_RR;

// if (cluster.isPrimary) {
//   console.log(`Primary ${process.pid} is running on ${os.cpus().length} CPU cores`);

//   const numCPUs = os.availableParallelism();
//   const workers = [];

//   // Fork workers
//   for (let i = 0; i < numCPUs; i++) {
//     const worker = cluster.fork();
//     workers.push(worker);
//   }

//   // Optional: Track worker activity
//   cluster.on('message', (worker, message) => {
//     console.log(`Message from worker ${worker.process.pid}:`, message);
//   });

//   // Optional: Heartbeat monitoring
//   const checkWorkers = () => {
//     workers.forEach(worker => {
//       if (worker.isDead()) {
//         console.log(`Worker ${worker.process.pid} is dead, restarting...`);
//         const newWorker = cluster.fork();
//         workers[workers.indexOf(worker)] = newWorker;
//       }
//     });
//   };
//   setInterval(checkWorkers, 10000);

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
//     console.log('Starting a new worker...');
//     cluster.fork();
//   });

//   // Graceful shutdown for primary
//   const shutdown = () => {
//     console.log('Primary shutting down...');
//     workers.forEach(worker => {
//       worker.send({ type: 'shutdown' });
//     });
//     setTimeout(() => process.exit(0), 5000);
//   };

//   process.on('SIGTERM', shutdown);
//   process.on('SIGINT', shutdown);

// } else {
//   // Import the Express app
//   import('./index.js').then(module => {
//     // Start the server in the worker
//     const startServer = module.default || module.startServer;
//     startServer();
    
//     // Handle messages from primary
//     process.on('message', (msg) => {
//       if (msg.type === 'shutdown') {
//         console.log(`Worker ${process.pid} received shutdown signal`);
//         process.exit(0);
//       }
//     });
//   }).catch(err => {
//     console.error(`Worker ${process.pid} failed to start:`, err);
//     process.exit(1);
//   });
// }