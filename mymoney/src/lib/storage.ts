// =====================================================
// LOCAL STORAGE SERVICE
// Provides data persistence using browser's localStorage
// Acts as a fallback/alternative to Supabase for development
// =====================================================

import {
    Asset,
    Liability,
    StockHolding,
    MFHolding,
    Goal,
    NetWorthSnapshot,
    UserProfile,
    AssetFormData,
    LiabilityFormData,
    StockHoldingFormData,
    MFHoldingFormData,
    GoalFormData,
    Transaction,
    TransactionFormData
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Storage Keys
const STORAGE_KEYS = {
    USER_PROFILE: 'iap_user_profile',
    ASSETS: 'iap_assets',
    LIABILITIES: 'iap_liabilities',
    STOCK_HOLDINGS: 'iap_stock_holdings',
    MF_HOLDINGS: 'iap_mf_holdings',
    GOALS: 'iap_goals',
    NET_WORTH_SNAPSHOTS: 'iap_net_worth_snapshots',
    MARKET_CACHE: 'iap_market_cache',
    TRANSACTIONS: 'iap_transactions',
} as const;

// Helper Functions
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

const DEFAULT_USER_ID = 'local-user';

// ============ USER PROFILE ============
export function getUserProfile(): UserProfile {
    return getStorageItem<UserProfile>(STORAGE_KEYS.USER_PROFILE, {
        id: DEFAULT_USER_ID,
        full_name: null,
        risk_tolerance: null,
        investment_horizon: null,
        monthly_income: null,
        monthly_expenses: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });
}

export function updateUserProfile(data: Partial<UserProfile>): UserProfile {
    const current = getUserProfile();
    const updated = {
        ...current,
        ...data,
        updated_at: new Date().toISOString(),
    };
    setStorageItem(STORAGE_KEYS.USER_PROFILE, updated);
    return updated;
}

// ============ ASSETS ============
export function getAssets(): Asset[] {
    return getStorageItem<Asset[]>(STORAGE_KEYS.ASSETS, []);
}

export function getAssetById(id: string): Asset | null {
    const assets = getAssets();
    return assets.find(a => a.id === id) || null;
}

export function createAsset(data: AssetFormData): Asset {
    const assets = getAssets();
    const newAsset: Asset = {
        id: uuidv4(),
        user_id: DEFAULT_USER_ID,
        category: data.category,
        name: data.name,
        institution: data.institution || null,
        current_value: data.current_value,
        purchase_value: data.purchase_value || null,
        purchase_date: data.purchase_date || null,
        maturity_date: data.maturity_date || null,
        interest_rate: data.interest_rate || null,
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    assets.push(newAsset);
    setStorageItem(STORAGE_KEYS.ASSETS, assets);
    return newAsset;
}

export function updateAsset(id: string, data: Partial<AssetFormData>): Asset | null {
    const assets = getAssets();
    const index = assets.findIndex(a => a.id === id);
    if (index === -1) return null;

    assets[index] = {
        ...assets[index],
        ...data,
        updated_at: new Date().toISOString(),
    };
    setStorageItem(STORAGE_KEYS.ASSETS, assets);
    return assets[index];
}

export function deleteAsset(id: string): boolean {
    const assets = getAssets();
    const filtered = assets.filter(a => a.id !== id);
    if (filtered.length === assets.length) return false;
    setStorageItem(STORAGE_KEYS.ASSETS, filtered);
    return true;
}

export function getTotalAssets(): number {
    return getAssets().reduce((sum, a) => sum + a.current_value, 0);
}

export function getAssetsByCategory(): Record<string, number> {
    const assets = getAssets();
    return assets.reduce((acc, asset) => {
        acc[asset.category] = (acc[asset.category] || 0) + asset.current_value;
        return acc;
    }, {} as Record<string, number>);
}

// ============ LIABILITIES ============
export function getLiabilities(): Liability[] {
    return getStorageItem<Liability[]>(STORAGE_KEYS.LIABILITIES, []);
}

export function getLiabilityById(id: string): Liability | null {
    const liabilities = getLiabilities();
    return liabilities.find(l => l.id === id) || null;
}

export function createLiability(data: LiabilityFormData): Liability {
    const liabilities = getLiabilities();
    const newLiability: Liability = {
        id: uuidv4(),
        user_id: DEFAULT_USER_ID,
        category: data.category,
        name: data.name,
        institution: data.institution || null,
        principal_amount: data.principal_amount,
        outstanding_amount: data.outstanding_amount,
        interest_rate: data.interest_rate || null,
        emi_amount: data.emi_amount || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    liabilities.push(newLiability);
    setStorageItem(STORAGE_KEYS.LIABILITIES, liabilities);
    return newLiability;
}

export function updateLiability(id: string, data: Partial<LiabilityFormData>): Liability | null {
    const liabilities = getLiabilities();
    const index = liabilities.findIndex(l => l.id === id);
    if (index === -1) return null;

    liabilities[index] = {
        ...liabilities[index],
        ...data,
        updated_at: new Date().toISOString(),
    };
    setStorageItem(STORAGE_KEYS.LIABILITIES, liabilities);
    return liabilities[index];
}

export function deleteLiability(id: string): boolean {
    const liabilities = getLiabilities();
    const filtered = liabilities.filter(l => l.id !== id);
    if (filtered.length === liabilities.length) return false;
    setStorageItem(STORAGE_KEYS.LIABILITIES, filtered);
    return true;
}

export function getTotalLiabilities(): number {
    return getLiabilities().reduce((sum, l) => sum + l.outstanding_amount, 0);
}

export function getLiabilitiesByCategory(): Record<string, number> {
    const liabilities = getLiabilities();
    return liabilities.reduce((acc, liability) => {
        acc[liability.category] = (acc[liability.category] || 0) + liability.outstanding_amount;
        return acc;
    }, {} as Record<string, number>);
}

// ============ STOCK HOLDINGS ============
export function getStockHoldings(): StockHolding[] {
    return getStorageItem<StockHolding[]>(STORAGE_KEYS.STOCK_HOLDINGS, []);
}

export function getStockHoldingById(id: string): StockHolding | null {
    const holdings = getStockHoldings();
    return holdings.find(h => h.id === id) || null;
}

export function createStockHolding(data: StockHoldingFormData): StockHolding {
    const holdings = getStockHoldings();

    // Check if holding already exists for this symbol/exchange
    const existing = holdings.find(
        h => h.symbol === data.symbol && h.exchange === data.exchange
    );

    if (existing) {
        // Update existing holding (average price calculation)
        const totalValue = (existing.quantity * existing.average_price) +
            (data.quantity * data.average_price);
        const totalQuantity = existing.quantity + data.quantity;
        existing.quantity = totalQuantity;
        existing.average_price = totalValue / totalQuantity;
        existing.updated_at = new Date().toISOString();
        setStorageItem(STORAGE_KEYS.STOCK_HOLDINGS, holdings);
        return existing;
    }

    const newHolding: StockHolding = {
        id: uuidv4(),
        user_id: DEFAULT_USER_ID,
        symbol: data.symbol.toUpperCase(),
        exchange: data.exchange,
        quantity: data.quantity,
        average_price: data.average_price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    holdings.push(newHolding);
    setStorageItem(STORAGE_KEYS.STOCK_HOLDINGS, holdings);
    return newHolding;
}

export function updateStockHolding(id: string, data: Partial<StockHoldingFormData>): StockHolding | null {
    const holdings = getStockHoldings();
    const index = holdings.findIndex(h => h.id === id);
    if (index === -1) return null;

    holdings[index] = {
        ...holdings[index],
        ...data,
        symbol: data.symbol?.toUpperCase() || holdings[index].symbol,
        updated_at: new Date().toISOString(),
    };
    setStorageItem(STORAGE_KEYS.STOCK_HOLDINGS, holdings);
    return holdings[index];
}

export function deleteStockHolding(id: string): boolean {
    const holdings = getStockHoldings();
    const filtered = holdings.filter(h => h.id !== id);
    if (filtered.length === holdings.length) return false;
    setStorageItem(STORAGE_KEYS.STOCK_HOLDINGS, filtered);
    return true;
}

export function getTotalStockValue(): number {
    return getStockHoldings().reduce(
        (sum, h) => sum + (h.quantity * (h.current_price || h.average_price)),
        0
    );
}

// ============ MUTUAL FUND HOLDINGS ============
export function getMFHoldings(): MFHolding[] {
    return getStorageItem<MFHolding[]>(STORAGE_KEYS.MF_HOLDINGS, []);
}

export function getMFHoldingById(id: string): MFHolding | null {
    const holdings = getMFHoldings();
    return holdings.find(h => h.id === id) || null;
}

export function createMFHolding(data: MFHoldingFormData): MFHolding {
    const holdings = getMFHoldings();

    // Check if holding already exists for this scheme
    const existing = holdings.find(h => h.scheme_code === data.scheme_code);

    if (existing) {
        // Update existing holding (average NAV calculation)
        const totalValue = (existing.units * existing.average_nav) +
            (data.units * data.average_nav);
        const totalUnits = existing.units + data.units;
        existing.units = totalUnits;
        existing.average_nav = totalValue / totalUnits;
        existing.updated_at = new Date().toISOString();
        setStorageItem(STORAGE_KEYS.MF_HOLDINGS, holdings);
        return existing;
    }

    const newHolding: MFHolding = {
        id: uuidv4(),
        user_id: DEFAULT_USER_ID,
        scheme_code: data.scheme_code,
        scheme_name: data.scheme_name,
        units: data.units,
        average_nav: data.average_nav,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    holdings.push(newHolding);
    setStorageItem(STORAGE_KEYS.MF_HOLDINGS, holdings);
    return newHolding;
}

export function updateMFHolding(id: string, data: Partial<MFHoldingFormData>): MFHolding | null {
    const holdings = getMFHoldings();
    const index = holdings.findIndex(h => h.id === id);
    if (index === -1) return null;

    holdings[index] = {
        ...holdings[index],
        ...data,
        updated_at: new Date().toISOString(),
    };
    setStorageItem(STORAGE_KEYS.MF_HOLDINGS, holdings);
    return holdings[index];
}

export function deleteMFHolding(id: string): boolean {
    const holdings = getMFHoldings();
    const filtered = holdings.filter(h => h.id !== id);
    if (filtered.length === holdings.length) return false;
    setStorageItem(STORAGE_KEYS.MF_HOLDINGS, filtered);
    return true;
}

export function getTotalMFValue(): number {
    return getMFHoldings().reduce(
        (sum, h) => sum + (h.units * (h.current_nav || h.average_nav)),
        0
    );
}

// ============ GOALS ============
export function getGoals(): Goal[] {
    return getStorageItem<Goal[]>(STORAGE_KEYS.GOALS, []);
}

export function getGoalById(id: string): Goal | null {
    const goals = getGoals();
    return goals.find(g => g.id === id) || null;
}

export function createGoal(data: GoalFormData): Goal {
    const goals = getGoals();
    const newGoal: Goal = {
        id: uuidv4(),
        user_id: DEFAULT_USER_ID,
        name: data.name,
        target_amount: data.target_amount,
        current_amount: data.current_amount || 0,
        target_date: data.target_date || null,
        priority: data.priority || null,
        category: data.category || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    goals.push(newGoal);
    setStorageItem(STORAGE_KEYS.GOALS, goals);
    return newGoal;
}

export function updateGoal(id: string, data: Partial<GoalFormData>): Goal | null {
    const goals = getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return null;

    goals[index] = {
        ...goals[index],
        ...data,
        updated_at: new Date().toISOString(),
    };
    setStorageItem(STORAGE_KEYS.GOALS, goals);
    return goals[index];
}

export function deleteGoal(id: string): boolean {
    const goals = getGoals();
    const filtered = goals.filter(g => g.id !== id);
    if (filtered.length === goals.length) return false;
    setStorageItem(STORAGE_KEYS.GOALS, filtered);
    return true;
}

// ============ NET WORTH SNAPSHOTS ============
export function getNetWorthSnapshots(): NetWorthSnapshot[] {
    return getStorageItem<NetWorthSnapshot[]>(STORAGE_KEYS.NET_WORTH_SNAPSHOTS, []);
}

export function createNetWorthSnapshot(): NetWorthSnapshot {
    const snapshots = getNetWorthSnapshots();
    const today = new Date().toISOString().split('T')[0];

    // Check if snapshot already exists for today
    const existingIndex = snapshots.findIndex(s => s.snapshot_date === today);

    const totalAssets = getTotalAssets() + getTotalStockValue() + getTotalMFValue();
    const totalLiabilities = getTotalLiabilities();

    const snapshot: NetWorthSnapshot = {
        id: existingIndex >= 0 ? snapshots[existingIndex].id : uuidv4(),
        user_id: DEFAULT_USER_ID,
        snapshot_date: today,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: totalAssets - totalLiabilities,
        asset_breakdown: getAssetsByCategory() as Record<string, number>,
        liability_breakdown: getLiabilitiesByCategory() as Record<string, number>,
        created_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
        snapshots[existingIndex] = snapshot;
    } else {
        snapshots.push(snapshot);
    }

    // Keep only last 365 snapshots
    const sorted = snapshots.sort((a, b) =>
        new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
    ).slice(0, 365);

    setStorageItem(STORAGE_KEYS.NET_WORTH_SNAPSHOTS, sorted);
    return snapshot;
}

export function getLatestNetWorthSnapshot(): NetWorthSnapshot | null {
    const snapshots = getNetWorthSnapshots();
    if (snapshots.length === 0) return null;
    return snapshots.sort((a, b) =>
        new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
    )[0];
}

// ============ DASHBOARD SUMMARY ============
export function getDashboardSummary() {
    const totalAssets = getTotalAssets() + getTotalStockValue() + getTotalMFValue();
    const totalLiabilities = getTotalLiabilities();
    const netWorth = totalAssets - totalLiabilities;

    const snapshots = getNetWorthSnapshots();
    const latestSnapshot = snapshots.sort((a, b) =>
        new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
    )[1]; // Get previous snapshot (index 1, not 0)

    const previousNetWorth = latestSnapshot?.net_worth || netWorth;
    const netWorthChange = netWorth - previousNetWorth;
    const netWorthChangePercent = previousNetWorth !== 0
        ? (netWorthChange / previousNetWorth) * 100
        : 0;

    const goals = getGoals();
    const goalsProgress = goals.length > 0
        ? goals.reduce((sum, g) => sum + (g.current_amount / g.target_amount), 0) / goals.length * 100
        : 0;

    return {
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: netWorth,
        net_worth_change: netWorthChange,
        net_worth_change_percent: netWorthChangePercent,
        asset_allocation: getAssetsByCategory(),
        liability_allocation: getLiabilitiesByCategory(),
        investment_value: getTotalStockValue() + getTotalMFValue(),
        investment_gain_loss: 0, // TODO: Calculate from market data
        goals_progress: goalsProgress,
    };
}

// ============ MONTH-OVER-MONTH CHANGES ============
export function getMonthOverMonthChanges() {
    const snapshots = getNetWorthSnapshots();
    if (snapshots.length < 2) {
        return {
            assetsChange: 0,
            assetsChangePercent: 0,
            liabilitiesChange: 0,
            liabilitiesChangePercent: 0,
            netWorthChange: 0,
            netWorthChangePercent: 0,
            investmentsChange: 0,
            investmentsChangePercent: 0,
            hasPreviousData: false,
        };
    }

    // Sort by date descending
    const sorted = [...snapshots].sort((a, b) =>
        new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
    );

    // Get current and previous month snapshots
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Find the latest snapshot from current period
    const currentSnapshot = sorted[0];

    // Find the last snapshot from previous month
    const previousMonthSnapshot = sorted.find(s => {
        const date = new Date(s.snapshot_date);
        return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    });

    // If no previous month data, use the oldest available snapshot
    const previousSnapshot = previousMonthSnapshot || sorted[sorted.length - 1];

    if (!currentSnapshot || currentSnapshot === previousSnapshot) {
        return {
            assetsChange: 0,
            assetsChangePercent: 0,
            liabilitiesChange: 0,
            liabilitiesChangePercent: 0,
            netWorthChange: 0,
            netWorthChangePercent: 0,
            investmentsChange: 0,
            investmentsChangePercent: 0,
            hasPreviousData: false,
        };
    }

    const assetsChange = currentSnapshot.total_assets - previousSnapshot.total_assets;
    const assetsChangePercent = previousSnapshot.total_assets > 0
        ? (assetsChange / previousSnapshot.total_assets) * 100
        : 0;

    const liabilitiesChange = currentSnapshot.total_liabilities - previousSnapshot.total_liabilities;
    const liabilitiesChangePercent = previousSnapshot.total_liabilities > 0
        ? (liabilitiesChange / previousSnapshot.total_liabilities) * 100
        : 0;

    const netWorthChange = currentSnapshot.net_worth - previousSnapshot.net_worth;
    const netWorthChangePercent = previousSnapshot.net_worth !== 0
        ? (netWorthChange / previousSnapshot.net_worth) * 100
        : 0;

    // Get current investment value
    const currentInvestments = getTotalStockValue() + getTotalMFValue();
    // Estimate previous from snapshot breakdown if available
    const breakdown = previousSnapshot.asset_breakdown as Record<string, number> | undefined;
    const prevInvestments = (breakdown?.['stock'] || 0) +
        (breakdown?.['mutual_fund'] || 0);
    const investmentsChange = currentInvestments - prevInvestments;
    const investmentsChangePercent = prevInvestments > 0
        ? (investmentsChange / prevInvestments) * 100
        : 0;

    return {
        assetsChange,
        assetsChangePercent,
        liabilitiesChange,
        liabilitiesChangePercent,
        netWorthChange,
        netWorthChangePercent,
        investmentsChange,
        investmentsChangePercent,
        hasPreviousData: true,
        comparisonPeriod: previousMonthSnapshot
            ? `vs ${new Date(previousSnapshot.snapshot_date).toLocaleDateString('en-IN', { month: 'short' })}`
            : 'since first record',
    };
}

// ============ TRANSACTIONS ============
export function getTransactions(): Transaction[] {
    return getStorageItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
}

export function getTransactionById(id: string): Transaction | null {
    const transactions = getTransactions();
    return transactions.find(t => t.id === id) || null;
}

export function createTransaction(data: TransactionFormData): Transaction {
    const transactions = getTransactions();
    const newTransaction: Transaction = {
        id: uuidv4(),
        user_id: DEFAULT_USER_ID,
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description,
        date: data.date,
        payment_method: data.payment_method || null,
        is_recurring: data.is_recurring || false,
        recurring_frequency: data.recurring_frequency || null,
        tags: data.tags || [],
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    transactions.push(newTransaction);
    setStorageItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    return newTransaction;
}

export function updateTransaction(id: string, data: Partial<TransactionFormData>): Transaction | null {
    const transactions = getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) return null;

    transactions[index] = {
        ...transactions[index],
        ...data,
        updated_at: new Date().toISOString(),
    };
    setStorageItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    return transactions[index];
}

export function deleteTransaction(id: string): boolean {
    const transactions = getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    if (filtered.length === transactions.length) return false;
    setStorageItem(STORAGE_KEYS.TRANSACTIONS, filtered);
    return true;
}

export function getTransactionsByDateRange(startDate: string, endDate: string): Transaction[] {
    const transactions = getTransactions();
    return transactions.filter(t => {
        const date = new Date(t.date);
        return date >= new Date(startDate) && date <= new Date(endDate);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getTransactionsByType(type: 'income' | 'expense'): Transaction[] {
    return getTransactions().filter(t => t.type === type);
}

export function getTransactionsByCategory(category: string): Transaction[] {
    return getTransactions().filter(t => t.category === category);
}

export function getMonthlyTransactionSummary(year: number, month: number) {
    const transactions = getTransactions();
    const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month;
    });

    const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown: Record<string, number> = {};
    monthTransactions.forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });

    return {
        income,
        expense,
        net: income - expense,
        transactionCount: monthTransactions.length,
        categoryBreakdown,
    };
}

export function getRecentTransactions(limit: number = 10): Transaction[] {
    return getTransactions()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
}

// ============ CLEAR ALL DATA ============
export function clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
}
