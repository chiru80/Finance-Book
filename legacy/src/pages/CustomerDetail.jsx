import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Phone,
    Calendar,
    DollarSign,
    History,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    MoreVertical,
    ChevronRight,
    ArrowDownIcon
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/calculations';
import Modal from '../components/Modal';
import PaymentForm from '../components/PaymentForm';
import { customerService } from '../services/customerService';

export default function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await customerService.getCustomerWithPayments(id);
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    const handlePayment = async (paymentData) => {
        try {
            await customerService.addPayment(id, paymentData);
            setIsModalOpen(false);
            window.location.reload();
        } catch (err) {
            alert('Error recording payment: ' + err.message);
        }
    };

    if (loading) return (
        <div className="p-20 flex flex-col items-center gap-4">
            <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-text-muted font-medium animate-pulse">Loading profile...</p>
        </div>
    );

    if (!data) return (
        <div className="p-20 text-center space-y-4">
            <div className="h-20 w-20 mx-auto bg-danger/10 text-danger rounded-3xl flex items-center justify-center">
                <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-card-foreground">Customer Not Found</h2>
            <button onClick={() => navigate('/customers')} className="text-primary font-bold hover:underline underline-offset-4">
                Back to Customers
            </button>
        </div>
    );

    const { customer, payments } = data;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <m.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-6"
            >
                <m.button
                    whileHover={{ scale: 1.1, x: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/customers')}
                    className="p-4 bg-card hover:bg-secondary border border-border rounded-2xl transition-all text-foreground/40 hover:text-primary shadow-xl shadow-black/5"
                >
                    <ArrowLeft size={24} />
                </m.button>
                <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Entity Analysis</h2>
                    <p className="text-xs text-foreground/40 font-black uppercase tracking-[0.2em] mt-1">Deep metrics for Node #{id.slice(0, 12)}</p>
                </div>
            </m.div>

            <m.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
                {/* Left Column: Stats and Info */}
                <div className="lg:col-span-4 space-y-10">
                    {/* Main Info Card */}
                    <m.div variants={itemVariants} className="premium-card p-10 relative overflow-hidden group">
                        {/* Status Glow Background */}
                        <m.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                            transition={{ repeat: Infinity, duration: 5 }}
                            className={`absolute top-0 right-0 w-48 h-48 blur-[60px] rounded-full -mr-24 -mt-24 opacity-20 ${customer.status === 'overdue' ? 'bg-danger' :
                                customer.status === 'due-soon' ? 'bg-warning' : 'bg-success'
                                }`}
                        />

                        <div className="relative flex flex-col items-center text-center mb-10">
                            <m.div
                                whileHover={{ rotate: 10, scale: 1.1 }}
                                className="h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center text-5xl font-black border-2 border-primary/20 shadow-2xl shadow-primary/10 mb-6"
                            >
                                {customer.name.charAt(0)}
                            </m.div>
                            <h3 className="text-3xl font-black text-foreground tracking-tight">{customer.name}</h3>
                            <div className="flex items-center gap-2 mt-2 bg-secondary/50 px-4 py-1.5 rounded-full border border-border/50">
                                <Phone size={14} className="text-primary" />
                                <span className="text-sm font-black text-foreground/60">{customer.phone}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="p-5 rounded-2xl bg-secondary/50 border border-border/50">
                                <p className="text-[10px] text-foreground/30 font-black uppercase tracking-widest mb-2">Total Exposure</p>
                                <p className="text-xl font-black text-foreground tracking-tight">{formatCurrency(customer.loanAmount)}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-secondary/50 border border-border/50">
                                <p className="text-[10px] text-foreground/30 font-black uppercase tracking-widest mb-2">Remaining</p>
                                <p className={`text-xl font-black tracking-tight ${customer.status === 'overdue' ? 'text-danger' : 'text-warning'}`}>
                                    {formatCurrency(customer.remainingBalance)}
                                </p>
                            </div>
                        </div>

                        <m.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsModalOpen(true)}
                            className="w-full mt-10 py-5 bg-primary text-white rounded-2xl font-black transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 border-b-4 border-primary-foreground/20 hover:border-b-0 hover:translate-y-1 active:border-b-0"
                        >
                            <DollarSign size={22} />
                            <span>Inject Payment</span>
                        </m.button>
                    </m.div>

                    {/* Detailed Stats */}
                    <m.div variants={itemVariants} className="premium-card p-10 space-y-10 bg-card/50">
                        <div className="flex items-center justify-between border-b border-border/50 pb-6">
                            <h4 className="text-xs font-black text-foreground/30 uppercase tracking-[0.25em]">Vault Summary</h4>
                            <div className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                        </div>
                        <div className="space-y-6">
                            {[
                                { label: 'Inception', value: customer.startDate, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                { label: 'Cycle Rate', value: 'Weekly Protocol', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                { label: 'Installment', value: formatCurrency(customer.installmentAmount), icon: CreditCard, color: 'text-green-500', bg: 'bg-green-500/10' },
                                { label: 'Total Sourced', value: formatCurrency(customer.totalPaid), icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-2.5 rounded-xl transition-all group-hover:scale-110", item.bg, item.color)}>
                                            <item.icon size={18} />
                                        </div>
                                        <span className="text-[13px] font-black text-foreground/40 uppercase tracking-widest">{item.label}</span>
                                    </div>
                                    <span className="font-black text-foreground tracking-tight text-lg">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </m.div>
                </div>

                {/* Right Column: Payment History */}
                <m.div
                    variants={itemVariants}
                    className="lg:col-span-8 premium-card overflow-hidden h-fit bg-card/20 border-white/5"
                >
                    <div className="p-10 border-b border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-secondary/10 backdrop-blur-md">
                        <div>
                            <div className="flex items-center gap-3">
                                <History size={24} className="text-primary" />
                                <h3 className="text-2xl font-black tracking-tight text-foreground">
                                    Verified Ledger
                                </h3>
                            </div>
                            <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mt-2">Authenticated Transaction history</p>
                        </div>
                        <div className="px-5 py-2.5 bg-success/10 text-success text-[10px] font-black rounded-xl border border-success/20 shadow-xl shadow-success/5 tracking-widest">
                            {payments.length} SUCCESSFUL HANDSHAKES
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border text-foreground/30 text-[10px] font-black uppercase tracking-[0.25em] bg-secondary/20">
                                    <th className="px-10 py-5">IDENTIFIER</th>
                                    <th className="px-10 py-5">TIMESTAMP</th>
                                    <th className="px-10 py-5">PROTOCOL</th>
                                    <th className="px-10 py-5 text-right">CREDIT AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {payments.map((payment, index) => (
                                    <m.tr
                                        key={payment.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-secondary/30 transition-all duration-300 group"
                                    >
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center border border-success/10 group-hover:bg-success group-hover:text-white transition-all">
                                                    <CheckCircle2 size={18} />
                                                </div>
                                                <span className="font-black text-foreground text-sm tracking-tight">
                                                    {payment.installmentNumber ? `INSTALLMENT #${payment.installmentNumber}` : 'DIRECT FLOW'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-foreground/40 text-[13px] font-black tracking-widest">{payment.paymentDate}</td>
                                        <td className="px-10 py-8">
                                            <span className="px-3 py-1.5 rounded-xl bg-secondary border border-border text-[10px] font-black text-foreground/40 tracking-widest uppercase">
                                                {payment.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <p className="font-black text-success text-xl tracking-tight leading-none">
                                                +{formatCurrency(payment.amount)}
                                            </p>
                                            <span className="text-[10px] text-foreground/20 font-black uppercase tracking-widest mt-1.5 block">VERIFIED SYSTEM ENTRY</span>
                                        </td>
                                    </m.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {payments.length === 0 && (
                        <div className="p-32 text-center flex flex-col items-center gap-6">
                            <m.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                                className="h-24 w-24 bg-secondary rounded-[2rem] flex items-center justify-center text-foreground/10 border border-border"
                            >
                                <History size={48} />
                            </m.div>
                            <p className="text-foreground/40 font-black uppercase tracking-[0.25em] text-xs">No entries found in current ledger.</p>
                        </div>
                    )}

                    <div className="p-10 bg-secondary/20 border-t border-border/50 flex justify-center backdrop-blur-md">
                        <m.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-[11px] font-black text-foreground/40 hover:text-primary transition-all flex items-center gap-3 uppercase tracking-[0.25em]"
                        >
                            Export Intelligence Statement <ArrowDownIcon size={18} className="animate-bounce" />
                        </m.button>
                    </div>
                </m.div>
            </m.div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`New Transaction for ${customer.name}`}
            >
                <PaymentForm
                    customer={customer}
                    onSubmit={handlePayment}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
