/**
 * Response utilities for standardizing API responses
 */

// Success response types
export type SuccessResponse<T = any> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
};

// Error response types
export type ErrorResponse = {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  details?: {
    errors?: ValidationError[];
    errorsByField?: Record<string, ValidationError[]>;
    [key: string]: any;
  };
};

// Validation error type
export type ValidationError = {
  field: string;
  message: string;
  code: string;
  value?: any;
};

// Response utility functions
export const responseUtils = {
  /**
   * Create a success response
   * @param data Response data
   * @param message Success message
   * @param statusCode HTTP status code
   * @returns Standardized success response
   */
  success: <T>(data: T, message = 'Success', statusCode = 200): SuccessResponse<T> => ({
    success: true,
    statusCode,
    message,
    data
  }),

  /**
   * Create a created response (201)
   * @param data Created resource data
   * @param message Success message
   * @returns Standardized created response
   */
  created: <T>(data: T, message = 'Resource created successfully'): SuccessResponse<T> => ({
    success: true,
    statusCode: 201,
    message,
    data
  }),

  /**
   * Create an updated response (200)
   * @param data Updated resource data
   * @param message Success message
   * @returns Standardized updated response
   */
  updated: <T>(data: T, message = 'Resource updated successfully'): SuccessResponse<T> => ({
    success: true,
    statusCode: 200,
    message,
    data
  }),

  /**
   * Create a deleted response (200)
   * @param data Optional data to return
   * @param message Success message
   * @returns Standardized deleted response
   */
  deleted: <T = null>(data: T = null as any, message = 'Resource deleted successfully'): SuccessResponse<T> => ({
    success: true,
    statusCode: 200,
    message,
    data
  }),

  /**
   * Create an error response
   * @param statusCode HTTP status code
   * @param error Error type
   * @param message Error message
   * @param details Optional error details
   * @returns Standardized error response
   */
  error: (statusCode = 500, error = 'Internal Server Error', message = 'An error occurred', details?: any): ErrorResponse => ({
    success: false,
    statusCode,
    error,
    message,
    ...(details && { details })
  }),

  /**
   * Create a bad request error response (400)
   * @param message Error message
   * @param details Optional error details
   * @returns Standardized bad request response
   */
  badRequest: (message = 'Bad request', details?: any): ErrorResponse => 
    responseUtils.error(400, 'Bad Request', message, details),

  /**
   * Create a validation error response (400)
   * @param errors Array of validation errors
   * @param message Optional custom message
   * @returns Standardized validation error response
   */
  validationError: (errors: ValidationError[], message?: string): ErrorResponse => {
    // Group errors by field
    const errorsByField = errors.reduce((acc: Record<string, ValidationError[]>, error) => {
      if (!acc[error.field]) {
        acc[error.field] = [];
      }
      acc[error.field].push(error);
      return acc;
    }, {});

    // Generate a descriptive message if not provided
    let errorMessage = message;
    if (!errorMessage) {
      if (errors.length === 1) {
        errorMessage = errors[0].message;
      } else {
        const fieldNames = Object.keys(errorsByField);
        if (fieldNames.length === 1) {
          errorMessage = `${fieldNames[0]} field has ${errors.length} validation errors`;
        } else {
          errorMessage = `Validation failed for ${fieldNames.length} fields: ${fieldNames.join(', ')}`;
        }
      }
    }

    return {
      success: false,
      statusCode: 400,
      error: 'Validation Error',
      message: errorMessage,
      details: {
        errors,
        errorsByField
      }
    };
  },

  /**
   * Create an unauthorized error response (401)
   * @param message Error message
   * @returns Standardized unauthorized response
   */
  unauthorized: (message = 'Authentication required'): ErrorResponse => 
    responseUtils.error(401, 'Unauthorized', message),

  /**
   * Create a forbidden error response (403)
   * @param message Error message
   * @returns Standardized forbidden response
   */
  forbidden: (message = 'Insufficient permissions'): ErrorResponse => 
    responseUtils.error(403, 'Forbidden', message),

  /**
   * Create a not found error response (404)
   * @param message Error message
   * @returns Standardized not found response
   */
  notFound: (message = 'Resource not found'): ErrorResponse => 
    responseUtils.error(404, 'Not Found', message),

  /**
   * Create a conflict error response (409)
   * @param message Error message
   * @returns Standardized conflict response
   */
  conflict: (message = 'Resource already exists'): ErrorResponse => 
    responseUtils.error(409, 'Conflict', message)
};

export default responseUtils;
