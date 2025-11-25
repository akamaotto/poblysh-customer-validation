'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStartups, useCreateStartup } from '@/lib/hooks';

const UPCOMING_STATUSES = ['Call Booked', 'Meeting Scheduled', 'Interview Done'];

interface PlanInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialStartupId?: string;
}

export function PlanInterviewModal({ isOpen, onClose, initialStartupId }: PlanInterviewModalProps) {
    const router = useRouter();
    const { data: startups } = useStartups();
    const createStartup = useCreateStartup();

    const [mode, setMode] = useState<'existing' | 'new'>('existing');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStartupId, setSelectedStartupId] = useState<string | null>(null);
    const [newStartup, setNewStartup] = useState({
        name: '',
        category: '',
        status: 'Call Booked',
        website: '',
    });

    useEffect(() => {
        if (isOpen) {
            setMode(initialStartupId ? 'existing' : 'existing');
            setSelectedStartupId(initialStartupId ?? null);
            setSearchTerm('');
        }
    }, [isOpen, initialStartupId]);

    if (!isOpen) return null;

    const filteredStartups = useMemo(() => {
        if (!startups) return [];
        return startups
            .filter((startup) =>
                searchTerm === '' ||
                startup.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [startups, searchTerm]);

    const handleSelectExisting = () => {
        if (!selectedStartupId) return;
        router.push(`/startups/${selectedStartupId}/interviews/new`);
        onClose();
    };

    const handleCreateStartup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStartup.name) return;

        try {
            const created = await createStartup.mutateAsync({
                name: newStartup.name,
                category: newStartup.category || undefined,
                website: newStartup.website || undefined,
                status: newStartup.status,
            });

            router.push(`/startups/${created.id}/interviews/new`);
            setNewStartup({
                name: '',
                category: '',
                status: 'Call Booked',
                website: '',
            });
            onClose();
        } catch (error) {
            console.error('Failed to create startup before interview:', error);
        }
    };

    const handleClose = () => {
        if (createStartup.isPending) return;
        onClose();
    };

    const selectedStartup = startups?.find((s) => s.id === selectedStartupId);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Plan Interview</h2>
                        <p className="text-sm text-muted-foreground">
                            Choose an existing startup or create a new one to capture interview insights.
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    >
                        Close
                    </button>
                </div>

                <div className="flex p-4 gap-2 border-b border-border">
                    <button
                        onClick={() => setMode('existing')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'existing'
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Existing Startup
                    </button>
                    <button
                        onClick={() => setMode('new')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'new'
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Create New
                    </button>
                </div>

                {mode === 'existing' ? (
                    <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                Search Startups
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by company name..."
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {selectedStartup && (
                            <div className="border border-primary/40 bg-primary/5 rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground uppercase font-semibold mb-1">
                                        Selected Startup
                                    </p>
                                    <p className="text-lg font-semibold text-foreground">{selectedStartup.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Current status: {selectedStartup.status}
                                    </p>
                                </div>
                                <button
                                    onClick={handleSelectExisting}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
                                    disabled={!selectedStartupId}
                                >
                                    Go to Interview
                                </button>
                            </div>
                        )}

                        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                            {filteredStartups.length === 0 ? (
                                <p className="text-sm text-muted-foreground p-6 text-center">
                                    {startups && startups.length > 0
                                        ? 'No startups match your search.'
                                        : 'Add a startup first to run interviews.'}
                                </p>
                            ) : (
                                filteredStartups.map((startup) => (
                                    <button
                                        key={startup.id}
                                        onClick={() => setSelectedStartupId(startup.id)}
                                        className={`w-full text-left p-4 flex items-center justify-between transition-colors ${selectedStartupId === startup.id
                                            ? 'bg-primary/10'
                                            : 'hover:bg-muted/40'
                                            }`}
                                    >
                                        <div>
                                            <p className="text-base font-medium text-foreground">{startup.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {startup.status} {startup.category ? `· ${startup.category}` : ''}
                                            </p>
                                        </div>
                                        {UPCOMING_STATUSES.includes(startup.status) && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                                Ready
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCreateStartup} className="p-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">
                                Startup Name <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={newStartup.name}
                                onChange={(e) => setNewStartup({ ...newStartup, name: e.target.value })}
                                required
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Acme Corp"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">
                                    Status
                                </label>
                                <select
                                    value={newStartup.status}
                                    onChange={(e) => setNewStartup({ ...newStartup, status: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {UPCOMING_STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1 block">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    value={newStartup.category}
                                    onChange={(e) => setNewStartup({ ...newStartup, category: e.target.value })}
                                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Fintech"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">
                                Website
                            </label>
                            <input
                                type="url"
                                value={newStartup.website}
                                onChange={(e) => setNewStartup({ ...newStartup, website: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="https://example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={createStartup.isPending}
                            className="w-full py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 disabled:opacity-60"
                        >
                            {createStartup.isPending ? 'Creating...' : 'Create & Start Interview'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
