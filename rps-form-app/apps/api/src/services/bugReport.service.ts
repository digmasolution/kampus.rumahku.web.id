import { prisma } from './rps.service';

export interface CreateBugReportInput {
  routePath: string;
  description: string;
  type?: 'bug' | 'feature_request' | 'general';
  severity?: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'TRIVIAL';
  screenshotUrl?: string;
  metadata?: any;
  reporterEmail?: string;
  reporterRole?: string;
  parentBugId?: string;
  source?: string;
  vibeId?: string;
}

export interface UpdateBugReportInput {
  status?: 'PENDING' | 'IN_PROGRESS' | 'FIXED' | 'WONT_FIX' | 'APPROVED';
  severity?: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'TRIVIAL';
  resolutionNotes?: string;
  parentBugId?: string;
  description?: string;
  assignedToId?: string;
}

export class BugReportService {
  private async generateBrpCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.bugReport.count();
    const num = String(count + 1).padStart(3, '0');
    return `BRP-${year}-${num}`;
  }

  async createBugReport(input: CreateBugReportInput) {
    const brpCode = await this.generateBrpCode();
    
    // Extract severity from metadata if not explicitly provided
    let severity = input.severity || 'MAJOR';
    if (!input.severity && input.metadata && input.metadata.severity) {
      severity = input.metadata.severity;
    }
    
    const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;

    const report = await prisma.bugReport.create({
      data: {
        brpCode,
        routePath: input.routePath || '/',
        description: input.description,
        type: input.type || 'bug',
        severity,
        status: 'PENDING',
        screenshotUrl: input.screenshotUrl || null,
        parentBugId: input.parentBugId || null,
        metadataJson,
        reporterEmail: input.reporterEmail || null,
        reporterRole: input.reporterRole || 'DOSEN',
        source: input.source || null,
        vibeId: input.vibeId || null,
      },
    });

    return report;
  }

  async getBugReports(filters?: { status?: string; type?: string; severity?: string; search?: string; source?: string; vibeId?: string; relative_time?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (filters?.status && filters.status !== 'ALL') where.status = filters.status;
    if (filters?.type && filters.type !== 'ALL') where.type = filters.type;
    if (filters?.severity && filters.severity !== 'ALL') where.severity = filters.severity;
    
    // Filter source (LIKE query on source or metadata containing source)
    if (filters?.source) {
      where.source = { contains: filters.source };
    }
    
    if (filters?.vibeId) {
      where.vibeId = filters.vibeId;
    }
    
    if (filters?.relative_time) {
      // Assuming relative_time is '24h', '7d', '30d'
      const now = new Date();
      if (filters.relative_time === '24h') {
        where.createdAt = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
      } else if (filters.relative_time === '7d') {
        where.createdAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      } else if (filters.relative_time === '30d') {
        where.createdAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      }
    }
    
    if (filters?.search) {
      where.OR = [
        { brpCode: { contains: filters.search } },
        { description: { contains: filters.search } },
        { routePath: { contains: filters.search } },
        { reporterEmail: { contains: filters.search } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const [reports, totalItems] = await Promise.all([
      prisma.bugReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { assignedTo: { select: { id: true, name: true, email: true } } }
      }),
      prisma.bugReport.count({ where })
    ]);

    return {
      data: reports.map((r) => ({
        ...r,
        metadata: r.metadataJson ? JSON.parse(r.metadataJson) : null,
      })),
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      }
    };
  }

  async getBugReportById(id: string) {
    const report = await prisma.bugReport.findUnique({
      where: { id },
      include: { assignedTo: { select: { id: true, name: true, email: true } } }
    });
    if (!report) return null;
    return {
      ...report,
      metadata: report.metadataJson ? JSON.parse(report.metadataJson) : null,
    };
  }

  async updateBugReport(id: string, input: UpdateBugReportInput) {
    const data: any = { ...input };
    if (input.status === 'FIXED') {
      data.resolvedAt = new Date();
    }

    const updated = await prisma.bugReport.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      metadata: updated.metadataJson ? JSON.parse(updated.metadataJson) : null,
    };
  }

  async deleteBugReport(id: string) {
    return prisma.bugReport.delete({ where: { id } });
  }

  async approveBugReport(id: string, approvedBy?: string) {
    const updated = await prisma.bugReport.update({
      where: { id },
      data: {
        status: 'APPROVED',
        resolutionNotes: approvedBy
          ? `Disetujui oleh ${approvedBy} pada ${new Date().toLocaleString('id-ID')}.`
          : `Disetujui pada ${new Date().toLocaleString('id-ID')}.`,
      },
    });
    return {
      ...updated,
      metadata: updated.metadataJson ? JSON.parse(updated.metadataJson) : null,
    };
  }

  async mergeBugReports(sourceId: string, targetId: string) {
    const [source, target] = await Promise.all([
      prisma.bugReport.findUnique({ where: { id: sourceId } }),
      prisma.bugReport.findUnique({ where: { id: targetId } }),
    ]);
    if (!source || !target) {
      throw new Error('Source or target bug report not found');
    }
    if (sourceId === targetId) {
      throw new Error('Cannot merge a report with itself');
    }

    // Gabung desc & notes
    const newDescription = `${target.description}\n\n[Merged from ${source.brpCode}]:\n${source.description}`;
    const newNotes = [target.resolutionNotes, source.resolutionNotes].filter(Boolean).join('\n\n');
    
    // Update metadata
    let targetMeta = target.metadataJson ? JSON.parse(target.metadataJson) : {};
    let sourceMeta = source.metadataJson ? JSON.parse(source.metadataJson) : {};
    const mergedMeta = { ...targetMeta, mergedData: sourceMeta };

    // Update target
    const updatedTarget = await prisma.bugReport.update({
      where: { id: targetId },
      data: {
        description: newDescription,
        resolutionNotes: newNotes,
        metadataJson: JSON.stringify(mergedMeta),
      },
    });

    // Hapus source (hard delete as requested "hapus source")
    await prisma.bugReport.delete({ where: { id: sourceId } });

    return {
      target: { ...updatedTarget, metadata: mergedMeta },
      sourceDeleted: sourceId
    };
  }

  async pruneBugReports() {
    // Pertahankan 30 fixed terbaru, hapus sisanya
    const latestFixed = await prisma.bugReport.findMany({
      where: { status: 'FIXED' },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true }
    });

    const latestIds = latestFixed.map(b => b.id);

    const result = await prisma.bugReport.deleteMany({
      where: {
        status: 'FIXED',
        id: { notIn: latestIds }
      }
    });

    return result.count;
  }

  async getDevelopers() {
    return prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'OWNER'] } },
      select: { id: true, name: true, email: true, role: true }
    });
  }

  async getMetrics() {
    const total = await prisma.bugReport.count();
    const pending = await prisma.bugReport.count({ where: { status: 'PENDING' } });
    const inProgress = await prisma.bugReport.count({ where: { status: 'IN_PROGRESS' } });
    const fixed = await prisma.bugReport.count({ where: { status: 'FIXED' } });
    const approved = await prisma.bugReport.count({ where: { status: 'APPROVED' } });
    const critical = await prisma.bugReport.count({ where: { severity: 'CRITICAL', status: { not: 'FIXED' } } });

    return { total, pending, inProgress, fixed, approved, critical };
  }
}

export const bugReportService = new BugReportService();
