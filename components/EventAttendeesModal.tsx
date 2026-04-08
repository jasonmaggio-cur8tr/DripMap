import React from 'react';
import { useNavigate } from 'react-router-dom';

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
                className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-coffee-50">
                    <h3 className="font-serif font-bold text-coffee-900 text-lg">{title} ({attendees.length})</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-coffee-400 hover:text-coffee-900 hover:bg-gray-100 transition-colors"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {attendees.length === 0 ? (
                        <div className="p-8 text-center text-coffee-400">
                            <p>No one is going yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {attendees.map(attendee => (
                                <button
                                    key={attendee.userId}
                                    onClick={() => handleUserClick(attendee.userId)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-coffee-50 transition-colors text-left group"
                                >
                                    <img
                                        src={attendee.avatarUrl || `https://ui-avatars.com/api/?name=${attendee.username || 'User'}&background=random`}
                                        alt={attendee.username || 'User'}
                                        className="w-10 h-10 rounded-full border border-gray-100 object-cover"
                                    />
                                    <div>
                                        <p className="font-bold text-coffee-900 group-hover:text-volt-600 transition-colors">
                                            {attendee.username || 'Unknown User'}
                                        </p>
                                        <p className="text-xs text-coffee-500">View Profile</p>
                                    </div>
                                    <i className="fas fa-chevron-right ml-auto text-coffee-300 group-hover:text-volt-500"></i>
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
