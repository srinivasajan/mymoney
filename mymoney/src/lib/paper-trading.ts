// Paper Trading Engine
// Simulates real trading with live prices

import { getStockQuote, StockQuote } from './market-data';

export interface Trade {
    id: string;
    symbol: string;
    name: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    total: number;
    timestamp: string;
}

export interface Position {
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    totalValue: number;
    totalCost: number;
    pnl: number;
    pnlPercent: number;
    dayChange: number;
    dayChangePercent: number;
}

export interface Portfolio {
    cash: number;
    positions: Position[];
    totalValue: number;
    totalCost: number;
    totalPnL: number;
    totalPnLPercent: number;
    dayChange: number;
    dayChangePercent: number;
}

interface StoredPosition {
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
}

const STORAGE_KEYS = {
    TRADES: 'moonlight_trades',
    POSITIONS: 'moonlight_positions',
    CASH: 'moonlight_cash',
    INITIAL_CAPITAL: 'moonlight_initial_capital'
};

const DEFAULT_CAPITAL = 1000000; // 10 Lakhs starting capital

// Initialize portfolio
export function initializePortfolio(startingCapital: number = DEFAULT_CAPITAL): void {
    if (typeof window === 'undefined') return;

    // Only initialize if not already set
    if (!localStorage.getItem(STORAGE_KEYS.CASH)) {
        localStorage.setItem(STORAGE_KEYS.CASH, startingCapital.toString());
        localStorage.setItem(STORAGE_KEYS.INITIAL_CAPITAL, startingCapital.toString());
        localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify([]));
    }
}

// Get available cash
export function getCash(): number {
    if (typeof window === 'undefined') return DEFAULT_CAPITAL;
    const cash = localStorage.getItem(STORAGE_KEYS.CASH);
    return cash ? parseFloat(cash) : DEFAULT_CAPITAL;
}

// Get initial capital for return calculations
export function getInitialCapital(): number {
    if (typeof window === 'undefined') return DEFAULT_CAPITAL;
    const capital = localStorage.getItem(STORAGE_KEYS.INITIAL_CAPITAL);
    return capital ? parseFloat(capital) : DEFAULT_CAPITAL;
}

// Get stored positions
function getStoredPositions(): StoredPosition[] {
    if (typeof window === 'undefined') return [];
    const positions = localStorage.getItem(STORAGE_KEYS.POSITIONS);
    return positions ? JSON.parse(positions) : [];
}

// Save positions
function savePositions(positions: StoredPosition[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
}

// Get all trades
export function getTrades(): Trade[] {
    if (typeof window === 'undefined') return [];
    const trades = localStorage.getItem(STORAGE_KEYS.TRADES);
    return trades ? JSON.parse(trades) : [];
}

// Save trade
function saveTrade(trade: Trade): void {
    if (typeof window === 'undefined') return;
    const trades = getTrades();
    trades.unshift(trade); // Add to beginning
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
}

// Update cash
function updateCash(amount: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CASH, amount.toString());
}

// Execute a BUY order
export async function executeBuy(
    symbol: string,
    quantity: number
): Promise<{ success: boolean; message: string; trade?: Trade }> {
    // Get current price
    const quote = await getStockQuote(symbol);
    if (!quote) {
        return { success: false, message: 'Could not fetch stock price' };
    }

    const totalCost = quote.price * quantity;
    const currentCash = getCash();

    // Check if enough cash
    if (totalCost > currentCash) {
        return {
            success: false,
            message: `Insufficient funds. Need ₹${totalCost.toLocaleString('en-IN')} but only have ₹${currentCash.toLocaleString('en-IN')}`
        };
    }

    // Create trade record
    const trade: Trade = {
        id: `trade_${Date.now()}`,
        symbol: quote.symbol,
        name: quote.name,
        type: 'BUY',
        quantity,
        price: quote.price,
        total: totalCost,
        timestamp: new Date().toISOString()
    };

    // Update position
    const positions = getStoredPositions();
    const existingIndex = positions.findIndex(p => p.symbol === symbol);

    if (existingIndex >= 0) {
        // Average up existing position
        const existing = positions[existingIndex];
        const newQuantity = existing.quantity + quantity;
        const newAvgPrice = ((existing.avgPrice * existing.quantity) + totalCost) / newQuantity;
        positions[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            avgPrice: newAvgPrice
        };
    } else {
        // New position
        positions.push({
            symbol: quote.symbol,
            name: quote.name,
            quantity,
            avgPrice: quote.price
        });
    }

    // Deduct cash and save
    updateCash(currentCash - totalCost);
    savePositions(positions);
    saveTrade(trade);

    return {
        success: true,
        message: `Bought ${quantity} shares of ${quote.name} at ₹${quote.price.toLocaleString('en-IN')}`,
        trade
    };
}

