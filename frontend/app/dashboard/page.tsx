'use client';

import Link from 'next/link';
import { match } from 'oxide.ts';
import { useMemo } from 'react';
import { useStartups, useWeeklyActivitySummary } from '@/lib/hooks';
import { fromNullable } from '@/lib/result-utils';

export default function DashboardPage() {
    const { data: startups, isLoading, error } = useStartups();
    const {
        data: activitySummary,
        isLoading: summaryLoading,
        error: activityError,
    } = useWeeklyActivitySummary();

    // Calculate stats
    const stats = useMemo(() => {
        if (!startups) return { total: 0, byStatus: {} };

        const byStatus = startups.reduce((acc, startup) => {
            acc[startup.status] = (acc[startup.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { total: startups.length, byStatus };
    }, [startups]);

    const isDashboardLoading = isLoading || summaryLoading;

    if (isDashboardLoading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-destructive">Failed to load dashboard</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 animate-in fade-in slide-in-from-top-4">
                    <h1 className="title-bold text-4xl bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2">
                        Dashboard
                    </h1>
                    <p className="body-light text-muted-foreground">
                        Overview of your customer validation pipeline
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Link href="/startups" className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <p className="caption-mono text-muted-foreground mb-1">Total Startups</p>
                        <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                    </Link>
                    <Link href="/pipeline" className="bg-card border border-chart-1/20 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <p className="caption-mono text-muted-foreground mb-1">In Discussion</p>
                        <p className="text-3xl font-bold text-chart-1">{stats.byStatus['In Discussion'] || 0}</p>
                    </Link>
                    <Link href="/pipeline" className="bg-card border border-chart-2/20 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <p className="caption-mono text-muted-foreground mb-1">Closed Won</p>
                        <p className="text-3xl font-bold text-chart-2">{stats.byStatus['Closed Won'] || 0}</p>
                    </Link>
                    <Link href="/pipeline" className="bg-card border border-primary/20 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <p className="caption-mono text-muted-foreground mb-1">Leads</p>
                        <p className="text-3xl font-bold text-primary">{stats.byStatus['Lead'] || 0}</p>
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm mb-8">
                    <h2 className="heading-medium mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            href="/pipeline"
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <h3 className="font-medium text-foreground mb-1">View Pipeline</h3>
                            <p className="body-light text-sm text-muted-foreground">See your Kanban board</p>
                        </Link>
                        <Link
                            href="/startups"
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <h3 className="font-medium text-foreground mb-1">Browse Startups</h3>
                            <p className="body-light text-sm text-muted-foreground">View all startups in a table</p>
                        </Link>
                        <Link
                            href="/synthesis"
                            className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <h3 className="font-medium text-foreground mb-1">Weekly Synthesis</h3>
                            <p className="body-light text-sm text-muted-foreground">Review insights and trends</p>
                        </Link>
                    </div>
                </div>

                {activityError && (
                    <div className="mb-6 border border-destructive/30 bg-destructive/5 text-destructive text-sm px-4 py-3 rounded-lg">
                        Activity summary is unavailable right now.
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="heading-medium">Weekly Metrics</h2>
                                <p className="text-sm text-muted-foreground">
                                    Track goal vs. actual performance
                                </p>
                            </div>
                            <Link href="/activity" className="text-sm text-primary hover:underline">
                                View feed
                            </Link>
                        </div>
                        {match(fromNullable(activitySummary?.current_plan), {
                            Some: (plan) => (
                                <>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        Week of {new Date(plan.week_start).toLocaleDateString()} –{' '}
                                        {new Date(plan.week_end).toLocaleDateString()} ({plan.status})
                                    </p>
                                    <div className="space-y-4">
                                        {plan.metrics.map((metric) => {
                                            const onTrack = metric.actual_value >= metric.target_value;
                                            return (
                                                <div
                                                    key={metric.id ?? `${metric.name}-${metric.metric_type}`}
                                                    className="flex items-start justify-between border border-border/60 rounded-lg p-3"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-foreground">{metric.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {metric.metric_type === 'input'
                                                                ? metric.unit_label
                                                                : `Stage: ${metric.stage_name ?? 'N/A'}`}
                                                        </p>
                                                        {metric.owner_name && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Owner: {metric.owner_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-foreground">
                                                            {metric.actual_value}
                                                        </p>
                                                        <p
                                                            className={`text-xs ${
                                                                onTrack ? 'text-emerald-500' : 'text-muted-foreground'
                                                            }`}
                                                        >
                                                            Target {metric.target_value} {metric.unit_label}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ),
                            None: () => (
                                <div className="text-sm text-muted-foreground">
                                    No weekly plan configured yet. Admins can set goals under Activity Settings.
                                </div>
                            ),
                        })}
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="heading-medium">Recent Activity</h2>
                                <p className="text-sm text-muted-foreground">
                                    Latest actions across the pipeline
                                </p>
                            </div>
                            <Link href="/activity" className="text-sm text-primary hover:underline">
                                View all
                            </Link>
                        </div>
                        {activitySummary?.activity_preview?.length ? (
                            <div className="space-y-4">
                                {activitySummary.activity_preview.slice(0, 6).map((event) => (
                                    <div
                                        key={event.id}
                                        className="border border-border/60 rounded-lg p-3"
                                    >
                                        <p className="font-medium text-foreground mb-1">{event.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(event.occurred_at).toLocaleString()}
                                            {event.startup_name ? ` • ${event.startup_name}` : ''}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {event.user_name || 'System'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No activity logged yet. Start by adding contacts or outreach records.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
