
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, signup, resetPassword, verifyEmailOtp, resendVerification, user, isPasswordResetting } = useApp();

  // Redirect back to where the user came from (e.g. /events RSVP), or home
  useEffect(() => {
    if (user && !showVerifyEmail && !loading && !isPasswordResetting) {
      const returnTo = (location.state as { from?: string } | null)?.from || '/';
      console.log('[Auth] User logged in, redirecting to', returnTo);
      navigate(returnTo);
    }
  }, [user, navigate, location.state, showVerifyEmail, loading, isPasswordResetting]);

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

  // Verify the 6-digit code from the signup email. The confirmation email sends
  // a code (not a clickable link), so we collect it here and call verifyOtp.
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length < 6) {
      toast.error('Please enter the 6-digit code from your email');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyEmailOtp(email, otp.trim());
      if (result.success) {
        toast.success('Email verified! Welcome to DripMap.');
        setShowVerifyEmail(false);
        setOtp('');
      } else {
        toast.error(result.error?.message || 'Invalid or expired code');
      }
    } catch (error) {
      console.error('[Auth] OTP verify error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const result = await resendVerification(email);
    if (result.success) {
      toast.success('New code sent — check your email.');
    } else {
      toast.error(result.error?.message || 'Could not resend the code');
    }
  };

  // Show 6-digit code entry after successful signup
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
            We've sent a 6-digit verification code to <span className="font-bold text-coffee-900">{email}</span>.
            Enter it below to finish creating your account.
          </p>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none font-bold text-center text-2xl tracking-[0.5em]"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              autoFocus
            />
            <Button type="submit" className="w-full py-4" isLoading={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>
          </form>
          <p className="text-sm text-coffee-400 mt-4 mb-3">
            Don't see it? Check your spam folder.
          </p>
          <button
            type="button"
            onClick={handleResend}
            className="text-coffee-900 font-bold hover:underline block mx-auto mb-4"
          >
            Resend code
          </button>
          <button
            type="button"
            onClick={() => {
              setShowVerifyEmail(false);
              setMode('login');
              setPassword('');
              setOtp('');
            }}
            className="text-coffee-500 text-sm font-bold hover:underline"
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-900 focus:outline-none transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
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
