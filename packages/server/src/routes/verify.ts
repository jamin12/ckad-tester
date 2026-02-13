import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { sessionManager } from '../sessions/SessionManager.js';
import { runVerification } from '../verification/verifier.js';

const verifyBodySchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string(),
  checks: z.array(
    z.object({
      description: z.string(),
      command: z.string(),
      expected: z.string(),
      jsonpath: z.string().optional(),
      weight: z.number().optional(),
    }),
  ),
});

export const verifyRouter: RouterType = Router();

verifyRouter.post('/verify', async (req, res) => {
  const parsed = verifyBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }

  const { sessionId, questionId, checks } = parsed.data;
  const entry = sessionManager.getSession(sessionId);

  if (!entry) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  if (!entry.podName) {
    res.status(400).json({ error: 'Workspace pod not ready' });
    return;
  }

  try {
    const result = await runVerification(entry.exec, entry.namespace, entry.podName, questionId, checks);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: `Verification failed: ${String(err)}` });
  }
});
