import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, UserPayload } from './utils';

// Note: FastifyRequest extension is now handled in utils.ts

/**
 * Authentication middleware to verify JWT tokens
 * @param request Fastify request object
 * @param reply Fastify reply object
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Get the authorization header
    const authHeader = request.headers.authorization;
    
    // Check if authorization header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized: No token provided' });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = verifyToken(token);
    
    // If token is invalid
    if (!decoded) {
      return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
    }
    
    // Add user information to request
    request.user = decoded;
    
  } catch (error) {
    return reply.status(401).send({ error: 'Unauthorized: Authentication failed' });
  }
}

/**
 * Role-based access control middleware
 * @param roles Array of allowed roles
 * @returns Middleware function
 */
export function checkRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Ensure user is authenticated
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized: Authentication required' });
      }
      
      // Check if user has required role
      const userRole = (request.user as UserPayload).role;
      if (!roles.includes(userRole)) {
        return reply.status(403).send({ error: 'Forbidden: Insufficient permissions' });
      }
      
      // User has required role, continue
    } catch (error) {
      return reply.status(500).send({ error: 'Internal server error' });
    }
  };
}
