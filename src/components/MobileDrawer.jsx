import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    X,
    LayoutDashboard,
    Users,
    UserPlus,
    BarChart3,
    Settings,
    LogOut,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const drawerItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }
    }),
    exit: { opacity: 0, x: -20, transition: { duration: 0.15 } }
};

export default function MobileDrawer({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [moreOpen, setMoreOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
            onClose();
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const handleNavigate = (path) => {
        navigate(path);
        onClose();
    };

    const mainItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/customers', label: 'All Customers', icon: Users },
    ];

    const moreItems = [
        { path: '/add-customer', label: 'Add Customer', icon: UserPlus },
        { path: '/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="drawer-overlay"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="drawer-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Navigation menu"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <h2 className="text-lg font-bold text-foreground">Menu</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg text-foreground/40 hover:text-foreground hover:bg-white/5 transition-colors"
                                aria-label="Close menu"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Main Nav Items */}
                        <div className="flex-1 p-4 space-y-1">
                            {mainItems.map((item, i) => (
                                <motion.div
                                    key={item.path}
                                    custom={i}
                                    variants={drawerItemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
                                    <NavLink
                                        to={item.path}
                                        end={item.path === '/'}
                                        onClick={() => onClose()}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                                                isActive
                                                    ? 'bg-primary text-white'
                                                    : 'text-foreground/60 hover:text-foreground hover:bg-white/5'
                                            }`
                                        }
                                    >
                                        <item.icon size={20} aria-hidden="true" />
                                        {item.label}
                                    </NavLink>
                                </motion.div>
                            ))}

                            {/* More Expander */}
                            <motion.div
                                custom={mainItems.length}
                                variants={drawerItemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <button
                                    onClick={() => setMoreOpen(!moreOpen)}
                                    className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-sm font-semibold text-foreground/60 hover:text-foreground hover:bg-white/5 transition-all"
                                    aria-expanded={moreOpen}
                                >
                                    <span>More</span>
                                    {moreOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                            </motion.div>

                            <AnimatePresence>
                                {moreOpen && moreItems.map((item, i) => (
                                    <motion.div
                                        key={item.path}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <NavLink
                                            to={item.path}
                                            onClick={() => onClose()}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-3 ml-4 rounded-xl text-sm font-medium transition-all ${
                                                    isActive
                                                        ? 'bg-primary/20 text-primary'
                                                        : 'text-foreground/40 hover:text-foreground hover:bg-white/5'
                                                }`
                                            }
                                        >
                                            <item.icon size={18} aria-hidden="true" />
                                            {item.label}
                                        </NavLink>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Bottom Section */}
                        <div className="p-4 border-t border-white/10 space-y-3">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-danger border border-danger/30 hover:bg-danger/10 font-bold text-sm transition-all"
                                aria-label="Log out"
                            >
                                <LogOut size={18} aria-hidden="true" />
                                Logout
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
