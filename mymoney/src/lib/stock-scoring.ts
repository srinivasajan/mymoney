// Stock Scoring Algorithm - The Moat
// Proprietary scoring based on momentum, value, and risk metrics

import { StockQuote, getHistoricalData } from './market-data';

export interface StockScore {
    symbol: string;
    overallScore: number; // 0-100
    momentumScore: number;
    valueScore: number;
    riskScore: number;
    signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    reasoning: string[];
}

// Calculate momentum score based on price trends
async function calculateMomentum(symbol: string): Promise<{ score: number; reasons: string[] }> {
    const history = await getHistoricalData(symbol, '3mo');
    if (history.length < 20) return { score: 50, reasons: ['Insufficient data'] };

    const reasons: string[] = [];
    let score = 50;

    // Calculate moving averages
    const prices = history.map(h => h.close);
    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, prices.length);
    const currentPrice = prices[prices.length - 1];

    // Price above moving averages = bullish
    if (currentPrice > sma20) {
        score += 15;
        reasons.push('Trading above 20-day MA');
    } else {
        score -= 10;
        reasons.push('Trading below 20-day MA');
    }

    if (currentPrice > sma50) {
        score += 10;
        reasons.push('Trading above 50-day MA');
    }

    // Calculate trend strength
    const weekAgo = prices[prices.length - 6] || prices[0];
    const monthAgo = prices[prices.length - 22] || prices[0];

    const weekReturn = ((currentPrice - weekAgo) / weekAgo) * 100;
    const monthReturn = ((currentPrice - monthAgo) / monthAgo) * 100;

    if (weekReturn > 3) {
        score += 10;
        reasons.push(`Strong weekly momentum: +${weekReturn.toFixed(1)}%`);
    } else if (weekReturn < -3) {
        score -= 10;
        reasons.push(`Weak weekly momentum: ${weekReturn.toFixed(1)}%`);
    }

    if (monthReturn > 8) {
        score += 10;
        reasons.push(`Strong monthly trend: +${monthReturn.toFixed(1)}%`);
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
}

// Calculate value score based on price position
function calculateValue(quote: StockQuote): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 50;

    // Distance from 52-week high/low
    const range = quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow;
    const position = (quote.price - quote.fiftyTwoWeekLow) / range;

    if (position < 0.3) {
        score += 20;
        reasons.push('Near 52-week low - potential value');
    } else if (position > 0.85) {
        score -= 10;
        reasons.push('Near 52-week high - extended');
    } else if (position >= 0.4 && position <= 0.6) {
        score += 10;
        reasons.push('Trading at fair value zone');
    }

    // Day range position
    if (quote.dayHigh && quote.dayLow) {
        const dayRange = quote.dayHigh - quote.dayLow;
        const dayPosition = (quote.price - quote.dayLow) / dayRange;
        if (dayPosition > 0.7) {
            score += 5;
            reasons.push('Strong intraday buying');
        }
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
}

// Calculate risk score
function calculateRisk(quote: StockQuote): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 70; // Start neutral-positive

    // Volatility based on day range
    const dayVolatility = ((quote.dayHigh - quote.dayLow) / quote.price) * 100;
    if (dayVolatility > 4) {
        score -= 20;
        reasons.push(`High volatility: ${dayVolatility.toFixed(1)}% day range`);
    } else if (dayVolatility < 2) {
        score += 10;
        reasons.push('Low volatility - stable');
    }

    // 52-week volatility
    const yearVolatility = ((quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow) / quote.price) * 100;
    if (yearVolatility > 60) {
        score -= 15;
        reasons.push('High annual volatility');
    } else if (yearVolatility < 30) {
        score += 10;
        reasons.push('Low annual volatility');
    }

    // Volume check (if available)
    if (quote.volume && quote.volume > 1000000) {
        score += 10;
        reasons.push('Good liquidity');
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
}

// Generate signal from overall score
function getSignal(score: number): StockScore['signal'] {
    if (score >= 75) return 'STRONG_BUY';
    if (score >= 60) return 'BUY';
    if (score >= 40) return 'HOLD';
    if (score >= 25) return 'SELL';
    return 'STRONG_SELL';
}

// Main scoring function
export async function scoreStock(quote: StockQuote): Promise<StockScore> {
    const [momentum, value, risk] = await Promise.all([
        calculateMomentum(quote.symbol),
        Promise.resolve(calculateValue(quote)),
        Promise.resolve(calculateRisk(quote))
    ]);

    // Weighted average: Momentum 40%, Value 30%, Risk 30%
    const overallScore = Math.round(
        (momentum.score * 0.4) +
        (value.score * 0.3) +
        (risk.score * 0.3)
    );

    const allReasons = [...momentum.reasons, ...value.reasons, ...risk.reasons];

    return {
        symbol: quote.symbol,
        overallScore,
        momentumScore: Math.round(momentum.score),
        valueScore: Math.round(value.score),
        riskScore: Math.round(risk.score),
        signal: getSignal(overallScore),
        reasoning: allReasons.slice(0, 5) // Top 5 reasons
    };
}

// Score multiple stocks and rank them
export async function rankStocks(quotes: StockQuote[]): Promise<StockScore[]> {
    const scores = await Promise.all(quotes.map(q => scoreStock(q)));
    return scores.sort((a, b) => b.overallScore - a.overallScore);
}
