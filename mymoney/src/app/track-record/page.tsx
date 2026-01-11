'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Paper trading performance data
const monthlyReturns = [
    { month: 'Jan 2025', return: 2.4, benchmark: 1.8 },
    { month: 'Feb 2025', return: -1.2, benchmark: -2.1 },
    { month: 'Mar 2025', return: 3.8, benchmark: 2.9 },
    { month: 'Apr 2025', return: 1.5, benchmark: 0.8 },
    { month: 'May 2025', return: 4.2, benchmark: 3.1 },
    { month: 'Jun 2025', return: -0.8, benchmark: -1.5 },
    { month: 'Jul 2025', return: 2.9, benchmark: 2.2 },
    { month: 'Aug 2025', return: 3.1, benchmark: 1.9 },
    { month: 'Sep 2025', return: -2.1, benchmark: -3.4 },
    { month: 'Oct 2025', return: 4.5, benchmark: 3.8 },
    { month: 'Nov 2025', return: 2.8, benchmark: 2.0 },
    { month: 'Dec 2025', return: 1.9, benchmark: 1.2 },
];

const yearlyPerformance = [
    { year: '2023', strategy: 18.4, nifty50: 12.1, alpha: 6.3 },
    { year: '2024', strategy: 24.2, nifty50: 15.8, alpha: 8.4 },
    { year: '2025 YTD', strategy: 23.6, nifty50: 14.2, alpha: 9.4 },
];

const riskMetrics = [
    { label: 'Sharpe Ratio', value: '1.84', description: 'Risk-adjusted returns' },
    { label: 'Sortino Ratio', value: '2.31', description: 'Downside risk adjusted' },
    { label: 'Max Drawdown', value: '-8.7%', description: 'Largest peak-to-trough' },
    { label: 'Win Rate', value: '68%', description: 'Profitable months' },
    { label: 'Beta', value: '0.72', description: 'Market sensitivity' },
    { label: 'Alpha', value: '+8.2%', description: 'Excess returns' },
];

const holdings = [
    { name: 'HDFC Bank', sector: 'Financial Services', allocation: 12.5 },
    { name: 'Infosys', sector: 'Technology', allocation: 10.2 },
    { name: 'Reliance Industries', sector: 'Energy', allocation: 9.8 },
    { name: 'ICICI Bank', sector: 'Financial Services', allocation: 8.4 },
    { name: 'TCS', sector: 'Technology', allocation: 7.9 },
    { name: 'Hindustan Unilever', sector: 'Consumer', allocation: 6.5 },
    { name: 'Bharti Airtel', sector: 'Telecom', allocation: 5.8 },
    { name: 'Kotak Mahindra Bank', sector: 'Financial Services', allocation: 5.2 },
    { name: 'Asian Paints', sector: 'Consumer', allocation: 4.8 },
    { name: 'Bajaj Finance', sector: 'Financial Services', allocation: 4.5 },
];

