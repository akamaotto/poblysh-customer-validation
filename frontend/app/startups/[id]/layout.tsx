import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Startup Details',
};

export default function StartupDetailsLayout({ children }: { children: ReactNode }) {
    return children;
}
