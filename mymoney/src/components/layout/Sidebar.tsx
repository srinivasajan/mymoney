'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

// SVG Icon Components
const Icons = {
    dashboard: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
    ),
    assets: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    liabilities: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
            <line x1="2" y1="20" x2="2.01" y2="20" />
        </svg>
    ),
    investments: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    ),
    invest: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
            <path d="M12 18V6" />
        </svg>
    ),
    goals: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    ),
    calculators: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="8.01" y2="10" />
            <line x1="12" y1="10" x2="12.01" y2="10" />
            <line x1="16" y1="10" x2="16.01" y2="10" />
            <line x1="8" y1="14" x2="8.01" y2="14" />
            <line x1="12" y1="14" x2="12.01" y2="14" />
            <line x1="16" y1="14" x2="16.01" y2="14" />
            <line x1="8" y1="18" x2="8.01" y2="18" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
            <line x1="16" y1="18" x2="16.01" y2="18" />
        </svg>
    ),
    analytics: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    budget: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M14 9h.01" />
            <path d="M10 9h.01" />
        </svg>
    ),
    retirement: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
    ),
    debt: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
    ),
    bills: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    tax: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
        </svg>
    ),
    health: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    ),
    settings: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    transactions: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
};

interface NavItem {
    label: string;
    href: string;
    icon: keyof typeof Icons;
}

const portfolioItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Assets', href: '/assets', icon: 'assets' },
    { label: 'Liabilities', href: '/liabilities', icon: 'liabilities' },
    { label: 'Transactions', href: '/transactions', icon: 'transactions' },
    { label: 'Investments', href: '/investments', icon: 'investments' },
    { label: 'Goals', href: '/goals', icon: 'goals' },
];

const toolsItems: NavItem[] = [
    { label: 'Invest', href: '/invest', icon: 'invest' },
    { label: 'Retirement', href: '/retirement', icon: 'retirement' },
    { label: 'Debt Planner', href: '/debt-planner', icon: 'debt' },
    { label: 'Calculators', href: '/calculators', icon: 'calculators' },
    { label: 'Budget', href: '/budget', icon: 'budget' },
    { label: 'Bills', href: '/bills', icon: 'bills' },
];

const insightsItems: NavItem[] = [
    { label: 'Analytics', href: '/analytics', icon: 'analytics' },
    { label: 'Health Score', href: '/health-score', icon: 'health' },
    { label: 'Tax Planner', href: '/tax', icon: 'tax' },
];

const systemItems: NavItem[] = [
    { label: 'Settings', href: '/settings', icon: 'settings' },
];

export default function Sidebar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard' || pathname === '/';
        }
        return pathname.startsWith(href);
    };

    // Check if market is open (NSE hours: 9:15 AM - 3:30 PM IST, Mon-Fri)
    const getMarketStatus = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const day = now.getDay();
        const time = hours * 60 + minutes;

        const isWeekday = day >= 1 && day <= 5;
        const isMarketHours = time >= 555 && time <= 930;

        return isWeekday && isMarketHours;
    };

    const isMarketOpen = getMarketStatus();

    const renderNavSection = (label: string, items: NavItem[]) => (
        <div className={styles.navSection}>
            <span className={styles.navLabel}>{label}</span>
            <ul className={styles.navList}>
                {items.map((item) => (
                    <li key={item.href}>
                        <Link
                            href={item.href}
                            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                        >
                            <span className={styles.navIcon}>{Icons[item.icon]}</span>
                            <span className={styles.navText}>{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <span className={styles.logoIcon}>☽</span>
                <div className={styles.logoTextWrapper}>
                    <span className={styles.logoText}>Moonlight</span>
                    <span className={styles.logoSubtext}>Capital</span>
                </div>
            </div>

            <nav className={styles.nav}>
                {renderNavSection('Portfolio', portfolioItems)}
                {renderNavSection('Tools', toolsItems)}
                {renderNavSection('Insights', insightsItems)}
                {renderNavSection('System', systemItems)}
            </nav>

            <div className={styles.footer}>
                <div className={styles.marketStatus}>
                    <span className={`${styles.statusDot} ${!isMarketOpen ? styles.closed : ''}`}></span>
                    <span className={styles.statusText}>
                        NSE {isMarketOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                </div>
                <div className={styles.version}>v2.1.0</div>
            </div>
        </aside>
    );
}
