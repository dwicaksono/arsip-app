import Fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fastifyAuth from '@fastify/auth';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import { configureSwagger } from './plugins/swagger';
import zodPlugin from './plugins/zod';
import errorHandler from './plugins/error-handler';

// Load environment variables
dotenv.config();

// Create Fastify instance
const fastify: FastifyInstance = Fastify({
  logger: true,
});

// Register plugins
async function registerPlugins() {
  // Error handler (register first to catch all errors)
  await fastify.register(errorHandler);
  
  // CORS
  await fastify.register(fastifyCors, {
    origin: true, // Allow all origins in development
  });

  // JWT
  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'default_secret_change_this',
  });

  // Auth plugin for role-based access control
  await fastify.register(fastifyAuth);

  // Multipart for file uploads
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // Default 10MB
    },
  });

  // Static file serving for uploads
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads'),
    prefix: '/uploads/',
  });
  
  // Configure Swagger documentation
  await configureSwagger(fastify);
  
  // Register Zod validation plugin
  await fastify.register(zodPlugin);
}

// Register routes
async function registerRoutes() {
  // Auth routes
  await fastify.register(authRoutes, { prefix: '/auth' });
  
  // Document routes
  await fastify.register(documentRoutes, { prefix: '/api' });
}

// Start server
async function startServer() {
  try {
    // Register plugins
    await registerPlugins();
    
    // Register routes
    await registerRoutes();
    
    // Import response utilities
    const responseUtils = await import('./utils/response').then(m => m.default);
    
    // Health check route
    fastify.get('/', {
      schema: {
        tags: ['system'],
        summary: 'Health check endpoint',
        description: 'Returns server status information',
        response: {
          200: {
            description: 'Server is healthy',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              statusCode: { type: 'number' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  version: { type: 'string' },
                  environment: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }, async () => {
      return responseUtils.success({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }, 'Server is running');
    });
    
    // Start listening
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on port ${port}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Start the server
startServer();

// For testing/importing
export { fastify };
