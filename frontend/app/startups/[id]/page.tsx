'use client';

import { useState } from 'react';
import { useStartup, useContactsForStartup, useOutreachForStartup, useInterviewsForStartup } from '@/lib/hooks';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ContactForm } from '@/components/ContactForm';
import { OutreachForm } from '@/components/OutreachForm';

export default function StartupDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { data: startup, isLoading, error } = useStartup(id);
    const { data: contacts, refetch: refetchContacts } = useContactsForStartup(id);
    const { data: outreachLogs, refetch: refetchOutreach } = useOutreachForStartup(id);
    const { data: interviews } = useInterviewsForStartup(id);

    const [showContactForm, setShowContactForm] = useState(false);
    const [showOutreachForm, setShowOutreachForm] = useState(false);

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
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-foreground">Contacts</h2>
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="px-3 py-1 bg-primary text-white rounded-md hover:opacity-90 active:scale-95 transition-all text-sm font-medium shadow-sm hover:shadow-md"
                        >
                            Add Contact
                        </button>
                    </div>
                    {contacts && contacts.length > 0 ? (
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No contacts yet</p>
                    )}
                </div>

                {/* Outreach Timeline */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-foreground">Outreach Timeline</h2>
                        <button
                            onClick={() => setShowOutreachForm(true)}
                            className="px-3 py-1 bg-primary text-white rounded-md hover:opacity-90 active:scale-95 transition-all text-sm font-medium shadow-sm hover:shadow-md"
                        >
                            Log Outreach
                        </button>
                    </div>
                    {outreachLogs && outreachLogs.length > 0 ? (
                        <div className="space-y-3">
                            {outreachLogs.map((log) => (
                                <div key={log.id} className="border-l-2 border-primary pl-4 py-2">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-medium text-foreground">
                                            {log.channel} - {log.direction}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(log.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Outcome: <span className="text-foreground">{log.outcome}</span>
                                    </p>
                                    {log.message_summary && (
                                        <p className="text-sm text-foreground">{log.message_summary}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No outreach logged yet</p>
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

            {/* Modals */}
            {showContactForm && (
                <ContactForm
                    startupId={id}
                    onClose={() => setShowContactForm(false)}
                    onSuccess={() => {
                        refetchContacts();
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
        </div>
    );
}
