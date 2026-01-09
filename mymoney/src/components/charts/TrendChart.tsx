'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import styles from './TrendChart.module.css';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TrendData {
    date: string;
    value: number;
}

interface TrendChartProps {
    data: TrendData[];
    title?: string;
    color?: string;
    gradientFrom?: string;
    gradientTo?: string;
    height?: number;
    showGrid?: boolean;
}

const CustomTooltip = ({
    active,
    payload,
    label
}: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}) => {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className={styles.tooltip}>
            <div className={styles.tooltipDate}>
                {label ? formatDate(label, 'medium') : ''}
            </div>
            <div className={styles.tooltipValue}>
                {formatCurrency(payload[0].value)}
            </div>
        </div>
    );
};

export default function TrendChart({
    data,
    title,
    color = '#d4a853',
    gradientFrom = 'rgba(212, 168, 83, 0.3)',
    gradientTo = 'rgba(212, 168, 83, 0)',
    height = 300,
    showGrid = true,
}: TrendChartProps) {
    if (data.length === 0) {
        return (
            <div className={styles.container}>
                {title && <h3 className={styles.title}>{title}</h3>}
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>📈</span>
                    <span className={styles.emptyText}>No trend data available</span>
                </div>
            </div>
        );
    }

    // Calculate change
    const firstValue = data[0]?.value || 0;
    const lastValue = data[data.length - 1]?.value || 0;
    const change = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? (change / firstValue) * 100 : 0;
    const isPositive = change >= 0;

    return (
        <div className={styles.container}>
            {title && (
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    <div className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
                        <span>{isPositive ? '↑' : '↓'}</span>
                        <span>{Math.abs(changePercent).toFixed(1)}%</span>
                    </div>
                </div>
            )}

            <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={height}>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={gradientFrom} />
                                <stop offset="95%" stopColor={gradientTo} />
                            </linearGradient>
                        </defs>
                        {showGrid && (
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--color-border)"
                                vertical={false}
                            />
                        )}
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                            tickFormatter={(value) => formatCurrency(value, 'INR', true)}
                            width={60}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
