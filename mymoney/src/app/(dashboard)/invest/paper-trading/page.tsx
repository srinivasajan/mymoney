'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import styles from '../../assets/page.module.css';
import {
    getVirtualPortfolio,
    getPortfolioSummary,
    getPaperTrades,
    executeBuyOrder,
    executeSellOrder,
    resetVirtualPortfolio,
    PortfolioSummary,
    PaperTrade,
    VirtualHolding,
} from '@/lib/investment/paper-trading';
import { POPULAR_STOCKS, POPULAR_MUTUAL_FUNDS } from '@/lib/investment';
import { formatCurrency, formatDate } from '@/lib/utils';

type Tab = 'portfolio' | 'trade' | 'history';

export default function PaperTradingPage() {
    const [activeTab, setActiveTab] = useState<Tab>('portfolio');
    const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
    const [trades, setTrades] = useState<PaperTrade[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [selectedAsset, setSelectedAsset] = useState<{ symbol: string; name: string; assetType: 'stock' | 'mutual_fund' } | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [price, setPrice] = useState<number>(0);
    const { addToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        try {
            const summary = getPortfolioSummary();
            setPortfolioSummary(summary);
            setTrades(getPaperTrades());
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenTradeModal = (type: 'buy' | 'sell', holding?: VirtualHolding) => {
        setTradeType(type);
        if (holding) {
            setSelectedAsset({
                symbol: holding.symbol,
                name: holding.name,
                assetType: holding.assetType === 'etf' ? 'stock' : holding.assetType,
            });
            setPrice(holding.currentPrice);
        } else {
            setSelectedAsset(null);
            setPrice(0);
        }
        setQuantity(1);
        setIsTradeModalOpen(true);
    };

    const handleExecuteTrade = () => {
        if (!selectedAsset || quantity <= 0 || price <= 0) {
            addToast('Please fill in all fields', 'warning');
            return;
        }

        let result;
        if (tradeType === 'buy') {
            result = executeBuyOrder(
                selectedAsset.symbol,
                selectedAsset.name,
                selectedAsset.assetType,
                quantity,
                price
            );
        } else {
            result = executeSellOrder(
                selectedAsset.symbol,
                selectedAsset.name,
                selectedAsset.assetType,
                quantity,
                price
            );
        }

        if (result.success) {
            addToast(result.message, 'success');
            loadData();
            setIsTradeModalOpen(false);
        } else {
            addToast(result.message, 'error');
        }
    };

    const handleResetPortfolio = () => {
        if (confirm('Are you sure you want to reset your portfolio? All trades will be deleted.')) {
            resetVirtualPortfolio();
            loadData();
            addToast('Portfolio reset to ₹10,00,000', 'success');
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="loader loader-lg"></div>
                <p>Loading paper trading...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <Link href="/invest" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
                            ← Back to Invest
                        </Link>
                    </div>
                    <h1 className={styles.title}>Paper Trading</h1>
                    <p className={styles.subtitle}>Practice trading with virtual money</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="btn btn-secondary" onClick={handleResetPortfolio}>
                        🔄 Reset
                    </button>
                    <button className="btn btn-primary" onClick={() => handleOpenTradeModal('buy')}>
                        + New Trade
                    </button>
                </div>
            </div>

            {/* Portfolio Summary */}
            {portfolioSummary && (
                <div className={styles.summaryCard} style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Total Value</span>
                        <span className={styles.summaryValue}>{formatCurrency(portfolioSummary.totalValue)}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Cash Balance</span>
                        <span className={styles.summaryValue} style={{ color: 'var(--color-accent-blue)' }}>
                            {formatCurrency(portfolioSummary.cashBalance)}
                        </span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Invested</span>
                        <span className={styles.summaryValue}>{formatCurrency(portfolioSummary.investedValue)}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Total P&L</span>
                        <span className={styles.summaryValue} style={{
                            color: portfolioSummary.totalPnl >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'
                        }}>
                            {portfolioSummary.totalPnl >= 0 ? '+' : ''}{formatCurrency(portfolioSummary.totalPnl)}
                            <span style={{ fontSize: 'var(--font-size-sm)', marginLeft: 'var(--spacing-xs)' }}>
                                ({portfolioSummary.totalPnlPercent >= 0 ? '+' : ''}{portfolioSummary.totalPnlPercent.toFixed(2)}%)
                            </span>
                        </span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-xl)',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: 'var(--spacing-md)'
            }}>
                {[
                    { id: 'portfolio', label: 'Holdings', icon: '📊' },
                    { id: 'trade', label: 'Quick Trade', icon: '💹' },
                    { id: 'history', label: 'Trade History', icon: '📜' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        style={{
                            padding: 'var(--spacing-sm) var(--spacing-lg)',
                            background: activeTab === tab.id ? 'var(--color-accent-primary-muted)' : 'transparent',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: activeTab === tab.id ? 'var(--font-weight-semibold)' : 'normal',
                            color: activeTab === tab.id ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                            transition: 'all var(--transition-base)',
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && portfolioSummary && (
                <>
                    {portfolioSummary.holdings.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📈</span>
                            <h3>No holdings yet</h3>
                            <p>Start trading to build your virtual portfolio</p>
                            <button className="btn btn-primary" onClick={() => setActiveTab('trade')}>
                                Start Trading
                            </button>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Symbol</th>
                                        <th>Name</th>
                                        <th>Qty</th>
                                        <th>Avg Price</th>
                                        <th>Current</th>
                                        <th>Invested</th>
                                        <th>Current Value</th>
                                        <th>P&L</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolioSummary.holdings.map(holding => (
                                        <tr key={holding.symbol}>
                                            <td><strong>{holding.symbol}</strong></td>
                                            <td className={styles.nameCell}>
                                                <span className={styles.assetName}>{holding.name}</span>
                                            </td>
                                            <td>{holding.quantity}</td>
                                            <td>{formatCurrency(holding.avgPrice)}</td>
                                            <td>{formatCurrency(holding.currentPrice)}</td>
                                            <td>{formatCurrency(holding.investedValue)}</td>
                                            <td>{formatCurrency(holding.currentValue)}</td>
                                            <td style={{
                                                color: holding.pnl >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'
                                            }}>
                                                {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
                                                <br />
                                                <span style={{ fontSize: 'var(--font-size-xs)' }}>
                                                    ({holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%)
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleOpenTradeModal('sell', holding)}
                                                >
                                                    Sell
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Quick Trade Tab */}
            {activeTab === 'trade' && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--spacing-xl)'
                }}>
                    {/* Stocks */}
                    <div style={{
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-xl)',
                        padding: 'var(--spacing-lg)',
                    }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>📈 Popular Stocks</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {POPULAR_STOCKS.slice(0, 6).map(stock => (
                                <div key={stock.symbol} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-sm)',
                                    background: 'var(--color-bg-tertiary)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{stock.symbol}</div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                            {stock.sector}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                            setSelectedAsset({ symbol: stock.symbol, name: stock.name, assetType: 'stock' });
                                            setTradeType('buy');
                                            setPrice(Math.round(Math.random() * 2000 + 500)); // Mock price
                                            setIsTradeModalOpen(true);
                                        }}
                                    >
                                        Buy
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mutual Funds */}
                    <div style={{
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-xl)',
                        padding: 'var(--spacing-lg)',
                    }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>📊 Popular Mutual Funds</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {POPULAR_MUTUAL_FUNDS.slice(0, 6).map(mf => (
                                <div key={mf.schemeCode} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-sm)',
                                    background: 'var(--color-bg-tertiary)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontWeight: 'var(--font-weight-medium)',
                                            fontSize: 'var(--font-size-sm)',
                                            lineHeight: 1.3
                                        }}>
                                            {mf.schemeName.substring(0, 30)}...
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                            {mf.category}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                            setSelectedAsset({
                                                symbol: mf.schemeCode,
                                                name: mf.schemeName,
                                                assetType: 'mutual_fund'
                                            });
                                            setTradeType('buy');
                                            setPrice(Math.round(Math.random() * 100 + 50)); // Mock NAV
                                            setIsTradeModalOpen(true);
                                        }}
                                    >
                                        Buy
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <>
                    {trades.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📜</span>
                            <h3>No trades yet</h3>
                            <p>Your trade history will appear here</p>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Symbol</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...trades].reverse().map(trade => (
                                        <tr key={trade.id}>
                                            <td>{formatDate(trade.executedAt)}</td>
                                            <td>
                                                <span style={{
                                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: 'var(--font-size-xs)',
                                                    fontWeight: 'var(--font-weight-semibold)',
                                                    background: trade.type === 'buy'
                                                        ? 'var(--color-positive-muted)'
                                                        : 'var(--color-negative-muted)',
                                                    color: trade.type === 'buy'
                                                        ? 'var(--color-positive)'
                                                        : 'var(--color-negative)',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {trade.type}
                                                </span>
                                            </td>
                                            <td><strong>{trade.symbol}</strong></td>
                                            <td>{trade.quantity}</td>
                                            <td>{formatCurrency(trade.price)}</td>
                                            <td style={{
                                                fontWeight: 'var(--font-weight-semibold)',
                                                color: trade.type === 'buy'
                                                    ? 'var(--color-negative)'
                                                    : 'var(--color-positive)'
                                            }}>
                                                {trade.type === 'buy' ? '-' : '+'}{formatCurrency(trade.totalValue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Trade Modal */}
            <Modal
                isOpen={isTradeModalOpen}
                onClose={() => setIsTradeModalOpen(false)}
                title={`${tradeType === 'buy' ? '📈 Buy' : '📉 Sell'} ${selectedAsset?.symbol || 'Asset'}`}
                size="sm"
            >
                <form onSubmit={(e) => { e.preventDefault(); handleExecuteTrade(); }} className={styles.form}>
                    {!selectedAsset && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Select Asset</label>
                            <select
                                className="select"
                                onChange={(e) => {
                                    const [type, symbol, name] = e.target.value.split('|');
                                    if (type && symbol && name) {
                                        setSelectedAsset({
                                            symbol,
                                            name,
                                            assetType: type as 'stock' | 'mutual_fund'
                                        });
                                    }
                                }}
                            >
                                <option value="">Select...</option>
                                <optgroup label="Stocks">
                                    {POPULAR_STOCKS.map(s => (
                                        <option key={s.symbol} value={`stock|${s.symbol}|${s.name}`}>
                                            {s.symbol} - {s.name}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Mutual Funds">
                                    {POPULAR_MUTUAL_FUNDS.map(m => (
                                        <option key={m.schemeCode} value={`mutual_fund|${m.schemeCode}|${m.schemeName}`}>
                                            {m.schemeName.substring(0, 40)}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            {selectedAsset?.assetType === 'mutual_fund' ? 'Units' : 'Quantity'}
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                            className="input"
                            min="0.01"
                            step={selectedAsset?.assetType === 'mutual_fund' ? '0.01' : '1'}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            {selectedAsset?.assetType === 'mutual_fund' ? 'NAV (₹)' : 'Price per share (₹)'}
                        </label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                            className="input"
                            min="0.01"
                            step="0.01"
                        />
                    </div>

                    <div style={{
                        padding: 'var(--spacing-md)',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-lg)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Total Amount:</span>
                            <strong style={{
                                color: tradeType === 'buy' ? 'var(--color-negative)' : 'var(--color-positive)'
                            }}>
                                {tradeType === 'buy' ? '-' : '+'}{formatCurrency(quantity * price)}
                            </strong>
                        </div>
                        {portfolioSummary && tradeType === 'buy' && (
                            <div style={{
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--color-text-muted)',
                                marginTop: 'var(--spacing-xs)'
                            }}>
                                Available: {formatCurrency(portfolioSummary.cashBalance)}
                            </div>
                        )}
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsTradeModalOpen(false)}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`btn ${tradeType === 'buy' ? 'btn-primary' : 'btn-danger'}`}
                        >
                            {tradeType === 'buy' ? 'Buy' : 'Sell'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
