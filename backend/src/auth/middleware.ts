import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from './utils';

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
