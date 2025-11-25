import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Plan Interview',
};

export default function PlanInterviewLayout({ children }: { children: ReactNode }) {
    return children;
}
