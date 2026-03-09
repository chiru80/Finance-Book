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
import { motion, AnimatePresence } from 'framer-motion';
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
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
            >
                <button
                    onClick={() => navigate('/customers')}
                    className="p-3 bg-card hover:bg-gray-100 dark:hover:bg-white/5 border border-border rounded-2xl transition-all text-text-muted hover:text-card-foreground shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-card-foreground">Customer Details</h2>
                    <p className="text-sm text-text-muted font-medium">Manage individual installments and history</p>
                </div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
                {/* Left Column: Stats and Info */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Main Info Card */}
                    <motion.div variants={itemVariants} className="glass-card p-6 sm:p-8 relative overflow-hidden group">
                        {/* Background Decoration */}
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16 opacity-20 ${customer.status === 'overdue' ? 'bg-danger' :
                                customer.status === 'due-soon' ? 'bg-warning' : 'bg-success'
                            }`} />

                        <div className="relative flex flex-col items-center text-center mb-8">
                            <div className="h-24 w-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-4xl font-black border-2 border-primary/20 shadow-inner mb-4">
                                {customer.name.charAt(0)}
                            </div>
                            <h3 className="text-2xl font-bold text-card-foreground">{customer.name}</h3>
                            <p className="text-text-muted font-medium flex items-center gap-1.5 mt-1">
                                <Phone size={14} className="text-primary" /> {customer.phone}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-border/50">
                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Total Loan</p>
                                <p className="text-lg font-black text-card-foreground">{formatCurrency(customer.loanAmount)}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-border/50">
                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Remaining</p>
                                <p className={`text-lg font-black ${customer.status === 'overdue' ? 'text-danger' : 'text-warning'}`}>
                                    {formatCurrency(customer.remainingBalance)}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full mt-6 py-4 bg-primary text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <DollarSign size={20} />
                            Record Payment
                        </button>
                    </motion.div>

                    {/* Detailed Stats */}
                    <motion.div variants={itemVariants} className="glass-card p-6 sm:p-8 space-y-6">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Agreement Summary</h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Start Date', value: customer.startDate, icon: Calendar, color: 'text-blue-500' },
                                { label: 'Cycle', value: 'Weekly Payment', icon: TrendingUp, color: 'text-purple-500' },
                                { label: 'Installment', value: formatCurrency(customer.installmentAmount), icon: CreditCard, color: 'text-green-500' },
                                { label: 'Total Paid', value: formatCurrency(customer.totalPaid), icon: CheckCircle2, color: 'text-primary' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg bg-gray-100 dark:bg-white/5", item.color)}>
                                            <item.icon size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-text-muted">{item.label}</span>
                                    </div>
                                    <span className="font-bold text-card-foreground">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Payment History */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-8 glass-card overflow-hidden h-fit"
                >
                    <div className="p-6 sm:p-8 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/30 dark:bg-white/[0.01]">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2 text-card-foreground">
                                <History size={20} className="text-primary" />
                                Transaction History
                            </h3>
                            <p className="text-xs font-medium text-text-muted mt-0.5">Verified ledger of all payments</p>
                        </div>
                        <div className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl border border-primary/10">
                            {payments.length} SUCCESSFUL PAYMENTS
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border text-text-muted text-[10px] font-bold uppercase tracking-widest bg-gray-50/50 dark:bg-white/5">
                                    <th className="px-8 py-4">ID / Title</th>
                                    <th className="px-8 py-4">Verification Date</th>
                                    <th className="px-8 py-4">Method</th>
                                    <th className="px-8 py-4 text-right">Amount Credited</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {payments.map((payment, index) => (
                                    <motion.tr
                                        key={payment.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-success/10 text-success flex items-center justify-center border border-success/10">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                                <span className="font-bold text-card-foreground text-sm">
                                                    {payment.installmentNumber ? `Installment #${payment.installmentNumber}` : 'Direct Payment'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-text-muted text-sm font-medium">{payment.paymentDate}</td>
                                        <td className="px-8 py-6">
                                            <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-[10px] font-black text-text-muted tracking-wider border border-border uppercase">
                                                {payment.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="font-black text-success text-lg leading-none">
                                                +{formatCurrency(payment.amount)}
                                            </p>
                                            <span className="text-[10px] text-text-muted font-bold opacity-50">Verified</span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {payments.length === 0 && (
                        <div className="p-20 text-center flex flex-col items-center gap-4">
                            <div className="h-16 w-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-text-muted">
                                <History size={32} />
                            </div>
                            <p className="text-text-muted font-medium italic">No transactions found in this ledger.</p>
                        </div>
                    )}

                    <div className="p-6 bg-gray-50/50 dark:bg-white/[0.02] border-t border-border flex justify-center">
                        <button className="text-sm font-bold text-text-muted hover:text-primary transition-colors flex items-center gap-2">
                            Generate Statement <ArrowDownIcon size={16} />
                        </button>
                    </div>
                </motion.div>
            </motion.div>

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
