
import React, { useState } from 'react';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubscribe: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onSubscribe }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    if (!isOpen) return null;

    // Calculation: $28.88 * 12 = $346.56. $346.56 - $298.88 = $47.68 saved.
    const savingsAmount = 47.68;

    return (
        <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-coffee-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                
                {/* Basic Tier Column */}
                <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-coffee-50 bg-coffee-50/30 flex flex-col">
                    <div className="mb-8">
                        <span className="bg-coffee-100 text-coffee-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-coffee-200">Basic</span>
                        <h2 className="text-4xl font-serif font-black mt-4 mb-2 text-coffee-900">Owner</h2>
                        <p className="text-coffee-500 text-sm leading-relaxed font-medium">Claim your spot, get verified, and manage the essentials.</p>
                    </div>
                    
                    <div className="mb-10">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-coffee-900">$0</span>
                            <span className="text-coffee-400 font-bold text-sm">/ forever</span>
                        </div>
                    </div>

                    <ul className="space-y-4 mb-10 flex-1">
                        {[
                            "Verified 'Owner' Badge",
                            "Claim Listing Ownership",
                            "Update Hours & Contact Info",
                            "Standard Vibe Tag Selection",
                            "Up to 3 Gallery Photos"
                        ].map((feature, i) => (
                            <li key={i} className="flex gap-3 text-sm text-coffee-700 font-medium">
                                <span className="text-coffee-300 shrink-0"><i className="fas fa-check-circle"></i></span>
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button disabled className="w-full py-4 rounded-2xl border-2 border-coffee-100 font-bold text-coffee-300 cursor-not-allowed transition-all">
                        Included with Verification
                    </button>
                </div>

                {/* Pro Tier Column */}
                <div className="flex-1 p-8 md:p-12 bg-white relative flex flex-col">
                    {/* Animated Glow Decor */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-volt-400/20 rounded-full blur-[80px] pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <span className="bg-coffee-900 text-volt-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-volt-400/10">Pro Plan</span>
                                <h2 className="text-4xl font-serif font-black mt-4 mb-2 text-coffee-900">DripMap Pro</h2>
                            </div>
                            {billingCycle === 'annual' && (
                                <div className="bg-green-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-md animate-bounce">
                                    Save ${savingsAmount.toFixed(0)}+
                                </div>
                            )}
                        </div>

                        {/* Billing Toggle - Modern Pill Style */}
                        <div className="bg-coffee-50 p-1.5 rounded-2xl inline-flex mb-10 w-full border border-coffee-100">
                            <button 
                                onClick={() => setBillingCycle('monthly')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-300 ${billingCycle === 'monthly' ? 'bg-white shadow-xl shadow-coffee-900/5 text-coffee-900' : 'text-coffee-400 hover:text-coffee-600'}`}
                            >
                                Monthly
                            </button>
                            <button 
                                onClick={() => setBillingCycle('annual')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-300 relative ${billingCycle === 'annual' ? 'bg-white shadow-xl shadow-coffee-900/5 text-coffee-900' : 'text-coffee-400 hover:text-coffee-600'}`}
                            >
                                Annual Payment
                            </button>
                        </div>

                        <div className="mb-10 text-coffee-900">
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black tracking-tighter">
                                    {billingCycle === 'monthly' ? '$28.88' : '$298.88'}
                                </span>
                                <span className="text-coffee-400 font-bold text-lg">
                                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                </span>
                            </div>
                            {billingCycle === 'annual' && (
                                <p className="text-green-600 text-xs font-bold mt-2 flex items-center gap-1.5">
                                    <i className="fas fa-sparkles"></i> 
                                    Best Value: Saving ${savingsAmount.toFixed(2)} vs monthly
                                </p>
                            )}
                        </div>

                        <ul className="grid grid-cols-1 gap-3.5 mb-10 flex-1">
                            {[
                                { icon: "fa-calendar-star", label: "Event Management", sub: "Host tastings & workshops" },
                                { icon: "fa-bullhorn", label: "Marketing Suite", sub: "Run targeted ad campaigns" },
                                { icon: "fa-mug-hot", label: "Live Menu", sub: "'Now Brewing' digital board" },
                                { icon: "fa-spotify", label: "Vibe Setter", sub: "Spotify playlist integration" },
                                { icon: "fa-link", label: "Premium Links", sub: "Website, Ordering & Maps" },
                                { icon: "fa-tags", label: "Custom Vibe Tags", sub: "Create your own category" }
                            ].map((f, i) => (
                                <li key={i} className="flex gap-3.5 items-start">
                                    <div className="bg-coffee-900 text-volt-400 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 mt-0.5 shadow-md shadow-coffee-900/10">
                                        <i className={`fas ${f.icon}`}></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-coffee-900 leading-none mb-0.5">{f.label}</p>
                                        <p className="text-[10px] text-coffee-400 font-medium tracking-wide uppercase">{f.sub}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <button 
                            onClick={onSubscribe}
                            className="w-full py-5 rounded-[1.25rem] bg-coffee-900 text-volt-400 text-lg font-black shadow-2xl shadow-volt-400/20 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-3 group"
                        >
                            <span>Upgrade to Pro</span>
                            <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                        </button>
                        
                        <p className="text-center text-[10px] text-coffee-300 font-bold uppercase tracking-widest mt-5">
                            {billingCycle === 'monthly' ? 'Billed monthly. No commitment.' : 'One simple annual payment. Full access.'}
                        </p>
                    </div>
                </div>

                {/* Close Button - Mobile */}
                <button onClick={onClose} className="absolute top-6 left-6 md:hidden bg-white/80 backdrop-blur p-2 rounded-full z-10 text-coffee-900 shadow-xl border border-coffee-100">
                    <i className="fas fa-times"></i>
                </button>

                {/* Close Button - Desktop (Icon X only) */}
                <button onClick={onClose} className="hidden md:block absolute top-8 right-8 text-coffee-200 hover:text-coffee-900 transition-colors z-[160]">
                    <i className="fas fa-times text-xl"></i>
                </button>
            </div>
        </div>
    );
};

export default PricingModal;
