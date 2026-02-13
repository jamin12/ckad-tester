import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { SERVER_CONFIG } from './config.js';
import { healthRouter } from './routes/health.js';
import { verifyRouter } from './routes/verify.js';
import { setupWsServer } from './ws/wsServer.js';
import { sessionManager } from './sessions/SessionManager.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api', verifyRouter);

const server = createServer(app);
setupWsServer(server);

server.listen(SERVER_CONFIG.port, () => {
  console.log(`CKAD Lab Server listening on port ${SERVER_CONFIG.port}`);
});

// Cleanup stale sessions
setInterval(() => {
  sessionManager.cleanupStale();
}, SERVER_CONFIG.cleanupIntervalMs);

// Graceful shutdown: pod + secret 자동 정리
function shutdown() {
  console.log('\nShutting down... cleaning up K8s resources');
  sessionManager.destroyAll();
  server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
