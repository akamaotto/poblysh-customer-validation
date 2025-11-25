import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Edit Startup',
};

export default function EditStartupLayout({ children }: { children: ReactNode }) {
    return children;
}
