import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import Providers from '@/components/Providers';
import styles from './layout.module.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Providers>
            <div className={styles.layout}>
                <Sidebar />
                <div className={styles.main}>
                    <Header />
                    <main className={styles.content}>
                        {children}
                    </main>
                </div>
                <MobileNav />
            </div>
        </Providers>
    );
}
