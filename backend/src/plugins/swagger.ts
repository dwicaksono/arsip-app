import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { version } from '../../package.json';

/**
 * Configure Swagger documentation for the API
 * @param fastify Fastify instance
 */
export async function configureSwagger(fastify: FastifyInstance) {
  // Register Swagger plugin
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Arsip App API Documentation',
        description: 'API documentation for the Arsip (Archive) Application',
        version,
        contact: {
          name: 'API Support',
          email: 'support@arsip-app.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
        {
          url: 'https://api.arsip-app.com',
          description: 'Production server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          // Standard success response schema
          SuccessResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              statusCode: { type: 'number', example: 200 },
              message: { type: 'string', example: 'Operation successful' },
              data: { type: 'object', description: 'Response data payload' }
            }
          },
          // Standard error response schema
          ErrorResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              statusCode: { type: 'number', example: 400 },
              message: { type: 'string', example: 'Error message' },
              error: { type: 'string', example: 'Error type' },
              details: { type: 'object', description: 'Additional error details' }
            }
          },
          // Validation error response schema
          ValidationErrorResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              statusCode: { type: 'number', example: 400 },
              message: { type: 'string', example: 'Validation failed' },
              error: { type: 'string', example: 'Bad Request' },
              details: {
                type: 'object',
                properties: {
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string', example: 'email' },
                        message: { type: 'string', example: 'Invalid email format' },
                        code: { type: 'string', example: 'invalid_string' },
                        type: { type: 'string', example: 'invalid_string' }
                      }
                    }
                  },
                  errorsByField: {
                    type: 'object',
                    additionalProperties: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          message: { type: 'string' },
                          code: { type: 'string' },
                          type: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
      },
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'documents', description: 'Document management endpoints' },
        { name: 'system', description: 'System endpoints' },
      ],
    },
  });

  // Register Swagger UI
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformSpecificationClone: true,
  });
}
