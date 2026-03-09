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
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.active}`}>
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
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-6">
            {/* Header with Search & Filters */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row gap-4 justify-between items-center glass-card p-4 sm:p-6"
            >
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-primary/50 rounded-2xl pl-12 pr-4 py-3 outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/5 border border-border rounded-2xl text-text-muted font-bold hover:bg-primary/10 hover:text-primary transition-all text-sm">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                </div>
            </motion.div>

            {/* Customers List / Table */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-text-muted font-medium animate-pulse">Retrieving accounts...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="p-20 text-center space-y-6">
                        <div className="h-24 w-24 mx-auto bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center text-text-muted">
                            <Users size={40} />
                        </div>
                        <div className="max-w-xs mx-auto space-y-2">
                            <h3 className="text-xl font-bold">No Customers Found</h3>
                            <p className="text-text-muted text-sm">Create your first customer account to start tracking payments.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border text-text-muted text-[11px] font-bold uppercase tracking-[0.2em] bg-gray-50/50 dark:bg-white/[0.02]">
                                        <th className="px-8 py-5">Account Name</th>
                                        <th className="px-8 py-5">Contact Details</th>
                                        <th className="px-8 py-5">Risk Status</th>
                                        <th className="px-8 py-5">Remaining Balance</th>
                                        <th className="px-8 py-5 text-right">Ledger</th>
                                    </tr>
                                </thead>
                                <motion.tbody
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="divide-y divide-border"
                                >
                                    {filteredCustomers.map((customer) => (
                                        <motion.tr
                                            key={customer.id}
                                            variants={itemVariants}
                                            whileHover={{ backgroundColor: "rgba(0,0,0,0.01)" }}
                                            className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors group cursor-default"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/10">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-card-foreground">{customer.name}</p>
                                                        <p className="text-xs text-text-muted font-medium mt-0.5">ID: #{customer.id.slice(0, 8)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
                                                        <Phone size={14} className="text-primary/60" />
                                                        {customer.phone}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-text-muted opacity-60">
                                                        <Mail size={14} />
                                                        user@example.com
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <StatusBadge status={customer.status} />
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-lg font-bold text-card-foreground">
                                                    {formatCurrency(customer.remainingBalance || 0)}
                                                </p>
                                                <div className="w-24 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (customer.totalPaid / customer.loanAmount) * 100)}%` }}
                                                        className="h-full bg-primary"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => navigate(`/customers/${customer.id}`)}
                                                    className="px-4 py-2 bg-transparent hover:bg-primary/10 text-text-muted hover:text-primary rounded-xl transition-all inline-flex items-center gap-2 font-bold text-sm group/btn"
                                                >
                                                    Details <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </motion.tbody>
                            </table>
                        </div>

                        {/* Mobile/Tablet Card View */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="lg:hidden divide-y divide-border"
                        >
                            {filteredCustomers.map((customer) => (
                                <motion.div
                                    key={customer.id}
                                    variants={itemVariants}
                                    onClick={() => navigate(`/customers/${customer.id}`)}
                                    className="p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer group active:scale-[0.98]"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">{customer.name}</h3>
                                                <p className="text-sm text-text-muted flex items-center gap-1.5 mt-0.5 font-medium">
                                                    <Phone size={14} /> {customer.phone}
                                                </p>
                                            </div>
                                        </div>
                                        <StatusBadge status={customer.status} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-border/50">
                                            <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Balance</p>
                                            <p className="text-lg font-black text-card-foreground">{formatCurrency(customer.remainingBalance || 0)}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-border/50">
                                            <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Installment</p>
                                            <p className="text-lg font-black text-primary">{formatCurrency(customer.installmentAmount || 0)}</p>
                                        </div>
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
