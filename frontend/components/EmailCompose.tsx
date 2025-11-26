'use client';

import { useEffect, useRef, useState } from 'react';
import type { Contact } from '@/lib/api';
import { useSendContactEmail } from '@/lib/hooks';
import { EMAIL_TEMPLATE_OPTIONS, getTemplateContent, type EmailTemplateKey } from '@/lib/emailTemplates';
import { Loader2 } from 'lucide-react';

interface EmailComposeProps {
    startupId: string;
    startupName: string;
    contact: Contact;
    onClose: () => void;
    onSent: () => void;
}

const TOOLBAR_ACTIONS = [
    { label: 'B', command: 'bold', title: 'Bold' },
    { label: 'I', command: 'italic', title: 'Italic' },
    { label: 'U', command: 'underline', title: 'Underline' },
    { label: '•', command: 'insertUnorderedList', title: 'Bullets' },
];

export function EmailCompose({ startupId, startupName, contact, onClose, onSent }: EmailComposeProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const sendEmail = useSendContactEmail();
    const [template, setTemplate] = useState<EmailTemplateKey>('intro');
    const [subject, setSubject] = useState('');
    const [bodyHtml, setBodyHtml] = useState('');
    const [bodyText, setBodyText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!contact.email) {
            setTemplate('custom');
        }
    }, [contact.email]);

    useEffect(() => {
        const defaults = getTemplateContent(template, contact.name, startupName);
        if (template === 'custom') {
            setSubject('');
            setBodyHtml('');
            setBodyText('');
            return;
        }

        setSubject(defaults.subject);
        setBodyHtml(defaults.html);
        setBodyText(defaults.text);
    }, [template, contact.name, startupName]);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== bodyHtml) {
            editorRef.current.innerHTML = bodyHtml;
        }
    }, [bodyHtml]);

    const handleEditorInput = () => {
        if (!editorRef.current) return;
        setBodyHtml(editorRef.current.innerHTML);
        setBodyText(editorRef.current.innerText);
    };

    const handleFormat = (command: string) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        document.execCommand(command, false);
        handleEditorInput();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!contact.email) {
            setError('This contact does not have an email address.');
            return;
        }

        if (!subject.trim() || !bodyHtml.trim()) {
            setError('Subject and body are required.');
            return;
        }

        try {
            await sendEmail.mutateAsync({
                startupId,
                contactId: contact.id,
                data: {
                    subject,
                    body_html: bodyHtml,
                    body_text: bodyText,
                    template,
                },
            });

            setSuccessMessage('Email sent successfully.');
            onSent();
        } catch (err) {
            console.error(err);
            setError('Failed to send email. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-foreground">Send Email</h2>
                    <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Close
                    </button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    To: <span className="text-foreground font-medium">{contact.name}</span>
                    {contact.email && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                            {contact.email}
                        </span>
                    )}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="template" className="block text-sm font-medium text-foreground mb-1">
                            Template
                        </label>
                        <select
                            id="template"
                            value={template}
                            onChange={(e) => setTemplate(e.target.value as EmailTemplateKey)}
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        >
                            {Object.entries(EMAIL_TEMPLATE_OPTIONS).map(([key, option]) => (
                                <option key={key} value={key}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1">
                            {EMAIL_TEMPLATE_OPTIONS[template].description}
                        </p>
                    </div>

                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1">
                            Subject <span className="text-destructive">*</span>
                        </label>
                        <input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Subject line"
                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-foreground">Message <span className="text-destructive">*</span></label>
                            <div className="flex gap-2">
                                {TOOLBAR_ACTIONS.map((action) => (
                                    <button
                                        key={action.command}
                                        type="button"
                                        title={action.title}
                                        onClick={() => handleFormat(action.command)}
                                        className="w-8 h-8 border border-input text-sm rounded-md hover:bg-muted transition-colors"
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="border border-input rounded-md">
                            <div
                                ref={editorRef}
                                contentEditable
                                className="min-h-[200px] max-h-[360px] overflow-y-auto p-3 bg-background text-foreground text-sm focus:outline-none prose prose-sm prose-invert"
                                onInput={handleEditorInput}
                                data-placeholder="Write your message..."
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Basic formatting supported (bold, italic, underline, bullets).</p>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {successMessage && <p className="text-sm text-emerald-500">{successMessage}</p>}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={sendEmail.isPending}
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                        >
                            {sendEmail.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            {sendEmail.isPending ? 'Sending...' : 'Send Email'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 active:scale-95 transition-all font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
