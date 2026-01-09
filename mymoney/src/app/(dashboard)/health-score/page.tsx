'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
    getAssets,
    getLiabilities,
    getGoals,
    getStockHoldings,
    getMFHoldings,
    getUserProfile
} from '@/lib/storage';
import { calculateHealthScore, type HealthScoreResult } from '@/lib/health-score/calculator';
import { formatCurrency } from '@/lib/utils';

// Category action mappings - where to navigate for improvement
const CATEGORY_ACTIONS: Record<string, { href: string; label: string; tip: string }> = {
    savings: { href: '/goals', label: 'Set Savings Goals', tip: 'Create savings targets to build your emergency fund' },
    debt: { href: '/debt-planner', label: 'Plan Debt Payoff', tip: 'Create a strategy to pay off debts faster' },
    investments: { href: '/invest', label: 'Start Investing', tip: 'Explore investment opportunities' },
    protection: { href: '/bills', label: 'Add Insurance', tip: 'Track your insurance premiums' },
    goals: { href: '/goals', label: 'Review Goals', tip: 'Update your financial goals progress' },
};

export default function HealthScorePage() {
    const [scoreResult, setScoreResult] = useState<HealthScoreResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        loadHealthScore();
    }, []);

    useEffect(() => {
        if (scoreResult) {
            // Animate the score counter
            const duration = 2000;
            const steps = 60;
            const increment = scoreResult.score / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= scoreResult.score) {
                    setAnimatedScore(scoreResult.score);
                    clearInterval(timer);
                } else {
                    setAnimatedScore(Math.round(current));
                }
            }, duration / steps);

            return () => clearInterval(timer);
        }
    }, [scoreResult]);

    const loadHealthScore = () => {
        setLoading(true);
        try {
            const data = {
                assets: getAssets(),
                liabilities: getLiabilities(),
                goals: getGoals(),
                stocks: getStockHoldings(),
                mutualFunds: getMFHoldings(),
                profile: getUserProfile(),
            };

            const result = calculateHealthScore(data);
            setScoreResult(result);
        } catch (error) {
            console.error('Error calculating health score:', error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreProgress = (score: number) => {
        // Calculate stroke-dashoffset for the circular progress
        const circumference = 2 * Math.PI * 120; // radius = 120
        const progress = score / 1000;
        return circumference - (progress * circumference);
    };

    const getCategoryColor = (score: number) => {
        if (score >= 800) return '#22c55e';
        if (score >= 650) return '#84cc16';
        if (score >= 500) return '#f59e0b';
        if (score >= 300) return '#f97316';
        return '#ef4444';
    };

    const getCategoryLabel = (score: number) => {
        if (score >= 800) return 'Excellent';
        if (score >= 650) return 'Good';
        if (score >= 500) return 'Fair';
        if (score >= 300) return 'Needs Work';
        return 'Critical';
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <div className={styles.loader} />
                    <p>Calculating your financial health...</p>
                </div>
            </div>
        );
    }

    if (!scoreResult) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <p>Failed to calculate health score. Please try again.</p>
                    <button onClick={loadHealthScore} className={styles.retryButton}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Financial Health Score</h1>
                    <p className={styles.subtitle}>Your comprehensive financial wellness assessment</p>
                </div>
                <button onClick={loadHealthScore} className={styles.refreshButton}>
                    🔄 Refresh
                </button>
            </div>

            <div className={styles.grid}>
                {/* Main Score Card */}
                <div className={styles.scoreCard}>
                    <div className={styles.scoreRing}>
                        <svg className={styles.scoreRingSvg} viewBox="0 0 280 280">
                            <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={scoreResult.gradeColor} />
                                    <stop offset="100%" stopColor={scoreResult.gradeColor} stopOpacity="0.5" />
                                </linearGradient>
                            </defs>
                            <circle
                                className={styles.scoreRingBg}
                                cx="140"
                                cy="140"
                                r="120"
                            />
                            <circle
                                className={styles.scoreRingProgress}
                                cx="140"
                                cy="140"
                                r="120"
                                style={{
                                    stroke: scoreResult.gradeColor,
                                    strokeDashoffset: getScoreProgress(animatedScore),
                                }}
                            />
                        </svg>
                        <div className={styles.scoreValue}>
                            <div className={styles.scoreNumber}>{animatedScore}</div>
                            <div
                                className={styles.scoreGrade}
                                style={{ color: scoreResult.gradeColor }}
                            >
                                {scoreResult.grade}
                            </div>
                            <div className={styles.scoreMax}>out of 1000</div>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className={styles.breakdownCard}>
                    <h2 className={styles.cardTitle}>Score Breakdown</h2>

                    <div className={styles.categoryList}>
                        {[
                            { key: 'savings', label: 'Savings', icon: '💰', score: scoreResult.breakdown.savings },
                            { key: 'debt', label: 'Debt Management', icon: '💳', score: scoreResult.breakdown.debt },
                            { key: 'investments', label: 'Investments', icon: '📈', score: scoreResult.breakdown.investments },
                            { key: 'protection', label: 'Protection', icon: '🛡️', score: scoreResult.breakdown.protection },
                            { key: 'goals', label: 'Goals Progress', icon: '🎯', score: scoreResult.breakdown.goals },
                        ].map(category => {
                            const action = CATEGORY_ACTIONS[category.key];
                            const needsImprovement = category.score < 650;

                            return (
                                <div key={category.key} className={styles.categoryItem}>
                                    <div className={styles.categoryHeader}>
                                        <span className={styles.categoryIcon}>{category.icon}</span>
                                        <span className={styles.categoryLabel}>{category.label}</span>
                                        <span
                                            className={styles.categoryScore}
                                            style={{ color: getCategoryColor(category.score) }}
                                        >
                                            {category.score}
                                        </span>
                                    </div>
                                    <div className={styles.categoryBar}>
                                        <div
                                            className={styles.categoryProgress}
                                            style={{
                                                width: `${(category.score / 1000) * 100}%`,
                                                backgroundColor: getCategoryColor(category.score),
                                            }}
                                        />
                                    </div>
                                    <div className={styles.categoryFooter}>
                                        <span className={styles.categoryStatus}>
                                            {getCategoryLabel(category.score)}
                                        </span>
                                        {needsImprovement && action && (
                                            <Link href={action.href} className={styles.improveButton}>
                                                ✨ {action.label}
                                            </Link>
                                        )}
                                    </div>
                                    {needsImprovement && action && (
                                        <p className={styles.categoryTip}>{action.tip}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className={styles.insightsGrid}>
                {/* Strengths */}
                {scoreResult.strengths.length > 0 && (
                    <div className={styles.insightCard}>
                        <div className={styles.insightHeader}>
                            <span className={styles.insightIcon}>💪</span>
                            <h3 className={styles.insightTitle}>Your Strengths</h3>
                        </div>
                        <ul className={styles.insightList}>
                            {scoreResult.strengths.map((strength, index) => (
                                <li key={index} className={styles.insightItem}>
                                    <span className={styles.insightCheck}>✓</span>
                                    {strength}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Recommendations */}
                {scoreResult.recommendations.length > 0 && (
                    <div className={styles.insightCard}>
                        <div className={styles.insightHeader}>
                            <span className={styles.insightIcon}>💡</span>
                            <h3 className={styles.insightTitle}>Recommendations</h3>
                        </div>
                        <ul className={styles.insightList}>
                            {scoreResult.recommendations.map((rec, index) => (
                                <li key={index} className={styles.insightItem}>
                                    <span className={styles.insightNumber}>{index + 1}</span>
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Score Legend */}
            <div className={styles.legendCard}>
                <h3 className={styles.legendTitle}>Score Guide</h3>
                <div className={styles.legendGrid}>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: '#22c55e' }} />
                        <span className={styles.legendLabel}>800-1000: Excellent</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: '#84cc16' }} />
                        <span className={styles.legendLabel}>650-799: Good</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }} />
                        <span className={styles.legendLabel}>500-649: Fair</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: '#f97316' }} />
                        <span className={styles.legendLabel}>300-499: Needs Work</span>
                    </div>
                    <div className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: '#ef4444' }} />
                        <span className={styles.legendLabel}>0-299: Critical</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
