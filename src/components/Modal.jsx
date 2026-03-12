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
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        className="relative w-full max-w-xl premium-card overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border/50" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">{title}</h3>
                                <div className="h-0.5 w-10 bg-primary mt-2 rounded-full" />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2.5 rounded-xl transition-all text-foreground/30 hover:text-danger hover:bg-danger/10 border border-border/50"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </motion.button>
                        </div>

                        {/* Body */}
                        <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
