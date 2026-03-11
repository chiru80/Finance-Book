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
            return setError('Access keys do not match. Re-verify password.');
        }

        setLoading(true);
        setError('');
        try {
            await register(email, password);
            navigate('/');
        } catch (err) {
            setError('Registry failure: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    x: [-20, 30, -20],
                    y: [-20, 30, -20]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 w-[50%] h-[50%] bg-primary/10 blur-[100px] rounded-full"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    x: [20, -30, 20],
                    y: [20, -30, 20]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-secondary/10 blur-[100px] rounded-full"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
                className="w-full max-w-[480px] space-y-10 premium-card p-10 sm:p-14 relative z-10 backdrop-blur-3xl border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
            >
                <div className="relative">
                    <motion.div whileHover={{ x: -4 }}>
                        <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-foreground/30 hover:text-primary transition-colors mb-8 uppercase tracking-[0.2em]">
                            <ArrowLeft size={14} /> Return to Gateway
                        </Link>
                    </motion.div>

                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mx-auto w-24 h-24 bg-gradient-to-br from-primary/30 to-primary/5 text-primary rounded-[2.5rem] flex items-center justify-center mb-8 border-2 border-primary/20 shadow-2xl shadow-primary/20"
                        >
                            <UserPlus size={40} className="drop-shadow-lg" />
                        </motion.div>
                        <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">Initialize Account</h1>
                        <p className="text-[10px] text-foreground/30 font-black uppercase tracking-[0.4em] mt-3">Register new data management profile</p>
                    </div>
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
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.25em] block ml-1">Identity Protocol (Email)</label>
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
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.25em] block ml-1">Confirm Credential</label>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors z-10" size={20} />
                                <input
                                    type="password" required
                                    className="w-full bg-secondary/50 border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl pl-16 pr-6 py-5 outline-none transition-all text-foreground text-sm font-bold shadow-sm"
                                    placeholder="••••••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-primary text-white rounded-2xl font-black transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] border-b-4 border-primary-foreground/20 hover:border-b-0"
                    >
                        {loading ? 'Initializing Profile...' : 'Create Credentials'} <UserPlus size={20} />
                    </motion.button>
                </form>

                <p className="text-center text-xs text-foreground/30 font-black uppercase tracking-widest pt-4">
                    Existing Account? <Link to="/login" className="text-primary hover:text-primary/80 transition-colors border-b-2 border-primary/20 hover:border-primary pb-1 ml-2">Authenticate</Link>
                </p>
            </motion.div>
        </div>
    );
}
