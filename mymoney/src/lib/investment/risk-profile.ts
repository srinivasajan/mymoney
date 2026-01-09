// =====================================================
// RISK PROFILING SYSTEM
// Determines user's investment risk tolerance
// =====================================================

export type RiskLevel = 'conservative' | 'moderate' | 'aggressive';

export interface RiskQuestion {
    id: string;
    question: string;
    options: {
        text: string;
        score: number; // 1-3: conservative, 4-6: moderate, 7-10: aggressive
    }[];
}

export interface RiskProfile {
    level: RiskLevel;
    score: number; // 1-10
    description: string;
    allocation: AssetAllocation;
}

export interface AssetAllocation {
    equity: number;      // Stocks, Equity MFs
    debt: number;        // FDs, Bonds, Debt MFs
    gold: number;        // Physical gold, Gold ETFs
    cash: number;        // Savings, Liquid funds
}

// Risk Assessment Questions
export const RISK_QUESTIONS: RiskQuestion[] = [
    {
        id: 'investment_horizon',
        question: 'What is your investment time horizon?',
        options: [
            { text: 'Less than 1 year', score: 2 },
            { text: '1-3 years', score: 4 },
            { text: '3-5 years', score: 6 },
            { text: '5-10 years', score: 8 },
            { text: 'More than 10 years', score: 10 },
        ],
    },
    {
        id: 'loss_tolerance',
        question: 'If your investment drops 20% in value, what would you do?',
        options: [
            { text: 'Sell everything immediately', score: 1 },
            { text: 'Sell some to reduce risk', score: 3 },
            { text: 'Hold and wait for recovery', score: 6 },
            { text: 'Buy more at lower prices', score: 9 },
        ],
    },
    {
        id: 'income_stability',
        question: 'How stable is your current income?',
        options: [
            { text: 'Irregular/Freelance', score: 3 },
            { text: 'Stable but may change', score: 5 },
            { text: 'Very stable (govt/MNC job)', score: 7 },
            { text: 'Multiple income sources', score: 9 },
        ],
    },
    {
        id: 'investment_experience',
        question: 'What is your investment experience?',
        options: [
            { text: 'No experience', score: 2 },
            { text: 'Basic (FDs, savings)', score: 4 },
            { text: 'Intermediate (MFs, stocks)', score: 7 },
            { text: 'Advanced (F&O, derivatives)', score: 9 },
        ],
    },
    {
        id: 'financial_goal',
        question: 'What is your primary investment goal?',
        options: [
            { text: 'Capital preservation', score: 2 },
            { text: 'Regular income', score: 4 },
            { text: 'Balanced growth', score: 6 },
            { text: 'Aggressive growth', score: 9 },
        ],
    },
    {
        id: 'emergency_fund',
        question: 'Do you have an emergency fund (3-6 months expenses)?',
        options: [
            { text: 'No emergency fund', score: 2 },
            { text: 'Less than 3 months', score: 4 },
            { text: '3-6 months covered', score: 7 },
            { text: 'More than 6 months', score: 9 },
        ],
    },
];

// Asset Allocation based on Risk Level
const ALLOCATIONS: Record<RiskLevel, AssetAllocation> = {
    conservative: {
        equity: 20,
        debt: 50,
        gold: 15,
        cash: 15,
    },
    moderate: {
        equity: 50,
        debt: 30,
        gold: 10,
        cash: 10,
    },
    aggressive: {
        equity: 75,
        debt: 15,
        gold: 5,
        cash: 5,
    },
};

// Risk Level Descriptions
const RISK_DESCRIPTIONS: Record<RiskLevel, string> = {
    conservative: 'You prefer stability over high returns. Focus on capital preservation with steady, predictable growth.',
    moderate: 'You seek balanced growth with manageable risk. A mix of equity and debt suits your profile.',
    aggressive: 'You are comfortable with volatility for potentially higher returns. Equity-heavy allocation recommended.',
};

/**
 * Calculate risk score from questionnaire answers
 * @param answers - Map of question ID to selected option score
 * @returns Risk score between 1-10
 */
export function calculateRiskScore(answers: Record<string, number>): number {
    const scores = Object.values(answers);
    if (scores.length === 0) return 5; // Default moderate

    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    const avgScore = totalScore / scores.length;

    // Normalize to 1-10 scale
    return Math.round(avgScore);
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): RiskLevel {
    if (score <= 3) return 'conservative';
    if (score <= 6) return 'moderate';
    return 'aggressive';
}

/**
 * Generate complete risk profile from questionnaire answers
 */
export function generateRiskProfile(answers: Record<string, number>): RiskProfile {
    const score = calculateRiskScore(answers);
    const level = getRiskLevel(score);

    return {
        level,
        score,
        description: RISK_DESCRIPTIONS[level],
        allocation: ALLOCATIONS[level],
    };
}

/**
 * Get allocation for a specific risk level
 */
export function getAllocationForRiskLevel(level: RiskLevel): AssetAllocation {
    return ALLOCATIONS[level];
}

/**
 * Adjust allocation based on age (rule of thumb: 100 - age = equity %)
 */
export function getAgeAdjustedAllocation(baseAllocation: AssetAllocation, age: number): AssetAllocation {
    const maxEquity = Math.max(20, 100 - age);
    const equityAdjustment = baseAllocation.equity > maxEquity
        ? baseAllocation.equity - maxEquity
        : 0;

    return {
        equity: baseAllocation.equity - equityAdjustment,
        debt: baseAllocation.debt + equityAdjustment,
        gold: baseAllocation.gold,
        cash: baseAllocation.cash,
    };
}

/**
 * Get recommended SIP amount based on income and risk level
 */
export function getRecommendedSIP(monthlyIncome: number, level: RiskLevel): number {
    const sipPercentage = {
        conservative: 0.15, // 15% of income
        moderate: 0.20,     // 20% of income
        aggressive: 0.30,   // 30% of income
    };

    return Math.round(monthlyIncome * sipPercentage[level]);
}
