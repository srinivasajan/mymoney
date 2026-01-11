'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import styles from './page.module.css';
import {
    fetchAssets,
    createAssetAPI,
    updateAssetAPI,
    deleteAssetAPI
} from '@/lib/api';
import {
    formatCurrency,
    formatDate
} from '@/lib/utils';

interface Asset {
    _id: string;
    name: string;
    type: string;
    value: number;
    institution?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

interface AssetFormData {
    name: string;
    type: string;
    value: number;
    institution: string;
    notes: string;
}

const ASSET_CATEGORIES: { value: string; label: string }[] = [
    { value: 'cash', label: 'Cash' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'investment', label: 'Investment' },
    { value: 'property', label: 'Property' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'other', label: 'Other' },
];

const INITIAL_FORM: AssetFormData = {
    type: 'savings',
    name: '',
    value: 0,
    institution: '',
    notes: '',
};

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [formData, setFormData] = useState<AssetFormData>(INITIAL_FORM);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        try {
            setLoading(true);
            const data = await fetchAssets();
            setAssets(data);
        } catch (error) {
            console.error('Error loading assets:', error);
            addToast('Failed to load assets', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (asset?: Asset) => {
        if (asset) {
            setEditingAsset(asset);
            setFormData({
                type: asset.type,
                name: asset.name,
                value: asset.value,
                institution: asset.institution || '',
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
            [name]: type === 'number' ? (value ? parseFloat(value) : 0) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || formData.value <= 0) {
            addToast('Please fill in all required fields', 'warning');
            return;
        }

        try {
            setSaving(true);
            if (editingAsset) {
                await updateAssetAPI(editingAsset._id, { ...formData });
                addToast(`Asset "${formData.name}" updated successfully`, 'success');
            } else {
                await createAssetAPI(formData);
                addToast(`Asset "${formData.name}" added successfully`, 'success');
            }
            await loadAssets();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving asset:', error);
            addToast('Failed to save asset', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const assetToDelete = assets.find(a => a._id === id);
        try {
            await deleteAssetAPI(id);
            await loadAssets();
            setDeleteConfirm(null);
            addToast(`Asset "${assetToDelete?.name}" deleted`, 'success');
        } catch (error) {
            console.error('Error deleting asset:', error);
            addToast('Failed to delete asset', 'error');
        }
    };

    const totalValue = assets.reduce((sum, a) => sum + a.value, 0);

    const getCategoryLabel = (type: string) => {
        const cat = ASSET_CATEGORIES.find(c => c.value === type);
        return cat?.label || type;
    };

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
                                <th>Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map(asset => (
                                <tr key={asset._id}>
                                    <td className={styles.nameCell}>
                                        <span className={styles.assetName}>{asset.name}</span>
                                        {asset.notes && (
                                            <span className={styles.assetNotes}>{asset.notes}</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.categoryBadge}>
                                            {getCategoryLabel(asset.type)}
                                        </span>
                                    </td>
                                    <td className={styles.institutionCell}>
                                        {asset.institution || '-'}
                                    </td>
                                    <td className={styles.valueCell}>
                                        {formatCurrency(asset.value)}
                                    </td>
                                    <td className={styles.dateCell}>
                                        {formatDate(asset.updatedAt, 'short')}
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => handleOpenModal(asset)}
                                        >
                                            Edit
                                        </button>
                                        {deleteConfirm === asset._id ? (
                                            <>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(asset._id)}
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
                                                onClick={() => setDeleteConfirm(asset._id)}
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
                                name="type"
                                value={formData.type}
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
                                name="value"
                                value={formData.value || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                required
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
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : (editingAsset ? 'Save Changes' : 'Add Asset')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
