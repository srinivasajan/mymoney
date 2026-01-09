// =====================================================
// FINANCIAL HEALTH SCORE CALCULATOR
// Proprietary scoring algorithm (0-1000)
// =====================================================

import type { Asset, Liability, Goal, StockHolding, MFHolding, UserProfile } from '@/lib/types';

export interface HealthScoreBreakdown {
    overall: number;
    savings: number;
    debt: number;
    investments: number;
    protection: number;
    goals: number;
}

export interface HealthScoreResult {
    score: number;
    breakdown: HealthScoreBreakdown;
    grade: 'Excellent' | 'Good' | 'Fair' | 'Needs Work' | 'Critical';
    gradeColor: string;
    recommendations: string[];
    strengths: string[];
}

interface FinancialData {
    assets: Asset[];
    liabilities: Liability[];
    goals: Goal[];
    stocks: StockHolding[];
    mutualFunds: MFHolding[];
    profile: UserProfile;
}

// Score weights
const WEIGHTS = {
    savings: 0.25,
    debt: 0.25,
    investments: 0.20,
    protection: 0.15,
    goals: 0.15,
};

// Calculate total asset value
function getTotalAssets(assets: Asset[]): number {
    return assets.reduce((sum, a) => sum + a.current_value, 0);
}

// Calculate total liability
function getTotalLiabilities(liabilities: Liability[]): number {
    return liabilities.reduce((sum, l) => sum + l.outstanding_amount, 0);
}

// Calculate investment value
function getInvestmentValue(stocks: StockHolding[], mfs: MFHolding[]): number {
    const stockValue = stocks.reduce((sum, s) => sum + (s.current_value || s.quantity * s.average_price), 0);
    const mfValue = mfs.reduce((sum, m) => sum + (m.current_value || m.units * m.average_nav), 0);
    return stockValue + mfValue;
}

// Calculate cash/liquid assets
function getLiquidAssets(assets: Asset[]): number {
    const liquidCategories = ['cash', 'bank_account'];
    return assets
        .filter(a => liquidCategories.includes(a.category))
        .reduce((sum, a) => sum + a.current_value, 0);
}

// Calculate savings score (0-1000)
function calculateSavingsScore(data: FinancialData): number {
    const monthlyIncome = data.profile.monthly_income || 0;
    const monthlyExpenses = data.profile.monthly_expenses || 0;

    if (monthlyIncome === 0) return 500; // Default if no income data

    const savingsRate = (monthlyIncome - monthlyExpenses) / monthlyIncome;
    const liquidAssets = getLiquidAssets(data.assets);
    const emergencyMonths = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;

    let score = 0;

    // Savings rate scoring (0-500 points)
    if (savingsRate >= 0.3) score += 500;
    else if (savingsRate >= 0.2) score += 400;
    else if (savingsRate >= 0.1) score += 300;
    else if (savingsRate >= 0) score += 200;
    else score += 100;

    // Emergency fund scoring (0-500 points)
    if (emergencyMonths >= 6) score += 500;
    else if (emergencyMonths >= 3) score += 350;
    else if (emergencyMonths >= 1) score += 200;
    else score += 50;

    return Math.round(score);
}

// Calculate debt score (0-1000, higher is better = less debt)
function calculateDebtScore(data: FinancialData): number {
    const totalAssets = getTotalAssets(data.assets);
    const totalDebt = getTotalLiabilities(data.liabilities);
    const monthlyIncome = data.profile.monthly_income || 0;

    if (totalDebt === 0) return 1000; // No debt = perfect score

    let score = 1000;

    // Debt-to-asset ratio (up to -400 points)
    const debtToAssetRatio = totalAssets > 0 ? totalDebt / totalAssets : 1;
    if (debtToAssetRatio > 0.8) score -= 400;
    else if (debtToAssetRatio > 0.5) score -= 300;
    else if (debtToAssetRatio > 0.3) score -= 200;
    else if (debtToAssetRatio > 0.1) score -= 100;

    // Debt-to-income ratio (up to -400 points)
    if (monthlyIncome > 0) {
        const monthlyDebtPayments = data.liabilities.reduce((sum, l) => sum + (l.emi_amount || 0), 0);
        const debtToIncomeRatio = monthlyDebtPayments / monthlyIncome;

        if (debtToIncomeRatio > 0.5) score -= 400;
        else if (debtToIncomeRatio > 0.4) score -= 300;
        else if (debtToIncomeRatio > 0.3) score -= 200;
        else if (debtToIncomeRatio > 0.2) score -= 100;
    }

    // Credit card debt penalty (up to -200 points)
    const creditCardDebt = data.liabilities
        .filter(l => l.category === 'credit_card')
        .reduce((sum, l) => sum + l.outstanding_amount, 0);

    if (creditCardDebt > 0) {
        if (creditCardDebt > 100000) score -= 200;
        else if (creditCardDebt > 50000) score -= 150;
        else if (creditCardDebt > 20000) score -= 100;
        else score -= 50;
    }

    return Math.max(0, score);
}

