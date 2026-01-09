'use client';

import styles from './StatCard.module.css';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: number;
    change?: number;
    changePercent?: number;
    format?: 'currency' | 'number' | 'percent';
    icon?: string;
    iconColor?: 'gold' | 'green' | 'red' | 'blue' | 'purple';
    trend?: 'up' | 'down' | 'neutral';
    compact?: boolean;
    large?: boolean;
}

export default function StatCard({
    label,
    value,
    change,
    changePercent,
    format = 'currency',
    icon,
    iconColor = 'gold',
    trend,
    compact = false,
    large = false,
}: StatCardProps) {
    const formatValue = () => {
        switch (format) {
            case 'currency':
                return formatCurrency(value, 'INR', compact);
            case 'percent':
                return `${value.toFixed(1)}%`;
            case 'number':
            default:
                return value.toLocaleString('en-IN');
        }
    };

    const trendClass = trend || (change !== undefined ? (change >= 0 ? 'up' : 'down') : 'neutral');

    const iconColorClass = {
        gold: styles.iconGold,
        green: styles.iconGreen,
        red: styles.iconRed,
        blue: styles.iconBlue,
        purple: styles.iconPurple,
    }[iconColor];

    const cardClasses = [
        styles.card,
        compact && styles.compact,
        large && styles.large,
    ].filter(Boolean).join(' ');

    return (
        <div className={cardClasses}>
            <div className={styles.header}>
                {icon && (
                    <div className={`${styles.iconWrapper} ${iconColorClass}`}>
                        {icon}
                    </div>
                )}
                <span className={styles.label}>{label}</span>
            </div>

            <div className={styles.valueContainer}>
                <span className={`${styles.value} ${styles[trendClass]}`}>
                    {formatValue()}
                </span>
            </div>

            {(change !== undefined || changePercent !== undefined) && (
                <div className={`${styles.change} ${styles[trendClass]}`}>
                    <span className={styles.changeIcon}>
                        {trendClass === 'up' ? '↑' : trendClass === 'down' ? '↓' : '→'}
                    </span>
                    {change !== undefined && (
                        <span className={styles.changeValue}>
                            {formatCurrency(Math.abs(change), 'INR', true)}
                        </span>
                    )}
                    {changePercent !== undefined && (
                        <span className={styles.changePercent}>
                            ({formatPercent(changePercent)})
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
