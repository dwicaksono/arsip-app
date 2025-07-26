import { User } from '../db/schema';
import { UserPayload } from '../auth/utils';

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