// Calculate investment score (0-1000)
function calculateInvestmentScore(data: FinancialData): number {
    const totalAssets = getTotalAssets(data.assets);
    const investmentValue = getInvestmentValue(data.stocks, data.mutualFunds);
    const totalNetWorth = totalAssets + investmentValue - getTotalLiabilities(data.liabilities);

    if (totalNetWorth <= 0) return 200;

    let score = 0;

    // Investment allocation (0-400 points)
    const investmentRatio = investmentValue / (totalAssets + investmentValue);
    if (investmentRatio >= 0.4) score += 400;
    else if (investmentRatio >= 0.3) score += 350;
    else if (investmentRatio >= 0.2) score += 300;
    else if (investmentRatio >= 0.1) score += 200;
    else score += 100;

    // Diversification (0-300 points)
    const hasStocks = data.stocks.length > 0;
    const hasMFs = data.mutualFunds.length > 0;
    const hasMultipleAssetTypes = new Set(data.assets.map(a => a.category)).size > 2;

    let diversificationScore = 0;
    if (hasStocks) diversificationScore += 100;
    if (hasMFs) diversificationScore += 100;
    if (hasMultipleAssetTypes) diversificationScore += 100;
    score += diversificationScore;

    // Number of investments (0-300 points)
    const totalInvestments = data.stocks.length + data.mutualFunds.length;
    if (totalInvestments >= 10) score += 300;
    else if (totalInvestments >= 5) score += 200;
    else if (totalInvestments >= 2) score += 150;
    else if (totalInvestments >= 1) score += 100;

    return Math.min(1000, score);
}

// Calculate protection score (0-1000)
function calculateProtectionScore(data: FinancialData): number {
    const liquidAssets = getLiquidAssets(data.assets);
    const monthlyExpenses = data.profile.monthly_expenses || 50000;
    const emergencyMonths = liquidAssets / monthlyExpenses;

    let score = 0;

    // Emergency fund (0-700 points)
    if (emergencyMonths >= 12) score += 700;
    else if (emergencyMonths >= 6) score += 600;
    else if (emergencyMonths >= 3) score += 400;
    else if (emergencyMonths >= 1) score += 200;
    else score += 50;

    // Fixed deposits as safety net (0-300 points)
    const fdAssets = data.assets
        .filter(a => a.category === 'fixed_deposit')
        .reduce((sum, a) => sum + a.current_value, 0);

    if (fdAssets > 500000) score += 300;
    else if (fdAssets > 200000) score += 200;
    else if (fdAssets > 100000) score += 150;
    else if (fdAssets > 0) score += 100;

    return Math.min(1000, score);
}

// Calculate goals score (0-1000)
function calculateGoalsScore(data: FinancialData): number {
    if (data.goals.length === 0) return 500; // No goals = neutral

    let totalProgress = 0;
    let goalsWithProgress = 0;

    data.goals.forEach(goal => {
        const progress = goal.target_amount > 0
            ? (goal.current_amount / goal.target_amount) * 100
            : 0;
        totalProgress += Math.min(100, progress);
        goalsWithProgress++;
    });

    const avgProgress = totalProgress / goalsWithProgress;

    let score = 0;

    // Average progress (0-700 points)
    score += Math.round(avgProgress * 7);

    // Bonus for having goals (0-300 points)
    if (data.goals.length >= 5) score += 300;
    else if (data.goals.length >= 3) score += 200;
    else if (data.goals.length >= 1) score += 100;

    return Math.min(1000, score);
}

