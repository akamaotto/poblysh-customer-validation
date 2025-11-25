'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Navigation() {
    const pathname = usePathname();

    const navItems = [
        { href: '/startups', label: 'Pipeline', icon: '📊' },
        { href: '/synthesis', label: 'Synthesis', icon: '📈' },
    ];

    return (
        <nav className="bg-card border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        {/* Logo */}
                        <Link href="/startups" className="flex items-center gap-2">
                            <Image src="/icon.svg" alt="Poblysh icon" width={28} height={28} priority className="h-7 w-7" />
                            <span className="text-xl font-semibold text-foreground">
                                Customer Validation
                            </span>
                        </Link>

                        {/* Nav Links */}
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                            {navItems.map((item) => {
                                const isActive = pathname?.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${isActive
                                                ? 'bg-primary text-white shadow-md'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            }`}
                                    >
                                        <span className="mr-2">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center space-x-3">
                        <Link
                            href="/startups/new"
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md hover:shadow-lg font-medium text-sm"
                        >
                            + Add Startup
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className="sm:hidden border-t border-border">
                <div className="px-2 pt-2 pb-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname?.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block px-3 py-2 rounded-md text-base font-medium transition-all ${isActive
                                        ? 'bg-primary text-white'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
