// =====================================================
// ASSET ALLOCATION ENGINE
// Portfolio allocation algorithms based on MPT
// =====================================================

import { AssetAllocation, RiskLevel, getAllocationForRiskLevel, getAgeAdjustedAllocation } from './risk-profile';

export interface InvestmentAmount {
    total: number;
    equity: number;
    debt: number;
    gold: number;
    cash: number;
}

export interface PortfolioRebalanceRecommendation {
    assetClass: string;
    currentPercent: number;
    targetPercent: number;
    currentValue: number;
    targetValue: number;
    action: 'buy' | 'sell' | 'hold';
    amount: number;
}

export interface AllocationBreakdown {
    category: string;
    subcategories: {
        name: string;
        percentage: number;
        description: string;
    }[];
}

// Detailed allocation breakdown by risk level
export const DETAILED_ALLOCATIONS: Record<RiskLevel, AllocationBreakdown[]> = {
    conservative: [
        {
            category: 'Equity (20%)',
            subcategories: [
                { name: 'Large Cap Index Fund', percentage: 15, description: 'Nifty 50 or Sensex Index' },
                { name: 'Balanced Advantage Fund', percentage: 5, description: 'Dynamic asset allocation' },
            ],
        },
        {
            category: 'Debt (50%)',
            subcategories: [
                { name: 'PPF/EPF', percentage: 20, description: 'Tax-free, guaranteed returns' },
                { name: 'Fixed Deposits', percentage: 15, description: 'Bank FDs, 5+ year tenure' },
                { name: 'Debt Mutual Funds', percentage: 15, description: 'Short duration or corporate bond' },
            ],
        },
        {
            category: 'Gold (15%)',
            subcategories: [
                { name: 'Sovereign Gold Bonds', percentage: 10, description: '2.5% interest + gold appreciation' },
                { name: 'Gold ETF', percentage: 5, description: 'Liquid gold exposure' },
            ],
        },
        {
            category: 'Cash (15%)',
            subcategories: [
                { name: 'Savings Account', percentage: 5, description: 'Immediate liquidity' },
                { name: 'Liquid Funds', percentage: 10, description: 'Better returns than savings' },
            ],
        },
    ],
    moderate: [
        {
            category: 'Equity (50%)',
            subcategories: [
                { name: 'Large Cap Fund', percentage: 20, description: 'Blue chip stocks' },
                { name: 'Flexi Cap Fund', percentage: 15, description: 'Multi-cap flexibility' },
                { name: 'Mid Cap Fund', percentage: 10, description: 'Growth potential' },
                { name: 'International Fund', percentage: 5, description: 'Geographic diversification' },
            ],
        },
        {
            category: 'Debt (30%)',
            subcategories: [
                { name: 'PPF/EPF', percentage: 15, description: 'Tax benefits' },
                { name: 'Debt Mutual Funds', percentage: 15, description: 'Medium duration' },
            ],
        },
        {
            category: 'Gold (10%)',
            subcategories: [
                { name: 'Sovereign Gold Bonds', percentage: 7, description: 'Long-term gold holding' },
                { name: 'Gold ETF', percentage: 3, description: 'Tactical allocation' },
            ],
        },
        {
            category: 'Cash (10%)',
            subcategories: [
                { name: 'Liquid Funds', percentage: 7, description: 'Emergency + opportunity' },
                { name: 'Savings Account', percentage: 3, description: 'Immediate needs' },
            ],
        },
    ],
    aggressive: [
        {
            category: 'Equity (75%)',
            subcategories: [
                { name: 'Flexi Cap Fund', percentage: 20, description: 'Core holding' },
                { name: 'Mid Cap Fund', percentage: 20, description: 'High growth potential' },
                { name: 'Small Cap Fund', percentage: 15, description: 'Maximum growth' },
                { name: 'Sectoral/Thematic', percentage: 10, description: 'IT, Pharma, Banking' },
                { name: 'International Fund', percentage: 10, description: 'US/Global exposure' },
            ],
        },
        {
            category: 'Debt (15%)',
            subcategories: [
                { name: 'Short Duration Fund', percentage: 10, description: 'Low interest rate risk' },
                { name: 'Corporate Bond Fund', percentage: 5, description: 'Higher yields' },
            ],
        },
        {
            category: 'Gold (5%)',
            subcategories: [
                { name: 'Gold ETF', percentage: 5, description: 'Hedge against volatility' },
            ],
        },
        {
            category: 'Cash (5%)',
            subcategories: [
                { name: 'Liquid Funds', percentage: 5, description: 'Opportunity fund' },
            ],
        },
    ],
};

