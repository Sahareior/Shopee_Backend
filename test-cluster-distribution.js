// test-no-keepalive.js
import http from 'http';

function testWithFreshConnections() {
  console.log('Testing with fresh connections (no keep-alive)...\n');
  
  let completed = 0;
  const totalRequests = 10;
  const pids = new Set();
  
  for (let i = 0; i < totalRequests; i++) {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/',
      method: 'GET',
      agent: false, // ← CRITICAL: Disable connection pooling
      headers: {
        'Connection': 'close' // ← Force close after each request
      }
    };
    
    setTimeout(() => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          completed++;
          
          // Extract PID from response
          const pidMatch = data.match(/(\d+)/);
          const pid = pidMatch ? pidMatch[1] : 'unknown';
          pids.add(pid);
          
          console.log(`Request ${i + 1}: PID ${pid} - ${data.substring(0, 50)}...`);
          
          if (completed === totalRequests) {
            console.log(`\n=== Summary ===`);
            console.log(`Total requests: ${totalRequests}`);
            console.log(`Unique PIDs: ${pids.size}`);
            console.log(`PIDs found: ${Array.from(pids).join(', ')}`);
            process.exit(0);
          }
        });
      });
      
      req.on('error', (err) => {
        console.log(`Request ${i + 1} failed: ${err.message}`);
        completed++;
        if (completed === totalRequests) process.exit(0);
      });
      
      req.end();
    }, i * 50); // Small delay
  }
}

testWithFreshConnections();