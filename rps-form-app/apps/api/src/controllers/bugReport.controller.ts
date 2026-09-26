import { Request, Response, NextFunction } from 'express';
import { bugReportService } from '../services/bugReport.service';
import fs from 'fs';
import path from 'path';

export class BugReportController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { routePath, description, type, severity, metadata, reporterEmail, reporterRole, screenshotBase64, source, vibeId } = req.body;
      if (!description) {
        return res.status(400).json({ success: false, message: 'Description is required' });
      }

      let screenshotUrl = req.body.screenshotUrl;

      // Handle base64 screenshot upload
      if (screenshotBase64) {
        const matches = screenshotBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const uploadDir = path.join(__dirname, '../../../../storage/uploads/bugs');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const filename = `bug-${Date.now()}.png`;
          fs.writeFileSync(path.join(uploadDir, filename), buffer);
          screenshotUrl = `/uploads/bugs/${filename}`;
        }
      }

      const report = await bugReportService.createBugReport({
        routePath,
        description,
        type,
        severity,
        screenshotUrl,
        metadata,
        reporterEmail,
        reporterRole,
        source,
        vibeId
      });

      res.status(201).json({
        success: true,
        message: 'Laporan bug berhasil disimpan',
        report,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, type, severity, search, source, vibeId, relative_time, page, limit } = req.query as Record<string, string>;
      const reportsData = await bugReportService.getBugReports({ 
        status, type, severity, search, source, vibeId, relative_time, 
        page: page ? parseInt(page) : 1, 
        limit: limit ? parseInt(limit) : 10 
      });
      const metrics = await bugReportService.getMetrics();

      res.json({
        success: true,
        metrics,
        pagination: reportsData.pagination,
        reports: reportsData.data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await bugReportService.getBugReportById(id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
      }
      res.json({ success: true, report });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, severity, resolutionNotes, description, parentBugId, assignedToId } = req.body;
      const report = await bugReportService.updateBugReport(id, {
        status,
        severity,
        resolutionNotes,
        description,
        parentBugId,
        assignedToId
      });
      res.json({ success: true, message: 'Laporan diperbarui', report });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await bugReportService.deleteBugReport(id);
      res.json({ success: true, message: 'Laporan dihapus' });
    } catch (err) {
      next(err);
    }
  }

  async merge(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // sourceId
      const { targetId } = req.body;
      if (!targetId) {
        return res.status(400).json({ success: false, message: 'targetId is required' });
      }
      const result = await bugReportService.mergeBugReports(id, targetId);
      res.json({ success: true, message: `Laporan berhasil digabung dan sumber dihapus`, result });
    } catch (err) {
      next(err);
    }
  }

  async prune(req: Request, res: Response, next: NextFunction) {
    try {
      const deletedCount = await bugReportService.pruneBugReports();
      res.json({ success: true, message: `Berhasil prune laporan bug (menghapus ${deletedCount} bug)` });
    } catch (err) {
      next(err);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { assignedToId } = req.body;
      if (!assignedToId) {
         return res.status(400).json({ success: false, message: 'assignedToId is required' });
      }
      const report = await bugReportService.updateBugReport(id, { assignedToId });
      res.json({ success: true, message: 'Assignee diperbarui', report });
    } catch (err) {
      next(err);
    }
  }

  async getDevelopers(req: Request, res: Response, next: NextFunction) {
    try {
      const developers = await bugReportService.getDevelopers();
      res.json({ success: true, developers });
    } catch (err) {
      next(err);
    }
  }

  async generateAiPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const report = await bugReportService.getBugReportById(id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
      }

      const meta = report.metadata || {};
      const prompt = `### [BUG VERIFICATION PROMPT: ${report.brpCode}]
**Severity**: ${report.severity} | **Halaman**: ${report.routePath}
**Tipe**: ${report.type.toUpperCase()}
**Pelapor**: ${report.reporterEmail || 'Anonymous'} (${report.reporterRole || 'DOSEN'})

#### Deskripsi Permasalahan:
${report.description}

#### Metadata Sistem & Lingkungan:
- URL: ${meta.url || report.routePath}
- Session ID: ${meta.sessionId || '-'}
- Browser: ${meta.browser?.userAgent || '-'} (${meta.browser?.viewport || '-'})
- Memory Heap: ${meta.performance?.memoryMB ? meta.performance.memoryMB + ' MB' : '-'}
- Waktu di halaman: ${meta.timeOnPageMs ? Math.round(meta.timeOnPageMs / 1000) + ' detik' : '-'}

#### Jejak Navigasi (Route History):
${meta.routeHistory?.map((r: any) => `- \`${r.path}\` (${r.timestamp})`).join('\n') || 'Tidak ada riwayat rute'}

#### Network Failure Breadcrumb:
${meta.networkErrors?.map((n: any) => `- \`[${n.method}] ${n.url}\` -> Status: **${n.status}** (${n.duration}ms)`).join('\n') || 'Tidak ada error jaringan tercatat'}

#### Console Critical Errors:
\`\`\`
${meta.consoleCritical?.map((c: any) => `[${c.level.toUpperCase()}] ${c.message}`).join('\n') || 'Tidak ada critical console log'}
\`\`\`

Tolong periksa kode terkait rute \`${report.routePath}\`, lakukan investigasi akar masalah (root cause), dan buatkan perbaikan teknis modular tanpa god-code.`;

      res.json({ success: true, brpCode: report.brpCode, prompt });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      const report = await bugReportService.approveBugReport(id, approvedBy);
      res.json({ success: true, message: 'Laporan disetujui (Approved)', report });
    } catch (err) {
      next(err);
    }
  }
}

export const bugReportController = new BugReportController();
