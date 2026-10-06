import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import BottomTabBar from '../components/darkroast/BottomTabBar';

// The Coffee Cup: 3v3 street soccer tournament between Sacramento coffee & tea shops.
// Shop interest form writes to public.coffee_cup_interest (insert-only RLS, so no .select() after insert).

const TEXT = '#f3efe0';
const MUTED = 'rgba(243,239,224,0.55)';

// Dark Roast input treatment (same as ClaimShop / AddSpot)
const darkInput =
  'w-full px-4 py-3 bg-[#2f251d] border border-white/[0.09] text-[#f3efe0] placeholder:text-[rgba(243,239,224,0.35)] rounded-xl focus:ring-2 focus:ring-volt-400 outline-none';
const labelClass = 'block text-[10px] font-bold uppercase tracking-[0.08em] mb-2';

const SUNDAYS = [
  { value: '2027-02-21', label: 'Sun, Feb 21' },
  { value: '2027-02-28', label: 'Sun, Feb 28' },
  { value: '2027-03-07', label: 'Sun, Mar 7' },
];
const INTEREST = [
  { value: 'in', label: "We're in" },
  { value: 'probably', label: 'Probably, tell me more' },
  { value: 'curious', label: 'Just curious' },
];
const ROSTER = [
  { value: 'ready', label: 'We can field a team' },
  { value: 'need_players', label: "We'd like help finding players" },
  { value: 'not_sure', label: 'Not sure yet' },
];
const EXTRAS = [
  { value: 'sponsor', label: 'Sponsoring the event' },
  { value: 'pour', label: 'Pouring coffee on the day' },
];

interface ShopHit {
  id: string;
  name: string;
  city: string | null;
  is_claimed: boolean | null;
}

