import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';

/**
 * Ensures the upload directory exists
 */
export function ensureUploadDirExists(): void {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

/**
 * Saves a file to the uploads directory
 * @param file File stream from multipart request
 * @param originalFilename Original filename
 * @returns Object containing the saved file information
 */
export async function saveFile(file: any, originalFilename: string): Promise<{
  fileName: string;
  filePath: string;
  fileSize: number;
}> {
  // Generate a unique filename
  const fileId = crypto.randomBytes(16).toString('hex');
  const fileExtension = path.extname(originalFilename);
  const fileName = `${fileId}${fileExtension}`;
  const filePath = path.join(uploadDir, fileName);
  
  // Save file to disk
  await pipeline(
    file,
    fs.createWriteStream(filePath)
  );
  
  // Get file metadata
  const fileStats = fs.statSync(filePath);
  
  return {
    fileName,
    filePath,
    fileSize: fileStats.size
  };
}

/**
 * Placeholder function for OCR processing
 * In a real implementation, this would call an external OCR API
 * @param filePath Path to the file to process
 * @returns Extracted text from the image
 */
export async function processOCR(filePath: string): Promise<string> {
  // This is a placeholder for OCR processing
  // In a real implementation, you would:
  // 1. Read the file
  // 2. Send it to an OCR API (e.g., Google Cloud Vision, Tesseract, etc.)
  // 3. Return the extracted text
  
  console.log(`Simulating OCR processing for file: ${filePath}`);
  
  // Return a placeholder text
  return `OCR text would be extracted from ${path.basename(filePath)} in a real implementation.`;
}

/**
 * Deletes a file from the uploads directory
 * @param fileName Name of the file to delete
 * @returns Boolean indicating if deletion was successful
 */
export function deleteFile(fileName: string): boolean {
  try {
    const filePath = path.join(uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}
