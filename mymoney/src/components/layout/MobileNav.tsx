'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MobileNav.module.css';

const navItems = [
    { label: 'Home', href: '/dashboard', icon: '🏠' },
    { label: 'Assets', href: '/assets', icon: '💰' },
    { label: 'Transactions', href: '/transactions', icon: '📊' },
    { label: 'Goals', href: '/goals', icon: '🎯' },
    { label: 'More', href: '/settings', icon: '☰' },
];

export default function MobileNav() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <nav className={styles.mobileNav}>
            {navItems.map(item => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                >
                    <span className={styles.icon}>{item.icon}</span>
                    <span className={styles.label}>{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}