const Chip: React.FC<{ selected: boolean; onClick: () => void; role?: string; children: React.ReactNode }> = ({
  selected,
  onClick,
  role,
  children,
}) => (
  <button
    type="button"
    role={role}
    aria-checked={role ? selected : undefined}
    aria-pressed={role ? undefined : selected}
    onClick={onClick}
    className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400 ${
      selected ? 'bg-volt-400 border-volt-400 text-coffee-900' : 'bg-[#2f251d] border-white/[0.09] text-[#f3efe0] hover:border-white/[0.2]'
    }`}
  >
    {children}
  </button>
);

const CoffeeCup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  // Shop picker
  const [shopQuery, setShopQuery] = useState('');
  const [shopHits, setShopHits] = useState<ShopHit[]>([]);
  const [shop, setShop] = useState<ShopHit | null>(null);
  const [notListed, setNotListed] = useState(false);

  // Contact + answers
  const [contactName, setContactName] = useState('');
  const [role, setRole] = useState('owner');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [interest, setInterest] = useState('');
  const [sundays, setSundays] = useState<string[]>([]);
  const [roster, setRoster] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  useEffect(() => {
    const q = shopQuery.trim().replace(/[%_]/g, '');
    if (shop || notListed || q.length < 2) {
      setShopHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('shops')
        .select('id, name, city, is_claimed')
        .ilike('name', `%${q}%`)
        .order('name')
        .limit(6);
      if (!cancelled) setShopHits((data as ShopHit[]) || []);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [shopQuery, shop, notListed]);

  const toggle = (list: string[], value: string, set: (v: string[]) => void) =>
    set(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);

  const scrollToForm = () => document.getElementById('join')?.scrollIntoView({ behavior: 'smooth' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const shopName = (shop ? shop.name : shopQuery).trim();
    if (!shopName) return setError('Which shop are you with?');
    if (!contactName.trim()) return setError('Add your name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Add a valid email so we can reach you.');
    if (!interest) return setError("Let us know how interested you are, even if it's just curious.");

    setSubmitting(true);
    const { error: insertError } = await supabase.from('coffee_cup_interest').insert({
      shop_id: shop?.id ?? null,
      shop_name: shopName.slice(0, 120),
      contact_name: contactName.trim().slice(0, 120),
      role,
      email: email.trim(),
      phone: phone.trim() || null,
      instagram: instagram.trim().replace(/^@/, '') || null,
      interest,
      sundays,
      roster: roster || null,
      extras,
      notes: notes.trim().slice(0, 1000) || null,
      user_id: user?.id ?? null,
    });
    setSubmitting(false);
    if (insertError) {
      console.error('coffee_cup_interest insert failed', insertError);
      return setError('Something went wrong saving that. Try again, or email jason@dripmap.space.');
    }
    setDone(true);
    window.scrollTo({ top: document.getElementById('join')?.offsetTop ?? 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-[110px]" style={{ background: '#1e1712' }}>
      {/* Sticky glass header */}
      <header
        className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.07]"
        style={{ background: 'rgba(23,18,14,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-3">
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
            style={{ background: '#2b221b' }}
          >
            <i className="fas fa-arrow-left text-sm" style={{ color: TEXT }}></i>
          </button>
          <h1 className="font-serif text-[19px] font-black" style={{ color: TEXT, letterSpacing: '-0.02em' }}>
            The Coffee Cup
          </h1>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl">
        {/* Hero */}
        <section
          className="rounded-3xl px-6 pt-10 pb-12 md:p-16 text-center relative overflow-hidden border border-white/[0.09] mb-8"
          style={{ background: '#231b15' }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 600" preserveAspectRatio="none" fill="none" stroke="#3a2c22" strokeWidth="2" aria-hidden="true">
            <rect x="16" y="16" width="768" height="568" />
            <path d="M 400 16 V 584" />
            <circle cx="400" cy="300" r="90" />
            <path d="M 16 190 A 110 110 0 0 1 16 410" />
            <path d="M 784 190 A 110 110 0 0 0 784 410" />
          </svg>
          <div className="absolute top-1/4 left-1/2 w-72 h-72 bg-volt-400 rounded-full blur-[110px] opacity-[0.12] -translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10">
            <img
              src="/coffee-cup/cup.svg"
              alt="The Coffee Cup trophy: a two-handled diner mug with latte art on a walnut base"
              className="mx-auto w-52 md:w-64 mb-6"
            />
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-volt-400 mb-3">DripMap presents</p>
            <h2 className="text-5xl md:text-7xl font-serif font-black leading-[0.95] mb-5" style={{ color: TEXT, letterSpacing: '-0.03em' }}>
              The Coffee Cup
            </h2>
            <p className="text-lg md:text-xl max-w-xl mx-auto mb-6 leading-relaxed" style={{ color: '#e4ddce' }}>
              A 3v3 street soccer tournament between 12 Sacramento coffee &amp; tea shops.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {['Early 2027', 'Futsi, Sacramento', 'Free to watch'].map(t => (
                <span key={t} className="px-3 py-1.5 rounded-full text-xs font-bold border border-white/[0.12]" style={{ color: TEXT, background: 'rgba(255,255,255,0.04)' }}>
                  {t}
                </span>
              ))}
            </div>
            <Button
              onClick={scrollToForm}
              variant="secondary"
              className="text-lg px-8 py-4 font-extrabold shadow-[0_0_20px_rgba(163,230,53,0.3)]"
            >
              Get your shop in
            </Button>
          </div>
        </section>

        {/* The shape of it */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { big: '12', small: 'coffee & tea shops' },
            { big: '3v3', small: 'street soccer at Futsi' },
            { big: '1', small: 'Sunday afternoon, late Feb or early March' },
            { big: '365', small: "days on the winner's bar" },
          ].map(f => (
            <div key={f.small} className="rounded-3xl p-5 border border-white/[0.07]" style={{ background: '#2b221b' }}>
              <p className="font-serif font-black text-4xl text-volt-400 leading-none mb-2">{f.big}</p>
              <p className="text-sm leading-snug" style={{ color: MUTED }}>{f.small}</p>
            </div>
          ))}
        </section>

        {/* The trophy */}
        <section className="rounded-3xl p-7 md:p-10 border border-white/[0.07] mb-8" style={{ background: '#2b221b' }}>
          <h3 className="text-2xl md:text-3xl font-serif font-black mb-3" style={{ color: TEXT, letterSpacing: '-0.02em' }}>
            The cup lives on the winner's bar
          </h3>
          <p className="leading-relaxed mb-3" style={{ color: MUTED }}>
            The Coffee Cup is <strong style={{ color: '#e4ddce' }}>perpetual</strong>. The winning shop takes it home and keeps it on
            their bar for a whole year, until somebody comes and takes it from them. Every champion gets their name engraved on the base.
          </p>
          <p className="leading-relaxed" style={{ color: MUTED }}>
            Baristas, roasters and owners on the court. Their regulars in the crowd. Sacramento's coffee scene has never had a rivalry.
            Now it has a trophy.
          </p>
        </section>

        {/* For shops */}
        <section className="rounded-3xl p-7 md:p-10 border border-white/[0.07] mb-8" style={{ background: '#2b221b' }}>
          <h3 className="text-2xl md:text-3xl font-serif font-black mb-6" style={{ color: TEXT, letterSpacing: '-0.02em' }}>
            For shops: how it works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            {[
              {
                icon: 'fa-users',
                title: 'Your crew, your way',
                body: 'Rosters of 5 to 8. Ideally your staff and your community: baristas, owners, roasters, regulars. At least 2 players work at or own the shop, and at least 2 are women, because there is always a woman on the court.',
              },
              {
                icon: 'fa-hands-helping',
                title: 'Short on players? We got you',
                body: "We have players looking for a team, and we'll fill out your roster.",
              },
              {
                icon: 'fa-ticket-alt',
                title: '$111 per shop',
                body: "Includes 3 commemorative tees with every shop's name on the back. Nothing to pay today: this is just the interest list.",
              },
              {
                icon: 'fa-futbol',
                title: 'No experience needed',
                body: "Half the field hasn't kicked a ball since high school. Games are 12 minutes, and it starts after most shops close.",
              },
            ].map(item => (
              <div key={item.title} className="flex gap-4">
                <div className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center border border-white/[0.09]" style={{ background: '#2f251d' }}>
                  <i className={`fas ${item.icon} text-volt-400`}></i>
                </div>
                <div>
                  <h4 className="font-bold mb-1" style={{ color: TEXT }}>{item.title}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interest form */}
        <section id="join" className="rounded-3xl p-7 md:p-10 border-2 border-volt-400 mb-8 scroll-mt-24" style={{ background: '#2b221b' }}>
          {done ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-volt-400 flex items-center justify-center mb-5">
                <i className="fas fa-check text-2xl text-coffee-900"></i>
              </div>
              <h3 className="text-3xl font-serif font-black mb-3" style={{ color: TEXT, letterSpacing: '-0.02em' }}>
                You're on the list ☕
              </h3>
              <p className="max-w-md mx-auto leading-relaxed mb-6" style={{ color: MUTED }}>
                We'll be in touch when registration opens. Questions in the meantime? Email{' '}
                <a href="mailto:jason@dripmap.space" className="text-volt-400 underline">jason@dripmap.space</a>.
              </p>
              {shop && !shop.is_claimed && (
                <Button variant="secondary" className="font-extrabold px-6 py-3" onClick={() => navigate(`/claim/${shop.id}`)}>
                  Claim {shop.name} on DripMap
                </Button>
              )}
              {!shop && (
                <Button variant="secondary" className="font-extrabold px-6 py-3" onClick={() => navigate('/add')}>
                  Add your shop to DripMap
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h3 className="text-2xl md:text-3xl font-serif font-black mb-2" style={{ color: TEXT, letterSpacing: '-0.02em' }}>
                Get your shop on the list
              </h3>
              <p className="mb-8" style={{ color: MUTED }}>
                Two minutes, nothing to pay. You'll be first to hear when registration opens.
              </p>

              {/* Shop */}
              <div className="mb-6 relative">
                <label htmlFor="cc-shop" className={labelClass} style={{ color: 'rgba(243,239,224,0.5)' }}>Your shop</label>
                {shop ? (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#2f251d] border border-volt-400">
                    <span style={{ color: TEXT }}>
                      <strong>{shop.name}</strong>
                      {shop.city && <span style={{ color: MUTED }}> · {shop.city}</span>}
                    </span>
                    <button type="button" onClick={() => { setShop(null); setShopQuery(''); }} className="text-xs font-bold text-volt-400">
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      id="cc-shop"
                      className={darkInput}
                      placeholder={notListed ? 'Shop name' : 'Search for your shop'}
                      value={shopQuery}
                      onChange={e => setShopQuery(e.target.value)}
                      autoComplete="off"
                    />
                    {shopHits.length > 0 && (
                      <ul className="absolute left-0 right-0 mt-2 z-20 rounded-xl border border-white/[0.12] overflow-hidden shadow-2xl" style={{ background: '#2f251d' }}>
                        {shopHits.map(h => (
                          <li key={h.id}>
                            <button
                              type="button"
                              onClick={() => { setShop(h); setShopHits([]); }}
                              className="w-full text-left px-4 py-3 hover:bg-white/[0.06] focus:bg-white/[0.06] focus:outline-none"
                              style={{ color: TEXT }}
                            >
                              <strong>{h.name}</strong>
                              {h.city && <span style={{ color: MUTED }}> · {h.city}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => setNotListed(!notListed)}
                      className="mt-2 text-xs font-semibold underline"
                      style={{ color: MUTED }}
                    >
                      {notListed ? 'Search DripMap instead' : "My shop isn't on DripMap yet"}
                    </button>
                  </>
                )}
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="cc-name" className={labelClass} style={{ color: 'rgba(243,239,224,0.5)' }}>Your name</label>
                  <input id="cc-name" className={darkInput} value={contactName} onChange={e => setContactName(e.target.value)} autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="cc-role" className={labelClass} style={{ color: 'rgba(243,239,224,0.5)' }}>Your role</label>
                  <select id="cc-role" className={darkInput} value={role} onChange={e => setRole(e.target.value)}>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Barista / staff</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cc-email" className={labelClass} style={{ color: 'rgba(243,239,224,0.5)' }}>Email</label>
                  <input id="cc-email" type="email" className={darkInput} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="cc-phone" className={labelClass} style={{ color: 'rgba(243,239,224,0.5)' }}>Phone (optional)</label>
                  <input id="cc-phone" type="tel" className={darkInput} value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="cc-ig" className={labelClass} style={{ color: 'rgba(243,239,224,0.5)' }}>Shop Instagram (optional)</label>
                  <input id="cc-ig" className={darkInput} placeholder="@yourshop" value={instagram} onChange={e => setInstagram(e.target.value)} />
                </div>
              </div>

              {/* Interest */}
              <fieldset className="mb-6">
                <legend className={labelClass} style={{ color: 'rgba(243,239,224,0.5)' }}>How interested are you?</legend>
                <div role="radiogroup" className="flex flex-wrap gap-2">
                  {INTEREST.map(o => (
                    <Chip key={o.value} role="radio" selected={interest === o.value} onClick={() => setInterest(o.value)}>{o.label}</Chip>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mb-6">
                <legend className={labelClass} style={{ color: 'rgba(243,239,224,0.5)' }}>Which Sundays could work? Tick any</legend>
                <div className="flex flex-wrap gap-2">
                  {SUNDAYS.map(o => (
                    <Chip key={o.value} selected={sundays.includes(o.value)} onClick={() => toggle(sundays, o.value, setSundays)}>{o.label}</Chip>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mb-6">
                <legend className={labelClass} style={{ color: 'rgba(243,239,224,0.5)' }}>Your team</legend>
                <div role="radiogroup" className="flex flex-wrap gap-2">
                  {ROSTER.map(o => (
                    <Chip key={o.value} role="radio" selected={roster === o.value} onClick={() => setRoster(o.value)}>{o.label}</Chip>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mb-6">
                <legend className={labelClass} style={{ color: 'rgba(243,239,224,0.5)' }}>Also interested in (optional)</legend>
                <div className="flex flex-wrap gap-2">
                  {EXTRAS.map(o => (
                    <Chip key={o.value} selected={extras.includes(o.value)} onClick={() => toggle(extras, o.value, setExtras)}>{o.label}</Chip>
                  ))}
                </div>
              </fieldset>

              <div className="mb-8">
                <label htmlFor="cc-notes" className={labelClass} style={{ color: 'rgba(243,239,224,0.5)' }}>Anything else? (optional)</label>
                <textarea id="cc-notes" rows={3} className={darkInput} value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} />
              </div>

              {error && (
                <p role="alert" className="mb-4 text-sm font-semibold" style={{ color: '#fca5a5' }}>{error}</p>
              )}
              <Button type="submit" variant="secondary" isLoading={submitting} className="w-full py-4 text-lg font-extrabold">
                Get my shop on the list
              </Button>
            </form>
          )}
        </section>

        {/* Spectators */}
        <section className="rounded-3xl p-7 border border-white/[0.07] mb-10 text-center" style={{ background: '#2b221b' }}>
          <h3 className="text-xl font-serif font-black mb-2" style={{ color: TEXT }}>Coming to watch?</h3>
          <p style={{ color: MUTED }}>It's free and open to everyone. Date and RSVP coming soon.</p>
        </section>

        <p className="text-center text-[10px] font-bold uppercase mb-8" style={{ color: 'rgba(243,239,224,0.45)', letterSpacing: '0.12em' }}>
          Presented by DripMap · Hosted at Futsi
        </p>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default CoffeeCup;