// Get grade based on score
function getGrade(score: number): { grade: HealthScoreResult['grade']; color: string } {
    if (score >= 800) return { grade: 'Excellent', color: '#22c55e' };
    if (score >= 650) return { grade: 'Good', color: '#84cc16' };
    if (score >= 500) return { grade: 'Fair', color: '#f59e0b' };
    if (score >= 300) return { grade: 'Needs Work', color: '#f97316' };
    return { grade: 'Critical', color: '#ef4444' };
}

// Generate recommendations
function generateRecommendations(breakdown: HealthScoreBreakdown, data: FinancialData): string[] {
    const recommendations: string[] = [];

    if (breakdown.savings < 600) {
        recommendations.push('Aim to save at least 20% of your monthly income');
        if (getLiquidAssets(data.assets) < (data.profile.monthly_expenses || 50000) * 3) {
            recommendations.push('Build an emergency fund covering 3-6 months of expenses');
        }
    }

    if (breakdown.debt < 700) {
        const creditCardDebt = data.liabilities
            .filter(l => l.category === 'credit_card')
            .reduce((sum, l) => sum + l.outstanding_amount, 0);
        if (creditCardDebt > 0) {
            recommendations.push('Prioritize paying off high-interest credit card debt');
        }
        recommendations.push('Consider debt consolidation to reduce interest payments');
    }

    if (breakdown.investments < 600) {
        if (data.stocks.length === 0 && data.mutualFunds.length === 0) {
            recommendations.push('Start investing in diversified mutual funds or index funds');
        }
        if (data.stocks.length > 0 && data.mutualFunds.length === 0) {
            recommendations.push('Diversify your portfolio with mutual funds');
        }
        recommendations.push('Aim to invest 20-30% of your income for long-term wealth');
    }

    if (breakdown.protection < 600) {
        recommendations.push('Increase your emergency fund to cover 6+ months of expenses');
        const hasFD = data.assets.some(a => a.category === 'fixed_deposit');
        if (!hasFD) {
            recommendations.push('Consider fixed deposits as a safety net for guaranteed returns');
        }
    }

    if (breakdown.goals < 600) {
        if (data.goals.length === 0) {
            recommendations.push('Set specific financial goals with target amounts and dates');
        } else {
            recommendations.push('Increase contributions towards your financial goals');
        }
    }

    return recommendations.slice(0, 5); // Max 5 recommendations
}

// Generate strengths
function generateStrengths(breakdown: HealthScoreBreakdown, data: FinancialData): string[] {
    const strengths: string[] = [];

    if (breakdown.savings >= 700) {
        strengths.push('Excellent savings habits');
    }

    if (breakdown.debt >= 800) {
        if (data.liabilities.length === 0) {
            strengths.push('Debt-free status');
        } else {
            strengths.push('Low debt-to-income ratio');
        }
    }

    if (breakdown.investments >= 700) {
        strengths.push('Well-diversified investment portfolio');
    }

    if (breakdown.protection >= 700) {
        strengths.push('Strong emergency fund');
    }

    if (breakdown.goals >= 700) {
        strengths.push('Great progress on financial goals');
    }

    const investmentValue = getInvestmentValue(data.stocks, data.mutualFunds);
    const totalAssets = getTotalAssets(data.assets);
    if (investmentValue > totalAssets * 0.3) {
        strengths.push('Good investment allocation');
    }

    return strengths.slice(0, 4); // Max 4 strengths
}

// Main function to calculate health score
export function calculateHealthScore(data: FinancialData): HealthScoreResult {
    const savingsScore = calculateSavingsScore(data);
    const debtScore = calculateDebtScore(data);
    const investmentScore = calculateInvestmentScore(data);
    const protectionScore = calculateProtectionScore(data);
    const goalsScore = calculateGoalsScore(data);

    const breakdown: HealthScoreBreakdown = {
        overall: 0,
        savings: savingsScore,
        debt: debtScore,
        investments: investmentScore,
        protection: protectionScore,
        goals: goalsScore,
    };

    // Calculate weighted overall score
    const overallScore = Math.round(
        savingsScore * WEIGHTS.savings +
        debtScore * WEIGHTS.debt +
        investmentScore * WEIGHTS.investments +
        protectionScore * WEIGHTS.protection +
        goalsScore * WEIGHTS.goals
    );

    breakdown.overall = overallScore;

    const { grade, color } = getGrade(overallScore);

    return {
        score: overallScore,
        breakdown,
        grade,
        gradeColor: color,
        recommendations: generateRecommendations(breakdown, data),
        strengths: generateStrengths(breakdown, data),
    };
}
