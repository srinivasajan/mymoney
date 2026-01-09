'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/components/ThemeContext';
import { getUserProfile, updateUserProfile, clearAllData, getAssets, getLiabilities, getStockHoldings, getMFHoldings, getGoals, getNetWorthSnapshots } from '@/lib/storage';
import { seedDemoData, hasDemoData } from '@/lib/seedData';
import type { UserProfile } from '@/lib/types';

export default function SettingsPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [saving, setSaving] = useState(false);
    const [clearConfirm, setClearConfirm] = useState(false);
    const [hasData, setHasData] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const { addToast } = useToast();
    const { theme, setTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const data = getUserProfile();
        setProfile(data);
        setHasData(hasDemoData());
    }, []);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setProfile(prev => prev ? {
            ...prev,
            [name]: type === 'number' ? (value ? parseFloat(value) : null) : value,
        } : null);
    };

    const handleSave = () => {
        if (!profile) return;

        setSaving(true);
        try {
            updateUserProfile(profile);
            addToast('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            addToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSeedData = () => {
        setSeeding(true);
        try {
            seedDemoData();
            setHasData(true);
            addToast('Demo data loaded successfully!', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Error seeding data:', error);
            addToast('Failed to seed demo data', 'error');
        } finally {
            setSeeding(false);
        }
    };

    const handleClearData = () => {
        try {
            clearAllData();
            addToast('All data cleared successfully', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Error clearing data:', error);
            addToast('Failed to clear data', 'error');
        }
    };

    // Export all data
    const handleExportData = () => {
        try {
            const exportData = {
                version: '2.0.0',
                exportDate: new Date().toISOString(),
                profile: getUserProfile(),
                assets: getAssets(),
                liabilities: getLiabilities(),
                stocks: getStockHoldings(),
                mutualFunds: getMFHoldings(),
                goals: getGoals(),
                snapshots: getNetWorthSnapshots(),
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `moonlight-capital-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            addToast('Failed to export data', 'error');
        }
    };

    // Import data
    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);

                // Validate structure
                if (!data.version || !data.profile) {
                    throw new Error('Invalid backup file format');
                }

                // Store all data
                localStorage.setItem('iap_user_profile', JSON.stringify(data.profile));
                localStorage.setItem('iap_assets', JSON.stringify(data.assets || []));
                localStorage.setItem('iap_liabilities', JSON.stringify(data.liabilities || []));
                localStorage.setItem('iap_stock_holdings', JSON.stringify(data.stocks || []));
                localStorage.setItem('iap_mf_holdings', JSON.stringify(data.mutualFunds || []));
                localStorage.setItem('iap_goals', JSON.stringify(data.goals || []));
                localStorage.setItem('iap_net_worth_snapshots', JSON.stringify(data.snapshots || []));

                addToast('Data imported successfully! Reloading...', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                console.error('Import error:', error);
                addToast('Failed to import data. Invalid file format.', 'error');
            }
        };
        reader.readAsText(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!profile) {
        return (
            <div className={styles.loading}>
                <div className="loader loader-lg"></div>
                <p>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.subtitle}>Configure your profile and preferences</p>
            </div>

            {/* Demo Data Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Demo Data</h2>
                <div className={styles.card}>
                    <div className={styles.demoSection}>
                        <div className={styles.demoInfo}>
                            <span className={styles.demoIcon}>🎯</span>
                            <div>
                                <h3>Load Sample Financial Data</h3>
                                <p>
                                    Populate your dashboard with realistic Indian financial data including
                                    assets (FD, PPF, Gold, Property), liabilities, stocks, mutual funds,
                                    goals, and 90 days of net worth history.
                                </p>
                            </div>
                        </div>
                        <button
                            className={`btn ${hasData ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={handleSeedData}
                            disabled={seeding}
                        >
                            {seeding ? 'Loading...' : hasData ? 'Reload Demo Data' : 'Load Demo Data'}
                        </button>
                    </div>
                </div>
            </section>

            {/* Appearance Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Appearance</h2>
                <div className={styles.card}>
                    <div className={styles.demoSection}>
                        <div className={styles.demoInfo}>
                            <span className={styles.demoIcon}>🎨</span>
                            <div>
                                <h3>Theme</h3>
                                <p>
                                    Choose between light and dark theme. Your preference will be saved.
                                </p>
                            </div>
                        </div>
                        <div className={styles.themeButtons}>
                            <button
                                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setTheme('light')}
                            >
                                ☀️ Light
                            </button>
                            <button
                                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setTheme('dark')}
                            >
                                🌙 Dark
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Profile Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Profile</h2>
                <div className={styles.card}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Full Name</label>
                            <input
                                type="text"
                                name="full_name"
                                value={profile.full_name || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="Your name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Monthly Income (₹)</label>
                            <input
                                type="number"
                                name="monthly_income"
                                value={profile.monthly_income || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="0"
                                min="0"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Monthly Expenses (₹)</label>
                            <input
                                type="number"
                                name="monthly_expenses"
                                value={profile.monthly_expenses || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Investment Profile */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Investment Profile</h2>
                <div className={styles.card}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Risk Tolerance</label>
                            <select
                                name="risk_tolerance"
                                value={profile.risk_tolerance || ''}
                                onChange={handleInputChange}
                                className="select"
                            >
                                <option value="">Select...</option>
                                <option value="conservative">Conservative - Prefer safety over returns</option>
                                <option value="moderate">Moderate - Balance between safety and returns</option>
                                <option value="aggressive">Aggressive - Willing to take higher risks</option>
                            </select>
                            <p className={styles.hint}>
                                This helps us provide better investment recommendations
                            </p>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Investment Horizon (Years)</label>
                            <input
                                type="number"
                                name="investment_horizon"
                                value={profile.investment_horizon || ''}
                                onChange={handleInputChange}
                                className="input"
                                placeholder="e.g., 10"
                                min="1"
                                max="50"
                            />
                            <p className={styles.hint}>
                                How long do you plan to keep your investments?
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Save Button */}
            <div className={styles.saveSection}>
                <button
                    className="btn btn-primary btn-lg"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Data Management */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Data Management</h2>
                <div className={styles.card}>
                    {/* Export/Import Section */}
                    <div className={styles.demoSection}>
                        <div className={styles.demoInfo}>
                            <span className={styles.demoIcon}>💾</span>
                            <div>
                                <h3>Backup & Restore</h3>
                                <p>
                                    Export your data as a JSON file for backup, or import a
                                    previously exported backup to restore your data.
                                </p>
                            </div>
                        </div>
                        <div className={styles.confirmButtons}>
                            <button
                                className="btn btn-primary"
                                onClick={handleExportData}
                            >
                                📤 Export Data
                            </button>
                            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                                📥 Import Data
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept=".json"
                                    onChange={handleImportData}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                        <div className={styles.dangerZone}>
                            <div className={styles.dangerInfo}>
                                <h3>Clear All Data</h3>
                                <p>
                                    This will permanently delete all your assets, liabilities, investments,
                                    goals, and settings. This action cannot be undone.
                                </p>
                            </div>

                            {clearConfirm ? (
                                <div className={styles.confirmButtons}>
                                    <button
                                        className="btn btn-danger"
                                        onClick={handleClearData}
                                    >
                                        Yes, Delete Everything
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setClearConfirm(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="btn btn-danger"
                                    onClick={() => setClearConfirm(true)}
                                >
                                    Clear All Data
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* About */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>About</h2>
                <div className={styles.card}>
                    <div className={styles.about}>
                        <div className={styles.aboutLogo}>☽</div>
                        <div className={styles.aboutInfo}>
                            <h3>Moonlight Capital</h3>
                            <p>Investment Management Platform</p>
                            <p className={styles.version}>Version 2.0.0</p>
                        </div>
                    </div>

                    <div className={styles.features}>
                        <h4>Features</h4>
                        <ul>
                            <li>📊 Unified Dashboard for all financial assets</li>
                            <li>💰 Track assets, liabilities, and net worth</li>
                            <li>📈 Stock and Mutual Fund tracking</li>
                            <li>🎯 Goal-based financial planning</li>
                            <li>🔢 Financial calculators (SIP, EMI, FD, PPF)</li>
                            <li>📉 Analytics and insights</li>
                            <li>🔒 All data stored locally in your browser</li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
}
