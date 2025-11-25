'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    useStartup,
    useContactsForStartup,
    useCreateInterview,
    useCreateInterviewInsight,
    useUpdateStartup,
} from '@/lib/hooks';
import {
    ChevronDown,
    MessageSquare,
    Pause,
    Play,
    Save,
} from 'lucide-react';

const SIGNAL_TIERS = [
    { id: 'High', label: 'High Signal', color: 'bg-emerald-600/10 text-emerald-700 border-emerald-200' },
    { id: 'Medium', label: 'Medium Signal', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
    { id: 'Low', label: 'Low Signal', color: 'bg-slate-500/10 text-slate-700 border-slate-200' },
    { id: 'Negative', label: 'Negative', color: 'bg-rose-500/10 text-rose-700 border-rose-200' },
];

const PREDEFINED_TAGS = {
    pains: ['No time', 'No structure', 'Hard to pitch', 'Inconsistent', 'Founder busy', 'Stealth mode'],
    outcomes: ['Fundraising lift', 'Hiring boost', 'Investor updates', 'Founder brand', 'SEO/Visibility'],
    features: ['Newsroom', 'AI Drafts', 'Mentions', 'Blogger Pitching', 'Analytics'],
    objections: ['Who owns this?', 'Too expensive', 'No PR need', 'Process change', 'Content approval'],
};

const SCRIPT_STEPS = [
    {
        title: 'Context & Frame',
        time: '0-2 mins',
        content: (
            <div className="space-y-3 text-sm text-muted-foreground">
                <div className="p-3 bg-primary/10 text-white/80 rounded-md">
                    “This isn’t a sales call. We’re validating a concept and want your honest feedback.”
                </div>
                <ul className="list-disc pl-5 space-y-1 text-foreground">
                    <li>“We already drafted a newsroom for your startup — all public info.”</li>
                    <li>“We want to understand your workflow and whether this solves a real problem.”</li>
                </ul>
            </div>
        ),
    },
    {
        title: 'Current Workflow',
        time: '2-5 mins',
        content: (
            <div className="space-y-3 text-sm text-foreground">
                <h4 className="font-semibold text-muted-foreground">Discovery Questions</h4>
                <ul className="space-y-2">
                    <li className="flex gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /> “How do updates currently go from your team → the outside world?”</li>
                    <li className="flex gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /> “Who owns PR or visibility today?”</li>
                    <li className="flex gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /> “What slows you down the most?”</li>
                </ul>
            </div>
        ),
    },
    {
        title: 'Show the Newsroom',
        time: '5-9 mins',
        content: (
            <div className="space-y-3 text-sm text-foreground">
                <div className="p-4 border border-primary/30 rounded-md text-center">
                    <p className="font-semibold text-primary">Open their newsroom draft and share screen</p>
                    <p className="text-xs text-muted-foreground mt-1">(Highlight the AI draft + mentions.)</p>
                </div>
                <h4 className="font-semibold text-muted-foreground">Ask:</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>“What stands out?”</li>
                    <li>“What feels unnecessary?”</li>
                    <li>“What feels missing?”</li>
                </ul>
            </div>
        ),
    },
    {
        title: 'Value & JTBD',
        time: '9-12 mins',
        content: (
            <div className="space-y-3 text-sm text-foreground">
                <h4 className="font-semibold text-muted-foreground">Power Questions</h4>
                <ul className="space-y-2">
                    <li className="flex gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /> “If this worked perfectly, how would it make your job easier?”</li>
                    <li className="flex gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /> “Could you realistically maintain this in 30–60 mins/month?”</li>
                    <li className="flex gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /> “What would stop you from using this?”</li>
                </ul>
            </div>
        ),
    },
    {
        title: 'Decision & Close',
        time: '12-15 mins',
        content: (
            <div className="grid gap-3 text-sm">
                <div className="p-3 border rounded-lg hover:bg-emerald-50 cursor-pointer">
                    <p className="font-semibold text-emerald-600">A. Activation Candidate</p>
                    <p className="text-muted-foreground text-xs">“Let’s hand over admin + set up workflow.”</p>
                </div>
                <div className="p-3 border rounded-lg hover:bg-amber-50 cursor-pointer">
                    <p className="font-semibold text-amber-600">B. Unsure / Follow-up</p>
                    <p className="text-muted-foreground text-xs">“Check back after speaking to founder.”</p>
                </div>
                <div className="p-3 border rounded-lg hover:bg-rose-50 cursor-pointer">
                    <p className="font-semibold text-rose-600">C. Not a Fit</p>
                    <p className="text-muted-foreground text-xs">“What would need to change?”</p>
                </div>
            </div>
        ),
    },
];

const INITIAL_FORM = {
    contactId: '',
    interviewee: '',
    role: '',
    workflow: '',
    pains: [] as string[],
    outcomes: [] as string[],
    features: [] as string[],
    objections: [] as string[],
    signal: 'Medium',
    notes: '',
};

export default function LiveInterviewPage() {
    const params = useParams();
    const router = useRouter();
    const startupId = params.id as string;

    const { data: startup, isLoading, error } = useStartup(startupId);
    const { data: contacts } = useContactsForStartup(startupId);
    const createInterview = useCreateInterview();
    const createInsight = useCreateInterviewInsight();
    const updateStartup = useUpdateStartup();

    const [activeStep, setActiveStep] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(true);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning]);

    useEffect(() => {
        if (!contacts || contacts.length === 0) return;
        // Preselect primary or first contact
        const primary = contacts.find((c) => c.is_primary) || contacts[0];
        setFormData((prev) => ({
            ...prev,
            contactId: prev.contactId || primary.id,
            interviewee: prev.interviewee || primary.name,
            role: prev.role || primary.role,
        }));
    }, [contacts]);

    useEffect(() => {
        if (!contacts || !formData.contactId) return;
        const selected = contacts.find((c) => c.id === formData.contactId);
        if (!selected) return;
        setFormData((prev) => ({
            ...prev,
            interviewee: prev.interviewee || selected.name,
            role: prev.role || selected.role,
        }));
    }, [formData.contactId, contacts]);

    const toggleTag = (category: keyof typeof formData, tag: string) => {
        setFormData((prev) => {
            const current = prev[category] as string[];
            const updated = current.includes(tag)
                ? current.filter((item) => item !== tag)
                : [...current, tag];
            return { ...prev, [category]: updated };
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSave = async () => {
        if (!startup) return;
        setIsSaving(true);
        setErrorMessage('');
        try {
            const interview = await createInterview.mutateAsync({
                startup_id: startup.id,
                contact_id: formData.contactId || undefined,
                date: new Date().toISOString(),
                interview_type: 'Live Interview',
                summary: formData.notes || undefined,
            });

            await createInsight.mutateAsync({
                interview_id: interview.id,
                current_workflow: formData.workflow || undefined,
                biggest_pains: formData.pains,
                desired_outcomes: formData.outcomes,
                jtbd_functional: undefined,
                jtbd_social: undefined,
                jtbd_emotional: undefined,
                excited_features: formData.features,
                ignored_features: [],
                main_objections: formData.objections,
                interest_level: formData.signal,
                real_owner_role: formData.role || undefined,
                willing_to_use_monthly: undefined,
                activation_candidate: formData.signal === 'High',
            });

            if (startup.status !== 'Interview Done') {
                await updateStartup.mutateAsync({
                    id: startup.id,
                    data: {
                        name: startup.name,
                        status: 'Interview Done',
                        category: startup.category || undefined,
                        website: startup.website || undefined,
                        newsroom_url: startup.newsroom_url || undefined,
                    },
                });
            }

            router.push(`/startups/${startup.id}`);
        } catch (err) {
            console.error(err);
            setErrorMessage('Failed to save interview. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-6xl mx-auto">
                    <p className="text-muted-foreground">Loading interview mode…</p>
                </div>
            </div>
        );
    }

    if (error || !startup) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="max-w-6xl mx-auto space-y-4">
                    <p className="text-destructive">Unable to load startup.</p>
                    <Link href="/startups" className="text-primary hover:underline">
                        ← Back to Startups
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20">
            <div className="max-w-6xl mx-auto py-6 px-4 lg:px-0 space-y-4">
                <Link href={`/startups/${startup.id}`} className="text-primary text-sm hover:underline">
                    ← Back to {startup.name}
                </Link>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase text-muted-foreground tracking-wide">Live Interview Mode</p>
                        <h1 className="text-3xl font-bold text-foreground">{startup.name}</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase text-muted-foreground">Timer</p>
                        <p className={`text-3xl font-mono font-semibold ${timer > 900 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {formatTime(timer)}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    {/* Script */}
                    <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Interview Script</p>
                                <p className="text-sm text-foreground">Stay on pace</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsTimerRunning((prev) => !prev)}
                                    className="p-2 rounded-lg border border-border hover:bg-muted"
                                    aria-label="Toggle timer"
                                >
                                    {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 text-emerald-600" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {SCRIPT_STEPS.map((step, idx) => (
                                <div
                                    key={step.title}
                                    className={`border rounded-lg transition-all ${activeStep === idx ? 'border-primary shadow-md bg-primary/5' : 'border-border opacity-70'}`}
                                >
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-between px-3 py-2"
                                        onClick={() => setActiveStep(idx)}
                                    >
                                        <div className="text-left">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{step.time}</p>
                                            <p className="text-sm font-semibold text-foreground">{step.title}</p>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${activeStep === idx ? 'rotate-180' : ''}`} />
                                    </button>
                                    {activeStep === idx && (
                                        <div className="px-4 pb-4">
                                            {step.content}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-border flex justify-between items-center">
                            <button
                                type="button"
                                className="text-sm text-muted-foreground hover:text-foreground"
                                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                className="text-sm px-3 py-2 rounded-md bg-primary text-white"
                                onClick={() => setActiveStep((prev) => Math.min(SCRIPT_STEPS.length - 1, prev + 1))}
                            >
                                Next Step
                            </button>
                        </div>
                    </div>

                    {/* Insight Logger */}
                    <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Insight Logger</p>
                                <p className="text-lg font-semibold text-foreground">Capture findings</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => router.push(`/startups/${startup.id}`)}
                                    className="px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {isSaving ? 'Saving…' : 'Save Log'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {errorMessage && (
                                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                                    {errorMessage}
                                </div>
                            )}

                            {/* Contact */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Contact</label>
                                    <select
                                        value={formData.contactId}
                                        onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                                    >
                                        <option value="">No specific contact</option>
                                        {contacts?.map((contact) => (
                                            <option key={contact.id} value={contact.id}>
                                                {contact.name} — {contact.role}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Interviewee Name</label>
                                        <input
                                            type="text"
                                            value={formData.interviewee}
                                            onChange={(e) => setFormData({ ...formData, interviewee: e.target.value })}
                                            placeholder="James Abang"
                                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground uppercase">Role</label>
                                        <input
                                            type="text"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            placeholder="Founder/CEO"
                                            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Current Workflow (Notes)</label>
                                    <textarea
                                        value={formData.workflow}
                                        onChange={(e) => setFormData({ ...formData, workflow: e.target.value })}
                                        placeholder="How do they run PR/comms today?"
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm min-h-[80px]"
                                    />
                                </div>
                            </div>

                            {/* Tag banks */}
                            <div className="space-y-5">
                                {Object.entries(PREDEFINED_TAGS).map(([category, tags]) => (
                                    <div key={category}>
                                        <p className="text-xs font-bold uppercase tracking-wide mb-2 text-muted-foreground">
                                            {category === 'pains' && 'Pains Mentioned'}
                                            {category === 'outcomes' && 'Desired Outcomes'}
                                            {category === 'features' && 'Features Excited About'}
                                            {category === 'objections' && 'Objections'}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleTag(category as keyof typeof formData, tag)}
                                                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                                                        (formData[category as keyof typeof formData] as string[]).includes(tag)
                                                            ? 'bg-primary text-white border-primary'
                                                            : 'border-border text-foreground hover:bg-muted'
                                                    }`}
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Signal + Notes */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                        Overall Signal Strength
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {SIGNAL_TIERS.map((tier) => (
                                            <button
                                                key={tier.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, signal: tier.id })}
                                                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                                    formData.signal === tier.id
                                                        ? `${tier.color} ring-2 ring-offset-1 ring-primary/50`
                                                        : 'border-border text-muted-foreground hover:border-primary/40'
                                                }`}
                                            >
                                                {tier.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                        General Notes & Observations
                                    </p>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Quotes, signal reasons, next steps…"
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md min-h-[120px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
