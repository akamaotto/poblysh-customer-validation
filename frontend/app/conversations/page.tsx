'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    emailApi,
    type ConversationSummary,
    type ConversationDetail,
    type SendReplyPayload,
    type EmailStatusResponse,
    type ConversationListParams,
} from '@/lib/api';
import { ImapConfigForm } from '@/components/mail/imap-config-form';
import { MailList } from '@/components/mail/mail-list';
import { MailDisplay } from '@/components/mail/mail-display';
import {
    ArrowPathIcon,
    Cog6ToothIcon,
    InboxIcon,
    ArchiveBoxIcon,
    PaperClipIcon,
    UserGroupIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { getConnectionStatus, getSyncStatusText, isCurrentlySyncing } from '@/lib/time-utils';
import { useStartups } from '@/lib/hooks';
import { PIPELINE_STATUSES, type PipelineStatus } from '@/lib/pipeline-statuses';

type PipelineFilter = 'all' | PipelineStatus;
type SidebarKey = 'inbox' | 'unread' | 'archived' | 'attachments';

interface ConversationFilterState {
    search: string;
    unreadOnly: boolean;
    showAll: boolean;
    archived: boolean;
    hasAttachments: boolean;
}

export default function ConversationsPage() {
    const { user } = useAuth();
    const { data: startups } = useStartups();
    const [loading, setLoading] = useState(true);
    const [isConfigured, setIsConfigured] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [initialSyncing, setInitialSyncing] = useState(false);

    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedDetail, setSelectedDetail] = useState<ConversationDetail | null>(null);

    const [syncing, setSyncing] = useState(false);
    const [status, setStatus] = useState<EmailStatusResponse | null>(null);
    const [listFilters, setListFilters] = useState<ConversationFilterState>({
        search: '',
        unreadOnly: false,
        showAll: false,
        archived: false,
        hasAttachments: false,
    });
    const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>('all');

    // Move all hooks to the top before any conditional logic
    const listParams: ConversationListParams = useMemo(
        () => ({
            search: listFilters.search || undefined,
            unread_only: listFilters.unreadOnly || undefined,
            show_all: listFilters.showAll || undefined,
            archived: listFilters.archived || undefined,
            has_attachments: listFilters.hasAttachments || undefined,
        }),
        [listFilters],
    );

    useEffect(() => {
        void checkConfig();
    }, [listFilters.showAll]);

    useEffect(() => {
        if (isConfigured) {
            void loadConversations();
            void loadStatus();
        }
    }, [isConfigured, listParams]);

    const checkConfig = async () => {
        try {
            const config = await emailApi.getConfig();
            setIsConfigured(config.is_configured);
            if (config.is_configured) {
                await loadConversations();
            }
        } catch (error) {
            console.error('Failed to check config:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStatus = async () => {
        try {
            const current = await emailApi.getStatus();
            setStatus(current);
            window.dispatchEvent(new Event('email-status-refetch'));
        } catch (error) {
            console.error('Failed to load status:', error);
            setStatus(null);
        }
    };

    const startupStatusMap = useMemo<Record<string, string>>(() => {
        if (!startups) {
            return {};
        }
        return startups.reduce<Record<string, string>>((acc, startup) => {
            acc[startup.id] = startup.status;
            return acc;
        }, {});
    }, [startups]);

    const pipelineCounts = useMemo<Record<string, number>>(() => {
        return conversations.reduce<Record<string, number>>((acc, entry) => {
            const startupId = entry.conversation.startup_id;
            if (!startupId) {
                return acc;
            }
            const statusName = startupStatusMap[startupId];
            if (!statusName) {
                return acc;
            }
            acc[statusName] = (acc[statusName] ?? 0) + 1;
            return acc;
        }, {});
    }, [conversations, startupStatusMap]);

    const pipelineFilterOptions = useMemo<PipelineFilter[]>(() => ['all', ...PIPELINE_STATUSES], []);

    const filteredConversations = useMemo(() => {
        if (pipelineFilter === 'all') {
            return conversations;
        }
        return conversations.filter((entry) => {
            const startupId = entry.conversation.startup_id;
            if (!startupId) {
                return false;
            }
            return startupStatusMap[startupId] === pipelineFilter;
        });
    }, [conversations, pipelineFilter, startupStatusMap]);

    const unreadCount = useMemo(() => {
        return conversations.filter((entry) => entry.conversation.unread_count > 0).length;
    }, [conversations]);

    const sidebarCounts = useMemo(
        () => ({
            inbox: conversations.filter((entry) => !entry.conversation.is_archived).length,
            unread: unreadCount,
            archived: conversations.filter((entry) => entry.conversation.is_archived).length,
            attachments: conversations.filter((entry) => entry.conversation.has_attachments).length,
        }),
        [conversations, unreadCount],
    );

    const handleSidebarSelect = (target: SidebarKey) => {
        setListFilters((prev) => {
            if (target === 'inbox') {
                return { ...prev, unreadOnly: false, archived: false, hasAttachments: false };
            }
            if (target === 'unread') {
                return { ...prev, unreadOnly: true, archived: false, hasAttachments: false };
            }
            if (target === 'archived') {
                return { ...prev, archived: true, unreadOnly: false, hasAttachments: false };
            }
            return { ...prev, hasAttachments: true, unreadOnly: false, archived: false };
        });
    };

    const handlePipelineFilterChange = (value: PipelineFilter) => {
        setPipelineFilter((current) => (current === value ? 'all' : value));
    };

    const pipelineLabel = (value: PipelineFilter) => (value === 'all' ? 'All statuses' : value);
    const pipelineCount = (value: PipelineFilter) =>
        value === 'all' ? conversations.length : pipelineCounts[value] ?? 0;

    const sidebarItems = useMemo(
        () => [
            {
                key: 'inbox' as SidebarKey,
                label: 'Inbox',
                icon: InboxIcon,
                count: sidebarCounts.inbox,
                active: !listFilters.archived && !listFilters.hasAttachments && !listFilters.unreadOnly,
            },
            {
                key: 'unread' as SidebarKey,
                label: 'Unread',
                icon: InboxIcon,
                count: sidebarCounts.unread,
                active: listFilters.unreadOnly,
            },
            {
                key: 'archived' as SidebarKey,
                label: 'Archived',
                icon: ArchiveBoxIcon,
                count: sidebarCounts.archived,
                active: listFilters.archived,
            },
            {
                key: 'attachments' as SidebarKey,
                label: 'Attachments',
                icon: PaperClipIcon,
                count: sidebarCounts.attachments,
                active: listFilters.hasAttachments,
            },
        ],
        [sidebarCounts, listFilters.archived, listFilters.hasAttachments, listFilters.unreadOnly],
    );

    // Effect for handling initial sync completion
    useEffect(() => {
        if (!initialSyncing) {
            return;
        }
        if (status?.sync_status === 'connected' && conversations.length > 0) {
            setInitialSyncing(false);
        }
    }, [initialSyncing, status, conversations.length]);

    const loadConversations = async () => {
        try {
            const data = await emailApi.getConversations(listParams);
            setConversations(data);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    };

    const loadConversation = async (id: string) => {
        try {
            const detail = await emailApi.getConversation(id);
            setSelectedDetail(detail);
            setConversations((prev) =>
                prev.map((entry) =>
                    entry.conversation.id === id ? { ...entry, conversation: detail.conversation } : entry,
                ),
            );
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await emailApi.sync();
            await loadStatus();
            await loadConversations();
            if (selectedId) {
                await loadConversation(selectedId);
            }
        } catch (error) {
            console.error('Failed to sync:', error);
            alert('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    const handleSelectConversation = (id: string) => {
        setSelectedId(id);
        void loadConversation(id);
    };

    const handleSendReply = async (payload: SendReplyPayload) => {
        if (!selectedId) {
            return;
        }

        await emailApi.reply(selectedId, payload);
        await loadConversation(selectedId);
    };

    // Early returns after all hooks
    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    const needsCredentials = !isConfigured || status?.sync_status === 'error';

    const renderConfigForm = (allowCancel: boolean) => (
        <ImapConfigForm
            initialEmail={user?.email ?? null}
            statusMessage={status?.last_sync_error ?? null}
            onConfigured={async () => {
                setInitialSyncing(true);
                setShowConfig(false);
                await checkConfig();
                await loadStatus();
                await loadConversations();
            }}
            onCancel={allowCancel ? () => setShowConfig(false) : undefined}
        />
    );

    if (needsCredentials && !initialSyncing && !showConfig) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
                {renderConfigForm(false)}
            </div>
        );
    }

    const selectedConversation = conversations.find((c) => c.conversation.id === selectedId) || null;
    const canShowAll = user?.role === 'admin';

    return (
        <div className="relative flex flex-col h-screen bg-background text-foreground">
            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-3 border-b border-border bg-card">
                <div>
                    <h1 className="text-xl font-semibold">Conversations</h1>
                </div>
                <div className="flex items-center space-x-6">
                    {/* Connection Status */}
                    {status && (
                        <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                                getConnectionStatus(status.sync_status) === 'connected'
                                    ? 'bg-green-500'
                                    : 'bg-red-500'
                            }`} />
                            <span className="text-sm text-muted-foreground">
                                {getConnectionStatus(status.sync_status) === 'connected' ? 'Connected' : 'Not connected'}
                            </span>
                        </div>
                    )}

                    {/* Sync Status */}
                    {status && (
                        <div className="flex items-center space-x-2">
                            {isCurrentlySyncing(status.sync_status, initialSyncing) && (
                                <div className="h-4 w-4 rounded-full border-2 border-muted border-t-primary animate-spin" />
                            )}
                            <span className="text-sm text-muted-foreground">
                                {getSyncStatusText(status.sync_status, status.last_synced_at, initialSyncing, conversations.length)}
                            </span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleSync}
                            disabled={syncing || isCurrentlySyncing(status.sync_status, initialSyncing)}
                            className={`p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ${
                                syncing || isCurrentlySyncing(status.sync_status, initialSyncing) ? 'animate-spin' : ''
                            }`}
                            title="Sync Emails"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setShowConfig(true)}
                            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Settings"
                        >
                            <Cog6ToothIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {status?.sync_status === 'error' && status.last_sync_error && (
                <div className="mx-6 mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
                    Poblysh is having trouble syncing your inbox: {status.last_sync_error}. Reconnect your account to
                    continue.
                </div>
            )}

            {showConfig && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="max-w-lg w-full">
                        {renderConfigForm(true)}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="relative flex flex-1 overflow-hidden">
                <aside className="w-64 border-r border-border bg-card flex flex-col">
                    <div className="px-5 py-4 border-b border-border">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Mailbox</p>
                        <p className="mt-1 font-semibold text-foreground">{user?.name ?? user?.email ?? 'Inbox'}</p>
                        {user?.name && user?.email && (
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        )}
                    </div>
                    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => handleSidebarSelect(item.key)}
                                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                                        item.active
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-transparent text-muted-foreground hover:bg-muted/70'
                                    }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{item.count}</span>
                                </button>
                            );
                        })}
                    </nav>
                    <div className="mx-3 border-t border-border/60" />
                    <div className="px-4 py-4 space-y-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Pipeline status</p>
                        <div className="space-y-2">
                            {pipelineFilterOptions.map((option) => {
                                const active = pipelineFilter === option;
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => handlePipelineFilterChange(option)}
                                        className={`w-full rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors ${
                                            active
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <span>{pipelineLabel(option)}</span>
                                        <span className="float-right text-[11px] opacity-70">{pipelineCount(option)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {canShowAll && (
                        <div className="border-t border-border p-4 space-y-2 text-sm text-foreground">
                            <label className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <UserGroupIcon className="h-4 w-4" />
                                    Team inbox
                                </span>
                                <input
                                    type="checkbox"
                                    className="rounded border-input"
                                    checked={listFilters.showAll}
                                    onChange={(e) => setListFilters((prev) => ({ ...prev, showAll: e.target.checked }))}
                                />
                            </label>
                            <p className="text-xs text-muted-foreground">View your teammates&apos; conversations.</p>
                        </div>
                    )}
                </aside>
                <MailList
                    conversations={filteredConversations}
                    selectedId={selectedId}
                    onSelect={handleSelectConversation}
                    showOwner={listFilters.showAll}
                    startupStatusMap={startupStatusMap}
                    filters={
                        <label className="relative block">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search mail"
                                value={listFilters.search}
                                onChange={(e) => setListFilters((prev) => ({ ...prev, search: e.target.value }))}
                                className="w-full rounded-md border border-input bg-background py-1.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </label>
                    }
                />
                <MailDisplay
                    detail={selectedDetail}
                    conversation={selectedConversation?.conversation ?? null}
                    onReply={handleSendReply}
                    onForward={async (payload) => {
                        if (!selectedId) return;
                        await emailApi.forward(selectedId, payload);
                        await loadConversation(selectedId);
                    }}
                    onDownloadAttachment={(attachmentId) =>
                        selectedId ? emailApi.downloadAttachment(selectedId, attachmentId) : Promise.reject()
                    }
                />
            </div>
        </div>
    );
}
