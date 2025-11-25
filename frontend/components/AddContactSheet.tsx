'use client';

import { useState } from 'react';
import { Sheet } from '@/components/Sheet';
import { useCreateContact, useStartups } from '@/lib/hooks';

const ROLES = [
    'Founder',
    'Co-Founder',
    'CEO',
    'Comms',
    'Marketing',
    'Social Media',
    'Operations',
    'Other',
];

interface AddContactSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

const createDefaultForm = () => ({
    startup_id: '',
    name: '',
    role: 'Founder',
    email: '',
    phone: '',
    linkedin_url: '',
    is_primary: false,
    notes: '',
});

export function AddContactSheet({ isOpen, onClose }: AddContactSheetProps) {
    const { data: startups, isLoading } = useStartups();
    const createContact = useCreateContact();
    const [formData, setFormData] = useState(createDefaultForm);

    const handleClose = () => {
        setFormData(createDefaultForm());
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.startup_id) return;

        try {
            await createContact.mutateAsync({
                startup_id: formData.startup_id,
                name: formData.name,
                role: formData.role,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                linkedin_url: formData.linkedin_url || undefined,
                is_primary: formData.is_primary,
                notes: formData.notes || undefined,
            });

            handleClose();
        } catch (error) {
            console.error('Failed to add contact:', error);
        }
    };

    return (
        <Sheet
            isOpen={isOpen}
            onClose={handleClose}
            title="Add Contact"
            description="Connect a point of contact to one of your startups."
        >
            {isLoading ? (
                <p className="text-muted-foreground text-sm">Loading startups...</p>
            ) : !startups || startups.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    You need at least one startup before adding contacts.
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Startup */}
                    <div className="space-y-2">
                        <label htmlFor="startup" className="text-sm font-medium text-foreground">
                            Startup <span className="text-destructive">*</span>
                        </label>
                        <select
                            id="startup"
                            required
                            value={formData.startup_id}
                            onChange={(e) => setFormData({ ...formData, startup_id: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Select startup</option>
                            {startups.map((startup) => (
                                <option key={startup.id} value={startup.id}>
                                    {startup.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-foreground">
                            Name <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Jane Founder"
                        />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <label htmlFor="role" className="text-sm font-medium text-foreground">
                            Role <span className="text-destructive">*</span>
                        </label>
                        <select
                            id="role"
                            required
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {ROLES.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-foreground">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="jane@example.com"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium text-foreground">
                            Phone
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="+1 555 555 5555"
                        />
                    </div>

                    {/* LinkedIn */}
                    <div className="space-y-2">
                        <label htmlFor="linkedin_url" className="text-sm font-medium text-foreground">
                            LinkedIn URL
                        </label>
                        <input
                            type="url"
                            id="linkedin_url"
                            value={formData.linkedin_url}
                            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="https://linkedin.com/in/janedoe"
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label htmlFor="notes" className="text-sm font-medium text-foreground">
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            placeholder="Any context worth remembering..."
                        />
                    </div>

                    {/* Primary */}
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="is_primary"
                            checked={formData.is_primary}
                            onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                        />
                        <label htmlFor="is_primary" className="text-sm text-foreground">
                            Mark as primary contact
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={!formData.startup_id || !formData.name || createContact.isPending}
                            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {createContact.isPending ? 'Adding...' : 'Add Contact'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-opacity hover:opacity-90"
                        >
                            Cancel
                        </button>
                    </div>

                    {createContact.isError && (
                        <p className="text-sm text-destructive text-center">
                            Failed to add contact. Please try again.
                        </p>
                    )}
                </form>
            )}
        </Sheet>
    );
}
