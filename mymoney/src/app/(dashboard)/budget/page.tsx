'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { getUserProfile, updateUserProfile } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';

interface BudgetCategory {
    id: string;
    name: string;
    icon: string;
    allocated: number;
    spent: number;
    type: 'needs' | 'wants' | 'savings';
}

const BUDGET_CATEGORIES: BudgetCategory[] = [
    { id: 'housing', name: 'Housing & Rent', icon: '🏠', allocated: 0, spent: 0, type: 'needs' },
    { id: 'utilities', name: 'Utilities', icon: '💡', allocated: 0, spent: 0, type: 'needs' },
    { id: 'groceries', name: 'Groceries', icon: '🛒', allocated: 0, spent: 0, type: 'needs' },
    { id: 'transport', name: 'Transportation', icon: '🚗', allocated: 0, spent: 0, type: 'needs' },
    { id: 'insurance', name: 'Insurance', icon: '🛡️', allocated: 0, spent: 0, type: 'needs' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥', allocated: 0, spent: 0, type: 'needs' },
    { id: 'dining', name: 'Dining Out', icon: '🍽️', allocated: 0, spent: 0, type: 'wants' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', allocated: 0, spent: 0, type: 'wants' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', allocated: 0, spent: 0, type: 'wants' },
    { id: 'subscriptions', name: 'Subscriptions', icon: '📱', allocated: 0, spent: 0, type: 'wants' },
    { id: 'travel', name: 'Travel', icon: '✈️', allocated: 0, spent: 0, type: 'wants' },
    { id: 'investments', name: 'Investments', icon: '📈', allocated: 0, spent: 0, type: 'savings' },
    { id: 'emergency', name: 'Emergency Fund', icon: '🆘', allocated: 0, spent: 0, type: 'savings' },
    { id: 'goals', name: 'Goal Savings', icon: '🎯', allocated: 0, spent: 0, type: 'savings' },
];

const STORAGE_KEY = 'mymoney_budget';

export default function BudgetPage() {
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [categories, setCategories] = useState<BudgetCategory[]>(BUDGET_CATEGORIES);
    const [activeTab, setActiveTab] = useState<'overview' | 'allocate'>('overview');
    const [budgetRule, setBudgetRule] = useState<'503020' | 'custom'>('503020');

    useEffect(() => {
        const profile = getUserProfile();
        if (profile.monthly_income) {
            setMonthlyIncome(profile.monthly_income);
        }

        // Load saved budget
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsedCategories = JSON.parse(saved);
                setCategories(parsedCategories);
            } catch (e) {
                console.error('Failed to parse budget data');
            }
        }
    }, []);

    const saveBudget = (updatedCategories: BudgetCategory[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCategories));
        setCategories(updatedCategories);
    };

    const apply503020Rule = () => {
        if (monthlyIncome <= 0) return;

        const needs = monthlyIncome * 0.5;
        const wants = monthlyIncome * 0.3;
        const savings = monthlyIncome * 0.2;

        const needsCategories = categories.filter(c => c.type === 'needs');
        const wantsCategories = categories.filter(c => c.type === 'wants');
        const savingsCategories = categories.filter(c => c.type === 'savings');

        const perNeed = needs / needsCategories.length;
        const perWant = wants / wantsCategories.length;
        const perSaving = savings / savingsCategories.length;

        const updated = categories.map(c => ({
            ...c,
            allocated: c.type === 'needs' ? perNeed : c.type === 'wants' ? perWant : perSaving,
        }));

        saveBudget(updated);
        setBudgetRule('503020');
    };

    const updateAllocation = (id: string, value: number) => {
        const updated = categories.map(c =>
            c.id === id ? { ...c, allocated: value } : c
        );
        saveBudget(updated);
        setBudgetRule('custom');
    };

    const updateSpent = (id: string, value: number) => {
        const updated = categories.map(c =>
            c.id === id ? { ...c, spent: value } : c
        );
        saveBudget(updated);
    };

    const saveIncome = () => {
        updateUserProfile({ monthly_income: monthlyIncome });
    };

    // Calculations
    const totalAllocated = categories.reduce((sum, c) => sum + c.allocated, 0);
    const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
    const remaining = monthlyIncome - totalAllocated;
    const budgetUsed = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    const needsTotal = categories.filter(c => c.type === 'needs').reduce((sum, c) => sum + c.allocated, 0);
    const wantsTotal = categories.filter(c => c.type === 'wants').reduce((sum, c) => sum + c.allocated, 0);
    const savingsTotal = categories.filter(c => c.type === 'savings').reduce((sum, c) => sum + c.allocated, 0);

    const getProgressColor = (spent: number, allocated: number) => {
        if (allocated === 0) return 'var(--color-text-muted)';
        const ratio = spent / allocated;
        if (ratio >= 1) return 'var(--color-accent-red)';
        if (ratio >= 0.8) return 'var(--color-warning)';
        return 'var(--color-accent-green)';
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Smart Budget</h1>
                    <p className={styles.subtitle}>Plan and track your monthly spending</p>
                </div>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'allocate' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('allocate')}
                    >
                        Allocate
                    </button>
                </div>
            </div>

            {/* Income Section */}
            <div className={styles.incomeCard}>
                <div className={styles.incomeHeader}>
                    <span className={styles.incomeIcon}>💵</span>
                    <span className={styles.incomeLabel}>Monthly Income</span>
                </div>
                <div className={styles.incomeInput}>
                    <span className={styles.currencySymbol}>₹</span>
                    <input
                        type="number"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                        onBlur={saveIncome}
                        className={styles.incomeValue}
                    />
                </div>
                <div className={styles.incomeActions}>
                    <button
                        className={`${styles.ruleButton} ${budgetRule === '503020' ? styles.ruleButtonActive : ''}`}
                        onClick={apply503020Rule}
                    >
                        Apply 50/30/20 Rule
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>Needs (50%)</div>
                    <div className={styles.summaryValue}>{formatCurrency(needsTotal)}</div>
                    <div className={styles.summaryPercent}>
                        {monthlyIncome > 0 ? `${((needsTotal / monthlyIncome) * 100).toFixed(1)}%` : '0%'}
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>Wants (30%)</div>
                    <div className={styles.summaryValue}>{formatCurrency(wantsTotal)}</div>
                    <div className={styles.summaryPercent}>
                        {monthlyIncome > 0 ? `${((wantsTotal / monthlyIncome) * 100).toFixed(1)}%` : '0%'}
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>Savings (20%)</div>
                    <div className={styles.summaryValue}>{formatCurrency(savingsTotal)}</div>
                    <div className={styles.summaryPercent}>
                        {monthlyIncome > 0 ? `${((savingsTotal / monthlyIncome) * 100).toFixed(1)}%` : '0%'}
                    </div>
                </div>
                <div className={`${styles.summaryCard} ${remaining < 0 ? styles.summaryCardNegative : ''}`}>
                    <div className={styles.summaryLabel}>Unallocated</div>
                    <div className={styles.summaryValue}>{formatCurrency(remaining)}</div>
                    <div className={styles.summaryPercent}>
                        {remaining < 0 ? 'Over budget!' : 'Available'}
                    </div>
                </div>
            </div>

            {/* Budget Progress */}
            <div className={styles.progressCard}>
                <div className={styles.progressHeader}>
                    <span>Budget Used This Month</span>
                    <span className={styles.progressPercent}>{budgetUsed.toFixed(1)}%</span>
                </div>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{
                            width: `${Math.min(100, budgetUsed)}%`,
                            backgroundColor: budgetUsed >= 100 ? 'var(--color-accent-red)' :
                                budgetUsed >= 80 ? 'var(--color-warning)' :
                                    'var(--color-accent-green)'
                        }}
                    />
                </div>
                <div className={styles.progressInfo}>
                    <span>Spent: {formatCurrency(totalSpent)}</span>
                    <span>Allocated: {formatCurrency(totalAllocated)}</span>
                </div>
            </div>

            {/* Categories */}
            {activeTab === 'overview' ? (
                <div className={styles.categoriesGrid}>
                    {['needs', 'wants', 'savings'].map(type => (
                        <div key={type} className={styles.categorySection}>
                            <h3 className={styles.sectionTitle}>
                                {type === 'needs' ? '🏠 Needs' : type === 'wants' ? '🎉 Wants' : '💰 Savings'}
                            </h3>
                            <div className={styles.categoryList}>
                                {categories.filter(c => c.type === type).map(category => (
                                    <div key={category.id} className={styles.categoryCard}>
                                        <div className={styles.categoryHeader}>
                                            <span className={styles.categoryIcon}>{category.icon}</span>
                                            <span className={styles.categoryName}>{category.name}</span>
                                        </div>
                                        <div className={styles.categoryProgress}>
                                            <div className={styles.categoryBar}>
                                                <div
                                                    className={styles.categoryFill}
                                                    style={{
                                                        width: category.allocated > 0
                                                            ? `${Math.min(100, (category.spent / category.allocated) * 100)}%`
                                                            : '0%',
                                                        backgroundColor: getProgressColor(category.spent, category.allocated)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.categoryAmounts}>
                                            <span className={styles.categorySpent}>
                                                {formatCurrency(category.spent)}
                                            </span>
                                            <span className={styles.categoryAllocated}>
                                                / {formatCurrency(category.allocated)}
                                            </span>
                                        </div>
                                        <div className={styles.spentInput}>
                                            <label>Spent this month:</label>
                                            <input
                                                type="number"
                                                value={category.spent}
                                                onChange={(e) => updateSpent(category.id, Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.allocateSection}>
                    <h3 className={styles.sectionTitle}>Allocate Your Budget</h3>
                    <div className={styles.allocateList}>
                        {categories.map(category => (
                            <div key={category.id} className={styles.allocateItem}>
                                <div className={styles.allocateInfo}>
                                    <span className={styles.categoryIcon}>{category.icon}</span>
                                    <span className={styles.categoryName}>{category.name}</span>
                                    <span className={`${styles.typeTag} ${styles[`typeTag${category.type}`]}`}>
                                        {category.type}
                                    </span>
                                </div>
                                <div className={styles.allocateInput}>
                                    <span className={styles.currencySymbol}>₹</span>
                                    <input
                                        type="number"
                                        value={category.allocated}
                                        onChange={(e) => updateAllocation(category.id, Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
