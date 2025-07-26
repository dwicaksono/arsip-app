import { z } from 'zod';

// Document upload schema
export const documentUploadSchema = z.object({
  title: z.string()
    .nonempty('Document title is required')
    .min(2, { message: 'Document title must be at least 2 characters long' })
    .max(255, { message: 'Document title cannot exceed 255 characters' }),
  description: z.string()
    .max(1000, { message: 'Document description cannot exceed 1000 characters' })
    .optional(),
  isPublic: z.boolean()
    .optional()
    .default(false),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

// Document search query schema
export const documentSearchSchema = z.object({
  query: z.string().optional().default(''),
});

export type DocumentSearchInput = z.infer<typeof documentSearchSchema>;

// Document response schema
export const documentSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  filePath: z.string(),
  fileType: z.string().nullable(),
  fileSize: z.number(),
  ocrText: z.string().nullable(),
  isPublic: z.boolean().default(false),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type Document = z.infer<typeof documentSchema>;

// Document with URL schema (for response)
export const documentWithUrlSchema = documentSchema.extend({
  fileUrl: z.string(),
});

export type DocumentWithUrl = z.infer<typeof documentWithUrlSchema>;
