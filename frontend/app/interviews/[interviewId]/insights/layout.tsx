import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Interview Insights',
};

export default function InterviewInsightsLayout({ children }: { children: ReactNode }) {
    return children;
}
