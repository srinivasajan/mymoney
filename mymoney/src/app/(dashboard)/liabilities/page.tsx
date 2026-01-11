'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import styles from '../assets/page.module.css';
import {
    fetchLiabilities,
    createLiabilityAPI,
    updateLiabilityAPI,
    deleteLiabilityAPI
} from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Liability {
    _id: string;
    name: string;
    type: string;
    principal: number;
    currentBalance: number;
    interestRate: number;
    emi?: number;
    institution?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

interface LiabilityFormData {
    name: string;
    type: string;
    principal: number;
    currentBalance: number;
    interestRate: number;
    emi: number;
    institution: string;
    notes: string;
}

const LIABILITY_CATEGORIES: { value: string; label: string }[] = [
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
    type: 'personal_loan',
    name: '',
    principal: 0,
    currentBalance: 0,
    interestRate: 0,
    emi: 0,
    institution: '',
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
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadLiabilities();
    }, []);

    const loadLiabilities = async () => {
        try {
            setLoading(true);
            const data = await fetchLiabilities();
            setLiabilities(data);
        } catch (error) {
            console.error('Error loading liabilities:', error);
            addToast('Failed to load liabilities', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (liability?: Liability) => {
        if (liability) {
            setEditingLiability(liability);
            setFormData({
                type: liability.type,
                name: liability.name,
                principal: liability.principal,
                currentBalance: liability.currentBalance,
                interestRate: liability.interestRate,
                emi: liability.emi || 0,
                institution: liability.institution || '',
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
            [name]: type === 'number' ? (value ? parseFloat(value) : 0) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || formData.principal <= 0 || formData.currentBalance < 0) {
            addToast('Please fill in all required fields', 'warning');
            return;
        }

        try {
            setSaving(true);
            if (editingLiability) {
                await updateLiabilityAPI(editingLiability._id, { ...formData });
                addToast(`Liability "${formData.name}" updated successfully`, 'success');
            } else {
                await createLiabilityAPI(formData);
                addToast(`Liability "${formData.name}" added successfully`, 'success');
            }
            await loadLiabilities();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving liability:', error);
            addToast('Failed to save liability', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const liabilityToDelete = liabilities.find(l => l._id === id);
        try {
            await deleteLiabilityAPI(id);
            await loadLiabilities();
            setDeleteConfirm(null);
            addToast(`Liability "${liabilityToDelete?.name}" deleted`, 'success');
        } catch (error) {
            console.error('Error deleting liability:', error);
            addToast('Failed to delete liability', 'error');
        }
    };

    const totalOutstanding = liabilities.reduce((sum, l) => sum + l.currentBalance, 0);
    const totalEMI = liabilities.reduce((sum, l) => sum + (l.emi || 0), 0);

    const getCategoryLabel = (type: string) => {
        const cat = LIABILITY_CATEGORIES.find(c => c.value === type);
        return cat?.label || type;
    };

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
                                <tr key={liability._id}>
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
                                            {getCategoryLabel(liability.type)}
                                        </span>
                                    </td>
                                    <td className={styles.institutionCell}>
                                        {liability.institution || '-'}
                                    </td>
                                    <td className={styles.valueCell} style={{ color: 'var(--color-accent-red)' }}>
                                        {formatCurrency(liability.currentBalance)}
                                    </td>
                                    <td>
                                        {liability.emi ? formatCurrency(liability.emi) : '-'}
                                    </td>
                                    <td>
                                        {liability.interestRate ? `${liability.interestRate}%` : '-'}
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleOpenModal(liability)}
                                        >
                                            Edit
                                        </button>
                                        {deleteConfirm === liability._id ? (
                                            <>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(liability._id)}
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
                                                onClick={() => setDeleteConfirm(liability._id)}
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
                                name="type"
                                value={formData.type}
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
                                name="principal"
                                value={formData.principal || ''}
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
                                name="currentBalance"
                                value={formData.currentBalance || ''}
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
                                name="interestRate"
                                value={formData.interestRate || ''}
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
                                    name="emi"
                                    value={formData.emi || ''}
                                    onChange={handleInputChange}
                                    className="input"
                                    placeholder="0"
                                    min="0"
                                    step="1"
                                    style={{ flex: 1 }}
                                />
                                {formData.currentBalance && formData.interestRate && tenureMonths && (
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => {
                                            const calculatedEMI = calculateEMI(
                                                formData.currentBalance,
                                                formData.interestRate,
                                                tenureMonths
                                            );
                                            setFormData(prev => ({ ...prev, emi: calculatedEMI }));
                                            addToast(`EMI calculated: ${formatCurrency(calculatedEMI)}`, 'success');
                                        }}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        Calculate
                                    </button>
                                )}
                            </div>
                            {formData.currentBalance && formData.interestRate && tenureMonths && (
                                <div style={{
                                    marginTop: 'var(--spacing-xs)',
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    Suggested EMI: {formatCurrency(calculateEMI(formData.currentBalance, formData.interestRate, tenureMonths))}
                                    {' · '}Total Interest: {formatCurrency((calculateEMI(formData.currentBalance, formData.interestRate, tenureMonths) * tenureMonths) - formData.currentBalance)}
                                </div>
                            )}
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
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : (editingLiability ? 'Save Changes' : 'Add Liability')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
