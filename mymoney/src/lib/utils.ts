// =====================================================
// UTILITY FUNCTIONS
// Formatting, calculations, and helper functions
// =====================================================

// ============ CURRENCY FORMATTING ============
export function formatCurrency(
    amount: number,
    currency: string = 'INR',
    compact: boolean = false
): string {
    if (compact && Math.abs(amount) >= 10000000) {
        // Crore format for large numbers
        return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (compact && Math.abs(amount) >= 100000) {
        // Lakh format
        return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (compact && Math.abs(amount) >= 1000) {
        // Thousand format
        return `₹${(amount / 1000).toFixed(1)}K`;
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatCurrencyPrecise(
    amount: number,
    currency: string = 'INR'
): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

// ============ NUMBER FORMATTING ============
export function formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

export function formatPercent(value: number, decimals: number = 2): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
}

export function formatPercentUnsigned(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

// ============ DATE FORMATTING ============
export function formatDate(
    date: string | Date,
    format: 'short' | 'medium' | 'long' = 'medium'
): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    const optionsMap: Record<'short' | 'medium' | 'long', Intl.DateTimeFormatOptions> = {
        short: { day: '2-digit', month: 'short' },
        medium: { day: '2-digit', month: 'short', year: 'numeric' },
        long: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
    };

    return d.toLocaleDateString('en-IN', optionsMap[format]);
}

export function formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatRelativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

export function getDateString(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
}

// ============ FINANCIAL CALCULATIONS ============
export function calculateReturns(
    currentValue: number,
    investedAmount: number
): { absolute: number; percent: number } {
    const absolute = currentValue - investedAmount;
    const percent = investedAmount !== 0
        ? ((currentValue - investedAmount) / investedAmount) * 100
        : 0;
    return { absolute, percent };
}

export function calculateCAGR(
    initialValue: number,
    finalValue: number,
    years: number
): number {
    if (years <= 0 || initialValue <= 0) return 0;
    return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}

export function calculateXIRR(
    transactions: Array<{ date: Date; amount: number }>,
    guess: number = 0.1
): number {
    // Simplified XIRR calculation using Newton-Raphson method
    // Negative amounts = investments, Positive amounts = returns
    if (transactions.length < 2) return 0;

    const sortedTxns = [...transactions].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
    );

    const firstDate = sortedTxns[0].date;

    const xnpv = (rate: number) => {
        return sortedTxns.reduce((sum, txn) => {
            const years = (txn.date.getTime() - firstDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
            return sum + txn.amount / Math.pow(1 + rate, years);
        }, 0);
    };

    const xnpvDeriv = (rate: number) => {
        return sortedTxns.reduce((sum, txn) => {
            const years = (txn.date.getTime() - firstDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
            return sum - (years * txn.amount) / Math.pow(1 + rate, years + 1);
        }, 0);
    };

    let rate = guess;
    for (let i = 0; i < 100; i++) {
        const npv = xnpv(rate);
        const deriv = xnpvDeriv(rate);

        if (Math.abs(npv) < 0.0001) break;
        if (deriv === 0) break;

        rate = rate - npv / deriv;
    }

    return rate * 100;
}

export function calculateEMI(
    principal: number,
    annualRate: number,
    tenureMonths: number
): number {
    const monthlyRate = annualRate / 12 / 100;
    if (monthlyRate === 0) return principal / tenureMonths;

    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return emi;
}

export function calculateSIP(
    monthlyAmount: number,
    annualRate: number,
    tenureMonths: number
): { futureValue: number; totalInvested: number; returns: number } {
    const monthlyRate = annualRate / 12 / 100;
    const futureValue = monthlyAmount *
        ((Math.pow(1 + monthlyRate, tenureMonths) - 1) / monthlyRate) *
        (1 + monthlyRate);
    const totalInvested = monthlyAmount * tenureMonths;

    return {
        futureValue,
        totalInvested,
        returns: futureValue - totalInvested,
    };
}

export function calculateCompoundInterest(
    principal: number,
    annualRate: number,
    years: number,
    compoundingFrequency: number = 12
): number {
    const rate = annualRate / 100;
    return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * years);
}

// ============ VALIDATION ============
export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
    return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}

export function isPositiveNumber(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value) && value > 0;
}

// ============ COLORS ============
export const CHART_COLORS = {
    primary: ['#d4a853', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'],
    assets: {
        cash: '#22c55e',
        bank_account: '#3b82f6',
        fixed_deposit: '#8b5cf6',
        gold: '#d4a853',
        property: '#f59e0b',
        other: '#64748b',
    },
    liabilities: {
        home_loan: '#ef4444',
        car_loan: '#f97316',
        personal_loan: '#ec4899',
        education_loan: '#8b5cf6',
        credit_card: '#dc2626',
        other: '#64748b',
    },
    positive: '#22c55e',
    negative: '#ef4444',
    neutral: '#64748b',
};

// ============ CATEGORY LABELS ============
export const ASSET_CATEGORY_LABELS: Record<string, string> = {
    cash: 'Cash',
    bank_account: 'Bank Account',
    fixed_deposit: 'Fixed Deposit',
    gold: 'Gold',
    property: 'Property',
    other: 'Other',
};

export const LIABILITY_CATEGORY_LABELS: Record<string, string> = {
    home_loan: 'Home Loan',
    car_loan: 'Car Loan',
    personal_loan: 'Personal Loan',
    education_loan: 'Education Loan',
    credit_card: 'Credit Card',
    other: 'Other',
};

export const GOAL_CATEGORY_LABELS: Record<string, string> = {
    retirement: 'Retirement',
    education: 'Education',
    house: 'House',
    car: 'Car',
    travel: 'Travel',
    emergency: 'Emergency Fund',
    other: 'Other',
};

export const TRANSACTION_CATEGORY_LABELS: Record<string, string> = {
    // Income
    salary: 'Salary',
    business: 'Business Income',
    investment_income: 'Investment Income',
    rental: 'Rental Income',
    freelance: 'Freelance',
    bonus: 'Bonus',
    gift_received: 'Gift Received',
    refund: 'Refund',
    other_income: 'Other Income',
    // Expense
    food: 'Food & Dining',
    groceries: 'Groceries',
    transportation: 'Transportation',
    utilities: 'Utilities',
    rent: 'Rent',
    entertainment: 'Entertainment',
    shopping: 'Shopping',
    healthcare: 'Healthcare',
    education: 'Education',
    travel: 'Travel',
    insurance: 'Insurance',
    emi: 'EMI Payment',
    subscriptions: 'Subscriptions',
    personal_care: 'Personal Care',
    household: 'Household',
    gifts: 'Gifts Given',
    charity: 'Charity',
    investment: 'Investment',
    other_expense: 'Other Expense',
};

// ============ MISC HELPERS ============
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), wait);
    };
}

export function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
