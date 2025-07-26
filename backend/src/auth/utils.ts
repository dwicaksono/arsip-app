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

// Define user payload type for JWT
export interface UserPayload {
  id: number;
  email: string;
  name: string | null;
}

// Extend FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user: UserPayload;
  }
}

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
  // Remove sensitive information and create payload
  const payload: UserPayload = {
    id: user.id!,
    email: user.email!,
    name: user.name || null,
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d' // Token expires in 7 days
  });
}

/**
 * Verify and decode a JWT token
 * @param token JWT token
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extract user from request
 * @param request Fastify request object
 * @returns User object from JWT token
 */
export function getUserFromRequest(request: FastifyRequest): UserPayload {
  return request.user;
}
