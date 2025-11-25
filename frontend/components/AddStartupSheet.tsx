'use client';

import { useState } from 'react';
import { useCreateStartup } from '@/lib/hooks';
import { Sheet } from '@/components/Sheet';

const STATUSES = [
    'Lead',
    'Contacted',
    'Intro Secured',
    'Call Booked',
    'Meeting Scheduled',
    'Interview Done',
    'In Discussion',
    'Activation Candidate',
    'Closed Won',
    'Closed Lost',
    'Not a Fit'
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

interface AddStartupSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddStartupSheet({ isOpen, onClose }: AddStartupSheetProps) {
    const createStartup = useCreateStartup();

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        website: '',
        newsroom_url: '',
        status: 'Lead',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createStartup.mutateAsync({
                name: formData.name,
                category: formData.category || undefined,
                website: formData.website || undefined,
                newsroom_url: formData.newsroom_url || undefined,
                status: formData.status,
            });

            // Reset form and close
            setFormData({
                name: '',
                category: '',
                website: '',
                newsroom_url: '',
                status: 'Lead',
            });
            onClose();
        } catch (error) {
            console.error('Failed to create startup:', error);
        }
    };

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Startup"
            description="Add a new startup to your validation pipeline."
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-semibold text-foreground">
                        Name <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Enter startup name"
                    />
                </div>

                {/* Category */}
                <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-semibold text-foreground">
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
                <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium text-foreground">
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
                <div className="space-y-2">
                    <label htmlFor="website" className="text-sm font-medium text-foreground">
                        Website
                    </label>
                    <input
                        type="url"
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="https://example.com"
                    />
                </div>

                {/* Newsroom URL */}
                <div className="space-y-2">
                    <label htmlFor="newsroom_url" className="text-sm font-medium text-foreground">
                        Newsroom URL
                    </label>
                    <input
                        type="url"
                        id="newsroom_url"
                        value={formData.newsroom_url}
                        onChange={(e) => setFormData({ ...formData, newsroom_url: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="https://newsroom.example.com"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={createStartup.isPending}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
                    >
                        {createStartup.isPending ? 'Creating...' : 'Create Startup'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                        Cancel
                    </button>
                </div>

                {createStartup.isError && (
                    <p className="mt-4 text-destructive text-sm text-center">
                        Failed to create startup. Please try again.
                    </p>
                )}
            </form>
        </Sheet>
    );
}
