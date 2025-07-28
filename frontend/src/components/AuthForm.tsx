import React, { useState } from 'react';
import authService, { RegisterData, LoginData, VerifyEmailData } from '../services/authService';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'login' | 'register' | 'verify';

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    isrole: 'patient',
    otp: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = (): boolean => {
    if (mode === 'register') {
      if (!formData.name.trim()) {
        setError('Name is required');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    }
    
    if (mode === 'verify') {
      if (!formData.otp.trim() || formData.otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        return false;
      }
    } else {
      if (!formData.email.trim()) {
        setError('Email is required');
        return false;
      }
      if (!formData.password.trim()) {
        setError('Password is required');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const loginData: LoginData = {
          email: formData.email,
          password: formData.password
        };
        await authService.login(loginData);
        setSuccess('Login successful!');
        setTimeout(() => onAuthSuccess(), 1000);
      } 
      else if (mode === 'register') {
        const registerData: RegisterData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          isrole: formData.isrole
        };
        await authService.register(registerData);
        setPendingEmail(formData.email);
        setSuccess('Registration successful! Please check your email for OTP.');
        setMode('verify');
      }
      else if (mode === 'verify') {
        const verifyData: VerifyEmailData = {
          email: pendingEmail,
          otp: formData.otp
        };
        await authService.verifyEmail(verifyData);
        setSuccess('Email verified successfully!');
        setTimeout(() => onAuthSuccess(), 1000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      await authService.resendOTP(pendingEmail);
      setSuccess('OTP resent successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      isrole: 'patient',
      otp: ''
    });
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'verify' && 'Verify Email'}
          </h2>
          <p className="text-gray-400">
            {mode === 'login' && 'Sign in to your eClinicPro account'}
            {mode === 'register' && 'Join the eClinicPro platform'}
            {mode === 'verify' && `Enter the OTP sent to ${pendingEmail}`}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-colors"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          {mode !== 'verify' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <select
                name="isrole"
                value={formData.isrole}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-colors"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          {mode !== 'verify' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-colors"
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          {mode === 'verify' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                OTP Code
              </label>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-colors text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-violet-500/20 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Processing...' : (
              mode === 'login' ? 'Sign In' :
              mode === 'register' ? 'Create Account' :
              'Verify Email'
            )}
          </button>
        </form>

        {/* Additional Actions */}
        <div className="mt-6 text-center space-y-4">
          {mode === 'verify' && (
            <button
              onClick={handleResendOTP}
              disabled={loading}
              className="text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
            >
              Resend OTP
            </button>
          )}

          {mode !== 'verify' && (
            <div className="flex justify-center space-x-1 text-sm">
              <span className="text-gray-400">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          )}

          {mode === 'verify' && (
            <div className="flex justify-center space-x-1 text-sm">
              <span className="text-gray-400">Wrong email?</span>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-violet-400 hover:text-violet-300 transition-colors font-medium"
              >
                Go back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;