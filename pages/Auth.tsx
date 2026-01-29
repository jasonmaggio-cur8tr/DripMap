
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, signup, user } = useApp();

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (mode === 'signup' && !username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      if (mode === 'signup') {
        const result = await signup(email, password, username);
        if (result.success) {
          setShowVerifyEmail(true);
        } else {
          toast.error(result.error || 'Failed to create account');
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          toast.success('Welcome back!');
          navigate('/');
        } else {
          toast.error(result.error || 'Invalid email or password');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show verify email screen after successful signup
  if (showVerifyEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-50 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-coffee-100 text-center">
          <div className="w-20 h-20 bg-volt-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-envelope text-coffee-900 text-3xl"></i>
          </div>
          <h1 className="text-3xl font-serif font-black text-coffee-900 mb-4">
            Check Your Email
          </h1>
          <p className="text-coffee-600 mb-6">
            We've sent a verification link to <span className="font-bold text-coffee-900">{email}</span>.
            Please check your inbox and click the link to verify your account.
          </p>
          <p className="text-sm text-coffee-400 mb-6">
            Don't see it? Check your spam folder.
          </p>
          <button
            onClick={() => {
              setShowVerifyEmail(false);
              setMode('login');
              setPassword('');
            }}
            className="text-coffee-900 font-bold hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-coffee-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-coffee-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-coffee-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 transition-transform hover:rotate-6">
            <i className="fas fa-droplet text-volt-400 text-4xl filter drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]"></i>
          </div>
          <h1 className="text-4xl font-serif font-black text-coffee-900 tracking-tighter mb-2" style={{ fontVariationSettings: '"SOFT" 100' }}>
            DripMap
          </h1>
          <p className="text-coffee-600 font-medium">
            {mode === 'signup' ? 'Join the community of coffee explorers' : 'Welcome back!'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 p-1 bg-coffee-50 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
              mode === 'login'
                ? 'bg-white text-coffee-900 shadow-sm'
                : 'text-coffee-400 hover:text-coffee-600'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
              mode === 'signup'
                ? 'bg-white text-coffee-900 shadow-sm'
                : 'text-coffee-400 hover:text-coffee-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2">Username</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none font-medium"
                placeholder="coffeeexplorer"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-coffee-900 mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none font-medium"
              placeholder="barista@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-coffee-900 mb-2">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none font-medium"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {mode === 'signup' && (
              <p className="text-xs text-coffee-400 mt-1">Minimum 6 characters</p>
            )}
          </div>
          
          <Button type="submit" className="w-full py-4" isLoading={loading}>
            {loading 
              ? (mode === 'signup' ? 'Creating Account...' : 'Signing In...')
              : (mode === 'signup' ? 'Create Account' : 'Sign In')
            }
          </Button>
        </form>

        <p className="text-center text-xs text-coffee-400 mt-6">
          By continuing, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
};

export default Auth;
