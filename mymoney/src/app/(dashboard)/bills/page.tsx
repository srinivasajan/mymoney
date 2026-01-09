'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import styles from './page.module.css';
import { formatCurrency } from '@/lib/utils';

interface Bill {
    id: string;
    name: string;
    amount: number;
    frequency: 'monthly' | 'quarterly' | 'yearly' | 'once';
    dueDay: number;
    category: 'utility' | 'subscription' | 'insurance' | 'loan' | 'rent' | 'other';
    autoPay: boolean;
    isPaid: boolean;
    lastPaidDate?: string;
    notes?: string;
}

const CATEGORY_CONFIG = {
    utility: { icon: '💡', label: 'Utility', color: '#3b82f6' },
    subscription: { icon: '📱', label: 'Subscription', color: '#a855f7' },
    insurance: { icon: '🛡️', label: 'Insurance', color: '#22c55e' },
    loan: { icon: '🏦', label: 'Loan/EMI', color: '#f59e0b' },
    rent: { icon: '🏠', label: 'Rent', color: '#06b6d4' },
    other: { icon: '📄', label: 'Other', color: '#64748b' },
};

const STORAGE_KEY = 'mymoney_bills';

const INITIAL_BILL: Omit<Bill, 'id'> = {
    name: '',
    amount: 0,
    frequency: 'monthly',
    dueDay: 1,
    category: 'utility',
    autoPay: false,
    isPaid: false,
};

