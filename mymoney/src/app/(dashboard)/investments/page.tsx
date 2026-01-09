'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import AllocationChart from '@/components/charts/AllocationChart';
import styles from './page.module.css';
import {
    getStockHoldings,
    getMFHoldings,
    createStockHolding,
    createMFHolding,
    deleteStockHolding,
    deleteMFHolding
} from '@/lib/storage';
import { searchMFSchemes, getLatestNAV } from '@/lib/api/mfapi';
import { formatCurrency, CHART_COLORS } from '@/lib/utils';
import type { StockHolding, MFHolding, StockHoldingFormData, MFHoldingFormData, MFScheme } from '@/lib/types';

type InvestmentTab = 'stocks' | 'mutual_funds';
type ModalType = 'stock' | 'mf' | null;

export default function InvestmentsPage() {
    const [activeTab, setActiveTab] = useState<InvestmentTab>('stocks');
    const [stocks, setStocks] = useState<StockHolding[]>([]);
    const [mfHoldings, setMfHoldings] = useState<MFHolding[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalType, setModalType] = useState<ModalType>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'stock' | 'mf'; id: string } | null>(null);

    // Stock form state
    const [stockForm, setStockForm] = useState<StockHoldingFormData>({
        symbol: '',
        exchange: 'NSE',
        quantity: 0,
        average_price: 0,
    });

    // MF form state
    const [mfForm, setMfForm] = useState<MFHoldingFormData>({
        scheme_code: '',
        scheme_name: '',
        units: 0,
        average_nav: 0,
    });

    // MF search state
    const [mfSearchQuery, setMfSearchQuery] = useState('');
    const [mfSearchResults, setMfSearchResults] = useState<MFScheme[]>([]);
    const [mfSearching, setMfSearching] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadInvestments();
    }, []);

    const loadInvestments = async () => {
        try {
            const stocksData = getStockHoldings();
            const mfData = getMFHoldings();

            setStocks(stocksData);
            setMfHoldings(mfData);

            // Fetch latest NAVs for MF holdings
            await updateMFNAVs(mfData);
        } catch (error) {
            console.error('Error loading investments:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateMFNAVs = async (holdings: MFHolding[]) => {
        const updatedHoldings = await Promise.all(
            holdings.map(async (h) => {
                const nav = await getLatestNAV(h.scheme_code);
                return {
                    ...h,
                    current_nav: nav || h.average_nav,
                    current_value: h.units * (nav || h.average_nav),
                    gain_loss: nav ? (nav - h.average_nav) * h.units : 0,
                    gain_loss_percent: nav ? ((nav - h.average_nav) / h.average_nav) * 100 : 0,
                };
            })
        );
        setMfHoldings(updatedHoldings);
    };

    // Debounced MF search
    const searchMF = useCallback(async (query: string) => {
        if (query.length < 2) {
            setMfSearchResults([]);
            return;
        }

        setMfSearching(true);
        try {
            const results = await searchMFSchemes(query);
            setMfSearchResults(results.slice(0, 10));
        } catch (error) {
            console.error('MF search error:', error);
        } finally {
            setMfSearching(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchMF(mfSearchQuery);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [mfSearchQuery, searchMF]);

    const handleStockSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!stockForm.symbol || stockForm.quantity <= 0 || stockForm.average_price <= 0) {
            addToast('Please fill all required fields', 'warning');
            return;
        }

        try {
            createStockHolding(stockForm);
            loadInvestments();
            setModalType(null);
            setStockForm({ symbol: '', exchange: 'NSE', quantity: 0, average_price: 0 });
            window.dispatchEvent(new Event('storage'));
            addToast(`Stock "${stockForm.symbol}" added successfully`, 'success');
        } catch (error) {
            console.error('Error adding stock:', error);
            addToast('Failed to add stock', 'error');
        }
    };

    const handleMFSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!mfForm.scheme_code || mfForm.units <= 0 || mfForm.average_nav <= 0) {
            addToast('Please fill all required fields', 'warning');
            return;
        }

        try {
            createMFHolding(mfForm);
            loadInvestments();
            setModalType(null);
            addToast(`Mutual fund added successfully`, 'success');
            setMfForm({ scheme_code: '', scheme_name: '', units: 0, average_nav: 0 });
            setMfSearchQuery('');
            setMfSearchResults([]);
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Error adding MF:', error);
            addToast('Failed to add mutual fund', 'error');
        }
    };

    const handleSelectMF = (scheme: MFScheme) => {
        setMfForm(prev => ({
            ...prev,
            scheme_code: String(scheme.schemeCode),
            scheme_name: scheme.schemeName,
        }));
        setMfSearchQuery(scheme.schemeName);
        setMfSearchResults([]);
    };

    const handleDelete = (type: 'stock' | 'mf', id: string) => {
        try {
            if (type === 'stock') {
                const stockToDelete = stocks.find(s => s.id === id);
                deleteStockHolding(id);
                addToast(`Stock "${stockToDelete?.symbol}" deleted`, 'success');
            } else {
                const mfToDelete = mfHoldings.find(m => m.id === id);
                deleteMFHolding(id);
                addToast(`Mutual fund deleted`, 'success');
            }
            loadInvestments();
            setDeleteConfirm(null);
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Error deleting:', error);
            addToast('Failed to delete investment', 'error');
        }
    };

    // Calculate totals
    const totalStockValue = stocks.reduce((sum, s) => sum + (s.quantity * s.average_price), 0);
    const totalMFValue = mfHoldings.reduce((sum, m) => sum + (m.current_value || m.units * m.average_nav), 0);
    const totalInvestments = totalStockValue + totalMFValue;

    // Calculate invested amounts and P&L
    const totalStockInvested = stocks.reduce((sum, s) => sum + (s.quantity * s.average_price), 0);
    const totalMFInvested = mfHoldings.reduce((sum, m) => sum + (m.units * m.average_nav), 0);
    const totalInvested = totalStockInvested + totalMFInvested;

    // MF gains
    const totalMFGainLoss = mfHoldings.reduce((sum, m) => sum + (m.gain_loss || 0), 0);
    // For stocks, current value = invested value (no live prices yet)
    const totalGainLoss = totalMFGainLoss;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    // Allocation data
    const allocationData = [
        { name: 'Stocks', value: totalStockValue, color: CHART_COLORS.primary[0] },
        { name: 'Mutual Funds', value: totalMFValue, color: CHART_COLORS.primary[1] },
    ].filter(d => d.value > 0);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="loader loader-lg"></div>
                <p>Loading investments...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Investments</h1>
                    <p className={styles.subtitle}>Track your stock and mutual fund portfolio</p>
                </div>
                <div className={styles.headerActions}>
                    <button className="btn btn-secondary" onClick={() => setModalType('stock')}>
                        + Add Stock
                    </button>
                    <button className="btn btn-primary" onClick={() => setModalType('mf')}>
                        + Add Mutual Fund
                    </button>
                </div>
            </div>

            {/* Summary Section */}
            <div className={styles.summarySection}>
                <div className={styles.summaryCards}>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Total Portfolio</span>
                        <span className={styles.summaryValue}>{formatCurrency(totalInvestments)}</span>
                    </div>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Total Invested</span>
                        <span className={styles.summaryValue}>{formatCurrency(totalInvested)}</span>
                    </div>
                    <div className={`${styles.summaryCard} ${styles.summaryCardPL}`}>
                        <span className={styles.summaryLabel}>Total Returns</span>
                        <span className={`${styles.summaryValue} ${totalGainLoss >= 0 ? styles.positive : styles.negative}`}>
                            {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
                        </span>
                        <span className={`${styles.summaryPercent} ${totalGainLoss >= 0 ? styles.positive : styles.negative}`}>
                            {totalGainLossPercent >= 0 ? '↑' : '↓'} {Math.abs(totalGainLossPercent).toFixed(2)}%
                        </span>
                    </div>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Stocks</span>
                        <span className={styles.summaryValue}>{formatCurrency(totalStockValue)}</span>
                        <span className={styles.summarySubtext}>{stocks.length} holdings</span>
                    </div>
                    <div className={styles.summaryCard}>
                        <span className={styles.summaryLabel}>Mutual Funds</span>
                        <span className={styles.summaryValue}>{formatCurrency(totalMFValue)}</span>
                        <span className={styles.summarySubtext}>{mfHoldings.length} schemes</span>
                    </div>
                </div>

                {allocationData.length > 0 && (
                    <div className={styles.allocationChart}>
                        <AllocationChart
                            data={allocationData}
                            title="Portfolio Allocation"
                            innerRadius={50}
                            outerRadius={75}
                        />
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'stocks' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('stocks')}
                >
                    Stocks ({stocks.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'mutual_funds' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('mutual_funds')}
                >
                    Mutual Funds ({mfHoldings.length})
                </button>
            </div>

            {/* Stocks Tab */}
            {activeTab === 'stocks' && (
                <>
                    {stocks.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📈</span>
                            <h3>No stocks yet</h3>
                            <p>Add your stock holdings to track your portfolio</p>
                            <button className="btn btn-primary" onClick={() => setModalType('stock')}>
                                + Add Stock
                            </button>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Symbol</th>
                                        <th>Exchange</th>
                                        <th>Quantity</th>
                                        <th>Avg Price</th>
                                        <th>Current Value</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stocks.map(stock => (
                                        <tr key={stock.id}>
                                            <td className={styles.symbolCell}>{stock.symbol}</td>
                                            <td>
                                                <span className={styles.exchangeBadge}>{stock.exchange}</span>
                                            </td>
                                            <td>{stock.quantity}</td>
                                            <td>{formatCurrency(stock.average_price)}</td>
                                            <td className={styles.valueCell}>
                                                {formatCurrency(stock.quantity * stock.average_price)}
                                            </td>
                                            <td className={styles.actionsCell}>
                                                {deleteConfirm?.type === 'stock' && deleteConfirm.id === stock.id ? (
                                                    <>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete('stock', stock.id)}>
                                                            Confirm
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm({ type: 'stock', id: stock.id })}>
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Mutual Funds Tab */}
            {activeTab === 'mutual_funds' && (
                <>
                    {mfHoldings.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📊</span>
                            <h3>No mutual funds yet</h3>
                            <p>Add your mutual fund investments to track NAV</p>
                            <button className="btn btn-primary" onClick={() => setModalType('mf')}>
                                + Add Mutual Fund
                            </button>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Scheme Name</th>
                                        <th>Units</th>
                                        <th>Avg NAV</th>
                                        <th>Current NAV</th>
                                        <th>Value</th>
                                        <th>Gain/Loss</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mfHoldings.map(mf => (
                                        <tr key={mf.id}>
                                            <td className={styles.schemeNameCell}>
                                                <span className={styles.schemeName}>{mf.scheme_name}</span>
                                                <span className={styles.schemeCode}>Code: {mf.scheme_code}</span>
                                            </td>
                                            <td>{mf.units.toFixed(3)}</td>
                                            <td>₹{mf.average_nav.toFixed(2)}</td>
                                            <td>₹{(mf.current_nav || mf.average_nav).toFixed(2)}</td>
                                            <td className={styles.valueCell}>
                                                {formatCurrency(mf.current_value || mf.units * mf.average_nav)}
                                            </td>
                                            <td className={`${styles.gainLossCell} ${(mf.gain_loss || 0) >= 0 ? styles.positive : styles.negative}`}>
                                                {formatCurrency(mf.gain_loss || 0)}
                                                <span className={styles.gainLossPercent}>
                                                    ({(mf.gain_loss_percent || 0).toFixed(2)}%)
                                                </span>
                                            </td>
                                            <td className={styles.actionsCell}>
                                                {deleteConfirm?.type === 'mf' && deleteConfirm.id === mf.id ? (
                                                    <>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete('mf', mf.id)}>
                                                            Confirm
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm({ type: 'mf', id: mf.id })}>
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Add Stock Modal */}
            <Modal
                isOpen={modalType === 'stock'}
                onClose={() => setModalType(null)}
                title="Add Stock Holding"
            >
                <form onSubmit={handleStockSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Symbol *</label>
                        <input
                            type="text"
                            value={stockForm.symbol}
                            onChange={(e) => setStockForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                            className="input"
                            placeholder="e.g., RELIANCE"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Exchange *</label>
                        <select
                            value={stockForm.exchange}
                            onChange={(e) => setStockForm(prev => ({ ...prev, exchange: e.target.value as 'NSE' | 'BSE' }))}
                            className="select"
                        >
                            <option value="NSE">NSE</option>
                            <option value="BSE">BSE</option>
                        </select>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Quantity *</label>
                            <input
                                type="number"
                                value={stockForm.quantity || ''}
                                onChange={(e) => setStockForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                className="input"
                                placeholder="0"
                                min="0.0001"
                                step="0.0001"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Avg Price (₹) *</label>
                            <input
                                type="number"
                                value={stockForm.average_price || ''}
                                onChange={(e) => setStockForm(prev => ({ ...prev, average_price: parseFloat(e.target.value) || 0 }))}
                                className="input"
                                placeholder="0"
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Add Stock
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Add Mutual Fund Modal */}
            <Modal
                isOpen={modalType === 'mf'}
                onClose={() => setModalType(null)}
                title="Add Mutual Fund"
                size="lg"
            >
                <form onSubmit={handleMFSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Search Scheme *</label>
                        <div className={styles.searchContainer}>
                            <input
                                type="text"
                                value={mfSearchQuery}
                                onChange={(e) => setMfSearchQuery(e.target.value)}
                                className="input"
                                placeholder="Search by scheme name..."
                            />
                            {mfSearching && <span className={styles.searchingIndicator}>Searching...</span>}

                            {mfSearchResults.length > 0 && (
                                <div className={styles.searchResults}>
                                    {mfSearchResults.map(scheme => (
                                        <button
                                            key={scheme.schemeCode}
                                            type="button"
                                            className={styles.searchResultItem}
                                            onClick={() => handleSelectMF(scheme)}
                                        >
                                            <span className={styles.schemeName}>{scheme.schemeName}</span>
                                            <span className={styles.schemeCode}>Code: {scheme.schemeCode}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {mfForm.scheme_code && (
                            <p className={styles.selectedScheme}>
                                Selected: <strong>{mfForm.scheme_name}</strong> (Code: {mfForm.scheme_code})
                            </p>
                        )}
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Units *</label>
                            <input
                                type="number"
                                value={mfForm.units || ''}
                                onChange={(e) => setMfForm(prev => ({ ...prev, units: parseFloat(e.target.value) || 0 }))}
                                className="input"
                                placeholder="0"
                                min="0.001"
                                step="0.001"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Avg NAV (₹) *</label>
                            <input
                                type="number"
                                value={mfForm.average_nav || ''}
                                onChange={(e) => setMfForm(prev => ({ ...prev, average_nav: parseFloat(e.target.value) || 0 }))}
                                className="input"
                                placeholder="0"
                                min="0.0001"
                                step="0.0001"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalType(null)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={!mfForm.scheme_code}>
                            Add Mutual Fund
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
