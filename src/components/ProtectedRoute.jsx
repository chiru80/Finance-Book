import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center text-gray-500">Initializing...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}
