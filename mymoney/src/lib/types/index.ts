// =====================================================
// TYPE DEFINITIONS - Integrated Asset Intelligence Platform
// =====================================================

// ============ USER & AUTH ============
export interface UserProfile {
    id: string;
    full_name: string | null;
    risk_tolerance: 'conservative' | 'moderate' | 'aggressive' | null;
    investment_horizon: number | null;
    monthly_income: number | null;
    monthly_expenses: number | null;
    created_at: string;
    updated_at: string;
}

// ============ ASSETS ============
export type AssetCategory =
    | 'cash'
    | 'bank_account'
    | 'fixed_deposit'
    | 'gold'
    | 'property'
    | 'other';

export interface Asset {
    id: string;
    user_id: string;
    category: AssetCategory;
    name: string;
    institution: string | null;
    current_value: number;
    purchase_value: number | null;
    purchase_date: string | null;
    maturity_date: string | null;
    interest_rate: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface AssetFormData {
    category: AssetCategory;
    name: string;
    institution?: string;
    current_value: number;
    purchase_value?: number;
    purchase_date?: string;
    maturity_date?: string;
    interest_rate?: number;
    notes?: string;
}

// ============ LIABILITIES ============
export type LiabilityCategory =
    | 'home_loan'
    | 'car_loan'
    | 'personal_loan'
    | 'education_loan'
    | 'credit_card'
    | 'other';

export interface Liability {
    id: string;
    user_id: string;
    category: LiabilityCategory;
    name: string;
    institution: string | null;
    principal_amount: number;
    outstanding_amount: number;
    interest_rate: number | null;
    emi_amount: number | null;
    start_date: string | null;
    end_date: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface LiabilityFormData {
    category: LiabilityCategory;
    name: string;
    institution?: string;
    principal_amount: number;
    outstanding_amount: number;
    interest_rate?: number;
    emi_amount?: number;
    start_date?: string;
    end_date?: string;
    notes?: string;
}

// ============ STOCK HOLDINGS ============
export type Exchange = 'NSE' | 'BSE';

export interface StockHolding {
    id: string;
    user_id: string;
    symbol: string;
    exchange: Exchange;
    quantity: number;
    average_price: number;
    created_at: string;
    updated_at: string;
    // Computed fields (from market data)
    current_price?: number;
    current_value?: number;
    gain_loss?: number;
    gain_loss_percent?: number;
}

export interface StockHoldingFormData {
    symbol: string;
    exchange: Exchange;
    quantity: number;
    average_price: number;
}

// ============ MUTUAL FUND HOLDINGS ============
export interface MFHolding {
    id: string;
    user_id: string;
    scheme_code: string;
    scheme_name: string;
    units: number;
    average_nav: number;
    created_at: string;
    updated_at: string;
    // Computed fields (from market data)
    current_nav?: number;
    current_value?: number;
    gain_loss?: number;
    gain_loss_percent?: number;
}

export interface MFHoldingFormData {
    scheme_code: string;
    scheme_name: string;
    units: number;
    average_nav: number;
}

// ============ GOALS ============
export type GoalPriority = 'high' | 'medium' | 'low';
export type GoalCategory =
    | 'retirement'
    | 'education'
    | 'house'
    | 'car'
    | 'travel'
    | 'emergency'
    | 'other';

export interface Goal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: string | null;
    priority: GoalPriority | null;
    category: GoalCategory | null;
    created_at: string;
    updated_at: string;
    // Computed
    progress_percent?: number;
}

export interface GoalFormData {
    name: string;
    target_amount: number;
    current_amount?: number;
    target_date?: string;
    priority?: GoalPriority;
    category?: GoalCategory;
}

// ============ TRANSACTIONS ============
export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
    // Income categories
    | 'salary'
    | 'business'
    | 'investment_income'
    | 'rental'
    | 'freelance'
    | 'bonus'
    | 'gift_received'
    | 'refund'
    | 'other_income'
    // Expense categories
    | 'food'
    | 'groceries'
    | 'transportation'
    | 'utilities'
    | 'rent'
    | 'entertainment'
    | 'shopping'
    | 'healthcare'
    | 'education'
    | 'travel'
    | 'insurance'
    | 'emi'
    | 'subscriptions'
    | 'personal_care'
    | 'household'
    | 'gifts'
    | 'charity'
    | 'investment'
    | 'other_expense';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | null;

export interface Transaction {
    id: string;
    user_id: string;
    type: TransactionType;
    category: TransactionCategory;
    amount: number;
    description: string;
    date: string;
    payment_method?: string | null;
    is_recurring: boolean;
    recurring_frequency: RecurringFrequency;
    tags?: string[];
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface TransactionFormData {
    type: TransactionType;
    category: TransactionCategory;
    amount: number;
    description: string;
    date: string;
    payment_method?: string;
    is_recurring?: boolean;
    recurring_frequency?: RecurringFrequency;
    tags?: string[];
    notes?: string;
}

// ============ NET WORTH SNAPSHOTS ============
export interface NetWorthSnapshot {
    id: string;
    user_id: string;
    snapshot_date: string;
    total_assets: number;
    total_liabilities: number;
    net_worth: number;
    asset_breakdown: Record<AssetCategory, number> | null;
    liability_breakdown: Record<LiabilityCategory, number> | null;
    created_at: string;
}

// ============ MARKET DATA ============
export interface MFScheme {
    schemeCode: number;
    schemeName: string;
}

export interface MFNavData {
    meta: {
        fund_house: string;
        scheme_type: string;
        scheme_category: string;
        scheme_code: number;
        scheme_name: string;
    };
    data: Array<{
        date: string;
        nav: string;
    }>;
}

export interface StockQuote {
    symbol: string;
    exchange: Exchange;
    price: number;
    change: number;
    change_percent: number;
    volume: number;
    timestamp: string;
}

// ============ DASHBOARD & ANALYTICS ============
export interface DashboardSummary {
    total_assets: number;
    total_liabilities: number;
    net_worth: number;
    net_worth_change: number;
    net_worth_change_percent: number;
    asset_allocation: Record<string, number>;
    liability_allocation: Record<string, number>;
    investment_value: number;
    investment_gain_loss: number;
    goals_progress: number;
}

export interface AllocationData {
    name: string;
    value: number;
    color: string;
    percent: number;
}

export interface TrendData {
    date: string;
    value: number;
    label?: string;
}

// ============ UI & FORMS ============
export interface SelectOption {
    value: string;
    label: string;
}

export interface TableColumn<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
    width?: string;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

// ============ API RESPONSES ============
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}
