import { FastifyInstance } from 'fastify';
import { db, schema } from '../db';
import { hashPassword, verifyPassword, generateToken } from '../auth/utils';
import { eq } from 'drizzle-orm';

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Register a new user
  fastify.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    try {
      const { email, password, name } = request.body;
      
      // Validate input
      if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
      }
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, email)
      });
      
      if (existingUser) {
        return reply.status(409).send({ error: 'User with this email already exists' });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create the user
      const newUser = await db.insert(schema.users).values({
        email,
        password: hashedPassword,
        name: name || null,
      }).returning();
      
      // Generate JWT token
      const token = generateToken(newUser[0]);
      
      // Return user info and token
      return reply.status(201).send({
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
  
  // Login user
  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    try {
      const { email, password } = request.body;
      
      // Validate input
      if (!email || !password) {
        return reply.status(400).send({ error: 'Email and password are required' });
      }
      
      // Find the user
      const user = await db.query.users.findFirst({
        where: eq(schema.users.email, email)
      });
      
      // Check if user exists
      if (!user) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }
      
      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Return user info and token
      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
