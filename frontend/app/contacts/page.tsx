'use client';

import { useMemo, useState } from 'react';
import { useContacts, useTrashContact, useStartups } from '@/lib/hooks';
import { AddContactSheet } from '@/components/AddContactSheet';
import { ContactDetailSheet } from '@/components/ContactDetailSheet';
import { ContactForm } from '@/components/ContactForm';
import { EmailCompose } from '@/components/EmailCompose';
import type { Contact } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Eye } from 'lucide-react';

export default function ContactsPage() {
    const { data: contacts, isLoading, error, refetch } = useContacts();
    const { data: startups } = useStartups();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddContactOpen, setIsAddContactOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);
    const [contactFeedback, setContactFeedback] = useState<string | null>(null);
    const [contactFormContact, setContactFormContact] = useState<Contact | null>(null);
    const [isContactFormOpen, setIsContactFormOpen] = useState(false);
    const [contactForEmail, setContactForEmail] = useState<Contact | null>(null);
    const trashContactMutation = useTrashContact();
    const { user } = useAuth();

    // Filter contacts
    const filteredContacts = useMemo(() => {
        if (!contacts) return [];

        return contacts.filter(contact =>
            searchTerm === '' ||
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [contacts, searchTerm]);
    const startupLookup = useMemo(() => {
        if (!startups) return {} as Record<string, string>;
        return startups.reduce<Record<string, string>>((acc, startup) => {
            acc[startup.id] = startup.name;
            return acc;
        }, {});
    }, [startups]);

    const handleViewContact = (contact: Contact) => {
        setSelectedContact(contact);
        setContactFeedback(null);
        setIsContactSheetOpen(true);
    };

    const closeContactSheet = () => {
        setIsContactSheetOpen(false);
        setSelectedContact(null);
        setContactFeedback(null);
    };

    const handleTrashContact = async (contact: Contact) => {
        try {
            await trashContactMutation.mutateAsync({ id: contact.id, startupId: contact.startup_id });
            setContactFeedback('Contact moved to trash.');
            await refetch();
        } catch (err) {
            console.error('Failed to trash contact', err);
        }
    };

    const canTrashSelected =
        !!selectedContact &&
        (user?.role === 'admin' ||
            (!!selectedContact.owner_id && !!user && selectedContact.owner_id === user.id));

    const handleEditContact = (contact: Contact) => {
        setContactFormContact(contact);
        setIsContactFormOpen(true);
        closeContactSheet();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-muted-foreground">Loading contacts...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-destructive">Failed to load contacts</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2">
                                Contacts
                            </h1>
                            <p className="text-muted-foreground">
                                {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsAddContactOpen(true)}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                        >
                            Add Contact
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-sm">
                    <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                        Search
                    </label>
                    <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, role, or email..."
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                    />
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 delay-100">
                    {filteredContacts.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-muted-foreground text-lg mb-2">
                                {searchTerm ? 'No contacts match your search' : 'No contacts yet'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Primary
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredContacts.map((contact, index) => (
                                    <tr
                                        key={contact.id}
                                        className="group hover:bg-muted/30 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                                {contact.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-muted-foreground">
                                                {contact.role}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-muted-foreground">
                                                {contact.email || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-muted-foreground">
                                                {contact.phone || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {contact.is_primary && (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary">
                                                    Primary
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleViewContact(contact)}
                                                className="inline-flex items-center gap-1 text-sm text-muted-foreground border border-border rounded-md px-3 py-1 hover:text-foreground"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <ContactDetailSheet
                contact={selectedContact}
                isOpen={isContactSheetOpen && !!selectedContact}
                onClose={closeContactSheet}
                onEdit={handleEditContact}
                onEmail={(contact) => {
                    setContactForEmail(contact);
                    closeContactSheet();
                }}
                onTrash={handleTrashContact}
                isTrashLoading={
                    trashContactMutation.isPending &&
                    trashContactMutation.variables?.id === selectedContact?.id
                }
                canTrash={canTrashSelected}
                trashDisabledReason="Only owners or admins can move contacts to trash."
                feedbackMessage={contactFeedback}
            />

            {isContactFormOpen && contactFormContact && (
                <ContactForm
                    key={contactFormContact.id}
                    startupId={contactFormContact.startup_id}
                    contact={contactFormContact}
                    onClose={() => {
                        setIsContactFormOpen(false);
                        setContactFormContact(null);
                    }}
                    onSuccess={() => {
                        refetch();
                        setIsContactFormOpen(false);
                        setContactFormContact(null);
                    }}
                />
            )}

            {contactForEmail && (
                <EmailCompose
                    startupId={contactForEmail.startup_id}
                    startupName={startupLookup[contactForEmail.startup_id] || 'Startup Contact'}
                    contact={contactForEmail}
                    onClose={() => setContactForEmail(null)}
                    onSent={() => {
                        setContactForEmail(null);
                    }}
                />
            )}

            <AddContactSheet isOpen={isAddContactOpen} onClose={() => setIsAddContactOpen(false)} />
        </div>
    );
}
