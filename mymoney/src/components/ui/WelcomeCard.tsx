'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './WelcomeCard.module.css';
import { seedDemoData } from '@/lib/seedData';

interface WelcomeCardProps {
    onDataLoaded?: () => void;
}

export default function WelcomeCard({ onDataLoaded }: WelcomeCardProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleLoadSampleData = () => {
        setIsLoading(true);

        // Small delay for better UX
        setTimeout(() => {
            seedDemoData();

            // Trigger storage event to refresh data
            window.dispatchEvent(new Event('storage'));

            if (onDataLoaded) {
                onDataLoaded();
            }

            setIsLoading(false);
        }, 500);
    };

    return (
        <div className={styles.welcomeCard}>
            <span className={styles.welcomeIcon}>🌙</span>
            <h2 className={styles.welcomeTitle}>Welcome to Moonlight Capital</h2>
            <p className={styles.welcomeSubtitle}>
                Your personal finance dashboard is ready. Start by adding your assets and liabilities to track your net worth, or load sample data to explore the platform.
            </p>

            <div className={styles.welcomeActions}>
                <Link
                    href="/assets"
                    className={`${styles.welcomeButton} ${styles.welcomeButtonPrimary}`}
                >
                    <span>💰</span>
                    Add Your First Asset
                </Link>
                <button
                    className={`${styles.welcomeButton} ${styles.welcomeButtonSecondary}`}
                    onClick={handleLoadSampleData}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="loader"></span>
                            Loading...
                        </>
                    ) : (
                        <>
                            <span>📊</span>
                            Load Sample Data
                        </>
                    )}
                </button>
            </div>

            <div className={styles.welcomeSteps}>
                <h3 className={styles.welcomeStepsTitle}>Getting Started</h3>
                <div className={styles.stepsList}>
                    <div className={styles.step}>
                        <span className={styles.stepNumber}>1</span>
                        Add Assets
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNumber}>2</span>
                        Add Liabilities
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNumber}>3</span>
                        Set Goals
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNumber}>4</span>
                        Track Progress
                    </div>
                </div>
            </div>
        </div>
    );
}
