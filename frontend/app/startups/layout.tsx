import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Startups',
};

export default function StartupsLayout({ children }: { children: ReactNode }) {
    return children;
}
