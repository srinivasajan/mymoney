// =====================================================
// PAPER TRADING SYSTEM
// Virtual portfolio for simulated trading
// =====================================================

import { v4 as uuidv4 } from 'uuid';

// Storage keys
const STORAGE_KEYS = {
    VIRTUAL_PORTFOLIO: 'iap_virtual_portfolio',
    PAPER_TRADES: 'iap_paper_trades',
    WATCHLIST: 'iap_watchlist',
} as const;

// Types
export interface VirtualPortfolio {
    id: string;
    userId: string;
    cashBalance: number;
    initialBalance: number;
    createdAt: string;
    updatedAt: string;
}

export interface PaperTrade {
    id: string;
    userId: string;
    type: 'buy' | 'sell';
    assetType: 'stock' | 'mutual_fund' | 'etf';
    symbol: string;
    name: string;
    quantity: number;
    price: number;
    totalValue: number;
    executedAt: string;
    notes?: string;
}

export interface VirtualHolding {
    symbol: string;
    name: string;
    assetType: 'stock' | 'mutual_fund' | 'etf';
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    investedValue: number;
    currentValue: number;
    pnl: number;
    pnlPercent: number;
}

export interface PortfolioSummary {
    totalValue: number;
    investedValue: number;
    cashBalance: number;
    holdings: VirtualHolding[];
    totalPnl: number;
    totalPnlPercent: number;
    dayChange: number;
    dayChangePercent: number;
}

export interface WatchlistItem {
    id: string;
    symbol: string;
    name: string;
    assetType: 'stock' | 'mutual_fund' | 'etf';
    addedAt: string;
    targetPrice?: number;
    notes?: string;
}

// Default starting balance: ₹1,00,000 (more realistic for youth)
const DEFAULT_STARTING_BALANCE = 100000;
const DEFAULT_USER_ID = 'local-user';

// =====================================================
// Helper Functions
// =====================================================

function getStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
}

function setStorageItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

// =====================================================
// Portfolio Management
// =====================================================

/**
 * Get or create virtual portfolio
 */
