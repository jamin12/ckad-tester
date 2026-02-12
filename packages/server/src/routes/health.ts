import { Router } from 'express';
import type { Router as RouterType } from 'express';

export const healthRouter: RouterType = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});
