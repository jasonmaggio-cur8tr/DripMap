
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { loopService } from '../services/loopService';
import { createCoffeeDate } from '../services/dbService'; // You need to implement this
import { useToast } from '../context/ToastContext';
import Button from './Button';

interface CoffeeDateCreateModalProps {
    shopId: string;
    shopName: string;
    onClose: () => void;
    onSuccess: () => void;
}

const TONES = [
    { id: 'talk_shop', label: 'Lets talk shop', icon: 'abacus', message: 'Hey, lets meet up and talk shop.' },
    { id: 'study', label: 'Study session', icon: 'book', message: 'Planning to get some work done here, join me?' },
    { id: 'meet_up', label: 'Catch up', icon: 'coffee', message: 'Though this would be a great spot to catch up.' },
    { id: 'custom', label: 'Custom', icon: 'pen', message: '' },
];

const CoffeeDateCreateModal: React.FC<CoffeeDateCreateModalProps> = ({ shopId, shopName, onClose, onSuccess }) => {
    const { user } = useApp();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [tone, setTone] = useState<string>('meet_up');
    const [message, setMessage] = useState(TONES.find(t => t.id === 'meet_up')?.message || '');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(60);
    const [invitees, setInvitees] = useState<string[]>(['']); // Array of emails/usernames

    const handleToneChange = (toneId: string) => {
        setTone(toneId);
        const preset = TONES.find(t => t.id === toneId);
        if (preset && toneId !== 'custom') {
            setMessage(preset.message);
        } else if (toneId === 'custom') {
            setMessage('');
        }
    };

    const handleInviteeChange = (index: number, value: string) => {
        const newInvitees = [...invitees];
        newInvitees[index] = value;
        setInvitees(newInvitees);
    };

    const addInviteeRow = () => {
        setInvitees([...invitees, '']);
    };

    const removeInviteeRow = (index: number) => {
        const newInvitees = invitees.filter((_, i) => i !== index);
        setInvitees(newInvitees);
    };

    const handleSubmit = async () => {
        if (!user) return;
        if (!date || !time) {
            toast.error('Please select a date and time');
            return;
        }

        const validInvitees = invitees.filter(i => i.trim() !== '');
        if (validInvitees.length === 0) {
            toast.error('Please add at least one person to invite');
            return;
        }

        setLoading(true);

        try {
            // Combine date and time
            const startDateTime = new Date(`${date}T${time}`).toISOString();

            // Prepare payload
            const coffeeDateData = {
                shop_id: shopId,
                created_by: user.id,
                starts_at: startDateTime,
                duration_minutes: duration,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                tone_preset: tone,
                message: message
            };

            // Detect invite types (simple heuristic: contains @ = email, else username)
            const invitesData = validInvitees.map(inviteStr => {
                const isEmail = inviteStr.includes('@');
                return {
                    invite_type: isEmail ? 'email' : 'user' as const,
                    invitee_email: isEmail ? inviteStr : undefined,
                    // invitee_user_id: undefined // logic to lookup user ID would go here for usernames
                };
            });

            // Call DB Service
            const result = await createCoffeeDate(coffeeDateData, invitesData);

            if (result.success) {
                // Trigger Emails via Loops (MVP: Send to inviter and first invitee if email)
                // In a real app, the backend/Edge Function should handle this to ensure consistency
                // For MVP client-side:

                // 1. Send confirmation to Creator
                await loopService.sendTransactionalEmail(
                    user.email,
                    "coffee_date_organizer_confirm", // You need to create this Transaction ID in Loops
                    {
                        shopName,
                        date: date,
                        time: time,
                        message,
                        inviteeCount: validInvitees.length
                    }
                );

                // 2. Send Invites
                invitesData.forEach(async (invite) => {
                    if (invite.invite_type === 'email' && invite.invitee_email) {
                        await loopService.sendTransactionalEmail(
                            invite.invitee_email,
                            "cmlpuhcf700pw0i1nqtlyw75w", // Invite ID from Loops
                            {
                                organizerName: user.username || "A DripMap User",
                                shopName,
                                date,
                                time,
                                message,
                                link: `https://dripmap.space/coffee-date/accept?token=PENDING_TOKEN_LOOKUP`
                                // Ideally pass the token returned from createCoffeeDate, but for MVP let's assume valid
                            }
                        );
                    }
                });

                toast.success('Coffee Date created! Invites sent.');
                onSuccess();
                onClose();
            } else {
                console.error(result.error);
                toast.error('Failed to create Coffee Date');
            }

        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 bg-coffee-50 border-b border-coffee-200 flex justify-between items-center">
                    <h2 className="text-2xl font-serif font-black text-coffee-900 flex items-center gap-2">
                        <i className="fas fa-mug-hot text-volt-400"></i> Coffee Date
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white hover:bg-coffee-100 flex items-center justify-center transition-colors">
                        <i className="fas fa-times text-coffee-600"></i>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 flex-1">

                    {/* 1. Tone Selector */}
                    <section>
                        <label className="block text-xs font-bold text-coffee-500 uppercase tracking-widest mb-3">Vibe Check</label>
                        <div className="grid grid-cols-2 gap-3">
                            {TONES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleToneChange(t.id)}
                                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${tone === t.id
                                        ? 'bg-coffee-900 text-white border-coffee-900 shadow-lg'
                                        : 'bg-white text-coffee-600 border-coffee-200 hover:border-coffee-400'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <i className={`fas fa-${t.icon} ${tone === t.id ? 'text-volt-400' : 'text-coffee-400'}`}></i>
                                        <span className="font-bold text-sm">{t.label}</span>
                                    </div>
                                    {tone === t.id && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full -mr-8 -mt-8"></div>}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 2. Message */}
                    <section>
                        <label className="block text-xs font-bold text-coffee-500 uppercase tracking-widest mb-3">The Pitch</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-4 bg-coffee-50 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-volt-400 text-coffee-900 font-medium"
                            rows={2}
                            placeholder="What's the plan?"
                        />
                    </section>

                    {/* 3. Date & Time */}
                    <section className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-coffee-500 uppercase tracking-widest mb-3">When?</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full p-3 bg-white border border-coffee-200 rounded-xl focus:outline-none focus:border-volt-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-coffee-500 uppercase tracking-widest mb-3">Time?</label>
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="w-full p-3 bg-white border border-coffee-200 rounded-xl focus:outline-none focus:border-volt-400"
                            />
                        </div>
                    </section>

                    {/* 4. Invitees */}
                    <section>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-xs font-bold text-coffee-500 uppercase tracking-widest">Who's Coming?</label>
                            <button onClick={addInviteeRow} className="text-volt-600 font-bold text-xs hover:underline">+ Add Person</button>
                        </div>

                        <div className="space-y-3">
                            {invitees.map((invite, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-coffee-300"></i>
                                        <input
                                            type="text"
                                            value={invite}
                                            onChange={(e) => handleInviteeChange(idx, e.target.value)}
                                            placeholder="Email address (or @username coming soon)"
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-coffee-200 rounded-xl focus:outline-none focus:border-volt-400 text-sm"
                                        />
                                    </div>
                                    {invitees.length > 1 && (
                                        <button onClick={() => removeInviteeRow(idx)} className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-coffee-400 mt-2 ml-1">
                            * We'll send them an email invite with a link to join.
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-coffee-100">
                    <Button onClick={handleSubmit} disabled={loading} className="w-full py-4 text-lg shadow-xl shadow-volt-400/20">
                        {loading ? 'Sending Invites...' : 'Send Invites 🚀'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CoffeeDateCreateModal;
