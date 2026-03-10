import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    ArrowUpRight,
    Phone,
    UserPlus,
    ChevronRight,
    MoreVertical,
    Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/calculations';
import { customerService } from '../services/customerService';

const StatusBadge = ({ status }) => {
    const styles = {
        'paid': 'bg-success/10 text-success border-success/20 shadow-success/5',
        'due-soon': 'bg-warning/10 text-warning border-warning/20 shadow-warning/5',
        'overdue': 'bg-danger/10 text-danger border-danger/20 shadow-danger/5',
        'active': 'bg-primary/10 text-primary border-primary/20 shadow-primary/5',
    };
    return (
        <m.span
            initial={false}
            animate={{ scale: [0.95, 1] }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-sm ${styles[status] || styles.active}`}
        >
            {status ? status.replace('-', ' ') : 'active'}
        </m.span>
    );
};

export default function Customers() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await customerService.getCustomers();
                setCustomers(data);
            } catch (err) {
                console.error('Error fetching customers:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <div className="space-y-10">
            {/* Header with Search & Filters */}
            <m.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col md:flex-row gap-6 justify-between items-center premium-card p-6"
            >
                <div className="relative w-full md:w-[450px] group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search portfolios, IDs, or contacts..."
                        className="w-full bg-secondary/50 border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl pl-14 pr-6 py-4 outline-none transition-all text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <m.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-card border border-border rounded-2xl text-foreground font-black hover:bg-secondary transition-all text-xs uppercase tracking-[0.15em] shadow-sm"
                    >
                        <Filter size={18} />
                        <span>Filter Intelligence</span>
                    </m.button>
                </div>
            </m.div>

            {/* Customers List / Table */}
            <div className="premium-card overflow-hidden bg-card/30 border-white/5">
                {loading ? (
                    <div className="p-32 flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="h-16 w-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                            <Users size={24} className="absolute inset-0 m-auto text-primary/40 animate-pulse" />
                        </div>
                        <p className="text-foreground/40 text-xs font-black uppercase tracking-widest animate-pulse">Syncing Distributed Ledgers...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="p-32 text-center space-y-8">
                        <m.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="h-28 w-28 mx-auto bg-secondary/50 rounded-[2.5rem] flex items-center justify-center text-foreground/20 border border-border shadow-inner"
                        >
                            <Users size={48} />
                        </m.div>
                        <div className="max-w-xs mx-auto space-y-3">
                            <h3 className="text-2xl font-black tracking-tight">Zero Datapoints</h3>
                            <p className="text-foreground/40 text-sm font-medium">No active accounts matching your search parameters were found in the current environment.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border text-foreground/30 text-[10px] font-black uppercase tracking-[0.25em] bg-secondary/20 backdrop-blur-md">
                                        <th className="px-10 py-6">ENTITY PROFILE</th>
                                        <th className="px-10 py-6">COMMUNICATION CHANNEL</th>
                                        <th className="px-10 py-6">COMPLIANCE STATUS</th>
                                        <th className="px-10 py-6">ACTIVE EXPOSURE</th>
                                        <th className="px-10 py-6 text-right">OPERATIONS</th>
                                    </tr>
                                </thead>
                                <m.tbody
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="divide-y divide-border/50"
                                >
                                    {filteredCustomers.map((customer) => (
                                        <m.tr
                                            key={customer.id}
                                            variants={itemVariants}
                                            whileHover={{ backgroundColor: "rgba(var(--primary-rgb), 0.02)" }}
                                            className="hover:bg-secondary/30 transition-all duration-300 group cursor-default"
                                        >
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-black text-xl border border-primary/10 shadow-lg shadow-primary/5 group-hover:scale-110 transition-transform">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-foreground text-lg tracking-tight group-hover:text-primary transition-colors">{customer.name}</p>
                                                        <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest mt-1">ID: {customer.id.slice(0, 12)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2.5 text-sm text-foreground/60 font-bold">
                                                        <div className="p-1.5 bg-secondary rounded-lg">
                                                            <Phone size={14} className="text-primary" />
                                                        </div>
                                                        {customer.phone}
                                                    </div>
                                                    <div className="flex items-center gap-2.5 text-xs text-foreground/30 font-medium ml-1">
                                                        <Mail size={12} />
                                                        {customer.email || 'encrypted@relay.io'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-8">
                                                <StatusBadge status={customer.status} />
                                            </td>
                                            <td className="px-10 py-8">
                                                <p className="text-xl font-black text-foreground tracking-tight">
                                                    {formatCurrency(customer.remainingBalance || 0)}
                                                </p>
                                                <div className="w-32 h-2 bg-secondary rounded-full mt-3 overflow-hidden border border-border/50">
                                                    <m.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (customer.totalPaid / customer.loanAmount) * 100)}%` }}
                                                        transition={{ duration: 1.5, ease: "circOut" }}
                                                        className="h-full bg-gradient-to-r from-primary to-primary/60"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-10 py-8 text-right">
                                                <m.button
                                                    whileHover={{ scale: 1.05, x: 5 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => navigate(`/customers/${customer.id}`)}
                                                    className="px-6 py-3 bg-secondary rounded-xl text-foreground/60 hover:text-primary hover:bg-primary/10 transition-all inline-flex items-center gap-3 font-black text-xs uppercase tracking-widest group/btn border border-border/50"
                                                >
                                                    Analysis <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                                </m.button>
                                            </td>
                                        </m.tr>
                                    ))}
                                </m.tbody>
                            </table>
                        </div>

                        {/* Mobile/Tablet Card View */}
                        <m.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="lg:hidden divide-y divide-border/50"
                        >
                            {filteredCustomers.map((customer) => (
                                <m.div
                                    key={customer.id}
                                    variants={itemVariants}
                                    onClick={() => navigate(`/customers/${customer.id}`)}
                                    className="p-8 hover:bg-secondary/30 transition-all cursor-pointer group active:scale-[0.98]"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-5">
                                            <div className="h-16 w-16 rounded-[1.25rem] bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-black text-2xl border border-primary/20 shadow-xl shadow-primary/5">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors tracking-tight">{customer.name}</h3>
                                                <p className="text-xs text-foreground/40 flex items-center gap-2 mt-1.5 font-bold uppercase tracking-widest">
                                                    <Phone size={14} className="text-primary" /> {customer.phone}
                                                </p>
                                            </div>
                                        </div>
                                        <StatusBadge status={customer.status} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-5 mt-8">
                                        <div className="p-5 rounded-2xl bg-secondary/50 border border-border/50 group-hover:border-primary/20 transition-colors">
                                            <p className="text-[10px] text-foreground/30 uppercase font-black tracking-[0.2em] mb-2">Exposure</p>
                                            <p className="text-xl font-black text-foreground tracking-tight">{formatCurrency(customer.remainingBalance || 0)}</p>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-secondary/50 border border-border/50 group-hover:border-primary/20 transition-colors">
                                            <p className="text-[10px] text-foreground/30 uppercase font-black tracking-[0.2em] mb-2">Cycle Rate</p>
                                            <p className="text-xl font-black text-primary tracking-tight">{formatCurrency(customer.installmentAmount || 0)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.25em] text-foreground/20">
                                        <span>System Node: {customer.id.slice(0, 8)}</span>
                                        <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
                                            <span>Full Metrics</span>
                                            <ArrowUpRight size={14} />
                                        </div>
                                    </div>
                                </m.div>
                            ))}
                        </m.div>
                    </>
                )}
            </div>
        </div>
    );
}
