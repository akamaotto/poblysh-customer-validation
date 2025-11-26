'use server';

import { redirect } from 'next/navigation';

export default function ActivitySettingsRoute() {
    redirect('/settings?tab=activity');
}
