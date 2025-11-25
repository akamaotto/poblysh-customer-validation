'use client';

import { useState, useMemo } from 'react';
import { useStartups, useUpdateStartup } from '@/lib/hooks';
import { PlanInterviewModal } from '@/components/PlanInterviewModal';
import Link from 'next/link';
import type { Startup } from '@/lib/api';
import { AddStartupSheet } from '@/components/AddStartupSheet';

const STATUSES = [
    'Lead',
    'Contacted',
    'Intro Secured',
    'Call Booked',
    'Meeting Scheduled',
    'Interview Done',
    'In Discussion',
    'Activation Candidate',
    'Closed Won',
    'Closed Lost',
    'Not a Fit'
];

export default function PipelinePage() {
    const { data: startups, isLoading, error } = useStartups();
    const updateStartup = useUpdateStartup();
    const [draggedStartup, setDraggedStartup] = useState<Startup | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
    const [isAddStartupOpen, setIsAddStartupOpen] = useState(false);
    const [planInterviewOpen, setPlanInterviewOpen] = useState(false);
    const [selectedStartupId, setSelectedStartupId] = useState<string | undefined>();

    // Group startups by status for kanban
    const kanbanColumns = useMemo(() => {
        if (!startups) return {};
        const columns: Record<string, Startup[]> = {};
        STATUSES.forEach(status => {
            columns[status] = startups.filter(s => s.status === status);
        });
        return columns;
    }, [startups]);

    // Drag and drop handlers
    const handleDragStart = (e: React.DragEvent, startup: Startup) => {
        setDraggedStartup(startup);
        e.dataTransfer.effectAllowed = 'move';
        const element = e.currentTarget as HTMLElement;
        setTimeout(() => {
            element.classList.add('opacity-50');
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('opacity-50');
        setDraggedStartup(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(status);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (!draggedStartup || draggedStartup.status === newStatus) {
            setDraggedStartup(null);
            return;
        }

        try {
            await updateStartup.mutateAsync({
                id: draggedStartup.id,
                data: {
                    name: draggedStartup.name,
                    status: newStatus,
                    category: draggedStartup.category || undefined,
                    website: draggedStartup.website || undefined,
                    newsroom_url: draggedStartup.newsroom_url || undefined,
                },
            });
        } catch (error) {
            console.error('Failed to update startup status:', error);
        }

        setDraggedStartup(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-muted-foreground">Loading pipeline...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-destructive">Failed to load pipeline</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2">
                                Pipeline
                            </h1>
                            <p className="text-muted-foreground">
                                Kanban board view of your validation pipeline
                            </p>
                        </div>
                        <button
                            onClick={() => setIsAddStartupOpen(true)}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                        >
                            Add Startup
                        </button>
                    </div>
                </div>

                {/* Kanban View */}
                <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-max">
                        {STATUSES.map((status) => (
                            <div key={status} className="flex-shrink-0 w-80">
                                <div className={`bg-card border rounded-lg shadow-sm transition-all ${dragOverColumn === status ? 'border-primary border-2 bg-primary/5' : 'border-border'
                                    }`}>
                                    {/* Column Header */}
                                    <div className="p-4 border-b border-border bg-muted/30">
                                        <h3 className="font-semibold text-foreground flex items-center justify-between">
                                            <span>{status}</span>
                                            <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                {kanbanColumns[status]?.length || 0}
                                            </span>
                                        </h3>
                                    </div>

                                    {/* Drop Zone */}
                                    <div
                                        className="p-3 space-y-3 min-h-[200px] max-h-[600px] overflow-y-auto"
                                        onDragOver={(e) => handleDragOver(e, status)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, status)}
                                    >
                                        {!kanbanColumns[status] || kanbanColumns[status].length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-8">
                                                {dragOverColumn === status ? 'Drop here' : 'No startups'}
                                            </p>
                                        ) : (
                                            kanbanColumns[status].map((startup, index) => (
                                                <div
                                                    key={startup.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, startup)}
                                                    onDragEnd={handleDragEnd}
                                                    className="bg-background border border-border rounded-lg p-3 hover:shadow-md hover:border-primary/50 transition-all cursor-move animate-in fade-in slide-in-from-bottom-2"
                                                    style={{ animationDelay: `${index * 30}ms` }}
                                                >
                                                    <Link href={`/startups/${startup.id}`} onClick={(e) => e.stopPropagation()}>
                                                        <h4 className="font-medium text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors">
                                                            {startup.name}
                                                        </h4>
                                                    </Link>
                                                    {startup.category && (
                                                        <p className="text-xs text-muted-foreground mb-2">
                                                            {startup.category}
                                                        </p>
                                                    )}
                                                    {startup.last_contact_date && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Last contact: {new Date(startup.last_contact_date).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                    {startup.next_step && (
                                                        <p className="text-xs text-primary mt-2 line-clamp-2">
                                                            Next: {startup.next_step}
                                                        </p>
                                                    )}
                                                    {['Call Booked', 'Meeting Scheduled'].includes(startup.status) && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedStartupId(startup.id);
                                                                setPlanInterviewOpen(true);
                                                            }}
                                                            className="mt-3 w-full rounded-md bg-primary/10 text-primary text-xs py-1.5 font-semibold hover:bg-primary/20 transition-colors"
                                                        >
                                                            Run Interview
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <AddStartupSheet
                isOpen={isAddStartupOpen}
                onClose={() => setIsAddStartupOpen(false)}
            />

            {planInterviewOpen && (
                <PlanInterviewModal
                    isOpen={planInterviewOpen}
                    onClose={() => setPlanInterviewOpen(false)}
                    initialStartupId={selectedStartupId}
                />
            )}
        </div>
    );
}
