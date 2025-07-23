import Fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';

// Load environment variables
dotenv.config();

// Create Fastify instance
const fastify: FastifyInstance = Fastify({
  logger: true,
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(fastifyCors, {
    origin: true, // Allow all origins in development
  });

  // JWT
  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'default_secret_change_this',
  });

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

  // Add authentication decorator
  fastify.decorate('auth', function(handlers: any[]) {
    return handlers;
  });
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
    
    // Health check route
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });
    
    // Get port from environment or use default
    const port = parseInt(process.env.PORT || '3000');
    
    // Start listening
    await fastify.listen({ port, host: '0.0.0.0' });
    
    console.log(`Server is running at http://localhost:${port}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

// Start the server
startServer();

// For testing/importing
export { fastify };
