'use client';

import { useState, useEffect } from 'react';
import styles from './Header.module.css';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useTheme } from '@/components/ThemeContext';

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [netWorth, setNetWorth] = useState<number>(0);
    const [userName, setUserName] = useState<string>('');
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        // Update time every minute
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        // Load net worth and user name from storage
        const loadData = () => {
            try {
                const assetsStr = localStorage.getItem('iap_assets');
                const liabilitiesStr = localStorage.getItem('iap_liabilities');
                const stocksStr = localStorage.getItem('iap_stock_holdings');
                const mfStr = localStorage.getItem('iap_mf_holdings');
                const profileStr = localStorage.getItem('userProfile');

                const assets = assetsStr ? JSON.parse(assetsStr) : [];
                const liabilities = liabilitiesStr ? JSON.parse(liabilitiesStr) : [];
                const stocks = stocksStr ? JSON.parse(stocksStr) : [];
                const mfs = mfStr ? JSON.parse(mfStr) : [];
                const profile = profileStr ? JSON.parse(profileStr) : {};

                const totalAssets = assets.reduce((sum: number, a: { current_value: number }) =>
                    sum + a.current_value, 0);
                const totalStocks = stocks.reduce((sum: number, s: { quantity: number; average_price: number }) =>
                    sum + (s.quantity * s.average_price), 0);
                const totalMF = mfs.reduce((sum: number, m: { units: number; average_nav: number }) =>
                    sum + (m.units * m.average_nav), 0);
                const totalLiabilities = liabilities.reduce((sum: number, l: { outstanding_amount: number }) =>
                    sum + l.outstanding_amount, 0);

                setNetWorth(totalAssets + totalStocks + totalMF - totalLiabilities);
                setUserName(profile.full_name || '');
            } catch (e) {
                console.error('Error loading data:', e);
            }
        };

        loadData();

        // Listen for storage changes
        window.addEventListener('storage', loadData);

        return () => {
            clearInterval(timer);
            window.removeEventListener('storage', loadData);
        };
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                {title ? (
                    <div className={styles.titleSection}>
                        <h1 className={styles.title}>{title}</h1>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>
                ) : userName ? (
                    <div className={styles.greeting}>
                        <span className={styles.greetingText}>{getGreeting()},</span>
                        <span className={styles.userName}>{userName.split(' ')[0]}</span>
                    </div>
                ) : null}
            </div>

            <div className={styles.right}>
                <button
                    className={styles.themeToggle}
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>

                <div className={styles.netWorthBadge}>
                    <span className={styles.netWorthLabel}>Net Worth</span>
                    <span className={styles.netWorthValue}>{formatCurrency(netWorth, 'INR', true)}</span>
                </div>

                <div className={styles.divider} />

                <div className={styles.datetime}>
                    <span className={styles.date}>{formatDate(currentTime, 'medium')}</span>
                    <span className={styles.time}>
                        {currentTime.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        })}
                    </span>
                </div>

                <div className={styles.divider} />

                <div className={styles.profile}>
                    <div className={styles.avatar}>
                        <span>{userName ? userName[0].toUpperCase() : 'U'}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
