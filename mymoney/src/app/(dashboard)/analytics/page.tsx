'use client';

import { useState, useEffect } from 'react';
import TrendChart from '@/components/charts/TrendChart';
import AllocationChart from '@/components/charts/AllocationChart';
import styles from './page.module.css';
import {
    getAssets,
    getLiabilities,
    getStockHoldings,
    getMFHoldings,
    getGoals,
    getNetWorthSnapshots
} from '@/lib/storage';
import {
    formatCurrency,
    CHART_COLORS,
    ASSET_CATEGORY_LABELS,
    LIABILITY_CATEGORY_LABELS
} from '@/lib/utils';
import {
    exportAssetsCSV,
    exportLiabilitiesCSV,
    exportInvestmentsCSV,
    exportTransactionsCSV,
    exportGoalsCSV,
    generateNetWorthReport
} from '@/lib/export';
import { getTransactions } from '@/lib/storage';
import type { Asset, Liability, StockHolding, MFHolding, Goal, Transaction } from '@/lib/types';

interface AnalyticsData {
    netWorthTrend: Array<{ date: string; value: number }>;
    assetTrend: Array<{ date: string; value: number }>;
    liabilityTrend: Array<{ date: string; value: number }>;
    assetAllocation: Array<{ name: string; value: number; color: string }>;
    liabilityAllocation: Array<{ name: string; value: number; color: string }>;
    investmentAllocation: Array<{ name: string; value: number; color: string }>;
    keyMetrics: {
        netWorth: number;
        netWorthChange: number;
        totalAssets: number;
        totalLiabilities: number;
        debtToAssetRatio: number;
        investmentRatio: number;
        goalsProgress: number;
        monthlyEmi: number;
    };
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '365d'>('30d');
    const [rawData, setRawData] = useState<{
        assets: Asset[];
        liabilities: Liability[];
        stocks: StockHolding[];
        mfs: MFHolding[];
        goals: Goal[];
        transactions: Transaction[];
    } | null>(null);

