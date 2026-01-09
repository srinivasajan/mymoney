// =====================================================
// MFApi.in INTEGRATION
// Free Indian Mutual Fund API
// https://mfapi.in
// =====================================================

import { MFScheme, MFNavData } from '@/lib/types';

const API_BASE = 'https://api.mfapi.in';

// Cache for API responses
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data as T;
    }
    return null;
}

function setCache(key: string, data: unknown): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// ============ FETCH ALL SCHEMES ============
export async function getAllMFSchemes(): Promise<MFScheme[]> {
    const cacheKey = 'all_schemes';
    const cached = getCached<MFScheme[]>(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`${API_BASE}/mf`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const data: MFScheme[] = await response.json();
        setCache(cacheKey, data);
        return data;
    } catch (error) {
        console.error('Failed to fetch MF schemes:', error);
        return [];
    }
}

// ============ SEARCH SCHEMES ============
export async function searchMFSchemes(query: string): Promise<MFScheme[]> {
    if (!query || query.length < 2) return [];

    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = getCached<MFScheme[]>(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`${API_BASE}/mf/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const data: MFScheme[] = await response.json();
        setCache(cacheKey, data);
        return data;
    } catch (error) {
        console.error('Failed to search MF schemes:', error);
        return [];
    }
}

// ============ GET SCHEME NAV DATA ============
export async function getMFNavData(schemeCode: string | number): Promise<MFNavData | null> {
    const cacheKey = `nav_${schemeCode}`;
    const cached = getCached<MFNavData>(cacheKey);
    if (cached) return cached;

    try {
        const response = await fetch(`${API_BASE}/mf/${schemeCode}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const data: MFNavData = await response.json();
        setCache(cacheKey, data);
        return data;
    } catch (error) {
        console.error(`Failed to fetch NAV for scheme ${schemeCode}:`, error);
        return null;
    }
}

// ============ GET LATEST NAV ============
export async function getLatestNAV(schemeCode: string | number): Promise<number | null> {
    const navData = await getMFNavData(schemeCode);
    if (!navData || !navData.data || navData.data.length === 0) {
        return null;
    }
    return parseFloat(navData.data[0].nav);
}

// ============ GET HISTORICAL NAV ============
export async function getHistoricalNAV(
    schemeCode: string | number,
    days: number = 30
): Promise<Array<{ date: string; nav: number }>> {
    const navData = await getMFNavData(schemeCode);
    if (!navData || !navData.data) {
        return [];
    }

    return navData.data
        .slice(0, days)
        .map(d => ({
            date: d.date,
            nav: parseFloat(d.nav),
        }))
        .reverse(); // Oldest first for charts
}

// ============ GET SCHEME INFO ============
export async function getMFSchemeInfo(schemeCode: string | number): Promise<{
    name: string;
    fundHouse: string;
    type: string;
    category: string;
    latestNav: number;
    navDate: string;
} | null> {
    const navData = await getMFNavData(schemeCode);
    if (!navData || !navData.meta) {
        return null;
    }

    return {
        name: navData.meta.scheme_name,
        fundHouse: navData.meta.fund_house,
        type: navData.meta.scheme_type,
        category: navData.meta.scheme_category,
        latestNav: navData.data?.[0] ? parseFloat(navData.data[0].nav) : 0,
        navDate: navData.data?.[0]?.date || '',
    };
}

// ============ BATCH FETCH NAVs ============
export async function batchGetLatestNAVs(
    schemeCodes: (string | number)[]
): Promise<Map<string, number>> {
    const results = new Map<string, number>();

    // Fetch in parallel with concurrency limit
    const batchSize = 5;
    for (let i = 0; i < schemeCodes.length; i += batchSize) {
        const batch = schemeCodes.slice(i, i + batchSize);
        const promises = batch.map(async (code) => {
            const nav = await getLatestNAV(code);
            if (nav !== null) {
                results.set(String(code), nav);
            }
        });
        await Promise.all(promises);
    }

    return results;
}

// ============ CALCULATE RETURNS ============
export async function calculateMFReturns(
    schemeCode: string | number,
    period: '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y'
): Promise<number | null> {
    const navData = await getMFNavData(schemeCode);
    if (!navData || !navData.data || navData.data.length < 2) {
        return null;
    }

    const daysMap: Record<string, number> = {
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
        '3Y': 1095,
        '5Y': 1825,
    };

    const days = daysMap[period];
    const currentNav = parseFloat(navData.data[0].nav);

    // Find NAV from the past
    let pastNavEntry = navData.data.find((entry, index) => {
        if (index === 0) return false;
        const entryDate = parseDate(entry.date);
        const currentDate = parseDate(navData.data[0].date);
        const diffDays = Math.abs(currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= days;
    });

    if (!pastNavEntry) {
        pastNavEntry = navData.data[navData.data.length - 1];
    }

    const pastNav = parseFloat(pastNavEntry.nav);

    // Calculate annualized returns for periods > 1 year
    if (period === '3Y' || period === '5Y') {
        const years = period === '3Y' ? 3 : 5;
        return ((Math.pow(currentNav / pastNav, 1 / years) - 1) * 100);
    }

    return ((currentNav - pastNav) / pastNav) * 100;
}

// Helper to parse date in DD-MM-YYYY format
function parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}
