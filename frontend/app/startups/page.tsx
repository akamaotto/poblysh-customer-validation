'use client';

import { useState, useMemo } from 'react';
import { useStartups } from '@/lib/hooks';
import { AddStartupSheet } from '@/components/AddStartupSheet';

export default function StartupsPage() {
    const { data: startups, isLoading, error } = useStartups();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [isAddStartupOpen, setIsAddStartupOpen] = useState(false);

    // Get unique categories
    const categories = useMemo(() => {
        if (!startups) return [];
        const cats = new Set(startups.map(s => s.category).filter((c): c is string => c !== null));
        return Array.from(cats).sort();
    }, [startups]);

    // Filter startups
    const filteredStartups = useMemo(() => {
        if (!startups) return [];

        return startups.filter(startup => {
            const matchesSearch = searchTerm === '' ||
                startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (startup.category?.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || startup.status === statusFilter;
            const matchesCategory = categoryFilter === 'all' || startup.category === categoryFilter;

            return matchesSearch && matchesStatus && matchesCategory;
        });
    }, [startups, searchTerm, statusFilter, categoryFilter]);

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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-muted-foreground">Loading startups...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-destructive">Failed to load startups</p>
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
                                Startups
                            </h1>
                            <p className="text-muted-foreground">
                                {filteredStartups.length} {filteredStartups.length === 1 ? 'startup' : 'startups'}
                                {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') &&
                                    ` (filtered from ${startups?.length || 0})`}
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

                {/* Filters */}
                <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                                Search
                            </label>
                            <input
                                type="text"
                                id="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or category..."
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                                Status
                            </label>
                            <select
                                id="status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            >
                                <option value="all">All Statuses</option>
                                {STATUSES.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                                Category
                            </label>
                            <select
                                id="category"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setCategoryFilter('all');
                            }}
                            className="mt-4 text-sm text-primary hover:underline"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>

                {/* Table View */}
                <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 delay-100">
                    {filteredStartups.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-muted-foreground text-lg mb-2">
                                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                                    ? 'No startups match your filters'
                                    : 'No startups in your pipeline yet'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Last Contact
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredStartups.map((startup, index) => (
                                    <tr
                                        key={startup.id}
                                        className="group hover:bg-muted/30 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        onClick={() => window.location.href = `/startups/${startup.id}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                                {startup.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-muted-foreground">
                                                {startup.category || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary/10 text-primary transition-all group-hover:scale-105">
                                                {startup.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {startup.last_contact_date
                                                ? new Date(startup.last_contact_date).toLocaleDateString()
                                                : 'Never'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <AddStartupSheet
                isOpen={isAddStartupOpen}
                onClose={() => setIsAddStartupOpen(false)}
            />
        </div>
    );
}
