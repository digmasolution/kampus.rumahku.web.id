import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from './rps.service';
import { config } from '../config';

export interface InteractionLogInput {
  agentId?: string;
  agentName?: string;
  rpsDocumentId?: string;
  traceId?: string;
  action: string;
  promptContext?: string;
  requestPayload?: any;
  responsePayload?: any;
  tokensUsed?: number;
  executionMs: number;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'REJECTED';
  errorMessage?: string;
}

export interface ErrorLogInput {
  traceId?: string;
  interactionId?: string;
  agentId?: string;
  errorType: string;
  severity?: 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  stackTrace?: string;
  contextData?: any;
  reproductionStep?: string;
  attemptedFix?: string;
}

export class LoggerService {
  private logDir: string;
  private agentLogPath: string;
  private errorLogPath: string;

  constructor() {
    this.logDir = path.join(config.storageDir, 'logs');
    this.agentLogPath = path.join(this.logDir, 'ai-agent.jsonl');
    this.errorLogPath = path.join(this.logDir, 'ai-errors.jsonl');
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (err: any) {
      console.error(`[LoggerService] Failed to create log directory: ${err.message}`);
    }
  }

  /**
   * Log AI agent interaction to both SQLite DB and ai-agent.jsonl
   */
  async logInteraction(input: InteractionLogInput) {
    this.ensureLogDir();

    const timestamp = new Date().toISOString();
    const traceId = input.traceId || randomUUID();

    const jsonEntry = {
      timestamp,
      traceId,
      agentId: input.agentId || null,
      agentName: input.agentName || null,
      rpsDocumentId: input.rpsDocumentId || null,
      action: input.action,
      status: input.status,
      executionMs: input.executionMs,
      requestPayload: input.requestPayload || null,
      responsePayload: input.responsePayload || null,
      tokensUsed: input.tokensUsed || 0,
      errorMessage: input.errorMessage || null,
    };

    // 1. Append-only filesystem JSONL entry
    try {
      fs.appendFileSync(this.agentLogPath, JSON.stringify(jsonEntry) + '\n', 'utf-8');
    } catch (fsErr: any) {
      console.error(`[LoggerService] Failed writing to ai-agent.jsonl: ${fsErr.message}`);
    }

    // 2. Queryable SQLite DB record via Prisma
    try {
      let validAgentId: string | null = null;
      if (input.agentId) {
        const agent = await prisma.aiAgent.findUnique({ where: { id: input.agentId } }).catch(() => null);
        if (agent) validAgentId = agent.id;
      }

      let validRpsDocId: string | null = null;
      if (input.rpsDocumentId) {
        const doc = await prisma.rpsDocument.findUnique({ where: { id: input.rpsDocumentId } }).catch(() => null);
        if (doc) validRpsDocId = doc.id;
      }

      const dbRecord = await prisma.aiInteractionLog.create({
        data: {
          traceId,
          agentId: validAgentId,
          rpsDocumentId: validRpsDocId,
          action: input.action,
          promptContext: input.promptContext || null,
          requestPayload: input.requestPayload ? JSON.stringify(input.requestPayload) : null,
          responsePayload: input.responsePayload ? JSON.stringify(input.responsePayload) : null,
          tokensUsed: input.tokensUsed || 0,
          executionMs: input.executionMs,
          status: input.status,
          errorMessage: input.errorMessage || null,
        },
      });
      return dbRecord;
    } catch (dbErr: any) {
      console.error(`[LoggerService] Failed saving to AiInteractionLog: ${dbErr.message}`);
      return { id: traceId, ...jsonEntry };
    }
  }

  /**
   * Log error telemetry to both SQLite DB and ai-errors.jsonl
   */
  async logError(input: ErrorLogInput) {
    this.ensureLogDir();

    const timestamp = new Date().toISOString();
    const traceId = input.traceId || randomUUID();

    const jsonEntry = {
      timestamp,
      traceId,
      error: input.message,
      message: input.message,
      errorType: input.errorType,
      severity: input.severity || 'ERROR',
      agentId: input.agentId || null,
      interactionId: input.interactionId || null,
      stackTrace: input.stackTrace || null,
      contextData: input.contextData || null,
      reproductionStep: input.reproductionStep || null,
      attemptedFix: input.attemptedFix || null,
    };

    // 1. Append-only filesystem JSONL entry
    try {
      fs.appendFileSync(this.errorLogPath, JSON.stringify(jsonEntry) + '\n', 'utf-8');
    } catch (fsErr: any) {
      console.error(`[LoggerService] Failed writing to ai-errors.jsonl: ${fsErr.message}`);
    }

    // 2. Queryable SQLite DB record via Prisma
    try {
      let validAgentId: string | null = null;
      if (input.agentId) {
        const agent = await prisma.aiAgent.findUnique({ where: { id: input.agentId } }).catch(() => null);
        if (agent) validAgentId = agent.id;
      }

      let validInteractionId: string | null = null;
      if (input.interactionId) {
        const inter = await prisma.aiInteractionLog.findUnique({ where: { id: input.interactionId } }).catch(() => null);
        if (inter) validInteractionId = inter.id;
      }

      const dbRecord = await prisma.aiErrorLog.create({
        data: {
          interactionId: validInteractionId,
          agentId: validAgentId,
          errorType: input.errorType,
          severity: input.severity || 'ERROR',
          message: input.message,
          stackTrace: input.stackTrace || null,
          contextData: input.contextData ? JSON.stringify(input.contextData) : null,
          reproductionStep: input.reproductionStep || null,
          attemptedFix: input.attemptedFix || null,
        },
      });
      return dbRecord;
    } catch (dbErr: any) {
      console.error(`[LoggerService] Failed saving to AiErrorLog: ${dbErr.message}`);
      return { id: traceId, ...jsonEntry };
    }
  }

  async getRecentInteractions(limit = 50) {
    return prisma.aiInteractionLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { agent: true, feedbacks: true, errorLogs: true },
    });
  }

  async getRecentErrors(limit = 50) {
    return prisma.aiErrorLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { agent: true, interaction: true },
    });
  }
}

export const loggerService = new LoggerService();
