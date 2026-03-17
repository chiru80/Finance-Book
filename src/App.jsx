import React from 'react';
import { motion } from 'framer-motion';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

import WeeklyView from './pages/WeeklyView';
import OnlinePayments from './pages/OnlinePayments';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="weekly" element={<WeeklyView />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="online-payments" element={<OnlinePayments />} />
          <Route path="settings" element={<div className="p-8 text-foreground/40 font-medium">Settings coming soon...</div>} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={
          <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 text-center" style={{ background: '#0A0A1A' }}>
            {/* Ambient Background Glow */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[400px] h-[400px] blur-[120px] rounded-full"
                style={{ background: '#7C3AED' }}
                aria-hidden="true"
            />

            <div className="relative z-10 space-y-6 max-w-md w-full">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="text-9xl font-extrabold text-white/5 leading-none tracking-tighter select-none"
                aria-hidden="true"
              >
                404
              </motion.div>

              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Page Not Found</h1>
                <p className="text-sm text-foreground/40 font-medium">
                  The page you're looking for doesn't exist or has been moved.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/'}
                className="w-full mt-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 text-sm transition-all"
              >
                Back to Dashboard
              </motion.button>
            </div>
          </div>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
