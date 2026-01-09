'use client';

import { useState, useEffect } from 'react';
import StatCard from '@/components/ui/StatCard';
import AllocationChart from '@/components/charts/AllocationChart';
import TrendChart from '@/components/charts/TrendChart';
import { FinancialHealthDashboard } from '@/components/charts/FinancialGauge';
import WelcomeCard from '@/components/ui/WelcomeCard';
import styles from './page.module.css';
import {
    getAssets,
    getLiabilities,
    getStockHoldings,
    getMFHoldings,
    getGoals,
    getNetWorthSnapshots,
    createNetWorthSnapshot,
    getMonthOverMonthChanges,
    getRecentTransactions,
    getMonthlyTransactionSummary
} from '@/lib/storage';
import {
    formatCurrency,
    formatDate as formatDateUtil,
    CHART_COLORS,
    ASSET_CATEGORY_LABELS,
    LIABILITY_CATEGORY_LABELS,
    TRANSACTION_CATEGORY_LABELS
} from '@/lib/utils';
import type { Transaction } from '@/lib/types';

interface DashboardData {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    investmentValue: number;
    goalsProgress: number;
    assetAllocation: Array<{ name: string; value: number; color: string }>;
    liabilityAllocation: Array<{ name: string; value: number; color: string }>;
    netWorthTrend: Array<{ date: string; value: number }>;
    netWorthChange: number;
    netWorthChangePercent: number;
    healthIndicators: Array<{ id: string; label: string; value: number; sublabel?: string }>;
    // MoM changes
    assetsChange: number;
    assetsChangePercent: number;
    liabilitiesChange: number;
    liabilitiesChangePercent: number;
    investmentsChange: number;
    investmentsChangePercent: number;
    hasMoMData: boolean;
    // Transactions
    recentTransactions: Transaction[];
    monthlyIncome: number;
    monthlyExpense: number;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

