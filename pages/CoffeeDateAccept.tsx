import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCoffeeDateByInviteToken, acceptCoffeeDateInvite } from '../services/dbService';
import { useToast } from '../context/ToastContext';
import { loopService } from '../services/loopService';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import BottomTabBar from '../components/darkroast/BottomTabBar';
import { sizedImageUrl } from '../lib/imageUrl';

const generateICS = (dateObj: any, shopName: string, location: string) => {
    if (!dateObj || !dateObj.starts_at) return;

    const start = new Date(dateObj.starts_at);
    // Assuming 1 hour duration if not specified
    const end = new Date(start.getTime() + (dateObj.duration_minutes || 60) * 60000);

    const formatDate = (d: Date) => {
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//DripMap//Coffee Date//EN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(start)}`,
        `DTEND:${formatDate(end)}`,
        `SUMMARY:Coffee Date at ${shopName}`,
        `LOCATION:${location}`,
        `DESCRIPTION:${dateObj.message || 'Coffee Date organized via DripMap!'}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `coffee-date-${shopName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const CoffeeDateAccept: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [invite, setInvite] = useState<any>(null);
    const [shop, setShop] = useState<any>(null);
    const [date, setDate] = useState<any>(null);
    const [error, setError] = useState('');
    const [isAccepting, setIsAccepting] = useState(false);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid invitation link.');
            setLoading(false);
            return;
        }

        const fetchInvite = async () => {
            const { success, data, error } = await getCoffeeDateByInviteToken(token);
            if (success && data) {
                setInvite(data);
                setDate(data.coffee_dates);
                setShop(data.coffee_dates.router_shop); // Assuming the join alias or structure
                // Note: The structure depends on how Supabase returns nested joins. 
                // Likely data.coffee_dates is the date object, and we need to fetch shop separate or nested?
                // The dbService query was .select('*, coffee_dates(*, router_shop:shops(*))')
                // So date.router_shop should be the shop.
            } else {
                setError('Invitation not found or expired.');
            }
            setLoading(false);
        };

        fetchInvite();
    }, [token]);

    const handleAccept = async () => {
        if (isAccepting || accepted) return;
        setIsAccepting(true);

        const { success } = await acceptCoffeeDateInvite(invite.id);
        if (success) {
            setAccepted(true);
            toast.success("You're in! 🎉");

            // 1. Generate ICS file download immediately inside the browser
            generateICS(date, shop?.name || "Coffee Shop", shop?.location?.address || "TBD");

            // 2. Trigger Loops Confirmed Emails
            const loopsPayload = {
                date: new Date(date?.starts_at).toLocaleDateString(),
                time: new Date(date?.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                shopName: shop?.name || "Coffee Shop",
            };

            // Send to the Invitee
            if (invite.invitee_email) {
                await loopService.sendTransactionalEmail(
                    invite.invitee_email,
                    "coffee_date_confirmed",
                    loopsPayload
                );
            }

            // Send to the Organizer
            if (date?.creator?.email) {
                await loopService.sendTransactionalEmail(
                    date.creator.email,
                    "coffee_date_confirmed",
                    loopsPayload
                );
            }
        } else {
            toast.error("Failed to accept invitation.");
        }
        setIsAccepting(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e1712' }}><LoadingSpinner /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-center p-6" style={{ background: '#1e1712' }}><h1 className="text-xl font-bold" style={{ color: '#f3efe0' }}>{error}</h1></div>;

    if (accepted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 pb-[110px]" style={{ background: '#1e1712' }}>
                <div className="rounded-3xl p-8 max-w-md w-full border border-white/[0.09] text-center" style={{ background: '#2b221b' }}>
                    <div className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-check text-green-400 text-3xl"></i>
                    </div>
                    <h1 className="text-3xl font-serif font-black mb-2" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>You're Going! ☕️</h1>
                    <p className="mb-6" style={{ color: '#e4ddce' }}>See you at <strong style={{ color: '#f3efe0' }}>{shop?.name}</strong> on {new Date(date?.starts_at).toLocaleDateString()}.</p>
                    <div className="p-4 rounded-xl mb-6" style={{ background: '#2f251d' }}>
                        <p className="text-sm font-bold" style={{ color: '#e4ddce' }}>Add to Calendar</p>
                        <button
                            onClick={() => generateICS(date, shop?.name || "Coffee Shop", shop?.location?.address || "TBD")}
                            className="text-volt-400 font-bold text-sm hover:underline mt-1 focus:outline-none focus:ring-2 focus:ring-volt-400 rounded"
                        >
                            Download .ics file
                        </button>
                    </div>
                    <Button variant="secondary" className="font-extrabold" onClick={() => navigate('/')}>Find More Shops</Button>
                </div>
                <BottomTabBar />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 pb-[110px]" style={{ background: '#1e1712' }}>
            <div className="rounded-3xl overflow-hidden max-w-md w-full border border-white/[0.09]" style={{ background: '#2b221b' }}>
                <div className="h-40 relative" style={{ background: '#231b15' }}>
                    {shop?.gallery?.[0] && (
                        <img src={sizedImageUrl(shop.gallery[0].url, { width: 1080 })} alt={shop.name} className="w-full h-full object-cover opacity-60" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold border border-white/20">
                            Coffee Date Invitation
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <h2 className="text-center text-2xl font-serif font-black mb-6" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>{date?.message || "Let's meet for coffee!"}</h2>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: '#2f251d' }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white/[0.09]" style={{ background: '#2b221b', color: '#ccff00' }}><i className="fas fa-map-marker-alt"></i></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase" style={{ color: 'rgba(243,239,224,0.5)', letterSpacing: '0.08em' }}>Where</p>
                                <p className="font-bold" style={{ color: '#f3efe0' }}>{shop?.name}</p>
                                <p className="text-xs" style={{ color: 'rgba(243,239,224,0.55)' }}>{shop?.location?.address}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: '#2f251d' }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white/[0.09]" style={{ background: '#2b221b', color: '#ccff00' }}><i className="fas fa-clock"></i></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase" style={{ color: 'rgba(243,239,224,0.5)', letterSpacing: '0.08em' }}>When</p>
                                <p className="font-bold" style={{ color: '#f3efe0' }}>{new Date(date?.starts_at).toLocaleDateString()}</p>
                                <p className="text-xs" style={{ color: 'rgba(243,239,224,0.55)' }}>{new Date(date?.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </div>

                    <Button variant="secondary" onClick={handleAccept} disabled={isAccepting} className="w-full py-4 text-lg font-extrabold">
                        {isAccepting ? 'Confirming...' : 'Yes, I\'ll be there!'}
                    </Button>
                    <p className="text-center text-xs mt-4" style={{ color: 'rgba(243,239,224,0.45)' }}>By accepting, we'll notify the organizer.</p>
                </div>
            </div>
            <BottomTabBar />
        </div>
    );
};

export default CoffeeDateAccept;
