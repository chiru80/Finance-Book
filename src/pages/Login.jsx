import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, Mail, Lock, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';

export default function Login() {
    const { login, signInWithGoogle, resetPassword } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [resetEmail, setResetEmail] = useState('');
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetMessage, setResetMessage] = useState('');

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            navigate('/');
        } catch (err) {
            setError('Google sign-in failed. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setResetMessage('');
        try {
            await resetPassword(resetEmail);
            setResetMessage('Password reset link sent to your email!');
            setTimeout(() => setIsResetModalOpen(false), 3000);
        } catch (err) {
            setError('Failed to send reset link. ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Invalid credentials. Please check your email and password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden" style={{ background: '#0A0A1A' }}>
            {/* Animated background orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    y: [0, 30, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] blur-[120px] rounded-full"
                style={{ background: 'rgba(124, 58, 237, 0.12)' }}
                aria-hidden="true"
            />
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    x: [0, -50, 0],
                    y: [0, -30, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] blur-[120px] rounded-full"
                style={{ background: 'rgba(13, 148, 136, 0.08)' }}
                aria-hidden="true"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
                className="w-full max-w-[480px] space-y-8 premium-card p-8 sm:p-12 relative z-10"
            >
                {/* Logo & Title */}
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0.5, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30 shadow-2xl shadow-primary/20"
                        style={{ background: 'rgba(124, 58, 237, 0.15)' }}
                    >
                        <Wallet size={36} className="text-primary drop-shadow-lg" aria-hidden="true" />
                    </motion.div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                        <span className="text-white">Finance</span>
                        <span className="text-primary ml-1">Book</span>
                    </h1>
                    <p className="text-xs text-foreground/30 font-medium mt-2 tracking-wide">
                        Capital Management Platform
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
                            <label htmlFor="email" className="text-xs font-bold text-foreground/40 uppercase tracking-wider block ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors z-10" size={18} aria-hidden="true" />
                                <input
                                    id="email"
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
                            <label htmlFor="password" className="text-xs font-bold text-foreground/40 uppercase tracking-wider block ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors z-10" size={18} aria-hidden="true" />
                                <input
                                    id="password"
                                    type="password" required
                                    className="w-full border border-border focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-xl pl-12 pr-4 py-4 outline-none transition-all text-foreground text-sm font-medium"
                                    style={{ background: 'rgba(255,255,255,0.04)' }}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end px-1">
                                <button
                                    type="button"
                                    onClick={() => setIsResetModalOpen(true)}
                                    className="text-xs font-medium text-primary/60 hover:text-primary transition-colors"
                                >
                                    Forgot password?
                                </button>
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
                        {loading ? 'Signing in...' : 'Sign In'}
                        <LogIn size={18} aria-hidden="true" />
                    </motion.button>
                </form>

                {/* Divider */}
                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-px" style={{ background: 'rgba(167,139,250,0.15)' }} />
                    </div>
                    <div className="relative flex justify-center text-xs font-medium">
                        <span className="px-4 text-foreground/20" style={{ background: '#12122A' }}>or continue with</span>
                    </div>
                </div>

                {/* Google Sign-in */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-4 border border-border rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-foreground/60 hover:text-foreground hover:border-foreground/20 text-sm"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                </motion.button>

                <p className="text-center text-sm text-foreground/30">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-primary hover:text-accent-light font-bold transition-colors">
                        Sign Up
                    </Link>
                </p>
            </motion.div>

            {/* Reset Password Modal */}
            <Modal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                title="Reset Password"
            >
                <form onSubmit={handleResetPassword} className="space-y-5">
                    <p className="text-sm text-foreground/40">
                        Enter your email and we'll send you a reset link.
                    </p>

                    {resetMessage && (
                        <div className="p-3 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-medium text-center" role="status">
                            {resetMessage}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="reset-email" className="text-xs font-bold text-foreground/40 uppercase tracking-wider ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30" size={18} aria-hidden="true" />
                            <input
                                id="reset-email"
                                type="email" required
                                className="w-full border border-border focus:border-primary/40 rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all text-foreground text-sm"
                                style={{ background: 'rgba(255,255,255,0.04)' }}
                                placeholder="you@example.com"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsResetModalOpen(false)}
                            className="flex-1 py-3.5 rounded-xl border border-border text-foreground/40 hover:bg-white/5 font-bold transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3.5 bg-primary text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 text-sm"
                        >
                            {loading ? 'Sending...' : 'Send Link'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
