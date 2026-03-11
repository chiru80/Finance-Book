import React from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-background h-screen w-screen overflow-hidden">
            {/* Ambient Background Glow */}
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full"
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
                        animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 border-2 border-primary rounded-[2rem]"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                        className="absolute inset-0 border-2 border-primary rounded-[2.5rem]"
                    />

                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 text-white rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10">
                        <Wallet size={44} />
                    </div>
                </motion.div>

                <div className="mt-12 text-center space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-black text-foreground tracking-tighter uppercase"
                    >
                        Initializing <span className="text-primary">Nexus</span>
                    </motion.h1>
                    <div className="w-48 h-1 bg-secondary/50 rounded-full overflow-hidden mx-auto">
                        <motion.div
                            animate={{ x: [-200, 200] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="w-24 h-full bg-primary"
                        />
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ delay: 0.6 }}
                        className="text-[9px] font-black uppercase tracking-[0.4em] ml-1"
                    >
                        Syncing Distributed Ledger
                    </motion.p>
                </div>
            </div>
        </div>
    );
}
