import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { ZodSchema, ZodError } from 'zod';
import responseUtils, { ValidationError } from '../utils/response';

interface ZodValidationOptions {
  schema: ZodSchema;
  dataProperty?: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    zodValidation: (options: ZodValidationOptions) => any;
  }
}

/**
 * Enhanced Zod validation plugin for Fastify
 * Provides request validation using Zod schemas with comprehensive error handling
 */
export default fp(async function(fastify: FastifyInstance) {
  // Register the validation decorator
  fastify.decorate('zodValidation', function(options: ZodValidationOptions) {
    const { schema, dataProperty = 'body' } = options;
    
    return async function(request: any, reply: any) {
      // Get the data to validate based on the specified property
      const dataToValidate = request[dataProperty];
      
      try {
        // Validate the data using the provided Zod schema
        const validatedData = schema.parse(dataToValidate);
        
        // Store the validated data back to the request object
        if (['body', 'query', 'params'].includes(dataProperty)) {
          request[dataProperty as 'body' | 'query' | 'params'] = validatedData;
        } else {
          (request as any).validatedData = validatedData;
        }
      } catch (error) {
        // Handle Zod validation errors
        if (error instanceof ZodError) {
          // Convert Zod errors to our standardized validation error format
          const validationErrors: ValidationError[] = error.issues.map(issue => {
            const field = issue.path.length > 0 ? issue.path.join('.') : 'unknown';
            
            return {
              field,
              message: issue.message,
              code: issue.code,
              value: issue.code === 'invalid_type' ? undefined : (issue as any).received
            };
          });
          
          // Use our enhanced validation error response
          const errorResponse = responseUtils.validationError(validationErrors);
          
          // Debug logging
          console.log('=== ZOD VALIDATION ERROR DEBUG ===');
          console.log('Validation Errors:', JSON.stringify(validationErrors, null, 2));
          console.log('Error Response:', JSON.stringify(errorResponse, null, 2));
          console.log('=== END DEBUG ===');
          
          return reply.status(400).send(errorResponse);
        }
        
        // Forward other errors to the global error handler
        throw error;
      }
    };
  });
});
