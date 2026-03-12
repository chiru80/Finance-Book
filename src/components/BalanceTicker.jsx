import React, { useEffect, useState, useRef } from 'react';

/**
 * BalanceTicker — Each digit flips vertically like a slot machine
 * using CSS 3D rotateX. Respects prefers-reduced-motion.
 */
export default function BalanceTicker({ value = 0, prefix = '₹' }) {
    const formattedValue = new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0
    }).format(value);

    const digits = formattedValue.split('');
    const [prevDigits, setPrevDigits] = useState(digits);
    const [flipKeys, setFlipKeys] = useState({});
    const isInitial = useRef(true);

    useEffect(() => {
        if (isInitial.current) {
            isInitial.current = false;
            // Trigger initial flip for all digits
            const keys = {};
            digits.forEach((_, i) => { keys[i] = Date.now() + i; });
            setFlipKeys(keys);
            setPrevDigits(digits);
            return;
        }

        const newKeys = { ...flipKeys };
        digits.forEach((d, i) => {
            if (d !== prevDigits[i]) {
                newKeys[i] = Date.now() + i;
            }
        });
        setFlipKeys(newKeys);
        setPrevDigits(digits);
    }, [formattedValue]);

    return (
        <div
            className="flex items-baseline gap-0.5"
            aria-label={`${prefix}${formattedValue}`}
            role="status"
        >
            {/* Currency prefix */}
            <span className="text-2xl sm:text-3xl font-extrabold text-primary mr-1">
                {prefix}
            </span>

            {/* Individual digits */}
            {digits.map((char, i) => {
                const isDigit = /\d/.test(char);

                if (!isDigit) {
                    // Separator (comma, period)
                    return (
                        <span
                            key={`sep-${i}`}
                            className="text-2xl sm:text-4xl font-extrabold text-foreground/40 mx-0.5"
                        >
                            {char}
                        </span>
                    );
                }

                return (
                    <span
                        key={flipKeys[i] || i}
                        className="digit-container"
                    >
                        <span className="digit-flip text-3xl sm:text-5xl font-black text-foreground tracking-tighter">
                            {char}
                        </span>
                    </span>
                );
            })}
        </div>
    );
}
