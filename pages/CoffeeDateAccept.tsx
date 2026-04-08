import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCoffeeDateByInviteToken, acceptCoffeeDateInvite } from '../services/dbService';
import { useToast } from '../context/ToastContext';
import { loopService } from '../services/loopService';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

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

    if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-center p-6"><h1 className="text-xl font-bold text-coffee-900">{error}</h1></div>;

    if (accepted) {
        return (
            <div className="min-h-screen bg-coffee-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-check text-green-500 text-3xl"></i>
                    </div>
                    <h1 className="text-3xl font-serif font-black text-coffee-900 mb-2">You're Going! ☕️</h1>
                    <p className="text-coffee-600 mb-6">See you at <strong>{shop?.name}</strong> on {new Date(date?.starts_at).toLocaleDateString()}.</p>
                    <div className="bg-coffee-50 p-4 rounded-xl mb-6">
                        <p className="text-sm font-bold text-coffee-800">Add to Calendar</p>
                        <button
                            onClick={() => generateICS(date, shop?.name || "Coffee Shop", shop?.location?.address || "TBD")}
                            className="text-volt-600 font-bold text-sm hover:underline mt-1"
                        >
                            Download .ics file
                        </button>
                    </div>
                    <Button onClick={() => navigate('/')}>Find More Shops</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-coffee-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-xl">
                <div className="h-40 bg-coffee-900 relative">
                    {shop?.gallery?.[0] && (
                        <img src={shop.gallery[0].url} alt={shop.name} className="w-full h-full object-cover opacity-60" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold border border-white/20">
                            Coffee Date Invitation
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <h2 className="text-center text-2xl font-serif font-black text-coffee-900 mb-6">{date?.message || "Let's meet for coffee!"}</h2>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-4 p-4 bg-coffee-50 rounded-xl">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-coffee-900 shadow-sm"><i className="fas fa-map-marker-alt"></i></div>
                            <div>
                                <p className="text-xs font-bold text-coffee-500 uppercase">Where</p>
                                <p className="font-bold text-coffee-900">{shop?.name}</p>
                                <p className="text-xs text-coffee-600">{shop?.location?.address}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-coffee-50 rounded-xl">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-coffee-900 shadow-sm"><i className="fas fa-clock"></i></div>
                            <div>
                                <p className="text-xs font-bold text-coffee-500 uppercase">When</p>
                                <p className="font-bold text-coffee-900">{new Date(date?.starts_at).toLocaleDateString()}</p>
                                <p className="text-xs text-coffee-600">{new Date(date?.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </div>

                    <Button onClick={handleAccept} disabled={isAccepting} className="w-full py-4 text-lg">
                        {isAccepting ? 'Confirming...' : 'Yes, I\'ll be there!'}
                    </Button>
                    <p className="text-center text-xs text-coffee-400 mt-4">By accepting, we'll notify the organizer.</p>
                </div>
            </div>
        </div>
    );
};

export default CoffeeDateAccept;
