import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExperienceLog } from '../types';
import Button from './Button';
import { useToast } from '../context/ToastContext';
import { submitExperienceLog } from '../services/dbService';

interface ExperienceLogModalProps {
    shopId: string;
    shopName: string;
    existingLog?: ExperienceLog | null;
    onClose: () => void;
    onSuccess: () => void;
    vibeTags?: string[]; // To conditionally show sliders
}

const ExperienceLogModal: React.FC<ExperienceLogModalProps> = ({
    shopId,
    shopName,
    existingLog,
    onClose,
    onSuccess,
    vibeTags = []
}) => {
    const { user } = useApp();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        overallQuality: existingLog?.overallQuality ?? 80,
        bringFriendScore: existingLog?.bringFriendScore ?? 5,
        vibeEnergy: existingLog?.vibeEnergy ?? null,
        coffeeStyle: existingLog?.coffeeStyle ?? null,
        specialtyDrink: existingLog?.specialtyDrink ?? null,
        matchaProfile: existingLog?.matchaProfile ?? null,
        pastryCraft: existingLog?.pastryCraft ?? null,
        parkingEase: existingLog?.parkingEase ?? null,
        laptopFriendly: existingLog?.laptopFriendly ?? null,
        quickTake: existingLog?.quickTake ?? '',
        privateFeedback: '', // Not stored in log, separate table
    });

    const hasMatcha = vibeTags.includes('Matcha');
    const hasFood = vibeTags.includes('Pastries') || vibeTags.includes('Food');

    const handleSubmit = async () => {
        if (!user) {
            toast.error("You must be logged in to submit a log.");
            return;
        }
        setIsSubmitting(true);

        try {
            console.log("Submitting log for shop:", shopId, "User:", user.id, "Data:", formData);
            const { success, error } = await submitExperienceLog(shopId, user.id, formData);
            if (success) {
                toast.success("Experience Logged! Drip Score updating...");
                onSuccess();
                onClose();
            } else {
                console.error("Submit failed:", error);
                toast.error("Failed to submit log: " + (error?.message || "Unknown error"));
            }
        } catch (e: any) {
            console.error("Exception in handleSubmit:", e);
            toast.error("An error occurred: " + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const SliderField = ({
        label,
        value,
        onChange,
        leftLabel,
        rightLabel,
        helperText,
        min = 0,
        max = 100,
        step = 1,
        optional = false
    }: any) => {
        const isSet = value !== null;

        return (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-end mb-2">
                    <label className="font-serif font-bold text-lg flex items-center gap-2" style={{ color: '#f3efe0' }}>
                        {label}
                        {optional && !isSet && (
                            <span className="text-xs font-sans font-normal px-2 py-0.5 rounded-full" style={{ background: '#2f251d', color: 'rgba(243,239,224,0.5)' }}>
                                Optional
                            </span>
                        )}
                    </label>
                    <span className="text-volt-400 font-bold font-mono">
                        {isSet ? value : '-'}
                    </span>
                </div>

                {helperText && (
                    <p className="text-sm mb-3" style={{ color: 'rgba(243,239,224,0.5)' }}>{helperText}</p>
                )}

                <div className="relative h-12 flex items-center">
                    {/* Track */}
                    <div className="absolute w-full h-2 rounded-full overflow-hidden" style={{ background: '#2f251d' }}>
                        {/* Fill */}
                        <div
                            className="h-full bg-gradient-to-r from-coffee-800 to-volt-400 transition-all duration-100"
                            style={{ width: `${isSet ? ((value - min) / (max - min)) * 100 : 0}%` }}
                        ></div>
                    </div>

                    {/* Input */}
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={isSet ? value : min}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    {/* Thumb (Visual only, follows value) */}
                    {isSet && (
                        <div
                            className="absolute h-6 w-6 bg-[#f3efe0] border-2 border-[#231b15] rounded-full shadow-lg pointer-events-none flex items-center justify-center transform -translate-x-1/2"
                            style={{ left: `${((value - min) / (max - min)) * 100}%` }}
                        >
                            <div className="w-2 h-2 bg-volt-400 rounded-full"></div>
                        </div>
                    )}

                    {/* Optional: Click overlay to enable if null */}
                    {optional && !isSet && (
                        <div
                            className="absolute inset-0 z-20 cursor-pointer"
                            onClick={() => onChange(50)} // Default to middle
                            title="Click to rate"
                        ></div>
                    )}
                </div>

                <div className="flex justify-between text-xs font-medium uppercase tracking-wide mt-1" style={{ color: 'rgba(243,239,224,0.5)' }}>
                    <span>{leftLabel}</span>
                    <span>{rightLabel}</span>
                </div>

                {optional && isSet && (
                    <button
                        onClick={() => onChange(null)}
                        className="text-xs hover:text-red-400 underline mt-2"
                        style={{ color: 'rgba(243,239,224,0.5)' }}
                    >
                        Clear this rating
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-coffee-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="rounded-3xl w-full max-w-lg shadow-2xl border border-white/[0.09] flex flex-col max-h-[90vh] overflow-hidden relative" style={{ background: '#221a14' }}>

                {/* Header */}
                <div className="p-6 border-b border-white/[0.07] flex justify-between items-center z-10" style={{ background: '#221a14' }}>
                    <div>
                        <h2 className="text-xl font-serif font-black leading-tight" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>
                            Experience Log
                        </h2>
                        <p className="text-sm" style={{ color: 'rgba(243,239,224,0.5)' }}>
                            {shopName}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400" style={{ background: '#2b221b' }}>
                        <i className="fas fa-times" style={{ color: '#f3efe0' }}></i>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-6 flex-1">

                    {step === 1 && (
                        <>
                            <div className="mb-2">
                                <span className="text-xs font-bold text-volt-400 uppercase tracking-widest mb-1 block">Step 1 of 3</span>
                                <h3 className="text-lg font-bold mb-6" style={{ color: '#f3efe0' }}>The Core Signal</h3>
                            </div>

                            <SliderField
                                label="Overall Craft Quality"
                                value={formData.overallQuality}
                                onChange={(v: number) => setFormData(p => ({ ...p, overallQuality: v }))}
                                leftLabel="Solid"
                                rightLabel="Exceptional"
                                helperText="Your overall sense of quality and execution."
                            />

                            <div className="mb-0">
                                <div className="flex justify-between items-end mb-3">
                                    <label className="font-serif font-bold text-lg" style={{ color: '#f3efe0' }}>Bring a Friend?</label>
                                    <span className="text-volt-400 font-bold font-mono text-xl">{formData.bringFriendScore}</span>
                                </div>
                                <p className="text-sm mb-4" style={{ color: 'rgba(243,239,224,0.5)' }}>How likely are you to bring or recommend to a friend?</p>

                                <div className="flex justify-between gap-1">
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setFormData(p => ({ ...p, bringFriendScore: num }))}
                                            className={`
                        flex-1 h-10 rounded-lg text-sm font-bold transition-all
                        ${formData.bringFriendScore === num
                                                    ? 'bg-volt-400 text-[#231b15] transform scale-110 shadow-lg'
                                                    : 'bg-[#2f251d] text-[#e4ddce] hover:bg-[#382d23]'
                                                }
                      `}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs font-medium uppercase tracking-wide mt-2" style={{ color: 'rgba(243,239,224,0.5)' }}>
                                    <span>Not Likely</span>
                                    <span>Absolutely</span>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="mb-2">
                                <span className="text-xs font-bold text-volt-400 uppercase tracking-widest mb-1 block">Step 2 of 3</span>
                                <h3 className="text-lg font-bold mb-6" style={{ color: '#f3efe0' }}>Refine the Vibe (Optional)</h3>
                            </div>

                            <SliderField
                                label="Vibe Energy"
                                optional
                                value={formData.vibeEnergy}
                                onChange={(v: number | null) => setFormData(p => ({ ...p, vibeEnergy: v }))}
                                leftLabel="Quiet & Intimate"
                                rightLabel="Lively & Electric"
                                helperText="How the room feels."
                            />

                            <SliderField
                                label="Coffee Style"
                                optional
                                value={formData.coffeeStyle}
                                onChange={(v: number | null) => setFormData(p => ({ ...p, coffeeStyle: v }))}
                                leftLabel="Classic"
                                rightLabel="Experimental"
                                helperText="Traditional vs. Modern/Experimental."
                            />

                            <SliderField
                                label="Matcha Profile"
                                optional
                                value={formData.matchaProfile}
                                onChange={(v: number | null) => setFormData(p => ({ ...p, matchaProfile: v }))}
                                leftLabel="Earthy"
                                rightLabel="Trendy/Sweet"
                            />

                            <SliderField
                                label="Pastry/Food Craft"
                                optional
                                value={formData.pastryCraft}
                                onChange={(v: number | null) => setFormData(p => ({ ...p, pastryCraft: v }))}
                                leftLabel="Standard"
                                rightLabel="Exquisite"
                            />

                            <SliderField
                                label="Parking Ease"
                                optional
                                value={formData.parkingEase}
                                onChange={(v: number | null) => setFormData(p => ({ ...p, parkingEase: v }))}
                                leftLabel="None"
                                rightLabel="Plenty"
                            />

                            <SliderField
                                label="Laptop Friendly"
                                optional
                                value={formData.laptopFriendly}
                                onChange={(v: number | null) => setFormData(p => ({ ...p, laptopFriendly: v }))}
                                leftLabel="Unplug"
                                rightLabel="Work Friendly"
                            />
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="mb-2">
                                <span className="text-xs font-bold text-volt-400 uppercase tracking-widest mb-1 block">Step 3 of 3</span>
                                <h3 className="text-lg font-bold mb-6" style={{ color: '#f3efe0' }}>Final Thoughts</h3>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold mb-2" style={{ color: '#f3efe0' }}>
                                    Quick Take <span className="font-normal" style={{ color: 'rgba(243,239,224,0.5)' }}>(Public)</span>
                                </label>
                                <textarea
                                    className="w-full p-4 rounded-xl border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400"
                                    style={{ background: '#2f251d', color: '#f3efe0' }}
                                    rows={2}
                                    maxLength={140}
                                    placeholder="One sentence. What stood out?"
                                    value={formData.quickTake}
                                    onChange={e => setFormData(p => ({ ...p, quickTake: e.target.value }))}
                                />
                                <div className="text-right text-xs mt-1" style={{ color: 'rgba(243,239,224,0.5)' }}>
                                    {formData.quickTake.length}/140
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold mb-2" style={{ color: '#f3efe0' }}>
                                    Private Feedback <span className="font-normal" style={{ color: 'rgba(243,239,224,0.5)' }}>(Owner Only)</span>
                                </label>
                                <textarea
                                    className="w-full p-4 rounded-xl border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400"
                                    style={{ background: '#2f251d', color: '#f3efe0' }}
                                    rows={3}
                                    placeholder="Constructive feedback for the shop owner. They will appreciate it."
                                    value={formData.privateFeedback}
                                    onChange={e => setFormData(p => ({ ...p, privateFeedback: e.target.value }))}
                                />
                            </div>
                        </>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/[0.07] z-10 flex gap-3" style={{ background: '#221a14' }}>
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-3 rounded-full font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
                            style={{ background: '#2b221b', color: '#e4ddce', border: '1px solid rgba(255,255,255,0.09)' }}
                        >
                            Back
                        </button>
                    )}

                    <Button
                        onClick={() => {
                            if (step < 3) setStep(step + 1);
                            else handleSubmit();
                        }}
                        className="flex-1 py-3"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <i className="fas fa-spinner fa-spin"></i> Saving...
                            </span>
                        ) : step < 3 ? (
                            "Next"
                        ) : (
                            "Submit Log"
                        )}
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default ExperienceLogModal;
