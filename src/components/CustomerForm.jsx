import React, { useState } from 'react';
import { User, Phone, Wallet, Calendar, Repeat, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function CustomerForm({ onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        loanAmount: '',
        installmentAmount: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        paymentCycle: 'weekly',
        notes: ''
    });

    const [error, setError] = useState('');

    const validateForm = () => {
        if (!formData.name.trim() || formData.name.length > 50) {
            setError('Name must be between 1 and 50 characters.');
            return false;
        }
        
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(formData.phone)) {
            setError('Invalid phone number format.');
            return false;
        }

        const loan = Number(formData.loanAmount);
        const installment = Number(formData.installmentAmount);

        if (isNaN(loan) || loan <= 0) {
            setError('Loan amount must be a positive number.');
            return false;
        }

        if (isNaN(installment) || installment <= 0) {
            setError('Installment must be a positive number.');
            return false;
        }

        if (installment > loan) {
            setError('Installment cannot be greater than loan amount.');
            return false;
        }

        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        
        if (!validateForm()) return;

        onSubmit({
            ...formData,
            name: formData.name.trim(),
            loanAmount: Number(formData.loanAmount),
            installmentAmount: Number(formData.installmentAmount),
            notes: formData.notes.trim().slice(0, 500)
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.form
            variants={containerVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar"
        >
            {error && (
                <div role="alert" className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-bold text-center">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <motion.div variants={itemVariants} className="space-y-2 col-span-full">
                    <label htmlFor="customer-name" className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-2 ml-1">
                        <User size={14} className="text-primary/70" aria-hidden="true" /> Customer Name
                    </label>
                    <input
                        id="customer-name"
                        type="text" required
                        placeholder="e.g. Acme Corp"
                        className="w-full border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all text-foreground font-bold text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </motion.div>

                {/* Phone */}
                <motion.div variants={itemVariants} className="space-y-2">
                    <label htmlFor="customer-phone" className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-2 ml-1">
                        <Phone size={14} className="text-primary/70" aria-hidden="true" /> Phone Number
                    </label>
                    <input
                        id="customer-phone"
                        type="tel" required
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all text-foreground font-bold text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </motion.div>

                {/* Date */}
                <motion.div variants={itemVariants} className="space-y-2">
                    <label htmlFor="customer-date" className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-2 ml-1">
                        <Calendar size={14} className="text-primary/70" aria-hidden="true" /> Start Date
                    </label>
                    <input
                        id="customer-date"
                        type="date" required
                        className="w-full border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 outline-none transition-all text-foreground font-bold text-sm"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                </motion.div>

                {/* Total Exposure */}
                <motion.div variants={itemVariants} className="space-y-2">
                    <label htmlFor="customer-loan" className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-2 ml-1">
                        <Wallet size={14} className="text-primary/70" aria-hidden="true" /> Loan Amount
                    </label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-base" aria-hidden="true">₹</span>
                        <input
                            id="customer-loan"
                            type="number" required
                            className="w-full border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl pl-8 pr-4 py-3 outline-none transition-all text-foreground font-bold text-sm"
                            style={{ background: 'rgba(255,255,255,0.04)' }}
                            value={formData.loanAmount}
                            onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                        />
                    </div>
                </motion.div>

                {/* Installment */}
                <motion.div variants={itemVariants} className="space-y-2">
                    <label htmlFor="customer-installment" className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-2 ml-1">
                        <Wallet size={14} className="text-primary/70" aria-hidden="true" /> Installment
                    </label>
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-base" aria-hidden="true">₹</span>
                        <input
                            id="customer-installment"
                            type="number" required
                            className="w-full border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl pl-8 pr-4 py-3 outline-none transition-all text-foreground font-bold text-sm"
                            style={{ background: 'rgba(255,255,255,0.04)' }}
                            value={formData.installmentAmount}
                            onChange={(e) => setFormData({ ...formData, installmentAmount: e.target.value })}
                        />
                    </div>
                </motion.div>

                {/* Cycle */}
                <motion.div variants={itemVariants} className="space-y-2 col-span-full">
                    <fieldset>
                        <legend className="text-xs font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-2 ml-1 mb-2">
                            <Repeat size={14} className="text-primary/70" aria-hidden="true" /> Payment Cycle
                        </legend>
                        <div className="flex p-1.5 rounded-xl border border-border" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            {['weekly', 'monthly'].map((cycle) => (
                                <label key={cycle} className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        className="sr-only peer"
                                        name="cycle"
                                        value={cycle}
                                        checked={formData.paymentCycle === cycle}
                                        onChange={(e) => setFormData({ ...formData, paymentCycle: e.target.value })}
                                        aria-label={`${cycle} payment cycle`}
                                    />
                                    <div className="py-2.5 text-center rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-foreground/40 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-md peer-checked:shadow-primary/20 hover:text-foreground">
                                        {cycle}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                </motion.div>
            </div>

            <motion.div variants={itemVariants} className="flex gap-4 pt-6 border-t border-border/20">
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
                    Save Customer <ChevronRight size={18} aria-hidden="true" />
                </motion.button>
            </motion.div>
        </motion.form>
    );
}
