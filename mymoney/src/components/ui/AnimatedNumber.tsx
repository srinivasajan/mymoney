'use client';

import { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    formatter?: (value: number) => string;
    className?: string;
}

export default function AnimatedNumber({
    value,
    duration = 1000,
    formatter = (v) => v.toLocaleString('en-IN'),
    className = ''
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const startValue = previousValue.current;
        const endValue = value;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            const currentValue = startValue + (endValue - startValue) * easeOutQuart;
            setDisplayValue(currentValue);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                previousValue.current = endValue;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    return (
        <span className={className}>
            {formatter(Math.round(displayValue))}
        </span>
    );
}
