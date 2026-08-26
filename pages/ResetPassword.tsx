
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import BottomTabBar from '../components/darkroast/BottomTabBar';
import { useToast } from '../context/ToastContext';

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { updatePassword } = useApp();

    const returnPath = location.state?.returnPath;
    const isProfileUpdate = !!returnPath;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const result = await updatePassword(password);
            if (result.success) {
                toast.success('Password updated successfully!');
                navigate(returnPath || '/');
            } else {
                toast.error(result.error?.message || 'Failed to update password');
            }
        } catch (error) {
            console.error('[ResetPassword] Unexpected error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-[110px]" style={{ background: '#1e1712' }}>
            {/* Sticky glass header */}
            <header
                className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.07]"
                style={{ background: 'rgba(23,18,14,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            >
                <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-3">
                    <button
                        onClick={() => navigate(returnPath || '/')}
                        aria-label="Go back"
                        className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
                        style={{ background: '#2b221b' }}
                    >
                        <i className="fas fa-arrow-left text-sm" style={{ color: '#f3efe0' }}></i>
                    </button>
                    <h1 className="font-serif text-[19px] font-black" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>
                        {isProfileUpdate ? 'Change Password' : 'Reset Password'}
                    </h1>
                </div>
            </header>
            <div className="w-full max-w-md p-8 rounded-3xl border border-white/[0.09]" style={{ background: '#2b221b' }}>
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 transition-transform hover:rotate-6 border border-white/[0.09]" style={{ background: '#2f251d' }}>
                        <i className={`fas ${isProfileUpdate ? 'fa-lock' : 'fa-key'} text-volt-400 text-3xl filter drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]`}></i>
                    </div>
                    <h1 className="text-3xl font-serif font-black mb-2" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>
                        {isProfileUpdate ? 'Change Password' : 'Set New Password'}
                    </h1>
                    <p className="font-medium" style={{ color: '#e4ddce' }}>
                        {isProfileUpdate
                            ? 'Enter your new password below.'
                            : 'Please enter your new password below.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: '#f3efe0' }}>New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-white/[0.09] focus:ring-2 focus:ring-volt-400 outline-none font-medium placeholder:text-[rgba(243,239,224,0.35)]"
                                style={{ background: '#2f251d', color: '#f3efe0' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-volt-400 focus:outline-none transition-colors"
                                style={{ color: 'rgba(243,239,224,0.45)' }}
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: '#f3efe0' }}>Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-white/[0.09] focus:ring-2 focus:ring-volt-400 outline-none font-medium placeholder:text-[rgba(243,239,224,0.35)]"
                                style={{ background: '#2f251d', color: '#f3efe0' }}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-volt-400 focus:outline-none transition-colors"
                                style={{ color: 'rgba(243,239,224,0.45)' }}
                                tabIndex={-1}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <Button type="submit" variant="secondary" className="w-full py-4 font-extrabold" isLoading={loading}>
                        {loading ? 'Updating Password...' : 'Update Password'}
                    </Button>

                    {isProfileUpdate && (
                        <button
                            type="button"
                            onClick={() => navigate(returnPath)}
                            className="w-full py-2 font-bold text-sm hover:text-volt-400 transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400 rounded"
                            style={{ color: 'rgba(243,239,224,0.5)' }}
                        >
                            Cancel
                        </button>
                    )}
                </form>
            </div>
            <BottomTabBar />
        </div>
    );
};

export default ResetPassword;
