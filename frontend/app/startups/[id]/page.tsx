'use client';

import { useMemo, useState } from 'react';
import { useStartup, useContactsForStartup, useOutreachForStartup, useInterviewsForStartup, useRefreshEmailStatus, useTrashContact, useRestoreContact, useBulkRestoreContacts, useBulkDeleteContacts, usePermanentDeleteContact } from '@/lib/hooks';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ContactForm } from '@/components/ContactForm';
import { OutreachForm } from '@/components/OutreachForm';
import { EmailCompose } from '@/components/EmailCompose';
import { ContactDetailSheet } from '@/components/ContactDetailSheet';
import type { Contact } from '@/lib/api';
import { Mail, RefreshCw, Eye, Undo2, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function StartupDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [contactView, setContactView] = useState<'active' | 'trashed'>('active');
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);
    const [contactFeedback, setContactFeedback] = useState<string | null>(null);
    const [contactFormContact, setContactFormContact] = useState<Contact | null>(null);
    const [selectedTrashedIds, setSelectedTrashedIds] = useState<string[]>([]);
    const { data: startup, isLoading, error } = useStartup(id);
    const { data: contacts, refetch: refetchContacts } = useContactsForStartup(id);
    const { data: trashedContacts, refetch: refetchTrashedContacts } = useContactsForStartup(id, {
        trashed: true,
        enabled: isAdmin && contactView === 'trashed',
    });
    const { data: outreachLogs, refetch: refetchOutreach } = useOutreachForStartup(id);
    const { data: interviews } = useInterviewsForStartup(id);

    const [showContactForm, setShowContactForm] = useState(false);
    const [showOutreachForm, setShowOutreachForm] = useState(false);
    const [contactForEmail, setContactForEmail] = useState<Contact | null>(null);
    const [channelFilter, setChannelFilter] = useState('all');
    const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
    const refreshEmailStatus = useRefreshEmailStatus();
    const trashContactMutation = useTrashContact();
    const restoreContactMutation = useRestoreContact();
    const bulkRestoreMutation = useBulkRestoreContacts();
    const bulkDeleteMutation = useBulkDeleteContacts();
    const permanentDeleteMutation = usePermanentDeleteContact();


    const channelOptions = useMemo(() => {
        const options = new Set<string>(['all']);
        (outreachLogs ?? []).forEach((log) => {
            if (log.channel) {
                options.add(log.channel.toLowerCase());
            }
        });
        return Array.from(options);
    }, [outreachLogs]);

    const filteredOutreach = useMemo(() => {
        if (!outreachLogs) return [];
        if (channelFilter === 'all') return outreachLogs;
        return outreachLogs.filter((log) => log.channel.toLowerCase() === channelFilter);
    }, [outreachLogs, channelFilter]);

    const formatChannelLabel = (value: string) => {
        if (value === 'all') return 'All channels';
        return value.replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const formatStatusLabel = (status?: string | null) => {
        if (!status) return 'pending';
        return status.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    };

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
            setSelectedContact((prev) => (prev ? { ...prev, is_trashed: true } : prev));
            await Promise.all([refetchContacts(), refetchTrashedContacts()]);
        } catch (err) {
            console.error('Failed to move contact to trash', err);
        }
    };

    const handleRestoreContact = async (contactId: string) => {
        try {
            await restoreContactMutation.mutateAsync({ id: contactId, startupId: id });
            setSelectedTrashedIds((prev) => prev.filter((value) => value !== contactId));
            await Promise.all([refetchContacts(), refetchTrashedContacts()]);
        } catch (err) {
            console.error('Failed to restore contact', err);
        }
    };

    const handlePermanentDelete = async (contactId: string) => {
        try {
            await permanentDeleteMutation.mutateAsync({ id: contactId, startupId: id });
            setSelectedTrashedIds((prev) => prev.filter((value) => value !== contactId));
            await refetchTrashedContacts();
        } catch (err) {
            console.error('Failed to delete contact permanently', err);
        }
    };

    const handleBulkRestore = async () => {
        if (selectedTrashedIds.length === 0) return;
        try {
            await bulkRestoreMutation.mutateAsync({ contactIds: selectedTrashedIds, startupId: id });
            setSelectedTrashedIds([]);
            await Promise.all([refetchContacts(), refetchTrashedContacts()]);
        } catch (err) {
            console.error('Failed to restore contacts', err);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedTrashedIds.length === 0) return;
        try {
            await bulkDeleteMutation.mutateAsync({ contactIds: selectedTrashedIds, startupId: id });
            setSelectedTrashedIds([]);
            await refetchTrashedContacts();
        } catch (err) {
            console.error('Failed to delete contacts', err);
        }
    };

    const handleContactViewChange = (view: 'active' | 'trashed') => {
        setContactView(view);
        if (view === 'active') {
            setSelectedTrashedIds([]);
        }
    };

    const toggleTrashedSelection = (contactId: string) => {
        setSelectedTrashedIds((prev) =>
            prev.includes(contactId) ? prev.filter((value) => value !== contactId) : [...prev, contactId],
        );
    };

    const toggleSelectAllTrashed = () => {
        if (!trashedContacts || trashedContacts.length === 0) return;
        if (selectedTrashedIds.length === trashedContacts.length) {
            setSelectedTrashedIds([]);
        } else {
            setSelectedTrashedIds(trashedContacts.map((contact) => contact.id));
        }
    };

    const handleRefreshStatus = (messageId: string) => {
        refreshEmailStatus.mutate({ messageId, startupId: id });
    };

    const canTrashSelected =
        !!selectedContact &&
        (isAdmin || (!!user && !!selectedContact.owner_id && selectedContact.owner_id === user.id));

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-5xl mx-auto">
                    <p className="text-muted-foreground">Loading startup...</p>
                </div>
            </div>
        );
    }

    if (error || !startup) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-5xl mx-auto">
                    <p className="text-destructive">Error loading startup</p>
                    <Link href="/startups" className="text-primary hover:underline">
                        ← Back to Pipeline
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/startups" className="text-primary hover:underline text-sm mb-4 inline-block">
                        ← Back to Pipeline
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">{startup.name}</h1>
                            {startup.category && (
                                <p className="text-muted-foreground">{startup.category}</p>
                            )}
                        </div>
                        <Link
                            href={`/startups/${id}/edit`}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Edit
                        </Link>
                    </div>
                </div>

                {/* Basic Info Card */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Basic Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="text-foreground font-medium">{startup.status}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Admin Claimed</p>
                            <p className="text-foreground font-medium">{startup.admin_claimed ? 'Yes' : 'No'}</p>
                        </div>
                        {startup.website && (
                            <div>
                                <p className="text-sm text-muted-foreground">Website</p>
                                <a
                                    href={startup.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {startup.website}
                                </a>
                            </div>
                        )}
                        {startup.newsroom_url && (
                            <div>
                                <p className="text-sm text-muted-foreground">Newsroom</p>
                                <a
                                    href={startup.newsroom_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    View Newsroom
                                </a>
                            </div>
                        )}
                        {startup.next_step && (
                            <div>
                                <p className="text-sm text-muted-foreground">Next Step</p>
                                <p className="text-foreground font-medium">{startup.next_step}</p>
                            </div>
                        )}
                        {startup.last_contact_date && (
                            <div>
                                <p className="text-sm text-muted-foreground">Last Contact</p>
                                <p className="text-foreground font-medium">
                                    {new Date(startup.last_contact_date).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Contacts Section */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap gap-3 justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Contacts</h2>
                            {isAdmin && (
                                <div className="mt-2 inline-flex items-center rounded-md border border-border bg-muted/40 p-1 text-xs font-medium">
                                    <button
                                        type="button"
                                        onClick={() => handleContactViewChange('active')}
                                        className={`px-3 py-1 rounded-md transition-colors ${contactView === 'active'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground'
                                            }`}
                                    >
                                        Active
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleContactViewChange('trashed')}
                                        className={`px-3 py-1 rounded-md transition-colors ${contactView === 'trashed'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground'
                                            }`}
                                    >
                                        Trashed
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setContactFormContact(null);
                                setShowContactForm(true);
                            }}
                            className="px-3 py-1 bg-primary text-white rounded-md hover:opacity-90 active:scale-95 transition-all text-sm font-medium shadow-sm hover:shadow-md"
                        >
                            Add Contact
                        </button>
                    </div>

                    {contactView === 'active' ? (
                        contacts && contacts.length > 0 ? (
                            <div className="space-y-3">
                                {contacts.map((contact) => (
                                    <div key={contact.id} className="border border-border rounded-md p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {contact.name}
                                                    {contact.is_primary && (
                                                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                                            Primary
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{contact.role}</p>
                                                {contact.email && (
                                                    <p className="text-sm text-foreground mt-1">{contact.email}</p>
                                                )}
                                                {contact.phone && (
                                                    <p className="text-sm text-foreground">{contact.phone}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleViewContact(contact)}
                                                className="inline-flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-md px-2 py-1 hover:text-foreground"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View
                                            </button>
                                        </div>
                                        {contact.email && (
                                            <button
                                                onClick={() => setContactForEmail(contact)}
                                                className="mt-3 inline-flex items-center gap-2 text-sm text-primary border border-primary/40 px-3 py-1 rounded-md hover:bg-primary/5 transition-colors"
                                            >
                                                <Mail className="h-4 w-4" />
                                                Send Email
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">No contacts yet</p>
                        )
                    ) : isAdmin ? (
                        trashedContacts && trashedContacts.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-3 items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <input
                                            type="checkbox"
                                            checked={
                                                trashedContacts.length > 0 &&
                                                selectedTrashedIds.length === trashedContacts.length
                                            }
                                            onChange={toggleSelectAllTrashed}
                                        />
                                        Select all
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleBulkRestore}
                                            disabled={selectedTrashedIds.length === 0 || bulkRestoreMutation.isPending}
                                            className="px-3 py-1 rounded-md border border-border text-sm text-foreground hover:bg-muted/60 disabled:opacity-50"
                                        >
                                            <Undo2 className="h-3.5 w-3.5 inline mr-1" />
                                            Put Back Selected
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            disabled={selectedTrashedIds.length === 0 || bulkDeleteMutation.isPending}
                                            className="px-3 py-1 rounded-md border border-destructive/40 text-sm text-destructive hover:bg-destructive/5 disabled:opacity-50"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 inline mr-1" />
                                            Delete Selected
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {trashedContacts.map((contact) => (
                                        <div key={contact.id} className="border border-border rounded-md p-4 bg-muted/30">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTrashedIds.includes(contact.id)}
                                                    onChange={() => toggleTrashedSelection(contact.id)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div>
                                                            <p className="font-medium text-foreground">{contact.name}</p>
                                                            <p className="text-sm text-muted-foreground">{contact.role}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Owner:{' '}
                                                                <span className="text-foreground">
                                                                    {contact.owner_name || contact.owner_email || 'Unknown'}
                                                                </span>
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                onClick={() => handleViewContact(contact)}
                                                                className="text-xs border border-border rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => handleRestoreContact(contact.id)}
                                                                className="text-xs border border-border rounded-md px-2 py-1 text-foreground hover:bg-muted/50"
                                                            >
                                                                Put Back
                                                            </button>
                                                            <button
                                                                onClick={() => handlePermanentDelete(contact.id)}
                                                                className="text-xs border border-destructive/30 rounded-md px-2 py-1 text-destructive hover:bg-destructive/5"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {contact.email && (
                                                        <p className="text-xs text-muted-foreground">Email: {contact.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">No trashed contacts yet.</p>
                        )
                    ) : (
                        <p className="text-muted-foreground text-sm">Trash is available to admins only.</p>
                    )}
                </div>

                {/* Outreach Timeline */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
                        <h2 className="text-xl font-semibold text-foreground">Outreach Timeline</h2>
                        <div className="flex items-center gap-2">
                            <select
                                value={channelFilter}
                                onChange={(e) => setChannelFilter(e.target.value)}
                                className="px-3 py-1 border border-border rounded-md text-sm bg-background"
                            >
                                {channelOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {formatChannelLabel(option)}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowOutreachForm(true)}
                                className="px-3 py-1 bg-primary text-white rounded-md hover:opacity-90 active:scale-95 transition-all text-sm font-medium shadow-sm hover:shadow-md"
                            >
                                Log Outreach
                            </button>
                        </div>
                    </div>
                    {filteredOutreach.length > 0 ? (
                        <div className="space-y-3">
                            {filteredOutreach.map((log) => (
                                <div key={log.id} className="border-l-2 border-primary pl-4 py-3 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2 font-medium text-foreground">
                                            {log.channel.toLowerCase() === 'email' && <Mail className="h-4 w-4 text-primary" />}
                                            <span>{formatChannelLabel(log.channel)} - {log.direction}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(log.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {log.channel.toLowerCase() === 'email' && log.subject && (
                                        <p className="text-sm text-foreground">Subject: <span className="font-medium">{log.subject}</span></p>
                                    )}
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Outcome: <span className="text-foreground">{log.outcome}</span>
                                    </p>
                                    {log.channel.toLowerCase() === 'email' ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full border border-primary/40 text-primary">
                                                    {formatStatusLabel(log.delivery_status)}
                                                </span>
                                                {log.message_id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRefreshStatus(log.message_id)}
                                                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        <RefreshCw
                                                            className={`h-3.5 w-3.5 ${refreshEmailStatus.isPending && refreshEmailStatus.variables?.messageId === log.message_id ? 'animate-spin' : ''
                                                                }`}
                                                        />
                                                        Refresh status
                                                    </button>
                                                )}
                                            </div>
                                            {log.message_summary && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedEmailId(expandedEmailId === log.id ? null : log.id)}
                                                        className="text-sm text-primary hover:underline"
                                                    >
                                                        {expandedEmailId === log.id ? 'Hide Email' : 'View Email'}
                                                    </button>
                                                    {expandedEmailId === log.id && (
                                                        <p className="text-sm text-foreground border border-border rounded-md p-3 bg-muted/30">
                                                            {log.message_summary}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        log.message_summary && (
                                            <p className="text-sm text-foreground">{log.message_summary}</p>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            {channelFilter === 'all' ? 'No outreach logged yet' : 'No outreach entries for this channel'}
                        </p>
                    )}
                    {refreshEmailStatus.isError && (
                        <p className="text-xs text-destructive mt-2">Unable to refresh email status. Please try again.</p>
                    )}
                </div>

                {/* Interviews */}
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-foreground">Interviews</h2>
                        <Link
                            href={`/startups/${id}/interviews/new`}
                            className="px-3 py-1 bg-primary text-white rounded-md hover:opacity-90 active:scale-95 transition-all text-sm font-medium shadow-sm hover:shadow-md"
                        >
                            Add Interview
                        </Link>
                    </div>
                    {interviews && interviews.length > 0 ? (
                        <div className="space-y-3">
                            {interviews.map((interview) => (
                                <div key={interview.id} className="border border-border rounded-md p-4 hover:border-primary/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {interview.interview_type} Interview
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(interview.date).toLocaleString()}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/interviews/${interview.id}/insights`}
                                            className="text-xs px-3 py-1 bg-primary text-white rounded-md hover:opacity-90 transition-opacity font-medium"
                                        >
                                            View Insights
                                        </Link>
                                    </div>
                                    {interview.summary && (
                                        <p className="text-sm text-foreground mt-2">{interview.summary}</p>
                                    )}
                                    {(interview.recording_url || interview.transcript_url) && (
                                        <div className="flex gap-2 mt-2">
                                            {interview.recording_url && (
                                                <a
                                                    href={interview.recording_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    📹 Recording
                                                </a>
                                            )}
                                            {interview.transcript_url && (
                                                <a
                                                    href={interview.transcript_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    📄 Transcript
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No interviews yet</p>
                    )}
                </div>
            </div>
            <ContactDetailSheet
                contact={selectedContact}
                isOpen={isContactSheetOpen && !!selectedContact}
                onClose={closeContactSheet}
                onEdit={(contact) => {
                    setContactFormContact(contact);
                    setShowContactForm(true);
                    closeContactSheet();
                }}
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

            {/* Modals */}
            {showContactForm && (
                <ContactForm
                    key={contactFormContact ? contactFormContact.id : 'new-contact'}
                    startupId={id}
                    contact={contactFormContact ?? undefined}
                    onClose={() => {
                        setShowContactForm(false);
                        setContactFormContact(null);
                    }}
                    onSuccess={() => {
                        refetchContacts();
                        refetchTrashedContacts();
                        setContactFormContact(null);
                    }}
                />
            )}

            {showOutreachForm && (
                <OutreachForm
                    startupId={id}
                    onClose={() => setShowOutreachForm(false)}
                    onSuccess={() => {
                        refetchOutreach();
                    }}
                />
            )}
            {contactForEmail && startup && (
                <EmailCompose
                    startupId={id}
                    startupName={startup.name}
                    contact={contactForEmail}
                    onClose={() => setContactForEmail(null)}
                    onSent={() => {
                        refetchOutreach();
                    }}
                />
            )}
        </div>
    );
}
