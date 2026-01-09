'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../assets/page.module.css';
import {
    RISK_QUESTIONS,
    generateRiskProfile,
    RiskProfile,
    RiskLevel,
    AssetAllocation,
} from '@/lib/investment/risk-profile';
import {
    DETAILED_ALLOCATIONS,
    calculateInvestmentAmounts,
    getExpectedReturn,
    calculateRequiredSIP,
} from '@/lib/investment/allocator';
import {
    getVirtualPortfolio,
    getPortfolioSummary,
    PortfolioSummary,
} from '@/lib/investment/paper-trading';
import { formatCurrency } from '@/lib/utils';

type Tab = 'overview' | 'risk-profile' | 'allocate';

export default function InvestPage() {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
    const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [investAmount, setInvestAmount] = useState<number>(100000);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        try {
            // Load saved risk profile from localStorage
            const savedProfile = localStorage.getItem('iap_risk_profile');
            if (savedProfile) {
                setRiskProfile(JSON.parse(savedProfile));
            }

            // Load portfolio summary
            const summary = getPortfolioSummary();
            setPortfolioSummary(summary);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (questionId: string, score: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: score }));

        if (currentQuestion < RISK_QUESTIONS.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const handleSubmitRiskProfile = () => {
        const profile = generateRiskProfile(answers);
        setRiskProfile(profile);
        localStorage.setItem('iap_risk_profile', JSON.stringify(profile));
        setActiveTab('overview');
    };

    const resetRiskProfile = () => {
        setRiskProfile(null);
        setAnswers({});
        setCurrentQuestion(0);
        localStorage.removeItem('iap_risk_profile');
        setActiveTab('risk-profile');
    };

    const getRiskLevelColor = (level: RiskLevel) => {
        switch (level) {
            case 'conservative': return 'var(--color-accent-blue)';
            case 'moderate': return 'var(--color-accent-gold)';
            case 'aggressive': return 'var(--color-accent-red)';
        }
    };

    const getRiskLevelEmoji = (level: RiskLevel) => {
        switch (level) {
            case 'conservative': return '🛡️';
            case 'moderate': return '⚖️';
            case 'aggressive': return '🚀';
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="loader loader-lg"></div>
                <p>Loading investment data...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Invest</h1>
                    <p className={styles.subtitle}>Smart investing based on your risk profile</p>
                </div>
                <Link href="/invest/paper-trading" className="btn btn-primary">
                    📊 Paper Trading
                </Link>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-xl)',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: 'var(--spacing-md)'
            }}>
                {[
                    { id: 'overview', label: 'Overview', icon: '📈' },
                    { id: 'risk-profile', label: 'Risk Profile', icon: '🎯' },
                    { id: 'allocate', label: 'Allocate', icon: '💰' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        style={{
                            padding: 'var(--spacing-sm) var(--spacing-lg)',
                            background: activeTab === tab.id ? 'var(--color-accent-primary-muted)' : 'transparent',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: activeTab === tab.id ? 'var(--font-weight-semibold)' : 'normal',
                            color: activeTab === tab.id ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                            transition: 'all var(--transition-base)',
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div>
                    {/* Portfolio Summary */}
                    {portfolioSummary && (
                        <div className={styles.summaryCard} style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Virtual Portfolio</span>
                                <span className={styles.summaryValue}>{formatCurrency(portfolioSummary.totalValue)}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Cash Balance</span>
                                <span className={styles.summaryValue}>{formatCurrency(portfolioSummary.cashBalance)}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Total P&L</span>
                                <span className={styles.summaryValue} style={{
                                    color: portfolioSummary.totalPnl >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'
                                }}>
                                    {portfolioSummary.totalPnl >= 0 ? '+' : ''}{formatCurrency(portfolioSummary.totalPnl)}
                                    <span style={{ fontSize: 'var(--font-size-sm)', marginLeft: 'var(--spacing-xs)' }}>
                                        ({portfolioSummary.totalPnlPercent >= 0 ? '+' : ''}{portfolioSummary.totalPnlPercent.toFixed(2)}%)
                                    </span>
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Risk Profile Card */}
                    {riskProfile ? (
                        <div style={{
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-xl)',
                            padding: 'var(--spacing-xl)',
                            marginBottom: 'var(--spacing-xl)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{
                                        fontSize: 'var(--font-size-lg)',
                                        fontWeight: 'var(--font-weight-semibold)',
                                        marginBottom: 'var(--spacing-sm)'
                                    }}>
                                        Your Risk Profile
                                    </h3>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-sm)',
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        background: getRiskLevelColor(riskProfile.level) + '20',
                                        color: getRiskLevelColor(riskProfile.level),
                                        borderRadius: 'var(--radius-full)',
                                        fontWeight: 'var(--font-weight-semibold)',
                                        textTransform: 'capitalize',
                                        marginBottom: 'var(--spacing-md)'
                                    }}>
                                        {getRiskLevelEmoji(riskProfile.level)} {riskProfile.level} (Score: {riskProfile.score}/10)
                                    </div>
                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        {riskProfile.description}
                                    </p>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={resetRiskProfile}>
                                    Retake
                                </button>
                            </div>

                            {/* Allocation Breakdown */}
                            <div style={{
                                marginTop: 'var(--spacing-xl)',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: 'var(--spacing-md)'
                            }}>
                                {Object.entries(riskProfile.allocation).map(([key, value]) => (
                                    <div key={key} style={{
                                        textAlign: 'center',
                                        padding: 'var(--spacing-md)',
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        <div style={{
                                            fontSize: 'var(--font-size-xl)',
                                            fontWeight: 'var(--font-weight-bold)',
                                            color: 'var(--color-accent-primary)'
                                        }}>
                                            {value}%
                                        </div>
                                        <div style={{
                                            fontSize: 'var(--font-size-xs)',
                                            color: 'var(--color-text-muted)',
                                            textTransform: 'capitalize'
                                        }}>
                                            {key}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                marginTop: 'var(--spacing-lg)',
                                padding: 'var(--spacing-md)',
                                background: 'var(--color-positive-muted)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--font-size-sm)'
                            }}>
                                📊 Expected Annual Return: <strong>{getExpectedReturn(riskProfile.allocation).toFixed(1)}%</strong>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-xl)',
                            padding: 'var(--spacing-2xl)',
                            textAlign: 'center',
                            marginBottom: 'var(--spacing-xl)',
                        }}>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--spacing-md)' }}>🎯</span>
                            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Complete Your Risk Profile</h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                                Answer a few questions to get personalized investment recommendations
                            </p>
                            <button className="btn btn-primary" onClick={() => setActiveTab('risk-profile')}>
                                Take Risk Assessment
                            </button>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 'var(--spacing-md)'
                    }}>
                        <Link href="/invest/paper-trading" style={{
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-lg)',
                            textAlign: 'center',
                            textDecoration: 'none',
                            transition: 'all var(--transition-base)',
                        }}>
                            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 'var(--spacing-sm)' }}>📊</span>
                            <h4 style={{ color: 'var(--color-text-primary)' }}>Paper Trading</h4>
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                Practice trading with virtual money
                            </p>
                        </Link>
                        <button onClick={() => setActiveTab('allocate')} style={{
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-lg)',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all var(--transition-base)',
                        }}>
                            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 'var(--spacing-sm)' }}>💰</span>
                            <h4>Allocate Funds</h4>
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                See recommended allocation
                            </p>
                        </button>
                        <Link href="/calculators" style={{
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-lg)',
                            textAlign: 'center',
                            textDecoration: 'none',
                            transition: 'all var(--transition-base)',
                        }}>
                            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 'var(--spacing-sm)' }}>🧮</span>
                            <h4 style={{ color: 'var(--color-text-primary)' }}>SIP Calculator</h4>
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                Plan your investments
                            </p>
                        </Link>
                    </div>
                </div>
            )}

            {/* Risk Profile Tab */}
            {activeTab === 'risk-profile' && (
                <div style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--spacing-xl)',
                    maxWidth: '600px',
                }}>
                    {currentQuestion < RISK_QUESTIONS.length ? (
                        <>
                            {/* Progress */}
                            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 'var(--spacing-sm)',
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    <span>Question {currentQuestion + 1} of {RISK_QUESTIONS.length}</span>
                                    <span>{Math.round(((currentQuestion + 1) / RISK_QUESTIONS.length) * 100)}%</span>
                                </div>
                                <div style={{
                                    height: '4px',
                                    background: 'var(--color-bg-tertiary)',
                                    borderRadius: 'var(--radius-full)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${((currentQuestion + 1) / RISK_QUESTIONS.length) * 100}%`,
                                        background: 'var(--color-accent-primary)',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>

                            {/* Question */}
                            <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>
                                {RISK_QUESTIONS[currentQuestion].question}
                            </h3>

                            {/* Options */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                {RISK_QUESTIONS[currentQuestion].options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswerSelect(RISK_QUESTIONS[currentQuestion].id, option.score)}
                                        style={{
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            background: answers[RISK_QUESTIONS[currentQuestion].id] === option.score
                                                ? 'var(--color-accent-primary-muted)'
                                                : 'var(--color-bg-tertiary)',
                                            border: `2px solid ${answers[RISK_QUESTIONS[currentQuestion].id] === option.score
                                                ? 'var(--color-accent-primary)'
                                                : 'transparent'}`,
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontSize: 'var(--font-size-base)',
                                            transition: 'all var(--transition-base)',
                                        }}
                                    >
                                        {option.text}
                                    </button>
                                ))}
                            </div>

                            {/* Navigation */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: 'var(--spacing-xl)'
                            }}>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                                    disabled={currentQuestion === 0}
                                >
                                    ← Previous
                                </button>
                                {currentQuestion === RISK_QUESTIONS.length - 1 && Object.keys(answers).length === RISK_QUESTIONS.length && (
                                    <button className="btn btn-primary" onClick={handleSubmitRiskProfile}>
                                        Get My Profile →
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '4rem' }}>✅</span>
                            <h3 style={{ marginTop: 'var(--spacing-md)' }}>All questions answered!</h3>
                            <button className="btn btn-primary" onClick={handleSubmitRiskProfile} style={{ marginTop: 'var(--spacing-lg)' }}>
                                Get My Risk Profile
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Allocate Tab */}
            {activeTab === 'allocate' && (
                <div>
                    {!riskProfile ? (
                        <div style={{
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-xl)',
                            padding: 'var(--spacing-2xl)',
                            textAlign: 'center',
                        }}>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: 'var(--spacing-md)' }}>⚠️</span>
                            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Complete Risk Profile First</h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                                We need to know your risk tolerance to provide allocation recommendations
                            </p>
                            <button className="btn btn-primary" onClick={() => setActiveTab('risk-profile')}>
                                Take Risk Assessment
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'var(--spacing-xl)',
                        }}>
                            {/* Investment Amount Input */}
                            <div style={{
                                background: 'var(--color-bg-card)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-xl)',
                                padding: 'var(--spacing-xl)',
                            }}>
                                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>💰 Investment Amount</h3>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>How much do you want to invest?</label>
                                    <input
                                        type="number"
                                        value={investAmount}
                                        onChange={(e) => setInvestAmount(parseFloat(e.target.value) || 0)}
                                        className="input"
                                        min="1000"
                                        step="1000"
                                    />
                                </div>

                                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                                    <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
                                        Recommended Allocation
                                    </h4>
                                    {(() => {
                                        const amounts = calculateInvestmentAmounts(investAmount, riskProfile.allocation);
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Equity</span>
                                                    <strong>{formatCurrency(amounts.equity)}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Debt</span>
                                                    <strong>{formatCurrency(amounts.debt)}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Gold</span>
                                                    <strong>{formatCurrency(amounts.gold)}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Cash</span>
                                                    <strong>{formatCurrency(amounts.cash)}</strong>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div style={{
                                background: 'var(--color-bg-card)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-xl)',
                                padding: 'var(--spacing-xl)',
                            }}>
                                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>📊 Detailed Breakdown</h3>
                                {DETAILED_ALLOCATIONS[riskProfile.level].map((category, idx) => (
                                    <div key={idx} style={{ marginBottom: 'var(--spacing-lg)' }}>
                                        <h4 style={{
                                            fontSize: 'var(--font-size-sm)',
                                            color: 'var(--color-accent-primary)',
                                            marginBottom: 'var(--spacing-sm)'
                                        }}>
                                            {category.category}
                                        </h4>
                                        {category.subcategories.map((sub, subIdx) => (
                                            <div key={subIdx} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: 'var(--spacing-xs) 0',
                                                fontSize: 'var(--font-size-sm)',
                                                borderBottom: '1px solid var(--color-divider)'
                                            }}>
                                                <div>
                                                    <div>{sub.name}</div>
                                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                                        {sub.description}
                                                    </div>
                                                </div>
                                                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                                                    {sub.percentage}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
