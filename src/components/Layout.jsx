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
import { motion, AnimatePresence } from 'framer-motion';
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
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
            "text-gray-500 font-medium hover:bg-primary/10 hover:text-primary",
            isActive && "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary hover:text-white"
        )}
    >
        <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
        >
            <Icon size={20} />
        </motion.div>
        <span>{children}</span>
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
            window.location.reload();
        } catch (err) {
            alert('Error adding customer: ' + err.message);
        }
    };

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/customers')) return 'Customers';
        if (path === '/history') return 'History';
        if (path === '/settings') return 'Settings';
        return 'FinanceBook';
    };

    const sidebarVariants = {
        open: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
        closed: { x: '-100%', opacity: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } }
    };

    return (
        <div className="flex min-h-screen w-full bg-background text-card-foreground transition-colors duration-300">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                variants={sidebarVariants}
                initial="closed"
                animate={window.innerWidth >= 1024 || isSidebarOpen ? "open" : "closed"}
                className={cn(
                    "w-72 bg-card border-r border-border p-6 flex flex-col fixed h-full z-50 transition-colors duration-300 shadow-xl",
                    "lg:translate-x-0" // Always show on desktop
                )}
            >
                <div className="flex items-center justify-between mb-10 px-2 lg:justify-start lg:gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20 text-white">
                            <Wallet size={24} />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-card-foreground">FinanceBook</h1>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavItem to="/" icon={LayoutDashboard} onClick={() => setIsSidebarOpen(false)}>Dashboard</NavItem>
                    <NavItem to="/customers" icon={Users} onClick={() => setIsSidebarOpen(false)}>Customers</NavItem>
                    <NavItem to="/history" icon={History} onClick={() => setIsSidebarOpen(false)}>History</NavItem>
                </nav>

                <div className="pt-6 border-t border-border space-y-2">
                    <NavItem to="/settings" icon={Settings} onClick={() => setIsSidebarOpen(false)}>Settings</NavItem>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-danger hover:bg-danger/10 transition-colors font-medium"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-4 lg:px-8 flex justify-between items-center transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg lg:hidden"
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-card-foreground hidden sm:block">{getPageTitle()}</h2>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                            <input
                                type="text"
                                placeholder="Search anything..."
                                className="bg-gray-100 dark:bg-white/5 border border-transparent focus:border-primary/50 rounded-xl pl-10 pr-4 py-2 text-sm outline-none transition-all w-64"
                            />
                        </div>

                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl text-text-muted transition-colors"
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <button className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl text-text-muted transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full border-2 border-background" />
                        </button>

                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                            {user?.email?.charAt(0).toUpperCase() || 'A'}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 lg:p-8">
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">Welcome back, {user?.email?.split('@')[0] || 'Admin'}</h1>
                            <p className="text-text-muted mt-1">Manage your business accounts and payments.</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-primary text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            + New Customer
                        </motion.button>
                    </div>

                    <Outlet />
                </div>
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Register New Customer"
            >
                <CustomerForm
                    onSubmit={handleAddCustomer}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
