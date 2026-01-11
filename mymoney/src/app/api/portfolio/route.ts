import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { PaperPortfolio, PaperTrade } from '@/lib/db/models';
import { getStockQuote } from '@/lib/market-data';

const INITIAL_CAPITAL = 1000000; // 10 Lakh

// GET portfolio
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';

        let portfolio = await PaperPortfolio.findOne({ userId });

        // Initialize if doesn't exist
        if (!portfolio) {
            portfolio = await PaperPortfolio.create({
                userId,
                cash: INITIAL_CAPITAL,
                initialCapital: INITIAL_CAPITAL,
                positions: [],
            });
        }

        // Calculate current values for positions
        const positionsWithPrices = await Promise.all(
            portfolio.positions.map(async (pos) => {
                const quote = await getStockQuote(pos.symbol);
                const currentPrice = quote?.price || pos.avgPrice;
                const currentValue = pos.quantity * currentPrice;
                const investedValue = pos.quantity * pos.avgPrice;
                const pnl = currentValue - investedValue;
                const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

                return {
                    symbol: pos.symbol,
                    quantity: pos.quantity,
                    avgPrice: pos.avgPrice,
                    currentPrice,
                    currentValue,
                    pnl,
                    pnlPercent,
                };
            })
        );

        const investedValue = positionsWithPrices.reduce((acc, p) => acc + (p.quantity * p.avgPrice), 0);
        const currentValue = positionsWithPrices.reduce((acc, p) => acc + p.currentValue, 0);
        const totalValue = portfolio.cash + currentValue;
        const totalPnL = totalValue - portfolio.initialCapital;
        const totalPnLPercent = (totalPnL / portfolio.initialCapital) * 100;

        return NextResponse.json({
            cash: portfolio.cash,
            initialCapital: portfolio.initialCapital,
            positions: positionsWithPrices,
            totalValue,
            investedValue,
            totalPnL,
            totalPnLPercent,
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
    }
}

// POST execute trade (buy/sell)
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';
        const { symbol, type, quantity } = await request.json();

        if (!symbol || !type || !quantity || quantity <= 0) {
            return NextResponse.json({ error: 'Invalid trade parameters' }, { status: 400 });
        }

        // Get current price
        const quote = await getStockQuote(symbol);
        if (!quote) {
            return NextResponse.json({ error: 'Failed to get stock price' }, { status: 500 });
        }

        const price = quote.price;
        const total = price * quantity;

        let portfolio = await PaperPortfolio.findOne({ userId });

        // Initialize if doesn't exist
        if (!portfolio) {
            portfolio = await PaperPortfolio.create({
                userId,
                cash: INITIAL_CAPITAL,
                initialCapital: INITIAL_CAPITAL,
                positions: [],
            });
        }

        if (type === 'BUY') {
            // Check if enough cash
            if (total > portfolio.cash) {
                return NextResponse.json({
                    success: false,
                    message: 'Insufficient funds'
                }, { status: 400 });
            }

            // Update portfolio
            portfolio.cash -= total;

            const existingPosition = portfolio.positions.find(p => p.symbol === symbol);
            if (existingPosition) {
                // Calculate new average price
                const totalQty = existingPosition.quantity + quantity;
                const totalCost = (existingPosition.quantity * existingPosition.avgPrice) + total;
                existingPosition.avgPrice = totalCost / totalQty;
                existingPosition.quantity = totalQty;
            } else {
                portfolio.positions.push({
                    symbol,
                    quantity,
                    avgPrice: price,
                });
            }
        } else if (type === 'SELL') {
            const existingPosition = portfolio.positions.find(p => p.symbol === symbol);

            if (!existingPosition || existingPosition.quantity < quantity) {
                return NextResponse.json({
                    success: false,
                    message: 'Insufficient shares'
                }, { status: 400 });
            }

            // Update portfolio
            portfolio.cash += total;
            existingPosition.quantity -= quantity;

            // Remove position if sold all
            if (existingPosition.quantity === 0) {
                portfolio.positions = portfolio.positions.filter(p => p.symbol !== symbol);
            }
        } else {
            return NextResponse.json({ error: 'Invalid trade type' }, { status: 400 });
        }

        await portfolio.save();

        // Record trade
        await PaperTrade.create({
            userId,
            symbol,
            type,
            quantity,
            price,
            total,
        });

        return NextResponse.json({
            success: true,
            message: `${type} ${quantity} shares of ${symbol.replace('.NS', '')} at ₹${price.toFixed(2)}`
        });
    } catch (error) {
        console.error('Error executing trade:', error);
        return NextResponse.json({ error: 'Failed to execute trade' }, { status: 500 });
    }
}

// DELETE reset portfolio
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.headers.get('x-user-id') || 'default';

        await PaperPortfolio.findOneAndDelete({ userId });
        await PaperTrade.deleteMany({ userId });

        // Create fresh portfolio
        const portfolio = await PaperPortfolio.create({
            userId,
            cash: INITIAL_CAPITAL,
            initialCapital: INITIAL_CAPITAL,
            positions: [],
        });

        return NextResponse.json({
            success: true,
            portfolio,
            message: 'Portfolio reset successfully'
        });
    } catch (error) {
        console.error('Error resetting portfolio:', error);
        return NextResponse.json({ error: 'Failed to reset portfolio' }, { status: 500 });
    }
}
