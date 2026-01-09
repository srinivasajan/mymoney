// =====================================================
// INVESTMENT TYPES
// Common types for the investment module
// =====================================================

export * from './risk-profile';
export * from './allocator';
export * from './paper-trading';

// Additional shared types

export interface MarketData {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume?: number;
    timestamp: string;
}

export interface MutualFundData {
    schemeCode: string;
    schemeName: string;
    nav: number;
    date: string;
    category?: string;
    fundHouse?: string;
}

export interface InvestmentRecommendation {
    id: string;
    type: 'buy' | 'sell' | 'hold' | 'sip';
    assetType: 'stock' | 'mutual_fund' | 'etf' | 'gold' | 'fd';
    symbol: string;
    name: string;
    reason: string;
    targetPrice?: number;
    stopLoss?: number;
    confidence: 'high' | 'medium' | 'low';
    timeframe: 'short' | 'medium' | 'long';
    createdAt: string;
}

export interface SIPPlan {
    id: string;
    userId: string;
    name: string;
    amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    startDate: string;
    endDate?: string;
    assetType: 'mutual_fund' | 'stock' | 'etf';
    symbol: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Predefined popular mutual funds for demo
export const POPULAR_MUTUAL_FUNDS: { schemeCode: string; schemeName: string; category: string }[] = [
    { schemeCode: '120503', schemeName: 'Axis Bluechip Fund Direct Growth', category: 'Large Cap' },
    { schemeCode: '118989', schemeName: 'Parag Parikh Flexi Cap Fund Direct Growth', category: 'Flexi Cap' },
    { schemeCode: '119598', schemeName: 'Mirae Asset Large Cap Fund Direct Growth', category: 'Large Cap' },
    { schemeCode: '125494', schemeName: 'Kotak Emerging Equity Fund Direct Growth', category: 'Mid Cap' },
    { schemeCode: '119551', schemeName: 'SBI Small Cap Fund Direct Growth', category: 'Small Cap' },
    { schemeCode: '120716', schemeName: 'HDFC Mid-Cap Opportunities Fund Direct', category: 'Mid Cap' },
    { schemeCode: '119597', schemeName: 'Nippon India Small Cap Fund Direct Growth', category: 'Small Cap' },
    { schemeCode: '118834', schemeName: 'ICICI Prudential Technology Fund Direct', category: 'Sectoral' },
];

// Predefined popular stocks for demo
export const POPULAR_STOCKS: { symbol: string; name: string; sector: string }[] = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Oil & Gas' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking' },
    { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG' },
    { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom' },
    { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG' },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking' },
];
