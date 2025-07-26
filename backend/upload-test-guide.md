# 📋 Document Upload API Testing Guide

## 🎯 Enhanced Error Handling Test Scenarios

### Prerequisites
1. **Server running** on `http://localhost:3000`
2. **Valid JWT token** from `/auth/register` or `/auth/login`
3. **Test files** ready (PDF, images, documents)

---

## 🧪 Test Scenarios

### ✅ **Test 1: Successful Upload**
```
POST http://localhost:3000/api/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
- file: [Select a test file]
- title: "My Test Document"
- description: "This is a test document"
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Document uploaded successfully",
  "data": {
    "document": {
      "id": 1,
      "userId": 1,
      "title": "My Test Document",
      "description": "This is a test document",
      "filePath": "uploads/1234567890-filename.pdf",
      "fileType": "application/pdf",
      "fileSize": 12345,
      "ocrText": "...",
      "isPublic": false,
      "createdAt": "2025-07-26T...",
      "updatedAt": "2025-07-26T..."
    }
  }
}
```

---

### ❌ **Test 2: No Authentication**
```
POST http://localhost:3000/api/upload
Content-Type: multipart/form-data
[NO Authorization header]

Form Data:
- file: [Select a test file]
- title: "Test Document"
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required",
  "error": "Unauthorized"
}
```

---

### ❌ **Test 3: No File Uploaded**
```
POST http://localhost:3000/api/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
- title: "Test Document"
- description: "Test Description"
[NO file field]
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "No file uploaded. Please select a file to upload.",
  "error": "Bad Request"
}
```

---

### ❌ **Test 4: Missing Title**
```
POST http://localhost:3000/api/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
- file: [Select a test file]
- description: "Test Description"
[NO title field]
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Document title is required. Please provide a title for your document.",
  "error": "Bad Request"
}
```

---

### ❌ **Test 5: Empty Title**
```
POST http://localhost:3000/api/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
- file: [Select a test file]
- title: ""
- description: "Test Description"
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Document title is required. Please provide a title for your document.",
  "error": "Bad Request"
}
```

---

### ❌ **Test 6: Title Too Short**
```
POST http://localhost:3000/api/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
- file: [Select a test file]
- title: "A"
- description: "Test Description"
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Document title must be at least 2 characters long",
  "error": "Validation Error",
  "details": {
    "errors": [
      {
        "field": "title",
        "message": "Document title must be at least 2 characters long",
        "code": "too_small"
      }
    ],
    "errorsByField": {
      "title": [
        {
          "message": "Document title must be at least 2 characters long",
          "code": "too_small"
        }
      ]
    }
  }
}
```

---

### ❌ **Test 7: Title Too Long**
```
POST http://localhost:3000/api/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
- file: [Select a test file]
- title: [A string longer than 255 characters]
- description: "Test Description"
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Document title cannot exceed 255 characters",
  "error": "Validation Error",
  "details": {
    "errors": [
      {
        "field": "title",
        "message": "Document title cannot exceed 255 characters",
        "code": "too_big"
      }
    ]
  }
}
```

---

### ❌ **Test 8: Description Too Long**
```
POST http://localhost:3000/api/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
- file: [Select a test file]
- title: "Valid Title"
- description: [A string longer than 1000 characters]
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Document description cannot exceed 1000 characters",
  "error": "Validation Error",
  "details": {
    "errors": [
      {
        "field": "description",
        "message": "Document description cannot exceed 1000 characters",
        "code": "too_big"
      }
    ]
  }
}
```

---

## 🔧 **Quick Test Commands**

### Get Authentication Token:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Upload (replace TOKEN with actual token):
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/your/testfile.pdf" \
  -F "title=Test Document" \
  -F "description=Test Description"
```

---

## 🎉 **What You Should See Now**

With the enhanced error handling, you should now get:

1. **Specific error messages** instead of generic "Validation error"
2. **Clear instructions** on what went wrong and how to fix it
3. **Detailed validation information** for frontend developers
4. **Proper error codes** and status codes
5. **Structured error responses** that are easy to parse

The error messages are now user-friendly and provide actionable feedback!
