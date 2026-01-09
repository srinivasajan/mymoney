'use client';

import { useState, useEffect } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/components/ThemeContext';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '@/components/KeyboardShortcuts';

function KeyboardShortcutsWrapper({ children }: { children: React.ReactNode }) {
    const [showHelp, setShowHelp] = useState(false);
    useKeyboardShortcuts();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '?' && !e.ctrlKey && !e.altKey) {
                // Don't trigger in inputs
                if (e.target instanceof HTMLInputElement ||
                    e.target instanceof HTMLTextAreaElement) {
                    return;
                }
                setShowHelp(prev => !prev);
            }
            if (e.key === 'Escape') {
                setShowHelp(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            {children}
            <KeyboardShortcutsHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
        </>
    );
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <ToastProvider>
                <KeyboardShortcutsWrapper>
                    {children}
                </KeyboardShortcutsWrapper>
            </ToastProvider>
        </ThemeProvider>
    );
}
