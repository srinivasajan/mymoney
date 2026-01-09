'use client';

import { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import styles from '../assets/page.module.css';
import {
    getLiabilities,
    createLiability,
    updateLiability,
    deleteLiability
} from '@/lib/storage';
import {
    formatCurrency,
    formatDate,
    LIABILITY_CATEGORY_LABELS
} from '@/lib/utils';
import type { Liability, LiabilityCategory, LiabilityFormData } from '@/lib/types';

const LIABILITY_CATEGORIES: { value: LiabilityCategory; label: string }[] = [
    { value: 'home_loan', label: 'Home Loan' },
    { value: 'car_loan', label: 'Car Loan' },
    { value: 'personal_loan', label: 'Personal Loan' },
    { value: 'education_loan', label: 'Education Loan' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'other', label: 'Other' },
];

// EMI Calculator: P × r × (1 + r)^n / ((1 + r)^n - 1)
const calculateEMI = (principal: number, annualRate: number, tenureMonths: number): number => {
    if (principal <= 0 || annualRate <= 0 || tenureMonths <= 0) return 0;
    const monthlyRate = annualRate / 12 / 100;
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi);
};

const INITIAL_FORM: LiabilityFormData = {
    category: 'personal_loan',
    name: '',
    institution: '',
    principal_amount: 0,
    outstanding_amount: 0,
    interest_rate: undefined,
    emi_amount: undefined,
    start_date: '',
    end_date: '',
    notes: '',
};

