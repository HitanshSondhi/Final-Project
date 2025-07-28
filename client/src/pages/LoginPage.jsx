import React, { useState } from 'react';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/v1/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Logged in successfully!');
        // TODO: route to dashboard or store auth state
      } else {
        setMessage(data?.message || 'Login failed');
      }
    } catch (error) {
      setMessage('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-gray-300 px-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full mb-4 p-3 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg hover:shadow-lg hover:shadow-violet-500/20 transition-shadow"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {message && (
          <p className="text-center mt-4 text-sm text-gray-400">{message}</p>
        )}
      </form>
    </div>
  );
}

export default LoginPage;