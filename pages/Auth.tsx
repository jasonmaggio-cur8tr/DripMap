
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    
    // DEMO BYPASS: Immediately log in without Supabase magic link
    await login(email);
    
    setLoading(false);
    toast.success('Welcome to DripMap!');
    navigate('/profile');
  };

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
          <p className="text-coffee-600 font-medium">Join the community of coffee explorers.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
          
          <Button type="submit" className="w-full py-4" isLoading={loading}>
            {loading ? 'Signing In...' : 'Start Exploring'}
          </Button>
        </form>

        <p className="text-center text-xs text-coffee-400 mt-6">
          By continuing, you agree to our Terms of Service. <br/>
          <strong>Demo Mode:</strong> Instant login enabled.
        </p>
      </div>
    </div>
  );
};

export default Auth;
