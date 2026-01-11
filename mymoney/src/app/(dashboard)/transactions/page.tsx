'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import AllocationChart from '@/components/charts/AllocationChart';
import styles from './page.module.css';
import {
    fetchTransactions,
    createTransactionAPI,
    updateTransactionAPI,
    deleteTransactionAPI,
} from '@/lib/api';
import { formatCurrency, formatDate, TRANSACTION_CATEGORY_LABELS, CHART_COLORS } from '@/lib/utils';

type TabType = 'all' | 'income' | 'expense';
type ModalType = 'add' | 'edit' | null;

interface Transaction {
    _id: string;
    type: 'income' | 'expense' | 'transfer';
    category: string;
    amount: number;
    description: string;
    date: string;
    account?: string;
    tags?: string[];
}

interface TransactionFormData {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description: string;
    date: string;
    account?: string;
}

const INCOME_CATEGORIES = [
    'salary', 'business', 'investment_income', 'rental', 'freelance', 'bonus', 'gift_received', 'refund', 'other_income'
];

const EXPENSE_CATEGORIES = [
    'food', 'groceries', 'transportation', 'utilities', 'rent', 'entertainment', 'shopping',
    'healthcare', 'education', 'travel', 'insurance', 'emi', 'subscriptions', 'personal_care',
    'household', 'gifts', 'charity', 'investment', 'other_expense'
];

