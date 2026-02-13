import type { Exec } from '@kubernetes/client-node';
import type WebSocket from 'ws';
import { Writable, Readable } from 'node:stream';

export interface ShellConnection {
  destroy: () => void;
  stdin: Readable;
  resize: (cols: number, rows: number) => void;
}

export async function attachShell(
  exec: Exec,
  namespace: string,
  podName: string,
  ws: WebSocket,
): Promise<ShellConnection> {
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

  console.info(`[ws/shell] attaching to ${podName}/workspace in ${namespace}`);

  const execWs = await exec.exec(
    namespace,
    podName,
    'workspace',
    ['/bin/bash', '-i'],
    stdoutStream,
    stderrStream,
    stdinStream,
    true, // tty
  );

  console.info(`[ws/shell] exec socket opened for ${podName}`);

  execWs.on('message', (raw: Buffer) => {
    // K8s exec protocol: 첫 바이트 = channel, 나머지 = data
    const channel = raw[0];
    // channel 3 = status/error
    if (channel === 3) {
      console.warn(`[ws/shell] status channel message: ${raw.subarray(1).toString()}`);
    }
  });

  execWs.on('close', (code: number, reason: Buffer) => {
    const reasonText = reason.toString() || 'no-reason';
    console.warn(`[ws/shell] exec socket closed (code=${code}, reason=${reasonText}, pod=${podName})`);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'error', message: `Shell session ended (code=${code}, reason=${reasonText}).` }));
      ws.close();
    }
  });

  execWs.on('error', (err: Error) => {
    console.error(`[ws/shell] exec socket error: ${err.message}`);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'error', message: `Shell error: ${err.message}` }));
      ws.close();
    }
  });

  return {
    destroy() {
      stdinStream.destroy();
      stdoutStream.destroy();
      stderrStream.destroy();
      try { execWs.close(); } catch { /* ignore */ }
    },
    get stdin() {
      return stdinStream;
    },
    resize(cols: number, rows: number) {
      if (execWs.readyState !== execWs.OPEN) return;
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
