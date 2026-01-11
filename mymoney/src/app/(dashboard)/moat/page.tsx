'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { POPULAR_STOCKS, getMultipleQuotes, StockQuote } from '@/lib/market-data';
import { scoreStock, rankStocks, StockScore } from '@/lib/stock-scoring';
import { getWatchlist, WatchlistItem } from '@/lib/watchlist';
import { formatCurrency } from '@/lib/utils';

interface ScoredStock {
    quote: StockQuote;
    score: StockScore;
}

type SectorKey = 'Banking' | 'Technology' | 'Energy' | 'Consumer' | 'Healthcare' | 'Infrastructure' | 'Telecom' | 'Financial Services' | 'Auto' | 'Materials';

const SECTORS: Record<SectorKey, string[]> = {
    Banking: ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS'],
    Technology: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS'],
    Energy: ['RELIANCE.NS'],
    Consumer: ['HINDUNILVR.NS', 'ASIANPAINT.NS', 'TITAN.NS', 'NESTLEIND.NS'],
    Healthcare: ['SUNPHARMA.NS'],
    Infrastructure: ['LT.NS'],
    Telecom: ['BHARTIARTL.NS'],
    'Financial Services': ['BAJFINANCE.NS'],
    Auto: ['MARUTI.NS'],
    Materials: ['ULTRACEMCO.NS'],
};

