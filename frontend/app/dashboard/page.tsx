'use client';

import { useMemo } from 'react';
import { useStartups } from '@/lib/hooks';
import Link from 'next/link';

export default function DashboardPage() {
    const { data: startups, isLoading, error } = useStartups();

    // Calculate stats
    const stats = useMemo(() => {
        if (!startups) return { total: 0, byStatus: {} };

        const byStatus = startups.reduce((acc, startup) => {
            acc[startup.status] = (acc[startup.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { total: startups.length, byStatus };
    }, [startups]);

    if (isLoading) {
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
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
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
            </div>
        </div>
    );
}
