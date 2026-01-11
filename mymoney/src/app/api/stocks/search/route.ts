import { NextRequest, NextResponse } from 'next/server';

const YAHOO_SEARCH_API = 'https://query2.finance.yahoo.com/v1/finance/search';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 1) {
        return NextResponse.json([]);
    }

    try {
        // Add .NS suffix for NSE stocks if not present
        const searchQuery = query.toUpperCase();

        const response = await fetch(
            `${YAHOO_SEARCH_API}?q=${encodeURIComponent(searchQuery)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                next: { revalidate: 3600 } // Cache for 1 hour
            }
        );

        if (!response.ok) {
            throw new Error(`Yahoo Search API returned ${response.status}`);
        }

        const data = await response.json();
        const quotes = data.quotes || [];

        // Filter for Indian stocks (NSE/BSE) and format results
        const results = quotes
            .filter((q: { exchange: string; quoteType: string }) =>
            (q.exchange === 'NSI' || q.exchange === 'BSE' ||
                q.exchange === 'NSE' || q.quoteType === 'EQUITY')
            )
            .slice(0, 10)
            .map((q: { symbol: string; shortname: string; longname: string; exchange: string }) => ({
                symbol: q.symbol,
                name: q.shortname || q.longname || q.symbol,
                exchange: q.exchange
            }));

        return NextResponse.json(results);
    } catch (error) {
        console.error('Yahoo Search API error:', error);
        return NextResponse.json(
            { error: 'Failed to search stocks' },
            { status: 500 }
        );
    }
}
