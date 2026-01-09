'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { formatCurrency } from '@/lib/utils';
import { getUserProfile } from '@/lib/storage';

interface TaxSavingItem {
    id: string;
    section: '80C' | '80D' | '80CCD' | '80E' | '80G' | 'HRA';
    name: string;
    amount: number;
    maxLimit: number;
}

const SECTION_INFO = {
    '80C': {
        label: 'Section 80C',
        limit: 150000,
        description: 'PPF, ELSS, Life Insurance, EPF, etc.',
        color: '#3b82f6'
    },
    '80D': {
        label: 'Section 80D',
        limit: 75000,
        description: 'Health Insurance Premium',
        color: '#22c55e'
    },
    '80CCD': {
        label: 'Section 80CCD(1B)',
        limit: 50000,
        description: 'NPS Additional Contribution',
        color: '#a855f7'
    },
    '80E': {
        label: 'Section 80E',
        limit: Infinity,
        description: 'Education Loan Interest',
        color: '#f59e0b'
    },
    '80G': {
        label: 'Section 80G',
        limit: Infinity,
        description: 'Donations to Charities',
        color: '#ec4899'
    },
    'HRA': {
        label: 'HRA Exemption',
        limit: Infinity,
        description: 'House Rent Allowance',
        color: '#06b6d4'
    },
};

const TAX_SLABS_NEW = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 700000, rate: 5 },
    { min: 700000, max: 1000000, rate: 10 },
    { min: 1000000, max: 1200000, rate: 15 },
    { min: 1200000, max: 1500000, rate: 20 },
    { min: 1500000, max: Infinity, rate: 30 },
];

const TAX_SLABS_OLD = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 5 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 },
];

const STORAGE_KEY = 'mymoney_tax_items';

