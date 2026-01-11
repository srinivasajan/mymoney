// Watchlist functionality
// Persistent stock watchlist with localStorage

export interface WatchlistItem {
    symbol: string;
    name: string;
    addedAt: string;
    addedPrice: number;
}

const STORAGE_KEY = 'moonlight_watchlist';

export function getWatchlist(): WatchlistItem[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function addToWatchlist(symbol: string, name: string, currentPrice: number): boolean {
    if (typeof window === 'undefined') return false;

    const watchlist = getWatchlist();

    // Check if already exists
    if (watchlist.some(item => item.symbol === symbol)) {
        return false;
    }

    watchlist.push({
        symbol,
        name,
        addedAt: new Date().toISOString(),
        addedPrice: currentPrice
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    return true;
}

export function removeFromWatchlist(symbol: string): boolean {
    if (typeof window === 'undefined') return false;

    const watchlist = getWatchlist();
    const filtered = watchlist.filter(item => item.symbol !== symbol);

    if (filtered.length === watchlist.length) {
        return false; // Not found
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
}

export function isInWatchlist(symbol: string): boolean {
    return getWatchlist().some(item => item.symbol === symbol);
}

export function clearWatchlist(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}
