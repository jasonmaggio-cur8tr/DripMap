
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, signup, resetPassword, user, isPasswordResetting } = useApp();

  // Redirect to home if user is already logged in
  useEffect(() => {
    if (user && !showVerifyEmail && !loading && !isPasswordResetting) {
      console.log('[Auth] User logged in, redirecting home...');
      navigate('/');
    }
  }, [user, navigate, showVerifyEmail, loading, isPasswordResetting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Auth] Submitting form, mode:', mode);

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (mode !== 'forgot' && !password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    if (mode === 'signup' && !username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const result = await signup(email, password, username);
        console.log('[Auth] Signup result:', result);
        if (result.success) {
          setShowVerifyEmail(true);
        } else {
          toast.error(result.error?.message || 'Failed to create account');
        }
      } else if (mode === 'login') {
        const result = await login(email, password);
        console.log('[Auth] Login result:', result);
        if (result.success) {
          toast.success('Welcome back!');
          navigate('/');
        } else {
          toast.error(result.error?.message || 'Invalid email or password');
        }
      } else if (mode === 'forgot') {
        const result = await resetPassword(email);
        console.log('[Auth] Reset password result:', result);
        if (result.success) {
          toast.success('Check your email for the reset link!');
          setMode('login');
        } else {
          toast.error(result.error?.message || 'Failed to send reset email');
        }
      }
    } catch (error) {
      console.error('[Auth] Unexpected error:', error);
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
            {mode === 'signup' ? 'Join the community of coffee explorers' :
              mode === 'forgot' ? 'Reset your password' : 'Welcome back!'}
          </p>
        </div>

        {/* Mode Toggle - Hide in forgot mode */}
        {mode !== 'forgot' && (
          <div className="flex gap-2 mb-6 p-1 bg-coffee-50 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${mode === 'login'
                ? 'bg-white text-coffee-900 shadow-sm'
                : 'text-coffee-400 hover:text-coffee-600'
                }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${mode === 'signup'
                ? 'bg-white text-coffee-900 shadow-sm'
                : 'text-coffee-400 hover:text-coffee-600'
                }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {mode === 'forgot' && (
          <div className="mb-6 text-center">
            <p className="text-sm text-coffee-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
        )}

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

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-coffee-900">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs font-bold text-volt-500 hover:text-volt-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
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
          )}

          <Button type="submit" className="w-full py-4" isLoading={loading}>
            {loading
              ? (mode === 'signup' ? 'Creating Account...' : mode === 'forgot' ? 'Sending Link...' : 'Signing In...')
              : (mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Sign In')
            }
          </Button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full py-2 text-sm font-bold text-coffee-500 hover:text-coffee-900"
            >
              Back to Login
            </button>
          )}
        </form>

        <p className="text-center text-xs text-coffee-400 mt-6">
          By continuing, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
};

export default Auth;
