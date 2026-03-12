import React from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

const MOCK_CHART_DATA = [
    { name: 'Week 1', amount: 45000, profit: 12000 },
    { name: 'Week 2', amount: 52000, profit: 15000 },
    { name: 'Week 3', amount: 38000, profit: 9000 },
    { name: 'Week 4', amount: 61000, profit: 18000 },
    { name: 'Week 5', amount: 55000, profit: 16000 },
    { name: 'Week 6', amount: 72000, profit: 22000 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="premium-card p-4 text-sm space-y-1 min-w-[160px]">
                <p className="text-foreground/40 text-xs font-bold uppercase tracking-wider">{label}</p>
                <p className="text-foreground font-bold">
                    Capital: <span className="text-primary">₹{payload[0]?.value?.toLocaleString('en-IN')}</span>
                </p>
                {payload[1] && (
                    <p className="text-foreground font-bold">
                        Profit: <span className="text-success">₹{payload[1]?.value?.toLocaleString('en-IN')}</span>
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export default function DashboardChart() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="premium-card p-6 sm:p-8"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
                <div>
                    <h3 className="text-xl font-extrabold tracking-tight text-foreground">Collection Trends</h3>
                    <p className="text-foreground/30 text-sm font-medium mt-0.5">Weekly capital & profit analytics</p>
                </div>
                <select
                    className="bg-white/5 border border-border rounded-lg px-3 py-2 text-xs font-bold text-foreground/60 outline-none focus:border-primary/40 transition-colors cursor-pointer"
                    aria-label="Select time range"
                >
                    <option>Last 30 Days</option>
                    <option>Last 6 Months</option>
                </select>
            </div>
            <div className="h-[320px] sm:h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_CHART_DATA}>
                        <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(167, 139, 250, 0.08)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#7C3AED"
                            fillOpacity={1}
                            fill="url(#colorAmount)"
                            strokeWidth={3}
                            animationDuration={2000}
                        />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            stroke="#10B981"
                            fillOpacity={1}
                            fill="url(#colorProfit)"
                            strokeWidth={3}
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