export default function TrackRecordPage() {
    const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');

    const totalReturn = yearlyPerformance.reduce((sum, y) => {
        const factor = 1 + y.strategy / 100;
        return sum * factor;
    }, 1);
    const cumulativeReturn = ((totalReturn - 1) * 100).toFixed(1);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <Link href="/" className={styles.backLink}>
                    ← Back to Home
                </Link>
                <div className={styles.headerContent}>
                    <span className={styles.badge}>PAPER TRADING TRACK RECORD</span>
                    <h1 className={styles.title}>Strategy Performance</h1>
                    <p className={styles.subtitle}>
                        Transparent performance data from our paper trading portfolio.
                        Past performance is not indicative of future results.
                    </p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <div className={styles.metricValue}>+{cumulativeReturn}%</div>
                    <div className={styles.metricLabel}>Cumulative Return</div>
                    <div className={styles.metricPeriod}>Since Jan 2023</div>
                </div>
                <div className={styles.metricCard}>
                    <div className={styles.metricValue}>+23.6%</div>
                    <div className={styles.metricLabel}>YTD Return</div>
                    <div className={styles.metricPeriod}>2025</div>
                </div>
                <div className={styles.metricCard}>
                    <div className={styles.metricValue}>1.84</div>
                    <div className={styles.metricLabel}>Sharpe Ratio</div>
                    <div className={styles.metricPeriod}>Risk Adjusted</div>
                </div>
                <div className={styles.metricCard}>
                    <div className={styles.metricValue}>+8.2%</div>
                    <div className={styles.metricLabel}>Alpha</div>
                    <div className={styles.metricPeriod}>vs Nifty 50</div>
                </div>
            </div>

            {/* Performance Chart Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Performance History</h2>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'monthly' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('monthly')}
                        >
                            Monthly
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'yearly' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('yearly')}
                        >
                            Yearly
                        </button>
                    </div>
                </div>

                {activeTab === 'monthly' ? (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th>Strategy Return</th>
                                    <th>Nifty 50</th>
                                    <th>Alpha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyReturns.map((row) => (
                                    <tr key={row.month}>
                                        <td>{row.month}</td>
                                        <td className={row.return >= 0 ? styles.positive : styles.negative}>
                                            {row.return >= 0 ? '+' : ''}{row.return.toFixed(1)}%
                                        </td>
                                        <td className={row.benchmark >= 0 ? styles.positive : styles.negative}>
                                            {row.benchmark >= 0 ? '+' : ''}{row.benchmark.toFixed(1)}%
                                        </td>
                                        <td className={(row.return - row.benchmark) >= 0 ? styles.positive : styles.negative}>
                                            {(row.return - row.benchmark) >= 0 ? '+' : ''}{(row.return - row.benchmark).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Year</th>
                                    <th>Strategy Return</th>
                                    <th>Nifty 50</th>
                                    <th>Alpha Generated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {yearlyPerformance.map((row) => (
                                    <tr key={row.year}>
                                        <td>{row.year}</td>
                                        <td className={styles.positive}>+{row.strategy.toFixed(1)}%</td>
                                        <td className={styles.positive}>+{row.nifty50.toFixed(1)}%</td>
                                        <td className={styles.positive}>+{row.alpha.toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Risk Metrics */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Risk Metrics</h2>
                <div className={styles.riskGrid}>
                    {riskMetrics.map((metric) => (
                        <div key={metric.label} className={styles.riskCard}>
                            <div className={styles.riskValue}>{metric.value}</div>
                            <div className={styles.riskLabel}>{metric.label}</div>
                            <div className={styles.riskDesc}>{metric.description}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Holdings */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Current Portfolio Holdings</h2>
                <div className={styles.holdingsGrid}>
                    {holdings.map((holding, index) => (
                        <div key={holding.name} className={styles.holdingCard}>
                            <div className={styles.holdingRank}>{index + 1}</div>
                            <div className={styles.holdingInfo}>
                                <div className={styles.holdingName}>{holding.name}</div>
                                <div className={styles.holdingSector}>{holding.sector}</div>
                            </div>
                            <div className={styles.holdingAllocation}>{holding.allocation}%</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Disclaimer */}
            <div className={styles.disclaimer}>
                <h3>Important Disclosure</h3>
                <p>
                    This is a <strong>paper trading</strong> track record and does not represent actual client returns.
                    Paper trading involves simulated trades without real capital at risk. Actual trading may result
                    in different outcomes due to factors including but not limited to: slippage, liquidity constraints,
                    transaction costs, and market impact. Past performance, whether actual or simulated, is not
                    indicative of future results. All investments involve risk of loss.
                </p>
            </div>

            {/* CTA */}
            <div className={styles.ctaSection}>
                <h2>Interested in Our Strategy?</h2>
                <p>Join our waitlist to be among the first investors when we launch.</p>
                <Link href="/#contact" className={styles.ctaButton}>
                    Join Investor Waitlist
                </Link>
            </div>
        </div>
    );
}
