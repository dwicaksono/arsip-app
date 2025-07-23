import { FastifyInstance } from 'fastify';
import { db, schema } from '../db';
import { authenticate } from '../auth/middleware';
import { eq } from 'drizzle-orm';
import path from 'path';
import { ensureUploadDirExists, saveFile, processOCR } from '../utils/file-utils';
import { getFieldValue } from '../types/multipart';

// Ensure uploads directory exists
ensureUploadDirExists();

export default async function documentRoutes(fastify: FastifyInstance) {
  // Apply authentication middleware to all routes in this plugin
  fastify.addHook('preHandler', authenticate);
  
  // Upload a document
  fastify.post('/upload', async (request, reply) => {
    try {
      // Get user from request (added by authentication middleware)
      const user = request.user;
      
      if (!user || !user.id) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      // Parse multipart form data
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }
      
      // Save file using utility function
      const { fileName, fileSize } = await saveFile(data.file, data.filename);
      
      // Extract document title and description using helper function
      const title = getFieldValue(data, 'title') || data.filename;
      const description = getFieldValue(data, 'description') || '';
      
      // Process OCR (placeholder implementation)
      const ocrText = await processOCR(fileName);
      
      // Save document metadata to database
      const newDocument = await db.insert(schema.documents).values({
        userId: user.id,
        title: title as string,
        description: description as string,
        filePath: fileName,
        fileType: data.mimetype,
        fileSize: fileSize,
        ocrText,
      }).returning();
      
      return reply.status(201).send({
        message: 'Document uploaded successfully',
        document: newDocument[0]
      });
    } catch (error) {
      console.error('Document upload error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
  
  // Get all documents for the authenticated user
  fastify.get('/documents', async (request, reply) => {
    try {
      // Get user from request (added by authentication middleware)
      const user = request.user;
      
      if (!user || !user.id) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      
      // Fetch documents from database
      const documents = await db.query.documents.findMany({
        where: eq(schema.documents.userId, user.id),
        orderBy: (documents, { desc }) => [desc(documents.createdAt)],
      });
      
      // Transform documents to include full file URL
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const transformedDocuments = documents.map(doc => ({
        ...doc,
        fileUrl: `${baseUrl}/uploads/${doc.filePath}`
      }));
      
      return reply.send({
        documents: transformedDocuments
      });
    } catch (error) {
      console.error('Fetch documents error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
