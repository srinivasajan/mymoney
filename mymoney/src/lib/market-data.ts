// Yahoo Finance API wrapper for Indian stocks
// Uses yahoo-finance2 package for real market data

interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
    open: number;
    dayHigh: number;
    dayLow: number;
    volume: number;
    marketCap: number;
    peRatio: number | null;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    lastUpdated: string;
}

interface HistoricalData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// Popular Indian stocks with NSE tickers
export const POPULAR_STOCKS = [
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'Technology' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking' },
    { symbol: 'INFY.NS', name: 'Infosys', sector: 'Technology' },
    { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking' },
    { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'Consumer' },
    { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking' },
    { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom' },
    { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking' },
    { symbol: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking' },
    { symbol: 'LT.NS', name: 'Larsen & Toubro', sector: 'Infrastructure' },
    { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'Consumer' },
    { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', sector: 'Auto' },
    { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'Financial Services' },
    { symbol: 'WIPRO.NS', name: 'Wipro', sector: 'Technology' },
    { symbol: 'HCLTECH.NS', name: 'HCL Technologies', sector: 'Technology' },
    { symbol: 'TITAN.NS', name: 'Titan Company', sector: 'Consumer' },
    { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma', sector: 'Healthcare' },
    { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement', sector: 'Materials' },
    { symbol: 'NESTLEIND.NS', name: 'Nestle India', sector: 'Consumer' },
];

// Nifty 50 for benchmark comparison
export const NIFTY50_SYMBOL = '^NSEI';

// Fetch stock quote using client-side API route
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
    try {
        const response = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(symbol)}`);
        if (!response.ok) throw new Error('Failed to fetch quote');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
        return null;
    }
}

// Fetch multiple quotes
export async function getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    const promises = symbols.map(symbol => getStockQuote(symbol));
    const results = await Promise.all(promises);
    return results.filter((q): q is StockQuote => q !== null);
}

// Fetch historical data for charts
export async function getHistoricalData(
    symbol: string,
    period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y' = '1mo'
): Promise<HistoricalData[]> {
    try {
        const response = await fetch(`/api/stocks/history?symbol=${encodeURIComponent(symbol)}&period=${period}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching history for ${symbol}:`, error);
        return [];
    }
}

// Search stocks
export async function searchStocks(query: string): Promise<{ symbol: string; name: string }[]> {
    try {
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search');
        return await response.json();
    } catch (error) {
        console.error('Error searching stocks:', error);
        return [];
    }
}

// Get top gainers and losers from popular stocks
export async function getTopMovers(): Promise<{ gainers: StockQuote[]; losers: StockQuote[] }> {
    const quotes = await getMultipleQuotes(POPULAR_STOCKS.map(s => s.symbol));
    const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);

    return {
        gainers: sorted.slice(0, 5),
        losers: sorted.slice(-5).reverse()
    };
}

export type { StockQuote, HistoricalData };
