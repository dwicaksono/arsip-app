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
import { ZodError } from 'zod';

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
    // Note: We don't validate the body here because multipart forms
    // need special handling. Validation is done manually in the handler.
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
      console.log('=== UPLOAD REQUEST DEBUG ===');
      console.log('Request method:', request.method);
      console.log('Request URL:', request.url);
      console.log('Content-Type:', request.headers['content-type']);
      console.log('Authorization:', request.headers.authorization ? 'Present' : 'Missing');
      console.log('=== END DEBUG ===');
      
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
          responseUtils.badRequest('No file uploaded. Please select a file to upload.')
        );
      }
      
      // Validate file properties
      if (!data.filename) {
        return reply.status(400).send(
          responseUtils.badRequest('File must have a filename')
        );
      }
      
      // Save file using utility function
      let fileName: string, fileSize: number;
      try {
        const result = await saveFile(data.file, data.filename);
        fileName = result.fileName;
        fileSize = result.fileSize;
      } catch (fileError) {
        console.error('File save error:', fileError);
        return reply.status(500).send(
          responseUtils.error(500, 'File Upload Error', 'Failed to save uploaded file')
        );
      }
      
      // Extract document title and description using helper function
      const title = getFieldValue(data, 'title') || data.filename;
      const description = getFieldValue(data, 'description') || '';
      
      // Validate that title is provided
      if (!title || title.trim() === '') {
        return reply.status(400).send(
          responseUtils.badRequest('Document title is required. Please provide a title for your document.')
        );
      }
      
      // Process OCR (placeholder implementation)
      let ocrText: string;
      try {
        ocrText = await processOCR(fileName);
      } catch (ocrError) {
        console.error('OCR processing error:', ocrError);
        // OCR failure shouldn't stop the upload, just log it
        ocrText = '';
      }
      
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
      } catch (validationError: unknown) {
        console.error('Document validation error:', validationError);
        
        // Handle Zod validation errors with specific messages
        if (validationError instanceof ZodError) {
          const validationErrors = validationError.issues.map((issue: any) => ({
            field: issue.path.join('.') || 'unknown',
            message: issue.message,
            code: issue.code,
            value: issue.code === 'invalid_type' ? undefined : issue.received
          }));
          
          return reply.status(400).send(
            responseUtils.validationError(validationErrors)
          );
        }
        
        // Fallback for other validation errors
        return reply.status(400).send(
          responseUtils.badRequest('Document validation failed', {
            error: validationError instanceof Error ? validationError.message : 'Unknown validation error',
            details: validationError
          })
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
      
      console.log('=== GET DOCUMENT BY ID DEBUG ===');
      console.log('User ID:', user?.id);
      console.log('Document ID:', documentId);
      console.log('Parsed ID type:', typeof documentId);
      console.log('Is NaN:', isNaN(documentId));
      
      if (!user || !user.id) {
        return reply.status(401).send(
          responseUtils.unauthorized('Authentication required')
        );
      }
      
      if (isNaN(documentId)) {
        return reply.status(400).send(
          responseUtils.badRequest('Invalid document ID format')
        );
      }
      
      // Fetch document from database
      console.log('Querying database for document ID:', documentId);
      const document = await db.query.documents.findFirst({
        where: eq(schema.documents.id, documentId)
      });
      
      console.log('Database query result:', document);
      
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
        // if (userWithRole.role !== 'admin') {
        //   return reply.status(403).send(
        //     responseUtils.forbidden('You do not have permission to access this document')
        //   );
        // }
      }
      
      // Add file URL to document and ensure dates are serializable
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const documentWithUrl = {
        ...document,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
        fileUrl: `${baseUrl}/uploads/${document.filePath}`
      };
      
      console.log('Document with URL:', documentWithUrl);
      console.log('Response data structure:', { document: documentWithUrl });
      
      // Try the simplest possible response
      const simpleResponse = {
        id: document.id,
        title: document.title,
        message: 'test response'
      };
      
      console.log('Simple response:', JSON.stringify(simpleResponse, null, 2));
      console.log('=== END GET DOCUMENT DEBUG ===');
      
      return reply.send(simpleResponse);
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
