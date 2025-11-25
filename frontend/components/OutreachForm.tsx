'use client';

import { useState } from 'react';
import { useCreateOutreachLog, useContactsForStartup } from '@/lib/hooks';

interface OutreachFormProps {
    startupId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const CHANNELS = ['Email', 'WhatsApp', 'LinkedIn', 'Phone Call', 'In-Person', 'Other'];
const DIRECTIONS = ['Outbound', 'Inbound'];
const OUTCOMES = [
    'No Response',
    'Replied',
    'Intro Made',
    'Call Booked',
    'Declined',
    'Follow-Up Needed',
];

export function OutreachForm({ startupId, onClose, onSuccess }: OutreachFormProps) {
    const createOutreach = useCreateOutreachLog();
    const { data: contacts } = useContactsForStartup(startupId);

    const [formData, setFormData] = useState({
        contact_id: '',
        channel: 'Email',
        direction: 'Outbound',
        outcome: 'No Response',
        message_summary: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createOutreach.mutateAsync({
                startup_id: startupId,
                contact_id: formData.contact_id || undefined,
                channel: formData.channel,
                direction: formData.direction,
                outcome: formData.outcome,
                message_summary: formData.message_summary || undefined,
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to log outreach:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <h2 className="text-2xl font-bold text-foreground mb-4">Log Outreach</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Contact */}
                    {contacts && contacts.length > 0 && (
                        <div>
                            <label htmlFor="contact_id" className="block text-sm font-medium text-foreground mb-1">
                                Contact (Optional)
                            </label>
                            <select
                                id="contact_id"
                                value={formData.contact_id}
                                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            >
                                <option value="">General (no specific contact)</option>
                                {contacts.map((contact) => (
                                    <option key={contact.id} value={contact.id}>
                                        {contact.name} - {contact.role}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Channel */}
                    <div>
                        <label htmlFor="channel" className="block text-sm font-medium text-foreground mb-1">
                            Channel <span className="text-destructive">*</span>
                        </label>
                        <select
                            id="channel"
                            required
                            value={formData.channel}
                            onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        >
                            {CHANNELS.map((channel) => (
                                <option key={channel} value={channel}>
                                    {channel}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Direction */}
                    <div>
                        <label htmlFor="direction" className="block text-sm font-medium text-foreground mb-1">
                            Direction <span className="text-destructive">*</span>
                        </label>
                        <select
                            id="direction"
                            required
                            value={formData.direction}
                            onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        >
                            {DIRECTIONS.map((direction) => (
                                <option key={direction} value={direction}>
                                    {direction}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Outcome */}
                    <div>
                        <label htmlFor="outcome" className="block text-sm font-medium text-foreground mb-1">
                            Outcome <span className="text-destructive">*</span>
                        </label>
                        <select
                            id="outcome"
                            required
                            value={formData.outcome}
                            onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        >
                            {OUTCOMES.map((outcome) => (
                                <option key={outcome} value={outcome}>
                                    {outcome}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Message Summary */}
                    <div>
                        <label htmlFor="message_summary" className="block text-sm font-medium text-foreground mb-1">
                            Message Summary
                        </label>
                        <textarea
                            id="message_summary"
                            rows={4}
                            value={formData.message_summary}
                            onChange={(e) => setFormData({ ...formData, message_summary: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                            placeholder="Brief summary of the message or conversation..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={createOutreach.isPending}
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 font-medium shadow-md hover:shadow-lg"
                        >
                            {createOutreach.isPending ? 'Logging...' : 'Log Outreach'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 active:scale-95 transition-all font-medium"
                        >
                            Cancel
                        </button>
                    </div>

                    {createOutreach.isError && (
                        <p className="text-destructive text-sm text-center">
                            Failed to log outreach. Please try again.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
