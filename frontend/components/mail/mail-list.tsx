'use client';

import { ConversationSummary } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface MailListProps {
    conversations: ConversationSummary[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    showOwner?: boolean;
    filters?: React.ReactNode;
    startupStatusMap?: Record<string, string>;
}

function summarizeParticipants(entry: ConversationSummary): string {
    const names = entry.conversation.participants
        .filter((p) => p.role !== 'from')
        .map((p) => p.name || p.email);
    if (names.length === 0) {
        return entry.conversation.participants.map((p) => p.email).join(', ');
    }
    return names.join(', ');
}

export function MailList({ conversations, selectedId, onSelect, filters, showOwner, startupStatusMap }: MailListProps) {
    return (
        <div className="flex flex-col h-full overflow-y-auto border-r border-border bg-card w-96 shrink-0">
            <div className="p-4 border-b border-border space-y-2">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Inbox</h2>
                    <p className="text-sm text-muted-foreground">{conversations.length} conversations</p>
                </div>
                {filters}
            </div>
            <div className="divide-y divide-border">
                {conversations.map((entry) => {
                    const conv = entry.conversation;
                    const isSelected = selectedId === conv.id;
                    const pipelineStatus = conv.startup_id ? startupStatusMap?.[conv.startup_id] : undefined;
                    return (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`w-full text-left p-4 hover:bg-muted transition-colors ${isSelected ? 'bg-primary/10 hover:bg-primary/10 border-l-4 border-primary' : ''
                                } ${conv.unread_count > 0 ? 'font-semibold' : ''}`}
                        >
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-sm font-medium text-foreground truncate pr-2">
                                    {summarizeParticipants(entry)}
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {formatDistanceToNow(new Date(conv.latest_message_at), { addSuffix: true })}
                                </span>
                            </div>
                            <div className="text-sm text-foreground mb-1 truncate">{conv.subject}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="truncate flex-1">{conv.snippet || 'No snippet available'}</span>
                                {conv.has_attachments && (
                                    <span className="px-2 py-0.5 bg-muted rounded-full text-muted-foreground">Att</span>
                                )}
                                {conv.unread_count > 0 && (
                                    <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                                        {conv.unread_count}
                                    </span>
                                )}
                            </div>
                            {pipelineStatus && (
                                <div className="mt-2 text-[11px]">
                                    <span className="inline-flex items-center rounded-full bg-secondary/20 px-2 py-0.5 text-secondary-foreground">
                                        {pipelineStatus}
                                    </span>
                                </div>
                            )}
                            {showOwner && entry.owner_email && (
                                <div className="text-xs text-muted-foreground mt-1">Owner: {entry.owner_email}</div>
                            )}
                        </button>
                    );
                })}
                {conversations.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        No conversations found.
                    </div>
                )}
            </div>
        </div>
    );
}
