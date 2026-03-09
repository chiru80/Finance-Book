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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                {/* Amount Field */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Wallet size={14} /> Amount Paid
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                        <input
                            type="number"
                            required
                            className="w-full bg-[#0c0e12] border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500/50 transition-all font-bold text-xl text-white"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </div>

                {/* Date Field */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} /> Payment Date
                    </label>
                    <input
                        type="date"
                        required
                        className="w-full bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-white"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                {/* Method Select */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Method</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['UPI', 'Cash', 'Bank'].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMethod(m)}
                                className={`py-2 rounded-xl border text-sm font-semibold transition-all ${method === m
                                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={14} /> Notes (Optional)
                    </label>
                    <textarea
                        className="w-full bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 transition-all text-white resize-none"
                        rows="2"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Received for Week 5..."
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl border border-white/5 hover:bg-white/5 font-bold transition-all text-gray-400"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                    Confirm Payment <ChevronRight size={18} />
                </button>
            </div>
        </form>
    );
}