export function getVirtualPortfolio(): VirtualPortfolio {
    const existing = getStorageItem<VirtualPortfolio | null>(STORAGE_KEYS.VIRTUAL_PORTFOLIO, null);

    if (existing) return existing;

    // Create new portfolio
    const newPortfolio: VirtualPortfolio = {
        id: uuidv4(),
        userId: DEFAULT_USER_ID,
        cashBalance: DEFAULT_STARTING_BALANCE,
        initialBalance: DEFAULT_STARTING_BALANCE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    setStorageItem(STORAGE_KEYS.VIRTUAL_PORTFOLIO, newPortfolio);
    return newPortfolio;
}

/**
 * Reset portfolio to initial state
 */
export function resetVirtualPortfolio(): VirtualPortfolio {
    const newPortfolio: VirtualPortfolio = {
        id: uuidv4(),
        userId: DEFAULT_USER_ID,
        cashBalance: DEFAULT_STARTING_BALANCE,
        initialBalance: DEFAULT_STARTING_BALANCE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    setStorageItem(STORAGE_KEYS.VIRTUAL_PORTFOLIO, newPortfolio);
    setStorageItem(STORAGE_KEYS.PAPER_TRADES, []);

    return newPortfolio;
}

/**
 * Update cash balance
 */
function updateCashBalance(amount: number): void {
    const portfolio = getVirtualPortfolio();
    portfolio.cashBalance += amount;
    portfolio.updatedAt = new Date().toISOString();
    setStorageItem(STORAGE_KEYS.VIRTUAL_PORTFOLIO, portfolio);
}

// =====================================================
// Trade Execution
// =====================================================

/**
 * Get all paper trades
 */
export function getPaperTrades(): PaperTrade[] {
    return getStorageItem<PaperTrade[]>(STORAGE_KEYS.PAPER_TRADES, []);
}

/**
 * Execute a buy order
 */
export function executeBuyOrder(
    symbol: string,
    name: string,
    assetType: 'stock' | 'mutual_fund' | 'etf',
    quantity: number,
    price: number,
    notes?: string
): { success: boolean; message: string; trade?: PaperTrade } {
    const portfolio = getVirtualPortfolio();
    const totalCost = quantity * price;

    // Check if sufficient balance
    if (totalCost > portfolio.cashBalance) {
        return {
            success: false,
            message: `Insufficient balance. Required: ₹${totalCost.toLocaleString()}, Available: ₹${portfolio.cashBalance.toLocaleString()}`,
        };
    }

    // Create trade
    const trade: PaperTrade = {
        id: uuidv4(),
        userId: DEFAULT_USER_ID,
        type: 'buy',
        assetType,
        symbol,
        name,
        quantity,
        price,
        totalValue: totalCost,
        executedAt: new Date().toISOString(),
        notes,
    };

    // Save trade
    const trades = getPaperTrades();
    trades.push(trade);
    setStorageItem(STORAGE_KEYS.PAPER_TRADES, trades);

    // Deduct from cash
    updateCashBalance(-totalCost);

    return {
        success: true,
        message: `Bought ${quantity} units of ${symbol} at ₹${price}`,
        trade,
    };
}

/**
 * Execute a sell order
 */
export function executeSellOrder(
    symbol: string,
    name: string,
    assetType: 'stock' | 'mutual_fund' | 'etf',
    quantity: number,
    price: number,
    notes?: string
): { success: boolean; message: string; trade?: PaperTrade } {
    // Check holdings
    const holdings = calculateHoldings();
    const holding = holdings.find(h => h.symbol === symbol);

    if (!holding || holding.quantity < quantity) {
        return {
            success: false,
            message: `Insufficient holdings. You have ${holding?.quantity || 0} units of ${symbol}`,
        };
    }

    const totalValue = quantity * price;

    // Create trade
    const trade: PaperTrade = {
        id: uuidv4(),
        userId: DEFAULT_USER_ID,
        type: 'sell',
        assetType,
        symbol,
        name,
        quantity,
        price,
        totalValue,
        executedAt: new Date().toISOString(),
        notes,
    };

    // Save trade
    const trades = getPaperTrades();
    trades.push(trade);
    setStorageItem(STORAGE_KEYS.PAPER_TRADES, trades);

    // Add to cash
    updateCashBalance(totalValue);

    return {
        success: true,
        message: `Sold ${quantity} units of ${symbol} at ₹${price}`,
        trade,
    };
}

// =====================================================
// Holdings Calculation
// =====================================================

/**
 * Calculate current holdings from trades
 */
export function calculateHoldings(currentPrices?: Record<string, number>): VirtualHolding[] {
    const trades = getPaperTrades();
    const holdingsMap: Record<string, {
        symbol: string;
        name: string;
        assetType: 'stock' | 'mutual_fund' | 'etf';
        totalQuantity: number;
        totalCost: number;
    }> = {};

    // Aggregate trades
    for (const trade of trades) {
        if (!holdingsMap[trade.symbol]) {
            holdingsMap[trade.symbol] = {
                symbol: trade.symbol,
                name: trade.name,
                assetType: trade.assetType,
                totalQuantity: 0,
                totalCost: 0,
            };
        }

        if (trade.type === 'buy') {
            holdingsMap[trade.symbol].totalQuantity += trade.quantity;
            holdingsMap[trade.symbol].totalCost += trade.totalValue;
        } else {
            holdingsMap[trade.symbol].totalQuantity -= trade.quantity;
            holdingsMap[trade.symbol].totalCost -= trade.quantity * (holdingsMap[trade.symbol].totalCost / holdingsMap[trade.symbol].totalQuantity);
        }
    }

    // Convert to holdings array
    const holdings: VirtualHolding[] = [];

    for (const [symbol, data] of Object.entries(holdingsMap)) {
        if (data.totalQuantity <= 0) continue;

        const avgPrice = data.totalCost / data.totalQuantity;
        const currentPrice = currentPrices?.[symbol] || avgPrice; // Use avg if no current price
        const currentValue = data.totalQuantity * currentPrice;
        const pnl = currentValue - data.totalCost;
        const pnlPercent = (pnl / data.totalCost) * 100;

        holdings.push({
            symbol: data.symbol,
            name: data.name,
            assetType: data.assetType,
            quantity: data.totalQuantity,
            avgPrice,
            currentPrice,
            investedValue: data.totalCost,
            currentValue,
            pnl,
            pnlPercent,
        });
    }

    return holdings;
}

/**
 * Get portfolio summary
 */
export function getPortfolioSummary(currentPrices?: Record<string, number>): PortfolioSummary {
    const portfolio = getVirtualPortfolio();
    const holdings = calculateHoldings(currentPrices);

    const investedValue = holdings.reduce((sum, h) => sum + h.investedValue, 0);
    const holdingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalValue = portfolio.cashBalance + holdingsValue;
    const totalPnl = totalValue - portfolio.initialBalance;
    const totalPnlPercent = (totalPnl / portfolio.initialBalance) * 100;

    return {
        totalValue,
        investedValue,
        cashBalance: portfolio.cashBalance,
        holdings,
        totalPnl,
        totalPnlPercent,
        dayChange: 0, // TODO: Calculate from daily price changes
        dayChangePercent: 0,
    };
}

// =====================================================
// Watchlist
// =====================================================

/**
 * Get watchlist
 */
export function getWatchlist(): WatchlistItem[] {
    return getStorageItem<WatchlistItem[]>(STORAGE_KEYS.WATCHLIST, []);
}

/**
 * Add to watchlist
 */
export function addToWatchlist(
    symbol: string,
    name: string,
    assetType: 'stock' | 'mutual_fund' | 'etf',
    targetPrice?: number,
    notes?: string
): WatchlistItem {
    const watchlist = getWatchlist();

    const item: WatchlistItem = {
        id: uuidv4(),
        symbol,
        name,
        assetType,
        addedAt: new Date().toISOString(),
        targetPrice,
        notes,
    };

    watchlist.push(item);
    setStorageItem(STORAGE_KEYS.WATCHLIST, watchlist);

    return item;
}

/**
 * Remove from watchlist
 */
export function removeFromWatchlist(id: string): void {
    const watchlist = getWatchlist();
    const filtered = watchlist.filter(item => item.id !== id);
    setStorageItem(STORAGE_KEYS.WATCHLIST, filtered);
}
