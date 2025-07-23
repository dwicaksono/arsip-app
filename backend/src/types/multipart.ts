import { MultipartFile } from '@fastify/multipart';

// Define custom field type for form fields
export interface FormField {
  fieldname: string;
  value: string;
  filename?: string;
  encoding?: string;
  mimetype?: string;
}

// Define custom type for handling form data
export interface FormData {
  [key: string]: string | FormField | undefined;
}

// Helper function to safely extract field value
export function getFieldValue(data: any, fieldName: string): string {
  if (!data.fields || !data.fields[fieldName]) {
    return '';
  }
  
  const field = data.fields[fieldName];
  
  // Handle string value directly
  if (typeof field === 'string') {
    return field;
  }
  
  // Handle object with value property
  if (field && typeof field === 'object' && 'value' in field) {
    return field.value as string;
  }
  
  return '';
}
