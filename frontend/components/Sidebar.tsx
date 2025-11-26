'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    BarChart3,
    Settings,
    Users,
    Building2,
    Kanban,
    LogOut,
    UserCog,
    ActivitySquare,
    Mail,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from './ThemeToggle';
import { useEffect, useMemo, useState } from 'react';
import { emailApi } from '@/lib/api';

type ConversationStatus = 'connected' | 'disconnected' | 'error' | 'unknown';

export function Sidebar(): React.ReactNode {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [conversationStatus, setConversationStatus] = useState<ConversationStatus>('unknown');

    useEffect(() => {
        if (!user) {
            setConversationStatus('unknown');
            return;
        }

        let isActive = true;
        const fetchStatus = async () => {
            try {
                const status = await emailApi.getStatus();
                if (!isActive) return;
                if (status.sync_status === 'connected') {
                    setConversationStatus('connected');
                } else if (status.sync_status === 'error') {
                    setConversationStatus('error');
                } else {
                    setConversationStatus('disconnected');
                }
            } catch {
                if (isActive) {
                    setConversationStatus('disconnected');
                }
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 60_000);
        const handler = () => fetchStatus();
        window.addEventListener('email-status-refetch', handler);

        return () => {
            isActive = false;
            clearInterval(interval);
            window.removeEventListener('email-status-refetch', handler);
        };
    }, [user]);

    const navItems = useMemo(() => {
        const items = [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/activity', label: 'Activity', icon: ActivitySquare },
            { href: '/pipeline', label: 'Pipeline', icon: Kanban },
            { href: '/startups', label: 'Startups', icon: Building2 },
            { href: '/contacts', label: 'Contacts', icon: Users },
            {
                href: '/conversations',
                label: 'Conversations',
                icon: Mail,
                status: conversationStatus,
            },
            { href: '/interviews', label: 'Interviews', icon: Kanban },
            { href: '/synthesis', label: 'Synthesis', icon: BarChart3 },
        ];

        if (user?.role === 'admin') {
            items.push({ href: '/settings', label: 'Settings', icon: Settings });
            items.push({ href: '/users', label: 'Users', icon: UserCog });
        }

        return items;
    }, [conversationStatus, user?.role]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    return (
        <div className="flex flex-col h-screen w-64 bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
            {/* Logo Section */}
            <div className="p-6 border-b border-sidebar-border">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-card border border-border flex items-center justify-center">
                        <Image src="/icon.svg" alt="Poblysh icon" width={28} height={28} priority className="h-7 w-7" />
                    </div>
                    <span className="font-heading text-base">Customer Validation</span>
                </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname?.startsWith(item.href);
                    const status = (item as typeof item & { status?: ConversationStatus }).status;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="flex-1">{item.label}</span>
                            {status && status !== 'unknown' && (
                                <span
                                    className={cn(
                                        'h-2 w-2 rounded-full',
                                        status === 'connected' && 'bg-emerald-500',
                                        status === 'error' && 'bg-amber-400 animate-pulse',
                                        status === 'disconnected' && 'bg-red-500 animate-pulse',
                                    )}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* User / Footer Section */}
            <div className="p-4 border-t border-sidebar-border space-y-4">
                <div className="flex justify-center w-full">
                    <ThemeToggle />
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 hover:bg-sidebar-accent/50 rounded-md p-2 -m-2 transition-colors flex-1"
                    >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email || 'Not logged in'}</p>
                        </div>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="text-muted-foreground hover:text-foreground"
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
