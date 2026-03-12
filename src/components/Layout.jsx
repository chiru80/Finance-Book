import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from './NavBar';
import MobileDrawer from './MobileDrawer';
import Modal from './Modal';
import CustomerForm from './CustomerForm';
import { customerService } from '../services/customerService';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [totalBalance, setTotalBalance] = useState(0);
    const { user } = useAuth();
    const location = useLocation();

    // Close drawer on route change
    useEffect(() => {
        setIsDrawerOpen(false);
    }, [location.pathname]);

    // Fetch total balance for navbar
    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const customers = await customerService.getCustomers();
                const total = customers.reduce((sum, c) => sum + (Number(c.totalPaid) || 0), 0);
                setTotalBalance(total);
            } catch (err) {
                console.error('Error fetching balance:', err);
            }
        };
        fetchBalance();
    }, []);

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
                    <div>
                        <p className="text-xs text-foreground/30 font-medium">
                            Welcome back, {user?.email?.split('@')[0] || 'Admin'}
                        </p>
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
