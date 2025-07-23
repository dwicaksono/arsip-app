import { User } from '../db/schema';

type UserPayload = {
  id: number;
  email: string;
  name?: string | null;
  iat?: number;
  exp?: number;
};

declare module 'fastify' {
  interface FastifyRequest {
    user: UserPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserPayload;
    user: UserPayload;
  }
}
