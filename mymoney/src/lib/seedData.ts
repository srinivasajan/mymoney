// =====================================================
// DEMO DATA SEEDER
// Populates the app with realistic Indian financial data
// =====================================================

import { v4 as uuidv4 } from 'uuid';
import {
    Asset,
    Liability,
    StockHolding,
    MFHolding,
    Goal,
    NetWorthSnapshot,
} from '@/lib/types';

const STORAGE_KEYS = {
    ASSETS: 'iap_assets',
    LIABILITIES: 'iap_liabilities',
    STOCK_HOLDINGS: 'iap_stock_holdings',
    MF_HOLDINGS: 'iap_mf_holdings',
    GOALS: 'iap_goals',
    NET_WORTH_SNAPSHOTS: 'iap_net_worth_snapshots',
} as const;

const DEFAULT_USER_ID = 'local-user';

// Sample Indian Assets
const DEMO_ASSETS: Omit<Asset, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
    {
        category: 'bank_account',
        name: 'HDFC Savings Account',
        institution: 'HDFC Bank',
        current_value: 285000,
        purchase_value: null,
        purchase_date: null,
        maturity_date: null,
        interest_rate: 3.5,
        notes: 'Primary savings account',
    },
    {
        category: 'fixed_deposit',
        name: 'SBI Fixed Deposit',
        institution: 'State Bank of India',
        current_value: 500000,
        purchase_value: 450000,
        purchase_date: '2023-06-15',
        maturity_date: '2026-06-15',
        interest_rate: 7.25,
        notes: '3-year FD',
    },
    {
        category: 'fixed_deposit',
        name: 'ICICI Tax Saver FD',
        institution: 'ICICI Bank',
        current_value: 150000,
        purchase_value: 150000,
        purchase_date: '2024-01-10',
        maturity_date: '2029-01-10',
        interest_rate: 7.0,
        notes: '80C Tax saving FD',
    },
    {
        category: 'gold',
        name: 'Physical Gold',
        institution: null,
        current_value: 350000,
        purchase_value: 280000,
        purchase_date: '2022-08-20',
        maturity_date: null,
        interest_rate: null,
        notes: '50 grams 24K gold coins',
    },
    {
        category: 'property',
        name: '2BHK Apartment - Bangalore',
        institution: null,
        current_value: 8500000,
        purchase_value: 6500000,
        purchase_date: '2020-03-10',
        maturity_date: null,
        interest_rate: null,
        notes: 'Self-occupied property, Whitefield',
    },
    {
        category: 'cash',
        name: 'Emergency Cash',
        institution: null,
        current_value: 50000,
        purchase_value: null,
        purchase_date: null,
        maturity_date: null,
        interest_rate: null,
        notes: 'Cash at home for emergencies',
    },
];


// Sample Liabilities
const DEMO_LIABILITIES: Omit<Liability, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
    {
        category: 'home_loan',
        name: 'Home Loan - Whitefield Apartment',
        institution: 'HDFC Home Finance',
        principal_amount: 5500000,
        outstanding_amount: 4200000,
        interest_rate: 8.5,
        emi_amount: 52000,
        start_date: '2020-03-15',
        end_date: '2040-03-15',
        notes: '20-year home loan',
    },
    {
        category: 'car_loan',
        name: 'Car Loan - Honda City',
        institution: 'HDFC Bank',
        principal_amount: 800000,
        outstanding_amount: 320000,
        interest_rate: 9.25,
        emi_amount: 18500,
        start_date: '2022-11-01',
        end_date: '2027-11-01',
        notes: '5-year car loan',
    },
    {
        category: 'credit_card',
        name: 'HDFC Regalia Credit Card',
        institution: 'HDFC Bank',
        principal_amount: 0,
        outstanding_amount: 45000,
        interest_rate: 42,
        emi_amount: null,
        start_date: null,
        end_date: null,
        notes: 'Pay in full every month',
    },
];

// Sample Stock Holdings
const DEMO_STOCKS: Omit<StockHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
    { symbol: 'RELIANCE', exchange: 'NSE', quantity: 25, average_price: 2450 },
    { symbol: 'TCS', exchange: 'NSE', quantity: 15, average_price: 3600 },
    { symbol: 'HDFCBANK', exchange: 'NSE', quantity: 40, average_price: 1580 },
    { symbol: 'INFY', exchange: 'NSE', quantity: 50, average_price: 1420 },
    { symbol: 'ICICIBANK', exchange: 'NSE', quantity: 60, average_price: 920 },
    { symbol: 'AXISBANK', exchange: 'NSE', quantity: 45, average_price: 1050 },
    { symbol: 'WIPRO', exchange: 'NSE', quantity: 80, average_price: 420 },
    { symbol: 'ITC', exchange: 'NSE', quantity: 100, average_price: 380 },
];