/**
 * Calculate investment amounts based on total and allocation
 */
export function calculateInvestmentAmounts(total: number, allocation: AssetAllocation): InvestmentAmount {
    return {
        total,
        equity: Math.round(total * (allocation.equity / 100)),
        debt: Math.round(total * (allocation.debt / 100)),
        gold: Math.round(total * (allocation.gold / 100)),
        cash: Math.round(total * (allocation.cash / 100)),
    };
}

/**
 * Get portfolio rebalancing recommendations
 */
export function getRebalanceRecommendations(
    currentPortfolio: InvestmentAmount,
    targetAllocation: AssetAllocation
): PortfolioRebalanceRecommendation[] {
    const totalValue = currentPortfolio.total;
    const recommendations: PortfolioRebalanceRecommendation[] = [];

    const assetClasses: (keyof AssetAllocation)[] = ['equity', 'debt', 'gold', 'cash'];

    for (const asset of assetClasses) {
        const currentValue = currentPortfolio[asset];
        const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
        const targetPercent = targetAllocation[asset];
        const targetValue = Math.round(totalValue * (targetPercent / 100));
        const difference = targetValue - currentValue;

        let action: 'buy' | 'sell' | 'hold' = 'hold';
        if (Math.abs(difference) > totalValue * 0.02) { // 2% threshold
            action = difference > 0 ? 'buy' : 'sell';
        }

        recommendations.push({
            assetClass: asset.charAt(0).toUpperCase() + asset.slice(1),
            currentPercent: Math.round(currentPercent * 10) / 10,
            targetPercent,
            currentValue,
            targetValue,
            action,
            amount: Math.abs(difference),
        });
    }

    return recommendations;
}

/**
 * Calculate optimal allocation for goal-based investing
 */
export function getGoalBasedAllocation(
    targetAmount: number,
    currentAmount: number,
    yearsToGoal: number,
    riskLevel: RiskLevel
): AssetAllocation {
    const baseAllocation = getAllocationForRiskLevel(riskLevel);

    // Adjust based on time horizon
    if (yearsToGoal <= 1) {
        // Very short term - be conservative
        return {
            equity: 0,
            debt: 40,
            gold: 10,
            cash: 50,
        };
    } else if (yearsToGoal <= 3) {
        // Short term - reduce equity
        return {
            equity: Math.min(baseAllocation.equity, 20),
            debt: 50,
            gold: 15,
            cash: 15,
        };
    } else if (yearsToGoal <= 5) {
        // Medium term - moderate approach
        return {
            equity: Math.min(baseAllocation.equity, 40),
            debt: 40,
            gold: 10,
            cash: 10,
        };
    }

    // Long term - use risk-based allocation
    return baseAllocation;
}

/**
 * Calculate required monthly SIP to reach goal
 */
export function calculateRequiredSIP(
    targetAmount: number,
    currentAmount: number,
    yearsToGoal: number,
    expectedReturn: number = 12 // Annual return %
): number {
    const monthlyRate = expectedReturn / 12 / 100;
    const months = yearsToGoal * 12;

    // Future value of current amount
    const fvCurrent = currentAmount * Math.pow(1 + monthlyRate, months);

    // Remaining amount needed from SIP
    const remainingTarget = targetAmount - fvCurrent;

    if (remainingTarget <= 0) return 0; // Already on track

    // SIP formula: P = FV * r / ((1+r)^n - 1)
    const sip = remainingTarget * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);

    return Math.ceil(sip);
}

/**
 * Get expected return based on allocation
 */
export function getExpectedReturn(allocation: AssetAllocation): number {
    // Historical average returns (approximate)
    const returns = {
        equity: 12,   // 12% for equity
        debt: 7,      // 7% for debt
        gold: 8,      // 8% for gold
        cash: 4,      // 4% for cash/savings
    };

    return (
        (allocation.equity / 100) * returns.equity +
        (allocation.debt / 100) * returns.debt +
        (allocation.gold / 100) * returns.gold +
        (allocation.cash / 100) * returns.cash
    );
}
