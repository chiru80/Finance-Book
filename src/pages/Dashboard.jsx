import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    AlertCircle,
    CheckCircle2,
    Calendar,
    ArrowRight
} from 'lucide-react';
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
import { formatCurrency } from '../utils/calculations';
import { customerService } from '../services/customerService';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, color, bg, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="glass-card p-6 flex items-start justify-between group cursor-default"
    >
        <div>
            <p className="text-text-muted font-medium text-sm mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-card-foreground">{value}</h3>
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-success">
                <TrendingUp size={12} />
                <span>+4.5% from last month</span>
            </div>
        </div>
        <div className={`p-3 rounded-2xl ${bg} ${color} group-hover:scale-110 transition-transform shadow-sm`}>
            <Icon size={24} />
        </div>
    </motion.div>
);

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalCustomers: 0,
        outstanding: 0,
        received: 0,
        onTime: '0%'
    });
    const [upcomingDues, setUpcomingDues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const customers = await customerService.getCustomers();
                const totalOutstanding = customers.reduce((sum, c) => sum + (Number(c.remainingBalance) || 0), 0);
                const totalReceived = customers.reduce((sum, c) => sum + (Number(c.totalPaid) || 0), 0);
                const onTimeCount = customers.filter(c => c.status === 'paid').length;
                const onTimePercentage = customers.length ? Math.round((onTimeCount / customers.length) * 100) : 0;

                setStats({
                    totalCustomers: customers.length,
                    outstanding: totalOutstanding,
                    received: totalReceived,
                    onTime: `${onTimePercentage}%`
                });

                const dues = customers
                    .filter(c => c.status === 'overdue' || c.status === 'due-soon')
                    .slice(0, 5);
                setUpcomingDues(dues);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const statCards = [
        { label: 'Total Customers', value: stats.totalCustomers.toString(), icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Outstanding', value: formatCurrency(stats.outstanding), icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
        { label: 'Total Received', value: formatCurrency(stats.received), icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
        { label: 'Account Health', value: stats.onTime, icon: CheckCircle2, color: 'text-secondary', bg: 'bg-secondary/10' },
    ];

    const MOCK_CHART_DATA = [
        { name: 'Week 1', amount: 45000 },
        { name: 'Week 2', amount: 52000 },
        { name: 'Week 3', amount: 38000 },
        { name: 'Week 4', amount: 61000 },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => <StatCard key={i} index={i} {...stat} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <motion.div
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
                </motion.div>

                {/* Real Upcoming Dues List */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="glass-card p-6 sm:p-8 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold">Critical Alerts</h3>
                        <span className="px-2.5 py-1 bg-danger/10 text-danger text-xs font-bold rounded-full animate-pulse">
                            Live
                        </span>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-4 flex-1"
                    >
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 rounded-2xl shimmer opacity-20" />
                                ))}
                            </div>
                        ) : upcomingDues.length === 0 ? (
                            <div className="text-center py-8 space-y-4">
                                <div className="h-20 w-20 mx-auto bg-success/10 rounded-full flex items-center justify-center text-success">
                                    <CheckCircle2 size={40} />
                                </div>
                                <p className="text-text-muted font-medium">All accounts are safe!</p>
                            </div>
                        ) : upcomingDues.map((due) => (
                            <motion.div
                                key={due.id}
                                variants={itemVariants}
                                whileHover={{ x: 5 }}
                                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                                onClick={() => navigate(`/customers/${due.id}`)}
                            >
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${due.status === 'overdue' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                                    }`}>
                                    <Calendar size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-card-foreground truncate">{due.name}</p>
                                    <p className="text-text-muted text-xs font-medium">
                                        {due.status === 'overdue' ? 'Immediate Action' : 'Due this week'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${due.status === 'overdue' ? 'text-danger' : 'text-warning'}`}>
                                        {formatCurrency(due.installmentAmount)}
                                    </p>
                                    <ArrowRight size={14} className="ml-auto mt-1 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {upcomingDues.length > 0 && (
                        <button
                            onClick={() => navigate('/customers')}
                            className="w-full mt-8 py-3.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-primary/10 hover:text-primary text-text-muted font-bold transition-all text-sm flex items-center justify-center gap-2"
                        >
                            View Full List <ArrowRight size={16} />
                        </button>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
