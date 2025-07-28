import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthForm from './components/AuthForm';
import authService from './services/authService';

// Simple Dashboard component for authenticated users
const Dashboard: React.FC = () => {
  const user = authService.getCurrentUser();
  
  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome to eClinicPro Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p><span className="text-gray-400">Name:</span> {user?.name}</p>
              <p><span className="text-gray-400">Email:</span> {user?.email}</p>
            </div>
            <div>
              <p><span className="text-gray-400">Role:</span> <span className="capitalize">{user?.isrole}</span></p>
              <p><span className="text-gray-400">Verified:</span> {user?.isverified ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-violet-600 hover:bg-violet-700 p-4 rounded-lg cursor-pointer transition-colors">
              <h3 className="font-semibold">Appointments</h3>
              <p className="text-sm opacity-80">Manage your appointments</p>
            </div>
            <div className="bg-indigo-600 hover:bg-indigo-700 p-4 rounded-lg cursor-pointer transition-colors">
              <h3 className="font-semibold">Medical Records</h3>
              <p className="text-sm opacity-80">View medical history</p>
            </div>
            <div className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg cursor-pointer transition-colors">
              <h3 className="font-semibold">Billing</h3>
              <p className="text-sm opacity-80">Payment & invoices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Protected Route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route 
                    path="/login" 
                    element={
                        authService.isAuthenticated() ? 
                        <Navigate to="/dashboard" replace /> : 
                        <AuthForm onAuthSuccess={() => window.location.href = '/dashboard'} />
                    } 
                />
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}
