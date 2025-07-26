import { FastifyInstance } from 'fastify';
import { db, schema } from '../db';
import { hashPassword, verifyPassword, generateToken, UserPayload } from '../auth/utils';
import { authenticate, checkRole } from '../auth/middleware';
import { eq } from 'drizzle-orm';
import { registerSchema, loginSchema, RegisterInput, LoginInput } from '../validation/auth';
import responseUtils from '../utils/response';

// Using Zod schemas for type definitions
type RegisterBody = RegisterInput;
type LoginBody = LoginInput;

export default async function authRoutes(fastify: FastifyInstance) {
  // Register route schemas for Swagger documentation
  const registerSwaggerSchema = {
    tags: ['auth'],
    summary: 'Register a new user',
    description: 'Creates a new user account with the provided credentials',
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        name: { type: 'string' },
      }
    },
    response: {
      201: {
        description: 'Successfully registered user',
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'number', example: 201 },
          message: { type: 'string', example: 'User registered successfully' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                }
              },
              token: { type: 'string' }
            }
          }
        }
      },
      400: {
        description: 'Bad request',
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      },
      409: {
        description: 'User already exists',
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      },
      500: {
        description: 'Server error',
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  };
  
  const loginSwaggerSchema = {
    tags: ['auth'],
    summary: 'Login user',
    description: 'Authenticates a user with email and password',
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      }
    },
    response: {
      200: {
        description: 'Successfully authenticated',
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' }
                }
              },
              token: { type: 'string' }
            }
          }
        }
      },
      400: {
        description: 'Bad request',
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'number', example: 400 },
          message: { type: 'string' },
          error: { type: 'string' },
          details: { type: 'object' }
        }
      },
      401: {
        description: 'Unauthorized',
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string' },
          error: { type: 'string' }
        }
      },
      500: {
        description: 'Server error',
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string' },
          error: { type: 'string' }
        }
      }
    }
  };
  // Register a new user
  fastify.post<{ Body: RegisterBody }>('/register', { 
    schema: registerSwaggerSchema,
    preHandler: fastify.zodValidation({ schema: registerSchema })
  }, async (request, reply) => {
    try {
      const { email, password, name, role } = request.body;
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, email)
      });
      
      if (existingUser) {
        return reply.status(409).send(
          responseUtils.conflict('User with this email already exists')
        );
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create the user with role
      const newUser = await db.insert(schema.users).values({
        email,
        password: hashedPassword,
        name: name || null,
      }).returning();
      
      // Generate JWT token
      const token = generateToken(newUser[0]);
      
      // Prepare user data for response (excluding sensitive information)
      const userData = {
        id: newUser[0].id,
        email: newUser[0].email,
        name: newUser[0].name,
      };
      
      // Return user info and token with standardized response format
      return reply.status(201).send(
        responseUtils.created({
          user: userData,
          token
        }, 'User registered successfully')
      );
    } catch (error) {
      console.error('Registration error:', error);
      return reply.status(500).send(
        responseUtils.error(500, 'Internal Server Error', 'An error occurred during registration')
      );
    }
  });
  
  // Login user
  fastify.post<{ Body: LoginBody }>('/login', { 
    schema: loginSwaggerSchema,
    preHandler: fastify.zodValidation({ schema: loginSchema })
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;
      
      // Find the user
      const user = await db.query.users.findFirst({
        where: eq(schema.users.email, email)
      });
      
      // Check if user exists
      if (!user) {
        return reply.status(401).send(
          responseUtils.unauthorized('Invalid email or password')
        );
      }
      
      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        return reply.status(401).send(
          responseUtils.unauthorized('Invalid email or password')
        );
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Prepare user data for response (excluding sensitive information)
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
      };
      
      // Return user info and token with standardized response format
      return reply.send(
        responseUtils.success({
          user: userData,
          token
        }, 'Login successful')
      );
    } catch (error) {
      console.error('Login error:', error);
      return reply.status(500).send(
        responseUtils.error(500, 'Internal Server Error', 'An error occurred during login')
      );
    }
  });
  
  // Get current user profile
  fastify.get('/me', {
    schema: {
      tags: ['auth'],
      summary: 'Get current user profile',
      description: 'Returns the profile of the currently authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'User profile',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            statusCode: { type: 'number' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticate,
  }, async (request, reply) => {
    try {
      // Get user from request (added by authentication middleware)
      const user = request.user;
      
      if (!user || !user.id) {
        return reply.status(401).send(
          responseUtils.unauthorized('Authentication required')
        );
      }
      
      // Get fresh user data from database
      const userData = await db.query.users.findFirst({
        where: eq(schema.users.id, user.id),
        columns: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      if (!userData) {
        return reply.status(404).send(
          responseUtils.notFound('User not found')
        );
      }
      
      return reply.send(
        responseUtils.success({ user: userData }, 'User profile retrieved successfully')
      );
    } catch (error) {
      console.error('Get profile error:', error);
      return reply.status(500).send(
        responseUtils.error(500, 'Internal Server Error', 'An error occurred while retrieving the user profile')
      );
    }
  });
  
  // Admin-only route example
  fastify.get('/admin', {
    schema: {
      tags: ['auth'],
      summary: 'Admin only endpoint',
      description: 'This endpoint is only accessible by administrators',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Success',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            statusCode: { type: 'number' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        403: {
          description: 'Forbidden',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [authenticate, checkRole(['admin'])],
  }, async (request, reply) => {
    return reply.send(
      responseUtils.success({ admin: true }, 'Welcome, administrator!')
    );
  });
}
