import React, { useState } from 'react';
import { Wallet, Calendar, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function PaymentForm({ customer, onSubmit, onCancel }) {
    const [amount, setAmount] = useState(customer.installmentAmount || '');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [method, setMethod] = useState('UPI');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            amount: Number(amount),
            paymentDate: date,
            paymentMethod: method,
            notes,
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <motion.form
            variants={containerVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <div className="space-y-5">
                {/* Amount Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                    <label htmlFor="payment-amount" className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-2 ml-1">
                        <Wallet size={14} className="text-primary/70" aria-hidden="true" /> Amount
                    </label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-lg" aria-hidden="true">₹</span>
                        <input
                            id="payment-amount"
                            type="number"
                            required
                            className="w-full border border-border group-focus-within:border-primary/40 group-focus-within:ring-2 group-focus-within:ring-primary/10 rounded-xl pl-9 pr-4 py-4 outline-none transition-all font-bold text-xl text-foreground"
                            style={{ background: 'rgba(255,255,255,0.04)' }}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Date Field */}
                    <motion.div variants={itemVariants} className="space-y-2">
                        <label htmlFor="payment-date" className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-2 ml-1">
                            <Calendar size={14} className="text-primary/70" aria-hidden="true" /> Date
                        </label>
                        <input
                            id="payment-date"
                            type="date"
                            required
                            className="w-full border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all text-foreground font-bold text-sm"
                            style={{ background: 'rgba(255,255,255,0.04)' }}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </motion.div>

                    {/* Method Select */}
                    <motion.div variants={itemVariants} className="space-y-2">
                        <fieldset>
                            <legend className="text-xs font-bold text-foreground/40 uppercase tracking-wider ml-1 mb-2">Method</legend>
                            <div className="flex p-1.5 rounded-xl border border-border" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                {['UPI', 'Cash', 'Bank'].map((m) => (
                                    <label key={m} className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            className="sr-only peer"
                                            name="payment-method"
                                            value={m}
                                            checked={method === m}
                                            onChange={() => setMethod(m)}
                                            aria-label={`Payment method: ${m}`}
                                        />
                                        <div className="py-2 text-center rounded-lg text-xs font-bold transition-all uppercase tracking-wider text-foreground/40 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-md hover:text-foreground">
                                            {m}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </motion.div>
                </div>

                {/* Notes */}
                <motion.div variants={itemVariants} className="space-y-2">
                    <label htmlFor="payment-notes" className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-2 ml-1">
                        <FileText size={14} className="text-primary/70" aria-hidden="true" /> Notes (Optional)
                    </label>
                    <textarea
                        id="payment-notes"
                        className="w-full border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all text-foreground font-medium text-sm resize-none"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                        rows="2"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add details about this payment..."
                    />
                </motion.div>
            </div>

            <motion.div variants={itemVariants} className="flex gap-4 pt-4 border-t border-border/20">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3.5 rounded-xl border border-border text-foreground/60 font-bold text-sm transition-all hover:bg-white/5"
                >
                    Cancel
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 text-sm"
                >
                    Confirm Payment <ChevronRight size={18} aria-hidden="true" />
                </motion.button>
            </motion.div>
        </motion.form>
    );
}
