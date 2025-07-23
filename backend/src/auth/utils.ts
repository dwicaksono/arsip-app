import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { FastifyRequest } from 'fastify';
import { User } from '../db/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if JWT_SECRET is defined
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password Plain text password
 * @param hash Hashed password
 * @returns Boolean indicating if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * @param user User object
 * @returns JWT token
 */
export function generateToken(user: Partial<User>): string {
  // Remove sensitive information
  const { password, ...userInfo } = user;
  
  return jwt.sign(userInfo, JWT_SECRET, {
    expiresIn: '7d' // Token expires in 7 days
  });
}

/**
 * Verify and decode a JWT token
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract user from request
 * @param request Fastify request object
 * @returns User object from JWT token
 */
export function getUserFromRequest(request: FastifyRequest): any {
  return request.user;
}
