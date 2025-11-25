'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import React from 'react';
import { useAuth } from '@/lib/auth-context';

const PUBLIC_ROUTES = new Set(['/login', '/forgot-password', '/reset-password']);
const SIDEBAR_HIDDEN_ROUTES = new Set(['/login', '/forgot-password', '/reset-password']);

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || '';
    const router = useRouter();
    const { user, loading } = useAuth();

    const isPublicRoute = PUBLIC_ROUTES.has(pathname);
    const shouldHideSidebar = SIDEBAR_HIDDEN_ROUTES.has(pathname);

    useEffect(() => {
        if (!loading && !user && !isPublicRoute) {
            router.replace('/login');
        }
    }, [loading, user, isPublicRoute, router]);

    if (!isPublicRoute && !user) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
                Checking authentication...
            </main>
        );
    }

    if (shouldHideSidebar) {
        return (
            <main className="min-h-screen w-full bg-background">
                {children}
            </main>
        );
    }

    return (
        <div className="flex h-screen w-full bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
