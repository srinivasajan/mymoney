import { NextRequest, NextResponse } from 'next/server';

const YAHOO_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Map period to Yahoo Finance format
const periodToRange: Record<string, { range: string; interval: string }> = {
    '1d': { range: '1d', interval: '5m' },
    '5d': { range: '5d', interval: '15m' },
    '1mo': { range: '1mo', interval: '1d' },
    '3mo': { range: '3mo', interval: '1d' },
    '6mo': { range: '6mo', interval: '1d' },
    '1y': { range: '1y', interval: '1wk' },
    '5y': { range: '5y', interval: '1mo' },
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const period = searchParams.get('period') || '1mo';

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    const { range, interval } = periodToRange[period] || periodToRange['1mo'];

    try {
        const response = await fetch(
            `${YAHOO_API_BASE}/${symbol}?interval=${interval}&range=${range}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                next: { revalidate: 300 } // Cache for 5 minutes
            }
        );

        if (!response.ok) {
            throw new Error(`Yahoo API returned ${response.status}`);
        }

        const data = await response.json();
        const result = data.chart?.result?.[0];

        if (!result) {
            return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
        }

        const timestamps = result.timestamp || [];
        const quote = result.indicators?.quote?.[0] || {};

        const historicalData = timestamps.map((ts: number, i: number) => ({
            date: new Date(ts * 1000).toISOString(),
            open: quote.open?.[i] || 0,
            high: quote.high?.[i] || 0,
            low: quote.low?.[i] || 0,
            close: quote.close?.[i] || 0,
            volume: quote.volume?.[i] || 0
        })).filter((d: { close: number }) => d.close > 0);

        return NextResponse.json(historicalData);
    } catch (error) {
        console.error('Yahoo Finance History API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch historical data' },
            { status: 500 }
        );
    }
}
