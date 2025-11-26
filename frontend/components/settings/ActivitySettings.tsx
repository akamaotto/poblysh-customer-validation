'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ACTIVITY_EVENT_TYPES, PIPELINE_STATUSES } from '@/lib/activity-constants';
import type { WeeklyMetricInput, WeeklyPlan } from '@/lib/api';
import {
    useCloseWeeklyActivityPlan,
    useUpdateWeeklyActivityPlan,
    useWeeklyActivityPlan,
} from '@/lib/hooks';

type EditableMetric = WeeklyMetricInput & { localId: string };

const currentMonday = (): string => {
    const now = new Date();
    const weekday = now.getDay();
    const daysSinceMonday = (weekday + 6) % 7;
    now.setDate(now.getDate() - daysSinceMonday);
    return now.toISOString().slice(0, 10);
};

const generateLocalId = (): string => Math.random().toString(36).slice(2);

const buildMetrics = (plan: WeeklyPlan | undefined, type: 'input' | 'output'): EditableMetric[] => {
    if (!plan) return [];
    return plan.metrics
        .filter((metric) => metric.metric_type === type)
        .map((metric, index) => ({
            localId: metric.id ?? `${type}-${index}-${generateLocalId()}`,
            metric_type: type,
            name: metric.name,
            unit_label: metric.unit_label,
            owner_name: metric.owner_name ?? undefined,
            owner_id: metric.owner_id ?? undefined,
            target_value: metric.target_value,
            activity_type: type === 'input' ? metric.activity_type ?? ACTIVITY_EVENT_TYPES[0]?.value : undefined,
            stage_name: type === 'output' ? metric.stage_name ?? PIPELINE_STATUSES[0] : undefined,
            sort_order: index,
        }));
};

export function ActivitySettingsPanel(): JSX.Element {
    const { user } = useAuth();
    const [weekStart, setWeekStart] = useState(currentMonday());
    const { data: plan, isLoading, error } = useWeeklyActivityPlan(weekStart);
    const updatePlan = useUpdateWeeklyActivityPlan();
    const closePlan = useCloseWeeklyActivityPlan();
    const [inputMetrics, setInputMetrics] = useState<EditableMetric[]>(() => buildMetrics(plan, 'input'));
    const [outputMetrics, setOutputMetrics] = useState<EditableMetric[]>(() => buildMetrics(plan, 'output'));
    const [message, setMessage] = useState<string | null>(null);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        setInputMetrics(buildMetrics(plan, 'input'));
        setOutputMetrics(buildMetrics(plan, 'output'));
    }, [plan]);

    const onMetricChange = (
        collection: 'input' | 'output',
        id: string,
        field: keyof EditableMetric,
        value: string,
    ): void => {
        const updater = collection === 'input' ? setInputMetrics : setOutputMetrics;
        updater((prev) =>
            prev.map((metric) =>
                metric.localId === id
                    ? {
                          ...metric,
                          [field]: field === 'target_value' ? Number(value) : value,
                      }
                    : metric,
            ),
        );
    };

    const addMetric = (type: 'input' | 'output'): void => {
        const defaultMetric: EditableMetric = {
            localId: generateLocalId(),
            metric_type: type,
            name: '',
            unit_label: 'Count',
            owner_name: undefined,
            target_value: 0,
            activity_type: type === 'input' ? ACTIVITY_EVENT_TYPES[0]?.value : undefined,
            stage_name: type === 'output' ? PIPELINE_STATUSES[0] : undefined,
        };

        if (type === 'input') {
            setInputMetrics((prev) => [...prev, defaultMetric]);
        } else {
            setOutputMetrics((prev) => [...prev, defaultMetric]);
        }
    };

    const removeMetric = (type: 'input' | 'output', id: string): void => {
        const updater = type === 'input' ? setInputMetrics : setOutputMetrics;
        updater((prev) => prev.filter((metric) => metric.localId !== id));
    };

    const handleSave = async (): Promise<void> => {
        setMessage(null);
        const metrics: WeeklyMetricInput[] = [...inputMetrics, ...outputMetrics].map(
            ({ localId: _localId, owner_name, ...metric }, index) => ({
                ...metric,
                owner_name: owner_name?.trim() ? owner_name.trim() : undefined,
                target_value: Number.isNaN(metric.target_value) ? 0 : metric.target_value,
                sort_order: index,
            }),
        );

        if (metrics.some((metric) => metric.name.trim().length === 0)) {
            setMessage('Please provide a name for each metric.');
            return;
        }

        try {
            await updatePlan.mutateAsync({
                week_start: weekStart,
                metrics,
            });
            setMessage('Plan saved successfully.');
        } catch (err) {
            setMessage(err instanceof Error ? err.message : 'Unable to save plan.');
        }
    };

    const handleCloseWeek = async (): Promise<void> => {
        if (!plan?.id) return;
        try {
            await closePlan.mutateAsync(plan.id);
            setMessage('Week closed and snapshot stored.');
        } catch (err) {
            setMessage(err instanceof Error ? err.message : 'Unable to close the week.');
        }
    };

    if (!isAdmin) {
        return (
            <div className="text-center text-destructive border border-destructive/40 bg-destructive/10 rounded-lg p-6">
                Admin privileges required to manage settings.
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="text-sm text-muted-foreground border border-border rounded-lg p-4">
                Loading weekly plan…
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs uppercase tracking-wide text-muted-foreground">
                            Week starting
                        </label>
                        <input
                            type="date"
                            value={weekStart}
                            onChange={(e) => setWeekStart(e.target.value)}
                            className="w-full rounded-md border border-border bg-background p-2 text-sm"
                        />
                    </div>
                    <div className="flex flex-col justify-end">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                        <p className="text-sm font-medium capitalize">{plan?.status ?? 'draft'}</p>
                    </div>
                    <div className="flex items-end justify-end gap-2">
                        <button
                            type="button"
                            disabled={!plan?.id || plan?.status === 'closed' || closePlan.isPending}
                            onClick={handleCloseWeek}
                            className="px-4 py-2 border border-border rounded-md text-sm disabled:opacity-50"
                        >
                            Close week
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={updatePlan.isPending}
                            className="px-4 py-2 bg-primary text-white rounded-md text-sm disabled:opacity-50"
                        >
                            Save plan
                        </button>
                    </div>
                </div>
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
                {error && (
                    <p className="text-sm text-destructive border border-destructive/30 rounded-md px-3 py-2 bg-destructive/10">
                        Failed to load plan details. Please try again later.
                    </p>
                )}
            </div>

            <SettingsSection
                title="Input Metrics"
                description="Track weekly activity volume (contacts logged, outreach, interviews, etc.)."
                emptyMessage="No input metrics configured for this week."
                metrics={inputMetrics}
                type="input"
                addMetric={addMetric}
                renderMetricCard={(metric) => (
                    <MetricCard
                        key={metric.localId}
                        metric={metric}
                        type="input"
                        onChange={onMetricChange}
                        onRemove={removeMetric}
                    />
                )}
            />

            <SettingsSection
                title="Output Metrics"
                description="Map kanban stages to weekly targets for movement across the pipeline."
                emptyMessage="No output metrics configured for this week."
                metrics={outputMetrics}
                type="output"
                addMetric={addMetric}
                renderMetricCard={(metric) => (
                    <MetricCard
                        key={metric.localId}
                        metric={metric}
                        type="output"
                        onChange={onMetricChange}
                        onRemove={removeMetric}
                    />
                )}
            />
        </div>
    );
}

