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
    ArrowDownIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
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
        const fetchData = async () => {
            try {
                const res = await customerService.getCustomerWithPayments(id);
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
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
            <div className="h-12 w-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <p className="text-foreground/30 font-medium">Loading customer...</p>
        </div>
    );

    if (!data) return (
        <div className="p-20 text-center space-y-4">
            <div className="h-20 w-20 mx-auto bg-danger/10 text-danger rounded-2xl flex items-center justify-center border border-danger/20">
                <AlertCircle size={40} aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Customer Not Found</h2>
            <button onClick={() => navigate('/customers')} className="text-primary font-bold hover:underline underline-offset-4">
                Back to Customers
            </button>
        </div>
    );

    const { customer, payments } = data;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const statItems = [
        { label: 'Start Date', value: customer.startDate, icon: Calendar, color: 'text-accent-light', bg: 'rgba(167,139,250,0.08)' },
        { label: 'Frequency', value: 'Weekly', icon: TrendingUp, color: 'text-primary', bg: 'rgba(124,58,237,0.08)' },
        { label: 'Installment', value: formatCurrency(customer.installmentAmount), icon: CreditCard, color: 'text-success', bg: 'rgba(16,185,129,0.08)' },
        { label: 'Total Paid', value: formatCurrency(customer.totalPaid), icon: CheckCircle2, color: 'text-success', bg: 'rgba(16,185,129,0.08)' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
            >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/customers')}
                    className="p-3 rounded-xl border border-border text-foreground/40 hover:text-primary hover:bg-primary/5 transition-all"
                    aria-label="Back to customers"
                >
                    <ArrowLeft size={22} />
                </motion.button>
                <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Customer Details</h2>
                    <p className="text-xs text-foreground/30 font-medium mt-0.5">Account #{id.slice(0, 10)}</p>
                </div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
                {/* Left Column — Customer Info */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Profile Card */}
                    <motion.div variants={itemVariants} className="premium-card p-8 relative overflow-hidden">
                        {/* Status glow */}
                        <div
                            className={`absolute top-0 right-0 w-40 h-40 blur-[60px] rounded-full -mr-20 -mt-20 opacity-15 ${
                                customer.status === 'overdue' ? 'bg-danger' :
                                customer.status === 'due-soon' ? 'bg-warning' : 'bg-success'
                            }`}
                            aria-hidden="true"
                        />

                        <div className="relative flex flex-col items-center text-center mb-8">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="h-24 w-24 rounded-2xl flex items-center justify-center text-4xl font-bold border border-primary/20 text-primary mb-4"
                                style={{ background: 'rgba(124,58,237,0.1)' }}
                            >
                                {customer.name.charAt(0)}
                            </motion.div>
                            <h3 className="text-2xl font-extrabold text-foreground tracking-tight">{customer.name}</h3>
                            <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-lg border border-border/50 text-foreground/40" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <Phone size={14} className="text-primary/60" aria-hidden="true" />
                                <span className="text-sm font-medium">{customer.phone}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-4 rounded-xl border border-border/30" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <p className="text-[10px] text-foreground/25 uppercase font-bold tracking-wider mb-1">Loan Amount</p>
                                <p className="text-lg font-bold text-foreground">{formatCurrency(customer.loanAmount)}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-border/30" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <p className="text-[10px] text-foreground/25 uppercase font-bold tracking-wider mb-1">Remaining</p>
                                <p className={`text-lg font-bold ${customer.status === 'overdue' ? 'text-danger' : 'text-warning'}`}>
                                    {formatCurrency(customer.remainingBalance)}
                                </p>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsModalOpen(true)}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 text-sm"
                            aria-label={`Record payment for ${customer.name}`}
                        >
                            <DollarSign size={18} aria-hidden="true" />
                            Record Payment
                        </motion.button>
                    </motion.div>

                    {/* Stats Card */}
                    <motion.div variants={itemVariants} className="premium-card p-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-border/30 pb-4">
                            <h4 className="text-xs font-bold text-foreground/30 uppercase tracking-wider">Account Summary</h4>
                            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
                        </div>
                        <div className="space-y-4">
                            {statItems.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${item.color}`} style={{ background: item.bg }}>
                                            <item.icon size={16} aria-hidden="true" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground/40">{item.label}</span>
                                    </div>
                                    <span className="font-bold text-foreground">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column — Payment History */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-8 premium-card overflow-hidden"
                >
                    {/* History Header */}
                    <div className="p-6 border-b border-border/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div>
                            <div className="flex items-center gap-2">
                                <History size={20} className="text-primary" aria-hidden="true" />
                                <h3 className="text-xl font-bold text-foreground">Payment History</h3>
                            </div>
                            <p className="text-xs text-foreground/30 font-medium mt-1">Verified transactions</p>
                        </div>
                        <span className="px-3 py-1.5 bg-success/10 text-success text-xs font-bold rounded-lg border border-success/20">
                            {payments.length} payments
                        </span>
                    </div>

                    {/* Transactions Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border/30 text-foreground/25 text-[11px] font-bold uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.01)' }}>
                                    <th className="px-6 py-4">Transaction</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Method</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {payments.map((payment, index) => (
                                    <motion.tr
                                        key={payment.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className="hover:bg-white/[0.02] transition-all group"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-success/10 text-success flex items-center justify-center border border-success/10 group-hover:bg-success group-hover:text-white transition-all">
                                                    <CheckCircle2 size={16} aria-hidden="true" />
                                                </div>
                                                <span className="font-bold text-foreground text-sm">
                                                    {payment.installmentNumber ? `Installment #${payment.installmentNumber}` : 'Payment'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-foreground/40 text-sm font-medium">{payment.paymentDate}</td>
                                        <td className="px-6 py-5">
                                            <span className="px-2.5 py-1 rounded-lg border border-border/50 text-[11px] font-bold text-foreground/35 uppercase" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                {payment.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <p className="font-bold text-success text-lg">
                                                +{formatCurrency(payment.amount)}
                                            </p>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {payments.length === 0 && (
                        <div className="p-20 text-center flex flex-col items-center gap-4">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                                className="h-16 w-16 rounded-2xl flex items-center justify-center text-foreground/10 border border-border"
                                style={{ background: 'rgba(255,255,255,0.02)' }}
                            >
                                <History size={32} aria-hidden="true" />
                            </motion.div>
                            <p className="text-foreground/30 text-sm font-medium">No payments recorded yet.</p>
                        </div>
                    )}

                    {/* Export button */}
                    <div className="p-5 border-t border-border/20 flex justify-center" style={{ background: 'rgba(255,255,255,0.01)' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-xs font-bold text-foreground/25 hover:text-primary transition-all flex items-center gap-2"
                        >
                            Export Statement <ArrowDownIcon size={14} className="animate-bounce" aria-hidden="true" />
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Payment for ${customer.name}`}
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
