import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from './NavBar';
import MobileDrawer from './MobileDrawer';
import Modal from './Modal';
import CustomerForm from './CustomerForm';
import { customerService } from '../services/customerService';
import { deriveCustomerStats, formatCurrency } from '../utils/calculations';
import { useAuth } from '../context/AuthContext';

function SummaryTag({ label, value, color }) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-border/50 rounded-lg">
            <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">{label}</span>
            <span className={`text-xs font-bold ${color}`}>{formatCurrency(value)}</span>
        </div>
    );
}

export default function Layout() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [stats, setStats] = useState({ in: 0, bal: 0, online: 0, availableCash: 0 });
    const [initialCapital, setInitialCapital] = useState(500000); // Default

    // Fetch settings (initial capital)
    useEffect(() => {
        const unsubscribe = customerService.subscribeToSettings((settings) => {
            if (settings && settings.initialCapital) {
                 setInitialCapital(Number(settings.initialCapital));
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch total stats with real-time listener
    useEffect(() => {
        const unsubscribe = customerService.subscribeToCustomers((customers) => {
            let totalIn = 0;
            let totalBal = 0;
            let totalOnline = 0;
            let totalLoanedOut = 0;

            customers.forEach(c => {
                const s = deriveCustomerStats(c);
                totalIn += s.cashCollected;
                totalBal += s.remainingBalance;
                totalOnline += s.onlineCollected;
                totalLoanedOut += Number(c.loanAmount) || 0;
            });

            setStats({ 
                in: totalIn, 
                bal: totalBal, 
                online: totalOnline,
                availableCash: initialCapital - totalLoanedOut 
            });
        });

        return () => unsubscribe();
    }, [initialCapital]);

    // Close drawer on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isDrawerOpen) {
                setIsDrawerOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isDrawerOpen]);

    const handleAddCustomer = async (data) => {
        try {
            await customerService.addCustomer(data);
            setIsModalOpen(false);
            window.location.reload();
        } catch (err) {
            alert('Error adding customer: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Background Orb */}
            <div className="bg-orb" style={{ top: '-200px', right: '-200px' }} aria-hidden="true" />

            {/* Desktop Top NavBar */}
            <NavBar
                totalBalance={totalBalance}
                onMenuToggle={() => setIsDrawerOpen(true)}
            />

            {/* Mobile Drawer */}
            <MobileDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />

            {/* Main Content — full width, padded below 64px navbar */}
            <main className="pt-20 px-4 sm:px-6 lg:px-10 pb-10 relative z-10 max-w-[1600px] mx-auto">
                {/* Page Action Bar */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex flex-col">
                        <p className="text-xs text-foreground/30 font-medium">
                            Welcome back, {user?.email?.split('@')[0] || 'Admin'}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <SummaryTag label="💵 CASH" value={stats.availableCash} color={stats.availableCash >= 0 ? "text-success" : "text-danger"} />
                            <SummaryTag label="IN" value={stats.in} color="text-success" />
                            <SummaryTag label="BAL" value={stats.bal} color="text-warning" />
                            <SummaryTag label="ONLINE" value={stats.online} color="text-primary" />
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
                        aria-label="Add new customer"
                    >
                        <UserPlus size={18} aria-hidden="true" />
                        <span className="hidden sm:inline">Add Customer</span>
                    </motion.button>
                </div>

                {/* Route Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Add Customer Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Customer"
            >
                <CustomerForm
                    onSubmit={handleAddCustomer}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
