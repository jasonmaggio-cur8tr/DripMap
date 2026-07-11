import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import BottomTabBar from '../components/darkroast/BottomTabBar';

const ScoutBounty: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-20 px-4 pb-[110px]" style={{ background: '#1e1712' }}>
      {/* Sticky glass header */}
      <header
        className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.07]"
        style={{ background: 'rgba(23,18,14,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
            style={{ background: '#2b221b' }}
          >
            <i className="fas fa-arrow-left text-sm" style={{ color: '#f3efe0' }}></i>
          </button>
          <h1 className="font-serif text-[19px] font-black" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>
            Scout Bounty
          </h1>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl">

        {/* Hero Section */}
        <div className="rounded-3xl p-8 md:p-16 text-center relative overflow-hidden border border-white/[0.09] mb-10" style={{ background: '#231b15' }}>
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-volt-400 rounded-full blur-[100px] opacity-20 transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-[80px] opacity-10 transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="inline-block bg-volt-400 text-coffee-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 animate-pulse">
              New Program
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-black mb-6 leading-tight" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>
              Get Paid to <br className="hidden md:block" />
              <span className="text-volt-400">Map the World</span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 font-light leading-relaxed" style={{ color: '#e4ddce' }}>
              Earn <span className="font-bold text-volt-400">$10.00</span> for every coffee shop you discover that joins the DripMap Pro community.
            </p>
            <Button
                onClick={() => navigate('/add')}
                variant="secondary"
                className="text-lg px-8 py-4 font-extrabold hover:scale-105 transform transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)]"
            >
                Start Scouting
            </Button>
          </div>
        </div>

        {/* How it Works Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="p-8 rounded-3xl border border-white/[0.07] hover:border-white/[0.15] transition-colors relative overflow-hidden group" style={{ background: '#2b221b' }}>
            <div className="absolute -right-4 -top-4 text-white/[0.04] text-9xl font-serif font-black z-0 group-hover:scale-110 transition-transform">1</div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-2xl border border-white/[0.09]" style={{ background: '#2f251d', color: '#f3efe0' }}>
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3 className="text-xl font-serif font-black mb-3" style={{ color: '#f3efe0' }}>Add a Spot</h3>
              <p className="leading-relaxed" style={{ color: 'rgba(243,239,224,0.55)' }}>
                Find a hidden gem? Add it to the map. Make sure to check the <strong style={{ color: '#e4ddce' }}>"Opt-in for Bounty"</strong> box during submission.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-white/[0.07] hover:border-white/[0.15] transition-colors relative overflow-hidden group" style={{ background: '#2b221b' }}>
            <div className="absolute -right-4 -top-4 text-white/[0.04] text-9xl font-serif font-black z-0 group-hover:scale-110 transition-transform">2</div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-2xl border border-white/[0.09]" style={{ background: '#2f251d', color: '#f3efe0' }}>
                <i className="fas fa-user-check"></i>
              </div>
              <h3 className="text-xl font-serif font-black mb-3" style={{ color: '#f3efe0' }}>Owner Claims It</h3>
              <p className="leading-relaxed" style={{ color: 'rgba(243,239,224,0.55)' }}>
                When the business owner sees your listing, they claim it to verify ownership and manage their page.
              </p>
            </div>
          </div>

          <div className="p-8 rounded-3xl border-2 border-volt-400 transition-shadow relative overflow-hidden group" style={{ background: '#2b221b' }}>
             <div className="absolute -right-4 -top-4 text-volt-400/10 text-9xl font-serif font-black z-0 group-hover:scale-110 transition-transform">3</div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-volt-400 rounded-2xl flex items-center justify-center mb-6 text-2xl text-coffee-900 shadow-lg">
                <i className="fas fa-dollar-sign"></i>
              </div>
              <h3 className="text-xl font-serif font-black mb-3" style={{ color: '#f3efe0' }}>Get Paid $10</h3>
              <p className="leading-relaxed" style={{ color: 'rgba(243,239,224,0.55)' }}>
                If the owner upgrades to a <strong style={{ color: '#e4ddce' }}>Pro Subscription</strong>, you automatically earn a $10 bounty via Stripe or Venmo.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="border border-white/[0.09] rounded-3xl p-8 md:p-12" style={{ background: '#2b221b' }}>
            <div className="text-center mb-10">
                <h2 className="text-3xl font-serif font-black mb-2" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>Frequently Asked Questions</h2>
                <p style={{ color: 'rgba(243,239,224,0.5)' }}>Everything you need to know about the Scout Bounty.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div>
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: '#f3efe0' }}>
                        <i className="fas fa-question-circle text-volt-400"></i> Is there a limit?
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(243,239,224,0.55)' }}>
                        No! You can add as many authentic shops as you want. As long as they are real businesses and you are the first to list them.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: '#f3efe0' }}>
                        <i className="fas fa-question-circle text-volt-400"></i> How do I get paid?
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(243,239,224,0.55)' }}>
                        We will contact you via the email on your profile when a payout is triggered. We currently support <strong style={{ color: '#e4ddce' }}>Venmo and Stripe</strong>. <br/><br/>
                        <span className="font-bold" style={{ color: '#e4ddce' }}>Important:</span> The bounty is paid out after the shop's <strong style={{ color: '#e4ddce' }}>2nd monthly subscription payment</strong> is successfully made.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: '#f3efe0' }}>
                        <i className="fas fa-question-circle text-volt-400"></i> What if I'm the owner?
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(243,239,224,0.55)' }}>
                        If you add your own shop and then claim it + upgrade, you are eligible for the bounty too! Just like standard scouts, the payout is issued after your <strong style={{ color: '#e4ddce' }}>2nd monthly subscription payment</strong> is made.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: '#f3efe0' }}>
                        <i className="fas fa-question-circle text-volt-400"></i> When does it expire?
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(243,239,224,0.55)' }}>
                        Your "Scout Status" on a listing lasts for 12 months. If the owner claims and upgrades within that year, you get paid.
                    </p>
                </div>
            </div>
        </div>

        <div className="text-center mt-12 mb-8">
            <p className="text-[10px] font-bold uppercase mb-4" style={{ color: 'rgba(243,239,224,0.45)', letterSpacing: '0.08em' }}>Ready to hunt?</p>
             <Button
                onClick={() => navigate('/add')}
                variant="outline"
                className="!border-white/[0.2] !text-[#e4ddce] hover:!bg-white/[0.06] hover:!text-[#f3efe0] transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
            >
                Add a New Spot Now
            </Button>
        </div>

      </div>
      <BottomTabBar />
    </div>
  );
};

export default ScoutBounty;
