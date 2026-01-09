'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, prefix: string = '', suffix: string = '') {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (hasAnimated) return;

        const timer = setTimeout(() => {
            setHasAnimated(true);
            let startTime: number;
            const animate = (currentTime: number) => {
                if (!startTime) startTime = currentTime;
                const progress = Math.min((currentTime - startTime) / duration, 1);
                setCount(Math.floor(progress * end));
                if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        }, 500);

        return () => clearTimeout(timer);
    }, [end, duration, hasAnimated]);

    return `${prefix}${count.toLocaleString()}${suffix}`;
}

export default function LandingPage() {
    const aum = useCountUp(2847, 2500, '₹', ' Cr');
    const investors = useCountUp(12500, 2000, '', '+');
    const cagr = useCountUp(18, 1500, '', '%');
    const years = useCountUp(8, 1000, '', '+');

    return (
        <div className={styles.page}>
            {/* Navigation */}
            <nav className={styles.nav}>
                <div className={styles.navContainer}>
                    <Link href="/" className={styles.logo}>
                        <div className={styles.logoMark}>☽</div>
                        <span className={styles.logoText}>Moonlight</span>
                        <span className={styles.logoTagline}>Capital</span>
                    </Link>

                    <div className={styles.navLinks}>
                        <Link href="#about" className={styles.navLink}>About Us</Link>
                        <Link href="#performance" className={styles.navLink}>Performance</Link>
                        <Link href="#strategies" className={styles.navLink}>Investment Strategies</Link>
                        <Link href="#team" className={styles.navLink}>Leadership</Link>
                        <Link href="#contact" className={styles.navLink}>Contact</Link>
                    </div>

                    <div className={styles.navActions}>
                        <Link href="/dashboard" className={styles.investorPortal}>
                            Investor Portal
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroBackground}>
                    <div className={styles.gridOverlay}></div>
                    <div className={styles.gradientOrb1}></div>
                    <div className={styles.gradientOrb2}></div>
                </div>

                <div className={styles.heroContent}>
                    <div className={styles.heroText}>
                        <div className={styles.heroBadge}>
                            <span className={styles.badgeDot}></span>
                            SEBI Registered Investment Advisor
                        </div>
                        <h1 className={styles.heroTitle}>
                            Building Wealth.<br />
                            <span className={styles.heroTitleAccent}>Generating Returns.</span>
                        </h1>
                        <p className={styles.heroSubtitle}>
                            We are a premier investment management firm specializing in
                            multi-asset strategies across equities, fixed income, and alternative investments.
                            Trust your capital with institutional-grade expertise.
                        </p>
                        <div className={styles.heroActions}>
                            <Link href="#contact" className={styles.primaryButton}>
                                Start Investing
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </Link>
                            <Link href="#performance" className={styles.secondaryButton}>
                                View Performance
                            </Link>
                        </div>
                    </div>

                    <div className={styles.heroStats}>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>{aum}</div>
                            <div className={styles.statLabel}>Assets Under Management</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>{investors}</div>
                            <div className={styles.statLabel}>Active Investors</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>{cagr}</div>
                            <div className={styles.statLabel}>5-Year CAGR</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statValue}>{years}</div>
                            <div className={styles.statLabel}>Years of Excellence</div>
                        </div>
                    </div>
                </div>

                <div className={styles.scrollIndicator}>
                    <span>Scroll to explore</span>
                    <div className={styles.scrollLine}></div>
                </div>
            </section>

            {/* Trust Indicators */}
            <section className={styles.trustSection}>
                <div className={styles.trustContainer}>
                    <span className={styles.trustLabel}>Trusted By Leading Institutions</span>
                    <div className={styles.trustLogos}>
                        <div className={styles.trustLogo}>HDFC Bank</div>
                        <div className={styles.trustLogo}>Tata Group</div>
                        <div className={styles.trustLogo}>Reliance</div>
                        <div className={styles.trustLogo}>Infosys Foundation</div>
                        <div className={styles.trustLogo}>Wipro</div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className={styles.aboutSection}>
                <div className={styles.sectionContainer}>
                    <div className={styles.aboutGrid}>
                        <div className={styles.aboutContent}>
                            <span className={styles.sectionLabel}>About Moonlight Capital</span>
                            <h2 className={styles.sectionTitle}>
                                Institutional Excellence,<br />
                                Personalized Approach
                            </h2>
                            <p className={styles.aboutText}>
                                Founded in 2018, Moonlight Capital has grown to become one of India's
                                most trusted investment management firms. We combine rigorous quantitative
                                analysis with deep fundamental research to deliver superior risk-adjusted returns.
                            </p>
                            <p className={styles.aboutText}>
                                Our investment philosophy centers on capital preservation, disciplined
                                asset allocation, and identifying asymmetric opportunities across market cycles.
                            </p>
                            <div className={styles.aboutFeatures}>
                                <div className={styles.aboutFeature}>
                                    <div className={styles.featureIcon}>📊</div>
                                    <div>
                                        <strong>Data-Driven Decisions</strong>
                                        <span>Proprietary models backed by 10+ years of market data</span>
                                    </div>
                                </div>
                                <div className={styles.aboutFeature}>
                                    <div className={styles.featureIcon}>🛡️</div>
                                    <div>
                                        <strong>Risk-First Approach</strong>
                                        <span>Downside protection is our primary mandate</span>
                                    </div>
                                </div>
                                <div className={styles.aboutFeature}>
                                    <div className={styles.featureIcon}>🎯</div>
                                    <div>
                                        <strong>Aligned Interests</strong>
                                        <span>Our team invests alongside clients</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.aboutVisual}>
                            <div className={styles.chartMockup}>
                                <div className={styles.chartHeader}>
                                    <span>Portfolio Performance vs Benchmark</span>
                                    <span className={styles.chartReturn}>+23.4% YTD</span>
                                </div>
                                <div className={styles.chartBars}>
                                    <div className={styles.chartBar} style={{ height: '45%' }}></div>
                                    <div className={styles.chartBar} style={{ height: '60%' }}></div>
                                    <div className={styles.chartBar} style={{ height: '35%' }}></div>
                                    <div className={styles.chartBar} style={{ height: '80%' }}></div>
                                    <div className={styles.chartBar} style={{ height: '70%' }}></div>
                                    <div className={styles.chartBar} style={{ height: '55%' }}></div>
                                    <div className={styles.chartBar} style={{ height: '90%' }}></div>
                                    <div className={styles.chartBar} style={{ height: '75%' }}></div>
                                </div>
                                <div className={styles.chartLegend}>
                                    <span><span className={styles.legendDot}></span> Moonlight Capital</span>
                                    <span><span className={styles.legendDotMuted}></span> Nifty 50</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Performance Section */}
            <section id="performance" className={styles.performanceSection}>
                <div className={styles.sectionContainer}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionLabel}>Track Record</span>
                        <h2 className={styles.sectionTitle}>Consistent Performance Across Cycles</h2>
                        <p className={styles.sectionSubtitle}>
                            Our disciplined approach has delivered market-beating returns while maintaining lower volatility
                        </p>
                    </div>

                    <div className={styles.performanceGrid}>
                        <div className={styles.performanceCard}>
                            <div className={styles.performanceHeader}>
                                <span className={styles.fundName}>Growth Fund</span>
                                <span className={styles.fundType}>Equity</span>
                            </div>
                            <div className={styles.performanceValue}>+24.8%</div>
                            <div className={styles.performanceLabel}>1-Year Return</div>
                            <div className={styles.performanceDetails}>
                                <div className={styles.performanceDetail}>
                                    <span>3-Year CAGR</span>
                                    <span>+19.2%</span>
                                </div>
                                <div className={styles.performanceDetail}>
                                    <span>Since Inception</span>
                                    <span>+156.4%</span>
                                </div>
                                <div className={styles.performanceDetail}>
                                    <span>Sharpe Ratio</span>
                                    <span>1.84</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.performanceCard}>
                            <div className={styles.performanceHeader}>
                                <span className={styles.fundName}>Balanced Fund</span>
                                <span className={styles.fundType}>Hybrid</span>
                            </div>
                            <div className={styles.performanceValue}>+16.3%</div>
                            <div className={styles.performanceLabel}>1-Year Return</div>
                            <div className={styles.performanceDetails}>
                                <div className={styles.performanceDetail}>
                                    <span>3-Year CAGR</span>
                                    <span>+14.7%</span>
                                </div>
                                <div className={styles.performanceDetail}>
                                    <span>Since Inception</span>
                                    <span>+89.2%</span>
                                </div>
                                <div className={styles.performanceDetail}>
                                    <span>Sharpe Ratio</span>
                                    <span>1.52</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.performanceCard}>
                            <div className={styles.performanceHeader}>
                                <span className={styles.fundName}>Income Fund</span>
                                <span className={styles.fundType}>Debt</span>
                            </div>
                            <div className={styles.performanceValue}>+9.4%</div>
                            <div className={styles.performanceLabel}>1-Year Return</div>
                            <div className={styles.performanceDetails}>
                                <div className={styles.performanceDetail}>
                                    <span>3-Year CAGR</span>
                                    <span>+8.9%</span>
                                </div>
                                <div className={styles.performanceDetail}>
                                    <span>Since Inception</span>
                                    <span>+42.1%</span>
                                </div>
                                <div className={styles.performanceDetail}>
                                    <span>YTM</span>
                                    <span>8.2%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className={styles.disclaimer}>
                        Past performance is not indicative of future results. Investments are subject to market risks.
                    </p>
                </div>
            </section>

            {/* Investment Strategies */}
            <section id="strategies" className={styles.strategiesSection}>
                <div className={styles.sectionContainer}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionLabel}>Investment Strategies</span>
                        <h2 className={styles.sectionTitle}>Diversified Approach to Wealth Creation</h2>
                    </div>

                    <div className={styles.strategiesGrid}>
                        <div className={styles.strategyCard}>
                            <div className={styles.strategyIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M2 20h20M5 20V10l7-7 7 7v10M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className={styles.strategyTitle}>Large Cap Equity</h3>
                            <p className={styles.strategyDesc}>
                                Blue-chip focused portfolio targeting stable growth through
                                India's top 100 companies with proven track records.
                            </p>
                            <div className={styles.strategyAllocation}>
                                <span>Min. Investment: ₹10 Lakhs</span>
                            </div>
                        </div>

                        <div className={styles.strategyCard}>
                            <div className={styles.strategyIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className={styles.strategyTitle}>Multi-Cap Growth</h3>
                            <p className={styles.strategyDesc}>
                                Flexible mandate across market caps, capturing opportunities
                                in emerging leaders and established performers alike.
                            </p>
                            <div className={styles.strategyAllocation}>
                                <span>Min. SIP: ₹5,000/month</span>
                            </div>
                        </div>

                        <div className={styles.strategyCard}>
                            <div className={styles.strategyIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM21 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className={styles.strategyTitle}>Sector Rotation</h3>
                            <p className={styles.strategyDesc}>
                                Dynamic allocation across sectors based on economic cycles,
                                momentum signals, and fundamental catalysts.
                            </p>
                            <div className={styles.strategyAllocation}>
                                <span>Min. SIP: ₹10,000/month</span>
                            </div>
                        </div>

                        <div className={styles.strategyCard}>
                            <div className={styles.strategyIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3 className={styles.strategyTitle}>Capital Protection</h3>
                            <p className={styles.strategyDesc}>
                                Conservative hybrid strategy focused on principal protection
                                with moderate growth through fixed income and arbitrage.
                            </p>
                            <div className={styles.strategyAllocation}>
                                <span>Min. SIP: ₹1,000/month</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sector Allocation */}
            <section className={styles.allocationSection}>
                <div className={styles.sectionContainer}>
                    <div className={styles.allocationGrid}>
                        <div className={styles.allocationContent}>
                            <span className={styles.sectionLabel}>Portfolio Composition</span>
                            <h2 className={styles.sectionTitle}>Strategic Sector Allocation</h2>
                            <p className={styles.allocationDesc}>
                                Our portfolios are carefully constructed to balance growth potential
                                with risk management across India's most promising sectors.
                            </p>
                        </div>
                        <div className={styles.allocationChart}>
                            <div className={styles.pieChart}>
                                <div className={styles.pieCenter}>
                                    <span className={styles.pieCenterValue}>₹2,847 Cr</span>
                                    <span className={styles.pieCenterLabel}>Total AUM</span>
                                </div>
                            </div>
                            <div className={styles.allocationLegend}>
                                <div className={styles.legendItem}>
                                    <span className={styles.legendColor} style={{ background: '#d4a853' }}></span>
                                    <span className={styles.legendText}>Financial Services</span>
                                    <span className={styles.legendValue}>28%</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <span className={styles.legendColor} style={{ background: '#3b82f6' }}></span>
                                    <span className={styles.legendText}>Technology</span>
                                    <span className={styles.legendValue}>22%</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <span className={styles.legendColor} style={{ background: '#22c55e' }}></span>
                                    <span className={styles.legendText}>Healthcare</span>
                                    <span className={styles.legendValue}>15%</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <span className={styles.legendColor} style={{ background: '#a855f7' }}></span>
                                    <span className={styles.legendText}>Consumer</span>
                                    <span className={styles.legendValue}>14%</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <span className={styles.legendColor} style={{ background: '#f97316' }}></span>
                                    <span className={styles.legendText}>Infrastructure</span>
                                    <span className={styles.legendValue}>12%</span>
                                </div>
                                <div className={styles.legendItem}>
                                    <span className={styles.legendColor} style={{ background: '#64748b' }}></span>
                                    <span className={styles.legendText}>Others</span>
                                    <span className={styles.legendValue}>9%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="contact" className={styles.ctaSection}>
                <div className={styles.ctaContainer}>
                    <div className={styles.ctaContent}>
                        <h2 className={styles.ctaTitle}>Ready to Grow Your Wealth?</h2>
                        <p className={styles.ctaSubtitle}>
                            Schedule a consultation with our investment advisors to discuss
                            your financial goals and explore our investment solutions.
                        </p>
                        <div className={styles.ctaForm}>
                            <input
                                type="text"
                                placeholder="Your Name"
                                className={styles.ctaInput}
                            />
                            <input
                                type="email"
                                placeholder="Email Address"
                                className={styles.ctaInput}
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                className={styles.ctaInput}
                            />
                            <select className={styles.ctaSelect}>
                                <option>Monthly Investment</option>
                                <option>₹1,000 - ₹5,000</option>
                                <option>₹5,000 - ₹15,000</option>
                                <option>₹15,000 - ₹50,000</option>
                                <option>₹50,000+</option>
                            </select>
                            <button className={styles.ctaButton}>
                                Request Consultation
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContainer}>
                    <div className={styles.footerGrid}>
                        <div className={styles.footerBrand}>
                            <div className={styles.footerLogo}>
                                <div className={styles.logoMark}>☽</div>
                                <span>Moonlight Capital</span>
                            </div>
                            <p className={styles.footerTagline}>
                                Institutional-grade investment management for discerning investors.
                            </p>
                            <div className={styles.footerCertifications}>
                                <span>SEBI Registered</span>
                                <span>AMFI Certified</span>
                            </div>
                        </div>

                        <div className={styles.footerLinks}>
                            <h4>Company</h4>
                            <Link href="#about">About Us</Link>
                            <Link href="#team">Leadership Team</Link>
                            <Link href="#">Careers</Link>
                            <Link href="#">Press & Media</Link>
                        </div>

                        <div className={styles.footerLinks}>
                            <h4>Investors</h4>
                            <Link href="/dashboard">Investor Portal</Link>
                            <Link href="#performance">Fund Performance</Link>
                            <Link href="#">Quarterly Reports</Link>
                            <Link href="#">Tax Documents</Link>
                        </div>

                        <div className={styles.footerLinks}>
                            <h4>Contact</h4>
                            <a href="mailto:invest@mymoney.capital">invest@mymoney.capital</a>
                            <a href="tel:+911234567890">+91 12345 67890</a>
                            <p>Mumbai, Maharashtra<br />India</p>
                        </div>
                    </div>

                    <div className={styles.footerBottom}>
                        <p>© 2024 Moonlight Capital Pvt. Ltd. All rights reserved.</p>
                        <div className={styles.footerLegal}>
                            <Link href="#">Privacy Policy</Link>
                            <Link href="#">Terms of Service</Link>
                            <Link href="#">Disclaimer</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
