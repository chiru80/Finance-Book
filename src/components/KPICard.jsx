import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ label, value, icon: Icon, color = 'text-primary', trend, trendValue, index = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 200, damping: 22 }}
            className="kpi-card p-6 flex flex-col gap-4 cursor-default group relative overflow-hidden"
            role="article"
            aria-label={`${label}: ${value}`}
        >
            {/* Icon */}
            <div className={`p-3 rounded-xl w-fit ${color} bg-current/10`}
                style={{ backgroundColor: 'rgba(124, 58, 237, 0.08)' }}
            >
                <Icon size={22} aria-hidden="true" className={color} />
            </div>

            {/* Label */}
            <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-[0.15em]">
                {label}
            </p>

            {/* Value */}
            <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${color}`}>
                {value}
            </h3>

            {/* Trend Badge */}
            {trendValue && (
                <div className={`flex items-center gap-1.5 text-xs font-bold w-fit px-2.5 py-1 rounded-lg ${
                    trend === 'up'
                        ? 'text-success bg-success/10'
                        : 'text-danger bg-danger/10'
                }`}>
                    {trend === 'up' ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
                    <span>{trendValue}</span>
                </div>
            )}

            {/* Decorative glow */}
            <div
                className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full opacity-10 blur-3xl pointer-events-none transition-opacity group-hover:opacity-20"
                style={{ background: 'var(--color-primary)' }}
                aria-hidden="true"
            />
        </motion.div>
    );
}