    useEffect(() => {
        loadDashboardData();
        createNetWorthSnapshot();

        // Update time every minute
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const loadDashboardData = () => {
        try {
            const assets = getAssets();
            const liabilities = getLiabilities();
            const stocks = getStockHoldings();
            const mfs = getMFHoldings();
            const goals = getGoals();
            const snapshots = getNetWorthSnapshots();

            // Check if this is a first-time user (no data at all)
            const hasNoData = assets.length === 0 && liabilities.length === 0 &&
                stocks.length === 0 && mfs.length === 0 && goals.length === 0;

            setIsFirstTimeUser(hasNoData);

            if (hasNoData) {
                setLoading(false);
                return;
            }

            // Calculate totals
            const totalBaseAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
            const totalStocks = stocks.reduce((sum, s) => sum + (s.quantity * s.average_price), 0);
            const totalMF = mfs.reduce((sum, m) => sum + (m.units * m.average_nav), 0);
            const totalAssets = totalBaseAssets + totalStocks + totalMF;

            const totalLiabilities = liabilities.reduce((sum, l) => sum + l.outstanding_amount, 0);
            const netWorth = totalAssets - totalLiabilities;
            const investmentValue = totalStocks + totalMF;

            // Net worth change calculation
            const sortedSnapshots = [...snapshots].sort((a, b) =>
                new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
            );
            const previousSnapshot = sortedSnapshots[1];
            const netWorthChange = previousSnapshot ? netWorth - previousSnapshot.net_worth : 0;
            const netWorthChangePercent = previousSnapshot && previousSnapshot.net_worth !== 0
                ? (netWorthChange / previousSnapshot.net_worth) * 100
                : 0;

            // Goals progress
            const goalsProgress = goals.length > 0
                ? (goals.reduce((sum, g) => sum + Math.min(g.current_amount / g.target_amount, 1), 0) / goals.length) * 100
                : 0;

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

            // Net worth trend
            const netWorthTrend = snapshots
                .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime())
                .slice(-30)
                .map(s => ({
                    date: s.snapshot_date,
                    value: s.net_worth,
                }));

            // Calculate financial health indicators
            // 1. Debt-to-Asset Ratio (lower is better, 0% = 100 score, 100%+ = 0 score)
            const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
            const debtScore = Math.max(0, 100 - debtToAssetRatio);

            // 2. Emergency Fund (assuming 6 months expenses = savings goal, using 10% of assets as monthly expense estimate)
            const estimatedMonthlyExpense = totalAssets * 0.02; // 2% of assets as rough monthly expense
            const liquidAssets = assets
                .filter(a => ['savings', 'checking', 'cash', 'emergency_fund'].includes(a.category))
                .reduce((sum, a) => sum + a.current_value, 0);
            const emergencyMonths = estimatedMonthlyExpense > 0 ? liquidAssets / estimatedMonthlyExpense : 0;
            const emergencyScore = Math.min(100, (emergencyMonths / 6) * 100);

            // 3. Investment Diversification Score
            const investmentCategories = Object.keys(assetByCategory).length;
            const diversificationScore = Math.min(100, investmentCategories * 20); // 5+ categories = 100

            // 4. Goals Progress Score
            const goalsScore = goalsProgress;

            const healthIndicators = [
                {
                    id: 'debt',
                    label: 'Debt-to-Asset Ratio',
                    value: debtScore,
                    sublabel: `${debtToAssetRatio.toFixed(1)}% of assets`
                },
                {
                    id: 'emergency',
                    label: 'Emergency Fund',
                    value: emergencyScore,
                    sublabel: `${emergencyMonths.toFixed(1)} months coverage`
                },
                {
                    id: 'diversification',
                    label: 'Diversification',
                    value: diversificationScore,
                    sublabel: `${investmentCategories} asset categories`
                },
                {
                    id: 'goals',
                    label: 'Goals Progress',
                    value: goalsScore,
                    sublabel: `${goals.length} active goals`
                }
            ];

            // Get MoM changes
            const momChanges = getMonthOverMonthChanges();

            // Get recent transactions and monthly summary
            const recentTransactions = getRecentTransactions(5);
            const now = new Date();
            const monthSummary = getMonthlyTransactionSummary(now.getFullYear(), now.getMonth());

            setData({
                totalAssets,
                totalLiabilities,
                netWorth,
                investmentValue,
                goalsProgress,
                assetAllocation,
                liabilityAllocation,
                netWorthTrend,
                netWorthChange,
                netWorthChangePercent,
                healthIndicators,
                // MoM data
                assetsChange: momChanges.assetsChange,
                assetsChangePercent: momChanges.assetsChangePercent,
                liabilitiesChange: momChanges.liabilitiesChange,
                liabilitiesChangePercent: momChanges.liabilitiesChangePercent,
                investmentsChange: momChanges.investmentsChange,
                investmentsChangePercent: momChanges.investmentsChangePercent,
                hasMoMData: momChanges.hasPreviousData,
                // Transactions
                recentTransactions,
                monthlyIncome: monthSummary.income,
                monthlyExpense: monthSummary.expense,
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="loader loader-lg"></div>
                <p>Loading your portfolio...</p>
            </div>
        );
    }

    // Show welcome card for first-time users
    if (isFirstTimeUser) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span className={styles.greeting}>{getGreeting()}</span>
                        <h1 className={styles.title}>Portfolio Overview</h1>
                        <p className={styles.subtitle}>Your complete financial snapshot</p>
                    </div>
                    <div className={styles.headerRight}>
                        <div className={styles.dateTime}>
                            <div className={styles.date}>{formatDate(currentTime)}</div>
                            <div className={styles.time}>{formatTime(currentTime)}</div>
                        </div>
                    </div>
                </div>
                <WelcomeCard onDataLoaded={loadDashboardData} />
            </div>
        );
    }

    if (!data) {
        return (
            <div className={styles.error}>
                <p>Failed to load dashboard data</p>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.greeting}>{getGreeting()}</span>
                    <h1 className={styles.title}>Portfolio Overview</h1>
                    <p className={styles.subtitle}>Your complete financial snapshot</p>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.dateTime}>
                        <div className={styles.date}>{formatDate(currentTime)}</div>
                        <div className={styles.time}>{formatTime(currentTime)}</div>
                    </div>
                </div>
            </div>

            {/* Net Worth Hero */}
            <div className={styles.netWorthHero}>
                <div className={styles.netWorthContent}>
                    <div className={styles.netWorthLabel}>Total Net Worth</div>
                    <div className={styles.netWorthValue}>{formatCurrency(data.netWorth)}</div>
                    {data.netWorthChange !== 0 && (
                        <div className={`${styles.netWorthChange} ${data.netWorthChange >= 0 ? styles.positive : styles.negative}`}>
                            <span>{data.netWorthChange >= 0 ? '↑' : '↓'}</span>
                            <span>{formatCurrency(Math.abs(data.netWorthChange), 'INR', true)}</span>
                            <span>({data.netWorthChangePercent >= 0 ? '+' : ''}{data.netWorthChangePercent.toFixed(2)}%)</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <StatCard
                    label="Total Assets"
                    value={data.totalAssets}
                    change={data.hasMoMData ? data.assetsChange : undefined}
                    changePercent={data.hasMoMData ? data.assetsChangePercent : undefined}
                    icon="💰"
                    iconColor="green"
                />
                <StatCard
                    label="Total Liabilities"
                    value={data.totalLiabilities}
                    change={data.hasMoMData ? data.liabilitiesChange : undefined}
                    changePercent={data.hasMoMData ? data.liabilitiesChangePercent : undefined}
                    icon="💳"
                    iconColor="red"
                    trend={data.liabilitiesChange <= 0 ? 'up' : 'down'}
                />
                <StatCard
                    label="Investments"
                    value={data.investmentValue}
                    change={data.hasMoMData ? data.investmentsChange : undefined}
                    changePercent={data.hasMoMData ? data.investmentsChangePercent : undefined}
                    icon="📈"
                    iconColor="blue"
                />
                <StatCard
                    label="Goals Progress"
                    value={data.goalsProgress}
                    format="percent"
                    icon="🎯"
                    iconColor="purple"
                    trend="neutral"
                />
            </div>

            {/* Charts Row */}
            <div className={styles.chartsRow}>
                <div className={styles.trendChartContainer}>
                    <TrendChart
                        data={data.netWorthTrend}
                        title="Net Worth Evolution"
                        height={280}
                    />
                </div>

                <div className={styles.allocationContainer}>
                    <AllocationChart
                        data={data.assetAllocation}
                        title="Asset Allocation"
                    />
                </div>
            </div>

            {/* Secondary Row */}
            <div className={styles.secondaryRow}>
                <FinancialHealthDashboard indicators={data.healthIndicators} />

                <div className={styles.liabilityChartContainer}>
                    <AllocationChart
                        data={data.liabilityAllocation}
                        title="Liability Distribution"
                    />
                </div>

                <div className={styles.quickActions}>
                    <h3 className={styles.sectionTitle}>Quick Actions</h3>
                    <div className={styles.actionButtons}>
                        <a href="/assets" className={styles.actionButton}>
                            <span className={styles.actionIcon}>➕</span>
                            <span>Add Asset</span>
                        </a>
                        <a href="/health-score" className={styles.actionButton}>
                            <span className={styles.actionIcon}>💪</span>
                            <span>Health Score</span>
                        </a>
                        <a href="/analytics" className={styles.actionButton}>
                            <span className={styles.actionIcon}>📊</span>
                            <span>Analytics</span>
                        </a>
                        <a href="/invest" className={styles.actionButton}>
                            <span className={styles.actionIcon}>💹</span>
                            <span>Invest</span>
                        </a>
                        <a href="/retirement" className={styles.actionButton}>
                            <span className={styles.actionIcon}>🏖️</span>
                            <span>Retirement</span>
                        </a>
                        <a href="/calculators" className={styles.actionButton}>
                            <span className={styles.actionIcon}>🧮</span>
                            <span>Calculators</span>
                        </a>
                    </div>
                </div>

                <div className={styles.goalsProgress}>
                    <h3 className={styles.sectionTitle}>Goals Progress</h3>
                    <div className={styles.progressContainer}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${Math.min(data.goalsProgress, 100)}%` }}
                            />
                        </div>
                        <span className={styles.progressText}>
                            {data.goalsProgress.toFixed(0)}% Complete
                        </span>
                    </div>
                    <a href="/goals" className={styles.viewGoalsLink}>
                        View all goals →
                    </a>
                </div>
            </div>

            {/* Transactions Row */}
            <div className={styles.transactionsRow}>
                {/* Monthly Cashflow */}
                <div className={styles.cashflowCard}>
                    <h3 className={styles.sectionTitle}>Monthly Cashflow</h3>
                    <div className={styles.cashflowGrid}>
                        <div className={styles.cashflowItem}>
                            <span className={styles.cashflowLabel}>Income</span>
                            <span className={styles.cashflowValue} style={{ color: '#22c55e' }}>
                                +{formatCurrency(data.monthlyIncome)}
                            </span>
                        </div>
                        <div className={styles.cashflowItem}>
                            <span className={styles.cashflowLabel}>Expense</span>
                            <span className={styles.cashflowValue} style={{ color: '#ef4444' }}>
                                -{formatCurrency(data.monthlyExpense)}
                            </span>
                        </div>
                        <div className={styles.cashflowItem}>
                            <span className={styles.cashflowLabel}>Net</span>
                            <span className={styles.cashflowValue} style={{
                                color: (data.monthlyIncome - data.monthlyExpense) >= 0 ? '#22c55e' : '#ef4444'
                            }}>
                                {formatCurrency(data.monthlyIncome - data.monthlyExpense)}
                            </span>
                        </div>
                    </div>
                    <a href="/transactions" className={styles.viewGoalsLink}>
                        Manage transactions →
                    </a>
                </div>

                {/* Recent Transactions */}
                <div className={styles.recentTransactions}>
                    <h3 className={styles.sectionTitle}>Recent Transactions</h3>
                    {data.recentTransactions.length === 0 ? (
                        <div className={styles.emptyTransactions}>
                            <p>No transactions yet</p>
                            <a href="/transactions" className={styles.addTransactionLink}>
                                Add your first transaction →
                            </a>
                        </div>
                    ) : (
                        <>
                            <div className={styles.transactionsList}>
                                {data.recentTransactions.map(tx => (
                                    <div key={tx.id} className={styles.transactionItem}>
                                        <div className={styles.transactionLeft}>
                                            <span className={`${styles.transactionIcon} ${tx.type === 'income' ? styles.income : styles.expense}`}>
                                                {tx.type === 'income' ? '↑' : '↓'}
                                            </span>
                                            <div className={styles.transactionInfo}>
                                                <span className={styles.transactionDesc}>{tx.description}</span>
                                                <span className={styles.transactionMeta}>
                                                    {TRANSACTION_CATEGORY_LABELS[tx.category]} • {formatDateUtil(tx.date, 'short')}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`${styles.transactionAmount} ${tx.type === 'income' ? styles.income : styles.expense}`}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <a href="/transactions" className={styles.viewGoalsLink}>
                                View all transactions →
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
