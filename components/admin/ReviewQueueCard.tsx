import React, { useState } from 'react';
import { ShopDraft } from '../../types';
import { Vibe } from '../../types';

interface ReviewQueueCardProps {
    draft: ShopDraft;
    onApprove: (draft: ShopDraft) => void;
    onReject: (draftId: string) => void;
}

const ReviewQueueCard: React.FC<ReviewQueueCardProps> = ({ draft, onApprove, onReject }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Parse data safely
    const { name, description, location, vibes, websiteUrl } = draft.data;
    const score = draft.score || 0;

    // Color coding for score
    const scoreColor = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
    const scoreBg = score >= 80 ? 'bg-green-100' : score >= 50 ? 'bg-yellow-100' : 'bg-red-100';

    return (
        <div className="bg-white rounded-xl border border-coffee-200 shadow-sm overflow-hidden mb-4 transition-all hover:shadow-md">
            {/* Header Summary */}
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg ${scoreBg} flex items-center justify-center`}>
                        <span className={`font-black text-lg ${scoreColor}`}>{score}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-coffee-900 text-lg">{name}</h3>
                        <p className="text-coffee-500 text-sm flex items-center gap-2">
                            <i className="fas fa-map-marker-alt"></i> {location?.address || 'No address'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${draft.status === 'PENDING_REVIEW' ? 'bg-volt-100 text-coffee-800' : 'bg-gray-100'}`}>
                        {draft.status.replace('_', ' ')}
                    </span>
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-coffee-400`}></i>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-coffee-100 bg-sand-50 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Visuals Column */}
                        <div>
                            <h4 className="font-bold text-coffee-800 mb-3 text-xs uppercase tracking-wider">Candidate Images</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {draft.data.gallery && draft.data.gallery.length > 0 ? (
                                    draft.data.gallery.slice(0, 3).map((img: any, i: number) => (
                                        <div key={i} className="aspect-square bg-coffee-100 rounded-md overflow-hidden relative group">
                                            <img src={img.url} alt="Candidate" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <i className="fas fa-check text-white"></i>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="aspect-square bg-coffee-200 rounded-md flex items-center justify-center text-coffee-400">
                                            <i className="fas fa-image"></i>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-4">
                                <h4 className="font-bold text-coffee-800 mb-2 text-xs uppercase tracking-wider">Parameters</h4>
                                <div className="flex flex-wrap gap-2">
                                    {vibes?.map((v: Vibe) => (
                                        <span key={v} className="bg-white border border-coffee-200 px-2 py-1 rounded-md text-xs text-coffee-700">
                                            {v}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* NEW: Hours Display */}
                            {draft.data.openHours && (
                                <div className="mt-4">
                                    <h4 className="font-bold text-coffee-800 mb-2 text-xs uppercase tracking-wider">Business Hours</h4>
                                    <div className="text-xs text-coffee-600 bg-white p-2 rounded border border-coffee-100">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            {Object.entries(draft.data.openHours).map(([day, hours]) => (
                                                <React.Fragment key={day}>
                                                    <span className="capitalize font-semibold text-coffee-700">{day}</span>
                                                    <span className="text-right">{hours as string}</span>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Details Column */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Description</label>
                                <p className="text-sm text-coffee-800 bg-white p-3 rounded border border-coffee-200 leading-relaxed">
                                    {description || 'No description provided.'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Source Information</label>
                                <a href={websiteUrl} target="_blank" rel="noreferrer" className="text-volt-600 hover:underline text-sm flex items-center gap-1 mb-2">
                                    <i className="fas fa-external-link-alt"></i> Website / Maps
                                </a>
                                {draft.scoreBreakdown?.reason && (
                                    <div className="bg-volt-50 p-3 rounded border border-volt-100">
                                        <p className="text-xs font-bold text-coffee-800 mb-1">Analysis:</p>
                                        <p className="text-xs text-coffee-700 italic">"{draft.scoreBreakdown.reason}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onApprove(draft); }}
                                    className="flex-1 bg-coffee-900 text-volt-400 py-3 rounded-lg font-bold hover:bg-black transition-colors"
                                >
                                    <i className="fas fa-check mr-2"></i> Approve & Publish
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onReject(draft.id); }}
                                    className="px-4 py-3 border border-red-200 text-red-600 bg-white rounded-lg font-bold hover:bg-red-50 transition-colors"
                                >
                                    <i className="fas fa-times"></i> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewQueueCard;
