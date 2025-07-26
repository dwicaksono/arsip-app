import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Create a PostgreSQL client with Neon
const sql = neon(process.env.DATABASE_URL);

// Create a Drizzle ORM instance
export const db = drizzle(sql, { schema });

// Export schema for use in other parts of the application
export { schema };
