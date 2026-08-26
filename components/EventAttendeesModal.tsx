import React from 'react';
import { useNavigate } from 'react-router-dom';
import { sizedImageUrl } from '../lib/imageUrl';

interface Attendee {
    userId: string;
    avatarUrl?: string;
    username?: string;
}

interface EventAttendeesModalProps {
    attendees: Attendee[];
    onClose: () => void;
    title?: string;
}

const EventAttendeesModal: React.FC<EventAttendeesModalProps> = ({ attendees, onClose, title = "Going" }) => {
    const navigate = useNavigate();

    const handleUserClick = (userId: string) => {
        onClose();
        navigate(`/profile/${userId}`);
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="rounded-3xl border border-white/[0.09] w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
                style={{ background: '#221a14' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-white/[0.07] flex justify-between items-center">
                    <h3 className="font-serif font-black text-lg" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>{title} ({attendees.length})</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
                        style={{ background: '#2b221b', color: '#f3efe0' }}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {attendees.length === 0 ? (
                        <div className="p-8 text-center" style={{ color: 'rgba(243,239,224,0.5)' }}>
                            <p>No one is going yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {attendees.map(attendee => (
                                <button
                                    key={attendee.userId}
                                    onClick={() => handleUserClick(attendee.userId)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(255,255,255,0.04)] transition-colors text-left group focus:outline-none focus:ring-2 focus:ring-volt-400"
                                >
                                    <img
                                        src={sizedImageUrl(attendee.avatarUrl, { width: 120 }) || `https://ui-avatars.com/api/?name=${attendee.username || 'User'}&background=random`}
                                        alt={attendee.username || 'User'}
                                        className="w-10 h-10 rounded-full border border-white/[0.09] object-cover"
                                    />
                                    <div>
                                        <p className="font-bold group-hover:text-volt-400 transition-colors" style={{ color: '#f3efe0' }}>
                                            {attendee.username || 'Unknown User'}
                                        </p>
                                        <p className="text-xs" style={{ color: 'rgba(243,239,224,0.5)' }}>View Profile</p>
                                    </div>
                                    <i className="fas fa-chevron-right ml-auto group-hover:text-volt-400" style={{ color: 'rgba(243,239,224,0.35)' }}></i>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventAttendeesModal;
