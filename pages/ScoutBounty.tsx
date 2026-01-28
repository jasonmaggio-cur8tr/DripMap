import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const ScoutBounty: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-coffee-50 pt-20 px-4 pb-20">
      <div className="container mx-auto max-w-4xl">

        {/* Hero Section */}
        <div className="bg-coffee-900 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden shadow-2xl mb-10">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-volt-400 rounded-full blur-[100px] opacity-20 transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-[80px] opacity-10 transform -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="inline-block bg-volt-400 text-coffee-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 animate-pulse">
              New Program
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-black text-white mb-6 leading-tight">
              Get Paid to <br className="hidden md:block" />
              <span className="text-volt-400">Map the World</span>
            </h1>
            <p className="text-lg md:text-xl text-coffee-100 max-w-2xl mx-auto mb-8 font-light leading-relaxed">
              Earn <span className="font-bold text-volt-400">$10.00</span> for every coffee shop you discover that joins the DripMap Pro community.
            </p>
            <Button
                onClick={() => navigate('/add')}
                variant="secondary"
                className="text-lg px-8 py-4 hover:bg-white hover:scale-105 transform transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)]"
            >
                Start Scouting
            </Button>
          </div>
        </div>

        {/* How it Works Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-8 rounded-3xl border border-coffee-100 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-coffee-50 text-9xl font-serif font-black z-0 opacity-50 group-hover:scale-110 transition-transform">1</div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-coffee-100 rounded-2xl flex items-center justify-center mb-6 text-2xl text-coffee-900 shadow-inner">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3 className="text-xl font-bold text-coffee-900 mb-3">Add a Spot</h3>
              <p className="text-coffee-600 leading-relaxed">
                Find a hidden gem? Add it to the map. Make sure to check the <strong>"Opt-in for Bounty"</strong> box during submission.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-coffee-100 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-coffee-50 text-9xl font-serif font-black z-0 opacity-50 group-hover:scale-110 transition-transform">2</div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-coffee-100 rounded-2xl flex items-center justify-center mb-6 text-2xl text-coffee-900 shadow-inner">
                <i className="fas fa-user-check"></i>
              </div>
              <h3 className="text-xl font-bold text-coffee-900 mb-3">Owner Claims It</h3>
              <p className="text-coffee-600 leading-relaxed">
                When the business owner sees your listing, they claim it to verify ownership and manage their page.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border-2 border-volt-400 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 text-volt-100 text-9xl font-serif font-black z-0 opacity-50 group-hover:scale-110 transition-transform">3</div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-volt-400 rounded-2xl flex items-center justify-center mb-6 text-2xl text-coffee-900 shadow-lg">
                <i className="fas fa-dollar-sign"></i>
              </div>
              <h3 className="text-xl font-bold text-coffee-900 mb-3">Get Paid $10</h3>
              <p className="text-coffee-600 leading-relaxed">
                If the owner upgrades to a <strong>Pro Subscription</strong>, you automatically earn a $10 bounty via Stripe or Venmo.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-[#FDFBF7] border border-coffee-200 rounded-3xl p-8 md:p-12">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-serif font-bold text-coffee-900 mb-2">Frequently Asked Questions</h2>
                <p className="text-coffee-500">Everything you need to know about the Scout Bounty.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div>
                    <h4 className="font-bold text-lg text-coffee-900 mb-2 flex items-center gap-2">
                        <i className="fas fa-question-circle text-volt-500"></i> Is there a limit?
                    </h4>
                    <p className="text-coffee-600 text-sm leading-relaxed">
                        No! You can add as many authentic shops as you want. As long as they are real businesses and you are the first to list them.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-lg text-coffee-900 mb-2 flex items-center gap-2">
                        <i className="fas fa-question-circle text-volt-500"></i> How do I get paid?
                    </h4>
                    <p className="text-coffee-600 text-sm leading-relaxed">
                        We will contact you via the email on your profile when a payout is triggered. We currently support <strong>Venmo and Stripe</strong>. <br/><br/>
                        <span className="font-bold">Important:</span> The bounty is paid out after the shop's <strong>2nd monthly subscription payment</strong> is successfully made.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-lg text-coffee-900 mb-2 flex items-center gap-2">
                        <i className="fas fa-question-circle text-volt-500"></i> What if I'm the owner?
                    </h4>
                    <p className="text-coffee-600 text-sm leading-relaxed">
                        If you add your own shop and then claim it + upgrade, you are eligible for the bounty too! Just like standard scouts, the payout is issued after your <strong>2nd monthly subscription payment</strong> is made.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-lg text-coffee-900 mb-2 flex items-center gap-2">
                        <i className="fas fa-question-circle text-volt-500"></i> When does it expire?
                    </h4>
                    <p className="text-coffee-600 text-sm leading-relaxed">
                        Your "Scout Status" on a listing lasts for 12 months. If the owner claims and upgrades within that year, you get paid.
                    </p>
                </div>
            </div>
        </div>

        <div className="text-center mt-12 mb-8">
            <p className="text-coffee-400 text-xs font-bold uppercase tracking-widest mb-4">Ready to hunt?</p>
             <Button
                onClick={() => navigate('/add')}
                variant="outline"
                className="text-coffee-900 border-coffee-900 hover:bg-coffee-900 hover:text-white transition-colors"
            >
                Add a New Spot Now
            </Button>
        </div>

      </div>
    </div>
  );
};

export default ScoutBounty;
