export const PIPELINE_STATUSES = [
    'Lead',
    'Contacted',
    'Intro Secured',
    'Call Booked',
    'Meeting Scheduled',
    'Interview Done',
    'In Discussion',
    'Activation Candidate',
    'Closed Won',
    'Closed Lost',
    'Not a Fit',
] as const;

export type PipelineStatus = typeof PIPELINE_STATUSES[number];
