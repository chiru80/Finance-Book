import React from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center h-screen w-screen overflow-hidden" style={{ background: '#0A0A1A' }}>
            {/* Ambient Background Glow */}
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.1, 0.25, 0.1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[400px] h-[400px] blur-[120px] rounded-full"
                style={{ background: '#7C3AED' }}
                aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="relative"
                >
                    {/* Pulsing Rings */}
                    <motion.div
                        animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 border-2 border-primary rounded-2xl"
                        aria-hidden="true"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.2], opacity: [0.4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                        className="absolute inset-0 border-2 border-primary rounded-2xl"
                        aria-hidden="true"
                    />

                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 relative z-10"
                        style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
                    >
                        <Wallet size={36} className="text-white" aria-hidden="true" />
                    </div>
                </motion.div>

                <div className="mt-10 text-center space-y-3">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl font-bold text-foreground"
                    >
                        <span className="text-white">Finance</span>
                        <span className="text-primary ml-1">Book</span>
                    </motion.h1>
                    <div className="w-40 h-1 rounded-full overflow-hidden mx-auto" style={{ background: 'rgba(167,139,250,0.1)' }}>
                        <motion.div
                            animate={{ x: [-160, 160] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="w-20 h-full bg-primary rounded-full"
                        />
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ delay: 0.6 }}
                        className="text-xs font-medium text-foreground/30"
                    >
                        Loading...
                    </motion.p>
                </div>
            </div>
        </div>
    );
}
