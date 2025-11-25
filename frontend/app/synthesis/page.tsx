'use client';

import { useQuery } from '@tanstack/react-query';
import { weeklyApi } from '@/lib/api';

export default function WeeklySynthesisPage() {
    const { data: syntheses, isLoading } = useQuery({
        queryKey: ['weekly-syntheses'],
        queryFn: () => weeklyApi.getWeeklySyntheses(),
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-7xl mx-auto">
                    <p className="text-muted-foreground">Loading weekly syntheses...</p>
                </div>
            </div>
        );
    }

    const latestSynthesis = syntheses?.[0];

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2">
                            Weekly Synthesis
                        </h1>
                        <p className="text-muted-foreground">Aggregated customer validation insights</p>
                    </div>
                </div>

                {!latestSynthesis ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center">
                        <p className="text-muted-foreground text-lg mb-4">No weekly syntheses yet</p>
                        <p className="text-sm text-muted-foreground">
                            Conduct interviews and create your first weekly synthesis to see insights here
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Latest Week Summary */}
                        <div className="bg-gradient-to-br from-primary/10 to-chart-2/10 border border-primary/20 rounded-lg p-6 mb-8 shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">Latest Week</h2>
                                    <p className="text-muted-foreground">
                                        {new Date(latestSynthesis.week_start_date).toLocaleDateString()} - {new Date(latestSynthesis.week_end_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Activation Summary */}
                            {latestSynthesis.activation_summary && (
                                <div className="bg-card rounded-lg p-4 mb-4">
                                    <p className="text-lg font-semibold text-foreground">{latestSynthesis.activation_summary}</p>
                                </div>
                            )}

                            {/* Key Insights Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Top Pains */}
                                {latestSynthesis.top_pains && (
                                    <div className="bg-card border border-destructive/20 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <span className="text-destructive">😣</span> Top Pains
                                        </h3>
                                        <ul className="space-y-2">
                                            {JSON.parse(latestSynthesis.top_pains).map((pain: string, index: number) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <span className="text-destructive mt-1">•</span>
                                                    <span className="text-foreground">{pain}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Top Desired Outcomes */}
                                {latestSynthesis.top_desired_outcomes && (
                                    <div className="bg-card border border-chart-1/20 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <span className="text-chart-1">🎯</span> Top Desired Outcomes
                                        </h3>
                                        <ul className="space-y-2">
                                            {JSON.parse(latestSynthesis.top_desired_outcomes).map((outcome: string, index: number) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <span className="text-chart-1 mt-1">•</span>
                                                    <span className="text-foreground">{outcome}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Owner Persona Summary */}
                            {latestSynthesis.owner_persona_summary && (
                                <div className="bg-card rounded-lg p-4 mt-4">
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Key Insights</h3>
                                    <p className="text-foreground leading-relaxed">{latestSynthesis.owner_persona_summary}</p>
                                </div>
                            )}

                            {/* Product Implications */}
                            {latestSynthesis.product_implications && latestSynthesis.product_implications !== latestSynthesis.owner_persona_summary && (
                                <div className="bg-card rounded-lg p-4 mt-4 border border-primary/20">
                                    <h3 className="text-lg font-semibold text-primary mb-2">Product Implications</h3>
                                    <p className="text-foreground leading-relaxed">{latestSynthesis.product_implications}</p>
                                </div>
                            )}
                        </div>

                        {/* Historical Syntheses */}
                        {syntheses && syntheses.length > 1 && (
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-4">Previous Weeks</h2>
                                <div className="space-y-4">
                                    {syntheses.slice(1).map((synthesis) => (
                                        <div key={synthesis.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-semibold text-foreground">
                                                        {new Date(synthesis.week_start_date).toLocaleDateString()} - {new Date(synthesis.week_end_date).toLocaleDateString()}
                                                    </p>
                                                    {synthesis.activation_summary && (
                                                        <p className="text-sm text-muted-foreground mt-1">{synthesis.activation_summary}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {synthesis.owner_persona_summary && (
                                                <p className="text-sm text-foreground line-clamp-2">{synthesis.owner_persona_summary}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
