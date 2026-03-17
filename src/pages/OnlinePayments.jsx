import React, { useState, useEffect } from 'react';
import { 
    CreditCard, 
    Smartphone, 
    SmartphoneNfc, 
    Building2,
    Calendar,
    ArrowUpRight,
    TrendingUp,
    Search,
    History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { customerService } from '../services/customerService';
import { formatCurrency } from '../utils/calculations';

export default function OnlinePayments() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAllPayments = async () => {
            try {
                // Fetch directly from onlinePayments collection
                const online = await customerService.getOnlinePayments();
                setPayments(online);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllPayments();
    }, []);

    const totalsByMode = payments.reduce((acc, p) => {
        const mode = p.method?.toLowerCase() || 'upi';
        acc[mode] = (acc[mode] || 0) + Number(p.amount);
        return acc;
    }, {});

    const totalOnline = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const filteredPayments = payments.filter(p => 
        p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.method || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1 }
    };

    return (
        <div className="space-y-10">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-extrabold tracking-tight">Digital Payments</h1>
                <p className="text-sm text-foreground/40 font-medium mt-1">Real-time tracking for online collections</p>
            </motion.div>

            {/* Summary Grid */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                <SummaryCard 
                    label="Total Online" 
                    value={totalOnline} 
                    icon={TrendingUp} 
                    color="text-primary" 
                    bg="bg-primary/10" 
                />
                <SummaryCard 
                    label="PhonePe" 
                    value={totalsByMode['phonepe'] || 0} 
                    icon={Smartphone} 
                    color="text-success" 
                    bg="bg-success/10" 
                />
                <SummaryCard 
                    label="GPay / UPI" 
                    value={(totalsByMode['gpay'] || 0) + (totalsByMode['upi'] || 0)} 
                    icon={SmartphoneNfc} 
                    color="text-accent-light" 
                    bg="bg-accent-light/10" 
                />
                <SummaryCard 
                    label="Bank Transfer" 
                    value={totalsByMode['bank'] || 0} 
                    icon={Building2} 
                    color="text-warning" 
                    bg="bg-warning/10" 
                />
            </motion.div>

            {/* List and Search */}
            <div className="premium-card">
                <div className="p-6 border-b border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <History size={20} className="text-primary" />
                        <h3 className="text-xl font-bold">Transaction History</h3>
                    </div>
                    <div className="relative group w-full md:w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search name or method..."
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-border rounded-xl text-xs font-semibold outline-none focus:border-primary/40 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <div className="h-12 w-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                        <p className="text-foreground/30 font-medium">Fetching online history...</p>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="p-20 text-center text-foreground/20 font-bold uppercase tracking-widest">No online transactions recorded</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.01] text-[10px] uppercase font-black text-foreground/20 tracking-[0.2em] border-b border-border/20">
                                <tr>
                                    <th className="px-8 py-5">Customer</th>
                                    <th className="px-8 py-5">Method</th>
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/10">
                                {filteredPayments.map((p, i) => (
                                    <motion.tr 
                                        key={p.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-white/5 border border-border flex items-center justify-center font-bold text-foreground/40">
                                                    {p.customerName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">{p.customerName}</p>
                                                    <p className="text-[10px] font-bold text-foreground/25 uppercase tracking-wider">{p.village}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-white/5 border border-border rounded-lg text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                                    {p.method}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-medium text-foreground/30">
                                            {p.date}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="font-extrabold text-success text-lg">
                                                +{formatCurrency(p.amount)}
                                            </p>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function SummaryCard({ label, value, icon: Icon, color, bg }) {
    return (
        <motion.div 
            variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
            className="premium-card p-6 flex flex-col justify-between"
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${bg} ${color}`}>
                    <Icon size={24} />
                </div>
                <ArrowUpRight size={18} className="text-foreground/10" />
            </div>
            <div>
                <p className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em] mb-1">{label}</p>
                <div className="text-2xl font-black text-foreground">{formatCurrency(value)}</div>
            </div>
        </motion.div>
    );
}
