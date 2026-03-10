import React, { useState } from 'react';
import { User, Phone, Wallet, Calendar, Repeat, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

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

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            loanAmount: Number(formData.loanAmount),
            installmentAmount: Number(formData.installmentAmount)
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <m.form
            variants={containerVariants}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            className="space-y-8 max-h-[75vh] overflow-y-auto pr-4 custom-scrollbar"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <m.div variants={itemVariants} className="space-y-3 col-span-full">
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                        <User size={14} className="text-primary" /> Entity Full Profile Name
                    </label>
                    <input
                        type="text" required
                        placeholder="Legal entity or individual name"
                        className="w-full bg-secondary/50 border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl px-6 py-4 outline-none transition-all text-foreground font-bold"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </m.div>

                <m.div variants={itemVariants} className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                        <Phone size={14} className="text-primary" /> Primary Uplink (Phone)
                    </label>
                    <input
                        type="tel" required
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full bg-secondary/50 border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl px-6 py-4 outline-none transition-all text-foreground font-bold"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </m.div>

                <m.div variants={itemVariants} className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                        <Calendar size={14} className="text-primary" /> Inception Date
                    </label>
                    <input
                        type="date" required
                        className="w-full bg-secondary/50 border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl px-6 py-4 outline-none transition-all text-foreground font-bold"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                </m.div>

                <m.div variants={itemVariants} className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                        <Wallet size={14} className="text-primary" /> Total Exposure (Loan)
                    </label>
                    <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black">₹</span>
                        <input
                            type="number" required
                            className="w-full bg-secondary/50 border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl pl-12 pr-6 py-4 outline-none transition-all text-foreground font-black text-lg"
                            value={formData.loanAmount}
                            onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                        />
                    </div>
                </m.div>

                <m.div variants={itemVariants} className="space-y-3">
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                        <Wallet size={14} className="text-primary" /> Installment Payload
                    </label>
                    <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black">₹</span>
                        <input
                            type="number" required
                            className="w-full bg-secondary/50 border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl pl-12 pr-6 py-4 outline-none transition-all text-foreground font-black text-lg"
                            value={formData.installmentAmount}
                            onChange={(e) => setFormData({ ...formData, installmentAmount: e.target.value })}
                        />
                    </div>
                </m.div>

                <m.div variants={itemVariants} className="space-y-3 col-span-full">
                    <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                        <Repeat size={14} className="text-primary" /> Recurrence Protocol
                    </label>
                    <div className="flex bg-secondary/50 p-2 rounded-2xl border border-border">
                        {['weekly', 'monthly'].map((cycle) => (
                            <label key={cycle} className="flex-1 cursor-pointer">
                                <input
                                    type="radio"
                                    className="hidden peer"
                                    name="cycle"
                                    value={cycle}
                                    checked={formData.paymentCycle === cycle}
                                    onChange={(e) => setFormData({ ...formData, paymentCycle: e.target.value })}
                                />
                                <div className="py-3 text-center rounded-xl text-xs font-black uppercase tracking-widest transition-all text-foreground/30 peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-primary/20">
                                    {cycle}
                                </div>
                            </label>
                        ))}
                    </div>
                </m.div>
            </div>

            <m.div variants={itemVariants} className="flex gap-4 pt-8 border-t border-border/50">
                <m.button
                    whileHover={{ backgroundColor: "rgba(var(--foreground-rgb), 0.05)" }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-4 rounded-2xl border border-border text-foreground/40 font-black uppercase tracking-widest text-[11px] transition-all"
                >
                    Discard
                </m.button>
                <m.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-2 px-10 py-4 bg-primary text-white rounded-2xl font-black transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-[11px] uppercase tracking-widest border-b-4 border-primary-foreground/20"
                >
                    Initialize Account <ChevronRight size={18} />
                </m.button>
            </m.div>
        </m.form>
    );
}
