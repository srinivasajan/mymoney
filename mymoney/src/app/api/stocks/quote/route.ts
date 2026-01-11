import { NextRequest, NextResponse } from 'next/server';

// Yahoo Finance API endpoint
const YAHOO_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        // Fetch from Yahoo Finance
        const response = await fetch(
            `${YAHOO_API_BASE}/${symbol}?interval=1d&range=1d`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                next: { revalidate: 60 } // Cache for 60 seconds
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

        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];

        // Calculate change
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.previousClose || meta.chartPreviousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        const stockQuote = {
            symbol: meta.symbol,
            name: meta.shortName || meta.longName || meta.symbol,
            price: currentPrice,
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            previousClose: previousClose,
            open: quote?.open?.[0] || meta.regularMarketOpen,
            dayHigh: meta.regularMarketDayHigh,
            dayLow: meta.regularMarketDayLow,
            volume: meta.regularMarketVolume,
            marketCap: meta.marketCap || null,
            peRatio: null, // Would need separate API call
            fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
            lastUpdated: new Date().toISOString()
        };

        return NextResponse.json(stockQuote);
    } catch (error) {
        console.error('Yahoo Finance API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stock data' },
            { status: 500 }
        );
    }
}
