import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Moonlight Capital - Institutional Investment Management',
    description: 'Premier investment management firm specializing in multi-asset strategies across equities, fixed income, and alternative investments. Building wealth, generating returns.',
    keywords: ['investment management', 'portfolio management', 'wealth management', 'asset management', 'hedge fund'],
};

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="landing-layout">
            {children}
        </div>
    );
}
