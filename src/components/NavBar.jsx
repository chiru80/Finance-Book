import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    UserPlus,
    BarChart3,
    Settings,
    LogOut,
    IndianRupee,
    Menu
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/calculations';

export default function NavBar({ totalBalance = 0, onMenuToggle }) {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const navItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/weekly', label: 'Weekly View', icon: Calendar },
        { path: '/customers', label: 'Ledger', icon: Users },
        { path: '/online-payments', label: 'Payments', icon: IndianRupee },
    ];

    return (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
            {/* Mobile hamburger */}
            <button
                className="md:hidden p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-white/5 transition-colors mr-3"
                onClick={onMenuToggle}
                aria-label="Open menu"
            >
                <Menu size={24} />
            </button>

            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2 mr-8 shrink-0" aria-label="Finance Book Home">
                <span className="text-xl" role="img" aria-label="briefcase">💼</span>
                <span className="text-lg font-bold tracking-tight">
                    <span className="text-white">Finance</span>
                    <span className="text-primary ml-1">Book</span>
                </span>
            </NavLink>

            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center gap-1 flex-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={path === '/'}
                        className={({ isActive }) =>
                            `nav-pill ${isActive ? 'active' : ''}`
                        }
                        aria-label={label}
                    >
                        <Icon size={18} aria-hidden="true" />
                        <span className="hidden lg:inline">{label}</span>
                    </NavLink>
                ))}
            </div>

            {/* Right cluster */}
            <div className="hidden md:flex items-center gap-3 ml-auto">
                {/* Balance Pill */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 px-4 py-2 bg-success/15 text-success rounded-xl text-sm font-bold border border-success/20"
                    aria-label={`Total balance: ${formatCurrency(totalBalance)}`}
                >
                    <IndianRupee size={16} aria-hidden="true" />
                    <span>{formatCurrency(totalBalance)}</span>
                </motion.div>

                {/* Settings */}
                <button
                    onClick={() => navigate('/settings')}
                    className="p-2.5 rounded-xl text-foreground/40 hover:text-foreground hover:bg-white/5 transition-all"
                    aria-label="Settings"
                >
                    <Settings size={20} aria-hidden="true" />
                </button>

                {/* Logout */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-danger/80 hover:text-danger border border-danger/20 hover:border-danger/40 hover:bg-danger/5 text-sm font-bold transition-all"
                    aria-label="Log out"
                >
                    <LogOut size={16} aria-hidden="true" />
                    <span className="hidden lg:inline">Logout</span>
                </motion.button>
            </div>
        </nav>
    );
}
