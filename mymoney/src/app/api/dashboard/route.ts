import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Asset, Liability, Investment, Goal, Transaction } from '@/lib/db/models';

// GET dashboard summary
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';

        // Fetch all data in parallel
        const [assets, liabilities, investments, goals, recentTransactions] = await Promise.all([
            Asset.find({ userId }),
            Liability.find({ userId }),
            Investment.find({ userId }),
            Goal.find({ userId, status: 'active' }),
            Transaction.find({ userId }).sort({ date: -1 }).limit(10),
        ]);

        // Calculate totals
        const totalAssets = assets.reduce((acc, a) => acc + a.value, 0);
        const totalLiabilities = liabilities.reduce((acc, l) => acc + l.currentBalance, 0);
        const totalInvested = investments.reduce((acc, i) => acc + i.investedAmount, 0);
        const totalInvestmentValue = investments.reduce((acc, i) => acc + i.currentValue, 0);
        const investmentReturns = totalInvestmentValue - totalInvested;
        const netWorth = totalAssets + totalInvestmentValue - totalLiabilities;

        // Monthly cashflow from transactions
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyTransactions = await Transaction.find({
            userId,
            date: { $gte: startOfMonth },
        });

        const monthlyIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
        const monthlyExpenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        return NextResponse.json({
            summary: {
                netWorth,
                totalAssets,
                totalLiabilities,
                totalInvested,
                totalInvestmentValue,
                investmentReturns,
                investmentReturnsPercent: totalInvested > 0 ? (investmentReturns / totalInvested) * 100 : 0,
            },
            cashflow: {
                monthlyIncome,
                monthlyExpenses,
                monthlySavings: monthlyIncome - monthlyExpenses,
            },
            counts: {
                assets: assets.length,
                liabilities: liabilities.length,
                investments: investments.length,
                activeGoals: goals.length,
            },
            recentTransactions: recentTransactions.map(t => ({
                _id: t._id,
                type: t.type,
                category: t.category,
                amount: t.amount,
                description: t.description,
                date: t.date,
            })),
            goals: goals.map(g => ({
                _id: g._id,
                name: g.name,
                targetAmount: g.targetAmount,
                currentAmount: g.currentAmount,
                progress: (g.currentAmount / g.targetAmount) * 100,
                targetDate: g.targetDate,
            })),
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
    }
}
