import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load components for route-based code splitting
const Layout = lazy(() => import('./components/Layout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

// Premium Loading Fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0c0e12]">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-t-4 border-primary animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full bg-primary/20 animate-pulse" />
      </div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingFallback />}>
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
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#0c0e12] text-white">
              <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
              <p className="text-xl text-gray-400 mb-8">Oops! The page you're looking for doesn't exist.</p>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                Go to Dashboard
              </button>
            </div>
          } />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
