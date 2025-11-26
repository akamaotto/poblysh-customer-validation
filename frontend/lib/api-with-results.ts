/**
 * Example API wrapper demonstrating Result types with oxide.ts
 * 
 * This file shows how to refactor the existing API to use Result types
 * for type-safe error handling. Compare with lib/api.ts to see the difference.
 * 
 * Usage example:
 * ```typescript
 * import { match } from 'oxide.ts';
 * import { apiWithResults } from '@/lib/api-with-results';
 * 
 * const result = await apiWithResults.getStartups();
 * match(result, {
 *   Ok: (startups) => setStartups(startups),
 *   Err: (error) => showError(formatFetchError(error))
 * });
 * ```
 */

import { Result, Ok, Err } from 'oxide.ts';
import { safeFetch, FetchError } from './result-utils';
import type { Startup, CreateStartupRequest, Contact, CreateContactRequest } from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * API methods using Result types for error handling.
 * 
 * Key differences from the original api.ts:
 * 1. Returns Result<T, FetchError> instead of Promise<T>
 * 2. Never throws exceptions - all errors are captured in Err variant
 * 3. Type-safe error handling - must handle both Ok and Err cases
 * 4. Explicit error types - know exactly what can go wrong
 */
export const apiWithResults = {
  /**
   * Fetch all startups.
   * 
   * @example
   * const result = await apiWithResults.getStartups();
   * if (result.isOk()) {
   *   const startups = result.unwrap();
   *   console.log('Fetched', startups.length, 'startups');
   * } else {
   *   const error = result.unwrapErr();
   *   console.error('Failed to fetch startups:', error);
   * }
   */
  async getStartups(): Promise<Result<Startup[], FetchError>> {
    return safeFetch<Startup[]>(`${API_BASE_URL}/api/startups`, {
      credentials: 'include',
    });
  },

  /**
   * Fetch a single startup by ID.
   * 
   * @example
   * import { match } from 'oxide.ts';
   * 
   * const result = await apiWithResults.getStartup('123');
   * match(result, {
   *   Ok: (startup) => {
   *     console.log('Startup:', startup.name);
   *   },
   *   Err: (error) => {
   *     if (error.type === 'HTTP_ERROR' && error.status === 404) {
   *       console.log('Startup not found');
   *     } else {
   *       console.error('Error:', error.message);
   *     }
   *   }
   * });
   */
  async getStartup(id: string): Promise<Result<Startup, FetchError>> {
    return safeFetch<Startup>(`${API_BASE_URL}/api/startups/${id}`, {
      credentials: 'include',
    });
  },

  /**
   * Create a new startup.
   * 
   * @example
   * const result = await apiWithResults.createStartup({
   *   name: 'Acme Inc',
   *   status: 'active',
   *   website: 'https://acme.com'
   * });
   * 
   * result.match({
   *   Ok: (startup) => {
   *     toast.success(`Created startup: ${startup.name}`);
   *     router.push(`/startups/${startup.id}`);
   *   },
   *   Err: (error) => {
   *     toast.error(`Failed to create startup: ${formatFetchError(error)}`);
   *   }
   * });
   */
  async createStartup(data: CreateStartupRequest): Promise<Result<Startup, FetchError>> {
    return safeFetch<Startup>(`${API_BASE_URL}/api/startups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing startup.
   */
  async updateStartup(id: string, data: CreateStartupRequest): Promise<Result<Startup, FetchError>> {
    return safeFetch<Startup>(`${API_BASE_URL}/api/startups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a startup.
   * 
   * @example
   * const result = await apiWithResults.deleteStartup('123');
   * if (result.isOk()) {
   *   toast.success('Startup deleted');
   * } else {
   *   toast.error('Failed to delete startup');
   * }
   */
  async deleteStartup(id: string): Promise<Result<void, FetchError>> {
    return safeFetch<void>(`${API_BASE_URL}/api/startups/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  },

  /**
   * Fetch all contacts (global list).
   */
  async getContacts(params?: { trashed?: boolean }): Promise<Result<Contact[], FetchError>> {
    const query = params?.trashed ? `?trashed=${params.trashed}` : '';
    return safeFetch<Contact[]>(`${API_BASE_URL}/api/contacts${query}`, {
      credentials: 'include',
    });
  },

  /**
   * Fetch contacts for a specific startup.
   */
  async getContactsForStartup(
    startupId: string,
    params?: { trashed?: boolean }
  ): Promise<Result<Contact[], FetchError>> {
    const query = params?.trashed ? `?trashed=${params.trashed}` : '';
    return safeFetch<Contact[]>(`${API_BASE_URL}/api/startups/${startupId}/contacts${query}`, {
      credentials: 'include',
    });
  },

  /**
   * Create a new contact.
   */
  async createContact(data: CreateContactRequest): Promise<Result<Contact, FetchError>> {
    return safeFetch<Contact>(`${API_BASE_URL}/api/startups/${data.startup_id}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Example: Chaining operations with Result types
 * 
 * This shows how to chain multiple API calls and handle errors gracefully.
 */
export async function createStartupWithContact(
  startupData: CreateStartupRequest,
  contactData: Omit<CreateContactRequest, 'startup_id'>
): Promise<Result<{ startup: Startup; contact: Contact }, FetchError>> {
  // First, create the startup
  const startupResult = await apiWithResults.createStartup(startupData);
  
  if (startupResult.isErr()) {
    // If startup creation fails, return the error
    return startupResult as Result<never, FetchError>;
  }
  
  const startup = startupResult.unwrap();
  
  // Then, create the contact for that startup
  const contactResult = await apiWithResults.createContact({
    ...contactData,
    startup_id: startup.id,
  });
  
  if (contactResult.isErr()) {
    // If contact creation fails, return the error
    // Note: The startup was already created, so you might want to handle cleanup
    return contactResult as Result<never, FetchError>;
  }
  
  const contact = contactResult.unwrap();
  
  // Both succeeded!
  return Ok({ startup, contact });
}

/**
 * Example: Using andThen for cleaner chaining
 * 
 * This is a more functional approach using andThen (flatMap).
 */
export async function createStartupWithContactFunctional(
  startupData: CreateStartupRequest,
  contactData: Omit<CreateContactRequest, 'startup_id'>
): Promise<Result<{ startup: Startup; contact: Contact }, FetchError>> {
  const startupResult = await apiWithResults.createStartup(startupData);
  
  // Use match method on the result instance
  if (startupResult.isErr()) {
    return startupResult as Result<never, FetchError>;
  }
  
  const startup = startupResult.unwrap();
  const contactResult = await apiWithResults.createContact({
    ...contactData,
    startup_id: startup.id,
  });
  
  if (contactResult.isErr()) {
    return contactResult as Result<never, FetchError>;
  }
  
  const contact = contactResult.unwrap();
  return Ok({ startup, contact });
}
