// API Service - MongoDB Backend
// Provides async API calls to replace localStorage functions

const API_HEADERS = {
    'Content-Type': 'application/json',
    'x-user-id': 'default', // TODO: Replace with actual user auth
};

// ============ ASSETS ============
export async function fetchAssets() {
    const response = await fetch('/api/assets', { headers: API_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch assets');
    return response.json();
}

export async function createAssetAPI(data: {
    name: string;
    type: string;
    value: number;
    institution?: string;
    notes?: string;
}) {
    const response = await fetch('/api/assets', {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create asset');
    return response.json();
}

export async function updateAssetAPI(id: string, data: Record<string, unknown>) {
    const response = await fetch('/api/assets', {
        method: 'PUT',
        headers: API_HEADERS,
        body: JSON.stringify({ _id: id, ...data }),
    });
    if (!response.ok) throw new Error('Failed to update asset');
    return response.json();
}

export async function deleteAssetAPI(id: string) {
    const response = await fetch(`/api/assets?id=${id}`, {
        method: 'DELETE',
        headers: API_HEADERS,
    });
    if (!response.ok) throw new Error('Failed to delete asset');
    return response.json();
}

// ============ LIABILITIES ============
export async function fetchLiabilities() {
    const response = await fetch('/api/liabilities', { headers: API_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch liabilities');
    return response.json();
}

export async function createLiabilityAPI(data: {
    name: string;
    type: string;
    principal: number;
    currentBalance: number;
    interestRate: number;
    emi?: number;
    institution?: string;
    notes?: string;
}) {
    const response = await fetch('/api/liabilities', {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create liability');
    return response.json();
}

export async function updateLiabilityAPI(id: string, data: Record<string, unknown>) {
    const response = await fetch('/api/liabilities', {
        method: 'PUT',
        headers: API_HEADERS,
        body: JSON.stringify({ _id: id, ...data }),
    });
    if (!response.ok) throw new Error('Failed to update liability');
    return response.json();
}

export async function deleteLiabilityAPI(id: string) {
    const response = await fetch(`/api/liabilities?id=${id}`, {
        method: 'DELETE',
        headers: API_HEADERS,
    });
    if (!response.ok) throw new Error('Failed to delete liability');
    return response.json();
}

// ============ TRANSACTIONS ============
export async function fetchTransactions(options?: {
    limit?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
}) {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.type) params.set('type', options.type);
    if (options?.startDate) params.set('startDate', options.startDate);
    if (options?.endDate) params.set('endDate', options.endDate);

    const response = await fetch(`/api/transactions?${params}`, { headers: API_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
}

export async function createTransactionAPI(data: {
    type: 'income' | 'expense' | 'transfer';
    category: string;
    amount: number;
    description: string;
    date: string;
    account?: string;
    tags?: string[];
}) {
    const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create transaction');
    return response.json();
}

export async function updateTransactionAPI(id: string, data: Record<string, unknown>) {
    const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: API_HEADERS,
        body: JSON.stringify({ _id: id, ...data }),
    });
    if (!response.ok) throw new Error('Failed to update transaction');
    return response.json();
}

export async function deleteTransactionAPI(id: string) {
    const response = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
        headers: API_HEADERS,
    });
    if (!response.ok) throw new Error('Failed to delete transaction');
    return response.json();
}

// ============ INVESTMENTS ============
export async function fetchInvestments() {
    const response = await fetch('/api/investments', { headers: API_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch investments');
    return response.json();
}

export async function createInvestmentAPI(data: {
    name: string;
    type: string;
    symbol?: string;
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
}) {
    const response = await fetch('/api/investments', {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create investment');
    return response.json();
}

export async function updateInvestmentAPI(id: string, data: Record<string, unknown>) {
    const response = await fetch('/api/investments', {
        method: 'PUT',
        headers: API_HEADERS,
        body: JSON.stringify({ _id: id, ...data }),
    });
    if (!response.ok) throw new Error('Failed to update investment');
    return response.json();
}

export async function deleteInvestmentAPI(id: string) {
    const response = await fetch(`/api/investments?id=${id}`, {
        method: 'DELETE',
        headers: API_HEADERS,
    });
    if (!response.ok) throw new Error('Failed to delete investment');
    return response.json();
}

// ============ GOALS ============
export async function fetchGoals() {
    const response = await fetch('/api/goals', { headers: API_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch goals');
    return response.json();
}

export async function createGoalAPI(data: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    targetDate: string;
    category: string;
    priority?: 'low' | 'medium' | 'high';
    notes?: string;
}) {
    const response = await fetch('/api/goals', {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create goal');
    return response.json();
}

export async function updateGoalAPI(id: string, data: Record<string, unknown>) {
    const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: API_HEADERS,
        body: JSON.stringify({ _id: id, ...data }),
    });
    if (!response.ok) throw new Error('Failed to update goal');
    return response.json();
}

export async function deleteGoalAPI(id: string) {
    const response = await fetch(`/api/goals?id=${id}`, {
        method: 'DELETE',
        headers: API_HEADERS,
    });
    if (!response.ok) throw new Error('Failed to delete goal');
    return response.json();
}

// ============ WATCHLIST ============
export async function fetchWatchlist() {
    const response = await fetch('/api/watchlist', { headers: API_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch watchlist');
    return response.json();
}

export async function addToWatchlistAPI(data: {
    symbol: string;
    name: string;
    addedPrice: number;
}) {
    const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add to watchlist');
    return response.json();
}

export async function removeFromWatchlistAPI(symbol: string) {
    const response = await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, {
        method: 'DELETE',
        headers: API_HEADERS,
    });
    if (!response.ok) throw new Error('Failed to remove from watchlist');
    return response.json();
}

// ============ PORTFOLIO (Paper Trading) ============
export async function fetchPortfolio() {
    const response = await fetch('/api/portfolio', { headers: API_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch portfolio');
    return response.json();
}

export async function executeTradeAPI(data: {
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
}) {
    const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: API_HEADERS,
        body: JSON.stringify(data),
    });
    return response.json();
}

export async function resetPortfolioAPI() {
    const response = await fetch('/api/portfolio', {
        method: 'DELETE',
        headers: API_HEADERS,
    });
    if (!response.ok) throw new Error('Failed to reset portfolio');
    return response.json();
}

// ============ TRADES ============
export async function fetchTrades(limit: number = 50) {
    const response = await fetch(`/api/trades?limit=${limit}`, { headers: API_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch trades');
    return response.json();
}

// ============ DASHBOARD ============
export async function fetchDashboard() {
    const response = await fetch('/api/dashboard', { headers: API_HEADERS });
    if (!response.ok) throw new Error('Failed to fetch dashboard');
    return response.json();
}
