'use client';

export type EmailTemplateKey = 'intro' | 'follow-up' | 'custom';

export interface TemplateContent {
    subject: string;
    html: string;
    text: string;
}

interface TemplateDefinition {
    label: string;
    description: string;
    build: (contactName: string, startupName: string) => TemplateContent;
}

const TEMPLATE_MAP: Record<EmailTemplateKey, TemplateDefinition> = {
    'intro': {
        label: 'Intro email',
        description: 'Warm introduction highlighting Poblysh',
        build: (contactName: string, startupName: string) => ({
            subject: `Quick intro from Poblysh for ${startupName}`,
            html: `<p>Hi ${contactName},</p>
<p>Wanted to introduce you to Poblysh — we help teams like ${startupName} accelerate their customer validation work without adding more tools to their stack.</p>
<p>Are you open to a short call this week to walk through how we're helping other teams track outreach and insights?</p>
<p>Best,<br/>The Poblysh team</p>`,
            text: `Hi ${contactName},

Wanted to introduce you to Poblysh — we help teams like ${startupName} accelerate their customer validation work without adding more tools to their stack.

Are you open to a short call this week to walk through how we're helping other teams track outreach and insights?

Best,
The Poblysh team`,
        }),
    },
    'follow-up': {
        label: 'Follow-up',
        description: 'Polite reminder after the first touchpoint',
        build: (contactName: string, startupName: string) => ({
            subject: `Following up on Poblysh <> ${startupName}`,
            html: `<p>Hi ${contactName},</p>
<p>Just checking back in on Poblysh. Happy to send a short Loom or find time live if you still want to see how teams are logging outreach + interviews in one place.</p>
<p>Let me know what works best for you.</p>
<p>Thanks,<br/>The Poblysh team</p>`,
            text: `Hi ${contactName},

Just checking back in on Poblysh. Happy to send a short Loom or find time live if you still want to see how teams are logging outreach + interviews in one place.

Let me know what works best for you.

Thanks,
The Poblysh team`,
        }),
    },
    'custom': {
        label: 'Custom',
        description: 'Start with a blank slate',
        build: () => ({
            subject: '',
            html: '',
            text: '',
        }),
    },
};

export const EMAIL_TEMPLATE_OPTIONS = TEMPLATE_MAP;

export function getTemplateContent(template: EmailTemplateKey, contactName: string, startupName: string): TemplateContent {
    const definition = TEMPLATE_MAP[template] ?? TEMPLATE_MAP['custom'];
    return definition.build(contactName, startupName);
}
