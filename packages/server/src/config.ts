export const SERVER_CONFIG = {
  port: Number(process.env['PORT'] ?? 3001),
  sessionTtlMs: 30 * 60 * 1000,       // 30분
  cleanupIntervalMs: 60 * 1000,        // 60초
  execTimeoutMs: 10 * 1000,            // 10초
  workspacePodImage: 'debian:bookworm-slim',
  workspacePodPrefix: 'ckad-workspace',
} as const;
