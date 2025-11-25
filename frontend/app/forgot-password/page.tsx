'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setEmail('');
            } else {
                setError(data.message || 'Failed to send reset email');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-2 text-foreground">Forgot Password</h1>
                <p className="text-sm text-muted-foreground mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {message && (
                    <div className="mb-4 p-3 bg-accent/10 border border-accent text-accent-foreground rounded">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="your@email.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <a href="/login" className="text-sm text-primary hover:underline">
                        Back to login
                    </a>
                </div>
            </div>
        </div>
    );
}