export default function TaxPage() {
    const [annualIncome, setAnnualIncome] = useState(1200000);
    const [taxItems, setTaxItems] = useState<TaxSavingItem[]>([]);
    const [taxRegime, setTaxRegime] = useState<'old' | 'new'>('new');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({
        section: '80C' as TaxSavingItem['section'],
        name: '',
        amount: 0,
    });

    useEffect(() => {
        const profile = getUserProfile();
        if (profile.monthly_income) {
            setAnnualIncome(profile.monthly_income * 12);
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setTaxItems(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse tax items');
            }
        }
    }, []);

    const saveItems = (items: TaxSavingItem[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        setTaxItems(items);
    };

    const addItem = () => {
        if (!newItem.name || newItem.amount <= 0) return;

        const item: TaxSavingItem = {
            id: `tax_${Date.now()}`,
            section: newItem.section,
            name: newItem.name,
            amount: newItem.amount,
            maxLimit: SECTION_INFO[newItem.section].limit,
        };

        saveItems([...taxItems, item]);
        setNewItem({ section: '80C', name: '', amount: 0 });
        setShowAddForm(false);
    };

    const deleteItem = (id: string) => {
        saveItems(taxItems.filter(item => item.id !== id));
    };

    // Calculate deductions by section
    const deductionsBySection = taxItems.reduce((acc, item) => {
        if (!acc[item.section]) acc[item.section] = 0;
        acc[item.section] += item.amount;
        return acc;
    }, {} as Record<string, number>);

    // Apply limits
    const effectiveDeductions = Object.entries(deductionsBySection).reduce((acc, [section, amount]) => {
        const limit = SECTION_INFO[section as keyof typeof SECTION_INFO]?.limit || 0;
        acc[section] = Math.min(amount, limit === Infinity ? amount : limit);
        return acc;
    }, {} as Record<string, number>);

    const totalDeductions = Object.values(effectiveDeductions).reduce((sum, val) => sum + val, 0);
    const taxableIncome = Math.max(0, annualIncome - (taxRegime === 'old' ? totalDeductions : 0));

    // Calculate tax
    const calculateTax = (income: number, slabs: typeof TAX_SLABS_NEW) => {
        let tax = 0;
        let remaining = income;

        for (const slab of slabs) {
            if (remaining <= 0) break;
            const taxableInSlab = Math.min(remaining, slab.max - slab.min);
            tax += (taxableInSlab * slab.rate) / 100;
            remaining -= taxableInSlab;
        }

        // Add cess
        const cess = tax * 0.04;
        return tax + cess;
    };

    const taxOld = calculateTax(Math.max(0, annualIncome - totalDeductions), TAX_SLABS_OLD);
    const taxNew = calculateTax(annualIncome, TAX_SLABS_NEW);
    const currentTax = taxRegime === 'old' ? taxOld : taxNew;
    const taxSavings = taxRegime === 'old' ? calculateTax(annualIncome, TAX_SLABS_OLD) - taxOld : 0;

    // Recommendations
    const recommendations = [];
    const current80C = effectiveDeductions['80C'] || 0;
    if (current80C < 150000) {
        recommendations.push({
            icon: '💰',
            title: 'Maximize 80C',
            description: `You can still invest ₹${formatCurrency(150000 - current80C)} more in 80C instruments like PPF, ELSS, or tax-saving FDs.`,
        });
    }
    if (!effectiveDeductions['80CCD']) {
        recommendations.push({
            icon: '📊',
            title: 'Consider NPS',
            description: 'Invest up to ₹50,000 in NPS under Section 80CCD(1B) for additional tax benefits.',
        });
    }
    if (!effectiveDeductions['80D']) {
        recommendations.push({
            icon: '🏥',
            title: 'Health Insurance',
            description: 'Get health insurance for yourself and family - premiums are tax deductible under 80D.',
        });
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Tax Planning</h1>
                    <p className={styles.subtitle}>Optimize your tax liability with smart investments</p>
                </div>
            </div>

            {/* Income & Regime */}
            <div className={styles.topCards}>
                <div className={styles.incomeCard}>
                    <label className={styles.cardLabel}>Annual Income</label>
                    <div className={styles.incomeInput}>
                        <span>₹</span>
                        <input
                            type="number"
                            value={annualIncome}
                            onChange={(e) => setAnnualIncome(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className={styles.regimeCard}>
                    <label className={styles.cardLabel}>Tax Regime</label>
                    <div className={styles.regimeToggle}>
                        <button
                            className={`${styles.regimeButton} ${taxRegime === 'old' ? styles.regimeActive : ''}`}
                            onClick={() => setTaxRegime('old')}
                        >
                            Old Regime
                        </button>
                        <button
                            className={`${styles.regimeButton} ${taxRegime === 'new' ? styles.regimeActive : ''}`}
                            onClick={() => setTaxRegime('new')}
                        >
                            New Regime
                        </button>
                    </div>
                </div>
            </div>

            {/* Tax Summary */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>Gross Income</div>
                    <div className={styles.summaryValue}>{formatCurrency(annualIncome)}</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>Total Deductions</div>
                    <div className={styles.summaryValue}>{formatCurrency(totalDeductions)}</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryLabel}>Taxable Income</div>
                    <div className={styles.summaryValue}>{formatCurrency(taxableIncome)}</div>
                </div>
                <div className={`${styles.summaryCard} ${styles.taxCard}`}>
                    <div className={styles.summaryLabel}>Tax Payable</div>
                    <div className={styles.summaryValue}>{formatCurrency(currentTax)}</div>
                    {taxSavings > 0 && (
                        <div className={styles.taxSavings}>
                            Saving {formatCurrency(taxSavings)}
                        </div>
                    )}
                </div>
            </div>

            {/* Regime Comparison */}
            <div className={styles.comparisonCard}>
                <h3 className={styles.cardTitle}>Regime Comparison</h3>
                <div className={styles.comparisonGrid}>
                    <div className={`${styles.comparisonItem} ${taxRegime === 'old' ? styles.comparisonActive : ''}`}>
                        <div className={styles.comparisonLabel}>Old Regime Tax</div>
                        <div className={styles.comparisonValue}>{formatCurrency(taxOld)}</div>
                        <div className={styles.comparisonNote}>(With deductions)</div>
                    </div>
                    <div className={styles.comparisonVs}>vs</div>
                    <div className={`${styles.comparisonItem} ${taxRegime === 'new' ? styles.comparisonActive : ''}`}>
                        <div className={styles.comparisonLabel}>New Regime Tax</div>
                        <div className={styles.comparisonValue}>{formatCurrency(taxNew)}</div>
                        <div className={styles.comparisonNote}>(No deductions)</div>
                    </div>
                </div>
                <div className={styles.comparisonResult}>
                    {taxOld < taxNew ? (
                        <span className={styles.resultOld}>Old regime saves you {formatCurrency(taxNew - taxOld)}</span>
                    ) : taxNew < taxOld ? (
                        <span className={styles.resultNew}>New regime saves you {formatCurrency(taxOld - taxNew)}</span>
                    ) : (
                        <span>Both regimes result in the same tax</span>
                    )}
                </div>
            </div>

            {/* Deductions */}
            <div className={styles.deductionsCard}>
                <div className={styles.deductionsHeader}>
                    <h3 className={styles.cardTitle}>Tax Saving Investments</h3>
                    <button className={styles.addItemButton} onClick={() => setShowAddForm(true)}>
                        + Add Investment
                    </button>
                </div>

                {showAddForm && (
                    <div className={styles.addForm}>
                        <select
                            value={newItem.section}
                            onChange={(e) => setNewItem({ ...newItem, section: e.target.value as TaxSavingItem['section'] })}
                            className={styles.formSelect}
                        >
                            {Object.entries(SECTION_INFO).map(([key, info]) => (
                                <option key={key} value={key}>{info.label}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Investment name"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            className={styles.formInput}
                        />
                        <input
                            type="number"
                            placeholder="Amount"
                            value={newItem.amount || ''}
                            onChange={(e) => setNewItem({ ...newItem, amount: Number(e.target.value) })}
                            className={styles.formInput}
                        />
                        <button className={styles.saveButton} onClick={addItem}>Save</button>
                        <button className={styles.cancelButton} onClick={() => setShowAddForm(false)}>Cancel</button>
                    </div>
                )}

                <div className={styles.sectionsList}>
                    {Object.entries(SECTION_INFO).map(([sectionKey, sectionInfo]) => {
                        const sectionItems = taxItems.filter(item => item.section === sectionKey);
                        const sectionTotal = sectionItems.reduce((sum, item) => sum + item.amount, 0);
                        const utilization = sectionInfo.limit === Infinity ? 0 : (sectionTotal / sectionInfo.limit) * 100;

                        return (
                            <div key={sectionKey} className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <div className={styles.sectionInfo}>
                                        <div
                                            className={styles.sectionDot}
                                            style={{ backgroundColor: sectionInfo.color }}
                                        />
                                        <div>
                                            <div className={styles.sectionLabel}>{sectionInfo.label}</div>
                                            <div className={styles.sectionDesc}>{sectionInfo.description}</div>
                                        </div>
                                    </div>
                                    <div className={styles.sectionAmounts}>
                                        <span className={styles.sectionTotal}>{formatCurrency(sectionTotal)}</span>
                                        {sectionInfo.limit !== Infinity && (
                                            <span className={styles.sectionLimit}>/ {formatCurrency(sectionInfo.limit)}</span>
                                        )}
                                    </div>
                                </div>

                                {sectionInfo.limit !== Infinity && (
                                    <div className={styles.sectionProgress}>
                                        <div
                                            className={styles.sectionProgressFill}
                                            style={{
                                                width: `${Math.min(100, utilization)}%`,
                                                backgroundColor: sectionInfo.color
                                            }}
                                        />
                                    </div>
                                )}

                                {sectionItems.length > 0 && (
                                    <div className={styles.itemsList}>
                                        {sectionItems.map(item => (
                                            <div key={item.id} className={styles.investmentItem}>
                                                <span className={styles.itemName}>{item.name}</span>
                                                <span className={styles.itemAmount}>{formatCurrency(item.amount)}</span>
                                                <button
                                                    className={styles.deleteItemButton}
                                                    onClick={() => deleteItem(item.id)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && taxRegime === 'old' && (
                <div className={styles.recommendationsCard}>
                    <h3 className={styles.cardTitle}>💡 Tax Saving Recommendations</h3>
                    <div className={styles.recommendationsList}>
                        {recommendations.map((rec, index) => (
                            <div key={index} className={styles.recommendationItem}>
                                <span className={styles.recIcon}>{rec.icon}</span>
                                <div className={styles.recContent}>
                                    <div className={styles.recTitle}>{rec.title}</div>
                                    <div className={styles.recDescription}>{rec.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