// Execute a SELL order
export async function executeSell(
    symbol: string,
    quantity: number
): Promise<{ success: boolean; message: string; trade?: Trade }> {
    // Get current price
    const quote = await getStockQuote(symbol);
    if (!quote) {
        return { success: false, message: 'Could not fetch stock price' };
    }

    // Check if we have enough shares
    const positions = getStoredPositions();
    const existingIndex = positions.findIndex(p => p.symbol === symbol);

    if (existingIndex < 0) {
        return { success: false, message: `You don't own any shares of ${symbol}` };
    }

    const existing = positions[existingIndex];
    if (existing.quantity < quantity) {
        return {
            success: false,
            message: `Insufficient shares. You only own ${existing.quantity} shares of ${symbol}`
        };
    }

    const totalValue = quote.price * quantity;

    // Create trade record
    const trade: Trade = {
        id: `trade_${Date.now()}`,
        symbol: quote.symbol,
        name: quote.name,
        type: 'SELL',
        quantity,
        price: quote.price,
        total: totalValue,
        timestamp: new Date().toISOString()
    };

    // Update position
    if (existing.quantity === quantity) {
        // Close entire position
        positions.splice(existingIndex, 1);
    } else {
        // Reduce position
        positions[existingIndex] = {
            ...existing,
            quantity: existing.quantity - quantity
        };
    }

    // Add cash and save
    updateCash(getCash() + totalValue);
    savePositions(positions);
    saveTrade(trade);

    return {
        success: true,
        message: `Sold ${quantity} shares of ${quote.name} at ₹${quote.price.toLocaleString('en-IN')}`,
        trade
    };
}

// Get full portfolio with live prices
export async function getPortfolio(): Promise<Portfolio> {
    const storedPositions = getStoredPositions();
    const cash = getCash();
    const initialCapital = getInitialCapital();

    if (storedPositions.length === 0) {
        return {
            cash,
            positions: [],
            totalValue: cash,
            totalCost: initialCapital,
            totalPnL: cash - initialCapital,
            totalPnLPercent: ((cash - initialCapital) / initialCapital) * 100,
            dayChange: 0,
            dayChangePercent: 0
        };
    }

    // Fetch live prices for all positions
    const positionsWithPrices: Position[] = await Promise.all(
        storedPositions.map(async (pos) => {
            const quote = await getStockQuote(pos.symbol);
            const currentPrice = quote?.price || pos.avgPrice;
            const totalValue = currentPrice * pos.quantity;
            const totalCost = pos.avgPrice * pos.quantity;
            const pnl = totalValue - totalCost;
            const dayChange = (quote?.change || 0) * pos.quantity;

            return {
                symbol: pos.symbol,
                name: pos.name,
                quantity: pos.quantity,
                avgPrice: pos.avgPrice,
                currentPrice,
                totalValue,
                totalCost,
                pnl,
                pnlPercent: (pnl / totalCost) * 100,
                dayChange,
                dayChangePercent: quote?.changePercent || 0
            };
        })
    );

    const totalPositionsValue = positionsWithPrices.reduce((sum, p) => sum + p.totalValue, 0);
    const totalPositionsCost = positionsWithPrices.reduce((sum, p) => sum + p.totalCost, 0);
    const totalDayChange = positionsWithPrices.reduce((sum, p) => sum + p.dayChange, 0);

    const totalValue = cash + totalPositionsValue;
    const totalPnL = totalValue - initialCapital;
    const prevDayValue = totalValue - totalDayChange;

    return {
        cash,
        positions: positionsWithPrices,
        totalValue,
        totalCost: totalPositionsCost,
        totalPnL,
        totalPnLPercent: (totalPnL / initialCapital) * 100,
        dayChange: totalDayChange,
        dayChangePercent: prevDayValue > 0 ? (totalDayChange / prevDayValue) * 100 : 0
    };
}

// Reset portfolio
export function resetPortfolio(startingCapital: number = DEFAULT_CAPITAL): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CASH, startingCapital.toString());
    localStorage.setItem(STORAGE_KEYS.INITIAL_CAPITAL, startingCapital.toString());
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify([]));
}

// Calculate portfolio metrics for analytics
export async function getPortfolioMetrics(): Promise<{
    totalReturn: number;
    sharpeRatio: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
}> {
    const trades = getTrades();
    const portfolio = await getPortfolio();

    // Calculate win/loss from closed positions
    const sellTrades = trades.filter(t => t.type === 'SELL');
    const buyTradesMap = new Map<string, Trade[]>();

    trades.filter(t => t.type === 'BUY').forEach(t => {
        const existing = buyTradesMap.get(t.symbol) || [];
        existing.push(t);
        buyTradesMap.set(t.symbol, existing);
    });

    let wins = 0;
    let losses = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;

    // Simplified P&L calculation
    sellTrades.forEach(sell => {
        const buys = buyTradesMap.get(sell.symbol) || [];
        if (buys.length > 0) {
            const avgBuyPrice = buys.reduce((sum, b) => sum + b.price, 0) / buys.length;
            const pnl = (sell.price - avgBuyPrice) * sell.quantity;
            if (pnl > 0) {
                wins++;
                totalWinAmount += pnl;
            } else {
                losses++;
                totalLossAmount += Math.abs(pnl);
            }
        }
    });

    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const avgWin = wins > 0 ? totalWinAmount / wins : 0;
    const avgLoss = losses > 0 ? totalLossAmount / losses : 0;

    // Simple Sharpe approximation
    const totalReturn = portfolio.totalPnLPercent;
    const riskFreeRate = 6; // 6% risk-free rate
    const volatility = 15; // Assumed volatility
    const sharpeRatio = (totalReturn - riskFreeRate) / volatility;

    return {
        totalReturn,
        sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
        winRate: parseFloat(winRate.toFixed(1)),
        avgWin,
        avgLoss
    };
}
