'use client';

import * as React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function ThemeToggle(): React.ReactNode {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-9 h-9" />; // Avoid hydration mismatch
    }

    return (
        <div className="flex items-center gap-1 p-1 border border-border rounded-lg bg-background">
            <button
                onClick={() => setTheme('light')}
                className={cn(
                    "p-1.5 rounded-md transition-colors hover:bg-muted",
                    theme === 'light' ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
                title="Light mode"
            >
                <Sun className="h-4 w-4" />
                <span className="sr-only">Light mode</span>
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={cn(
                    "p-1.5 rounded-md transition-colors hover:bg-muted",
                    theme === 'dark' ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
                title="Dark mode"
            >
                <Moon className="h-4 w-4" />
                <span className="sr-only">Dark mode</span>
            </button>
            <button
                onClick={() => setTheme('system')}
                className={cn(
                    "p-1.5 rounded-md transition-colors hover:bg-muted",
                    theme === 'system' ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
                title="System mode"
            >
                <Laptop className="h-4 w-4" />
                <span className="sr-only">System mode</span>
            </button>
        </div>
    );
}
