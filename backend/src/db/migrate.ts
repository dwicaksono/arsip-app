import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Run migrations
async function runMigrations() {
  console.log('Running migrations...');
  
  try {
    // For migrations, we need to use postgres-js directly instead of neon-serverless
    const connectionString = process.env.DATABASE_URL as string;
    const migrationClient = postgres(connectionString, { max: 1 });
    const migrationDb = drizzle(migrationClient, { schema });
    
    // Run the migrations
    await migrate(migrationDb, { migrationsFolder: './drizzle' });
    
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
