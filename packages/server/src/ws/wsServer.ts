import { WebSocketServer } from 'ws';
import type { Server } from 'node:http';
import type WebSocket from 'ws';
import type { IncomingMessage } from 'node:http';
import type { WsClientMessage } from '@ckad-tester/shared/lab';
import { sessionManager } from '../sessions/SessionManager.js';
import { ensureWorkspacePod } from './workspacePod.js';
import { attachShell } from './shellAttach.js';
import type { ShellConnection } from './shellAttach.js';

export function setupWsServer(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/ws/terminal' });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    let sessionId: string | null = null;
    let shell: ShellConnection | null = null;

    // ping/pong heartbeat: 30초 간격으로 ping, pong 미수신 시 강제 종료
    let isAlive = true;

    ws.on('pong', () => {
      isAlive = true;
    });

    const pingInterval = setInterval(() => {
      if (!isAlive) {
        clearInterval(pingInterval);
        ws.terminate();
        return;
      }
      isAlive = false;
      ws.ping();
    }, 30_000);

    ws.on('message', async (raw: Buffer | string) => {
      let msg: WsClientMessage;
      try {
        msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString()) as WsClientMessage;
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        return;
      }

      switch (msg.type) {
        case 'auth': {
          try {
            const entry = sessionManager.createSession(msg.config);
            sessionId = entry.session.sessionId;

            const podName = await ensureWorkspacePod(entry.coreApi, entry.exec, entry.namespace, msg.config.kubeconfig);
            shell = attachShell(entry.exec, entry.namespace, podName, ws);

            ws.send(JSON.stringify({ type: 'connected', session: entry.session }));
          } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            console.error(`[ws/terminal] auth failed: ${reason}`);
            ws.send(JSON.stringify({ type: 'error', message: `Connection failed: ${reason}` }));
          }
          break;
        }

        case 'input': {
          if (shell) {
            shell.stdin.push(msg.data);
          }
          break;
        }

        case 'resize': {
          if (shell && msg.cols && msg.rows) {
            shell.resize(msg.cols, msg.rows);
          }
          break;
        }
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      if (shell) {
        shell.destroy();
      }
      if (sessionId) {
        sessionManager.destroySession(sessionId);
      }
    });

    ws.on('error', () => {
      clearInterval(pingInterval);
      if (shell) {
        shell.destroy();
      }
      if (sessionId) {
        sessionManager.destroySession(sessionId);
      }
    });
  });
}