    useEffect(() => {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = () => {
        try {
            const assets = getAssets();
            const liabilities = getLiabilities();
            const stocks = getStockHoldings();
            const mfs = getMFHoldings();
            const goals = getGoals();
            const snapshots = getNetWorthSnapshots();
            const transactions = getTransactions();

            // Store raw data for exports
            setRawData({ assets, liabilities, stocks, mfs, goals, transactions });

            // Calculate totals
            const totalBaseAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
            const totalStocks = stocks.reduce((sum, s) => sum + (s.quantity * s.average_price), 0);
            const totalMF = mfs.reduce((sum, m) => sum + (m.units * m.average_nav), 0);
            const totalAssets = totalBaseAssets + totalStocks + totalMF;
            const totalLiabilities = liabilities.reduce((sum, l) => sum + l.outstanding_amount, 0);
            const netWorth = totalAssets - totalLiabilities;
            const monthlyEmi = liabilities.reduce((sum, l) => sum + (l.emi_amount || 0), 0);

            // Filter snapshots by time range
            const daysMap = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
            const days = daysMap[timeRange];
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const filteredSnapshots = snapshots
                .filter(s => new Date(s.snapshot_date) >= cutoffDate)
                .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime());

            // Net worth change
            const oldestSnapshot = filteredSnapshots[0];
            const netWorthChange = oldestSnapshot
                ? netWorth - oldestSnapshot.net_worth
                : 0;

            // Build trend data
            const netWorthTrend = filteredSnapshots.map(s => ({
                date: s.snapshot_date,
                value: s.net_worth,
            }));

            const assetTrend = filteredSnapshots.map(s => ({
                date: s.snapshot_date,
                value: s.total_assets,
            }));

            const liabilityTrend = filteredSnapshots.map(s => ({
                date: s.snapshot_date,
                value: s.total_liabilities,
            }));

            // Asset allocation
            const assetByCategory: Record<string, number> = {};
            assets.forEach(a => {
                assetByCategory[a.category] = (assetByCategory[a.category] || 0) + a.current_value;
            });
            if (totalStocks > 0) assetByCategory['stocks'] = totalStocks;
            if (totalMF > 0) assetByCategory['mutual_funds'] = totalMF;

            const assetAllocation = Object.entries(assetByCategory).map(([key, value], index) => ({
                name: key === 'stocks' ? 'Stocks' : key === 'mutual_funds' ? 'Mutual Funds' : ASSET_CATEGORY_LABELS[key] || key,
                value,
                color: CHART_COLORS.assets[key as keyof typeof CHART_COLORS.assets] || CHART_COLORS.primary[index % CHART_COLORS.primary.length],
            }));

            // Liability allocation
            const liabilityByCategory: Record<string, number> = {};
            liabilities.forEach(l => {
                liabilityByCategory[l.category] = (liabilityByCategory[l.category] || 0) + l.outstanding_amount;
            });

            const liabilityAllocation = Object.entries(liabilityByCategory).map(([key, value], index) => ({
                name: LIABILITY_CATEGORY_LABELS[key] || key,
                value,
                color: CHART_COLORS.liabilities[key as keyof typeof CHART_COLORS.liabilities] || CHART_COLORS.primary[index % CHART_COLORS.primary.length],
            }));

            // Investment allocation
            const investmentAllocation = [];
            if (totalStocks > 0) {
                investmentAllocation.push({
                    name: 'Stocks',
                    value: totalStocks,
                    color: CHART_COLORS.primary[0]
                });
            }
            if (totalMF > 0) {
                investmentAllocation.push({
                    name: 'Mutual Funds',
                    value: totalMF,
                    color: CHART_COLORS.primary[1]
                });
            }

            // Key metrics
            const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
            const investmentRatio = totalAssets > 0 ? ((totalStocks + totalMF) / totalAssets) * 100 : 0;
            const goalsProgress = goals.length > 0
                ? (goals.reduce((sum, g) => sum + Math.min(g.current_amount / g.target_amount, 1), 0) / goals.length) * 100
                : 0;

            setData({
                netWorthTrend,
                assetTrend,
                liabilityTrend,
                assetAllocation,
                liabilityAllocation,
                investmentAllocation,
                keyMetrics: {
                    netWorth,
                    netWorthChange,
                    totalAssets,
                    totalLiabilities,
                    debtToAssetRatio,
                    investmentRatio,
                    goalsProgress,
                    monthlyEmi,
                },
            });
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="loader loader-lg"></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className={styles.error}>
                <p>Failed to load analytics data</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Analytics & Reports</h1>
                    <p className={styles.subtitle}>Detailed insights into your financial health</p>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.exportDropdown}>
                        <button className={styles.exportButton}>
                            📊 Export Data
                        </button>
                        <div className={styles.exportMenu}>
                            <button
                                onClick={() => rawData && generateNetWorthReport({
                                    totalAssets: data.keyMetrics.totalAssets,
                                    totalLiabilities: data.keyMetrics.totalLiabilities,
                                    netWorth: data.keyMetrics.netWorth,
                                    assets: rawData.assets,
                                    liabilities: rawData.liabilities,
                                    stocks: rawData.stocks,
                                    mfs: rawData.mfs,
                                    goals: rawData.goals,
                                })}
                            >
                                📄 Net Worth Report (PDF)
                            </button>
                            <button onClick={() => rawData && exportTransactionsCSV(rawData.transactions)}>
                                💰 Transactions (CSV)
                            </button>
                            <button onClick={() => rawData && exportAssetsCSV(rawData.assets)}>
                                📦 Assets (CSV)
                            </button>
                            <button onClick={() => rawData && exportLiabilitiesCSV(rawData.liabilities)}>
                                💳 Liabilities (CSV)
                            </button>
                            <button onClick={() => rawData && exportInvestmentsCSV(rawData.stocks, rawData.mfs)}>
                                📈 Investments (CSV)
                            </button>
                            <button onClick={() => rawData && exportGoalsCSV(rawData.goals)}>
                                🎯 Goals (CSV)
                            </button>
                        </div>
                    </div>
                    <div className={styles.timeRangeSelector}>
                        {(['7d', '30d', '90d', '365d'] as const).map(range => (
                            <button
                                key={range}
                                className={`${styles.timeButton} ${timeRange === range ? styles.active : ''}`}
                                onClick={() => setTimeRange(range)}
                            >
                                {range === '7d' ? '7D' : range === '30d' ? '30D' : range === '90d' ? '90D' : '1Y'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Net Worth</span>
                    <span className={`${styles.metricValue} ${data.keyMetrics.netWorth >= 0 ? styles.positive : styles.negative}`}>
                        {formatCurrency(data.keyMetrics.netWorth)}
                    </span>
                    <span className={`${styles.metricChange} ${data.keyMetrics.netWorthChange >= 0 ? styles.positive : styles.negative}`}>
                        {data.keyMetrics.netWorthChange >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(data.keyMetrics.netWorthChange))}
                    </span>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Debt-to-Asset Ratio</span>
                    <span className={styles.metricValue}>
                        {data.keyMetrics.debtToAssetRatio.toFixed(1)}%
                    </span>
                    <span className={styles.metricHint}>
                        {data.keyMetrics.debtToAssetRatio < 30 ? '✓ Healthy' : data.keyMetrics.debtToAssetRatio < 50 ? '⚠ Moderate' : '⚠ High'}
                    </span>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Investment Ratio</span>
                    <span className={styles.metricValue}>
                        {data.keyMetrics.investmentRatio.toFixed(1)}%
                    </span>
                    <span className={styles.metricHint}>of total assets</span>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricLabel}>Monthly EMI</span>
                    <span className={styles.metricValue}>
                        {formatCurrency(data.keyMetrics.monthlyEmi)}
                    </span>
                    <span className={styles.metricHint}>loan payments</span>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className={styles.chartsRow}>
                <div className={styles.chartLarge}>
                    <TrendChart
                        data={data.netWorthTrend}
                        title="Net Worth Trend"
                        height={300}
                    />
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className={styles.chartsRow}>
                <div className={styles.chartMedium}>
                    <TrendChart
                        data={data.assetTrend}
                        title="Total Assets"
                        color="#22c55e"
                        gradientFrom="rgba(34, 197, 94, 0.3)"
                        gradientTo="rgba(34, 197, 94, 0)"
                        height={250}
                    />
                </div>
                <div className={styles.chartMedium}>
                    <TrendChart
                        data={data.liabilityTrend}
                        title="Total Liabilities"
                        color="#ef4444"
                        gradientFrom="rgba(239, 68, 68, 0.3)"
                        gradientTo="rgba(239, 68, 68, 0)"
                        height={250}
                    />
                </div>
            </div>

            {/* Allocation Charts */}
            <div className={styles.allocationRow}>
                <div className={styles.allocationCard}>
                    <AllocationChart
                        data={data.assetAllocation}
                        title="Asset Allocation"
                    />
                </div>
                <div className={styles.allocationCard}>
                    <AllocationChart
                        data={data.liabilityAllocation}
                        title="Liability Distribution"
                    />
                </div>
                <div className={styles.allocationCard}>
                    <AllocationChart
                        data={data.investmentAllocation}
                        title="Investment Mix"
                    />
                </div>
            </div>

            {/* Financial Health Score */}
            <div className={styles.healthSection}>
                <h2 className={styles.sectionTitle}>Financial Health Score</h2>
                <div className={styles.healthGrid}>
                    <div className={styles.healthItem}>
                        <div className={styles.healthLabel}>Debt Management</div>
                        <div className={styles.healthBar}>
                            <div
                                className={styles.healthFill}
                                style={{
                                    width: `${Math.max(0, 100 - data.keyMetrics.debtToAssetRatio)}%`,
                                    background: data.keyMetrics.debtToAssetRatio < 30 ? 'var(--color-accent-green)' :
                                        data.keyMetrics.debtToAssetRatio < 50 ? 'var(--color-warning)' : 'var(--color-accent-red)'
                                }}
                            />
                        </div>
                        <span className={styles.healthScore}>{Math.max(0, 100 - data.keyMetrics.debtToAssetRatio).toFixed(0)}/100</span>
                    </div>

                    <div className={styles.healthItem}>
                        <div className={styles.healthLabel}>Investment Portfolio</div>
                        <div className={styles.healthBar}>
                            <div
                                className={styles.healthFill}
                                style={{
                                    width: `${Math.min(data.keyMetrics.investmentRatio * 2, 100)}%`,
                                    background: data.keyMetrics.investmentRatio > 30 ? 'var(--color-accent-green)' :
                                        data.keyMetrics.investmentRatio > 15 ? 'var(--color-warning)' : 'var(--color-accent-red)'
                                }}
                            />
                        </div>
                        <span className={styles.healthScore}>{Math.min(data.keyMetrics.investmentRatio * 2, 100).toFixed(0)}/100</span>
                    </div>

                    <div className={styles.healthItem}>
                        <div className={styles.healthLabel}>Goals Progress</div>
                        <div className={styles.healthBar}>
                            <div
                                className={styles.healthFill}
                                style={{
                                    width: `${data.keyMetrics.goalsProgress}%`,
                                    background: 'var(--color-accent-gold)'
                                }}
                            />
                        </div>
                        <span className={styles.healthScore}>{data.keyMetrics.goalsProgress.toFixed(0)}/100</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
