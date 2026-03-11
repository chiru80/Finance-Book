import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10, rotateX: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10, rotateX: -5 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        className="relative w-full max-w-xl premium-card bg-card/80 backdrop-blur-2xl border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-8 border-b border-border/50 bg-secondary/30">
                            <div>
                                <h3 className="text-2xl font-black text-foreground tracking-tight">{title}</h3>
                                <div className="h-1 w-12 bg-primary mt-2 rounded-full" />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-3 bg-secondary/50 hover:bg-danger/10 rounded-2xl transition-all text-foreground/30 hover:text-danger border border-border/50"
                            >
                                <X size={20} />
                            </motion.button>
                        </div>

                        <div className="p-8 sm:p-10 max-h-[85vh] overflow-y-auto custom-scrollbar bg-card/10">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
