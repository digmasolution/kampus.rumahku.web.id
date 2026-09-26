import { PrismaClient, RpsDocument } from '@prisma/client';
import { RpsCreateInput, RpsUpdateInput } from '../validators/rps.validator';
import { AppError } from '../middleware/errorHandler';

export const prisma = new PrismaClient();

export function calculateCompletionPercentage(data: any, courseName?: string, courseCode?: string): number {
  let score = 0;

  // 1. Identity MK (20%)
  if ((courseName || data.courseName || data.namaMataKuliah) && (courseCode || data.courseCode || data.kodeMataKuliah)) {
    score += 20;
  } else if (courseName || courseCode) {
    score += 10;
  }

  // 2. Dosen & Pengesahan (10%)
  if (data.dosenPengembang || data.koordinator || data.koordinatorMk) {
    score += 10;
  }

  // 3. Capaian Pembelajaran (15%)
  if (Array.isArray(data.cplList) && data.cplList.length > 0) {
    score += 15;
  }

  // 4. Bahan Kajian (10%)
  if (data.bahanKajian && typeof data.bahanKajian === 'string' && data.bahanKajian.trim().length > 0) {
    score += 10;
  }

  // 5. Metode Pembelajaran (10%)
  if (data.metodePembelajaran && (
    (typeof data.metodePembelajaran === 'object' && Object.values(data.metodePembelajaran).some(Boolean)) ||
    (Array.isArray(data.metodePembelajaran) && data.metodePembelajaran.length > 0)
  )) {
    score += 10;
  }

  // 6. Rencana Mingguan (15%)
  if (Array.isArray(data.rencanaMingguan) && data.rencanaMingguan.length > 0) {
    score += 15;
  }

  // 7. Penilaian (10%)
  if (Array.isArray(data.penilaian) && data.penilaian.length > 0) {
    score += 10;
  }

  // 8. Referensi (10%)
  if (data.pustakaUtama || data.referensiUtama || data.pustakaPendukung) {
    score += 10;
  }

  return Math.min(100, score);
}

export class RpsService {
  async getAll(search?: string, status?: string): Promise<RpsDocument[]> {
    const where: any = {};

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term } },
        { courseName: { contains: term } },
        { courseCode: { contains: term } },
      ];
    }

    if (status && status !== 'Semua Status' && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    return prisma.rpsDocument.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getById(id: string): Promise<RpsDocument> {
    const doc = await prisma.rpsDocument.findUnique({ where: { id } });
    if (!doc) {
      throw new AppError(`RPS Document with ID '${id}' not found`, 404, 'NOT_FOUND');
    }
    return doc;
  }

  async create(input: RpsCreateInput): Promise<RpsDocument> {
    const dataObj = input.data || {};
    const courseName = input.courseName || dataObj.courseName || dataObj.namaMataKuliah || '';
    const courseCode = input.courseCode || dataObj.courseCode || dataObj.kodeMataKuliah || '';
    const title = input.title || `RPS ${courseName || 'Draft'}`.trim();

    const completion = input.completionPercentage ?? calculateCompletionPercentage(dataObj, courseName, courseCode);

    return prisma.rpsDocument.create({
      data: {
        title,
        courseName,
        courseCode,
        status: input.status || (completion === 100 ? 'LENGKAP' : 'DRAFT'),
        dataJson: JSON.stringify(dataObj),
        completionPercentage: completion,
      },
    });
  }

  async update(id: string, input: RpsUpdateInput): Promise<RpsDocument> {
    const existing = await this.getById(id);

    const dataObj = input.data !== undefined ? input.data : JSON.parse(existing.dataJson || '{}');
    const courseName = input.courseName !== undefined ? input.courseName : existing.courseName;
    const courseCode = input.courseCode !== undefined ? input.courseCode : existing.courseCode;
    const title = input.title !== undefined ? input.title : existing.title;

    const completion = input.completionPercentage !== undefined
      ? input.completionPercentage
      : calculateCompletionPercentage(dataObj, courseName, courseCode);

    const status = input.status !== undefined
      ? input.status
      : (completion === 100 && existing.status === 'DRAFT' ? 'LENGKAP' : existing.status);

    return prisma.rpsDocument.update({
      where: { id },
      data: {
        title,
        courseName,
        courseCode,
        status,
        dataJson: JSON.stringify(dataObj),
        completionPercentage: completion,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await prisma.rpsDocument.delete({ where: { id } });
  }
}

export const rpsService = new RpsService();