type SettingsSectionProps = {
    title: string;
    description: string;
    emptyMessage: string;
    metrics: EditableMetric[];
    type: 'input' | 'output';
    addMetric: (type: 'input' | 'output') => void;
    renderMetricCard: (metric: EditableMetric) => JSX.Element;
};

const SettingsSection = ({
    title,
    description,
    emptyMessage,
    metrics,
    type,
    addMetric,
    renderMetricCard,
}: SettingsSectionProps): JSX.Element => (
    <section className="space-y-4">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <button
                type="button"
                onClick={() => addMetric(type)}
                className="px-4 py-2 border border-border rounded-md text-sm"
            >
                Add {type} metric
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.length === 0 ? (
                <p className="text-sm text-muted-foreground col-span-full">{emptyMessage}</p>
            ) : (
                metrics.map(renderMetricCard)
            )}
        </div>
    </section>
);

type MetricCardProps = {
    metric: EditableMetric;
    type: 'input' | 'output';
    onChange: (
        collection: 'input' | 'output',
        id: string,
        field: keyof EditableMetric,
        value: string,
    ) => void;
    onRemove: (collection: 'input' | 'output', id: string) => void;
};

const MetricCard = ({ metric, type, onChange, onRemove }: MetricCardProps): JSX.Element => (
    <div className="border border-border/70 rounded-lg p-4 space-y-3 bg-background">
        <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
                <label className="text-xs text-muted-foreground uppercase">Name</label>
                <input
                    type="text"
                    value={metric.name}
                    onChange={(e) => onChange(type, metric.localId, 'name', e.target.value)}
                    className="w-full rounded-md border border-border bg-card p-2 text-sm"
                />
            </div>
            <button
                type="button"
                className="text-xs text-destructive"
                onClick={() => onRemove(type, metric.localId)}
            >
                Remove
            </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="text-xs text-muted-foreground uppercase">Owner</label>
                <input
                    type="text"
                    value={metric.owner_name ?? ''}
                    onChange={(e) => onChange(type, metric.localId, 'owner_name', e.target.value)}
                    className="w-full rounded-md border border-border bg-card p-2 text-sm"
                    placeholder="Optional"
                />
            </div>
            <div>
                <label className="text-xs text-muted-foreground uppercase">Unit Label</label>
                <input
                    type="text"
                    value={metric.unit_label}
                    onChange={(e) => onChange(type, metric.localId, 'unit_label', e.target.value)}
                    className="w-full rounded-md border border-border bg-card p-2 text-sm"
                />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="text-xs text-muted-foreground uppercase">Target</label>
                <input
                    type="number"
                    value={metric.target_value}
                    min={0}
                    onChange={(e) => onChange(type, metric.localId, 'target_value', e.target.value)}
                    className="w-full rounded-md border border-border bg-card p-2 text-sm"
                />
            </div>
            <div>
                <label className="text-xs text-muted-foreground uppercase">
                    {type === 'input' ? 'Activity Type' : 'Stage'}
                </label>
                {type === 'input' ? (
                    <select
                        className="w-full rounded-md border border-border bg-card p-2 text-sm"
                        value={metric.activity_type ?? ACTIVITY_EVENT_TYPES[0]?.value}
                        onChange={(e) => onChange(type, metric.localId, 'activity_type', e.target.value)}
                    >
                        {ACTIVITY_EVENT_TYPES.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <select
                        className="w-full rounded-md border border-border bg-card p-2 text-sm"
                        value={metric.stage_name ?? PIPELINE_STATUSES[0]}
                        onChange={(e) => onChange(type, metric.localId, 'stage_name', e.target.value)}
                    >
                        {PIPELINE_STATUSES.map((stage) => (
                            <option key={stage} value={stage}>
                                {stage}
                            </option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    </div>
);
