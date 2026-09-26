import fs from 'fs';
import path from 'path';
import { prisma } from './rps.service';
import { config } from '../config';

export interface IssueFixInput {
  id?: string;
  timestamp?: string;
  issueTitle: string;
  category: string;
  userRequest?: string;
  rootCause: string;
  technicalFix: string;
  affectedFiles?: string[];
  preventionRule?: string;
  verifiedBy?: string;
}

export const INITIAL_HISTORICAL_FIXES: IssueFixInput[] = [
  {
    id: 'fix-m1-ts-build',
    timestamp: '2026-09-24T08:30:00.000Z',
    issueTitle: 'TypeScript strict mode compilation errors in apps/web',
    category: 'BUILD_COMPILER',
    userRequest: 'Fix frontend build errors preventing npm run build in apps/web',
    rootCause: 'tsconfig enabled noUnusedLocals and noUnusedParameters, but React and several icons/parameters were unused across wizard and components',
    technicalFix: 'Removed unused React imports (React 18 JSX transform), cleaned unreferenced Lucide icon imports, and added explicit TypeScript type annotations to event parameters',
    affectedFiles: ['rps-form-app/apps/web/src/pages/Wizard.tsx', 'rps-form-app/apps/web/src/components/RpsForm/'],
    preventionRule: 'RULE_TS_STRICT_UNUSED_SYMBOLS',
    verifiedBy: 'Worker M1 / npm --prefix apps/web run build',
  },
  {
    id: 'fix-m1-docx-pdf-export',
    timestamp: '2026-09-24T09:15:00.000Z',
    issueTitle: 'DOCX table corruption and LibreOffice PDF conversion timeouts',
    category: 'DOCX_EXPORT',
    userRequest: 'Exporting RPS to DOCX and converting to PDF fails or produces corrupted tables',
    rootCause: 'Docxtemplater paragraph loops inside table rows with vertical XML cell merges (<w:vMerge>) corrupted Word document XML; headless LibreOffice hung without swap space',
    technicalFix: 'Isolated dynamic weekly plan loop rows from vertically merged identity header cells, and configured LibreOffice execution timeout with fallback error handler and 1GB swap requirement on VPS',
    affectedFiles: ['rps-form-app/apps/api/src/services/docx.service.ts', 'rps-form-app/templates/processed/rps-template-processed.docx'],
    preventionRule: 'RULE_DOCX_NO_VERTICAL_MERGE_LOOP',
    verifiedBy: 'Worker M1 / Tier 1 test_export_endpoints.js & Tier 3 pipeline tests',
  },
  {
    id: 'fix-m2-router-introspection',
    timestamp: '2026-09-24T10:45:00.000Z',
    issueTitle: 'AI Router Introspection & Layer 2 Doctor Diagnostics Facade Violation',
    category: 'AI_INTROSPECTION',
    userRequest: 'Provide AI DX endpoints and authentic 3-layer anti-hallucination diagnostic without hardcoded mock responses',
    rootCause: 'Express route discovery relied on static list and runDoctorDiagnostics simulated curl loopback rather than dynamically traversing Express router stack and executing genuine HTTP loopback requests',
    technicalFix: 'Implemented extractExpressRoutes crawler walking app._router.stack recursively, wired genuine HTTP loopback requests to /api/rps, and bound live Express instance to AiService via setApp(app)',
    affectedFiles: ['rps-form-app/apps/api/src/services/ai.service.ts', 'rps-form-app/apps/api/src/server.ts'],
    preventionRule: 'RULE_GENUINE_INTROSPECTION',
    verifiedBy: 'Worker M2 / Tier 1 test_ai_dx_endpoints.js & Tier 1 test_persistent_logs.js',
  },
  {
    id: 'fix-m3-vps-isolation-packaging',
    timestamp: '2026-09-24T11:30:00.000Z',
    issueTitle: 'VPS Deployment Multi-Tenant Conflict Risk & Deadlock Prevention',
    category: 'VPS_DEPLOYMENT',
    userRequest: 'Deploy to VPS 38.103.170.236 without scp -r, without pipe deadlocks, and without disturbing existing tenants (syukran, arabiq, uncm)',
    rootCause: 'Raw recursive folder uploads (scp -r) can overwrite root directories; Windows-WSL binary pipes cause buffer deadlocks; shared ports/directories risk colliding with existing Apache virtual hosts',
    technicalFix: 'Packaged production bundle into web_build.zip, enforced remote unzip -o, strictly isolated directory to /var/www/kampus-dosen with dedicated Node.js port 3005 and Apache reverse proxy kampus.conf, and created fix_server.php 1-click fallback script',
    affectedFiles: ['deploy.ps1', 'deploy.sh', 'fix_server.php', 'kampus.conf', 'kampus-api.service'],
    preventionRule: 'RULE_VPS_ZIP_DEPLOY_ISOLATION',
    verifiedBy: 'Worker M3 / Tier 1 test_vps_scripts.js & Tier 3 test_deploy_package_contents.js',
  },
];

