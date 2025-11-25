'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    is_active: boolean;
    email_verified: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const debug = (...args: unknown[]) => {
        console.info('[auth]', ...args);
    };

    const refreshUser = async () => {
        debug('Refreshing current session');
        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data);
                debug('User refresh succeeded', data);
            } else {
                setUser(null);
                debug('User refresh failed, status', response.status);
            }
        } catch (error) {
            console.error('[auth] Failed to fetch user:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = async (email: string, password: string) => {
        debug('Login request started', { email });
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.warn('[auth] Login failed', response.status, error);
            throw new Error(error || 'Login failed');
        }

        const data = await response.json();
        debug('Login succeeded', data.user);
        setUser(data.user);
    };

    const logout = async () => {
        debug('Logout requested');
        await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        setUser(null);
        debug('Logout completed');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
