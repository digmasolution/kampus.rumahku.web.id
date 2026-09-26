import { z } from 'zod';

export const rpsCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').optional().default('Draft RPS'),
  courseName: z.string().trim().optional().default(''),
  courseCode: z.string().trim().regex(/^[A-Za-z0-9_-]*$/, 'Course code must contain only alphanumeric characters, dashes, and underscores').optional().default(''),
  status: z.enum(['DRAFT', 'LENGKAP', 'DIEKSPOR']).optional().default('DRAFT'),
  data: z.record(z.any()).optional().default({}),
  completionPercentage: z.number().int().min(0).max(100).optional(),
});

export const rpsUpdateSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').optional(),
  courseName: z.string().trim().optional(),
  courseCode: z.string().trim().regex(/^[A-Za-z0-9_-]*$/, 'Course code must contain only alphanumeric characters, dashes, and underscores').optional(),
  status: z.enum(['DRAFT', 'LENGKAP', 'DIEKSPOR']).optional(),
  data: z.record(z.any()).optional(),
  completionPercentage: z.number().int().min(0).max(100).optional(),
});

export type RpsCreateInput = z.infer<typeof rpsCreateSchema>;
export type RpsUpdateInput = z.infer<typeof rpsUpdateSchema>;