export interface CreateRuleInput {
  ruleCode: string;
  category: string;
  title: string;
  description: string;
  triggerCondition: string;
  recommendedFix: string;
  agentId?: string;
  confidenceScore?: number;
}

export interface FeedbackInput {
  agentName?: string;
  agentId?: string;
  interactionId?: string;
  rpsDocumentId?: string;
  userId?: string;
  rating?: number;
  feedbackType?: string;
  feedbackCategory?: string;
  content?: string;
  comments?: string;
  suggestedRule?: string;
  userCorrection?: string;
  aiOutputOriginal?: string;
}

export const INITIAL_LEARNED_RULES: CreateRuleInput[] = [
  {
    ruleCode: 'RULE_TS_STRICT_UNUSED_SYMBOLS',
    category: 'ERROR_AVOIDANCE',
    title: 'TypeScript strict mode rejects unused imports and variables',
    description: 'In apps/web, noUnusedLocals and noUnusedParameters are enabled. Never leave unused imports (e.g. React in React 18, unused icons).',
    triggerCondition: 'code generation in apps/web',
    recommendedFix: 'Clean all unused imports and add explicit parameter types.',
    confidenceScore: 1.0,
  },
  {
    ruleCode: 'RULE_DOCX_NO_VERTICAL_MERGE_LOOP',
    category: 'DOCX_EXPORT',
    title: 'Avoid paragraph loops across vertically merged cells in Word',
    description: 'Docxtemplater paragraph loops inside table rows with vertical XML cell merges (<w:vMerge>) corrupt DOCX layout. Keep weekly table rows structurally isolated from merged identity headers.',
    triggerCondition: 'export.generate or template editing',
    recommendedFix: 'Ensure Table 1 header rows and dynamic weekly plan rows are separated or lack nested vertical merges.',
    confidenceScore: 1.0,
  },
  {
    ruleCode: 'RULE_RPS_ASSESSMENT_TOTAL_100',
    category: 'RPS_PEDAGOGY',
    title: 'Weekly assessment weights must strictly sum to 100%',
    description: 'SN-Dikti requires the cumulative assessment weight across all weeks (including UTS and UAS) to equal exactly 100%.',
    triggerCondition: 'rps.update_section (rencanaMingguan) or rps.audit_compliance',
    recommendedFix: 'Compute sum of weekly bobotPenilaian before saving and warn/reject if sum != 100.',
    confidenceScore: 1.0,
  },
  {
    ruleCode: 'RULE_PDO_SAFETY_NAMED_PARAMS',
    category: 'DATABASE_INTEGRITY',
    title: 'PDO Safety: Never reuse named parameters in a single PDO query',
    description: 'DILARANG menggunakan named parameter yang sama (misal :id) lebih dari sekali dalam satu query PDO. Wajib membedakannya (misal :id_1, :id_2) untuk menghindari Fatal Error 500.',
    triggerCondition: 'SQL / PDO backend query preparation',
    recommendedFix: 'Use distinct parameter suffixes :id_1, :id_2.',
    confidenceScore: 1.0,
  },
  {
    ruleCode: 'RULE_WSL_WINDOWS_NO_BINARY_PIPE',
    category: 'DEPLOYMENT_SAFETY',
    title: 'WSL to Windows Binary Pipe Deadlock Prevention',
    description: 'DILARANG menjalankan binary Windows dari dalam WSL lalu meng-pipe output-nya ke proses Linux. Menyebabkan deadlock permanen.',
    triggerCondition: 'Terminal execution / deployment scripts',
    recommendedFix: 'Run Windows binaries directly from PowerShell/CMD.',
    confidenceScore: 1.0,
  },
];

