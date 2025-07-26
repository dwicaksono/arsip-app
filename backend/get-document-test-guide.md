# 📋 Get Document by ID API Testing Guide

## 🎯 Testing the GET /api/documents/:id Endpoint

### Prerequisites
1. **Server running** on `http://localhost:3000`
2. **Valid JWT token** from `/auth/register` or `/auth/login`
3. **At least one document uploaded** (use the upload endpoint first)

---

## 🧪 Test Scenarios

### ✅ **Step 1: First Upload a Document**

Before testing the GET endpoint, you need to have a document in the database:

```
POST http://localhost:3000/api/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

Form Data:
- file: [Select a test file]
- title: "Test Document for Retrieval"
- description: "This document will be used to test the GET endpoint"
```

**Note the document ID from the response** - you'll need it for testing!

---

### ✅ **Test 2: Successful Document Retrieval**

```
GET http://localhost:3000/api/documents/1
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Document retrieved successfully",
  "data": {
    "document": {
      "id": 1,
      "userId": 2,
      "title": "Test Document for Retrieval",
      "description": "This document will be used to test the GET endpoint",
      "filePath": "762487cfac9d20a4da67e975ba9388f9.pdf",
      "fileType": "application/pdf",
      "fileSize": 2798,
      "ocrText": "OCR text would be extracted...",
      "isPublic": false,
      "createdAt": "2025-07-26T09:32:43.294Z",
      "updatedAt": "2025-07-26T09:32:43.294Z",
      "fileUrl": "http://localhost:3000/uploads/762487cfac9d20a4da67e975ba9388f9.pdf"
    }
  }
}
```

---

### ❌ **Test 3: No Authentication**

```
GET http://localhost:3000/api/documents/1
[NO Authorization header]
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

### ❌ **Test 4: Document Not Found**

```
GET http://localhost:3000/api/documents/99999
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Document not found",
  "error": "Not Found"
}
```

---

### ❌ **Test 5: Invalid Document ID (Non-numeric)**

```
GET http://localhost:3000/api/documents/abc
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid document ID format",
  "error": "Bad Request"
}
```

---

### ✅ **Test 6: Access Other User's Public Document**

If you have another user's public document (isPublic: true), you should be able to access it:

```
GET http://localhost:3000/api/documents/[OTHER_USER_PUBLIC_DOC_ID]
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:** Success with document data

---

### ❌ **Test 7: Access Other User's Private Document**

If you try to access another user's private document (isPublic: false), it should be denied:

```
GET http://localhost:3000/api/documents/[OTHER_USER_PRIVATE_DOC_ID]
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You do not have permission to access this document",
  "error": "Forbidden"
}
```

**Note:** Currently this check is commented out in the code (lines 417-421), so this test might pass unexpectedly.

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

### Upload a Document First:
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/testfile.pdf" \
  -F "title=Test Document" \
  -F "description=Test Description"
```

### Get Document by ID:
```bash
curl -X GET http://localhost:3000/api/documents/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Document Not Found:
```bash
curl -X GET http://localhost:3000/api/documents/99999 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Without Authentication:
```bash
curl -X GET http://localhost:3000/api/documents/1
```

---

## 🎯 **What to Verify**

1. **✅ Successful Retrieval**: Returns complete document data with fileUrl
2. **✅ Authentication Check**: Rejects requests without valid JWT
3. **✅ Document Existence**: Returns 404 for non-existent documents
4. **✅ Response Format**: Uses standardized response format
5. **✅ File URL Generation**: Includes full URL for file access
6. **✅ Access Control**: Respects ownership and public/private settings
7. **✅ Error Handling**: Provides clear error messages

---

## 🐛 **Common Issues to Check**

1. **Invalid ID Format**: Make sure the endpoint handles non-numeric IDs gracefully
2. **Database Errors**: Check for proper error handling if database is down
3. **File URL Generation**: Verify the fileUrl is correctly constructed
4. **Access Control**: Test that users can't access other users' private documents
5. **Response Consistency**: All responses should follow the standardized format

---

## 📊 **Expected Response Structure**

All responses should follow this format:

**Success:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Document retrieved successfully",
  "data": {
    "document": { /* document object */ }
  }
}
```

**Error:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Document not found",
  "error": "Not Found"
}
```

Test these scenarios and let me know if you encounter any issues! 🚀
