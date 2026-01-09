'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import styles from './page.module.css';
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/lib/storage';
import { formatCurrency, formatDate, GOAL_CATEGORY_LABELS } from '@/lib/utils';
import type { Goal, GoalCategory, GoalPriority, GoalFormData } from '@/lib/types';

const GOAL_CATEGORIES: { value: GoalCategory; label: string; icon: string }[] = [
    { value: 'retirement', label: 'Retirement', icon: '👴' },
    { value: 'education', label: 'Education', icon: '🎓' },
    { value: 'house', label: 'House', icon: '🏠' },
    { value: 'car', label: 'Car', icon: '🚗' },
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'emergency', label: 'Emergency Fund', icon: '🆘' },
    { value: 'other', label: 'Other', icon: '🎯' },
];

const PRIORITIES: { value: GoalPriority; label: string; color: string }[] = [
    { value: 'high', label: 'High', color: 'var(--color-accent-red)' },
    { value: 'medium', label: 'Medium', color: 'var(--color-warning)' },
    { value: 'low', label: 'Low', color: 'var(--color-accent-blue)' },
];

const INITIAL_FORM: GoalFormData = {
    name: '',
    target_amount: 0,
    current_amount: 0,
    target_date: '',
    priority: 'medium',
    category: 'other',
};

