'use client';

import { useMemo, useState } from 'react';
import { useContacts, useCreateContact } from '@/lib/hooks';

interface ContactFormProps {
    startupId: string;
    onClose: () => void;
    onSuccess: () => void;
}

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

export function ContactForm({ startupId, onClose, onSuccess }: ContactFormProps) {
    const createContact = useCreateContact();
    const { data: contacts } = useContacts();
    const [formData, setFormData] = useState({
        name: '',
        role: 'Founder',
        email: '',
        phone: '',
        linkedin_url: '',
        is_primary: false,
        notes: '',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

    const filteredContacts = useMemo(() => {
        if (!contacts || searchTerm.trim() === '') return contacts || [];
        return contacts.filter((contact) =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
        );
    }, [contacts, searchTerm]);

    const fillFromExisting = (contactId: string) => {
        const existing = contacts?.find((contact) => contact.id === contactId);
        if (!existing) return;

        setSelectedContactId(contactId);
        setFormData({
            name: existing.name,
            role: existing.role,
            email: existing.email || '',
            phone: existing.phone || '',
            linkedin_url: existing.linkedin_url || '',
            is_primary: existing.is_primary || false,
            notes: existing.notes || '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createContact.mutateAsync({
                startup_id: startupId,
                name: formData.name,
                role: formData.role,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                linkedin_url: formData.linkedin_url || undefined,
                is_primary: formData.is_primary,
                notes: formData.notes || undefined,
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create contact:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <h2 className="text-2xl font-bold text-foreground mb-4">Add Contact</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {contacts && contacts.length > 0 && (
                        <div className="border border-border rounded-lg p-4 bg-muted/30">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Search existing contacts</p>
                                    <p className="text-xs text-muted-foreground">Select to prefill details or keep typing to add fresh info.</p>
                                </div>
                                {selectedContactId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedContactId(null);
                                            setFormData({
                                                name: '',
                                                role: 'Founder',
                                                email: '',
                                                phone: '',
                                                linkedin_url: '',
                                                is_primary: false,
                                                notes: '',
                                            });
                                        }}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, role, or email"
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm mb-2"
                            />
                            <div className="max-h-40 overflow-y-auto border border-dashed border-border rounded-md">
                                {filteredContacts.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-3">No matches</p>
                                ) : (
                                    filteredContacts.slice(0, 6).map((contact) => (
                                        <button
                                            type="button"
                                            key={contact.id}
                                            onClick={() => fillFromExisting(contact.id)}
                                            className={`w-full text-left px-3 py-2 text-sm border-b last:border-b-0 transition-colors ${selectedContactId === contact.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/40'
                                                }`}
                                        >
                                            <p className="font-medium">{contact.name}</p>
                                            <p className="text-xs text-muted-foreground">{contact.role}{contact.email ? ` · ${contact.email}` : ''}</p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

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
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-foreground mb-1">
                            Role <span className="text-destructive">*</span>
                        </label>
                        <select
                            id="role"
                            required
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        >
                            {ROLES.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            placeholder="john@example.com"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                            Phone
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            placeholder="+234 123 456 7890"
                        />
                    </div>

                    {/* LinkedIn */}
                    <div>
                        <label htmlFor="linkedin_url" className="block text-sm font-medium text-foreground mb-1">
                            LinkedIn URL
                        </label>
                        <input
                            type="url"
                            id="linkedin_url"
                            value={formData.linkedin_url}
                            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            placeholder="https://linkedin.com/in/johndoe"
                        />
                    </div>

                    {/* Primary Contact */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_primary"
                            checked={formData.is_primary}
                            onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                            className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-2 focus:ring-ring transition-all"
                        />
                        <label htmlFor="is_primary" className="ml-2 text-sm text-foreground">
                            Primary Contact
                        </label>
                    </div>

                    {/* Notes */}
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                            placeholder="Additional notes..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={createContact.isPending}
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 font-medium shadow-md hover:shadow-lg"
                        >
                            {createContact.isPending ? 'Adding...' : 'Add Contact'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 active:scale-95 transition-all font-medium"
                        >
                            Cancel
                        </button>
                    </div>

                    {createContact.isError && (
                        <p className="text-destructive text-sm text-center">
                            Failed to add contact. Please try again.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
