'use client';

import { useState, useEffect } from 'react';
import styles from './FinancialGauge.module.css';

interface FinancialGaugeProps {
    value: number; // 0-100
    label: string;
    sublabel?: string;
    size?: 'sm' | 'md' | 'lg';
    showValue?: boolean;
    animated?: boolean;
}

// Get color based on value (red -> yellow -> green gradient)
const getGaugeColor = (value: number): string => {
    if (value >= 80) return 'var(--color-positive)';
    if (value >= 60) return '#22c55e'; // Bright green
    if (value >= 40) return 'var(--color-warning)';
    if (value >= 20) return '#f97316'; // Orange
    return 'var(--color-negative)';
};

const getHealthStatus = (value: number): string => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Fair';
    if (value >= 20) return 'Needs Work';
    return 'Critical';
};

export default function FinancialGauge({
    value,
    label,
    sublabel,
    size = 'md',
    showValue = true,
    animated = true,
}: FinancialGaugeProps) {
    const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

    // Clamp value between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, value));

    useEffect(() => {
        if (!animated) {
            setDisplayValue(clampedValue);
            return;
        }

        // Animate value on mount
        const startTime = Date.now();
        const duration = 1500; // 1.5s animation

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);

            setDisplayValue(Math.round(clampedValue * eased));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [clampedValue, animated]);

    // SVG dimensions based on size
    const dimensions = {
        sm: { size: 100, strokeWidth: 8, fontSize: 18 },
        md: { size: 140, strokeWidth: 10, fontSize: 24 },
        lg: { size: 180, strokeWidth: 12, fontSize: 32 },
    };

    const { size: svgSize, strokeWidth, fontSize } = dimensions[size];
    const radius = (svgSize - strokeWidth) / 2;
    const circumference = radius * Math.PI; // Semi-circle
    const offset = circumference - (displayValue / 100) * circumference;

    const gaugeColor = getGaugeColor(displayValue);
    const healthStatus = getHealthStatus(displayValue);

    return (
        <div className={`${styles.container} ${styles[size]}`}>
            <svg
                width={svgSize}
                height={svgSize / 2 + strokeWidth}
                className={styles.gauge}
            >
                {/* Background arc */}
                <path
                    d={`
                        M ${strokeWidth / 2} ${svgSize / 2}
                        A ${radius} ${radius} 0 0 1 ${svgSize - strokeWidth / 2} ${svgSize / 2}
                    `}
                    fill="none"
                    stroke="var(--color-bg-tertiary)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />

                {/* Value arc */}
                <path
                    d={`
                        M ${strokeWidth / 2} ${svgSize / 2}
                        A ${radius} ${radius} 0 0 1 ${svgSize - strokeWidth / 2} ${svgSize / 2}
                    `}
                    fill="none"
                    stroke={gaugeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={styles.valueArc}
                />
            </svg>

            {showValue && (
                <div className={styles.valueContainer}>
                    <span
                        className={styles.value}
                        style={{ fontSize, color: gaugeColor }}
                    >
                        {displayValue}
                    </span>
                    <span className={styles.unit}>/ 100</span>
                </div>
            )}

            <div className={styles.labelContainer}>
                <span className={styles.label}>{label}</span>
                <span className={styles.status} style={{ color: gaugeColor }}>
                    {healthStatus}
                </span>
                {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
            </div>
        </div>
    );
}

// Helper component for displaying multiple gauges in a grid
interface HealthIndicator {
    id: string;
    label: string;
    value: number;
    sublabel?: string;
}

interface FinancialHealthDashboardProps {
    indicators: HealthIndicator[];
}

export function FinancialHealthDashboard({ indicators }: FinancialHealthDashboardProps) {
    // Calculate overall score as weighted average
    const overallScore = indicators.length > 0
        ? Math.round(indicators.reduce((sum, i) => sum + i.value, 0) / indicators.length)
        : 0;

    return (
        <div className={styles.dashboard}>
            <div className={styles.dashboardHeader}>
                <h3 className={styles.dashboardTitle}>Financial Health Score</h3>
            </div>

            <div className={styles.overallSection}>
                <FinancialGauge
                    value={overallScore}
                    label="Overall Score"
                    size="lg"
                />
            </div>

            <div className={styles.indicatorsGrid}>
                {indicators.map((indicator) => (
                    <div key={indicator.id} className={styles.indicatorCard}>
                        <div className={styles.indicatorInfo}>
                            <span className={styles.indicatorLabel}>{indicator.label}</span>
                            {indicator.sublabel && (
                                <span className={styles.indicatorSublabel}>{indicator.sublabel}</span>
                            )}
                        </div>
                        <div className={styles.indicatorBar}>
                            <div
                                className={styles.indicatorFill}
                                style={{
                                    width: `${Math.min(indicator.value, 100)}%`,
                                    backgroundColor: getGaugeColor(indicator.value)
                                }}
                            />
                        </div>
                        <span
                            className={styles.indicatorValue}
                            style={{ color: getGaugeColor(indicator.value) }}
                        >
                            {Math.round(indicator.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
