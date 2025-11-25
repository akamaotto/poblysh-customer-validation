import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Pipeline',
};

export default function PipelineLayout({ children }: { children: ReactNode }) {
    return children;
}
