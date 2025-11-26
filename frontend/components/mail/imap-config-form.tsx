'use client';

import { useState, useEffect } from 'react';
import { emailApi, type EmailConfigDto, type AdminEmailConfig } from '@/lib/api';

interface Props {
    onConfigured: () => void;
    onCancel?: () => void;
    initialEmail?: string | null;
    statusMessage?: string | null;
}

const STACKMAIL_DEFAULTS: Pick<AdminEmailConfig, 'imap_host' | 'imap_port' | 'smtp_host' | 'smtp_port' | 'provider'> = {
    imap_host: 'imap.stackmail.com',
    imap_port: 993,
    smtp_host: 'smtp.stackmail.com',
    smtp_port: 465,
    provider: 'stackmail',
};

export function ImapConfigForm({ onConfigured, onCancel, initialEmail, statusMessage }: Props) {
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState<AdminEmailConfig | null>(null);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const [formData, setFormData] = useState<EmailConfigDto>({
        email: initialEmail || '',
        password: '',
        imap_host: STACKMAIL_DEFAULTS.imap_host,
        imap_port: STACKMAIL_DEFAULTS.imap_port,
        smtp_host: STACKMAIL_DEFAULTS.smtp_host,
        smtp_port: STACKMAIL_DEFAULTS.smtp_port,
    });

    useEffect(() => {
        void emailApi.getConfig().then((config) => {
            setFormData((prev) => ({
                ...prev,
                email: config.email || prev.email || initialEmail || '',
                imap_host: config.imap_host || prev.imap_host,
                imap_port: config.imap_port || prev.imap_port,
                smtp_host: config.smtp_host || prev.smtp_host,
                smtp_port: config.smtp_port || prev.smtp_port,
            }));
            setProvider(config.provider_defaults ?? null);
            setLastSyncedAt(config.last_synced_at ?? null);
        });
    }, [initialEmail]);

    const applyProviderDefaults = () => {
        if (!provider) {
            return STACKMAIL_DEFAULTS;
        }
        return {
            imap_host: provider.imap_host,
            imap_port: provider.imap_port,
            smtp_host: provider.smtp_host,
            smtp_port: provider.smtp_port,
            provider: provider.provider,
        };
    };

    const providerDefaults = applyProviderDefaults();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await emailApi.saveConfig({
                ...formData,
                imap_host: providerDefaults.imap_host,
                imap_port: providerDefaults.imap_port,
                smtp_host: providerDefaults.smtp_host,
                smtp_port: providerDefaults.smtp_port,
            });
            onConfigured();
        } catch (err) {
            setError('We could not save your credentials. Double-check your password and try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setError(null);
        try {
            await emailApi.testConfig({
                ...formData,
                imap_host: providerDefaults.imap_host,
                imap_port: providerDefaults.imap_port,
                smtp_host: providerDefaults.smtp_host,
                smtp_port: providerDefaults.smtp_port,
            });
            alert('Connection successful!');
        } catch (err) {
            setError('Connection test failed. Please verify your password or app password.');
            console.error(err);
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-lg p-6 space-y-6">
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Reconnect Your Inbox</h2>
                <p className="text-sm text-muted-foreground">
                    Poblysh uses your work inbox to sync conversations. Enter the password for your work email (or its app password) so you can send and receive email inside the Poblysh Validation App.
                </p>
                {lastSyncedAt && (
                    <p className="text-xs text-muted-foreground">
                        Last successful sync: {new Date(lastSyncedAt).toLocaleString()}
                    </p>
                )}
                {statusMessage && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        {statusMessage}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        readOnly
                        className="w-full rounded-lg bg-muted/40 border border-border px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Password / App Password
                    </label>
                    <input
                        type="password"
                        autoFocus
                        required
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter your email password"
                    />
                </div>

                {error && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex gap-3 flex-1">
                        <button
                            type="button"
                            onClick={handleTest}
                            disabled={testing || !formData.password}
                            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                        >
                            {testing ? 'Testing…' : 'Test connection'}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.password}
                            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-60"
                        >
                            {loading ? 'Connecting…' : 'Connect inbox'}
                        </button>
                    </div>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="text-sm text-muted-foreground hover:text-foreground px-2 py-1"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
