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

    return (
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <User size={14} /> Customer Full Name
                    </label>
                    <input
                        type="text" required
                        className="w-full bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-white"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Phone size={14} /> Phone Number
                    </label>
                    <input
                        type="tel" required
                        className="w-full bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-white"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} /> Start Date
                    </label>
                    <input
                        type="date" required
                        className="w-full bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-white"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Wallet size={14} /> Total Loan
                    </label>
                    <input
                        type="number" required
                        className="w-full bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-white"
                        value={formData.loanAmount}
                        onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Wallet size={14} /> Per Installment
                    </label>
                    <input
                        type="number" required
                        className="w-full bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-white"
                        value={formData.installmentAmount}
                        onChange={(e) => setFormData({ ...formData, installmentAmount: e.target.value })}
                    />
                </div>

                <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Repeat size={14} /> Payment Cycle
                    </label>
                    <div className="flex gap-4">
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
                                <div className="py-2.5 text-center rounded-xl border border-white/5 bg-white/5 text-gray-400 peer-checked:border-blue-500 peer-checked:bg-blue-500/10 peer-checked:text-blue-400 transition-all text-sm font-bold uppercase tracking-widest">
                                    {cycle}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl border border-white/5 hover:bg-white/5 font-bold transition-all text-gray-400"
                >
                    Discard
                </button>
                <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                    Create Account <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );
}