export class LearningService {
  private seeded = false;

  /**
   * Seed initial architectural & domain rules into AiLearnedRule
   */
  async seedInitialRules(): Promise<void> {
    if (this.seeded) return;
    try {
      // Ensure default AI agent exists for relation references
      await prisma.aiAgent.upsert({
        where: { apiKeyHash: 'kampus-ai-agent-key-dev' },
        update: {
          name: 'Development AI Agent',
          platform: 'developer-workspace',
          role: 'AGENT_ADMIN',
          isActive: true,
        },
        create: {
          id: 'default-ai-agent-id',
          name: 'Development AI Agent',
          platform: 'developer-workspace',
          apiKeyHash: 'kampus-ai-agent-key-dev',
          role: 'AGENT_ADMIN',
          isActive: true,
        },
      }).catch(() => null);

      for (const rule of INITIAL_LEARNED_RULES) {
        await prisma.aiLearnedRule.upsert({
          where: { ruleCode: rule.ruleCode },
          update: {
            title: rule.title,
            description: rule.description,
            triggerCondition: rule.triggerCondition,
            recommendedFix: rule.recommendedFix,
            category: rule.category,
            confidenceScore: rule.confidenceScore ?? 1.0,
            isActive: true,
          },
          create: {
            ruleCode: rule.ruleCode,
            category: rule.category,
            title: rule.title,
            description: rule.description,
            triggerCondition: rule.triggerCondition,
            recommendedFix: rule.recommendedFix,
            confidenceScore: rule.confidenceScore ?? 1.0,
            isActive: true,
          },
        });
      }
      this.seeded = true;
    } catch (err: any) {
      console.error(`[LearningService] Error seeding initial rules: ${err.message}`);
    }
  }

  /**
   * Retrieve active learned rules and error avoidance memory
   */
  async getRules(category?: string) {
    await this.seedInitialRules();

    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }

