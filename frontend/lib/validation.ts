import { Result, Ok, Err } from 'oxide.ts';
import { validateEmail, validateRequired, validateUrl } from './result-utils';

/**
 * Validation error type
 */
export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Generic validation result type
 */
export type ValidationResult<T> = Result<T, ValidationError[]>;

/**
 * Validates startup creation form data.
 * 
 * @example
 * const result = validateStartupForm({
 *   name: 'Acme Inc',
 *   status: 'active',
 *   website: 'https://acme.com'
 * });
 * 
 * match(result, {
 *   Ok: (data) => api.createStartup(data),
 *   Err: (errors) => displayErrors(errors)
 * });
 */
export function validateStartupForm(data: {
  name?: string;
  category?: string;
  website?: string;
  newsroom_url?: string;
  status?: string;
}): ValidationResult<{
  name: string;
  category?: string;
  website?: string;
  newsroom_url?: string;
  status: string;
}> {
  const errors: ValidationError[] = [];

  // Validate required fields
  const nameResult = validateRequired(data.name, 'Name');
  if (nameResult.isErr()) {
    errors.push({ field: 'name', message: nameResult.unwrapErr() });
  }

  const statusResult = validateRequired(data.status, 'Status');
  if (statusResult.isErr()) {
    errors.push({ field: 'status', message: statusResult.unwrapErr() });
  }

  // Validate optional URL fields
  if (data.website) {
    const websiteResult = validateUrl(data.website);
    if (websiteResult.isErr()) {
      errors.push({ field: 'website', message: websiteResult.unwrapErr() });
    }
  }

  if (data.newsroom_url) {
    const newsroomResult = validateUrl(data.newsroom_url);
    if (newsroomResult.isErr()) {
      errors.push({ field: 'newsroom_url', message: newsroomResult.unwrapErr() });
    }
  }

  // Return errors if any, otherwise return validated data
  if (errors.length > 0) {
    return Err(errors);
  }

  return Ok({
    name: nameResult.unwrap(),
    category: data.category,
    website: data.website,
    newsroom_url: data.newsroom_url,
    status: statusResult.unwrap(),
  });
}

/**
 * Validates contact creation form data.
 * 
 * @example
 * const result = validateContactForm({
 *   name: 'John Doe',
 *   role: 'CEO',
 *   email: 'john@example.com'
 * });
 */
export function validateContactForm(data: {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
}): ValidationResult<{
  name: string;
  role: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
}> {
  const errors: ValidationError[] = [];

  // Validate required fields
  const nameResult = validateRequired(data.name, 'Name');
  if (nameResult.isErr()) {
    errors.push({ field: 'name', message: nameResult.unwrapErr() });
  }

  const roleResult = validateRequired(data.role, 'Role');
  if (roleResult.isErr()) {
    errors.push({ field: 'role', message: roleResult.unwrapErr() });
  }

  // Validate optional email
  if (data.email) {
    const emailResult = validateEmail(data.email);
    if (emailResult.isErr()) {
      errors.push({ field: 'email', message: emailResult.unwrapErr() });
    }
  }

  // Validate optional LinkedIn URL
  if (data.linkedin_url) {
    const linkedinResult = validateUrl(data.linkedin_url);
    if (linkedinResult.isErr()) {
      errors.push({ field: 'linkedin_url', message: linkedinResult.unwrapErr() });
    }
  }

  if (errors.length > 0) {
    return Err(errors);
  }

  return Ok({
    name: nameResult.unwrap(),
    role: roleResult.unwrap(),
    email: data.email,
    phone: data.phone,
    linkedin_url: data.linkedin_url,
  });
}

/**
 * Validates interview creation form data.
 */
export function validateInterviewForm(data: {
  date?: string;
  interview_type?: string;
  recording_url?: string;
  transcript_url?: string;
}): ValidationResult<{
  date: string;
  interview_type: string;
  recording_url?: string;
  transcript_url?: string;
}> {
  const errors: ValidationError[] = [];

  // Validate required fields
  const dateResult = validateRequired(data.date, 'Date');
  if (dateResult.isErr()) {
    errors.push({ field: 'date', message: dateResult.unwrapErr() });
  }

  const typeResult = validateRequired(data.interview_type, 'Interview Type');
  if (typeResult.isErr()) {
    errors.push({ field: 'interview_type', message: typeResult.unwrapErr() });
  }

  // Validate optional URLs
  if (data.recording_url) {
    const recordingResult = validateUrl(data.recording_url);
    if (recordingResult.isErr()) {
      errors.push({ field: 'recording_url', message: recordingResult.unwrapErr() });
    }
  }

  if (data.transcript_url) {
    const transcriptResult = validateUrl(data.transcript_url);
    if (transcriptResult.isErr()) {
      errors.push({ field: 'transcript_url', message: transcriptResult.unwrapErr() });
    }
  }

  if (errors.length > 0) {
    return Err(errors);
  }

  return Ok({
    date: dateResult.unwrap(),
    interview_type: typeResult.unwrap(),
    recording_url: data.recording_url,
    transcript_url: data.transcript_url,
  });
}

/**
 * Helper to extract field errors for display.
 * 
 * @example
 * const errors = getFieldError(validationErrors, 'email');
 * if (errors) {
 *   setEmailError(errors);
 * }
 */
export function getFieldError(
  errors: ValidationError[],
  field: string
): string | undefined {
  return errors.find(e => e.field === field)?.message;
}

/**
 * Helper to check if a specific field has errors.
 */
export function hasFieldError(
  errors: ValidationError[],
  field: string
): boolean {
  return errors.some(e => e.field === field);
}
