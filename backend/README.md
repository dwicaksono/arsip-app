# Arsip App Backend

A Fastify backend API for a document archiving application based on photos. This API allows users to register, login, upload document images, and retrieve their documents. It includes placeholder functionality for OCR processing that can be extended with external OCR services.

## Features

- User authentication with email and password
- JWT-based authentication with secure token handling
- Document upload and management
- OCR text extraction (placeholder implementation)
- PostgreSQL database with Neon serverless
- Drizzle ORM for type-safe database operations
- TypeScript for better code quality and developer experience

## Tech Stack

- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM
- **Authentication**: JWT + bcrypt
- **File Handling**: @fastify/multipart

## Prerequisites

- Node.js v22 or higher
- npm
- Neon PostgreSQL account (or any PostgreSQL database)

## Quick Start

The easiest way to get started is to use the provided setup script:

```bash
# Make the script executable if needed
chmod +x setup.sh

# Run the setup script
./setup.sh
```

This will:
1. Check your Node.js version
2. Install dependencies
3. Create the uploads directory
4. Create a .env file from .env.example if it doesn't exist
5. Generate the database schema

## Manual Setup

1. Clone the repository

2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and update the environment variables:

```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials and JWT secret:

```
# Server Configuration
PORT=3000
APP_URL=http://localhost:3000

# Authentication
JWT_SECRET=your_jwt_secret_key_here

# Database Configuration
DATABASE_URL=postgresql://user:password@hostname:port/database

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

5. Generate and push the database schema:

```bash
npm run db:generate
npm run db:push
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The server will start at http://localhost:3000 (or the port specified in your .env file).

### Production Mode

```bash
npm run build
npm start
```

## API Documentation

For detailed API documentation, please see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Authentication Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login a user

### Document Endpoints

- `POST /api/upload` - Upload a document image
- `GET /api/documents` - Get all documents for the authenticated user

## Database Schema

The application uses two main tables:

1. **users** - Stores user information
   - id: Primary key
   - email: User's email (unique)
   - password: Hashed password
   - name: User's name (optional)
   - createdAt: Timestamp
   - updatedAt: Timestamp

2. **documents** - Stores document metadata
   - id: Primary key
   - userId: Foreign key to users table
   - title: Document title
   - description: Document description
   - filePath: Path to the stored file
   - fileType: MIME type of the file
   - fileSize: Size of the file in bytes
   - ocrText: Extracted text from the document
   - createdAt: Timestamp
   - updatedAt: Timestamp

## OCR Integration

The current implementation includes a placeholder for OCR processing. To integrate with a real OCR service:

1. Update the `processOCR` function in `src/utils/file-utils.ts`
2. Add the necessary API keys to your .env file
3. Implement the API calls to your chosen OCR service

Recommended OCR services:
- Google Cloud Vision
- Amazon Textract
- Tesseract.js (for local processing)

## License

MIT
