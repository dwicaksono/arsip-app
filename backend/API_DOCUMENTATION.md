# Arsip App API Documentation

This document provides detailed information about the Arsip App API endpoints, request/response formats, and authentication requirements.

## Base URL

```
http://localhost:3000
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. To access protected endpoints, you need to include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

You can obtain a token by registering or logging in using the authentication endpoints.

## Endpoints

### Health Check

#### GET /health

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-07-22T15:37:21.000Z"
}
```

### Authentication

#### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"  // Optional
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "jwt_token_here"
}
```

#### POST /auth/login

Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  },
  "token": "jwt_token_here"
}
```

### Documents

#### POST /api/upload

Upload a document image.

**Authentication Required:** Yes

**Request:**
- Content-Type: multipart/form-data
- Form Fields:
  - `file`: The document image file (required)
  - `title`: Document title (optional, defaults to filename)
  - `description`: Document description (optional)

**Response:**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": 1,
    "userId": 1,
    "title": "Document Title",
    "description": "Document Description",
    "filePath": "abc123def456.jpg",
    "fileType": "image/jpeg",
    "fileSize": 102400,
    "ocrText": "Extracted text from the document",
    "createdAt": "2025-07-22T15:37:21.000Z",
    "updatedAt": "2025-07-22T15:37:21.000Z"
  }
}
```

#### GET /api/documents

Get all documents for the authenticated user.

**Authentication Required:** Yes

**Response:**
```json
{
  "documents": [
    {
      "id": 1,
      "userId": 1,
      "title": "Document Title",
      "description": "Document Description",
      "filePath": "abc123def456.jpg",
      "fileType": "image/jpeg",
      "fileSize": 102400,
      "ocrText": "Extracted text from the document",
      "fileUrl": "http://localhost:3000/uploads/abc123def456.jpg",
      "createdAt": "2025-07-22T15:37:21.000Z",
      "updatedAt": "2025-07-22T15:37:21.000Z"
    },
    // More documents...
  ]
}
```

## Error Responses

The API returns appropriate HTTP status codes and error messages in case of failures:

### 400 Bad Request

```json
{
  "error": "Error message describing the issue"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized: No token provided"
}
```

or

```json
{
  "error": "Unauthorized: Invalid token"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## OCR Processing

The current implementation includes a placeholder for OCR processing. In a production environment, you would integrate with an external OCR service to extract text from document images.

## File Storage

Uploaded files are temporarily stored in the server's `uploads` directory. In a production environment, you might want to use a cloud storage solution like AWS S3, Google Cloud Storage, or similar services.
