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
import { m } from 'framer-motion';

const MOCK_CHART_DATA = [
    { name: 'Week 1', amount: 45000 },
    { name: 'Week 2', amount: 52000 },
    { name: 'Week 3', amount: 38000 },
    { name: 'Week 4', amount: 61000 },
];

export default function DashboardChart() {
    return (
        <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2 glass-card p-6 sm:p-8"
        >
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold">Collection Trends</h3>
                    <p className="text-text-muted text-sm font-medium">Monthly revenue analytics</p>
                </div>
                <select className="bg-gray-100 dark:bg-white/5 border-none rounded-lg px-3 py-1.5 text-xs font-bold text-text-muted outline-none">
                    <option>Last 30 Days</option>
                    <option>Last 6 Months</option>
                </select>
            </div>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_CHART_DATA}>
                        <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: '16px',
                                boxShadow: 'var(--shadow)'
                            }}
                            itemStyle={{ color: 'var(--card-foreground)', fontWeight: 'bold' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="var(--primary)"
                            fillOpacity={1}
                            fill="url(#colorAmount)"
                            strokeWidth={4}
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </m.div>
    );
}
