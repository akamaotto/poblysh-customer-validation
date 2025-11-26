'use client';

import { useEffect, useState } from 'react';
import { emailAdminApi, type AdminEmailConfig, type AdminEmailConfigInput } from '@/lib/api';

const STACKMAIL_DEFAULT: AdminEmailConfig = {
    id: 'default-stackmail',
    domain: 'stackmail.com',
    imap_host: 'imap.stackmail.com',
    imap_port: 993,
    imap_security: 'ssl',
    smtp_host: 'smtp.stackmail.com',
    smtp_port: 465,
    smtp_security: 'ssl',
    provider: 'stackmail',
    require_app_password: false,
};

const defaultConfig: AdminEmailConfigInput = {
    domain: '',
    imap_host: STACKMAIL_DEFAULT.imap_host,
    imap_port: STACKMAIL_DEFAULT.imap_port,
    imap_security: STACKMAIL_DEFAULT.imap_security,
    smtp_host: STACKMAIL_DEFAULT.smtp_host,
    smtp_port: STACKMAIL_DEFAULT.smtp_port,
    smtp_security: STACKMAIL_DEFAULT.smtp_security,
    provider: STACKMAIL_DEFAULT.provider,
    require_app_password: STACKMAIL_DEFAULT.require_app_password,
};

export function MailSettingsPanel(): JSX.Element {
    const [configs, setConfigs] = useState<AdminEmailConfig[]>([STACKMAIL_DEFAULT]);
    const [form, setForm] = useState<AdminEmailConfigInput>(defaultConfig);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void refresh();
    }, []);

    const refresh = async () => {
        try {
            const data = await emailAdminApi.listConfigs();
            setConfigs(data.length > 0 ? data : [STACKMAIL_DEFAULT]);
        } catch (err) {
            console.error('Failed to load configs', err);
            setConfigs([STACKMAIL_DEFAULT]);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);
        try {
            await emailAdminApi.saveConfig(form);
            setForm(defaultConfig);
            await refresh();
        } catch (error) {
            console.error('Failed to save config', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Provider Defaults</h2>
                <p className="text-sm text-muted-foreground">
                    Define IMAP/SMTP settings per domain so teammates only need to provide their password.
                </p>
            </div>

            <div className="border rounded-md">
                <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                        <tr>
                            <th className="px-4 py-2 text-left">Domain</th>
                            <th className="px-4 py-2 text-left">IMAP</th>
                            <th className="px-4 py-2 text-left">SMTP</th>
                            <th className="px-4 py-2 text-left">Provider</th>
                        </tr>
                    </thead>
                    <tbody>
                        {configs.map((config) => (
                            <tr key={config.id} className="border-t">
                                <td className="px-4 py-2 font-medium">{config.domain}</td>
                                <td className="px-4 py-2">
                                    {config.imap_host}:{config.imap_port} ({config.imap_security})
                                </td>
                                <td className="px-4 py-2">
                                    {config.smtp_host}:{config.smtp_port} ({config.smtp_security})
                                </td>
                                <td className="px-4 py-2">
                                    {config.provider}
                                    {config.require_app_password && (
                                        <span className="ml-2 text-xs text-amber-600">App password</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {configs.length === 0 && (
                            <tr>
                                <td className="px-4 py-3 text-muted-foreground" colSpan={4}>
                                    No provider settings yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 border rounded-md p-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Domain</label>
                        <input
                            type="text"
                            required
                            className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                            placeholder="example.com"
                            value={form.domain}
                            onChange={(e) => setForm({ ...form, domain: e.target.value.toLowerCase() })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Provider</label>
                        <input
                            type="text"
                            className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                            value={form.provider}
                            onChange={(e) => setForm({ ...form, provider: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">IMAP Host</label>
                        <input
                            type="text"
                            required
                            className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                            value={form.imap_host}
                            onChange={(e) => setForm({ ...form, imap_host: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">IMAP Port</label>
                        <input
                            type="number"
                            required
                            className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                            value={form.imap_port}
                            onChange={(e) => setForm({ ...form, imap_port: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">SMTP Host</label>
                        <input
                            type="text"
                            required
                            className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                            value={form.smtp_host}
                            onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">SMTP Port</label>
                        <input
                            type="number"
                            required
                            className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm"
                            value={form.smtp_port}
                            onChange={(e) => setForm({ ...form, smtp_port: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={form.require_app_password}
                        onChange={(e) => setForm({ ...form, require_app_password: e.target.checked })}
                    />
                    Require app password
                </label>

                <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-60"
                >
                    {saving ? 'Saving...' : 'Save domain defaults'}
                </button>
            </form>
        </div>
    );
}
