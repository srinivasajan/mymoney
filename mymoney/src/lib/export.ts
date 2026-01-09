// =====================================================
// EXPORT UTILITIES
// Functions for generating CSV and PDF exports
// =====================================================

import { formatCurrency, formatDate, TRANSACTION_CATEGORY_LABELS, ASSET_CATEGORY_LABELS, LIABILITY_CATEGORY_LABELS } from './utils';
import type { Transaction, Asset, Liability, StockHolding, MFHolding, Goal } from './types';

/**
 * Convert array of objects to CSV string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function arrayToCSV<T extends Record<string, any>>(
    data: T[],
    columns: { key: keyof T; header: string; format?: (value: any) => string }[]
): string {
    if (data.length === 0) return '';

    // Header row
    const headers = columns.map(col => `"${col.header}"`).join(',');

    // Data rows
    const rows = data.map(item =>
        columns.map(col => {
            const value = item[col.key];
            const formatted = col.format ? col.format(value) : String(value ?? '');
            // Escape quotes and wrap in quotes
            return `"${formatted.replace(/"/g, '""')}"`;
        }).join(',')
    );

    return [headers, ...rows].join('\n');
}

/**
 * Trigger CSV file download
 */
export function downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export transactions to CSV
 */
export function exportTransactionsCSV(transactions: Transaction[]): void {
    const csv = arrayToCSV(transactions, [
        { key: 'date', header: 'Date', format: (v) => formatDate(v as string, 'medium') },
        { key: 'type', header: 'Type', format: (v) => (v as string).toUpperCase() },
        { key: 'category', header: 'Category', format: (v) => TRANSACTION_CATEGORY_LABELS[v as string] || v as string },
        { key: 'description', header: 'Description' },
        { key: 'amount', header: 'Amount', format: (v) => String(v) },
        { key: 'payment_method', header: 'Payment Method' },
        { key: 'notes', header: 'Notes' },
    ]);

    downloadCSV(csv, `transactions_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export assets to CSV
 */
export function exportAssetsCSV(assets: Asset[]): void {
    const csv = arrayToCSV(assets, [
        { key: 'category', header: 'Category', format: (v) => ASSET_CATEGORY_LABELS[v as string] || v as string },
        { key: 'name', header: 'Name' },
        { key: 'institution', header: 'Institution' },
        { key: 'current_value', header: 'Current Value', format: (v) => String(v) },
        { key: 'purchase_value', header: 'Purchase Value', format: (v) => v ? String(v) : '' },
        { key: 'purchase_date', header: 'Purchase Date', format: (v) => v ? formatDate(v as string, 'medium') : '' },
        { key: 'interest_rate', header: 'Interest Rate (%)', format: (v) => v ? `${v}%` : '' },
    ]);

    downloadCSV(csv, `assets_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export liabilities to CSV
 */
export function exportLiabilitiesCSV(liabilities: Liability[]): void {
    const csv = arrayToCSV(liabilities, [
        { key: 'category', header: 'Category', format: (v) => LIABILITY_CATEGORY_LABELS[v as string] || v as string },
        { key: 'name', header: 'Name' },
        { key: 'institution', header: 'Institution' },
        { key: 'principal_amount', header: 'Principal Amount', format: (v) => String(v) },
        { key: 'outstanding_amount', header: 'Outstanding Amount', format: (v) => String(v) },
        { key: 'emi_amount', header: 'EMI Amount', format: (v) => v ? String(v) : '' },
        { key: 'interest_rate', header: 'Interest Rate (%)', format: (v) => v ? `${v}%` : '' },
    ]);

    downloadCSV(csv, `liabilities_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export investments to CSV
 */
export function exportInvestmentsCSV(stocks: StockHolding[], mfs: MFHolding[]): void {
    const stockRows = stocks.map(s => ({
        type: 'Stock',
        name: s.symbol,
        exchange: s.exchange,
        quantity: s.quantity,
        average_price: s.average_price,
        current_value: s.quantity * s.average_price,
    }));

    const mfRows = mfs.map(m => ({
        type: 'Mutual Fund',
        name: m.scheme_name,
        exchange: '-',
        quantity: m.units,
        average_price: m.average_nav,
        current_value: m.units * m.average_nav,
    }));

    const combined = [...stockRows, ...mfRows];

    const csv = arrayToCSV(combined, [
        { key: 'type', header: 'Type' },
        { key: 'name', header: 'Name/Symbol' },
        { key: 'exchange', header: 'Exchange' },
        { key: 'quantity', header: 'Quantity/Units', format: (v) => String(v) },
        { key: 'average_price', header: 'Avg Price/NAV', format: (v) => String(v) },
        { key: 'current_value', header: 'Invested Value', format: (v) => String(v) },
    ]);

    downloadCSV(csv, `investments_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export goals to CSV
 */
export function exportGoalsCSV(goals: Goal[]): void {
    const csv = arrayToCSV(goals, [
        { key: 'name', header: 'Goal Name' },
        { key: 'category', header: 'Category' },
        { key: 'target_amount', header: 'Target Amount', format: (v) => String(v) },
        { key: 'current_amount', header: 'Current Amount', format: (v) => String(v) },
        { key: 'target_date', header: 'Target Date', format: (v) => v ? formatDate(v as string, 'medium') : '' },
        { key: 'priority', header: 'Priority' },
    ]);

    downloadCSV(csv, `goals_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Generate and open printable HTML report for net worth
 */
interface ReportData {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    assets: Asset[];
    liabilities: Liability[];
    stocks: StockHolding[];
    mfs: MFHolding[];
    goals: Goal[];
}

export function generateNetWorthReport(data: ReportData): void {
    const today = new Date();
    const stockValue = data.stocks.reduce((sum, s) => sum + s.quantity * s.average_price, 0);
    const mfValue = data.mfs.reduce((sum, m) => sum + m.units * m.average_nav, 0);

    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Net Worth Report - Moonlight Capital</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
            padding: 40px; 
            background: #fff;
            color: #1a1a1a;
            line-height: 1.6;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding-bottom: 20px;
            border-bottom: 2px solid #d4a853;
        }
        .logo { font-size: 28px; font-weight: 700; color: #1a1a1a; }
        .logo span { color: #d4a853; }
        .report-title { font-size: 20px; color: #666; margin-top: 8px; }
        .date { font-size: 14px; color: #999; margin-top: 4px; }
        
        .summary { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 20px; 
            margin-bottom: 40px; 
        }
        .summary-card { 
            background: #f8f8f8; 
            padding: 24px; 
            border-radius: 8px;
            text-align: center;
        }
        .summary-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-value { font-size: 28px; font-weight: 700; margin-top: 8px; }
        .positive { color: #22c55e; }
        .negative { color: #ef4444; }
        
        .section { margin-bottom: 32px; }
        .section-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #1a1a1a; 
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e5e5;
        }
        
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f8f8; font-weight: 600; color: #666; text-transform: uppercase; font-size: 11px; }
        td.value { text-align: right; font-family: monospace; font-weight: 500; }
        tr:hover { background: #fafafa; }
        
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e5e5;
            text-align: center;
            font-size: 12px;
            color: #999;
        }
        
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">☽ <span>Moonlight</span> Capital</div>
        <div class="report-title">Net Worth Report</div>
        <div class="date">Generated on ${today.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })}</div>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <div class="summary-label">Total Assets</div>
            <div class="summary-value positive">${formatCurrency(data.totalAssets)}</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Total Liabilities</div>
            <div class="summary-value negative">${formatCurrency(data.totalLiabilities)}</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Net Worth</div>
            <div class="summary-value ${data.netWorth >= 0 ? 'positive' : 'negative'}">${formatCurrency(data.netWorth)}</div>
        </div>
    </div>
    
    <div class="section">
        <h2 class="section-title">Assets (${data.assets.length})</h2>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Name</th>
                    <th>Institution</th>
                    <th class="value">Value</th>
                </tr>
            </thead>
            <tbody>
                ${data.assets.map(a => `
                <tr>
                    <td>${ASSET_CATEGORY_LABELS[a.category] || a.category}</td>
                    <td>${a.name}</td>
                    <td>${a.institution || '-'}</td>
                    <td class="value">${formatCurrency(a.current_value)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <h2 class="section-title">Investments (Stocks: ${data.stocks.length}, MFs: ${data.mfs.length}) - Total: ${formatCurrency(stockValue + mfValue)}</h2>
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Qty/Units</th>
                    <th class="value">Value</th>
                </tr>
            </thead>
            <tbody>
                ${data.stocks.map(s => `
                <tr>
                    <td>Stock</td>
                    <td>${s.symbol} (${s.exchange})</td>
                    <td>${s.quantity}</td>
                    <td class="value">${formatCurrency(s.quantity * s.average_price)}</td>
                </tr>
                `).join('')}
                ${data.mfs.map(m => `
                <tr>
                    <td>Mutual Fund</td>
                    <td>${m.scheme_name}</td>
                    <td>${m.units.toFixed(3)}</td>
                    <td class="value">${formatCurrency(m.units * m.average_nav)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <h2 class="section-title">Liabilities (${data.liabilities.length})</h2>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Name</th>
                    <th>Institution</th>
                    <th class="value">Outstanding</th>
                </tr>
            </thead>
            <tbody>
                ${data.liabilities.map(l => `
                <tr>
                    <td>${LIABILITY_CATEGORY_LABELS[l.category] || l.category}</td>
                    <td>${l.name}</td>
                    <td>${l.institution || '-'}</td>
                    <td class="value negative">${formatCurrency(l.outstanding_amount)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="section">
        <h2 class="section-title">Goals (${data.goals.length})</h2>
        <table>
            <thead>
                <tr>
                    <th>Goal</th>
                    <th>Target Date</th>
                    <th>Progress</th>
                    <th class="value">Target</th>
                </tr>
            </thead>
            <tbody>
                ${data.goals.map(g => {
        const progress = g.target_amount > 0 ? (g.current_amount / g.target_amount * 100) : 0;
        return `
                    <tr>
                        <td>${g.name}</td>
                        <td>${g.target_date ? formatDate(g.target_date, 'medium') : '-'}</td>
                        <td>${progress.toFixed(0)}%</td>
                        <td class="value">${formatCurrency(g.target_amount)}</td>
                    </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="footer">
        <p>This report was generated by Moonlight Capital. For informational purposes only.</p>
        <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
            Print / Save as PDF
        </button>
    </div>
</body>
</html>
    `;

    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(reportHTML);
        printWindow.document.close();
    }
}
