import { formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format relative time with human-readable units
 */
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'offline';

  try {
    const date = parseISO(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 30) return 'synced just now';
    if (diffSeconds < 60) return `synced ${diffSeconds}s ago`;
    if (diffMinutes < 60) return `synced ${diffMinutes}m ago`;
    if (diffHours < 24) return `synced ${diffHours}h ago`;
    if (diffDays < 7) return `synced ${diffDays}d ago`;
    if (diffWeeks < 4) return `synced ${diffWeeks}w ago`;
    if (diffMonths < 12) return `synced ${diffMonths}mo ago`;
    return `synced ${diffYears}y ago`;
  } catch (error) {
    return 'offline';
  }
}

/**
 * Determine connection status from sync_status
 */
export function getConnectionStatus(syncStatus: string | null): 'connected' | 'disconnected' {
  if (!syncStatus) return 'disconnected';
  return syncStatus === 'connected' ? 'connected' : 'disconnected';
}

/**
 * Determine if currently syncing
 */
export function isCurrentlySyncing(syncStatus: string | null, initialSyncing: boolean): boolean {
  return initialSyncing || syncStatus === 'syncing';
}

/**
 * Get display status text
 */
export function getSyncStatusText(
  syncStatus: string | null,
  lastSyncedAt: string | null,
  initialSyncing: boolean,
  conversationsCount: number
): string {
  if (initialSyncing) return 'syncing';
  if (syncStatus === 'syncing') return 'syncing';
  return formatRelativeTime(lastSyncedAt);
}