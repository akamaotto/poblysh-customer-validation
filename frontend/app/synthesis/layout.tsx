import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Weekly Synthesis',
};

export default function SynthesisLayout({ children }: { children: ReactNode }) {
    return children;
}
