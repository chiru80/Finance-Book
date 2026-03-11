import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    History,
    Settings,
    LogOut,
    Wallet,
    Menu,
    X,
    Sun,
    Moon,
    Search,
    Bell
} from 'lucide-react';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Modal from './Modal';
import CustomerForm from './CustomerForm';
import { customerService } from '../services/customerService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const cn = (...inputs) => twMerge(clsx(inputs));

const NavItem = ({ to, icon: Icon, children, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
            "text-foreground/60 font-medium hover:bg-primary/10 hover:text-primary",
            isActive && "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary hover:text-white"
        )}
    >
        <m.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative z-10"
        >
            <Icon size={20} />
        </m.div>
        <span className="relative z-10">{children}</span>

        {/* Subtle active indicator background animation could be added here if needed */}
    </NavLink>
);

export default function Layout() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Handle dark mode toggle
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddCustomer = async (data) => {
        try {
            await customerService.addCustomer(data);
            setIsModalOpen(false);
            // Consider using a lighter state update instead of reload
            window.location.reload();
        } catch (err) {
            alert('Error adding customer: ' + err.message);
        }
    };

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/' || path === '/dashboard') return 'Overview';
        if (path.startsWith('/customers')) return 'Customers';
        if (path === '/history') return 'Transaction History';
        if (path === '/settings') return 'Account Settings';
        return 'FinanceBook';
    };

    const sidebarVariants = {
        open: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
        closed: { x: '-100%', opacity: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } }
    };

    return (
        <LazyMotion features={domAnimation}>
            <div className="flex min-h-screen w-full bg-background text-foreground transition-colors duration-500 font-sans">
                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <m.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar */}
                <m.aside
                    variants={sidebarVariants}
                    initial="closed"
                    animate={window.innerWidth >= 1024 || isSidebarOpen ? "open" : "closed"}
                    className={cn(
                        "w-80 bg-card border-r border-border p-8 flex flex-col fixed h-full z-50 transition-colors duration-300 shadow-2xl shadow-black/5",
                        "lg:translate-x-0"
                    )}
                >
                    <div className="flex items-center justify-between mb-12 px-2">
                        <m.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4"
                        >
                            <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/30 text-white animate-float">
                                <Wallet size={28} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black tracking-tight text-foreground">FinanceBook</h1>
                                <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold">Professional Suite</p>
                            </div>
                        </m.div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2.5 hover:bg-secondary rounded-xl lg:hidden text-foreground/60 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-3">
                        <p className="text-[11px] font-black text-foreground/30 uppercase tracking-[0.2em] px-4 mb-4">Main Menu</p>
                        <NavItem to="/" icon={LayoutDashboard} onClick={() => setIsSidebarOpen(false)}>Dashboard</NavItem>
                        <NavItem to="/customers" icon={Users} onClick={() => setIsSidebarOpen(false)}>Marketplace</NavItem>
                        <NavItem to="/history" icon={History} onClick={() => setIsSidebarOpen(false)}>Statement</NavItem>
                    </nav>

                    <div className="pt-8 border-t border-border space-y-3">
                        <p className="text-[11px] font-black text-foreground/30 uppercase tracking-[0.2em] px-4 mb-4">System</p>
                        <NavItem to="/settings" icon={Settings} onClick={() => setIsSidebarOpen(false)}>Settings</NavItem>
                        <m.button
                            whileHover={{ x: 5 }}
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-4 rounded-2xl text-danger hover:bg-danger/10 transition-all duration-300 font-bold group"
                        >
                            <div className="p-2 bg-danger/10 rounded-lg group-hover:bg-danger group-hover:text-white transition-colors">
                                <LogOut size={18} />
                            </div>
                            <span>Sign Out</span>
                        </m.button>
                    </div>
                </m.aside>

                {/* Main Content */}
                <main className="flex-1 lg:ml-80 flex flex-col min-h-screen">
                    {/* Header */}
                    <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-2xl border-b border-border px-6 py-5 lg:px-10 flex justify-between items-center transition-all duration-500">
                        <div className="flex items-center gap-6">
                            <m.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-3 hover:bg-secondary rounded-2xl lg:hidden text-foreground transition-all border border-border"
                            >
                                <Menu size={24} />
                            </m.button>
                            <div className="flex flex-col">
                                <h2 className="text-2xl font-extrabold text-foreground hidden sm:block tracking-tight">{getPageTitle()}</h2>
                                <p className="text-xs text-foreground/40 font-medium hidden sm:block">Welcome back, {user?.email?.split('@')[0] || 'Administrator'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-5">
                            <div className="relative hidden xl:block group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search intelligence..."
                                    className="bg-secondary/50 border border-border focus:border-primary/40 focus:bg-card focus:ring-4 focus:ring-primary/5 rounded-2xl pl-12 pr-6 py-3 text-sm outline-none transition-all w-80 font-medium shadow-inner"
                                />
                            </div>

                            <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-2xl border border-border">
                                <m.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className="p-2.5 hover:bg-card hover:shadow-lg rounded-[14px] text-foreground/60 hover:text-primary transition-all duration-300"
                                >
                                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                                </m.button>

                                <m.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-2.5 hover:bg-card hover:shadow-lg rounded-[14px] text-foreground/60 hover:text-primary transition-all duration-300 relative"
                                >
                                    <Bell size={20} />
                                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-danger rounded-full border-2 border-background animate-pulse" />
                                </m.button>
                            </div>

                            <m.div
                                whileHover={{ scale: 1.05 }}
                                className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg border-2 border-primary/20 shadow-lg shadow-primary/5 cursor-pointer hover:border-primary/40 transition-all"
                            >
                                {user?.email?.charAt(0).toUpperCase() || 'A'}
                            </m.div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="p-6 lg:p-10">
                        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-border/50">
                            <div>
                                <m.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-3xl sm:text-4xl font-black text-foreground tracking-tight"
                                >
                                    Portfolio Summary
                                </m.h1>
                                <m.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-foreground/50 mt-2 font-medium"
                                >
                                    Overview of your financial performance and active accounts.
                                </m.p>
                            </div>
                            <m.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsModalOpen(true)}
                                className="px-8 py-4 bg-primary text-white rounded-2xl font-black transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 border-b-4 border-primary-foreground/20 hover:border-b-0 hover:translate-y-1 active:border-b-0"
                            >
                                <Wallet size={20} />
                                <span>Add Instance</span>
                            </m.button>
                        </div>

                        <Outlet />
                    </div>
                </main>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Connect New Instance"
                >
                    <CustomerForm
                        onSubmit={handleAddCustomer}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>
            </div>
        </LazyMotion>
    );
}
