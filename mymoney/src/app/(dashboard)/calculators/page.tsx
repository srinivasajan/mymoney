'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';
import { formatCurrency } from '@/lib/utils';

type CalculatorType = 'sip' | 'emi' | 'fd' | 'ppf' | 'compound' | 'lumpsum';

interface CalculatorResult {
    title: string;
    values: { label: string; value: string; highlight?: boolean }[];
}

export default function CalculatorsPage() {
    const [activeCalc, setActiveCalc] = useState<CalculatorType>('sip');
    const [result, setResult] = useState<CalculatorResult | null>(null);

    // SIP Calculator State
    const [sipMonthly, setSipMonthly] = useState(10000);
    const [sipYears, setSipYears] = useState(10);
    const [sipRate, setSipRate] = useState(12);

    // EMI Calculator State
    const [emiPrincipal, setEmiPrincipal] = useState(5000000);
    const [emiYears, setEmiYears] = useState(20);
    const [emiRate, setEmiRate] = useState(8.5);

    // FD Calculator State
    const [fdPrincipal, setFdPrincipal] = useState(100000);
    const [fdYears, setFdYears] = useState(5);
    const [fdRate, setFdRate] = useState(7);

    // PPF Calculator State
    const [ppfYearly, setPpfYearly] = useState(150000);
    const [ppfYears, setPpfYears] = useState(15);
    const [ppfRate, setPpfRate] = useState(7.1);

    // Compound Interest State
    const [ciPrincipal, setCiPrincipal] = useState(100000);
    const [ciYears, setCiYears] = useState(10);
    const [ciRate, setCiRate] = useState(10);
    const [ciFrequency, setCiFrequency] = useState(4);

    // Lumpsum State
    const [lsPrincipal, setLsPrincipal] = useState(500000);
    const [lsYears, setLsYears] = useState(10);
    const [lsRate, setLsRate] = useState(12);

    const calculators = [
        { id: 'sip', label: 'SIP Calculator', icon: '📈' },
        { id: 'emi', label: 'EMI Calculator', icon: '🏠' },
        { id: 'fd', label: 'FD Calculator', icon: '🏦' },
        { id: 'ppf', label: 'PPF Calculator', icon: '💰' },
        { id: 'compound', label: 'Compound Interest', icon: '📊' },
        { id: 'lumpsum', label: 'Lumpsum Investment', icon: '💵' },
    ];

    const calculateSIP = useCallback(() => {
        const n = sipYears * 12;
        const r = sipRate / 12 / 100;
        const futureValue = sipMonthly * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
        const totalInvested = sipMonthly * n;
        const gains = futureValue - totalInvested;

        // Inflation adjusted value (assuming 6% inflation)
        const inflationRate = 0.06;
        const realValue = futureValue / Math.pow(1 + inflationRate, sipYears);

        setResult({
            title: 'SIP Returns',
            values: [
                { label: 'Total Investment', value: formatCurrency(totalInvested) },
                { label: 'Expected Returns', value: formatCurrency(gains) },
                { label: 'Future Value', value: formatCurrency(futureValue), highlight: true },
                { label: "Today's Value", value: formatCurrency(realValue) },
            ],
        });
    }, [sipMonthly, sipYears, sipRate]);

    const calculateEMI = useCallback(() => {
        const n = emiYears * 12;
        const r = emiRate / 12 / 100;
        const emi = emiPrincipal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n;
        const totalInterest = totalPayment - emiPrincipal;

        setResult({
            title: 'EMI Breakdown',
            values: [
                { label: 'Monthly EMI', value: formatCurrency(emi), highlight: true },
                { label: 'Total Interest', value: formatCurrency(totalInterest) },
                { label: 'Total Payment', value: formatCurrency(totalPayment) },
                { label: 'Interest Ratio', value: `${((totalInterest / emiPrincipal) * 100).toFixed(1)}%` },
            ],
        });
    }, [emiPrincipal, emiYears, emiRate]);

    const calculateFD = useCallback(() => {
        const n = fdYears;
        const r = fdRate / 100;
        const maturityAmount = fdPrincipal * Math.pow(1 + r / 4, 4 * n);
        const interest = maturityAmount - fdPrincipal;
        const effectiveRate = (Math.pow(1 + r / 4, 4) - 1) * 100;

        setResult({
            title: 'FD Maturity',
            values: [
                { label: 'Principal Amount', value: formatCurrency(fdPrincipal) },
                { label: 'Interest Earned', value: formatCurrency(interest) },
                { label: 'Maturity Amount', value: formatCurrency(maturityAmount), highlight: true },
                { label: 'Effective Rate', value: `${effectiveRate.toFixed(2)}%` },
            ],
        });
    }, [fdPrincipal, fdYears, fdRate]);

    const calculatePPF = useCallback(() => {
        let balance = 0;
        const r = ppfRate / 100;

        for (let i = 0; i < ppfYears; i++) {
            balance = (balance + ppfYearly) * (1 + r);
        }

        const totalInvested = ppfYearly * ppfYears;
        const interest = balance - totalInvested;
        const taxSaved = totalInvested * 0.312; // 31.2% tax bracket assumption

        setResult({
            title: 'PPF Maturity',
            values: [
                { label: 'Total Investment', value: formatCurrency(totalInvested) },
                { label: 'Interest Earned', value: formatCurrency(interest) },
                { label: 'Maturity Amount', value: formatCurrency(balance), highlight: true },
                { label: 'Tax Saved (80C)', value: formatCurrency(taxSaved) },
            ],
        });
    }, [ppfYearly, ppfYears, ppfRate]);

    const calculateCompound = useCallback(() => {
        const amount = ciPrincipal * Math.pow(1 + ciRate / 100 / ciFrequency, ciFrequency * ciYears);
        const interest = amount - ciPrincipal;
        const cagr = (Math.pow(amount / ciPrincipal, 1 / ciYears) - 1) * 100;

        const frequencyLabel = {
            1: 'Annually',
            2: 'Semi-annually',
            4: 'Quarterly',
            12: 'Monthly',
        }[ciFrequency] || 'Quarterly';

        setResult({
            title: `Compound Interest (${frequencyLabel})`,
            values: [
                { label: 'Principal Amount', value: formatCurrency(ciPrincipal) },
                { label: 'Interest Earned', value: formatCurrency(interest) },
                { label: 'Final Amount', value: formatCurrency(amount), highlight: true },
                { label: 'CAGR', value: `${cagr.toFixed(2)}%` },
            ],
        });
    }, [ciPrincipal, ciYears, ciRate, ciFrequency]);

    const calculateLumpsum = useCallback(() => {
        const amount = lsPrincipal * Math.pow(1 + lsRate / 100, lsYears);
        const gains = amount - lsPrincipal;
        const inflationRate = 0.06;
        const realValue = amount / Math.pow(1 + inflationRate, lsYears);

        setResult({
            title: 'Lumpsum Investment Returns',
            values: [
                { label: 'Investment Amount', value: formatCurrency(lsPrincipal) },
                { label: 'Expected Returns', value: formatCurrency(gains) },
                { label: 'Future Value', value: formatCurrency(amount), highlight: true },
                { label: "Today's Value", value: formatCurrency(realValue) },
            ],
        });
    }, [lsPrincipal, lsYears, lsRate]);

    // Auto-calculate on input change
    useEffect(() => {
        switch (activeCalc) {
            case 'sip': calculateSIP(); break;
            case 'emi': calculateEMI(); break;
            case 'fd': calculateFD(); break;
            case 'ppf': calculatePPF(); break;
            case 'compound': calculateCompound(); break;
            case 'lumpsum': calculateLumpsum(); break;
        }
    }, [activeCalc, calculateSIP, calculateEMI, calculateFD, calculatePPF, calculateCompound, calculateLumpsum]);

    const handleCalculate = () => {
        switch (activeCalc) {
            case 'sip': calculateSIP(); break;
            case 'emi': calculateEMI(); break;
            case 'fd': calculateFD(); break;
            case 'ppf': calculatePPF(); break;
            case 'compound': calculateCompound(); break;
            case 'lumpsum': calculateLumpsum(); break;
        }
    };

    const renderCalculatorForm = () => {
        switch (activeCalc) {
            case 'sip':
                return (
                    <>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Monthly Investment (₹)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={sipMonthly}
                                onChange={(e) => setSipMonthly(Number(e.target.value))}
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="500"
                                max="100000"
                                step="500"
                                value={sipMonthly}
                                onChange={(e) => setSipMonthly(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Investment Period (Years)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={sipYears}
                                onChange={(e) => setSipYears(Number(e.target.value))}
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="1"
                                max="40"
                                value={sipYears}
                                onChange={(e) => setSipYears(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Expected Return Rate (%)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={sipRate}
                                onChange={(e) => setSipRate(Number(e.target.value))}
                                step="0.5"
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="1"
                                max="30"
                                step="0.5"
                                value={sipRate}
                                onChange={(e) => setSipRate(Number(e.target.value))}
                            />
                        </div>
                    </>
                );

            case 'emi':
                return (
                    <>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Loan Amount (₹)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={emiPrincipal}
                                onChange={(e) => setEmiPrincipal(Number(e.target.value))}
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="100000"
                                max="50000000"
                                step="100000"
                                value={emiPrincipal}
                                onChange={(e) => setEmiPrincipal(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Loan Tenure (Years)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={emiYears}
                                onChange={(e) => setEmiYears(Number(e.target.value))}
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="1"
                                max="30"
                                value={emiYears}
                                onChange={(e) => setEmiYears(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Interest Rate (%)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={emiRate}
                                onChange={(e) => setEmiRate(Number(e.target.value))}
                                step="0.1"
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="5"
                                max="20"
                                step="0.1"
                                value={emiRate}
                                onChange={(e) => setEmiRate(Number(e.target.value))}
                            />
                        </div>
                    </>
                );

            case 'fd':
                return (
                    <>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Principal Amount (₹)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={fdPrincipal}
                                onChange={(e) => setFdPrincipal(Number(e.target.value))}
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="10000"
                                max="10000000"
                                step="10000"
                                value={fdPrincipal}
                                onChange={(e) => setFdPrincipal(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Tenure (Years)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={fdYears}
                                onChange={(e) => setFdYears(Number(e.target.value))}
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="1"
                                max="10"
                                value={fdYears}
                                onChange={(e) => setFdYears(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Interest Rate (%)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={fdRate}
                                onChange={(e) => setFdRate(Number(e.target.value))}
                                step="0.1"
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="4"
                                max="10"
                                step="0.1"
                                value={fdRate}
                                onChange={(e) => setFdRate(Number(e.target.value))}
                            />
                        </div>
                    </>
                );

            case 'ppf':
                return (
                    <>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Yearly Investment (₹)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={ppfYearly}
                                onChange={(e) => setPpfYearly(Number(e.target.value))}
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="500"
                                max="150000"
                                step="500"
                                value={ppfYearly}
                                onChange={(e) => setPpfYearly(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Investment Period (Years)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={ppfYears}
                                onChange={(e) => setPpfYears(Number(e.target.value))}
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="15"
                                max="50"
                                value={ppfYears}
                                onChange={(e) => setPpfYears(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Interest Rate (%) - Current: 7.1%</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={ppfRate}
                                onChange={(e) => setPpfRate(Number(e.target.value))}
                                step="0.1"
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="6"
                                max="9"
                                step="0.1"
                                value={ppfRate}
                                onChange={(e) => setPpfRate(Number(e.target.value))}
                            />
                        </div>
                    </>
                );

            case 'compound':
                return (
                    <>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Principal Amount (₹)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={ciPrincipal}
                                onChange={(e) => setCiPrincipal(Number(e.target.value))}
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="10000"
                                max="10000000"
                                step="10000"
                                value={ciPrincipal}
                                onChange={(e) => setCiPrincipal(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Time Period (Years)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={ciYears}
                                onChange={(e) => setCiYears(Number(e.target.value))}
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="1"
                                max="30"
                                value={ciYears}
                                onChange={(e) => setCiYears(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Interest Rate (%)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={ciRate}
                                onChange={(e) => setCiRate(Number(e.target.value))}
                                step="0.5"
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="1"
                                max="20"
                                step="0.5"
                                value={ciRate}
                                onChange={(e) => setCiRate(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Compounding Frequency</label>
                            <select
                                className={styles.select}
                                value={ciFrequency}
                                onChange={(e) => setCiFrequency(Number(e.target.value))}
                            >
                                <option value={1}>Annually</option>
                                <option value={2}>Semi-annually</option>
                                <option value={4}>Quarterly</option>
                                <option value={12}>Monthly</option>
                            </select>
                        </div>
                    </>
                );

            case 'lumpsum':
                return (
                    <>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Investment Amount (₹)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={lsPrincipal}
                                onChange={(e) => setLsPrincipal(Number(e.target.value))}
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="10000"
                                max="10000000"
                                step="10000"
                                value={lsPrincipal}
                                onChange={(e) => setLsPrincipal(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Investment Period (Years)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={lsYears}
                                onChange={(e) => setLsYears(Number(e.target.value))}
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="1"
                                max="30"
                                value={lsYears}
                                onChange={(e) => setLsYears(Number(e.target.value))}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Expected Return Rate (%)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={lsRate}
                                onChange={(e) => setLsRate(Number(e.target.value))}
                                step="0.5"
                            />
                            <input
                                type="range"
                                className={styles.slider}
                                min="1"
                                max="30"
                                step="0.5"
                                value={lsRate}
                                onChange={(e) => setLsRate(Number(e.target.value))}
                            />
                        </div>
                    </>
                );
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Financial Calculators</h1>
                <p className={styles.subtitle}>Plan your investments and loans with precision</p>
            </div>

            <div className={styles.grid}>
                {/* Calculator Tabs */}
                <div className={styles.tabs}>
                    {calculators.map(calc => (
                        <button
                            key={calc.id}
                            className={`${styles.tab} ${activeCalc === calc.id ? styles.tabActive : ''}`}
                            onClick={() => {
                                setActiveCalc(calc.id as CalculatorType);
                                setResult(null);
                            }}
                        >
                            <span className={styles.tabIcon}>{calc.icon}</span>
                            <span className={styles.tabLabel}>{calc.label}</span>
                        </button>
                    ))}
                </div>

                {/* Calculator Form */}
                <div className={styles.calculator}>
                    <div className={styles.calculatorForm}>
                        {renderCalculatorForm()}

                        <button className={styles.calculateButton} onClick={handleCalculate}>
                            Calculate
                        </button>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className={styles.results}>
                            <h3 className={styles.resultsTitle}>{result.title}</h3>
                            <div className={styles.resultsList}>
                                {result.values.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`${styles.resultItem} ${item.highlight ? styles.resultHighlight : ''}`}
                                    >
                                        <span className={styles.resultLabel}>{item.label}</span>
                                        <span className={styles.resultValue}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
