
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
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
        <div className="min-h-screen flex items-center justify-center bg-coffee-50 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-coffee-100">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-coffee-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 transition-transform hover:rotate-6">
                        <i className={`fas ${isProfileUpdate ? 'fa-lock' : 'fa-key'} text-volt-400 text-3xl filter drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]`}></i>
                    </div>
                    <h1 className="text-3xl font-serif font-black text-coffee-900 mb-2">
                        {isProfileUpdate ? 'Change Password' : 'Set New Password'}
                    </h1>
                    <p className="text-coffee-600 font-medium">
                        {isProfileUpdate
                            ? 'Enter your new password below.'
                            : 'Please enter your new password below.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-coffee-900 mb-2">New Password</label>
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
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-coffee-900 mb-2">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 pr-12 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none font-medium"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-900 focus:outline-none transition-colors"
                                tabIndex={-1}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <Button type="submit" className="w-full py-4" isLoading={loading}>
                        {loading ? 'Updating Password...' : 'Update Password'}
                    </Button>

                    {isProfileUpdate && (
                        <button
                            type="button"
                            onClick={() => navigate(returnPath)}
                            className="w-full py-2 text-coffee-500 font-bold text-sm hover:text-coffee-900 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
