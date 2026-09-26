/**
 * feedbackApi.ts
 * Service untuk komunikasi HTTP ke backend terkait Feedback & Bug Report BVS.
 * Mengikuti Single Responsibility Principle.
 */

import api from './api';
import { PageContext } from '../hooks/useFeedbackContext';

export type FeedbackType = 'bug' | 'feature_request' | 'general';
export type BugSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'TRIVIAL';
export type BugStatus = 'PENDING' | 'IN_PROGRESS' | 'FIXED' | 'WONT_FIX' | 'APPROVED';

export interface FeedbackPayload {
  type: FeedbackType;
  message: string;
  severity?: BugSeverity;
  context: PageContext;
}

export interface FeedbackResponse {
  success: boolean;
  id?: string;
  message?: string;
  report?: any;
}

export interface BugReportItem {
  id: string;
  brpCode: string;
  routePath: string;
  description: string;
  type: FeedbackType;
  severity: BugSeverity;
  status: BugStatus;
  screenshotUrl: string | null;
  parentBugId: string | null;
  metadata: any;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  reporterEmail: string | null;
  reporterRole: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BugMetrics {
  total: number;
  pending: number;
  inProgress: number;
  fixed: number;
  critical: number;
}

export async function submitFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
  const userStr = localStorage.getItem('dk_auth_user');
  const user = userStr ? JSON.parse(userStr) : null;

  // 1. Simpan ke sistem Bug Report BVS
  const bvsRes = await api.post('/bug-reports', {
    routePath: payload.context.pathname,
    description: payload.message,
    type: payload.type,
    severity: payload.severity || (payload.type === 'bug' ? 'MAJOR' : 'MINOR'),
    reporterEmail: user?.email || 'guest@kampus.rumahku.web.id',
    reporterRole: user?.role || 'DOSEN',
    metadata: {
      url: payload.context.url,
      sessionId: payload.context.sessionId,
      timestamp: payload.context.timestamp,
      timeOnPageMs: payload.context.timeOnPageMs,
      browser: payload.context.browser,
      performance: payload.context.performance,
      networkErrors: payload.context.networkErrors,
      networkRecentSuccess: payload.context.networkRecentSuccess,
      consoleCritical: payload.context.consoleCritical,
      routeHistory: payload.context.routeHistory,
    },
  });

  // 2. Beri makan ke AI Continuous Learning
  await api.post('/v1/ai/learning/feedback', {
    feedbackType: payload.type,
    content: payload.message,
    context: {
      page: payload.context.pathname,
      pageTitle: payload.context.pageTitle,
      url: payload.context.url,
      sessionId: payload.context.sessionId,
    },
    suggestedRule: payload.type === 'bug'
      ? `Bug dilaporkan di '${payload.context.pathname}' [Severity: ${payload.severity || 'MAJOR'}]: ${payload.message}`
      : undefined,
  }, {
    headers: {
      'X-Agent-Key': import.meta.env.VITE_AGENT_KEY || 'kampus-ai-agent-key-dev',
    },
  }).catch(() => null);

  return bvsRes.data;
}

export async function getBugReports(filters?: { status?: string; type?: string; severity?: string; search?: string }): Promise<{ reports: BugReportItem[]; metrics: BugMetrics }> {
  const res = await api.get('/bug-reports', { params: filters });
  return res.data;
}

export async function updateBugReport(id: string, payload: { status?: BugStatus; severity?: BugSeverity; resolutionNotes?: string }): Promise<BugReportItem> {
  const res = await api.patch(`/bug-reports/${id}`, payload);
  return res.data.report;
}

export async function approveBugReport(id: string, approvedBy?: string): Promise<BugReportItem> {
  const res = await api.post(`/bug-reports/${id}/approve`, { approvedBy });
  return res.data.report;
}

export async function mergeBugReports(sourceId: string, targetId: string, mergedBy?: string): Promise<{ source: BugReportItem; target: { brpCode: string } }> {
  const res = await api.post(`/bug-reports/${sourceId}/merge`, { targetId, mergedBy });
  return res.data.result;
}

export async function getAiDebugPrompt(id: string): Promise<{ brpCode: string; prompt: string }> {
  const res = await api.get(`/bug-reports/${id}/ai-prompt`);
  return res.data;
}
