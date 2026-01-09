'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import styles from './page.module.css';
import {
    getAssets,
    createAsset,
    updateAsset,
    deleteAsset
} from '@/lib/storage';
import {
    formatCurrency,
    formatDate,
    ASSET_CATEGORY_LABELS
} from '@/lib/utils';
import type { Asset, AssetCategory, AssetFormData } from '@/lib/types';

const ASSET_CATEGORIES: { value: AssetCategory; label: string }[] = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_account', label: 'Bank Account' },
    { value: 'fixed_deposit', label: 'Fixed Deposit' },
    { value: 'gold', label: 'Gold' },
    { value: 'property', label: 'Property' },
    { value: 'other', label: 'Other' },
];

const INITIAL_FORM: AssetFormData = {
    category: 'bank_account',
    name: '',
    institution: '',
    current_value: 0,
    purchase_value: undefined,
    purchase_date: '',
    maturity_date: '',
    interest_rate: undefined,
    notes: '',
};

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [formData, setFormData] = useState<AssetFormData>(INITIAL_FORM);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = () => {
        try {
            const data = getAssets();
            setAssets(data);
        } catch (error) {
            console.error('Error loading assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (asset?: Asset) => {
        if (asset) {
            setEditingAsset(asset);
            setFormData({
                category: asset.category,
                name: asset.name,
                institution: asset.institution || '',
                current_value: asset.current_value,
                purchase_value: asset.purchase_value || undefined,
                purchase_date: asset.purchase_date || '',
                maturity_date: asset.maturity_date || '',
                interest_rate: asset.interest_rate || undefined,
                notes: asset.notes || '',
            });
        } else {
            setEditingAsset(null);
            setFormData(INITIAL_FORM);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAsset(null);
        setFormData(INITIAL_FORM);
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

        if (!formData.name || formData.current_value <= 0) {
            addToast('Please fill in all required fields', 'warning');
            return;
        }

        try {
            if (editingAsset) {
                updateAsset(editingAsset.id, formData);
                addToast(`Asset "${formData.name}" updated successfully`, 'success');
            } else {
                createAsset(formData);
                addToast(`Asset "${formData.name}" added successfully`, 'success');
            }
            loadAssets();
            handleCloseModal();

            // Trigger storage event for header update
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Error saving asset:', error);
            addToast('Failed to save asset', 'error');
        }
    };

    const handleDelete = (id: string) => {
        const assetToDelete = assets.find(a => a.id === id);
        try {
            deleteAsset(id);
            loadAssets();
            setDeleteConfirm(null);
            window.dispatchEvent(new Event('storage'));
            addToast(`Asset "${assetToDelete?.name}" deleted`, 'success');
        } catch (error) {
            console.error('Error deleting asset:', error);
            addToast('Failed to delete asset', 'error');
        }
    };

    const totalValue = assets.reduce((sum, a) => sum + a.current_value, 0);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="loader loader-lg"></div>
                <p>Loading assets...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Assets</h1>
                    <p className={styles.subtitle}>Manage your financial assets</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    + Add Asset
                </button>
            </div>

            {/* Summary Card */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Total Assets</span>
                    <span className={styles.summaryValue}>{formatCurrency(totalValue)}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Number of Assets</span>
                    <span className={styles.summaryValue}>{assets.length}</span>
                </div>
            </div>

            {/* Assets Table */}
            {assets.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>💰</span>
                    <h3>No assets yet</h3>
                    <p>Add your first asset to start tracking your wealth</p>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        + Add Asset
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
                                <th>Value</th>
                                <th>Interest Rate</th>
                                <th>Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map(asset => (
                                <tr key={asset.id}>
                                    <td className={styles.nameCell}>
                                        <span className={styles.assetName}>{asset.name}</span>
                                        {asset.notes && (
                                            <span className={styles.assetNotes}>{asset.notes}</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.categoryBadge}>
                                            {ASSET_CATEGORY_LABELS[asset.category]}
                                        </span>
                                    </td>
                                    <td className={styles.institutionCell}>
                                        {asset.institution || '-'}
                                    </td>
                                    <td className={styles.valueCell}>
                                        {formatCurrency(asset.current_value)}
                                    </td>
                                    <td>
                                        {asset.interest_rate ? `${asset.interest_rate}%` : '-'}
                                    </td>
                                    <td className={styles.dateCell}>
                                        {formatDate(asset.updated_at, 'short')}
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleOpenModal(asset)}
                                        >
                                            Edit
                                        </button>
                                        {deleteConfirm === asset.id ? (
                                            <>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(asset.id)}
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
                                                onClick={() => setDeleteConfirm(asset.id)}
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
                title={editingAsset ? 'Edit Asset' : 'Add New Asset'}
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
                                {ASSET_CATEGORIES.map(cat => (
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
                                placeholder="e.g., Savings Account"
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
                                placeholder="e.g., HDFC Bank"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Current Value (₹) *</label>
                            <input
                                type="number"
                                name="current_value"
                                value={formData.current_value || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Purchase Value (₹)</label>
                            <input
                                type="number"
                                name="purchase_value"
                                value={formData.purchase_value || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="0"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Interest Rate (%)</label>
                            <input
                                type="number"
                                name="interest_rate"
                                value={formData.interest_rate || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="0"
                                min="0"
                                max="100"
                                step="0.01"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Purchase Date</label>
                            <input
                                type="date"
                                name="purchase_date"
                                value={formData.purchase_date}
                                onChange={handleInputChange}
                                className="input"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Maturity Date</label>
                            <input
                                type="date"
                                name="maturity_date"
                                value={formData.maturity_date}
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
                            {editingAsset ? 'Save Changes' : 'Add Asset'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