    return prisma.aiLearnedRule.findMany({
      where,
      orderBy: { confidenceScore: 'desc' },
    });
  }

  /**
   * Register a new learned rule discovered by AI or human developer
   */
  async registerRule(input: CreateRuleInput) {
    let validAgentId: string | null = null;
    if (input.agentId) {
      const agent = await prisma.aiAgent.findUnique({ where: { id: input.agentId } }).catch(() => null);
      if (agent) validAgentId = agent.id;
    }

    return prisma.aiLearnedRule.upsert({
      where: { ruleCode: input.ruleCode },
      update: {
        category: input.category,
        title: input.title,
        description: input.description,
        triggerCondition: input.triggerCondition,
        recommendedFix: input.recommendedFix,
        confidenceScore: input.confidenceScore ?? 1.0,
        isActive: true,
      },
      create: {
        ruleCode: input.ruleCode,
        category: input.category,
        title: input.title,
        description: input.description,
        triggerCondition: input.triggerCondition,
        recommendedFix: input.recommendedFix,
        agentId: validAgentId,
        confidenceScore: input.confidenceScore ?? 1.0,
        isActive: true,
      },
    });
  }

  /**
   * Record human or agent feedback regarding AI output
   */
  async submitFeedback(input: FeedbackInput) {
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

    let validRpsDocId: string | null = null;
    if (input.rpsDocumentId) {
      const doc = await prisma.rpsDocument.findUnique({ where: { id: input.rpsDocumentId } }).catch(() => null);
      if (doc) validRpsDocId = doc.id;
    }

    const feedback = await prisma.aiFeedback.create({
      data: {
        agentId: validAgentId,
        interactionId: validInteractionId,
        rpsDocumentId: validRpsDocId,
        userId: input.userId || null,
        rating: input.rating ?? 5,
        feedbackCategory: input.feedbackCategory || input.feedbackType || 'GENERAL_FEEDBACK',
        userCorrection: input.userCorrection || null,
        aiOutputOriginal: input.aiOutputOriginal || null,
        comments: input.comments || input.content || null,
      },
    });

    // If a rule was suggested in feedback, automatically register a candidate learned rule
    if (input.suggestedRule) {
      const code = `RULE_FEEDBACK_${Date.now()}`;
      await this.registerRule({
        ruleCode: code,
        category: 'FEEDBACK_DERIVED',
        title: `Derived from feedback: ${input.agentName || 'Agent'}`,
        description: input.suggestedRule,
        triggerCondition: input.feedbackCategory || 'General AI Operations',
        recommendedFix: input.suggestedRule,
        confidenceScore: 0.8,
      });
    }

    return feedback;
  }

  private getLogDirectories(): string[] {
    const dirs: string[] = [path.join(config.storageDir, 'logs')];
    const rootLogDir = path.resolve(config.appRoot, '../storage/logs');
    if (!dirs.includes(rootLogDir)) {
      dirs.push(rootLogDir);
    }
    return dirs;
  }

  ensureSummaryFiles(): void {
    const logDirs = this.getLogDirectories();
    for (const dir of logDirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const jsonlPath = path.join(dir, 'issue-fix-summary.jsonl');
        const mdPath = path.join(dir, 'ISSUE_FIX_SUMMARY.md');

        if (!fs.existsSync(jsonlPath) || fs.readFileSync(jsonlPath, 'utf-8').trim().length === 0) {
          const lines = INITIAL_HISTORICAL_FIXES.map(f => JSON.stringify(f)).join('\n') + '\n';
          fs.writeFileSync(jsonlPath, lines, 'utf-8');
        }

        if (!fs.existsSync(mdPath) || fs.readFileSync(mdPath, 'utf-8').trim().length === 0) {
          let mdContent = `# Issue-to-Fix Summary & Technical Learning Log\n\n`;
          mdContent += `Concise historical registry of system issues, root causes, technical fixes, and prevention rules.\n\n`;
          for (const item of INITIAL_HISTORICAL_FIXES) {
            mdContent += `### [${item.category}] ${item.issueTitle}\n`;
            mdContent += `- **ID**: \`${item.id}\` | **Date**: ${item.timestamp}\n`;
            if (item.userRequest) mdContent += `- **User Request**: ${item.userRequest}\n`;
            mdContent += `- **Root Cause**: ${item.rootCause}\n`;
            mdContent += `- **Technical Fix**: ${item.technicalFix}\n`;
            if (item.affectedFiles && item.affectedFiles.length > 0) {
              mdContent += `- **Affected Files**: ${item.affectedFiles.map(f => `\`${f}\``).join(', ')}\n`;
            }
            if (item.preventionRule) mdContent += `- **Prevention Rule**: \`${item.preventionRule}\`\n`;
            if (item.verifiedBy) mdContent += `- **Verified By**: ${item.verifiedBy}\n`;
            mdContent += `\n---\n\n`;
          }
          fs.writeFileSync(mdPath, mdContent, 'utf-8');
        }
      } catch (err: any) {
        console.error(`[LearningService] Failed to ensure summary files in ${dir}: ${err.message}`);
      }
    }
  }

  async getIssueFixSummaries(): Promise<IssueFixInput[]> {
    this.ensureSummaryFiles();
    const primaryJsonl = path.join(config.storageDir, 'logs/issue-fix-summary.jsonl');
    if (!fs.existsSync(primaryJsonl)) {
      return INITIAL_HISTORICAL_FIXES;
    }
    const content = fs.readFileSync(primaryJsonl, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const results: IssueFixInput[] = [];
    for (const line of lines) {
      try {
        results.push(JSON.parse(line));
      } catch {
        // ignore malformed line
      }
    }
    return results.length > 0 ? results : INITIAL_HISTORICAL_FIXES;
  }

  async recordIssueFix(input: IssueFixInput): Promise<IssueFixInput> {
    if (!input.issueTitle || !input.technicalFix || !input.rootCause) {
      throw new Error("Missing required fields: 'issueTitle', 'rootCause', and 'technicalFix' are required");
    }

    this.ensureSummaryFiles();
    const entry: IssueFixInput = {
      id: input.id || `fix-${Date.now()}`,
      timestamp: input.timestamp || new Date().toISOString(),
      issueTitle: input.issueTitle,
      category: input.category || 'TECHNICAL_FIX',
      userRequest: input.userRequest || undefined,
      rootCause: input.rootCause,
      technicalFix: input.technicalFix,
      affectedFiles: input.affectedFiles || [],
      preventionRule: input.preventionRule || undefined,
      verifiedBy: input.verifiedBy || undefined,
    };

    const line = JSON.stringify(entry) + '\n';
    const logDirs = this.getLogDirectories();

    for (const dir of logDirs) {
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const jsonlPath = path.join(dir, 'issue-fix-summary.jsonl');
        fs.appendFileSync(jsonlPath, line, 'utf-8');

        const mdPath = path.join(dir, 'ISSUE_FIX_SUMMARY.md');
        let mdSnippet = `### [${entry.category}] ${entry.issueTitle}\n`;
        mdSnippet += `- **ID**: \`${entry.id}\` | **Date**: ${entry.timestamp}\n`;
        if (entry.userRequest) mdSnippet += `- **User Request**: ${entry.userRequest}\n`;
        mdSnippet += `- **Root Cause**: ${entry.rootCause}\n`;
        mdSnippet += `- **Technical Fix**: ${entry.technicalFix}\n`;
        if (entry.affectedFiles && entry.affectedFiles.length > 0) {
          mdSnippet += `- **Affected Files**: ${entry.affectedFiles.map(f => `\`${f}\``).join(', ')}\n`;
        }
        if (entry.preventionRule) mdSnippet += `- **Prevention Rule**: \`${entry.preventionRule}\`\n`;
        if (entry.verifiedBy) mdSnippet += `- **Verified By**: ${entry.verifiedBy}\n`;
        mdSnippet += `\n---\n\n`;
        fs.appendFileSync(mdPath, mdSnippet, 'utf-8');
      } catch (err: any) {
        console.error(`[LearningService] Failed writing summary entry to ${dir}: ${err.message}`);
      }
    }

    if (entry.preventionRule) {
      const ruleCode = entry.preventionRule.startsWith('RULE_')
        ? entry.preventionRule
        : `RULE_${(entry.id || 'FIX').toUpperCase()}`;
      await this.registerRule({
        ruleCode,
        category: entry.category,
        title: entry.issueTitle,
        description: `${entry.rootCause} -> Technical Fix: ${entry.technicalFix}`,
        triggerCondition: entry.category,
        recommendedFix: entry.technicalFix,
        confidenceScore: 0.95,
      }).catch(() => null);
    }

    return entry;
  }
}

export const learningService = new LearningService();
