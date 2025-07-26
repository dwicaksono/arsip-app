import { FastifyInstance } from 'fastify';
import { db, schema } from '../db';
import { authenticate, checkRole } from '../auth/middleware';
import { eq, and, desc, or, like } from 'drizzle-orm';
import path from 'path';
import { ensureUploadDirExists, saveFile, processOCR } from '../utils/file-utils';
import { getFieldValue } from '../types/multipart';
import { UserPayload } from '../auth/utils';
import { documentUploadSchema, documentSearchSchema } from '../validation/documents';
import responseUtils from '../utils/response';

// Ensure uploads directory exists
ensureUploadDirExists();

export default async function documentRoutes(fastify: FastifyInstance) {
  // Define route schemas for Swagger documentation
  const uploadSchema = {
    tags: ['documents'],
    summary: 'Upload a new document',
    description: 'Upload a document file with metadata',
    security: [{ bearerAuth: [] }],
    consumes: ['multipart/form-data'],
    body: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        description: { type: 'string' }
      }
    },
    response: {
      201: {
        description: 'Document uploaded successfully',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          statusCode: { type: 'number' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              document: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  filePath: { type: 'string' },
                  fileType: { type: 'string' },
                  fileSize: { type: 'number' },
                  ocrText: { type: 'string' },
                  isPublic: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      },
      400: {
        description: 'Bad request',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          statusCode: { type: 'number' },
          message: { type: 'string' },
          error: { type: 'string' },
          details: { type: 'object' }
        }
      },
      401: {
        description: 'Unauthorized',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          statusCode: { type: 'number' },
          message: { type: 'string' },
          error: { type: 'string' }
        }
      },
      500: {
        description: 'Server error',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          statusCode: { type: 'number' },
          message: { type: 'string' },
          error: { type: 'string' }
        }
      }
    }
  };
  
  const getDocumentsSchema = {
    tags: ['documents'],
    summary: 'Get all documents',
    description: 'Returns all documents for the authenticated user',
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: 'List of documents',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          statusCode: { type: 'number' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              documents: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    filePath: { type: 'string' },
                    fileUrl: { type: 'string' },
                    fileType: { type: 'string' },
                    fileSize: { type: 'number' },
                    isPublic: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      },
      401: {
        description: 'Unauthorized',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          statusCode: { type: 'number' },
          message: { type: 'string' },
          error: { type: 'string' }
        }
      },
      500: {
        description: 'Server error',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          statusCode: { type: 'number' },
          message: { type: 'string' },
          error: { type: 'string' }
        }
      }
    }
  };
  
  // Apply authentication middleware to all routes in this plugin
  fastify.addHook('preHandler', authenticate);
  
  // Upload a document
  fastify.post('/upload', { 
    schema: uploadSchema,
    // We can't use Zod validation directly for multipart forms
    // We'll validate the fields manually after parsing
  }, async (request, reply) => {
    try {
      // Get user from request (added by authentication middleware)
      const user = request.user;
      
      if (!user || !user.id) {
        return reply.status(401).send(
          responseUtils.unauthorized('Authentication required')
        );
      }
      
      // Parse multipart form data
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send(
          responseUtils.badRequest('No file uploaded')
        );
      }
      
      // Save file using utility function
      const { fileName, fileSize } = await saveFile(data.file, data.filename);
      
      // Extract document title and description using helper function
      const title = getFieldValue(data, 'title') || data.filename;
      const description = getFieldValue(data, 'description') || '';
      
      // Process OCR (placeholder implementation)
      const ocrText = await processOCR(fileName);
      
      // Validate document metadata using Zod schema
      try {
        const validatedData = documentUploadSchema.parse({
          title,
          description,
          isPublic: false
        });
        
        // Save document metadata to database
        const newDocument = await db.insert(schema.documents).values({
          userId: user.id,
          title: validatedData.title,
          description: validatedData.description || null,
          filePath: fileName,
          fileType: data.mimetype,
          fileSize: fileSize,
          ocrText,
          isPublic: validatedData.isPublic,
        }).returning();
      
        return reply.status(201).send(
          responseUtils.created(
            { document: newDocument[0] },
            'Document uploaded successfully'
          )
        );
      } catch (validationError) {
        console.error('Document validation error:', validationError);
        return reply.status(400).send(
          responseUtils.badRequest('Invalid document data', validationError)
        );
      }
    } catch (error) {
      console.error('Document upload error:', error);
      return reply.status(500).send(
        responseUtils.error(500, 'Internal Server Error', 'An error occurred while uploading the document')
      );
    }
  });
  
  // Get all documents for the authenticated user
  fastify.get('/documents', { schema: getDocumentsSchema }, async (request, reply) => {
    try {
      // Get user from request (added by authentication middleware)
      const user = request.user;
      
      if (!user || !user.id) {
        return reply.status(401).send(
          responseUtils.unauthorized('Authentication required')
        );
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
      
      return reply.send(
        responseUtils.success(
          { documents: transformedDocuments },
          'Documents retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Fetch documents error:', error);
      return reply.status(500).send(
        responseUtils.error(500, 'Internal Server Error', 'An error occurred while fetching documents')
      );
    }
  });
  
  // Get a specific document by ID
  fastify.get<{ Params: { id: string } }>('/documents/:id', {
    schema: {
      tags: ['documents'],
      summary: 'Get document by ID',
      description: 'Returns a specific document by ID if the user has access',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      },
      response: {
        200: {
          description: 'Document details',
          type: 'object',
          properties: {
            document: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                title: { type: 'string' },
                description: { type: 'string' },
                filePath: { type: 'string' },
                fileUrl: { type: 'string' },
                fileType: { type: 'string' },
                fileSize: { type: 'number' },
                isPublic: { type: 'boolean' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          description: 'Document not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = request.user;
      const documentId = parseInt(request.params.id);
      
      if (!user || !user.id) {
        return reply.status(401).send(
          responseUtils.unauthorized('Authentication required')
        );
      }
      
      // Fetch document from database
      const document = await db.query.documents.findFirst({
        where: eq(schema.documents.id, documentId)
      });
      
      if (!document) {
        return reply.status(404).send(
          responseUtils.notFound('Document not found')
        );
      }
      
      // Check if user has access to this document
      // Users can access their own documents or public documents
      if (document.userId !== user.id && !document.isPublic) {
        // Check if user is admin (admins can access all documents)
        const userWithRole = user as UserPayload;
        if (userWithRole.role !== 'admin') {
          return reply.status(403).send(
            responseUtils.forbidden('You do not have permission to access this document')
          );
        }
      }
      
      // Add file URL to document
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const documentWithUrl = {
        ...document,
        fileUrl: `${baseUrl}/uploads/${document.filePath}`
      };
      
      return reply.send(
        responseUtils.success(
          { document: documentWithUrl },
          'Document retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Fetch document error:', error);
      return reply.status(500).send(
        responseUtils.error(500, 'Internal Server Error', 'An error occurred while fetching the document')
      );
    }
  });
  
  // Search documents
  fastify.get<{ Querystring: { query?: string } }>('/search', {
    preHandler: fastify.zodValidation({ schema: documentSearchSchema, dataProperty: 'query' }),
    schema: {
      tags: ['documents'],
      summary: 'Search documents',
      description: 'Search documents by title, description or OCR text',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Search results',
          type: 'object',
          properties: {
            documents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  fileUrl: { type: 'string' },
                  fileType: { type: 'string' },
                  fileSize: { type: 'number' },
                  relevance: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = request.user;
      // Query has been validated by Zod
      const searchQuery = request.query.query || '';
      
      if (!user || !user.id) {
        return reply.status(401).send(
          responseUtils.unauthorized('Authentication required')
        );
      }
      
      // Search documents by title, description or OCR text
      // Users can search their own documents or public documents
      const documents = await db.query.documents.findMany({
        where: and(
          or(
            eq(schema.documents.userId, user.id),
            eq(schema.documents.isPublic, true)
          ),
          or(
            like(schema.documents.title, `%${searchQuery}%`),
            like(schema.documents.description, `%${searchQuery}%`),
            like(schema.documents.ocrText, `%${searchQuery}%`)
          )
        ),
        orderBy: desc(schema.documents.createdAt)
      });
      
      // Transform documents to include full file URL and relevance info
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const transformedDocuments = documents.map(doc => {
        // Determine where the match was found (for relevance info)
        let relevance = 'Unknown match';
        if (doc.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          relevance = 'Title match';
        } else if (doc.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
          relevance = 'Description match';
        } else if (doc.ocrText?.toLowerCase().includes(searchQuery.toLowerCase())) {
          relevance = 'Content match (OCR)';
        }
        
        return {
          id: doc.id,
          title: doc.title,
          description: doc.description,
          fileUrl: `${baseUrl}/uploads/${doc.filePath}`,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          relevance,
          createdAt: doc.createdAt
        };
      });
      
      return reply.send(
        responseUtils.success(
          { documents: transformedDocuments },
          `Found ${transformedDocuments.length} document(s) matching "${searchQuery}"`
        )
      );
    } catch (error) {
      console.error('Search documents error:', error);
      return reply.status(500).send(
        responseUtils.error(500, 'Internal Server Error', 'An error occurred while searching documents')
      );
    }
  });
  
  // Admin route to get all documents (admin only)
  fastify.get('/admin/documents', {
    schema: {
      tags: ['documents'],
      summary: 'Admin: Get all documents',
      description: 'Admin endpoint to get all documents in the system',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'List of all documents',
          type: 'object',
          properties: {
            documents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  userId: { type: 'number' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  fileUrl: { type: 'string' },
                  fileType: { type: 'string' },
                  fileSize: { type: 'number' },
                  isPublic: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            total: { type: 'number' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          description: 'Server error',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    preHandler: [authenticate, checkRole(['admin'])],
  }, async (request, reply) => {
    try {
      // Fetch all documents from database
      const documents = await db.query.documents.findMany({
        orderBy: desc(schema.documents.createdAt)
      });
      
      // Transform documents to include full file URL
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const transformedDocuments = documents.map(doc => ({
        ...doc,
        fileUrl: `${baseUrl}/uploads/${doc.filePath}`
      }));
      
      return reply.send(
        responseUtils.success(
          {
            documents: transformedDocuments,
            total: documents.length
          },
          `Retrieved ${documents.length} documents`
        )
      );
    } catch (error) {
      console.error('Admin fetch documents error:', error);
      return reply.status(500).send(
        responseUtils.error(500, 'Internal Server Error', 'An error occurred while fetching documents')
      );
    }
  });
}
