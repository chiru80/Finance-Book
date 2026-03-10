import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

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
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="history" element={<div className="p-8 text-gray-500">History coming soon...</div>} />
          <Route path="settings" element={<div className="p-8 text-gray-500">Settings coming soon...</div>} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={
          <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 text-center bg-background relative overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 space-y-8 max-w-lg">
              <m.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="text-[180px] font-black text-foreground/5 leading-none tracking-tighter select-none"
              >
                404
              </m.div>

              <div className="space-y-4">
                <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Segment Not Found</h1>
                <p className="text-[11px] text-foreground/30 font-black uppercase tracking-[0.4em]">The requested data node does not exist or has been relocated.</p>
              </div>

              <m.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/'}
                className="mt-8 px-12 py-5 bg-primary text-white rounded-2xl font-black shadow-2xl shadow-primary/30 text-[11px] uppercase tracking-[0.3em] border-b-4 border-primary-foreground/20"
              >
                Return to Command Center
              </m.button>
            </div>
          </div>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