export default function GoalsPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [formData, setFormData] = useState<GoalFormData>(INITIAL_FORM);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = () => {
        try {
            const data = getGoals();
            setGoals(data);
        } catch (error) {
            console.error('Error loading goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (goal?: Goal) => {
        if (goal) {
            setEditingGoal(goal);
            setFormData({
                name: goal.name,
                target_amount: goal.target_amount,
                current_amount: goal.current_amount,
                target_date: goal.target_date || '',
                priority: goal.priority || 'medium',
                category: goal.category || 'other',
            });
        } else {
            setEditingGoal(null);
            setFormData(INITIAL_FORM);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingGoal(null);
        setFormData(INITIAL_FORM);
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? parseFloat(value) : 0) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || formData.target_amount <= 0) {
            addToast('Please fill in all required fields', 'warning');
            return;
        }

        try {
            if (editingGoal) {
                updateGoal(editingGoal.id, formData);
                addToast(`Goal "${formData.name}" updated successfully`, 'success');
            } else {
                createGoal(formData);
                addToast(`Goal "${formData.name}" added successfully`, 'success');
            }
            loadGoals();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving goal:', error);
            addToast('Failed to save goal', 'error');
        }
    };

    const handleDelete = (id: string) => {
        const goalToDelete = goals.find(g => g.id === id);
        try {
            deleteGoal(id);
            loadGoals();
            setDeleteConfirm(null);
            addToast(`Goal "${goalToDelete?.name}" deleted`, 'success');
        } catch (error) {
            console.error('Error deleting goal:', error);
            addToast('Failed to delete goal', 'error');
        }
    };

    const getProgress = (goal: Goal) => {
        return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    };

    const getDaysRemaining = (targetDate: string | null) => {
        if (!targetDate) return null;
        const target = new Date(targetDate);
        const today = new Date();
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getMonthlyContribution = (goal: Goal) => {
        if (!goal.target_date) return null;
        const remaining = goal.target_amount - goal.current_amount;
        if (remaining <= 0) return 0;

        const daysLeft = getDaysRemaining(goal.target_date);
        if (!daysLeft || daysLeft <= 0) return remaining; // Need it all now!

        const monthsLeft = Math.ceil(daysLeft / 30);
        return Math.ceil(remaining / monthsLeft);
    };

    const getCategoryIcon = (category: GoalCategory | null) => {
        return GOAL_CATEGORIES.find(c => c.value === category)?.icon || '🎯';
    };

    const getPriorityColor = (priority: GoalPriority | null) => {
        return PRIORITIES.find(p => p.value === priority)?.color || 'var(--color-text-muted)';
    };

    // Summary calculations
    const totalTargetAmount = goals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalCurrentAmount = goals.reduce((sum, g) => sum + g.current_amount, 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="loader loader-lg"></div>
                <p>Loading goals...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Financial Goals</h1>
                    <p className={styles.subtitle}>Track progress towards your financial objectives</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    + Add Goal
                </button>
            </div>

            {/* Summary */}
            <div className={styles.summary}>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Total Goals</span>
                    <span className={styles.summaryValue}>{goals.length}</span>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Target Amount</span>
                    <span className={styles.summaryValue}>{formatCurrency(totalTargetAmount)}</span>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Saved Amount</span>
                    <span className={styles.summaryValue}>{formatCurrency(totalCurrentAmount)}</span>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Overall Progress</span>
                    <span className={styles.summaryValue}>{overallProgress.toFixed(0)}%</span>
                </div>
            </div>

            {/* Goals Grid */}
            {goals.length === 0 ? (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🎯</span>
                    <h3>No goals yet</h3>
                    <p>Set your first financial goal to start tracking your progress</p>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        + Add Goal
                    </button>
                </div>
            ) : (
                <div className={styles.goalsGrid}>
                    {goals.map(goal => {
                        const progress = getProgress(goal);
                        const daysRemaining = getDaysRemaining(goal.target_date);

                        return (
                            <div key={goal.id} className={styles.goalCard}>
                                <div className={styles.goalHeader}>
                                    <div className={styles.goalIcon}>
                                        {getCategoryIcon(goal.category)}
                                    </div>
                                    <div className={styles.goalInfo}>
                                        <h3 className={styles.goalName}>{goal.name}</h3>
                                        <span className={styles.goalCategory}>
                                            {GOAL_CATEGORY_LABELS[goal.category || 'other']}
                                        </span>
                                    </div>
                                    <span
                                        className={styles.priorityBadge}
                                        style={{ background: getPriorityColor(goal.priority) }}
                                    >
                                        {goal.priority || 'Medium'}
                                    </span>
                                </div>

                                <div className={styles.goalProgress}>
                                    <div className={styles.progressHeader}>
                                        <span>{formatCurrency(goal.current_amount)}</span>
                                        <span className={styles.targetAmount}>of {formatCurrency(goal.target_amount)}</span>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{
                                                width: `${progress}%`,
                                                background: progress >= 100
                                                    ? 'var(--color-accent-green)'
                                                    : 'var(--color-accent-gold)'
                                            }}
                                        />
                                    </div>
                                    <div className={styles.progressFooter}>
                                        <span className={styles.progressPercent}>{progress.toFixed(0)}% complete</span>
                                        {daysRemaining !== null && (
                                            <span className={`${styles.daysRemaining} ${daysRemaining < 0 ? styles.overdue : ''}`}>
                                                {daysRemaining < 0
                                                    ? `${Math.abs(daysRemaining)} days overdue`
                                                    : daysRemaining === 0
                                                        ? 'Due today'
                                                        : `${daysRemaining} days left`
                                                }
                                            </span>
                                        )}
                                    </div>
                                    {(() => {
                                        const monthlyNeeded = getMonthlyContribution(goal);
                                        if (monthlyNeeded === null) return null;
                                        if (monthlyNeeded === 0) {
                                            return (
                                                <div style={{
                                                    marginTop: 'var(--spacing-sm)',
                                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                                    background: 'var(--color-positive-muted)',
                                                    color: 'var(--color-positive)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: 'var(--font-size-xs)',
                                                    fontWeight: 'var(--font-weight-medium)'
                                                }}>
                                                    🎉 Goal achieved!
                                                </div>
                                            );
                                        }
                                        return (
                                            <div style={{
                                                marginTop: 'var(--spacing-sm)',
                                                fontSize: 'var(--font-size-xs)',
                                                color: 'var(--color-text-muted)'
                                            }}>
                                                💡 Save <strong style={{ color: 'var(--color-accent-primary)' }}>{formatCurrency(monthlyNeeded)}/month</strong> to reach this goal
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className={styles.goalActions}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(goal)}>
                                        Edit
                                    </button>
                                    {deleteConfirm === goal.id ? (
                                        <>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(goal.id)}>
                                                Confirm
                                            </button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(goal.id)}>
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingGoal ? 'Edit Goal' : 'Add New Goal'}
            >
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Goal Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="input"
                            placeholder="e.g., Buy a house"
                            required
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="select"
                            >
                                {GOAL_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Priority</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleInputChange}
                                className="select"
                            >
                                {PRIORITIES.map(p => (
                                    <option key={p.value} value={p.value}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Target Amount (₹) *</label>
                            <input
                                type="number"
                                name="target_amount"
                                value={formData.target_amount || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="0"
                                min="1"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Current Amount (₹)</label>
                            <input
                                type="number"
                                name="current_amount"
                                value={formData.current_amount || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Target Date</label>
                        <input
                            type="date"
                            name="target_date"
                            value={formData.target_date}
                            onChange={handleInputChange}
                            className="input"
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingGoal ? 'Save Changes' : 'Add Goal'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