export default function BillsPage() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [formData, setFormData] = useState<Omit<Bill, 'id'>>(INITIAL_BILL);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const { addToast } = useToast();

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setBills(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse bills');
            }
        }
    }, []);

    const saveBills = (updatedBills: Bill[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBills));
        setBills(updatedBills);
    };

    const handleOpenModal = (bill?: Bill) => {
        if (bill) {
            setEditingBill(bill);
            setFormData({
                name: bill.name,
                amount: bill.amount,
                frequency: bill.frequency,
                dueDay: bill.dueDay,
                category: bill.category,
                autoPay: bill.autoPay,
                isPaid: bill.isPaid,
                notes: bill.notes,
            });
        } else {
            setEditingBill(null);
            setFormData(INITIAL_BILL);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBill(null);
        setFormData(INITIAL_BILL);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingBill) {
            const updated = bills.map(b =>
                b.id === editingBill.id ? { ...editingBill, ...formData } : b
            );
            saveBills(updated);
            addToast('Bill updated successfully', 'success');
        } else {
            const newBill: Bill = {
                id: `bill_${Date.now()}`,
                ...formData,
            };
            saveBills([...bills, newBill]);
            addToast('Bill added successfully', 'success');
        }

        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this bill?')) {
            saveBills(bills.filter(b => b.id !== id));
            addToast('Bill deleted', 'info');
        }
    };

    const togglePaid = (id: string) => {
        const bill = bills.find(b => b.id === id);
        const updated = bills.map(b =>
            b.id === id ? {
                ...b,
                isPaid: !b.isPaid,
                lastPaidDate: !b.isPaid ? new Date().toISOString().split('T')[0] : b.lastPaidDate
            } : b
        );
        saveBills(updated);
        addToast(bill?.isPaid ? 'Marked as unpaid' : 'Marked as paid ✓', 'success');
    };

    // Calculations
    const today = new Date();
    const currentDay = today.getDate();

    const getAnnualCost = (bill: Bill) => {
        switch (bill.frequency) {
            case 'monthly': return bill.amount * 12;
            case 'quarterly': return bill.amount * 4;
            case 'yearly': return bill.amount;
            case 'once': return bill.amount;
        }
    };

    const getMonthlyCost = (bill: Bill) => {
        switch (bill.frequency) {
            case 'monthly': return bill.amount;
            case 'quarterly': return bill.amount / 3;
            case 'yearly': return bill.amount / 12;
            case 'once': return 0;
        }
    };

    const getDaysUntilDue = (dueDay: number) => {
        if (dueDay >= currentDay) {
            return dueDay - currentDay;
        }
        // Next month
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        return daysInMonth - currentDay + dueDay;
    };

    const totalMonthly = bills.reduce((sum, b) => sum + getMonthlyCost(b), 0);
    const totalAnnual = bills.reduce((sum, b) => sum + getAnnualCost(b), 0);
    const upcomingBills = bills
        .filter(b => !b.isPaid && b.frequency !== 'once')
        .sort((a, b) => getDaysUntilDue(a.dueDay) - getDaysUntilDue(b.dueDay));
    const paidThisMonth = bills.filter(b => b.isPaid).length;

    const filteredBills = filterCategory === 'all'
        ? bills
        : bills.filter(b => b.category === filterCategory);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Bills & Subscriptions</h1>
                    <p className={styles.subtitle}>Track recurring payments and never miss a due date</p>
                </div>
                <button className={styles.addButton} onClick={() => handleOpenModal()}>
                    + Add Bill
                </button>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>📅</div>
                    <div className={styles.summaryContent}>
                        <div className={styles.summaryLabel}>Monthly Cost</div>
                        <div className={styles.summaryValue}>{formatCurrency(totalMonthly)}</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>📊</div>
                    <div className={styles.summaryContent}>
                        <div className={styles.summaryLabel}>Annual Cost</div>
                        <div className={styles.summaryValue}>{formatCurrency(totalAnnual)}</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>🔔</div>
                    <div className={styles.summaryContent}>
                        <div className={styles.summaryLabel}>Upcoming</div>
                        <div className={styles.summaryValue}>{upcomingBills.length} bills</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryIcon}>✅</div>
                    <div className={styles.summaryContent}>
                        <div className={styles.summaryLabel}>Paid This Month</div>
                        <div className={styles.summaryValue}>{paidThisMonth} / {bills.length}</div>
                    </div>
                </div>
            </div>

            {/* Upcoming Bills */}
            {upcomingBills.length > 0 && (
                <div className={styles.upcomingSection}>
                    <h2 className={styles.sectionTitle}>🔔 Upcoming Due Dates</h2>
                    <div className={styles.upcomingList}>
                        {upcomingBills.slice(0, 5).map(bill => {
                            const daysUntil = getDaysUntilDue(bill.dueDay);
                            const isUrgent = daysUntil <= 3;
                            return (
                                <div
                                    key={bill.id}
                                    className={`${styles.upcomingCard} ${isUrgent ? styles.upcomingUrgent : ''}`}
                                >
                                    <div className={styles.upcomingIcon}>
                                        {CATEGORY_CONFIG[bill.category].icon}
                                    </div>
                                    <div className={styles.upcomingInfo}>
                                        <div className={styles.upcomingName}>{bill.name}</div>
                                        <div className={styles.upcomingDue}>
                                            Due in {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
                                        </div>
                                    </div>
                                    <div className={styles.upcomingAmount}>
                                        {formatCurrency(bill.amount)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className={styles.filterBar}>
                <button
                    className={`${styles.filterButton} ${filterCategory === 'all' ? styles.filterActive : ''}`}
                    onClick={() => setFilterCategory('all')}
                >
                    All
                </button>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <button
                        key={key}
                        className={`${styles.filterButton} ${filterCategory === key ? styles.filterActive : ''}`}
                        onClick={() => setFilterCategory(key)}
                    >
                        {config.icon} {config.label}
                    </button>
                ))}
            </div>

            {/* Bills List */}
            <div className={styles.billsGrid}>
                {filteredBills.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📭</span>
                        <p>No bills found. Add your first bill to start tracking!</p>
                    </div>
                ) : (
                    filteredBills.map(bill => (
                        <div
                            key={bill.id}
                            className={`${styles.billCard} ${bill.isPaid ? styles.billPaid : ''}`}
                        >
                            <div className={styles.billHeader}>
                                <div
                                    className={styles.billIcon}
                                    style={{ backgroundColor: `${CATEGORY_CONFIG[bill.category].color}20` }}
                                >
                                    {CATEGORY_CONFIG[bill.category].icon}
                                </div>
                                <div className={styles.billMeta}>
                                    <span className={styles.billName}>{bill.name}</span>
                                    <span className={styles.billCategory}>
                                        {CATEGORY_CONFIG[bill.category].label}
                                    </span>
                                </div>
                                {bill.autoPay && (
                                    <span className={styles.autoPayBadge}>Auto-pay</span>
                                )}
                            </div>

                            <div className={styles.billAmount}>
                                {formatCurrency(bill.amount)}
                                <span className={styles.billFrequency}>/{bill.frequency}</span>
                            </div>

                            <div className={styles.billDetails}>
                                <span>Due: {bill.dueDay}{bill.dueDay === 1 ? 'st' : bill.dueDay === 2 ? 'nd' : bill.dueDay === 3 ? 'rd' : 'th'} of month</span>
                                {bill.lastPaidDate && (
                                    <span>Last paid: {bill.lastPaidDate}</span>
                                )}
                            </div>

                            <div className={styles.billActions}>
                                <button
                                    className={`${styles.paidButton} ${bill.isPaid ? styles.paidButtonActive : ''}`}
                                    onClick={() => togglePaid(bill.id)}
                                >
                                    {bill.isPaid ? '✓ Paid' : 'Mark Paid'}
                                </button>
                                <button
                                    className={styles.editButton}
                                    onClick={() => handleOpenModal(bill)}
                                >
                                    Edit
                                </button>
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDelete(bill.id)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingBill ? 'Edit Bill' : 'Add New Bill'}
            >
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Bill Name</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Netflix, Electricity"
                            required
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Amount (₹)</label>
                            <input
                                type="number"
                                className={styles.formInput}
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Frequency</label>
                            <select
                                className={styles.formSelect}
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Bill['frequency'] })}
                            >
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="yearly">Yearly</option>
                                <option value="once">One-time</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Due Day</label>
                            <input
                                type="number"
                                className={styles.formInput}
                                value={formData.dueDay}
                                onChange={(e) => setFormData({ ...formData, dueDay: Number(e.target.value) })}
                                min="1"
                                max="31"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Category</label>
                            <select
                                className={styles.formSelect}
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as Bill['category'] })}
                            >
                                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>
                                        {config.icon} {config.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.autoPay}
                                onChange={(e) => setFormData({ ...formData, autoPay: e.target.checked })}
                            />
                            <span>Auto-pay enabled</span>
                        </label>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Notes (optional)</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any additional notes..."
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className={styles.cancelButton} onClick={handleCloseModal}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitButton}>
                            {editingBill ? 'Save Changes' : 'Add Bill'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
