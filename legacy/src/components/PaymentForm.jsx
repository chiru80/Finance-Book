import React, { useState } from 'react';
import { Wallet, Calendar, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

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
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <m.form
            variants={containerVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            className="space-y-8"
        >
            <div className="space-y-6">
                {/* Amount Field */}
                <m.div variants={itemVariants} className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                        <Wallet size={14} className="text-primary" /> Injection Amount
                    </label>
                    <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-xl">₹</span>
                        <input
                            type="number"
                            required
                            className="w-full bg-secondary/50 border border-border group-focus-within:border-primary/40 group-focus-within:ring-4 group-focus-within:ring-primary/5 rounded-2xl pl-12 pr-6 py-5 outline-none transition-all font-black text-2xl text-foreground tracking-tight"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </m.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date Field */}
                    <m.div variants={itemVariants} className="space-y-3">
                        <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                            <Calendar size={14} className="text-primary" /> Execution Date
                        </label>
                        <input
                            type="date"
                            required
                            className="w-full bg-secondary/50 border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl px-6 py-4 outline-none transition-all text-foreground font-bold"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </m.div>

                    {/* Method Select */}
                    <m.div variants={itemVariants} className="space-y-3">
                        <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] ml-1">Protocol (Method)</label>
                        <div className="flex bg-secondary/50 p-1.5 rounded-2xl border border-border">
                            {['UPI', 'Cash', 'Bank'].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMethod(m)}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${method === m
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-foreground/30 hover:text-foreground/60'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </m.div>
                </div>

                {/* Notes */}
                <m.div variants={itemVariants} className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                        <FileText size={14} className="text-primary" /> Ledger Annotation
                    </label>
                    <textarea
                        className="w-full bg-secondary/50 border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl px-6 py-4 outline-none transition-all text-foreground font-medium resize-none"
                        rows="2"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional transaction context..."
                    />
                </m.div>
            </div>

            <m.div variants={itemVariants} className="flex gap-4 pt-6 mt-6 border-t border-border/50">
                <m.button
                    whileHover={{ backgroundColor: "rgba(var(--foreground-rgb), 0.05)" }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-4 rounded-2xl border border-border text-foreground/40 font-black uppercase tracking-widest text-[11px] transition-all"
                >
                    Abort
                </m.button>
                <m.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-2 px-10 py-4 bg-primary text-white rounded-2xl font-black transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest border-b-4 border-primary-foreground/20"
                >
                    Confirm Injection <ChevronRight size={18} />
                </m.button>
            </m.div>
        </m.form>
    );
}
