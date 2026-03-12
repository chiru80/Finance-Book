import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    ArrowUpRight,
    Phone,
    Users,
    ChevronRight,
    Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/calculations';
import { customerService } from '../services/customerService';

const StatusBadge = ({ status }) => {
    const styles = {
        'paid': 'bg-success/10 text-success border-success/20',
        'due-soon': 'bg-warning/10 text-warning border-warning/20',
        'overdue': 'bg-danger/10 text-danger border-danger/20',
        'active': 'bg-primary/10 text-primary border-primary/20',
    };
    return (
        <span
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.active}`}
        >
            {status ? status.replace('-', ' ') : 'active'}
        </span>
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
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                    Customers
                </h1>
                <p className="text-sm text-foreground/40 mt-1 font-medium">
                    Manage and monitor all customer accounts
                </p>
            </motion.div>

            {/* Search & Filters */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col md:flex-row gap-4 items-center premium-card p-4 sm:p-5"
            >
                <div className="relative w-full md:w-[400px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors" size={18} aria-hidden="true" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        className="w-full border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl pl-11 pr-4 py-3 outline-none transition-all text-sm font-medium text-foreground"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search customers"
                    />
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-5 py-3 border border-border rounded-xl text-foreground/50 hover:text-foreground hover:bg-white/5 font-bold text-sm transition-all"
                >
                    <Filter size={16} aria-hidden="true" />
                    <span>Filter</span>
                </motion.button>
            </motion.div>

            {/* Customers List */}
            <div className="premium-card overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <div className="h-14 w-14 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                        <p className="text-foreground/30 text-sm font-medium">Loading customers...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="h-20 w-20 mx-auto rounded-2xl flex items-center justify-center text-foreground/15 border border-border"
                            style={{ background: 'rgba(255,255,255,0.03)' }}
                        >
                            <Users size={40} aria-hidden="true" />
                        </motion.div>
                        <h3 className="text-xl font-bold">No customers found</h3>
                        <p className="text-foreground/40 text-sm">Try a different search or add a new customer.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border text-foreground/30 text-[11px] font-bold uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th className="px-6 py-4">Customer</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Balance</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <motion.tbody
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="divide-y divide-border/30"
                                >
                                    {filteredCustomers.map((customer) => (
                                        <motion.tr
                                            key={customer.id}
                                            variants={itemVariants}
                                            className="hover:bg-white/[0.02] transition-all cursor-pointer group"
                                            onClick={() => navigate(`/customers/${customer.id}`)}
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-11 w-11 rounded-xl flex items-center justify-center font-bold text-lg border border-primary/20 text-primary"
                                                        style={{ background: 'rgba(124,58,237,0.1)' }}
                                                    >
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">{customer.name}</p>
                                                        <p className="text-[10px] text-foreground/25 font-medium mt-0.5">ID: {customer.id.slice(0, 10)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2 text-sm text-foreground/50 font-medium">
                                                    <Phone size={14} className="text-primary/60" aria-hidden="true" />
                                                    {customer.phone}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <StatusBadge status={customer.status} />
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="font-bold text-foreground">{formatCurrency(customer.remainingBalance || 0)}</p>
                                                <div className="w-24 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (customer.totalPaid / customer.loanAmount) * 100)}%` }}
                                                        transition={{ duration: 1.2, ease: "circOut" }}
                                                        className="h-full rounded-full"
                                                        style={{ background: 'linear-gradient(90deg, #7C3AED, #A78BFA)' }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/customers/${customer.id}`); }}
                                                    className="px-4 py-2 rounded-lg text-foreground/40 hover:text-primary hover:bg-primary/10 transition-all inline-flex items-center gap-2 font-bold text-xs border border-border/50"
                                                    aria-label={`View details for ${customer.name}`}
                                                >
                                                    View <ChevronRight size={14} aria-hidden="true" />
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </motion.tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="lg:hidden divide-y divide-border/20"
                        >
                            {filteredCustomers.map((customer) => (
                                <motion.div
                                    key={customer.id}
                                    variants={itemVariants}
                                    onClick={() => navigate(`/customers/${customer.id}`)}
                                    className="p-5 hover:bg-white/[0.02] transition-all cursor-pointer group active:scale-[0.99]"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg border border-primary/20 text-primary"
                                                style={{ background: 'rgba(124,58,237,0.1)' }}
                                            >
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{customer.name}</h3>
                                                <p className="text-xs text-foreground/30 flex items-center gap-1.5 mt-0.5 font-medium">
                                                    <Phone size={12} className="text-primary/60" aria-hidden="true" /> {customer.phone}
                                                </p>
                                            </div>
                                        </div>
                                        <StatusBadge status={customer.status} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl border border-border/30" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            <p className="text-[10px] text-foreground/25 uppercase font-bold tracking-wider mb-1">Balance</p>
                                            <p className="text-base font-bold text-foreground">{formatCurrency(customer.remainingBalance || 0)}</p>
                                        </div>
                                        <div className="p-3 rounded-xl border border-border/30" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            <p className="text-[10px] text-foreground/25 uppercase font-bold tracking-wider mb-1">Installment</p>
                                            <p className="text-base font-bold text-primary">{formatCurrency(customer.installmentAmount || 0)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-end text-xs font-bold text-foreground/20 group-hover:text-primary transition-colors">
                                        <span>View Details</span>
                                        <ArrowUpRight size={14} className="ml-1" aria-hidden="true" />
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}
