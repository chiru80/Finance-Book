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
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md space-y-8 glass-card p-8 sm:p-10 relative overflow-hidden shadow-2xl"
            >
                {/* Decorative Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-3xl rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/20 blur-3xl rounded-full" />

                <div className="text-center relative">
                    <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="mx-auto w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-6 border border-primary/20 shadow-inner"
                    >
                        <Wallet size={36} />
                    </motion.div>
                    <h1 className="text-3xl font-black text-card-foreground tracking-tight">FinanceBook</h1>
                    <p className="text-text-muted mt-2 font-medium">Elevate your financial management</p>
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
                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-text-muted uppercase tracking-[1.5px] block ml-1 mb-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors z-10" size={18} />
                                <input
                                    type="email" required
                                    style={{ paddingLeft: '80px' }}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/50 rounded-2xl pr-4 py-4 outline-none transition-all text-card-foreground text-sm font-medium shadow-sm"
                                    placeholder="admin@financebook.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[11px] font-black text-text-muted uppercase tracking-[1.5px] block ml-1 mb-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors z-10" size={18} />
                                <input
                                    type="password" required
                                    style={{ paddingLeft: '80px' }}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/50 rounded-2xl pr-4 py-4 outline-none transition-all text-card-foreground text-sm font-medium shadow-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-end px-1 mt-1">
                                <button
                                    type="button"
                                    onClick={() => setIsResetModalOpen(true)}
                                    className="text-[11px] font-bold text-primary hover:underline underline-offset-4"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 hover:bg-primary/95 mt-4"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'} <LogIn size={18} />
                    </motion.button>
                </form>

                <div className="relative py-12">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold">
                        <span className="bg-[#f8fafc] dark:bg-[#1e293b] px-4 text-text-muted tracking-[2px] leading-none">Or Secure Login with</span>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-4 bg-gray-100 dark:bg-white/5 border border-border rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-card-foreground group"
                >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google Cloud
                </motion.button>

                <p className="text-center text-sm text-text-muted font-medium pt-2">
                    Don't have an account? <Link to="/signup" className="text-primary font-bold hover:underline underline-offset-4">Sign Up</Link>
                </p>
            </motion.div>

            <Modal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                title="Reset Password"
            >
                <form onSubmit={handleResetPassword} className="space-y-6">
                    <p className="text-sm text-text-muted font-medium">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    {resetMessage && (
                        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-bold text-center">
                            {resetMessage}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] pl-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                            <input
                                type="email" required
                                className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-primary/50 rounded-2xl pl-12 pr-4 py-4 outline-none transition-all text-card-foreground text-sm font-medium"
                                placeholder="name@example.com"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => setIsResetModalOpen(false)}
                            className="flex-1 py-4 rounded-2xl border border-border hover:bg-gray-50 dark:hover:bg-white/5 font-bold transition-all text-text-muted text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 text-sm hover:bg-primary/90"
                        >
                            {loading ? 'Sending...' : 'Send Link'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
