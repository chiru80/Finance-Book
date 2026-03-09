import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, Mail, Lock, UserPlus, ArrowLeft } from 'lucide-react';
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
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        setError('');
        try {
            await register(email, password);
            navigate('/');
        } catch (err) {
            setError('Failed to create account. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md space-y-8 glass-card p-8 sm:p-10 relative overflow-hidden shadow-2xl"
            >
                {/* Decorative Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-3xl rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/20 blur-3xl rounded-full" />

                <div className="relative">
                    <Link to="/login" className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-6 text-sm font-bold">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>

                    <div className="text-center">
                        <motion.div
                            initial={{ rotate: -10 }}
                            animate={{ rotate: 0 }}
                            className="mx-auto w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-6 border border-primary/20 shadow-inner"
                        >
                            <UserPlus size={36} />
                        </motion.div>
                        <h1 className="text-3xl font-black text-card-foreground tracking-tight">Create Account</h1>
                        <p className="text-text-muted mt-2 font-medium">Start your journey with FinanceBook</p>
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-2xl text-sm font-bold text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                <input
                                    type="email" required
                                    className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-primary/50 rounded-2xl pl-12 pr-4 py-4 outline-none transition-all text-card-foreground text-sm font-medium"
                                    placeholder="admin@financebook.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                <input
                                    type="password" required
                                    className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-primary/50 rounded-2xl pl-12 pr-4 py-4 outline-none transition-all text-card-foreground text-sm font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                <input
                                    type="password" required
                                    className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-primary/50 rounded-2xl pl-12 pr-4 py-4 outline-none transition-all text-card-foreground text-sm font-medium"
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
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary/90"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'} <UserPlus size={20} />
                    </motion.button>
                </form>

                <p className="text-center text-sm text-text-muted font-medium pt-2">
                    Already have an account? <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4">Log In</Link>
                </p>
            </motion.div>
        </div>
    );
}
