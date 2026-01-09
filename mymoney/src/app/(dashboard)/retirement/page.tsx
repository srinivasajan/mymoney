'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { formatCurrency } from '@/lib/utils';
import { getAssets, getStockHoldings, getMFHoldings, getUserProfile } from '@/lib/storage';

export default function RetirementPage() {
    // Basic inputs
    const [currentAge, setCurrentAge] = useState(30);
    const [retirementAge, setRetirementAge] = useState(55);
    const [lifeExpectancy, setLifeExpectancy] = useState(85);
    const [currentSavings, setCurrentSavings] = useState(1000000);
    const [monthlyExpenses, setMonthlyExpenses] = useState(50000);
    const [monthlySavings, setMonthlySavings] = useState(25000);

    // Advanced inputs
    const [inflationRate, setInflationRate] = useState(6);
    const [preRetirementReturn, setPreRetirementReturn] = useState(12);
    const [postRetirementReturn, setPostRetirementReturn] = useState(8);

    // FIRE calculator inputs
    const [annualIncome, setAnnualIncome] = useState(1500000);
    const [savingsRate, setSavingsRate] = useState(50);

    // Load user's actual data on mount
    useEffect(() => {
        const profile = getUserProfile();
        const assets = getAssets();
        const stocks = getStockHoldings();
        const mfs = getMFHoldings();

        // Calculate total savings from actual data
        const totalAssets = assets.reduce((sum, a) => sum + a.current_value, 0);
        const totalStocks = stocks.reduce((sum, s) => sum + (s.quantity * s.average_price), 0);
        const totalMF = mfs.reduce((sum, m) => sum + (m.units * m.average_nav), 0);
        const totalSavings = totalAssets + totalStocks + totalMF;

        if (totalSavings > 0) {
            setCurrentSavings(totalSavings);
        }

        if (profile.monthly_income) {
            setAnnualIncome(profile.monthly_income * 12);
        }
        if (profile.monthly_expenses) {
            setMonthlyExpenses(profile.monthly_expenses);
            setMonthlySavings(Math.max(0, (profile.monthly_income || 0) - profile.monthly_expenses));
        }
    }, []);

    // Calculations
    const yearsToRetirement = retirementAge - currentAge;
    const retirementDuration = lifeExpectancy - retirementAge;

    // Future monthly expenses at retirement (adjusted for inflation)
    const futureMonthlyExpenses = monthlyExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);
    const annualExpensesAtRetirement = futureMonthlyExpenses * 12;

    // Corpus needed using 4% rule adjusted for inflation
    const corpusNeeded = annualExpensesAtRetirement / ((postRetirementReturn - inflationRate) / 100);

    // Future value of current savings
    const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + preRetirementReturn / 100, yearsToRetirement);

    // Future value of monthly SIP
    const monthlyRate = preRetirementReturn / 12 / 100;
    const months = yearsToRetirement * 12;
    const futureValueOfSIP = monthlySavings * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));

    // Total projected corpus
    const projectedCorpus = futureValueOfCurrentSavings + futureValueOfSIP;

    // Gap analysis
    const corpusGap = corpusNeeded - projectedCorpus;
    const isOnTrack = corpusGap <= 0;

    // Required monthly savings to meet goal
    const requiredMonthlySavings = corpusGap > 0
        ? corpusGap / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))
        : 0;

    // FIRE Calculations
    const annualSavings = annualIncome * (savingsRate / 100);
    const annualExpenses = annualIncome - annualSavings;
    const fireNumber = annualExpenses * 25; // 4% rule
    const yearsToFire = Math.log(1 + (fireNumber * preRetirementReturn / 100) / annualSavings) / Math.log(1 + preRetirementReturn / 100);
    const fireAge = currentAge + Math.ceil(yearsToFire);

    // FIRE Progress - how close are you to your FIRE number?
    const fireProgress = Math.min(100, (currentSavings / fireNumber) * 100);
    const remainingToFire = Math.max(0, fireNumber - currentSavings);

    // SWP Calculator
    const [swpCorpus, setSwpCorpus] = useState(10000000);
    const [swpMonthlyWithdrawal, setSwpMonthlyWithdrawal] = useState(50000);
    const [swpReturnRate, setSwpReturnRate] = useState(8);

    const calculateSWPDuration = () => {
        const monthlyReturn = swpReturnRate / 12 / 100;
        if (swpMonthlyWithdrawal <= swpCorpus * monthlyReturn) {
            return Infinity; // Corpus never depletes
        }
        const n = Math.log(swpMonthlyWithdrawal / (swpMonthlyWithdrawal - swpCorpus * monthlyReturn)) / Math.log(1 + monthlyReturn);
        return Math.floor(n);
    };

    const swpDuration = calculateSWPDuration();
    const swpYears = swpDuration === Infinity ? '∞' : Math.floor(swpDuration / 12);
    const swpMonths = swpDuration === Infinity ? 0 : swpDuration % 12;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Retirement Planning</h1>
                <p className={styles.subtitle}>Plan for a comfortable and secure retirement</p>
            </div>

            {/* Main Calculator */}
            <div className={styles.mainGrid}>
                {/* Inputs */}
                <div className={styles.inputsCard}>
                    <h2 className={styles.cardTitle}>Your Details</h2>

                    <div className={styles.inputGroup}>
                        <label>Current Age</label>
                        <div className={styles.inputRow}>
                            <input
                                type="number"
                                value={currentAge}
                                onChange={(e) => setCurrentAge(Number(e.target.value))}
                            />
                            <span>years</span>
                        </div>
                        <input
                            type="range" min="20" max="60" value={currentAge}
                            onChange={(e) => setCurrentAge(Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Retirement Age</label>
                        <div className={styles.inputRow}>
                            <input
                                type="number"
                                value={retirementAge}
                                onChange={(e) => setRetirementAge(Number(e.target.value))}
                            />
                            <span>years</span>
                        </div>
                        <input
                            type="range" min="40" max="70" value={retirementAge}
                            onChange={(e) => setRetirementAge(Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Current Monthly Expenses</label>
                        <div className={styles.inputRow}>
                            <span>₹</span>
                            <input
                                type="number"
                                value={monthlyExpenses}
                                onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Current Retirement Savings</label>
                        <div className={styles.inputRow}>
                            <span>₹</span>
                            <input
                                type="number"
                                value={currentSavings}
                                onChange={(e) => setCurrentSavings(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Monthly Investment</label>
                        <div className={styles.inputRow}>
                            <span>₹</span>
                            <input
                                type="number"
                                value={monthlySavings}
                                onChange={(e) => setMonthlySavings(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className={styles.advancedToggle}>
                        <h4>Assumptions</h4>
                    </div>

                    <div className={styles.assumptionsGrid}>
                        <div className={styles.assumptionItem}>
                            <label>Inflation</label>
                            <input
                                type="number"
                                value={inflationRate}
                                onChange={(e) => setInflationRate(Number(e.target.value))}
                                step="0.5"
                            />
                            <span>%</span>
                        </div>
                        <div className={styles.assumptionItem}>
                            <label>Pre-Retirement Return</label>
                            <input
                                type="number"
                                value={preRetirementReturn}
                                onChange={(e) => setPreRetirementReturn(Number(e.target.value))}
                                step="0.5"
                            />
                            <span>%</span>
                        </div>
                        <div className={styles.assumptionItem}>
                            <label>Post-Retirement Return</label>
                            <input
                                type="number"
                                value={postRetirementReturn}
                                onChange={(e) => setPostRetirementReturn(Number(e.target.value))}
                                step="0.5"
                            />
                            <span>%</span>
                        </div>
                        <div className={styles.assumptionItem}>
                            <label>Life Expectancy</label>
                            <input
                                type="number"
                                value={lifeExpectancy}
                                onChange={(e) => setLifeExpectancy(Number(e.target.value))}
                            />
                            <span>yrs</span>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className={styles.resultsCard}>
                    <h2 className={styles.cardTitle}>Retirement Analysis</h2>

                    <div className={`${styles.statusBanner} ${isOnTrack ? styles.statusOnTrack : styles.statusOffTrack}`}>
                        <span className={styles.statusIcon}>{isOnTrack ? '✓' : '⚠️'}</span>
                        <span className={styles.statusText}>
                            {isOnTrack
                                ? 'You\'re on track for retirement!'
                                : 'Action needed to meet your retirement goal'}
                        </span>
                    </div>

                    <div className={styles.resultGrid}>
                        <div className={styles.resultItem}>
                            <div className={styles.resultLabel}>Corpus Needed</div>
                            <div className={styles.resultValue}>{formatCurrency(corpusNeeded)}</div>
                            <div className={styles.resultNote}>at age {retirementAge}</div>
                        </div>
                        <div className={styles.resultItem}>
                            <div className={styles.resultLabel}>Projected Corpus</div>
                            <div className={`${styles.resultValue} ${isOnTrack ? styles.positive : styles.negative}`}>
                                {formatCurrency(projectedCorpus)}
                            </div>
                            <div className={styles.resultNote}>with current savings</div>
                        </div>
                    </div>

                    <div className={styles.gapSection}>
                        <div className={styles.gapLabel}>
                            {isOnTrack ? 'Surplus' : 'Gap'}
                        </div>
                        <div className={`${styles.gapValue} ${isOnTrack ? styles.positive : styles.negative}`}>
                            {formatCurrency(Math.abs(corpusGap))}
                        </div>
                    </div>

                    {/* Visual Comparison Bar */}
                    <div className={styles.comparisonVisual}>
                        <div className={styles.comparisonHeader}>
                            <span>Retirement Readiness</span>
                            <span className={isOnTrack ? styles.positive : styles.negative}>
                                {Math.min(100, (projectedCorpus / corpusNeeded) * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div className={styles.comparisonBar}>
                            <div
                                className={`${styles.comparisonFill} ${isOnTrack ? styles.fillPositive : styles.fillNegative}`}
                                style={{ width: `${Math.min(100, (projectedCorpus / corpusNeeded) * 100)}%` }}
                            />
                            {!isOnTrack && (
                                <div className={styles.comparisonTarget} style={{ left: '100%' }}>
                                    <span className={styles.targetMarker}>|</span>
                                    <span className={styles.targetLabel}>Goal</span>
                                </div>
                            )}
                        </div>
                        <div className={styles.comparisonLabels}>
                            <span>Current: {formatCurrency(currentSavings)}</span>
                            <span>Projected: {formatCurrency(projectedCorpus)}</span>
                            <span>Need: {formatCurrency(corpusNeeded)}</span>
                        </div>
                    </div>

                    {!isOnTrack && (
                        <div className={styles.actionCard}>
                            <div className={styles.actionIcon}>💡</div>
                            <div className={styles.actionContent}>
                                <div className={styles.actionTitle}>To meet your goal</div>
                                <div className={styles.actionDescription}>
                                    Increase your monthly investment by <strong>{formatCurrency(requiredMonthlySavings)}</strong> to
                                    <strong> {formatCurrency(monthlySavings + requiredMonthlySavings)}</strong>/month
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.projectionDetails}>
                        <div className={styles.projectionItem}>
                            <span className={styles.projectionLabel}>Monthly expenses at retirement</span>
                            <span className={styles.projectionValue}>{formatCurrency(futureMonthlyExpenses)}</span>
                        </div>
                        <div className={styles.projectionItem}>
                            <span className={styles.projectionLabel}>Years to retirement</span>
                            <span className={styles.projectionValue}>{yearsToRetirement} years</span>
                        </div>
                        <div className={styles.projectionItem}>
                            <span className={styles.projectionLabel}>Retirement duration</span>
                            <span className={styles.projectionValue}>{retirementDuration} years</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FIRE Calculator */}
            <div className={styles.fireCard}>
                <div className={styles.fireHeader}>
                    <div>
                        <h2 className={styles.cardTitle}>🔥 FIRE Calculator</h2>
                        <p className={styles.cardSubtitle}>Financial Independence, Retire Early</p>
                    </div>
                </div>

                <div className={styles.fireGrid}>
                    <div className={styles.fireInputs}>
                        <div className={styles.inputGroup}>
                            <label>Annual Income</label>
                            <div className={styles.inputRow}>
                                <span>₹</span>
                                <input
                                    type="number"
                                    value={annualIncome}
                                    onChange={(e) => setAnnualIncome(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Savings Rate</label>
                            <div className={styles.inputRow}>
                                <input
                                    type="number"
                                    value={savingsRate}
                                    onChange={(e) => setSavingsRate(Math.min(90, Math.max(0, Number(e.target.value))))}
                                />
                                <span>%</span>
                            </div>
                            <input
                                type="range" min="10" max="90" value={savingsRate}
                                onChange={(e) => setSavingsRate(Number(e.target.value))}
                                className={styles.slider}
                            />
                        </div>
                    </div>

                    <div className={styles.fireResults}>
                        <div className={styles.fireResultItem}>
                            <div className={styles.fireResultLabel}>FIRE Number</div>
                            <div className={styles.fireResultValue}>{formatCurrency(fireNumber)}</div>
                            <div className={styles.fireResultNote}>25x annual expenses</div>
                        </div>
                        <div className={styles.fireResultItem}>
                            <div className={styles.fireResultLabel}>Years to FIRE</div>
                            <div className={styles.fireResultValue}>{yearsToFire.toFixed(1)}</div>
                            <div className={styles.fireResultNote}>at {savingsRate}% savings rate</div>
                        </div>
                        <div className={styles.fireResultItem}>
                            <div className={styles.fireResultLabel}>FIRE Age</div>
                            <div className={styles.fireResultValue}>{fireAge}</div>
                            <div className={styles.fireResultNote}>years old</div>
                        </div>
                    </div>

                    {/* FIRE Progress Bar */}
                    <div className={styles.fireProgressSection}>
                        <div className={styles.fireProgressHeader}>
                            <span>Your FIRE Progress</span>
                            <span className={styles.fireProgressPercent}>{fireProgress.toFixed(1)}%</span>
                        </div>
                        <div className={styles.fireProgressBar}>
                            <div
                                className={styles.fireProgressFill}
                                style={{ width: `${fireProgress}%` }}
                            />
                        </div>
                        <div className={styles.fireProgressInfo}>
                            <span>{formatCurrency(currentSavings)} saved</span>
                            <span>{formatCurrency(remainingToFire)} remaining</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SWP Calculator */}
            <div className={styles.swpCard}>
                <h2 className={styles.cardTitle}>💸 SWP Calculator</h2>
                <p className={styles.cardSubtitle}>Systematic Withdrawal Plan - How long will your corpus last?</p>

                <div className={styles.swpGrid}>
                    <div className={styles.swpInputs}>
                        <div className={styles.inputGroup}>
                            <label>Corpus Amount</label>
                            <div className={styles.inputRow}>
                                <span>₹</span>
                                <input
                                    type="number"
                                    value={swpCorpus}
                                    onChange={(e) => setSwpCorpus(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Monthly Withdrawal</label>
                            <div className={styles.inputRow}>
                                <span>₹</span>
                                <input
                                    type="number"
                                    value={swpMonthlyWithdrawal}
                                    onChange={(e) => setSwpMonthlyWithdrawal(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Expected Return</label>
                            <div className={styles.inputRow}>
                                <input
                                    type="number"
                                    value={swpReturnRate}
                                    onChange={(e) => setSwpReturnRate(Number(e.target.value))}
                                    step="0.5"
                                />
                                <span>%</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.swpResult}>
                        <div className={styles.swpResultLabel}>Your corpus will last</div>
                        <div className={styles.swpResultValue}>
                            {swpDuration === Infinity ? (
                                <span className={styles.perpetual}>Forever ∞</span>
                            ) : (
                                <>
                                    <span className={styles.swpYears}>{swpYears}</span> years
                                    {swpMonths > 0 && <span className={styles.swpMonths}> {swpMonths} months</span>}
                                </>
                            )}
                        </div>
                        {swpDuration === Infinity && (
                            <div className={styles.swpNote}>
                                Your returns exceed withdrawals - corpus will grow!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
