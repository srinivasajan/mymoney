'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { formatCurrency } from '@/lib/utils';
import { getLiabilities } from '@/lib/storage';
import type { Liability } from '@/lib/types';

interface DebtItem {
    id: string;
    name: string;
    balance: number;
    interestRate: number;
    minimumPayment: number;
}

interface PayoffResult {
    totalInterest: number;
    totalMonths: number;
    payoffDate: string;
    schedule: { month: number; payment: number; principalPaid: number; interestPaid: number; balance: number }[];
}

export default function DebtPlannerPage() {
    const [debts, setDebts] = useState<DebtItem[]>([]);
    const [extraPayment, setExtraPayment] = useState(0);
    const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDebt, setNewDebt] = useState({ name: '', balance: 0, interestRate: 0, minimumPayment: 0 });

    useEffect(() => {
        // Load from liabilities
        const liabilities = getLiabilities();
        const debtItems: DebtItem[] = liabilities.map(l => ({
            id: l.id,
            name: l.name,
            balance: l.outstanding_amount,
            interestRate: l.interest_rate || 10,
            minimumPayment: l.emi_amount || Math.ceil(l.outstanding_amount / 60),
        }));
        setDebts(debtItems);
    }, []);

    const addDebt = () => {
        if (!newDebt.name || newDebt.balance <= 0) return;
        setDebts([...debts, { ...newDebt, id: `debt_${Date.now()}` }]);
        setNewDebt({ name: '', balance: 0, interestRate: 0, minimumPayment: 0 });
        setShowAddForm(false);
    };

    const removeDebt = (id: string) => {
        setDebts(debts.filter(d => d.id !== id));
    };

    // Sort debts by strategy
    const sortedDebts = [...debts].sort((a, b) => {
        if (strategy === 'avalanche') {
            return b.interestRate - a.interestRate; // Highest rate first
        } else {
            return a.balance - b.balance; // Lowest balance first
        }
    });

    // Calculate payoff
    const calculatePayoff = (debtList: DebtItem[], extraMonthly: number): { avalanche: PayoffResult; snowball: PayoffResult; minPayOnly: PayoffResult } => {
        const calculate = (sortedList: DebtItem[]): PayoffResult => {
            if (sortedList.length === 0) {
                return { totalInterest: 0, totalMonths: 0, payoffDate: '', schedule: [] };
            }

            const debtsCopy = sortedList.map(d => ({ ...d }));
            let month = 0;
            let totalInterest = 0;
            const schedule: PayoffResult['schedule'] = [];
            let previousBalance = debtsCopy.reduce((sum, d) => sum + d.balance, 0);

            while (debtsCopy.some(d => d.balance > 0) && month < 600) {
                month++;
                let availableExtra = extraMonthly;
                let monthPayment = 0;
                let monthPrincipal = 0;
                let monthInterest = 0;

                for (const debt of debtsCopy) {
                    if (debt.balance <= 0) continue;

                    const monthlyRate = debt.interestRate / 100 / 12;
                    const interest = debt.balance * monthlyRate;
                    totalInterest += interest;
                    monthInterest += interest;

                    let payment = debt.minimumPayment;

                    // Apply extra to first debt with balance
                    if (availableExtra > 0 && debt === debtsCopy.find(d => d.balance > 0)) {
                        payment += availableExtra;
                        availableExtra = 0;
                    }

                    // Calculate principal payment (payment minus interest)
                    // If payment covers interest, apply remainder to principal
                    // If payment doesn't cover interest, principal is 0 (debt grows)
                    const principalPayment = payment - interest;

                    if (principalPayment >= 0) {
                        // Payment covers interest and some principal
                        const actualPrincipal = Math.min(debt.balance, principalPayment);
                        debt.balance = Math.max(0, debt.balance - actualPrincipal);
                        monthPrincipal += actualPrincipal;
                    } else {
                        // Payment doesn't cover interest - debt balance stays the same
                        // (we're not compounding - that would be punitive)
                        // Just mark no progress on principal
                        monthPrincipal += 0;
                    }

                    monthPayment += payment;
                }

                const currentBalance = debtsCopy.reduce((sum, d) => sum + d.balance, 0);

                schedule.push({
                    month,
                    payment: monthPayment,
                    principalPaid: monthPrincipal,
                    interestPaid: monthInterest,
                    balance: currentBalance,
                });

                // Safety: if balance isn't decreasing, we'll never pay off
                // Exit early to prevent infinite loop
                if (currentBalance >= previousBalance && month > 12) {
                    break;
                }
                previousBalance = currentBalance;
            }

            const payoffDate = new Date();
            payoffDate.setMonth(payoffDate.getMonth() + month);

            return {
                totalInterest,
                totalMonths: month,
                payoffDate: payoffDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
                schedule,
            };
        };

        const avalancheSorted = [...debtList].sort((a, b) => b.interestRate - a.interestRate);
        const snowballSorted = [...debtList].sort((a, b) => a.balance - b.balance);

        return {
            avalanche: calculate(avalancheSorted),
            snowball: calculate(snowballSorted),
            minPayOnly: calculate(debtList.map(d => ({ ...d }))),
        };
    };

    const results = calculatePayoff(debts, extraPayment);
    const currentResult = strategy === 'avalanche' ? results.avalanche : results.snowball;
    const interestSaved = results.minPayOnly.totalInterest - currentResult.totalInterest;
    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Debt Payoff Planner</h1>
                    <p className={styles.subtitle}>Create your roadmap to becoming debt-free</p>
                </div>
            </div>

            {/* Summary */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>💳</div>
                    <div className={styles.summaryContent}>
                        <div className={styles.summaryLabel}>Total Debt</div>
                        <div className={styles.summaryValue}>{formatCurrency(totalDebt)}</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>📅</div>
                    <div className={styles.summaryContent}>
                        <div className={styles.summaryLabel}>Debt-Free By</div>
                        <div className={styles.summaryValue}>{currentResult.payoffDate || 'N/A'}</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>💰</div>
                    <div className={styles.summaryContent}>
                        <div className={styles.summaryLabel}>Interest Saved</div>
                        <div className={`${styles.summaryValue} ${styles.positive}`}>
                            {formatCurrency(interestSaved > 0 ? interestSaved : 0)}
                        </div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>⏱️</div>
                    <div className={styles.summaryContent}>
                        <div className={styles.summaryLabel}>Time to Payoff</div>
                        <div className={styles.summaryValue}>
                            {currentResult.totalMonths} months
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategy Selection */}
            <div className={styles.strategyCard}>
                <h2 className={styles.cardTitle}>Choose Your Strategy</h2>
                <div className={styles.strategyGrid}>
                    <div
                        className={`${styles.strategyOption} ${strategy === 'avalanche' ? styles.strategyActive : ''}`}
                        onClick={() => setStrategy('avalanche')}
                    >
                        <div className={styles.strategyHeader}>
                            <span className={styles.strategyIcon}>🏔️</span>
                            <span className={styles.strategyName}>Debt Avalanche</span>
                            {strategy === 'avalanche' && <span className={styles.recommendedBadge}>Recommended</span>}
                        </div>
                        <p className={styles.strategyDescription}>
                            Pay off debts with the highest interest rates first.
                            <strong> Saves the most money on interest.</strong>
                        </p>
                        <div className={styles.strategyStats}>
                            <div>
                                <span className={styles.statLabel}>Total Interest</span>
                                <span className={styles.statValue}>{formatCurrency(results.avalanche.totalInterest)}</span>
                            </div>
                            <div>
                                <span className={styles.statLabel}>Months</span>
                                <span className={styles.statValue}>{results.avalanche.totalMonths}</span>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`${styles.strategyOption} ${strategy === 'snowball' ? styles.strategyActive : ''}`}
                        onClick={() => setStrategy('snowball')}
                    >
                        <div className={styles.strategyHeader}>
                            <span className={styles.strategyIcon}>⛄</span>
                            <span className={styles.strategyName}>Debt Snowball</span>
                        </div>
                        <p className={styles.strategyDescription}>
                            Pay off debts with the smallest balances first.
                            <strong> Quick wins for motivation.</strong>
                        </p>
                        <div className={styles.strategyStats}>
                            <div>
                                <span className={styles.statLabel}>Total Interest</span>
                                <span className={styles.statValue}>{formatCurrency(results.snowball.totalInterest)}</span>
                            </div>
                            <div>
                                <span className={styles.statLabel}>Months</span>
                                <span className={styles.statValue}>{results.snowball.totalMonths}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Extra Payment */}
            <div className={styles.extraPaymentCard}>
                <div className={styles.extraPaymentHeader}>
                    <div>
                        <h3 className={styles.cardTitle}>Extra Monthly Payment</h3>
                        <p className={styles.cardSubtitle}>Pay more each month to become debt-free faster</p>
                    </div>
                    <div className={styles.extraPaymentInput}>
                        <span>₹</span>
                        <input
                            type="number"
                            value={extraPayment}
                            onChange={(e) => setExtraPayment(Math.max(0, Number(e.target.value)))}
                        />
                        <span className={styles.inputNote}>/month extra</span>
                    </div>
                </div>
                <input
                    type="range"
                    min="0"
                    max={Math.max(50000, totalMinPayment * 2)}
                    step="500"
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(Number(e.target.value))}
                    className={styles.slider}
                />
                <div className={styles.sliderLabels}>
                    <span>₹0</span>
                    <span>{formatCurrency(Math.max(50000, totalMinPayment * 2))}</span>
                </div>
            </div>

            {/* Debts List */}
            <div className={styles.debtsCard}>
                <div className={styles.debtsHeader}>
                    <h3 className={styles.cardTitle}>Your Debts</h3>
                    <button className={styles.addButton} onClick={() => setShowAddForm(true)}>
                        + Add Debt
                    </button>
                </div>

                {showAddForm && (
                    <div className={styles.addForm}>
                        <input
                            type="text"
                            placeholder="Debt name"
                            value={newDebt.name}
                            onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                            className={styles.formInput}
                        />
                        <input
                            type="number"
                            placeholder="Balance"
                            value={newDebt.balance || ''}
                            onChange={(e) => setNewDebt({ ...newDebt, balance: Number(e.target.value) })}
                            className={styles.formInput}
                        />
                        <input
                            type="number"
                            placeholder="Interest %"
                            value={newDebt.interestRate || ''}
                            onChange={(e) => setNewDebt({ ...newDebt, interestRate: Number(e.target.value) })}
                            className={styles.formInput}
                        />
                        <input
                            type="number"
                            placeholder="Min Payment"
                            value={newDebt.minimumPayment || ''}
                            onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: Number(e.target.value) })}
                            className={styles.formInput}
                        />
                        <button className={styles.saveButton} onClick={addDebt}>Add</button>
                        <button className={styles.cancelButton} onClick={() => setShowAddForm(false)}>Cancel</button>
                    </div>
                )}

                {debts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🎉</span>
                        <p>No debts found! You're debt-free!</p>
                        <p className={styles.emptyNote}>Add debts manually or they'll be loaded from your liabilities.</p>
                    </div>
                ) : (
                    <div className={styles.debtsList}>
                        {sortedDebts.map((debt, index) => (
                            <div key={debt.id} className={styles.debtItem}>
                                <div className={styles.debtRank}>
                                    {index + 1}
                                </div>
                                <div className={styles.debtInfo}>
                                    <span className={styles.debtName}>{debt.name}</span>
                                    <span className={styles.debtMeta}>
                                        {debt.interestRate}% APR • Min: {formatCurrency(debt.minimumPayment)}/mo
                                    </span>
                                </div>
                                <div className={styles.debtBalance}>
                                    {formatCurrency(debt.balance)}
                                </div>
                                <button
                                    className={styles.removeButton}
                                    onClick={() => removeDebt(debt.id)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payoff Order */}
            {debts.length > 1 && (
                <div className={styles.orderCard}>
                    <h3 className={styles.cardTitle}>
                        {strategy === 'avalanche' ? '🏔️ Avalanche Order' : '⛄ Snowball Order'}
                    </h3>
                    <p className={styles.orderDescription}>
                        {strategy === 'avalanche'
                            ? 'Focus extra payments on the debt with the highest interest rate first.'
                            : 'Focus extra payments on the debt with the smallest balance first.'}
                    </p>
                    <div className={styles.orderList}>
                        {sortedDebts.map((debt, index) => (
                            <div key={debt.id} className={styles.orderItem}>
                                <span className={styles.orderNumber}>{index + 1}</span>
                                <span className={styles.orderName}>{debt.name}</span>
                                <span className={styles.orderReason}>
                                    {strategy === 'avalanche'
                                        ? `${debt.interestRate}% interest`
                                        : formatCurrency(debt.balance)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
