'use client';

import {
    Conversation,
    ConversationDetail,
    ConversationMessage,
    MessageAttachment,
    type SendReplyPayload,
} from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

interface MailDisplayProps {
    conversation: Conversation | null;
    detail: ConversationDetail | null;
    onReply: (payload: SendReplyPayload) => Promise<void> | void;
    onForward: (payload: SendReplyPayload) => Promise<void> | void;
    onDownloadAttachment: (attachmentId: string) => Promise<Blob>;
}

export function MailDisplay({ conversation, detail, onReply, onForward, onDownloadAttachment }: MailDisplayProps) {
    const [body, setBody] = useState('');
    const [mode, setMode] = useState<'reply' | 'forward'>('reply');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [detail]);

    useEffect(() => {
        setBody('');
    }, [conversation?.id]);

    const handleSend = async () => {
        if (!conversation || !body.trim()) return;
        setSending(true);
        try {
            const payload: SendReplyPayload = { body_text: body };
            if (mode === 'reply') {
                await onReply(payload);
            } else {
                await onForward(payload);
            }
            setBody('');
        } finally {
            setSending(false);
        }
    };

    const handleDownload = async (attachment: MessageAttachment) => {
        if (!conversation) return;
        const blob = await onDownloadAttachment(attachment.id);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.file_name;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!conversation || !detail) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/50 h-full">
                Select a conversation to view
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
            <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground mb-2">{conversation.subject}</h2>
                <div className="text-sm text-muted-foreground">
                    Participants:{' '}
                    <span className="text-foreground">
                        {conversation.participants.map((p) => p.name || p.email).join(', ')}
                    </span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/20">
                {detail.messages.map((entry) => (
                    <MessageBubble
                        key={entry.message.id}
                        message={entry}
                        onDownload={handleDownload}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-4 mb-2 text-sm text-muted-foreground">
                    <button
                        className={`px-3 py-1 rounded-md border ${mode === 'reply' ? 'border-primary text-primary' : 'border-input'
                            }`}
                        onClick={() => setMode('reply')}
                    >
                        Reply
                    </button>
                    <button
                        className={`px-3 py-1 rounded-md border ${mode === 'forward' ? 'border-primary text-primary' : 'border-input'
                            }`}
                        onClick={() => setMode('forward')}
                    >
                        Forward
                    </button>
                </div>
                <textarea
                    rows={4}
                    className="block w-full rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border resize-none"
                    placeholder={`Type your ${mode}...`}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={sending}
                />
                <div className="flex justify-end mt-2">
                    <button
                        onClick={handleSend}
                        disabled={sending || !body.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                    >
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function MessageBubble({
    message,
    onDownload,
}: {
    message: ConversationMessage;
    onDownload: (attachment: MessageAttachment) => void;
}) {
    const msg = message.message;
    const alignClass = msg.is_from_me ? 'items-end' : 'items-start';
    const bubbleClass = msg.is_from_me
        ? 'bg-primary text-primary-foreground'
        : 'bg-card text-foreground border border-border';

    return (
        <div className={`flex flex-col ${alignClass}`}>
            <div className={`max-w-[80%] rounded-lg p-4 shadow-sm ${bubbleClass}`}>
                <div className="flex justify-between items-baseline mb-2 text-xs opacity-80">
                    <span className="font-semibold mr-2">{msg.sender_name || msg.sender_email}</span>
                    <span>{format(new Date(msg.sent_at), 'MMM d, p')}</span>
                </div>
                <div className="text-xs mb-2 opacity-70">
                    {msg.direction === 'sent'
                        ? `To: ${msg.to_emails.map((r) => r.email).join(', ')}`
                        : `From: ${msg.sender_email}`}
                </div>
                <div className="prose prose-sm max-w-none text-sm prose-foreground">
                    {msg.body_html ? (
                        <div dangerouslySetInnerHTML={{ __html: msg.body_html }} />
                    ) : (
                        <p className="whitespace-pre-wrap">{msg.body_text || 'No content'}</p>
                    )}
                </div>
                {message.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {message.attachments.map((attachment) => (
                            <button
                                type="button"
                                key={attachment.id}
                                onClick={() => onDownload(attachment)}
                                className="w-full text-left text-xs px-3 py-2 bg-muted rounded-md hover:bg-muted/80 flex items-center justify-between"
                            >
                                <span>{attachment.file_name}</span>
                                <span>{Math.round(attachment.size_bytes / 1024)} KB</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
