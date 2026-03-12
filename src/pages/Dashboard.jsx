import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
    TrendingUp,
    Users,
    AlertCircle,
    CheckCircle2,
    Calendar,
    ArrowRight,
    Wallet,
    PiggyBank
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/calculations';
import { customerService } from '../services/customerService';
import { useNavigate } from 'react-router-dom';
import KPICard from '../components/KPICard';
import BalanceTicker from '../components/BalanceTicker';

// Lazy load Recharts for bundle optimization
const ChartSection = lazy(() => import('../components/DashboardChart'));

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalCustomers: 0,
        outstanding: 0,
        received: 0,
        onTime: '0%',
        totalCapital: 0
    });
    const [upcomingDues, setUpcomingDues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('month');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const customers = await customerService.getCustomers();
                const totalOutstanding = customers.reduce((sum, c) => sum + (Number(c.remainingBalance) || 0), 0);
                const totalReceived = customers.reduce((sum, c) => sum + (Number(c.totalPaid) || 0), 0);
                const totalCapital = customers.reduce((sum, c) => sum + (Number(c.loanAmount) || 0), 0);
                const onTimeCount = customers.filter(c => c.status === 'paid').length;
                const onTimePercentage = customers.length ? Math.round((onTimeCount / customers.length) * 100) : 0;

                setStats({
                    totalCustomers: customers.length,
                    outstanding: totalOutstanding,
                    received: totalReceived,
                    onTime: `${onTimePercentage}%`,
                    totalCapital
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

    const kpiCards = [
        { label: 'Total Accounts', value: stats.totalCustomers.toString(), icon: Users, color: 'text-accent-light', trend: 'up', trendValue: '+2.4%' },
        { label: 'Outstanding Capital', value: formatCurrency(stats.outstanding), icon: AlertCircle, color: 'text-warning', trend: 'down', trendValue: '-1.2%' },
        { label: 'Revenue Intake', value: formatCurrency(stats.received), icon: TrendingUp, color: 'text-success', trend: 'up', trendValue: '+8.3%' },
        { label: 'Portfolio Health', value: stats.onTime, icon: CheckCircle2, color: 'text-success', trend: 'up', trendValue: '+5.1%' },
        { label: 'Total Capital', value: formatCurrency(stats.totalCapital), icon: PiggyBank, color: 'text-primary', trend: 'up', trendValue: '+3.7%' },
        { label: 'Active Exposure', value: formatCurrency(stats.outstanding + stats.received), icon: Wallet, color: 'text-accent-light', trend: 'up', trendValue: '+4.5%' },
    ];

    const dateRanges = ['today', 'week', 'month', 'custom'];

    return (
        <div className="space-y-10">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                        Company Overview
                    </h1>
                    <p className="text-sm text-foreground/40 mt-1 font-medium">
                        Real-time financial analytics dashboard
                    </p>
                </div>

                {/* Date Range Tabs */}
                <div className="flex bg-surface/80 p-1 rounded-xl border border-border gap-0.5" role="tablist">
                    {dateRanges.map((range) => (
                        <button
                            key={range}
                            role="tab"
                            aria-selected={dateRange === range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                dateRange === range
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-foreground/40 hover:text-foreground/70'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Balance Ticker Hero */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="premium-card p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
            >
                <div>
                    <p className="text-xs font-bold text-foreground/30 uppercase tracking-[0.2em] mb-3">
                        Total Portfolio Value
                    </p>
                    <BalanceTicker value={stats.totalCapital} />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl text-sm font-bold border border-success/20">
                    <TrendingUp size={16} aria-hidden="true" />
                    <span>+4.5% vs last period</span>
                </div>
            </motion.div>

            {/* KPI Grid — 6 cols desktop, 3 tablet, 2 mobile, 1 small */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
                {kpiCards.map((card, i) => (
                    <KPICard key={i} index={i} {...card} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Section */}
                <Suspense fallback={
                    <div className="lg:col-span-2 premium-card p-10 h-[450px] flex items-center justify-center">
                        <div className="relative">
                            <div className="h-14 w-14 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <TrendingUp size={18} className="text-primary animate-pulse" />
                            </div>
                        </div>
                    </div>
                }>
                    <div className="lg:col-span-2">
                        <ChartSection />
                    </div>
                </Suspense>

                {/* Upcoming Dues List */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="premium-card p-6 sm:p-8 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                        <div>
                            <h3 className="text-xl font-extrabold tracking-tight">Priority Alerts</h3>
                            <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest mt-1">Real-time</p>
                        </div>
                        <span className="px-3 py-1.5 bg-danger/10 text-danger text-[10px] font-bold rounded-lg animate-pulse border border-danger/20">
                            LIVE
                        </span>
                    </div>

                    <div className="space-y-4 flex-1">
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 rounded-xl shimmer" />
                                ))}
                            </div>
                        ) : upcomingDues.length === 0 ? (
                            <div className="text-center py-10 space-y-4">
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="h-20 w-20 mx-auto bg-success/10 rounded-2xl flex items-center justify-center text-success border border-success/20"
                                >
                                    <CheckCircle2 size={40} aria-hidden="true" />
                                </motion.div>
                                <div>
                                    <p className="text-lg font-bold">All Clear</p>
                                    <p className="text-foreground/40 text-sm">No overdue accounts.</p>
                                </div>
                            </div>
                        ) : upcomingDues.map((due) => (
                            <motion.div
                                key={due.id}
                                whileHover={{ x: 4 }}
                                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-border"
                                onClick={() => navigate(`/customers/${due.id}`)}
                            >
                                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                                    due.status === 'overdue'
                                        ? 'bg-danger/10 text-danger'
                                        : 'bg-warning/10 text-warning'
                                }`}>
                                    <Calendar size={20} aria-hidden="true" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-foreground truncate">{due.name}</p>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                                        due.status === 'overdue' ? 'text-danger' : 'text-warning'
                                    }`}>
                                        {due.status === 'overdue' ? 'Overdue' : 'Due Soon'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${due.status === 'overdue' ? 'text-danger' : 'text-warning'}`}>
                                        {formatCurrency(due.installmentAmount)}
                                    </p>
                                    <ArrowRight size={14} className="ml-auto mt-1 opacity-0 group-hover:opacity-100 text-foreground/30 transition-opacity" aria-hidden="true" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {upcomingDues.length > 0 && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/customers')}
                            className="w-full mt-6 py-4 rounded-xl bg-white/5 hover:bg-primary/10 hover:text-primary text-foreground/40 font-bold transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-border/50"
                        >
                            View All <ArrowRight size={14} aria-hidden="true" />
                        </motion.button>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
