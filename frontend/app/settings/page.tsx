'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { ActivitySettingsPanel } from '@/components/settings/ActivitySettings';
import { MailSettingsPanel } from '@/components/settings/MailSettingsPanel';

type SettingsTab = {
    key: string;
    label: string;
    description: string;
    render: () => JSX.Element;
};

const tabs: SettingsTab[] = [
    {
        key: 'activity',
        label: 'Activity',
        description: 'Weekly metric goals, tracking, and snapshot controls.',
        render: () => <ActivitySettingsPanel />,
    },
    {
        key: 'mail',
        label: 'Mail',
        description: 'Configure IMAP/SMTP credentials for the connected inbox.',
        render: () => <MailSettingsPanel />,
    },
];

export default function SettingsPage(): JSX.Element {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const activeTab = useMemo(() => {
        const param = searchParams.get('tab');
        return tabs.some((tab) => tab.key === param) ? param ?? 'activity' : 'activity';
    }, [searchParams]);

    const handleSelect = (key: string): void => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', key);
        router.push(`${pathname}?${params.toString()}`);
    };

    const currentTab = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                    <p className="text-muted-foreground">
                        Manage admin configuration for weekly goals, email integrations, and more.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <aside className="lg:w-64 flex-shrink-0">
                        <nav className="space-y-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleSelect(tab.key)}
                                    className={clsx(
                                        'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                                        tab.key === currentTab.key
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border hover:bg-muted/60 text-foreground',
                                    )}
                                >
                                    <p className="font-medium">{tab.label}</p>
                                    <p className="text-xs text-muted-foreground">{tab.description}</p>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <section className="flex-1 space-y-6">{currentTab.render()}</section>
                </div>
            </div>
        </div>
    );
}
