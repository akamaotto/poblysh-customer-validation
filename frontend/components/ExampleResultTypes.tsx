/**
 * Example component demonstrating Result and Option types with oxide.ts
 * 
 * This shows how to use the new API wrapper with Result types in a React component.
 * Compare this with existing components to see the benefits of explicit error handling.
 */

'use client';

import { useState, useEffect } from 'react';
import { match } from 'oxide.ts';
import { apiWithResults } from '@/lib/api-with-results';
import { formatFetchError, fromNullable } from '@/lib/result-utils';
import { validateStartupForm } from '@/lib/validation';
import type { Startup } from '@/lib/api';

/**
 * Example: Fetching data with Result types
 * 
 * Key improvements over traditional error handling:
 * 1. Explicit error handling - can't forget to handle errors
 * 2. Type-safe error types - know exactly what errors can occur
 * 3. No try-catch needed - errors are values
 * 4. Better IDE support - autocomplete for error types
 */
export function StartupsListExample() {
    const [startups, setStartups] = useState<Startup[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStartups() {
            setLoading(true);
            setError(null);

            const result = await apiWithResults.getStartups();

            // Pattern matching for exhaustive error handling
            match(result, {
                Ok: (data) => {
                    setStartups(data);
                    console.log(`✅ Loaded ${data.length} startups`);
                },
                Err: (err) => {
                    // Type-safe error handling - TypeScript knows the error structure
                    const errorMessage = formatFetchError(err);
                    setError(errorMessage);
                    console.error('❌ Failed to load startups:', err);

                    // You can handle specific error types
                    if (err.type === 'HTTP_ERROR' && err.status === 401) {
                        // Redirect to login
                        console.log('User not authenticated');
                    } else if (err.type === 'NETWORK_ERROR') {
                        // Show offline message
                        console.log('Network connection lost');
                    }
                },
            });

            setLoading(false);
        }

        fetchStartups();
    }, []);

    if (loading) {
        return <div>Loading startups...</div>;
    }

    if (error) {
        return (
            <div className="error">
                <h3>Error loading startups</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div>
            <h2>Startups ({startups.length})</h2>
            <ul>
                {startups.map((startup) => (
                    <StartupItemExample key={startup.id} startup={startup} />
                ))}
            </ul>
        </div>
    );
}

/**
 * Example: Using Option types for nullable data
 * 
 * Benefits:
 * 1. Explicit handling of null/undefined
 * 2. No null pointer exceptions
 * 3. Chainable operations on optional values
 */
function StartupItemExample({ startup }: { startup: Startup }) {
    // Convert nullable fields to Option types
    const website = fromNullable(startup.website);
    const category = fromNullable(startup.category);
    const lastContact = fromNullable(startup.last_contact_date);

    return (
        <li>
            <h3>{startup.name}</h3>

            {/* Pattern matching for optional values */}
            {match(category, {
                Some: (cat) => <span className="badge">{cat}</span>,
                None: () => <span className="badge-empty">No category</span>,
            })}

            {/* Using unwrapOr for default values */}
            <p>Status: {startup.status}</p>
            <p>
                Website:{' '}
                {match(website, {
                    Some: (url) => (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            {url}
                        </a>
                    ),
                    None: () => <span className="text-gray-400">Not provided</span>,
                })}
            </p>

            {/* Chaining operations on Option */}
            <p>
                Last contact:{' '}
                {lastContact
                    .map((date) => new Date(date).toLocaleDateString())
                    .unwrapOr('Never')}
            </p>
        </li>
    );
}

/**
 * Example: Form submission with validation using Result types
 * 
 * Benefits:
 * 1. Validation errors are collected and typed
 * 2. Can display field-specific errors
 * 3. Composable validation logic
 */
export function CreateStartupFormExample() {
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        website: '',
        status: 'active',
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        setSubmitting(true);

        // Step 1: Validate form data
        const validationResult = validateStartupForm(formData);

        match(validationResult, {
            Ok: async (validData) => {
                // Step 2: Submit to API
                const createResult = await apiWithResults.createStartup(validData);

                match(createResult, {
                    Ok: (startup) => {
                        console.log('✅ Created startup:', startup);
                        alert(`Successfully created ${startup.name}!`);
                        // Reset form
                        setFormData({ name: '', category: '', website: '', status: 'active' });
                    },
                    Err: (error) => {
                        console.error('❌ API error:', error);
                        alert(`Failed to create startup: ${formatFetchError(error)}`);
                    },
                });
            },
            Err: async (errors) => {
                // Display validation errors
                console.log('❌ Validation errors:', errors);
                const errorMap: Record<string, string> = {};
                errors.forEach((err) => {
                    errorMap[err.field] = err.message;
                });
                setFieldErrors(errorMap);
            },
        });

        setSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Create Startup</h2>

            <div>
                <label htmlFor="name">Name *</label>
                <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={fieldErrors.name ? 'error' : ''}
                />
                {fieldErrors.name && <span className="error-message">{fieldErrors.name}</span>}
            </div>

            <div>
                <label htmlFor="category">Category</label>
                <input
                    id="category"
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
            </div>

            <div>
                <label htmlFor="website">Website</label>
                <input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className={fieldErrors.website ? 'error' : ''}
                />
                {fieldErrors.website && <span className="error-message">{fieldErrors.website}</span>}
            </div>

            <div>
                <label htmlFor="status">Status *</label>
                <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                </select>
            </div>

            <button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Startup'}
            </button>
        </form>
    );
}

/**
 * Example: Using Result types with React Query
 * 
 * This shows how to integrate Result types with @tanstack/react-query
 */
export function useStartupsWithResults() {
    return {
        data: [] as Startup[],
        error: null as string | null,
        isLoading: false,
        // In a real implementation, you'd use useQuery here
        // This is just to show the pattern
    };
}
