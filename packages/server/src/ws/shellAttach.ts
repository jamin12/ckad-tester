import type { Exec } from '@kubernetes/client-node';
import type WebSocket from 'ws';
import { Writable, Readable } from 'node:stream';

export interface ShellConnection {
  destroy: () => void;
  stdin: Readable;
  resize: (cols: number, rows: number) => void;
}

export function attachShell(
  exec: Exec,
  namespace: string,
  podName: string,
  ws: WebSocket,
): ShellConnection {
  const stdinStream = new Readable({
    read() {},
  });

  const stdoutStream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: chunk.toString() }));
      }
      callback();
    },
  });

  const stderrStream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: chunk.toString() }));
      }
      callback();
    },
  });

  // K8s exec WebSocket 참조 (resize 채널 접근용)
  let execWs: WebSocket | null = null;

  exec.exec(
    namespace,
    podName,
    'workspace',
    ['/bin/bash', '-i'],
    stdoutStream,
    stderrStream,
    stdinStream,
    true, // tty
  ).then((socket) => {
    execWs = socket;

    socket.on('close', (code: number, reason: Buffer) => {
      const reasonText = reason.toString() || 'no-reason';
      console.warn(`[ws/shell] exec socket closed (code=${code}, reason=${reasonText})`);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'error', message: `Shell session ended (code=${code}, reason=${reasonText}).` }));
        ws.close();
      }
    });

    socket.on('error', (err: Error) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'error', message: `Shell error: ${err.message}` }));
        ws.close();
      }
    });
  }).catch((err) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'error', message: `Shell error: ${String(err)}` }));
    }
  });

  return {
    destroy() {
      stdinStream.destroy();
      stdoutStream.destroy();
      stderrStream.destroy();
      if (execWs) {
        try { execWs.close(); } catch { /* ignore */ }
      }
    },
    get stdin() {
      return stdinStream;
    },
    resize(cols: number, rows: number) {
      if (!execWs || execWs.readyState !== execWs.OPEN) return;
      // K8s exec protocol: channel 4 = resize
      // 메시지 형식: 1바이트 채널 번호 + JSON {"Width": cols, "Height": rows}
      const resizeMsg = JSON.stringify({ Width: cols, Height: rows });
      const buf = Buffer.alloc(1 + Buffer.byteLength(resizeMsg));
      buf.writeUInt8(4, 0); // channel 4 = resize
      buf.write(resizeMsg, 1);
      execWs.send(buf);
    },
  };
}
