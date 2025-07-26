import { z } from 'zod';

// Document upload schema
export const documentUploadSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
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
