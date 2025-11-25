'use client';

import { useParams } from 'next/navigation';
import { useInterviewInsight } from '@/lib/hooks';
import Link from 'next/link';

export default function InterviewInsightPage() {
    const params = useParams();
    const interviewId = params.interviewId as string;

    const { data: insight, isLoading, error } = useInterviewInsight(interviewId);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-5xl mx-auto">
                    <p className="text-muted-foreground">Loading insights...</p>
                </div>
            </div>
        );
    }

    if (error || !insight) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-5xl mx-auto">
                    <p className="text-destructive">No insights found for this interview</p>
                    <Link href={`/startups`} className="text-primary hover:underline">
                        ← Back to Pipeline
                    </Link>
                </div>
            </div>
        );
    }

    const biggestPains = insight.biggest_pains as unknown as string[] || [];
    const desiredOutcomes = insight.desired_outcomes as unknown as string[] || [];
    const excitedFeatures = insight.excited_features as unknown as string[] || [];
    const ignoredFeatures = insight.ignored_features as unknown as string[] || [];
    const mainObjections = insight.main_objections as unknown as string[] || [];

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-5xl mx-auto">
                <Link href={`/startups`} className="text-primary hover:underline text-sm mb-4 inline-block">
                    ← Back to Pipeline
                </Link>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Interview Insights</h1>
                        <p className="text-muted-foreground">JTBD Framework Analysis</p>
                    </div>

                    {/* Activation Badge */}
                    {insight.activation_candidate && (
                        <div className="px-4 py-2 bg-chart-1 text-white rounded-lg font-semibold shadow-md">
                            ⭐ Activation Candidate
                        </div>
                    )}
                </div>

                {/* Interest Level Card */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Interest Level</p>
                            <p className="text-2xl font-bold text-foreground">{insight.interest_level}</p>
                        </div>
                        {insight.real_owner_role && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Decision Maker</p>
                                <p className="text-lg font-semibold text-foreground">{insight.real_owner_role}</p>
                            </div>
                        )}
                        {insight.willing_to_use_monthly && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Willing to Pay</p>
                                <p className="text-lg font-semibold text-foreground">{insight.willing_to_use_monthly}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Current Workflow */}
                {insight.current_workflow && (
                    <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-foreground mb-3">Current Workflow</h2>
                        <p className="text-foreground leading-relaxed">{insight.current_workflow}</p>
                    </div>
                )}

                {/* Pains & Outcomes Grid */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Biggest Pains */}
                    <div className="bg-card border border-destructive/20 rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <span className="text-destructive">😣</span> Biggest Pains
                        </h2>
                        {biggestPains.length > 0 ? (
                            <ul className="space-y-2">
                                {biggestPains.map((pain, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-destructive mt-1">•</span>
                                        <span className="text-foreground">{pain}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm">No pain points recorded</p>
                        )}
                    </div>

                    {/* Desired Outcomes */}
                    <div className="bg-card border border-chart-1/20 rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <span className="text-chart-1">🎯</span> Desired Outcomes
                        </h2>
                        {desiredOutcomes.length > 0 ? (
                            <ul className="space-y-2">
                                {desiredOutcomes.map((outcome, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-chart-1 mt-1">•</span>
                                        <span className="text-foreground">{outcome}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm">No desired outcomes recorded</p>
                        )}
                    </div>
                </div>

                {/* JTBD Framework */}
                <div className="bg-gradient-to-br from-primary/5 to-chart-2/5 border border-primary/20 rounded-lg p-6 mb-6 shadow-md">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Jobs to Be Done Framework</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Functional Job */}
                        <div className="bg-card rounded-lg p-4 border border-border">
                            <h3 className="font-semibold text-primary mb-2">🔧 Functional Job</h3>
                            <p className="text-sm text-muted-foreground mb-2">What task are they trying to accomplish?</p>
                            {insight.jtbd_functional ? (
                                <p className="text-foreground">{insight.jtbd_functional}</p>
                            ) : (
                                <p className="text-muted-foreground text-sm italic">Not specified</p>
                            )}
                        </div>

                        {/* Social Job */}
                        <div className="bg-card rounded-lg p-4 border border-border">
                            <h3 className="font-semibold text-chart-2 mb-2">👥 Social Job</h3>
                            <p className="text-sm text-muted-foreground mb-2">How do they want to be perceived?</p>
                            {insight.jtbd_social ? (
                                <p className="text-foreground">{insight.jtbd_social}</p>
                            ) : (
                                <p className="text-muted-foreground text-sm italic">Not specified</p>
                            )}
                        </div>

                        {/* Emotional Job */}
                        <div className="bg-card rounded-lg p-4 border border-border">
                            <h3 className="font-semibold text-chart-1 mb-2">❤️ Emotional Job</h3>
                            <p className="text-sm text-muted-foreground mb-2">How do they want to feel?</p>
                            {insight.jtbd_emotional ? (
                                <p className="text-foreground">{insight.jtbd_emotional}</p>
                            ) : (
                                <p className="text-muted-foreground text-sm italic">Not specified</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Excited Features */}
                    <div className="bg-card border border-chart-1/20 rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <span className="text-chart-1">✨</span> Excited About
                        </h2>
                        {excitedFeatures.length > 0 ? (
                            <ul className="space-y-2">
                                {excitedFeatures.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-chart-1 mt-1">✓</span>
                                        <span className="text-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm">No excited features recorded</p>
                        )}
                    </div>

                    {/* Ignored Features */}
                    <div className="bg-card border border-muted rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <span className="text-muted-foreground">😐</span> Not Interested In
                        </h2>
                        {ignoredFeatures.length > 0 ? (
                            <ul className="space-y-2">
                                {ignoredFeatures.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-muted-foreground mt-1">○</span>
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-sm">No ignored features recorded</p>
                        )}
                    </div>
                </div>

                {/* Main Objections */}
                {mainObjections.length > 0 && (
                    <div className="bg-card border border-destructive/20 rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <span className="text-destructive">⚠️</span> Main Objections
                        </h2>
                        <ul className="space-y-3">
                            {mainObjections.map((objection, index) => (
                                <li key={index} className="flex items-start gap-3 p-3 bg-destructive/5 rounded-md">
                                    <span className="text-destructive font-bold">{index + 1}.</span>
                                    <span className="text-foreground">{objection}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