// Sample Mutual Fund Holdings
const DEMO_MFS: Omit<MFHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
    { scheme_code: '120503', scheme_name: 'Axis Bluechip Fund Direct Growth', units: 450, average_nav: 52.5 },
    { scheme_code: '120505', scheme_name: 'Mirae Asset Large Cap Fund Direct Growth', units: 380, average_nav: 89.2 },
    { scheme_code: '118989', scheme_name: 'Parag Parikh Flexi Cap Fund Direct Growth', units: 520, average_nav: 62.8 },
    { scheme_code: '125494', scheme_name: 'Kotak Emerging Equity Fund Direct Growth', units: 290, average_nav: 98.5 },
    { scheme_code: '119551', scheme_name: 'SBI Small Cap Fund Direct Growth', units: 180, average_nav: 142.3 },
    { scheme_code: '120716', scheme_name: 'HDFC Mid-Cap Opportunities Fund Direct Growth', units: 220, average_nav: 125.8 },
];

// Sample Goals
const DEMO_GOALS: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
    {
        name: 'Emergency Fund (6 months)',
        target_amount: 600000,
        current_amount: 285000,
        target_date: '2025-12-31',
        priority: 'high',
        category: 'emergency',
    },
    {
        name: 'Home Renovation',
        target_amount: 1500000,
        current_amount: 450000,
        target_date: '2027-06-30',
        priority: 'medium',
        category: 'house',
    },
    {
        name: "Child's Education Fund",
        target_amount: 5000000,
        current_amount: 875000,
        target_date: '2035-06-01',
        priority: 'high',
        category: 'education',
    },
    {
        name: 'Early Retirement Corpus',
        target_amount: 50000000,
        current_amount: 4500000,
        target_date: '2045-01-01',
        priority: 'medium',
        category: 'retirement',
    },
    {
        name: 'International Vacation',
        target_amount: 400000,
        current_amount: 180000,
        target_date: '2025-10-01',
        priority: 'low',
        category: 'travel',
    },
];

// Generate historical net worth snapshots
function generateNetWorthSnapshots(): NetWorthSnapshot[] {
    const snapshots: NetWorthSnapshot[] = [];
    const today = new Date();

    // Generate 90 days of history
    let baseNetWorth = 9500000; // Starting net worth 90 days ago

    for (let i = 90; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Add some realistic variation (±2% daily change possible)
        const dailyChange = (Math.random() - 0.45) * 0.02; // Slight upward bias
        baseNetWorth = baseNetWorth * (1 + dailyChange);

        // Round to nearest 1000
        const netWorth = Math.round(baseNetWorth / 1000) * 1000;
        const totalAssets = netWorth + 4565000; // Liabilities are ~4.5M
        const totalLiabilities = 4565000;

        snapshots.push({
            id: uuidv4(),
            user_id: DEFAULT_USER_ID,
            snapshot_date: date.toISOString().split('T')[0],
            total_assets: totalAssets,
            total_liabilities: totalLiabilities,
            net_worth: netWorth,
            asset_breakdown: null,
            liability_breakdown: null,
            created_at: date.toISOString(),
        });
    }

    return snapshots;
}

export function seedDemoData(): void {
    if (typeof window === 'undefined') return;

    const now = new Date().toISOString();

    // Seed Assets
    const assets: Asset[] = DEMO_ASSETS.map(asset => ({
        ...asset,
        id: uuidv4(),
        user_id: DEFAULT_USER_ID,
        created_at: now,
        updated_at: now,
    }));
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));

    // Seed Liabilities
    const liabilities: Liability[] = DEMO_LIABILITIES.map(liability => ({
        ...liability,
        id: uuidv4(),
        user_id: DEFAULT_USER_ID,
        created_at: now,
        updated_at: now,
    }));
    localStorage.setItem(STORAGE_KEYS.LIABILITIES, JSON.stringify(liabilities));

    // Seed Stock Holdings
    const stocks: StockHolding[] = DEMO_STOCKS.map(stock => ({
        ...stock,
        id: uuidv4(),
        user_id: DEFAULT_USER_ID,
        created_at: now,
        updated_at: now,
    }));
    localStorage.setItem(STORAGE_KEYS.STOCK_HOLDINGS, JSON.stringify(stocks));

    // Seed MF Holdings
    const mfs: MFHolding[] = DEMO_MFS.map(mf => ({
        ...mf,
        id: uuidv4(),
        user_id: DEFAULT_USER_ID,
        created_at: now,
        updated_at: now,
    }));
    localStorage.setItem(STORAGE_KEYS.MF_HOLDINGS, JSON.stringify(mfs));

    // Seed Goals
    const goals: Goal[] = DEMO_GOALS.map(goal => ({
        ...goal,
        id: uuidv4(),
        user_id: DEFAULT_USER_ID,
        created_at: now,
        updated_at: now,
    }));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));

    // Seed Net Worth Snapshots
    const snapshots = generateNetWorthSnapshots();
    localStorage.setItem(STORAGE_KEYS.NET_WORTH_SNAPSHOTS, JSON.stringify(snapshots));

    console.log('✅ Demo data seeded successfully!');
}

export function clearDemoData(): void {
    if (typeof window === 'undefined') return;

    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });

    console.log('🗑️ Demo data cleared!');
}

export function hasDemoData(): boolean {
    if (typeof window === 'undefined') return false;

    const assets = localStorage.getItem(STORAGE_KEYS.ASSETS);
    return assets !== null && JSON.parse(assets).length > 0;
}
