import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Signup() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 8) {
            return setError('Password must be at least 8 characters long.');
        }
        if (password !== confirmPassword) {
            return setError('Passwords do not match.');
        }
        setLoading(true);
        setError('');
        try {
            await register(email, password);
            navigate('/');
        } catch (err) {
            setError('Registration failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden" style={{ background: '#0A0A1A' }}>
            {/* Animated background orbs */}
            <motion.div
                animate={{ scale: [1.2, 1, 1.2], x: [-20, 30, -20] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 w-[50%] h-[50%] blur-[120px] rounded-full"
                style={{ background: 'rgba(124, 58, 237, 0.1)' }}
                aria-hidden="true"
            />
            <motion.div
                animate={{ scale: [1, 1.3, 1], x: [20, -30, 20] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-0 right-0 w-[50%] h-[50%] blur-[120px] rounded-full"
                style={{ background: 'rgba(13, 148, 136, 0.08)' }}
                aria-hidden="true"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
                className="w-full max-w-[480px] space-y-8 premium-card p-8 sm:p-12 relative z-10"
            >
                {/* Back Link */}
                <Link to="/login" className="inline-flex items-center gap-2 text-xs font-medium text-foreground/30 hover:text-primary transition-colors">
                    <ArrowLeft size={14} aria-hidden="true" /> Back to Login
                </Link>

                {/* Title */}
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30 shadow-2xl shadow-primary/20"
                        style={{ background: 'rgba(124, 58, 237, 0.15)' }}
                    >
                        <UserPlus size={36} className="text-primary" aria-hidden="true" />
                    </motion.div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                        Create Account
                    </h1>
                    <p className="text-xs text-foreground/30 font-medium mt-2 tracking-wide">
                        Start managing your finances
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-xl text-sm font-medium text-center"
                        role="alert"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="signup-email" className="text-xs font-bold text-foreground/40 uppercase tracking-wider block ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors z-10" size={18} aria-hidden="true" />
                                <input
                                    id="signup-email"
                                    type="email" required
                                    className="w-full border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl pl-12 pr-4 py-4 outline-none transition-all text-foreground text-sm font-medium"
                                    style={{ background: 'rgba(255,255,255,0.04)' }}
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="signup-password" className="text-xs font-bold text-foreground/40 uppercase tracking-wider block ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors z-10" size={18} aria-hidden="true" />
                                <input
                                    id="signup-password"
                                    type="password" required
                                    className="w-full border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl pl-12 pr-4 py-4 outline-none transition-all text-foreground text-sm font-medium"
                                    style={{ background: 'rgba(255,255,255,0.04)' }}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="signup-confirm" className="text-xs font-bold text-foreground/40 uppercase tracking-wider block ml-1">Confirm Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors z-10" size={18} aria-hidden="true" />
                                <input
                                    id="signup-confirm"
                                    type="password" required
                                    className="w-full border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl pl-12 pr-4 py-4 outline-none transition-all text-foreground text-sm font-medium"
                                    style={{ background: 'rgba(255,255,255,0.04)' }}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                        <UserPlus size={18} aria-hidden="true" />
                    </motion.button>
                </form>

                <p className="text-center text-sm text-foreground/30">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:text-accent-light font-bold transition-colors">
                        Sign In
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
