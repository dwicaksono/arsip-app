# Arsip Dokumen - Document Archiving Application

## Project Overview

Arsip Dokumen is a comprehensive document archiving application that allows users to upload, store, and manage document images. The application provides a secure authentication system and an intuitive user interface for document management.

## Project Structure

This repository is organized into two main components:

- `/frontend` - React TypeScript application built with Vite
- `/backend` - API server (to be implemented)

## Features

- User authentication (login/register)
- Document image upload and conversion to PDF
- Document listing and management
- Mobile-responsive design
- Protected routes for authenticated users

## Technology Stack

### Frontend
- React with TypeScript
- Vite as build tool
- TailwindCSS for styling
- shadcn/ui for UI components
- React Query for data fetching
- Axios for API communication
- Zustand for state management
- React Router DOM for routing

### Backend (Planned)
- Node.js with Express
- MongoDB for database
- JWT for authentication
- Multer for file uploads
- PDF conversion libraries

## Getting Started

### Prerequisites

- Node.js (v22 or later recommended)
- npm or yarn
- MongoDB (for backend)

### Frontend Setup

1. Navigate to the frontend directory
   ```bash
   cd frontend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file with the following content:
   ```
   VITE_API_URL=http://localhost:3000/api
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

### Backend Setup (Coming Soon)

1. Navigate to the backend directory
   ```bash
   cd backend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file with the following content:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/arsip-dokumen
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## API Endpoints (Planned)

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout a user

### Documents
- `GET /api/documents` - Get all documents for the authenticated user
- `GET /api/documents/:id` - Get a specific document
- `POST /api/documents/upload` - Upload a new document
- `DELETE /api/documents/:id` - Delete a document

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT