import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
    TrendingUp,
    Users,
    AlertCircle,
    CheckCircle2,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { m } from 'framer-motion';
import { formatCurrency } from '../utils/calculations';
import { customerService } from '../services/customerService';
import { useNavigate } from 'react-router-dom';

// Lazy load Recharts for bundle optimization
const ChartSection = lazy(() => import('../components/DashboardChart'));

const StatCard = ({ label, value, icon: Icon, color, bg, index }) => (
    <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
        whileHover={{
            y: -10,
            scale: 1.02,
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            transition: { duration: 0.3 }
        }}
        className="premium-card p-8 flex items-start justify-between group cursor-default relative overflow-hidden"
    >
        <div className="relative z-10">
            <p className="text-text-muted font-bold text-xs uppercase tracking-widest mb-2">{label}</p>
            <h3 className="text-3xl font-black text-foreground">{value}</h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-success bg-success/10 w-fit px-2 py-1 rounded-lg">
                <TrendingUp size={14} />
                <span>+4.5%</span>
            </div>
        </div>
        <div className={`p-4 rounded-2xl ${bg} ${color} group-hover:rotate-12 transition-all duration-500 shadow-lg relative z-10`}>
            <Icon size={28} />
        </div>

        {/* Subtle background decoration */}
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 blur-2xl ${bg}`} />
    </m.div>
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
        { label: 'Total Accounts', value: stats.totalCustomers.toString(), icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Outstanding Capital', value: formatCurrency(stats.outstanding), icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
        { label: 'Revenue Intake', value: formatCurrency(stats.received), icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
        { label: 'Portfolio Health', value: stats.onTime, icon: CheckCircle2, color: 'text-secondary', bg: 'bg-secondary/10' },
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
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <div className="space-y-12">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {statCards.map((stat, i) => <StatCard key={i} index={i} {...stat} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Chart Section */}
                <Suspense fallback={
                    <div className="lg:col-span-2 premium-card p-10 h-[500px] flex items-center justify-center">
                        <div className="relative">
                            <div className="h-16 w-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <TrendingUp size={20} className="text-primary animate-pulse" />
                            </div>
                        </div>
                    </div>
                }>
                    <div className="lg:col-span-2">
                        <ChartSection />
                    </div>
                </Suspense>

                {/* Upcoming Dues List */}
                <m.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="premium-card p-8 flex flex-col bg-card/50 backdrop-blur-3xl border-white/5"
                >
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
                        <div>
                            <h3 className="text-2xl font-black tracking-tight">Priority Alerts</h3>
                            <p className="text-xs text-foreground/40 font-bold uppercase tracking-widest mt-1">Real-time Analysis</p>
                        </div>
                        <span className="px-3 py-1.5 bg-danger/10 text-danger text-[10px] font-black rounded-lg animate-pulse border border-danger/20">
                            LIVE
                        </span>
                    </div>

                    <m.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-6 flex-1"
                    >
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-20 rounded-2xl bg-secondary/30 animate-pulse" />
                                ))}
                            </div>
                        ) : upcomingDues.length === 0 ? (
                            <div className="text-center py-12 space-y-6">
                                <m.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    className="h-24 w-24 mx-auto bg-success/10 rounded-[2rem] flex items-center justify-center text-success border border-success/20 shadow-xl shadow-success/10"
                                >
                                    <CheckCircle2 size={48} />
                                </m.div>
                                <div className="space-y-2">
                                    <p className="text-xl font-bold">Safe Horizon</p>
                                    <p className="text-text-muted text-sm px-4">All accounts are currently within compliance thresholds.</p>
                                </div>
                            </div>
                        ) : upcomingDues.map((due) => (
                            <m.div
                                key={due.id}
                                variants={itemVariants}
                                whileHover={{ x: 10, backgroundColor: "rgba(var(--primary-rgb), 0.03)" }}
                                className="flex items-center gap-5 p-4 rounded-2xl hover:bg-secondary/50 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer group border border-transparent hover:border-border"
                                onClick={() => navigate(`/customers/${due.id}`)}
                            >
                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${due.status === 'overdue' ? 'bg-danger/10 text-danger shadow-danger/10' : 'bg-warning/10 text-warning shadow-warning/10'
                                    }`}>
                                    <Calendar size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-foreground truncate text-lg tracking-tight">{due.name}</p>
                                    <m.div
                                        initial={false}
                                        className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider mt-1 ${due.status === 'overdue' ? 'text-danger' : 'text-warning'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${due.status === 'overdue' ? 'bg-danger' : 'bg-warning'} animate-pulse`} />
                                        {due.status === 'overdue' ? 'Critical Action Required' : 'Upcoming Compliance'}
                                    </m.div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-black text-lg ${due.status === 'overdue' ? 'text-danger' : 'text-warning'}`}>
                                        {formatCurrency(due.installmentAmount)}
                                    </p>
                                    <m.div
                                        whileHover={{ x: 3 }}
                                        className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300"
                                    >
                                        <span className="text-[10px] font-black text-foreground/40">ANALYZE</span>
                                        <ArrowRight size={12} className="text-foreground/40" />
                                    </m.div>
                                </div>
                            </m.div>
                        ))}
                    </m.div>

                    {upcomingDues.length > 0 && (
                        <m.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/customers')}
                            className="w-full mt-10 py-5 rounded-2xl bg-secondary/50 hover:bg-primary/10 hover:text-primary text-foreground/40 font-black transition-all duration-300 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 border border-border/50"
                        >
                            View Intelligence Report <ArrowRight size={16} />
                        </m.button>
                    )}
                </m.div>
            </div>
        </div>
    );
}
