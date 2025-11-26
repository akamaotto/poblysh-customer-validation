'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { match } from 'oxide.ts';
import type { ActivityFeedParams } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ACTIVITY_EVENT_TYPES, PIPELINE_STATUSES } from '@/lib/activity-constants';
import { useActivityFeed, useContacts, useStartups, useUsersList } from '@/lib/hooks';
import { fromNullable } from '@/lib/result-utils';

const PAGE_SIZE = 20;

export default function ActivityPage(): JSX.Element {
    const [filters, setFilters] = useState<ActivityFeedParams>({ page_size: PAGE_SIZE });
    const [page, setPage] = useState(1);

    const queryFilters = useMemo(
        () => ({ ...filters, page }),
        [filters, page],
    );

    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const { data, isLoading, error } = useActivityFeed(queryFilters);
    const { data: startups } = useStartups();
    const { data: contacts } = useContacts();
    const { data: users } = useUsersList({ enabled: isAdmin });

    const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

    const formatActivityType = (value: string): string =>
        value
            .split('_')
            .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
            .join(' ');

    const handleFilterChange = (field: keyof ActivityFeedParams, value?: string): void => {
        setPage(1);
        setFilters((prev) => {
            const next = { ...prev };
            if (value === undefined || value.length === 0) {
                delete next[field];
            } else {
                next[field] = value;
            }
            next.page_size = PAGE_SIZE;
            return next;
        });
    };

    const clearFilters = (): void => {
        setFilters({ page_size: PAGE_SIZE });
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="mb-2">
                    <h1 className="text-3xl font-bold text-foreground">Activity Feed</h1>
                    <p className="text-muted-foreground">
                        Search and filter the full history of contacts, outreach, interviews, and stage changes.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">Search</label>
                            <input
                                type="text"
                                value={filters.search ?? ''}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                placeholder="Keyword or snippet"
                                className="w-full rounded-md border border-border bg-background p-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">Start Date</label>
                            <input
                                type="date"
                                value={filters.start_date ?? ''}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                className="w-full rounded-md border border-border bg-background p-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">End Date</label>
                            <input
                                type="date"
                                value={filters.end_date ?? ''}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                className="w-full rounded-md border border-border bg-background p-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">Startup</label>
                            <select
                                className="w-full rounded-md border border-border bg-background p-2 text-sm"
                                value={filters.startup_id ?? ''}
                                onChange={(e) => handleFilterChange('startup_id', e.target.value)}
                            >
                                <option value="">All startups</option>
                                {startups?.map((startup) => (
                                    <option key={startup.id} value={startup.id}>
                                        {startup.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">Contact</label>
                            <select
                                className="w-full rounded-md border border-border bg-background p-2 text-sm"
                                value={filters.contact_id ?? ''}
                                onChange={(e) => handleFilterChange('contact_id', e.target.value)}
                            >
                                <option value="">All contacts</option>
                                {contacts?.map((contact) => (
                                    <option key={contact.id} value={contact.id}>
                                        {contact.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">User</label>
                            {isAdmin ? (
                                <select
                                    className="w-full rounded-md border border-border bg-background p-2 text-sm"
                                    value={filters.user_id ?? ''}
                                    onChange={(e) => handleFilterChange('user_id', e.target.value)}
                                >
                                    <option value="">All users</option>
                                    {users?.map((entry) => (
                                        <option key={entry.id} value={entry.id}>
                                            {entry.name ?? entry.email}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-xs text-muted-foreground mt-2">
                                    User filtering is available for admins.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">Stage</label>
                            <select
                                className="w-full rounded-md border border-border bg-background p-2 text-sm"
                                value={filters.stage ?? ''}
                                onChange={(e) => handleFilterChange('stage', e.target.value)}
                            >
                                <option value="">All stages</option>
                                {PIPELINE_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">
                                Activity Type
                            </label>
                            <select
                                className="w-full rounded-md border border-border bg-background p-2 text-sm"
                                value={filters.activity_type ?? ''}
                                onChange={(e) => handleFilterChange('activity_type', e.target.value)}
                            >
                                <option value="">All activity</option>
                                {ACTIVITY_EVENT_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end justify-end">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="px-4 py-2 border border-border rounded-md text-sm"
                            >
                                Reset filters
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                    {error && (
                        <div className="mb-4 text-sm text-destructive border border-destructive/30 bg-destructive/10 px-3 py-2 rounded">
                            Failed to load activity feed. Please try again.
                        </div>
                    )}
                    {isLoading ? (
                        <p className="text-muted-foreground text-sm">Loading activity...</p>
                    ) : (
                        match(fromNullable(data?.results), {
                            Some: (events) => (
                                <>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                                        <p>
                                            Showing {(page - 1) * PAGE_SIZE + 1}-
                                            {(page - 1) * PAGE_SIZE + events.length} of {data?.total ?? 0} entries
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={page <= 1}
                                                className="px-3 py-1 border border-border rounded disabled:opacity-50"
                                                onClick={() => setPage((value) => Math.max(1, value - 1))}
                                            >
                                                Previous
                                            </button>
                                            <span className="text-xs text-muted-foreground">
                                                Page {page} of {totalPages}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={page >= totalPages}
                                                className="px-3 py-1 border border-border rounded disabled:opacity-50"
                                                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {events.map((event) => (
                                            <div
                                                key={event.id}
                                                className="border border-border/60 rounded-lg p-4"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <p className="font-semibold text-foreground">{event.description}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(event.occurred_at).toLocaleString()}
                                                            {event.user_name ? ` · ${event.user_name}` : ''}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs uppercase tracking-wide text-muted-foreground border border-border px-2 py-0.5 rounded">
                                                        {formatActivityType(event.activity_type)}
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-sm text-muted-foreground space-x-3">
                                                    {event.startup_name && (
                                                        <span>
                                                            Startup:{' '}
                                                            <Link
                                                                href={`/startups/${event.startup_id}`}
                                                                className="text-primary hover:underline"
                                                            >
                                                                {event.startup_name}
                                                            </Link>
                                                        </span>
                                                    )}
                                                    {event.contact_name && (
                                                        <span>Contact: {event.contact_name}</span>
                                                    )}
                                                    {event.stage_to && (
                                                        <span>
                                                            Stage: {event.stage_from ? `${event.stage_from} → ` : ''}
                                                            {event.stage_to}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ),
                            None: () => (
                                <p className="text-muted-foreground text-sm">
                                    No activity matches these filters.
                                </p>
                            ),
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
