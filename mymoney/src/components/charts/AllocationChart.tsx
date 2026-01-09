'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import styles from './AllocationChart.module.css';
import { formatCurrency, formatPercentUnsigned } from '@/lib/utils';

interface AllocationData {
    name: string;
    value: number;
    color: string;
    [key: string]: string | number;
}

interface AllocationChartProps {
    data: AllocationData[];
    title?: string;
    showLegend?: boolean;
    innerRadius?: number;
    outerRadius?: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: AllocationData }> }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
        <div className={styles.tooltip}>
            <div className={styles.tooltipLabel} style={{ color: data.color }}>
                {data.name}
            </div>
            <div className={styles.tooltipValue}>
                {formatCurrency(data.value)}
            </div>
        </div>
    );
};

const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string; payload: AllocationData }> }) => {
    if (!payload) return null;

    const total = payload.reduce((sum, entry) => sum + entry.payload.value, 0);

    return (
        <ul className={styles.legend}>
            {payload.map((entry, index) => {
                const percent = total > 0 ? (entry.payload.value / total) * 100 : 0;
                return (
                    <li key={index} className={styles.legendItem}>
                        <span
                            className={styles.legendDot}
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className={styles.legendLabel}>{entry.value}</span>
                        <span className={styles.legendValue}>
                            {formatPercentUnsigned(percent)}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
};

export default function AllocationChart({
    data,
    title,
    showLegend = true,
    innerRadius = 60,
    outerRadius = 90,
}: AllocationChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (data.length === 0 || total === 0) {
        return (
            <div className={styles.container}>
                {title && <h3 className={styles.title}>{title}</h3>}
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>📊</span>
                    <span className={styles.emptyText}>No data available</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {title && <h3 className={styles.title}>{title}</h3>}

            <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>

                <div className={styles.centerLabel}>
                    <span className={styles.centerValue}>{formatCurrency(total, 'INR', true)}</span>
                    <span className={styles.centerText}>Total</span>
                </div>
            </div>

            {showLegend && (
                <CustomLegend
                    payload={data.map(d => ({
                        value: d.name,
                        color: d.color,
                        payload: d
                    }))}
                />
            )}
        </div>
    );
}