export default function MoatPage() {
    const [scoredStocks, setScoredStocks] = useState<ScoredStock[]>([]);
    const [watchlistScores, setWatchlistScores] = useState<ScoredStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'top-picks' | 'sectors' | 'watchlist'>('top-picks');
    const [selectedStock, setSelectedStock] = useState<ScoredStock | null>(null);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            // Load all popular stocks
            const quotes = await getMultipleQuotes(POPULAR_STOCKS.map(s => s.symbol));

            // Score all stocks
            const scores = await rankStocks(quotes);
            const scored = scores.map(score => ({
                quote: quotes.find(q => q.symbol === score.symbol)!,
                score
            })).filter(s => s.quote);

            setScoredStocks(scored);

            // Load watchlist
            const watchlist = getWatchlist();
            if (watchlist.length > 0) {
                const watchlistSymbols = watchlist.map(w => w.symbol);
                const watchlistQuotes = await getMultipleQuotes(watchlistSymbols);
                const watchlistScoresData = await rankStocks(watchlistQuotes);
                const watchlistScored = watchlistScoresData.map(score => ({
                    quote: watchlistQuotes.find(q => q.symbol === score.symbol)!,
                    score
                })).filter(s => s.quote);
                setWatchlistScores(watchlistScored);
            }
        } catch (error) {
            console.error('Error loading moat data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSignalClass = (signal: StockScore['signal']) => {
        switch (signal) {
            case 'STRONG_BUY': return styles.signalStrongBuy;
            case 'BUY': return styles.signalBuy;
            case 'HOLD': return styles.signalHold;
            case 'SELL': return styles.signalSell;
            case 'STRONG_SELL': return styles.signalStrongSell;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 75) return '#0f766e';
        if (score >= 60) return '#16a34a';
        if (score >= 40) return '#d97706';
        if (score >= 25) return '#dc2626';
        return '#991b1b';
    };

    const getSectorScores = () => {
        const sectorData: { sector: string; avgScore: number; stocks: ScoredStock[] }[] = [];

        for (const [sector, symbols] of Object.entries(SECTORS)) {
            const sectorStocks = scoredStocks.filter(s => symbols.includes(s.quote.symbol));
            if (sectorStocks.length > 0) {
                const avgScore = Math.round(
                    sectorStocks.reduce((acc, s) => acc + s.score.overallScore, 0) / sectorStocks.length
                );
                sectorData.push({ sector, avgScore, stocks: sectorStocks });
            }
        }

        return sectorData.sort((a, b) => b.avgScore - a.avgScore);
    };

    const renderStockCard = (scoredStock: ScoredStock, rank?: number) => (
        <div
            key={scoredStock.quote.symbol}
            className={styles.stockCard}
            onClick={() => setSelectedStock(scoredStock)}
        >
            {rank && <div className={styles.rank}>#{rank}</div>}
            <div className={styles.stockInfo}>
                <div className={styles.stockName}>
                    {scoredStock.quote.name}
                </div>
                <div className={styles.stockSymbol}>
                    {scoredStock.quote.symbol.replace('.NS', '')}
                </div>
            </div>
            <div className={styles.priceSection}>
                <div className={styles.price}>{formatCurrency(scoredStock.quote.price)}</div>
                <div className={`${styles.change} ${scoredStock.quote.changePercent >= 0 ? styles.positive : styles.negative}`}>
                    {scoredStock.quote.changePercent >= 0 ? '+' : ''}{scoredStock.quote.changePercent.toFixed(2)}%
                </div>
            </div>
            <div className={styles.scoreSection}>
                <div
                    className={styles.scoreCircle}
                    style={{
                        background: `conic-gradient(${getScoreColor(scoredStock.score.overallScore)} ${scoredStock.score.overallScore * 3.6}deg, #e5e7eb 0deg)`
                    }}
                >
                    <span className={styles.scoreValue}>{scoredStock.score.overallScore}</span>
                </div>
                <div className={`${styles.signal} ${getSignalClass(scoredStock.score.signal)}`}>
                    {scoredStock.score.signal.replace('_', ' ')}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Analyzing market data...</p>
                    <p className={styles.hint}>Running proprietary Moat algorithm on 20+ stocks</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.titleSection}>
                        <h1 className={styles.title}>
                            <span className={styles.moatIcon}>🏰</span>
                            The Moat
                        </h1>
                        <p className={styles.subtitle}>Proprietary Stock Intelligence Engine</p>
                    </div>
                    <div className={styles.headerStats}>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>{scoredStocks.length}</span>
                            <span className={styles.statLabel}>Stocks Analyzed</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>
                                {scoredStocks.filter(s => s.score.signal === 'STRONG_BUY' || s.score.signal === 'BUY').length}
                            </span>
                            <span className={styles.statLabel}>Buy Signals</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>
                                {scoredStocks.filter(s => s.score.signal === 'SELL' || s.score.signal === 'STRONG_SELL').length}
                            </span>
                            <span className={styles.statLabel}>Sell Signals</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Market Pulse */}
            <div className={styles.marketPulse}>
                <h2 className={styles.sectionTitle}>Market Pulse</h2>
                <div className={styles.pulseGrid}>
                    {scoredStocks.slice(0, 6).map((stock, idx) => (
                        <div key={stock.quote.symbol} className={styles.pulseCard} onClick={() => setSelectedStock(stock)}>
                            <div className={styles.pulseHeader}>
                                <span className={styles.pulseSymbol}>{stock.quote.symbol.replace('.NS', '')}</span>
                                <span className={`${styles.pulseChange} ${stock.quote.changePercent >= 0 ? styles.positive : styles.negative}`}>
                                    {stock.quote.changePercent >= 0 ? '↑' : '↓'} {Math.abs(stock.quote.changePercent).toFixed(1)}%
                                </span>
                            </div>
                            <div className={styles.pulsePrice}>{formatCurrency(stock.quote.price)}</div>
                            <div className={`${styles.pulseSignal} ${getSignalClass(stock.score.signal)}`}>
                                {stock.score.overallScore} • {stock.score.signal.replace('_', ' ')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'top-picks' ? styles.active : ''}`}
                    onClick={() => setActiveTab('top-picks')}
                >
                    🏆 Top Picks
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'sectors' ? styles.active : ''}`}
                    onClick={() => setActiveTab('sectors')}
                >
                    📊 Sectors
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'watchlist' ? styles.active : ''}`}
                    onClick={() => setActiveTab('watchlist')}
                >
                    ⭐ Watchlist ({watchlistScores.length})
                </button>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {activeTab === 'top-picks' && (
                    <div className={styles.topPicks}>
                        <div className={styles.picksHeader}>
                            <h2>Top Investment Opportunities</h2>
                            <p>Ranked by Moat Score - combining momentum, value, and risk analysis</p>
                        </div>
                        <div className={styles.stockList}>
                            {scoredStocks.map((stock, idx) => renderStockCard(stock, idx + 1))}
                        </div>
                    </div>
                )}

                {activeTab === 'sectors' && (
                    <div className={styles.sectors}>
                        <div className={styles.sectorHeatmap}>
                            {getSectorScores().map(sector => (
                                <div
                                    key={sector.sector}
                                    className={styles.sectorCard}
                                    style={{ borderLeftColor: getScoreColor(sector.avgScore) }}
                                >
                                    <div className={styles.sectorHeader}>
                                        <span className={styles.sectorName}>{sector.sector}</span>
                                        <span
                                            className={styles.sectorScore}
                                            style={{ color: getScoreColor(sector.avgScore) }}
                                        >
                                            {sector.avgScore}
                                        </span>
                                    </div>
                                    <div className={styles.sectorStocks}>
                                        {sector.stocks.map(stock => (
                                            <div
                                                key={stock.quote.symbol}
                                                className={styles.sectorStock}
                                                onClick={() => setSelectedStock(stock)}
                                            >
                                                <span>{stock.quote.symbol.replace('.NS', '')}</span>
                                                <span className={`${styles.miniSignal} ${getSignalClass(stock.score.signal)}`}>
                                                    {stock.score.overallScore}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'watchlist' && (
                    <div className={styles.watchlistTab}>
                        {watchlistScores.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>⭐</span>
                                <h3>No stocks in watchlist</h3>
                                <p>Add stocks from the Trading Terminal to track their Moat scores</p>
                                <Link href="/trade" className={styles.ctaButton}>
                                    Go to Trading Terminal
                                </Link>
                            </div>
                        ) : (
                            <div className={styles.stockList}>
                                {watchlistScores.map((stock, idx) => renderStockCard(stock, idx + 1))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Detail Panel */}
            {selectedStock && (
                <div className={styles.detailOverlay} onClick={() => setSelectedStock(null)}>
                    <div className={styles.detailPanel} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setSelectedStock(null)}>×</button>

                        <div className={styles.detailHeader}>
                            <div>
                                <h2>{selectedStock.quote.name}</h2>
                                <span className={styles.detailSymbol}>{selectedStock.quote.symbol}</span>
                            </div>
                            <div className={styles.detailPrice}>
                                <span className={styles.bigPrice}>{formatCurrency(selectedStock.quote.price)}</span>
                                <span className={`${styles.detailChange} ${selectedStock.quote.changePercent >= 0 ? styles.positive : styles.negative}`}>
                                    {selectedStock.quote.changePercent >= 0 ? '+' : ''}{selectedStock.quote.change.toFixed(2)} ({selectedStock.quote.changePercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>

                        <div className={styles.scoreBreakdown}>
                            <div className={styles.overallScore}>
                                <div
                                    className={styles.bigScoreCircle}
                                    style={{
                                        background: `conic-gradient(${getScoreColor(selectedStock.score.overallScore)} ${selectedStock.score.overallScore * 3.6}deg, #e5e7eb 0deg)`
                                    }}
                                >
                                    <span>{selectedStock.score.overallScore}</span>
                                </div>
                                <div className={`${styles.bigSignal} ${getSignalClass(selectedStock.score.signal)}`}>
                                    {selectedStock.score.signal.replace('_', ' ')}
                                </div>
                            </div>

                            <div className={styles.scoreDetails}>
                                <div className={styles.scoreRow}>
                                    <span className={styles.scoreLabel}>Momentum</span>
                                    <div className={styles.scoreBar}>
                                        <div
                                            className={styles.scoreBarFill}
                                            style={{
                                                width: `${selectedStock.score.momentumScore}%`,
                                                background: getScoreColor(selectedStock.score.momentumScore)
                                            }}
                                        />
                                    </div>
                                    <span className={styles.scoreNum}>{selectedStock.score.momentumScore}</span>
                                </div>
                                <div className={styles.scoreRow}>
                                    <span className={styles.scoreLabel}>Value</span>
                                    <div className={styles.scoreBar}>
                                        <div
                                            className={styles.scoreBarFill}
                                            style={{
                                                width: `${selectedStock.score.valueScore}%`,
                                                background: getScoreColor(selectedStock.score.valueScore)
                                            }}
                                        />
                                    </div>
                                    <span className={styles.scoreNum}>{selectedStock.score.valueScore}</span>
                                </div>
                                <div className={styles.scoreRow}>
                                    <span className={styles.scoreLabel}>Risk</span>
                                    <div className={styles.scoreBar}>
                                        <div
                                            className={styles.scoreBarFill}
                                            style={{
                                                width: `${selectedStock.score.riskScore}%`,
                                                background: getScoreColor(selectedStock.score.riskScore)
                                            }}
                                        />
                                    </div>
                                    <span className={styles.scoreNum}>{selectedStock.score.riskScore}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.reasoning}>
                            <h4>Analysis</h4>
                            <ul>
                                {selectedStock.score.reasoning.map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                ))}
                            </ul>
                        </div>

                        <div className={styles.detailStats}>
                            <div className={styles.detailStat}>
                                <span>Day Range</span>
                                <span>{formatCurrency(selectedStock.quote.dayLow)} - {formatCurrency(selectedStock.quote.dayHigh)}</span>
                            </div>
                            <div className={styles.detailStat}>
                                <span>52W Range</span>
                                <span>{formatCurrency(selectedStock.quote.fiftyTwoWeekLow)} - {formatCurrency(selectedStock.quote.fiftyTwoWeekHigh)}</span>
                            </div>
                            <div className={styles.detailStat}>
                                <span>Volume</span>
                                <span>{selectedStock.quote.volume?.toLocaleString('en-IN') || '—'}</span>
                            </div>
                        </div>

                        <Link href="/trade" className={styles.tradeBtn}>
                            Trade {selectedStock.quote.symbol.replace('.NS', '')}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
