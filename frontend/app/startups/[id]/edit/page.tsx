'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStartup, useUpdateStartup } from '@/lib/hooks';
import Link from 'next/link';

const STATUSES = [
    'Lead',
    'Intro Secured',
    'Call Booked',
    'Interview Done',
    'Activation Candidate',
    'Not a Fit',
];

const CATEGORIES = [
    'Fintech',
    'SaaS',
    'AI',
    'E-commerce',
    'Healthtech',
    'Edtech',
    'Other',
];

export default function EditStartupPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const { data: startup, isLoading } = useStartup(id);
    const updateStartup = useUpdateStartup();

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        website: '',
        newsroom_url: '',
        status: 'Lead',
    });

    useEffect(() => {
        if (startup) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                name: startup.name,
                category: startup.category || '',
                website: startup.website || '',
                newsroom_url: startup.newsroom_url || '',
                status: startup.status,
            });
        }
    }, [startup]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await updateStartup.mutateAsync({
                id,
                data: {
                    name: formData.name,
                    category: formData.category || undefined,
                    website: formData.website || undefined,
                    newsroom_url: formData.newsroom_url || undefined,
                    status: formData.status,
                },
            });

            router.push(`/startups/${id}`);
        } catch (error) {
            console.error('Failed to update startup:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-2xl mx-auto">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-2xl mx-auto">
                <Link href={`/startups/${id}`} className="text-primary hover:underline text-sm mb-4 inline-block">
                    ← Back to Detail
                </Link>

                <h1 className="text-3xl font-bold text-foreground mb-6">Edit Startup</h1>

                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                                Name <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
                                Category
                            </label>
                            <select
                                id="category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">Select category</option>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
                                Status <span className="text-destructive">*</span>
                            </label>
                            <select
                                id="status"
                                required
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Website */}
                        <div>
                            <label htmlFor="website" className="block text-sm font-medium text-foreground mb-1">
                                Website
                            </label>
                            <input
                                type="url"
                                id="website"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Newsroom URL */}
                        <div>
                            <label htmlFor="newsroom_url" className="block text-sm font-medium text-foreground mb-1">
                                Newsroom URL
                            </label>
                            <input
                                type="url"
                                id="newsroom_url"
                                value={formData.newsroom_url}
                                onChange={(e) => setFormData({ ...formData, newsroom_url: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={updateStartup.isPending}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {updateStartup.isPending ? 'Saving...' : 'Save Changes'}
                        </button>
                        <Link
                            href={`/startups/${id}`}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Cancel
                        </Link>
                    </div>

                    {updateStartup.isError && (
                        <p className="mt-4 text-destructive text-sm">
                            Failed to update startup. Please try again.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
