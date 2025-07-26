import { z } from 'zod';

// Define the role enum
export const UserRole = z.enum(['admin', 'user', 'guest']);
export type UserRole = z.infer<typeof UserRole>;

// Registration schema
export const registerSchema = z.object({
  email: z.string().nonempty('Email is required').email({ message: 'Invalid email format' }),
  password: z.string().nonempty('Password is required').min(6, { message: 'Password must be at least 6 characters' }),
  name: z.string().nonempty('Name is required').min(2, { message: 'Name must be at least 2 characters' }),
  role: UserRole.optional().default('user'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().nonempty('Email is required').email({ message: 'Invalid email format' }),
  password: z.string().nonempty('Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// User profile schema (for response)
export const userProfileSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: UserRole,
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
