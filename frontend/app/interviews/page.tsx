'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useContacts, useInterviews, useStartups } from '@/lib/hooks';
import { PlanInterviewModal } from '@/components/PlanInterviewModal';

const UPCOMING_STATUSES = ['Call Booked', 'Meeting Scheduled'];

export default function InterviewsPage() {
    const { data: startups, isLoading, error } = useStartups();
    const { data: contacts } = useContacts();
    const { data: interviews } = useInterviews();

    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [selectedStartupId, setSelectedStartupId] = useState<string | undefined>();

    const startupMap = useMemo(() => {
        const map = new Map<string, string>();
        startups?.forEach((startup) => {
            map.set(startup.id, startup.name);
        });
        return map;
    }, [startups]);

    const contactMap = useMemo(() => {
        const map = new Map<string, { name: string; role: string }>();
        contacts?.forEach((contact) => {
            map.set(contact.startup_id, { name: contact.name, role: contact.role });
        });
        return map;
    }, [contacts]);

    const scheduledStartups = useMemo(() => {
        if (!startups) return [];
        return startups.filter((startup) => UPCOMING_STATUSES.includes(startup.status));
    }, [startups]);

    const interviewCards = useMemo(() => {
        if (!interviews) return [];
        return interviews.map((interview) => ({
            ...interview,
            startupName: startupMap.get(interview.startup_id) || 'Unknown Startup',
        }));
    }, [interviews, startupMap]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-muted-foreground">Loading interviews...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-destructive">Failed to load interviews</p>
                </div>
            </div>
        );
    }

    const openPlanModal = (startupId?: string) => {
        setSelectedStartupId(startupId);
        setPlanModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2">
                            Interviews
                        </h1>
                        <p className="text-muted-foreground">
                            Track upcoming sessions and capture insights from recent conversations.
                        </p>
                    </div>
                    <button
                        onClick={() => openPlanModal()}
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                    >
                        New Interview
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-muted-foreground">Scheduled</p>
                        <p className="text-3xl font-bold text-foreground">{scheduledStartups.length}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                        <p className="text-sm text-muted-foreground">Completed Logs</p>
                        <p className="text-3xl font-bold text-foreground">{interviewCards.length}</p>
                    </div>
                </div>

                {/* Upcoming */}
                <div className="bg-card border border-border rounded-lg shadow-sm mb-8">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Upcoming Interviews</h2>
                            <p className="text-sm text-muted-foreground">
                                {scheduledStartups.length === 0
                                    ? 'Book your next customer conversation.'
                                    : 'Launch straight into Live Interview Mode from here.'}
                            </p>
                        </div>
                    </div>
                    <div className="divide-y divide-border">
                        {scheduledStartups.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                                Nothing scheduled yet.
                            </div>
                        ) : (
                            scheduledStartups.map((startup) => (
                                <div key={startup.id} className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-lg font-semibold text-foreground">{startup.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {contactMap.get(startup.id)?.name || 'No contact'}{' '}
                                            {contactMap.get(startup.id)?.role ? `· ${contactMap.get(startup.id)?.role}` : ''}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">Stage: {startup.status}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/startups/${startup.id}`}
                                            className="px-3 py-1.5 text-sm rounded-md border border-border text-foreground hover:bg-muted"
                                        >
                                            View Startup
                                        </Link>
                                        <button
                                            onClick={() => openPlanModal(startup.id)}
                                            className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:opacity-90"
                                        >
                                            Run Interview
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                    {/* Recent Interviews */}
                <div className="bg-card border border-border rounded-lg shadow-sm">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Recent Interview Logs</h2>
                            <p className="text-sm text-muted-foreground">
                                {interviewCards.length === 0 ? 'Logs show up here after you capture an interview.' : 'Review past conversations and jump to insights.'}
                            </p>
                        </div>
                    </div>
                    <div className="divide-y divide-border">
                        {interviewCards.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                                No interviews captured yet.
                            </div>
                        ) : (
                            interviewCards.map((interview) => (
                                <div key={interview.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <p className="text-lg font-semibold text-foreground">{interview.startupName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {interview.interview_type} · {new Date(interview.date).toLocaleString()}
                                        </p>
                                        {interview.summary && (
                                            <p className="text-sm text-foreground mt-2 line-clamp-2">{interview.summary}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Link
                                            href={`/interviews/${interview.id}/insights`}
                                            className="px-4 py-2 text-sm rounded-md bg-secondary text-secondary-foreground hover:opacity-90"
                                        >
                                            View Insights
                                        </Link>
                                        <Link
                                            href={`/startups/${interview.startup_id}`}
                                            className="px-4 py-2 text-sm rounded-md border border-border text-foreground hover:bg-muted"
                                        >
                                            Startup
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {planModalOpen && (
                <PlanInterviewModal
                    isOpen={planModalOpen}
                    onClose={() => setPlanModalOpen(false)}
                    initialStartupId={selectedStartupId}
                />
            )}
        </div>
    );
}
