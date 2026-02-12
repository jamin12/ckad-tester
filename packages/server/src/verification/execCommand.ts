import type { Exec } from '@kubernetes/client-node';
import { Writable } from 'node:stream';
import { SERVER_CONFIG } from '../config.js';

export async function execCommand(
  exec: Exec,
  namespace: string,
  podName: string,
  command: string[],
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      reject(new Error('Command execution timed out'));
    }, SERVER_CONFIG.execTimeoutMs);

    const stdoutStream = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        stdout += chunk.toString();
        callback();
      },
    });

    const stderrStream = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        stderr += chunk.toString();
        callback();
      },
    });

    exec
      .exec(namespace, podName, 'workspace', command, stdoutStream, stderrStream, null, false)
      .then((wsConnection) => {
        // WebSocket이 닫히면 결과 반환
        if (wsConnection && typeof wsConnection.on === 'function') {
          wsConnection.on('close', () => {
            clearTimeout(timer);
            resolve(stdout.trim());
          });
          wsConnection.on('error', (err: Error) => {
            clearTimeout(timer);
            reject(err);
          });
        } else {
          // Fallback: 짧은 대기 후 결과 반환
          setTimeout(() => {
            clearTimeout(timer);
            if (stderr && !stdout) {
              reject(new Error(stderr.trim()));
            } else {
              resolve(stdout.trim());
            }
          }, 2000);
        }
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