const PAYMENT_METHODS = [
    'Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Other'
];

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [modalType, setModalType] = useState<ModalType>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const { addToast } = useToast();

    // Form state
    const [formData, setFormData] = useState<TransactionFormData>({
        type: 'expense',
        category: 'food',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        account: 'UPI',
    });

    const loadTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-').map(Number);
            const startDate = new Date(year, month - 1, 1).toISOString();
            const endDate = new Date(year, month, 0).toISOString();

            const data = await fetchTransactions({ startDate, endDate, limit: 200 });
            // Sort by date descending
            data.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTransactions(data);
        } catch (error) {
            console.error('Error loading transactions:', error);
            addToast('Failed to load transactions', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, addToast]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    // Calculate monthly summary from loaded transactions
    const monthlySummary = {
        income: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        get net() { return this.income - this.expense; },
        transactionCount: transactions.length,
        categoryBreakdown: transactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>),
    };

    const handleOpenAdd = (type: 'income' | 'expense' = 'expense') => {
        setFormData({
            type,
            category: type === 'income' ? 'salary' : 'food',
            amount: 0,
            description: '',
            date: new Date().toISOString().split('T')[0],
            account: 'UPI',
        });
        setEditingTransaction(null);
        setModalType('add');
    };

    const handleOpenEdit = (transaction: Transaction) => {
        setFormData({
            type: transaction.type as 'income' | 'expense',
            category: transaction.category,
            amount: transaction.amount,
            description: transaction.description,
            date: transaction.date.split('T')[0],
            account: transaction.account || 'Other',
        });
        setEditingTransaction(transaction);
        setModalType('edit');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.amount <= 0) {
            addToast('Amount must be greater than 0', 'error');
            return;
        }

        if (!formData.description.trim()) {
            addToast('Description is required', 'error');
            return;
        }

        try {
            setSaving(true);
            if (modalType === 'edit' && editingTransaction) {
                await updateTransactionAPI(editingTransaction._id, { ...formData });
                addToast('Transaction updated successfully', 'success');
            } else {
                await createTransactionAPI(formData);
                addToast('Transaction added successfully', 'success');
            }
            setModalType(null);
            await loadTransactions();
        } catch (error) {
            console.error('Error saving transaction:', error);
            addToast('Failed to save transaction', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        try {
            await deleteTransactionAPI(id);
            addToast('Transaction deleted', 'success');
            await loadTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            addToast('Failed to delete transaction', 'error');
        }
    };

    // Filter transactions
    const filteredTransactions = transactions.filter(t => {
        // Tab filter
        if (activeTab !== 'all' && t.type !== activeTab) return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                t.description.toLowerCase().includes(query) ||
                (TRANSACTION_CATEGORY_LABELS[t.category] || t.category)?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    // Category breakdown for chart
    const categoryChartData = Object.entries(monthlySummary.categoryBreakdown)
        .filter(([, value]) => value > 0)
        .map(([category, value], index) => ({
            name: TRANSACTION_CATEGORY_LABELS[category] || category,
            value,
            color: CHART_COLORS.primary[index % CHART_COLORS.primary.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="loader loader-lg"></div>
                <p>Loading transactions...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Transactions</h1>
                    <p className={styles.subtitle}>Track your income and expenses</p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        onClick={() => handleOpenAdd('income')}
                        className={styles.addIncomeButton}
                    >
                        <span>+</span> Add Income
                    </button>
                    <button
                        onClick={() => handleOpenAdd('expense')}
                        className={styles.addExpenseButton}
                    >
                        <span>+</span> Add Expense
                    </button>
                </div>
            </div>

            {/* Monthly Summary Cards */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon} style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                        ↑
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>Income</span>
                        <span className={styles.summaryValue} style={{ color: '#22c55e' }}>
                            {formatCurrency(monthlySummary.income)}
                        </span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        ↓
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>Expense</span>
                        <span className={styles.summaryValue} style={{ color: '#ef4444' }}>
                            {formatCurrency(monthlySummary.expense)}
                        </span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon} style={{
                        backgroundColor: monthlySummary.net >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: monthlySummary.net >= 0 ? '#22c55e' : '#ef4444'
                    }}>
                        {monthlySummary.net >= 0 ? '↗' : '↘'}
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>Net Savings</span>
                        <span className={styles.summaryValue} style={{
                            color: monthlySummary.net >= 0 ? '#22c55e' : '#ef4444'
                        }}>
                            {formatCurrency(monthlySummary.net)}
                        </span>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon} style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                        #
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>Transactions</span>
                        <span className={styles.summaryValue}>
                            {monthlySummary.transactionCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className={styles.contentGrid}>
                {/* Transactions List */}
                <div className={styles.transactionsPanel}>
                    {/* Filters */}
                    <div className={styles.filters}>
                        <div className={styles.tabs}>
                            {(['all', 'income', 'expense'] as TabType[]).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className={styles.searchAndMonth}>
                            <input
                                type="search"
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className={styles.monthPicker}
                            />
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className={styles.transactionList}>
                        {filteredTransactions.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No transactions found</p>
                                <button onClick={() => handleOpenAdd()} className={styles.addButton}>
                                    Add your first transaction
                                </button>
                            </div>
                        ) : (
                            filteredTransactions.map(transaction => (
                                <div key={transaction._id} className={styles.transactionItem}>
                                    <div className={styles.transactionLeft}>
                                        <div className={`${styles.transactionIcon} ${transaction.type === 'income' ? styles.income : styles.expense}`}>
                                            {transaction.type === 'income' ? '↑' : '↓'}
                                        </div>
                                        <div className={styles.transactionInfo}>
                                            <span className={styles.transactionDesc}>{transaction.description}</span>
                                            <span className={styles.transactionMeta}>
                                                {TRANSACTION_CATEGORY_LABELS[transaction.category] || transaction.category} • {formatDate(transaction.date, 'short')}
                                                {transaction.account && ` • ${transaction.account}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.transactionRight}>
                                        <span className={`${styles.transactionAmount} ${transaction.type === 'income' ? styles.income : styles.expense}`}>
                                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                        </span>
                                        <div className={styles.transactionActions}>
                                            <button onClick={() => handleOpenEdit(transaction)} className={styles.editBtn}>
                                                ✏️
                                            </button>
                                            <button onClick={() => handleDelete(transaction._id)} className={styles.deleteBtn}>
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Category Breakdown Chart */}
                {categoryChartData.length > 0 && (
                    <div className={styles.chartPanel}>
                        <AllocationChart
                            data={categoryChartData}
                            title="Spending by Category"
                        />
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalType !== null}
                onClose={() => setModalType(null)}
                title={modalType === 'edit' ? 'Edit Transaction' : 'Add Transaction'}
            >
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Type Toggle */}
                    <div className={styles.typeToggle}>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: 'salary' }))}
                            className={`${styles.typeButton} ${formData.type === 'income' ? styles.active : ''}`}
                        >
                            Income
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: 'food' }))}
                            className={`${styles.typeButton} ${formData.type === 'expense' ? styles.active : ''}`}
                        >
                            Expense
                        </button>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Amount *</label>
                        <input
                            type="number"
                            value={formData.amount || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Description *</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="What was this for?"
                            required
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Category *</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                required
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {TRANSACTION_CATEGORY_LABELS[cat] || cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Date *</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Payment Method</label>
                        <select
                            value={formData.account || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, account: e.target.value }))}
                        >
                            <option value="">Select method</option>
                            {PAYMENT_METHODS.map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" onClick={() => setModalType(null)} className={styles.cancelButton}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitButton} disabled={saving}>
                            {saving ? 'Saving...' : (modalType === 'edit' ? 'Update' : 'Add')} Transaction
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
