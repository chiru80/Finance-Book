import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    Zap, 
    CheckCircle2, 
    XCircle, 
    Search,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    ListChecks,
    Smartphone,
    CreditCard,
    DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { customerService } from '../services/customerService';
import { formatCurrency, ABSENT, deriveCustomerStats } from '../utils/calculations';
import Modal from '../components/Modal';

export default function WeeklyView() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table'); // table or checklist
    const [selectedWeek, setSelectedWeek] = useState(0); // 0-indexed week from start
    const [filterMode, setFilterMode] = useState('all'); // all, cash, online
    const [collectionMode, setCollectionMode] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [sessionSummary, setSessionSummary] = useState({ cash: 0, online: 0, count: 0 });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const data = await customerService.getCustomers();
            setCustomers(data);
        } catch (err) {
            console.error('Error fetching customers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateWeek = async (customerId, weekIndex, value) => {
        try {
            await customerService.updateWeek(customerId, weekIndex, value);
            
            // Track session totals if in collection mode
            if (collectionMode && value && typeof value === 'object') {
                setSessionSummary(prev => ({
                    ...prev,
                    [value.mode === 'cash' ? 'cash' : 'online']: prev[value.mode === 'cash' ? 'cash' : 'online'] + value.amount,
                    count: prev.count + 1
                }));
            }

            // Local update for immediate feedback
            setCustomers(prev => prev.map(c => {
                if (c.id === customerId) {
                    const newWeeks = [...(c.weeks || [])];
                    newWeeks[weekIndex] = value;
                    return { ...c, weeks: newWeeks };
                }
                return c;
            }));
        } catch (err) {
            alert('Update failed: ' + err.message);
        }
    };

    const handleCollectAll = async () => {
        const confirm = window.confirm("Collect collections for all eligible customers in Week " + (selectedWeek + 1) + "?");
        if (!confirm) return;

        setLoading(true);
        try {
            for (const customer of filteredCustomers) {
                const weekStatus = customer.weeks?.[selectedWeek];
                if (weekStatus === null || weekStatus === undefined) {
                    await customerService.updateWeek(customer.id, selectedWeek, {
                        amount: customer.installmentAmount,
                        mode: 'cash',
                        date: new Date().toISOString().split('T')[0]
                    });
                }
            }
            fetchCustomers();
        } catch (err) {
            alert('Bulk update failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        
        if (filterMode === 'all') return true;
        const status = c.weeks?.[selectedWeek];
        const isPaid = status && typeof status === 'object';
        
        if (filterMode === 'cash') return isPaid && (status.mode === 'cash' || !status.mode);
        if (filterMode === 'online') return isPaid && status.mode && status.mode !== 'cash';
        
        return true;
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-3xl font-extrabold tracking-tight">Weekly Collection</h1>
                    <p className="text-sm text-foreground/40 font-medium mt-1">Efficient one-click entry system</p>
                </motion.div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-surface/80 p-1 rounded-xl border border-border">
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-foreground/40 hover:text-foreground'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button 
                            onClick={() => setViewMode('checklist')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'checklist' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-foreground/40 hover:text-foreground'}`}
                        >
                            <ListChecks size={20} />
                        </button>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setCollectionMode(!collectionMode);
                            if (!collectionMode) {
                                // Reset session summary when starting
                                setSessionSummary({ cash: 0, online: 0, count: 0 });
                                // Find first unpaid when turning on
                                const firstUnpaid = filteredCustomers.findIndex(c => {
                                    const st = c.weeks?.[selectedWeek];
                                    return !st || typeof st !== 'object';
                                });
                                setActiveRowIndex(Math.max(0, firstUnpaid));
                            }
                        }}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-all ${
                            collectionMode 
                                ? 'bg-success text-white shadow-success/25' 
                                : 'bg-white/5 border border-border/50 text-foreground hover:bg-white/10'
                        }`}
                    >
                        <Zap size={18} className={collectionMode ? "animate-pulse" : ""} />
                        <span>⚡ Collection Mode {collectionMode ? 'ON' : 'OFF'}</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCollectAll}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/25"
                    >
                        <ListChecks size={18} />
                        <span>Collect All</span>
                    </motion.button>
                </div>
            </div>

            {/* Controls Bar */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card p-4 flex flex-col md:flex-row items-center gap-4"
            >
                {/* Week Selector */}
                <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-xl border border-border/50">
                    <button 
                        onClick={() => setSelectedWeek(Math.max(0, selectedWeek - 1))}
                        className="text-foreground/40 hover:text-primary transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col items-center min-w-[100px]">
                        <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">Selected Week</span>
                        <span className="text-lg font-extrabold text-primary">Week {selectedWeek + 1}</span>
                    </div>
                    <button 
                        onClick={() => setSelectedWeek(selectedWeek + 1)}
                        className="text-foreground/40 hover:text-primary transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Filter by customer name..."
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-border rounded-xl text-sm font-medium outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Mode Filter */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-border/50">
                    {['all', 'cash', 'online'].map(m => (
                        <button
                            key={m}
                            onClick={() => setFilterMode(m)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                filterMode === m ? 'bg-primary text-white shadow-lg' : 'text-foreground/30 hover:text-foreground'
                            }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="premium-card overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <div className="h-12 w-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                        <p className="text-foreground/30 font-medium">Loading collection sheet...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="p-20 text-center text-foreground/30 font-medium">No customers found</div>
                ) : (
                    <div className="divide-y divide-border/20">
                        {filteredCustomers.map((customer, idx) => (
                            <CustomerRow 
                                key={customer.id} 
                                customer={customer} 
                                weekIndex={selectedWeek}
                                viewMode={viewMode}
                                index={idx}
                                onUpdate={handleUpdateWeek}
                                isActiveRow={collectionMode && activeRowIndex === idx}
                                onNextRow={() => {
                                    let nextIdx = idx + 1;
                                    while (nextIdx < filteredCustomers.length) {
                                        const c = filteredCustomers[nextIdx];
                                        const st = c.weeks?.[selectedWeek];
                                        // Find next unpaid
                                        if (!st || (typeof st !== 'object' && st !== ABSENT)) {
                                            setActiveRowIndex(nextIdx);
                                            return;
                                        }
                                        nextIdx++;
                                    }
                                    // Finished
                                    setCollectionMode(false);
                                    setActiveRowIndex(0);
                                    setShowSummaryModal(true);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Summary Modal */}
            <Modal 
                isOpen={showSummaryModal} 
                onClose={() => setShowSummaryModal(false)}
                title="Collection Summary"
            >
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-border/50">
                        <div>
                            <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mb-1">Customers Collected</p>
                            <p className="text-2xl font-black text-foreground">{sessionSummary.count}</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
                            <CheckCircle2 size={24} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-success/5 rounded-2xl border border-success/10">
                            <p className="text-[10px] font-black text-success/40 uppercase tracking-widest mb-1">Cash</p>
                            <p className="text-xl font-bold text-success">{formatCurrency(sessionSummary.cash)}</p>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">Online</p>
                            <p className="text-xl font-bold text-primary">{formatCurrency(sessionSummary.online)}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex flex-col items-center">
                        <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mb-1">Total Session Collection</p>
                        <p className="text-3xl font-black text-foreground">{formatCurrency(sessionSummary.cash + sessionSummary.online)}</p>
                    </div>

                    <button 
                        onClick={() => setShowSummaryModal(false)}
                        className="w-full py-4 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Done
                    </button>
                </div>
            </Modal>
        </div>
    );
}

function CustomerRow({ customer, weekIndex, viewMode, index, onUpdate, isActiveRow, onNextRow }) {
    const status = customer.weeks?.[weekIndex];
    const isPaid = status && typeof status === 'object';
    const isAbsent = status === ABSENT;
    const stats = deriveCustomerStats(customer);
    const [amount, setAmount] = useState(customer.installmentAmount);

    useEffect(() => {
        if (!isActiveRow || isPaid || isAbsent) return;

        const handleKeyDown = (e) => {
            // Avoid triggering if user is actively typing in the input EXCEPT for Enter
            if (e.target.tagName === 'INPUT') {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onUpdate(customer.id, weekIndex, { amount, mode: 'cash', date: new Date().toISOString().split('T')[0] });
                    onNextRow();
                }
                return; 
            }

            const key = e.key.toLowerCase();
            if (key === 'p') {
                e.preventDefault();
                onUpdate(customer.id, weekIndex, { amount, mode: 'cash', date: new Date().toISOString().split('T')[0] });
                onNextRow();
            } else if (key === 'o') {
                e.preventDefault();
                onUpdate(customer.id, weekIndex, { amount, mode: 'online', date: new Date().toISOString().split('T')[0] });
                onNextRow();
            } else if (key === 'a') {
                e.preventDefault();
                onUpdate(customer.id, weekIndex, ABSENT);
                onNextRow();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActiveRow, isPaid, isAbsent, amount, customer.id, weekIndex, onUpdate, onNextRow]);

    const baseClasses = `flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group ${
        isActiveRow ? 'ring-2 ring-success/50 bg-success/[0.02] relative z-10 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.1)]' : ''
    }`;

    if (viewMode === 'checklist') {
        return (
            <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={baseClasses}
            >
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            if (isPaid) onUpdate(customer.id, weekIndex, null);
                            else onUpdate(customer.id, weekIndex, { 
                                amount: customer.installmentAmount, 
                                mode: 'cash', 
                                date: new Date().toISOString().split('T')[0] 
                            });
                        }}
                        className={`h-7 w-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isPaid ? 'bg-success border-success text-white' : 'border-border hover:border-primary/50 text-transparent'
                        }`}
                    >
                        <CheckCircle2 size={18} />
                    </button>
                    <div>
                        <p className="font-bold text-foreground">{customer.name}</p>
                        <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider">{customer.village || idx % 2 === 0 ? 'Anaparthi' : 'Ramachandrapuram'}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-xs font-bold text-foreground/40">Amount</p>
                        <p className="font-bold text-foreground">{formatCurrency(customer.installmentAmount)}</p>
                    </div>
                    <button 
                        onClick={() => onUpdate(customer.id, weekIndex, isAbsent ? null : ABSENT)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all ${
                            isAbsent ? 'bg-warning text-white shadow-lg shadow-warning/20' : 'bg-white/5 text-foreground/20 hover:text-warning'
                        }`}
                    >
                        {isAbsent ? 'Absent' : 'Mark Absent'}
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={baseClasses}
        >
            <div className="flex items-center gap-4 min-w-[200px]">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-primary border border-primary/20 bg-primary/10">
                    {customer.name.charAt(0)}
                </div>
                <div>
                    <h4 className="font-bold text-foreground leading-tight">{customer.name}</h4>
                    <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider">{customer.village || (index % 2 === 0 ? 'Anaparthi' : 'Ramachandrapuram')}</p>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-end gap-4">
                {/* Collection Input Mock */}
                {!isPaid && !isAbsent ? (
                    <div className="flex items-center gap-2">
                         <div className="relative w-32">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 font-bold">₹</span>
                             <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                autoFocus={isActiveRow}
                                className={`w-full pl-8 pr-3 py-2.5 bg-white/5 border ${isActiveRow ? 'border-success/50 ring-1 ring-success/20' : 'border-border'} rounded-xl text-sm font-bold text-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all`}
                             />
                         </div>
                         <button 
                            onClick={() => onUpdate(customer.id, weekIndex, { 
                                amount: amount, 
                                mode: 'cash', 
                                date: new Date().toISOString().split('T')[0] 
                            })}
                            className="px-4 py-2.5 bg-success/10 text-success border border-success/20 rounded-xl text-xs font-bold hover:bg-success hover:text-white transition-all flex items-center gap-1.5"
                        >
                            <span>💵</span> Cash
                        </button>
                        <button 
                            onClick={() => onUpdate(customer.id, weekIndex, { 
                                amount: amount, 
                                mode: 'online', 
                                date: new Date().toISOString().split('T')[0] 
                            })}
                            className="px-4 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-1.5"
                        >
                            <Smartphone size={14} /> Online
                        </button>
                        <button 
                            onClick={() => onUpdate(customer.id, weekIndex, ABSENT)}
                            className="px-4 py-2.5 bg-warning/10 text-warning border border-warning/20 rounded-xl text-xs font-bold hover:bg-warning hover:text-white transition-all flex items-center gap-1.5 ml-2"
                            title="Mark Absent"
                        >
                            <span>A</span> Absent
                        </button>
                    </div>
                ) : isPaid ? (
                    <div className="flex items-center gap-3 bg-success/10 px-4 py-2.5 rounded-xl border border-success/20">
                        <CheckCircle2 size={18} className="text-success" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-success/60 uppercase tracking-widest leading-none">Paid</span>
                            <span className="text-sm font-bold text-success">{formatCurrency(status.amount)}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-success/10 mx-1" />
                        {status.mode === 'phonepe' && <Smartphone size={16} className="text-success/60" />}
                        {status.mode === 'cash' && <DollarSign size={16} className="text-success/60" />}
                        {status.mode !== 'cash' && status.mode !== 'phonepe' && <CreditCard size={16} className="text-success/60" />}
                        <button 
                            onClick={() => onUpdate(customer.id, weekIndex, null)}
                            className="ml-2 text-success/30 hover:text-success transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 bg-warning/10 px-4 py-2.5 rounded-xl border border-warning/20">
                        <XCircle size={18} className="text-warning" />
                        <span className="text-xs font-black text-warning uppercase tracking-[0.2em]">ABSENT</span>
                        <button 
                            onClick={() => onUpdate(customer.id, weekIndex, null)}
                            className="ml-2 text-warning/30 hover:text-warning transition-colors"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
            
            {/* Payment Mode Selector Desktop (Removed, actions inline now) */}
        </motion.div>
    );
}
