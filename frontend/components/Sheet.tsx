'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    description?: string;
    side?: 'left' | 'right';
}

export function Sheet({ isOpen, onClose, children, title, description, side = 'right' }: SheetProps) {
    // Prevent scrolling when sheet is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const alignment = side === 'left' ? 'justify-start' : 'justify-end';
    const slideClass = side === 'left' ? 'slide-in-from-left' : 'slide-in-from-right';
    const borderSide = side === 'left' ? 'border-r' : 'border-l';

    return (
        <div className={`fixed inset-0 z-50 flex ${alignment}`}>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Sheet Content */}
            <div className={`relative z-50 w-full max-w-md h-full bg-background ${borderSide} border-border shadow-2xl animate-in ${slideClass} duration-300 flex flex-col`}>
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
                        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
