import { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import responseUtils from '../utils/response';

/**
 * Error handler plugin for Fastify
 * Provides consistent error responses across the API
 */
export default fp(async function(fastify: FastifyInstance) {
  // Set up an error handler for all routes
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // Log the error for debugging
    request.log.error(error);
    
    // Note: Zod validation errors are now handled in the Zod plugin itself
    // This provides better error messages and standardized responses
    
    // Handle Fastify validation errors (non-Zod)
    if (error.validation && !(error instanceof ZodError)) {
      console.log('=== FASTIFY VALIDATION ERROR DEBUG ===');
      console.log('Error message:', error.message);
      console.log('Validation details:', JSON.stringify(error.validation, null, 2));
      console.log('Request URL:', request.url);
      console.log('Request method:', request.method);
      console.log('=== END VALIDATION ERROR DEBUG ===');
      
      // Create a more specific error message based on validation details
      let specificMessage = 'Validation error';
      if (error.validation && Array.isArray(error.validation)) {
        const firstError = error.validation[0];
        if (firstError && firstError.message) {
          specificMessage = firstError.message;
        } else if (firstError && firstError.instancePath) {
          specificMessage = `Invalid value for field: ${firstError.instancePath}`;
        }
      }
      
      return reply.status(400).send(
        responseUtils.badRequest(specificMessage, { validation: error.validation })
      );
    }
    
    // Handle database errors
    if (error.code?.startsWith('23') || error.message?.includes('duplicate key')) {
      return reply.status(409).send(
        responseUtils.conflict('Resource already exists or violates constraints')
      );
    }
    
    // Handle not found errors
    if (error.statusCode === 404 || error.message?.includes('not found')) {
      return reply.status(404).send(
        responseUtils.notFound(error.message || 'Resource not found')
      );
    }
    
    // Handle unauthorized errors
    if (error.statusCode === 401 || error.message?.includes('unauthorized')) {
      return reply.status(401).send(
        responseUtils.unauthorized(error.message || 'Authentication required')
      );
    }
    
    // Handle forbidden errors
    if (error.statusCode === 403 || error.message?.includes('forbidden')) {
      return reply.status(403).send(
        responseUtils.forbidden(error.message || 'Insufficient permissions')
      );
    }
    
    // Default error handling for unhandled errors
    const statusCode = error.statusCode || 500;
    
    // Don't expose internal server error details in production
    const message = statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : error.message || 'Internal Server Error';
    
    const errorType = error.name || (statusCode >= 500 ? 'Internal Server Error' : 'Error');
    
    // Add debug details in non-production environments
    const details = process.env.NODE_ENV !== 'production' ? {
      stack: error.stack,
      code: error.code,
      originalError: error.message
    } : undefined;
    
    return reply.status(statusCode).send(
      responseUtils.error(statusCode, errorType, message, details)
    );
  });
});
