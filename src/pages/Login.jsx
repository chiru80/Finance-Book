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
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    y: [0, 30, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full"
            />
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    x: [0, -50, 0],
                    y: [0, -30, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-secondary/20 blur-[120px] rounded-full"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
                className="w-full max-w-[480px] space-y-10 premium-card p-10 sm:p-14 relative z-10 backdrop-blur-3xl border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
            >
                <div className="text-center relative">
                    <motion.div
                        initial={{ scale: 0.5, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="mx-auto w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/5 text-primary rounded-[2.5rem] flex items-center justify-center mb-8 border-2 border-primary/20 shadow-2xl shadow-primary/20"
                    >
                        <Wallet size={44} className="drop-shadow-lg" />
                    </motion.div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter">FINANCE<span className="text-primary/80">BOOK</span></h1>
                    <p className="text-[10px] text-foreground/30 font-black uppercase tracking-[0.4em] mt-3">Intelligence-Led Capital Management</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-5 bg-danger/10 border border-danger/20 text-danger rounded-2xl text-xs font-black uppercase tracking-widest text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.25em] block ml-1">Secure Identity (Email)</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors z-10" size={20} />
                                <input
                                    type="email" required
                                    className="w-full bg-secondary/50 border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl pl-16 pr-6 py-5 outline-none transition-all text-foreground text-sm font-bold shadow-sm"
                                    placeholder="operator@nexus.io"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.25em] block ml-1">Access Credential</label>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors z-10" size={20} />
                                <input
                                    type="password" required
                                    className="w-full bg-secondary/50 border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl pl-16 pr-6 py-5 outline-none transition-all text-foreground text-sm font-bold shadow-sm"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-end px-1 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsResetModalOpen(true)}
                                    className="text-[10px] font-black text-primary/60 hover:text-primary uppercase tracking-widest transition-colors"
                                >
                                    Lost Credentials?
                                </button>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-primary text-white rounded-2xl font-black transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] border-b-4 border-primary-foreground/20 hover:border-b-0 hover:translate-y-1 active:border-b-0"
                    >
                        {loading ? 'Decrypting Access...' : 'Authenticate'} <LogIn size={20} />
                    </motion.button>
                </form>

                <div className="relative py-10">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-[1px] bg-border/50"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black">
                        <span className="bg-card px-6 text-foreground/20 tracking-[0.3em]">External Gateway</span>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(var(--foreground-rgb), 0.05)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-5 bg-secondary/50 border border-border rounded-2xl font-black transition-all flex items-center justify-center gap-4 text-foreground/60 group text-[11px] uppercase tracking-widest"
                >
                    <svg className="w-5 h-5 group-hover:scale-125 transition-transform" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google Cloud Auth
                </motion.button>

                <p className="text-center text-xs text-foreground/30 font-black uppercase tracking-widest pt-4">
                    New Operator? <Link to="/signup" className="text-primary hover:text-primary/80 transition-colors border-b-2 border-primary/20 hover:border-primary pb-1 ml-2">Initialize Account</Link>
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
