'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    description: string;
    action: () => void;
}

export function useKeyboardShortcuts() {
    const router = useRouter();

    const shortcuts: ShortcutConfig[] = [
        { key: 'd', alt: true, description: 'Go to Dashboard', action: () => router.push('/dashboard') },
        { key: 'a', alt: true, description: 'Go to Assets', action: () => router.push('/assets') },
        { key: 'l', alt: true, description: 'Go to Liabilities', action: () => router.push('/liabilities') },
        { key: 'i', alt: true, description: 'Go to Investments', action: () => router.push('/investments') },
        { key: 'g', alt: true, description: 'Go to Goals', action: () => router.push('/goals') },
        { key: 'c', alt: true, description: 'Go to Calculators', action: () => router.push('/calculators') },
        { key: 'r', alt: true, description: 'Go to Retirement', action: () => router.push('/retirement') },
        { key: 's', alt: true, description: 'Go to Settings', action: () => router.push('/settings') },
        { key: 'b', alt: true, description: 'Go to Budget', action: () => router.push('/budget') },
    ];

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in inputs
        if (event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement ||
            event.target instanceof HTMLSelectElement) {
            return;
        }

        const matchingShortcut = shortcuts.find(s => {
            const keyMatch = event.key.toLowerCase() === s.key.toLowerCase();
            const ctrlMatch = s.ctrl ? event.ctrlKey : !event.ctrlKey;
            const altMatch = s.alt ? event.altKey : !event.altKey;
            const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey;
            return keyMatch && ctrlMatch && altMatch && shiftMatch;
        });

        if (matchingShortcut) {
            event.preventDefault();
            matchingShortcut.action();
        }
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return shortcuts;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const shortcuts = [
        { keys: 'Alt + D', action: 'Dashboard' },
        { keys: 'Alt + A', action: 'Assets' },
        { keys: 'Alt + L', action: 'Liabilities' },
        { keys: 'Alt + I', action: 'Investments' },
        { keys: 'Alt + G', action: 'Goals' },
        { keys: 'Alt + C', action: 'Calculators' },
        { keys: 'Alt + R', action: 'Retirement' },
        { keys: 'Alt + B', action: 'Budget' },
        { keys: 'Alt + S', action: 'Settings' },
        { keys: '?', action: 'Show shortcuts' },
    ];

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '16px',
                    padding: '2rem',
                    maxWidth: '400px',
                    width: '90%',
                }}
                onClick={e => e.stopPropagation()}
            >
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    marginBottom: '1.5rem',
                    color: 'var(--color-text-primary)'
                }}>
                    ⌨️ Keyboard Shortcuts
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {shortcuts.map(s => (
                        <div key={s.keys} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0',
                            borderBottom: '1px solid var(--color-border)',
                        }}>
                            <span style={{
                                background: 'var(--color-bg-tertiary)',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.85rem',
                                color: 'var(--color-accent-gold)',
                            }}>
                                {s.keys}
                            </span>
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                                {s.action}
                            </span>
                        </div>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    style={{
                        marginTop: '1.5rem',
                        width: '100%',
                        padding: '0.75rem',
                        background: 'var(--color-accent-gold)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
}
