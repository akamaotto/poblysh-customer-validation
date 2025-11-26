import { Result, Ok, Err, Option, Some, None } from 'oxide.ts';

/**
 * Error types for API operations
 */
export type FetchError =
  | { type: 'HTTP_ERROR'; status: number; message: string }
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'PARSE_ERROR'; message: string };

/**
 * Wraps a fetch call in a Result type for type-safe error handling.
 * 
 * @example
 * const result = await safeFetch<Startup[]>('/api/startups', { credentials: 'include' });
 * match(result, {
 *   Ok: (data) => console.log('Success:', data),
 *   Err: (error) => console.error('Error:', error)
 * });
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<Result<T, FetchError>> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      return Err({
        type: 'HTTP_ERROR',
        status: response.status,
        message: response.statusText,
      });
    }

    try {
      const data = await response.json();
      return Ok(data as T);
    } catch (parseError) {
      return Err({
        type: 'PARSE_ERROR',
        message: parseError instanceof Error ? parseError.message : 'Failed to parse JSON',
      });
    }
  } catch (error) {
    return Err({
      type: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Unknown network error',
    });
  }
}

/**
 * Converts nullable values to Option types.
 * 
 * @example
 * const email = fromNullable(contact.email);
 * email.match({
 *   Some: (e) => sendEmail(e),
 *   None: () => console.log('No email provided')
 * });
 */
export function fromNullable<T>(value: T | null | undefined): Option<T> {
  return value != null ? Some(value) : None;
}

/**
 * Validates email format.
 * 
 * @example
 * const result = validateEmail('user@example.com');
 * if (result.isOk()) {
 *   const validEmail = result.unwrap();
 * }
 */
export function validateEmail(email: string): Result<string, string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email)
    ? Ok(email)
    : Err('Invalid email format');
}

/**
 * Validates required field.
 * 
 * @example
 * const result = validateRequired(formData.name, 'Name');
 * match(result, {
 *   Ok: (name) => console.log('Valid name:', name),
 *   Err: (error) => showError(error)
 * });
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): Result<T, string> {
  return value != null && value !== ''
    ? Ok(value)
    : Err(`${fieldName} is required`);
}

/**
 * Validates URL format.
 */
export function validateUrl(url: string): Result<string, string> {
  try {
    new URL(url);
    return Ok(url);
  } catch {
    return Err('Invalid URL format');
  }
}

/**
 * Safe JSON parsing that returns a Result instead of throwing.
 * 
 * @example
 * const result = safeJsonParse<MyType>('{"key": "value"}');
 * match(result, {
 *   Ok: (data) => processData(data),
 *   Err: (error) => console.error('Parse failed:', error)
 * });
 */
export function safeJsonParse<T>(json: string): Result<T, string> {
  try {
    const parsed = JSON.parse(json);
    return Ok(parsed as T);
  } catch (error) {
    return Err(error instanceof Error ? error.message : 'JSON parse error');
  }
}

/**
 * Formats a FetchError into a user-friendly message.
 */
export function formatFetchError(error: FetchError): string {
  switch (error.type) {
    case 'HTTP_ERROR':
      return `Server error (${error.status}): ${error.message}`;
    case 'NETWORK_ERROR':
      return `Network error: ${error.message}`;
    case 'PARSE_ERROR':
      return `Data parsing error: ${error.message}`;
  }
}
