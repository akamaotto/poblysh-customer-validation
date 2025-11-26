'use client';

import type { ReactNode } from 'react';
import { Sheet } from '@/components/Sheet';
import type { Contact } from '@/lib/api';
import { Mail, Phone, Linkedin, Trash2, Pencil, AlertCircle, UserCircle2 } from 'lucide-react';

interface ContactDetailSheetProps {
    contact: Contact | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (contact: Contact) => void;
    onEmail: (contact: Contact) => void;
    onTrash: (contact: Contact) => void;
    isTrashLoading?: boolean;
    canTrash: boolean;
    trashDisabledReason?: string;
    feedbackMessage?: string | null;
}

export function ContactDetailSheet({
    contact,
    isOpen,
    onClose,
    onEdit,
    onEmail,
    onTrash,
    isTrashLoading,
    canTrash,
    trashDisabledReason,
    feedbackMessage,
}: ContactDetailSheetProps) {
    if (!contact) {
        return null;
    }

    const handleTrash = () => {
        if (!contact || !canTrash || contact.is_trashed) return;
        onTrash(contact);
    };

    const handleEdit = () => {
        if (!contact) return;
        onEdit(contact);
    };

    const handleEmail = () => {
        if (!contact || !contact.email) return;
        onEmail(contact);
    };

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            title="Contact Details"
            description="Peek at everything we know about this person."
            side="right"
        >
            <div className="space-y-6">
                {feedbackMessage && (
                    <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        <AlertCircle className="h-4 w-4" />
                        <span>{feedbackMessage}</span>
                    </div>
                )}

                <div className="space-y-1">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xl font-semibold text-foreground">{contact.name}</p>
                            <p className="text-sm text-muted-foreground">{contact.role}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {contact.is_primary && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                                    Primary
                                </span>
                            )}
                            {contact.is_trashed && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                    In Trash
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={contact.email || 'Not provided'} />
                    <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={contact.phone || 'Not provided'} />
                    <DetailRow
                        icon={<Linkedin className="h-4 w-4" />}
                        label="LinkedIn"
                        value={
                            contact.linkedin_url ? (
                                <a
                                    href={contact.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    View profile
                                </a>
                            ) : (
                                'Not linked'
                            )
                        }
                    />

                    <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                        <p className="text-sm text-foreground whitespace-pre-line">
                            {contact.notes && contact.notes.trim().length > 0 ? contact.notes : 'No notes yet.'}
                        </p>
                    </div>
                </div>

                <div className="rounded-lg border border-dashed border-border p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserCircle2 className="h-4 w-4" />
                        <span className="font-medium text-foreground">Owner</span>
                    </div>
                    <div className="text-sm text-foreground">
                        {contact.owner_name || contact.owner_email || 'Unassigned'}
                        {contact.owner_email && (
                            <span className="block text-xs text-muted-foreground">{contact.owner_email}</span>
                        )}
                    </div>
                </div>

                <div className="border-t border-border pt-4">
                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={handleTrash}
                            disabled={!canTrash || contact.is_trashed || isTrashLoading}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-destructive/30 text-destructive px-3 py-2 text-sm font-medium hover:bg-destructive/5 disabled:opacity-60"
                        >
                            <Trash2 className="h-4 w-4" />
                            {contact.is_trashed ? 'Already in Trash' : isTrashLoading ? 'Moving...' : 'Move to Trash'}
                        </button>
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted/50 text-foreground"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit Contact
                        </button>
                        <button
                            type="button"
                            onClick={handleEmail}
                            disabled={!contact.email}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-white px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                        >
                            <Mail className="h-4 w-4" />
                            Email Contact
                        </button>
                        {!canTrash && (
                            <p className="text-xs text-muted-foreground text-center">
                                {trashDisabledReason || 'Only owners or admins can move contacts to trash.'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Sheet>
    );
}

function DetailRow({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: ReactNode | string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 text-muted-foreground">{icon}</div>
            <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
                <div className="text-sm text-foreground">{value}</div>
            </div>
        </div>
    );
}