export default function LiabilitiesPage() {
    const [liabilities, setLiabilities] = useState<Liability[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
    const [formData, setFormData] = useState<LiabilityFormData>(INITIAL_FORM);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [tenureMonths, setTenureMonths] = useState<number | undefined>(undefined);
    const { addToast } = useToast();

    useEffect(() => {
        loadLiabilities();
    }, []);

    const loadLiabilities = () => {
        try {
            const data = getLiabilities();
            setLiabilities(data);
        } catch (error) {
            console.error('Error loading liabilities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (liability?: Liability) => {
        if (liability) {
            setEditingLiability(liability);
            setFormData({
                category: liability.category,
                name: liability.name,
                institution: liability.institution || '',
                principal_amount: liability.principal_amount,
                outstanding_amount: liability.outstanding_amount,
                interest_rate: liability.interest_rate || undefined,
                emi_amount: liability.emi_amount || undefined,
                start_date: liability.start_date || '',
                end_date: liability.end_date || '',
                notes: liability.notes || '',
            });
        } else {
            setEditingLiability(null);
            setFormData(INITIAL_FORM);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLiability(null);
        setFormData(INITIAL_FORM);
        setTenureMonths(undefined);
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || formData.principal_amount <= 0 || formData.outstanding_amount < 0) {
            addToast('Please fill in all required fields', 'warning');
            return;
        }

        try {
            if (editingLiability) {
                updateLiability(editingLiability.id, formData);
                addToast(`Liability "${formData.name}" updated successfully`, 'success');
            } else {
                createLiability(formData);
                addToast(`Liability "${formData.name}" added successfully`, 'success');
            }
            loadLiabilities();
            handleCloseModal();
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Error saving liability:', error);
            addToast('Failed to save liability', 'error');
        }
    };

    const handleDelete = (id: string) => {
        const liabilityToDelete = liabilities.find(l => l.id === id);
        try {
            deleteLiability(id);
            loadLiabilities();
            setDeleteConfirm(null);
            window.dispatchEvent(new Event('storage'));
            addToast(`Liability "${liabilityToDelete?.name}" deleted`, 'success');
        } catch (error) {
            console.error('Error deleting liability:', error);
            addToast('Failed to delete liability', 'error');
        }
    };

    const totalOutstanding = liabilities.reduce((sum, l) => sum + l.outstanding_amount, 0);
    const totalEMI = liabilities.reduce((sum, l) => sum + (l.emi_amount || 0), 0);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="loader loader-lg"></div>
                <p>Loading liabilities...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Liabilities</h1>
                    <p className={styles.subtitle}>Track your loans and debts</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    + Add Liability
                </button>
            </div>

            {/* Summary Card */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Total Outstanding</span>
                    <span className={styles.summaryValue} style={{ color: 'var(--color-accent-red)' }}>
                        {formatCurrency(totalOutstanding)}
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Monthly EMI</span>
                    <span className={styles.summaryValue} style={{ color: 'var(--color-text-primary)' }}>
                        {formatCurrency(totalEMI)}
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Number of Liabilities</span>
                    <span className={styles.summaryValue} style={{ color: 'var(--color-text-primary)' }}>
                        {liabilities.length}
                    </span>
                </div>
            </div>

            {/* Liabilities Table */}
            {liabilities.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>💳</span>
                    <h3>No liabilities yet</h3>
                    <p>Add your loans and debts to track them</p>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        + Add Liability
                    </button>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Institution</th>
                                <th>Outstanding</th>
                                <th>EMI</th>
                                <th>Interest</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liabilities.map(liability => (
                                <tr key={liability.id}>
                                    <td className={styles.nameCell}>
                                        <span className={styles.assetName}>{liability.name}</span>
                                        {liability.notes && (
                                            <span className={styles.assetNotes}>{liability.notes}</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.categoryBadge} style={{
                                            background: 'var(--color-accent-red-muted)',
                                            color: 'var(--color-accent-red)'
                                        }}>
                                            {LIABILITY_CATEGORY_LABELS[liability.category]}
                                        </span>
                                    </td>
                                    <td className={styles.institutionCell}>
                                        {liability.institution || '-'}
                                    </td>
                                    <td className={styles.valueCell} style={{ color: 'var(--color-accent-red)' }}>
                                        {formatCurrency(liability.outstanding_amount)}
                                    </td>
                                    <td>
                                        {liability.emi_amount ? formatCurrency(liability.emi_amount) : '-'}
                                    </td>
                                    <td>
                                        {liability.interest_rate ? `${liability.interest_rate}%` : '-'}
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleOpenModal(liability)}
                                        >
                                            Edit
                                        </button>
                                        {deleteConfirm === liability.id ? (
                                            <>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(liability.id)}
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => setDeleteConfirm(null)}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setDeleteConfirm(liability.id)}
                                            >
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

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingLiability ? 'Edit Liability' : 'Add New Liability'}
                size="md"
            >
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="select"
                                required
                            >
                                {LIABILITY_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="e.g., Home Loan"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Institution</label>
                            <input
                                type="text"
                                name="institution"
                                value={formData.institution}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="e.g., SBI Home Loans"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Principal Amount (₹) *</label>
                            <input
                                type="number"
                                name="principal_amount"
                                value={formData.principal_amount || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Outstanding Amount (₹) *</label>
                            <input
                                type="number"
                                name="outstanding_amount"
                                value={formData.outstanding_amount || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Interest Rate (% per annum)</label>
                            <input
                                type="number"
                                name="interest_rate"
                                value={formData.interest_rate || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="e.g., 8.5"
                                min="0"
                                max="50"
                                step="0.01"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Loan Tenure (months)</label>
                            <input
                                type="number"
                                value={tenureMonths || ''}
                                onChange={(e) => setTenureMonths(e.target.value ? parseInt(e.target.value) : undefined)}
                                className="input"
                                placeholder="e.g., 240 for 20 years"
                                min="1"
                                max="600"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Monthly EMI (₹)</label>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                                <input
                                    type="number"
                                    name="emi_amount"
                                    value={formData.emi_amount || ''}
                                    onChange={handleInputChange}
                                    className="input"
                                    placeholder="0"
                                    min="0"
                                    step="1"
                                    style={{ flex: 1 }}
                                />
                                {formData.outstanding_amount && formData.interest_rate && tenureMonths && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => {
                                            const calculatedEMI = calculateEMI(
                                                formData.outstanding_amount,
                                                formData.interest_rate!,
                                                tenureMonths
                                            );
                                            setFormData(prev => ({ ...prev, emi_amount: calculatedEMI }));
                                            addToast(`EMI calculated: ${formatCurrency(calculatedEMI)}`, 'success');
                                        }}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        Calculate
                                    </button>
                                )}
                            </div>
                            {formData.outstanding_amount && formData.interest_rate && tenureMonths && (
                                <div style={{
                                    marginTop: 'var(--spacing-xs)',
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    Suggested EMI: {formatCurrency(calculateEMI(formData.outstanding_amount, formData.interest_rate, tenureMonths))}
                                    {' · '}Total Interest: {formatCurrency((calculateEMI(formData.outstanding_amount, formData.interest_rate, tenureMonths) * tenureMonths) - formData.outstanding_amount)}
                                </div>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Start Date</label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleInputChange}
                                className="input"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>End Date</label>
                            <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleInputChange}
                                className="input"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            className="input"
                            rows={3}
                            placeholder="Any additional notes..."
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingLiability ? 'Save Changes' : 'Add Liability'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
