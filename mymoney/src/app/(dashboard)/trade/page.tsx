'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';
import {
    getStockQuote,
    getHistoricalData,
    searchStocks,
    POPULAR_STOCKS,
    StockQuote,
    HistoricalData
} from '@/lib/market-data';
import {
    executeBuy,
    executeSell,
    getPortfolio,
    getTrades,
    initializePortfolio,
    resetPortfolio,
    Portfolio,
    Trade
} from '@/lib/paper-trading';
import { scoreStock, StockScore } from '@/lib/stock-scoring';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/lib/watchlist';
import { formatCurrency } from '@/lib/utils';

type TimeFrame = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y';

export default function TradingTerminal() {
    // Stock state
    const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE.NS');
    const [quote, setQuote] = useState<StockQuote | null>(null);
    const [history, setHistory] = useState<HistoricalData[]>([]);
    const [timeframe, setTimeframe] = useState<TimeFrame>('1mo');
    const [loading, setLoading] = useState(true);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
    const [showSearch, setShowSearch] = useState(false);

    // Order state
    const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
    const [quantity, setQuantity] = useState(1);
    const [orderMessage, setOrderMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [executing, setExecuting] = useState(false);

    // Portfolio state
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [activeTab, setActiveTab] = useState<'portfolio' | 'trades' | 'watchlist'>('portfolio');

    // Stock score & watchlist state
    const [stockScore, setStockScore] = useState<StockScore | null>(null);
    const [inWatchlist, setInWatchlist] = useState(false);

    // Initialize portfolio
    useEffect(() => {
        initializePortfolio();
        loadPortfolio();
    }, []);

    // Load stock data
    useEffect(() => {
        loadStockData(selectedSymbol);
    }, [selectedSymbol, timeframe]);

    // Check watchlist status when symbol changes
    useEffect(() => {
        setInWatchlist(isInWatchlist(selectedSymbol));
    }, [selectedSymbol]);

    const loadStockData = async (symbol: string) => {
        setLoading(true);
        setStockScore(null);
        const [quoteData, historyData] = await Promise.all([
            getStockQuote(symbol),
            getHistoricalData(symbol, timeframe)
        ]);
        setQuote(quoteData);
        setHistory(historyData);
        setLoading(false);

        // Load score in background
        if (quoteData) {
            scoreStock(quoteData).then(setStockScore);
        }
    };

    const loadPortfolio = async () => {
        const portfolioData = await getPortfolio();
        setPortfolio(portfolioData);
        setTrades(getTrades());
    };

    // Search handler
    const handleSearch = useCallback(async (query: string) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            const results = await searchStocks(query);
            setSearchResults(results);
            setShowSearch(true);
        } else {
            setSearchResults([]);
            setShowSearch(false);
        }
    }, []);

    const selectStock = (symbol: string) => {
        setSelectedSymbol(symbol);
        setSearchQuery('');
        setShowSearch(false);
        setSearchResults([]);
    };

    // Execute order
    const executeOrder = async () => {
        if (!quote || quantity <= 0) return;

        setExecuting(true);
        setOrderMessage(null);

        const result = orderType === 'BUY'
            ? await executeBuy(selectedSymbol, quantity)
            : await executeSell(selectedSymbol, quantity);

        setOrderMessage({
            type: result.success ? 'success' : 'error',
            text: result.message
        });

        if (result.success) {
            await loadPortfolio();
            setQuantity(1);
        }

        setExecuting(false);
        setTimeout(() => setOrderMessage(null), 5000);
    };

    // Calculate order value
    const orderValue = quote ? quote.price * quantity : 0;
    const canAfford = portfolio ? orderValue <= portfolio.cash : false;

    // Find position for current stock
    const currentPosition = portfolio?.positions.find(p => p.symbol === selectedSymbol);

    // Simple chart rendering  
    const renderChart = () => {
        if (history.length === 0) return null;

        const prices = history.map(h => h.close);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const range = maxPrice - minPrice || 1;

        return (
            <div className={styles.chart}>
                <div className={styles.chartBars}>
                    {history.map((h, i) => {
                        const height = ((h.close - minPrice) / range) * 100;
                        const isUp = h.close >= h.open;
                        return (
                            <div
                                key={i}
                                className={`${styles.chartBar} ${isUp ? styles.up : styles.down}`}
                                style={{ height: `${Math.max(5, height)}%` }}
                                title={`${new Date(h.date).toLocaleDateString()}: ₹${h.close.toFixed(2)}`}
                            />
                        );
                    })}
                </div>
                <div className={styles.chartLabels}>
                    <span>₹{maxPrice.toFixed(0)}</span>
                    <span>₹{minPrice.toFixed(0)}</span>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Trading Terminal</h1>
                    <p className={styles.subtitle}>Paper Trading with Live Market Data</p>
                </div>
                <div className={styles.portfolioSummary}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Portfolio Value</span>
                        <span className={styles.summaryValue}>
                            {portfolio ? formatCurrency(portfolio.totalValue) : '—'}
                        </span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Total P&L</span>
                        <span className={`${styles.summaryValue} ${portfolio && portfolio.totalPnL >= 0 ? styles.positive : styles.negative}`}>
                            {portfolio ? `${portfolio.totalPnL >= 0 ? '+' : ''}${formatCurrency(portfolio.totalPnL)} (${portfolio.totalPnLPercent.toFixed(2)}%)` : '—'}
                        </span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Available Cash</span>
                        <span className={styles.summaryValue}>
                            {portfolio ? formatCurrency(portfolio.cash) : '—'}
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.mainGrid}>
                {/* Left: Stock Chart & Info */}
                <div className={styles.chartSection}>
                    {/* Search Bar */}
                    <div className={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Search stocks (e.g., RELIANCE, TCS, HDFC)"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className={styles.searchInput}
                        />
                        {showSearch && searchResults.length > 0 && (
                            <div className={styles.searchResults}>
                                {searchResults.map((result) => (
                                    <div
                                        key={result.symbol}
                                        className={styles.searchResult}
                                        onClick={() => selectStock(result.symbol)}
                                    >
                                        <span className={styles.resultSymbol}>{result.symbol}</span>
                                        <span className={styles.resultName}>{result.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Stock Buttons */}
                    <div className={styles.quickStocks}>
                        {POPULAR_STOCKS.slice(0, 8).map((stock) => (
                            <button
                                key={stock.symbol}
                                className={`${styles.quickStock} ${selectedSymbol === stock.symbol ? styles.active : ''}`}
                                onClick={() => selectStock(stock.symbol)}
                            >
                                {stock.symbol.replace('.NS', '')}
                            </button>
                        ))}
                    </div>

                    {/* Stock Header */}
                    {quote && (
                        <div className={styles.stockHeader}>
                            <div className={styles.stockInfo}>
                                <div className={styles.stockNameRow}>
                                    <h2 className={styles.stockName}>{quote.name}</h2>
                                    <button
                                        className={`${styles.watchlistBtn} ${inWatchlist ? styles.inWatchlist : ''}`}
                                        onClick={() => {
                                            if (inWatchlist) {
                                                removeFromWatchlist(selectedSymbol);
                                            } else {
                                                addToWatchlist(selectedSymbol, quote.name, quote.price);
                                            }
                                            setInWatchlist(!inWatchlist);
                                        }}
                                        title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                                    >
                                        {inWatchlist ? '★' : '☆'}
                                    </button>
                                </div>
                                <span className={styles.stockSymbol}>{quote.symbol}</span>
                                {/* AI Score Badge */}
                                {stockScore && (
                                    <div className={`${styles.scoreBadge} ${styles[`signal${stockScore.signal.replace('_', '')}`]}`}>
                                        <span className={styles.scoreValue}>{stockScore.overallScore}</span>
                                        <span className={styles.scoreSignal}>{stockScore.signal.replace('_', ' ')}</span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.priceInfo}>
                                <span className={styles.currentPrice}>{formatCurrency(quote.price)}</span>
                                <span className={`${styles.priceChange} ${quote.change >= 0 ? styles.positive : styles.negative}`}>
                                    {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Timeframe Selector */}
                    <div className={styles.timeframes}>
                        {(['1d', '5d', '1mo', '3mo', '6mo', '1y'] as TimeFrame[]).map((tf) => (
                            <button
                                key={tf}
                                className={`${styles.timeframe} ${timeframe === tf ? styles.active : ''}`}
                                onClick={() => setTimeframe(tf)}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    {/* Chart */}
                    {loading ? (
                        <div className={styles.loading}>Loading chart data...</div>
                    ) : (
                        renderChart()
                    )}

                    {/* Stock Stats */}
                    {quote && (
                        <div className={styles.stockStats}>
                            <div className={styles.stat}>
                                <span className={styles.statLabel}>Open</span>
                                <span className={styles.statValue}>{formatCurrency(quote.open)}</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statLabel}>Day High</span>
                                <span className={styles.statValue}>{formatCurrency(quote.dayHigh)}</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statLabel}>Day Low</span>
                                <span className={styles.statValue}>{formatCurrency(quote.dayLow)}</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statLabel}>52W High</span>
                                <span className={styles.statValue}>{formatCurrency(quote.fiftyTwoWeekHigh)}</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statLabel}>52W Low</span>
                                <span className={styles.statValue}>{formatCurrency(quote.fiftyTwoWeekLow)}</span>
                            </div>
                            <div className={styles.stat}>
                                <span className={styles.statLabel}>Volume</span>
                                <span className={styles.statValue}>{quote.volume?.toLocaleString('en-IN') || '—'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Order Panel & Portfolio */}
                <div className={styles.rightPanel}>
                    {/* Order Entry */}
                    <div className={styles.orderPanel}>
                        <h3 className={styles.panelTitle}>Place Order</h3>

                        {/* Order Type Toggle */}
                        <div className={styles.orderTypeToggle}>
                            <button
                                className={`${styles.orderTypeBtn} ${orderType === 'BUY' ? styles.buyActive : ''}`}
                                onClick={() => setOrderType('BUY')}
                            >
                                BUY
                            </button>
                            <button
                                className={`${styles.orderTypeBtn} ${orderType === 'SELL' ? styles.sellActive : ''}`}
                                onClick={() => setOrderType('SELL')}
                            >
                                SELL
                            </button>
                        </div>

                        {/* Current Position */}
                        {currentPosition && (
                            <div className={styles.currentPosition}>
                                <span>You own: {currentPosition.quantity} shares</span>
                                <span className={currentPosition.pnl >= 0 ? styles.positive : styles.negative}>
                                    P&L: {formatCurrency(currentPosition.pnl)}
                                </span>
                            </div>
                        )}

                        {/* Quantity Input */}
                        <div className={styles.inputGroup}>
                            <label>Quantity</label>
                            <div className={styles.quantityInput}>
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                />
                                <button onClick={() => setQuantity(quantity + 1)}>+</button>
                            </div>
                        </div>

                        {/* Quick Quantity Buttons */}
                        <div className={styles.quickQuantity}>
                            {[1, 5, 10, 25, 50, 100].map((q) => (
                                <button key={q} onClick={() => setQuantity(q)}>{q}</button>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className={styles.orderSummary}>
                            <div className={styles.summaryRow}>
                                <span>Price</span>
                                <span>{quote ? formatCurrency(quote.price) : '—'}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Quantity</span>
                                <span>{quantity}</span>
                            </div>
                            <div className={`${styles.summaryRow} ${styles.total}`}>
                                <span>Total</span>
                                <span>{formatCurrency(orderValue)}</span>
                            </div>
                        </div>

                        {/* Order Message */}
                        {orderMessage && (
                            <div className={`${styles.orderMessage} ${styles[orderMessage.type]}`}>
                                {orderMessage.text}
                            </div>
                        )}

                        {/* Execute Button */}
                        <button
                            className={`${styles.executeBtn} ${orderType === 'BUY' ? styles.buyBtn : styles.sellBtn}`}
                            onClick={executeOrder}
                            disabled={executing || !quote || (orderType === 'BUY' && !canAfford) || (orderType === 'SELL' && (!currentPosition || currentPosition.quantity < quantity))}
                        >
                            {executing ? 'Executing...' : `${orderType} ${quantity} shares`}
                        </button>

                        {orderType === 'BUY' && !canAfford && (
                            <p className={styles.warning}>Insufficient funds</p>
                        )}
                    </div>

                    {/* Portfolio / Trades Tabs */}
                    <div className={styles.portfolioPanel}>
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${activeTab === 'portfolio' ? styles.active : ''}`}
                                onClick={() => setActiveTab('portfolio')}
                            >
                                Portfolio ({portfolio?.positions.length || 0})
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'trades' ? styles.active : ''}`}
                                onClick={() => setActiveTab('trades')}
                            >
                                Trades ({trades.length})
                            </button>
                        </div>

                        {activeTab === 'portfolio' ? (
                            <div className={styles.positionsList}>
                                {portfolio?.positions.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <p>No positions yet</p>
                                        <p className={styles.hint}>Start trading to build your portfolio</p>
                                    </div>
                                ) : (
                                    portfolio?.positions.map((pos) => (
                                        <div
                                            key={pos.symbol}
                                            className={`${styles.positionCard} ${selectedSymbol === pos.symbol ? styles.selected : ''}`}
                                            onClick={() => selectStock(pos.symbol)}
                                        >
                                            <div className={styles.positionHeader}>
                                                <span className={styles.positionSymbol}>{pos.symbol.replace('.NS', '')}</span>
                                                <span className={`${styles.positionPnl} ${pos.pnl >= 0 ? styles.positive : styles.negative}`}>
                                                    {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)}
                                                </span>
                                            </div>
                                            <div className={styles.positionDetails}>
                                                <span>{pos.quantity} @ {formatCurrency(pos.avgPrice)}</span>
                                                <span>LTP: {formatCurrency(pos.currentPrice)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className={styles.tradesList}>
                                {trades.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <p>No trades yet</p>
                                    </div>
                                ) : (
                                    trades.slice(0, 10).map((trade) => (
                                        <div key={trade.id} className={styles.tradeCard}>
                                            <div className={styles.tradeHeader}>
                                                <span className={`${styles.tradeType} ${trade.type === 'BUY' ? styles.buy : styles.sell}`}>
                                                    {trade.type}
                                                </span>
                                                <span className={styles.tradeSymbol}>{trade.symbol.replace('.NS', '')}</span>
                                            </div>
                                            <div className={styles.tradeDetails}>
                                                <span>{trade.quantity} @ {formatCurrency(trade.price)}</span>
                                                <span>{new Date(trade.timestamp).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Reset Button */}
                        <button
                            className={styles.resetBtn}
                            onClick={() => {
                                if (confirm('Reset portfolio? This will clear all trades and positions.')) {
                                    resetPortfolio();
                                    loadPortfolio();
                                }
                            }}
                        >
                            Reset Portfolio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
