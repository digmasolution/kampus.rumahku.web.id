import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../services/rps.service';

export interface AgentContext {
  id: string;
  name: string;
  platform: string;
  role: string;
}

export interface AgentRequest extends Request {
  agent?: AgentContext;
  traceId?: string;
}

const STATIC_ALLOWED_KEYS = new Set([
  'kampus-ai-agent-key-dev',
  'default-ai-agent-key',
  ...(process.env.AI_AGENT_KEY ? [process.env.AI_AGENT_KEY] : [])
]);

export async function agentAuth(req: AgentRequest, res: Response, next: NextFunction) {
  // Extract token from X-Agent-Key or Authorization header
  let rawKey = req.headers['x-agent-key'] as string | undefined;

  if (!rawKey && req.headers.authorization) {
    const authHeader = req.headers.authorization as string;
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      rawKey = parts[1];
    }
  }

  // Validate presence and non-whitespace
  if (!rawKey || typeof rawKey !== 'string' || rawKey.trim() === '') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or empty agent authentication key. Provide a valid X-Agent-Key or Authorization header.',
      message: 'Unauthorized: Missing or empty agent authentication key. Provide a valid X-Agent-Key or Authorization header.'
    });
  }

  const token = rawKey.trim();

  // Validate against static allowed keys
  let isAuthorized = STATIC_ALLOWED_KEYS.has(token);
  let agentRecord: any = null;

  if (!isAuthorized) {
    try {
      // Check database for registered AI agent key
      agentRecord = await prisma.aiAgent.findFirst({
        where: {
          OR: [
            { apiKeyHash: token },
            { id: token }
          ],
          isActive: true
        }
      });
      if (agentRecord) {
        isAuthorized = true;
      }
    } catch {
      // Database lookup failure should safely decline rather than crash with 500
      isAuthorized = false;
    }
  }

  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid agent key or credentials.',
      message: 'Unauthorized: Invalid agent key or credentials.'
    });
  }

  // Generate trace ID if not provided
  const traceId = (req.headers['x-correlation-id'] as string) ||
                  (req.headers['x-trace-id'] as string) ||
                  randomUUID();
  req.traceId = traceId;

  // Set agent context
  req.agent = {
    id: (req.headers['x-agent-id'] as string) || agentRecord?.id || 'agent-default',
    name: (req.headers['x-agent-name'] as string) || agentRecord?.name || 'Agent',
    platform: (req.headers['x-agent-platform'] as string) || agentRecord?.platform || 'generic',
    role: agentRecord?.role || 'AGENT_CONTRIBUTOR'
  };

  next();
}
