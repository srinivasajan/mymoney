'use client';

import { ReactNode } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md'
}: ModalProps) {
    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={`${styles.modal} ${styles[size]}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                </div>
                <div className={styles.body}>
                    {children}
                </div>
            </div>
        </div>
    );
}
