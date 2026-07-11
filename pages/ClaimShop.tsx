import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Button from "../components/Button";
import BottomTabBar from "../components/darkroast/BottomTabBar";
import { useToast } from "../context/ToastContext";

// Dark Roast input treatment (design_handoff_dark_roast/README.md → Design Tokens)
const darkInput =
  "w-full px-4 py-3 bg-[#2f251d] border border-white/[0.09] text-[#f3efe0] placeholder:text-[rgba(243,239,224,0.35)] rounded-xl focus:ring-2 focus:ring-volt-400 outline-none";

const ClaimShop: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { shops, user, submitClaimRequest } = useApp();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const shop = shops.find(s => s.id === id);

  const [formData, setFormData] = useState({
    businessEmail: "",
    role: "Owner",
    socialLink: "",
  });

  if (!shop) return <div className="min-h-screen flex items-center justify-center text-[#e4ddce]" style={{ background: "#1e1712" }}>Shop not found</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#1e1712" }}>
        <div className="text-center p-8 rounded-3xl border border-white/[0.09]" style={{ background: "#2b221b" }}>
          <h2 className="text-2xl font-serif font-black mb-4" style={{ color: "#f3efe0", letterSpacing: "-0.02em" }}>
            Please Login First
          </h2>
          <p className="mb-6" style={{ color: "#e4ddce" }}>
            You need an account to claim a business.
          </p>
          <Button variant="secondary" className="font-extrabold" onClick={() => navigate("/auth")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitClaimRequest({
        shopId: shop.id,
        userId: user.id,
        businessEmail: formData.businessEmail,
        role: formData.role,
        socialLink: formData.socialLink,
      });

      setLoading(false);
      toast.success("Verification Request Submitted!");
      navigate(`/shop/${shop.id}`);
    } catch (error) {
      console.error("Error submitting claim:", error);
      toast.error("Failed to submit claim request. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-[110px] px-4" style={{ background: "#1e1712" }}>
      {/* Sticky glass header */}
      <header
        className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.07]"
        style={{ background: "rgba(23,18,14,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
            style={{ background: "#2b221b" }}
          >
            <i className="fas fa-arrow-left text-sm" style={{ color: "#f3efe0" }}></i>
          </button>
          <h1 className="font-serif text-[19px] font-black" style={{ color: "#f3efe0", letterSpacing: "-0.02em" }}>
            Claim Shop
          </h1>
        </div>
      </header>
      <div className="max-w-2xl mx-auto rounded-3xl overflow-hidden border border-white/[0.09]" style={{ background: "#2b221b" }}>
        <div className="p-8 text-center border-b border-white/[0.07]" style={{ background: "#231b15" }}>
          <h1 className="text-2xl md:text-3xl font-serif font-black text-volt-400 mb-2" style={{ letterSpacing: "-0.02em" }}>
            Claim {shop.name}
          </h1>
          <p style={{ color: "rgba(243,239,224,0.55)" }}>
            Verify ownership to manage this listing.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "#f3efe0" }}>
                Business Email
              </label>
              <input
                type="email"
                required
                placeholder="owner@coffee.com"
                className={darkInput}
                value={formData.businessEmail}
                onChange={e =>
                  setFormData({ ...formData, businessEmail: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "#f3efe0" }}>
                Your Role
              </label>
              <select
                className={darkInput}
                value={formData.role}
                onChange={e =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option>Owner</option>
                <option>Manager</option>
                <option>Employee</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "#f3efe0" }}>
              Official Social Media Link
            </label>
            <div className="relative">
              <i className="fas fa-link absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: "rgba(243,239,224,0.45)" }}></i>
              <input
                type="url"
                required
                placeholder="https://instagram.com/yourshop"
                className="w-full pl-10 pr-4 py-3 bg-[#2f251d] border border-white/[0.09] text-[#f3efe0] placeholder:text-[rgba(243,239,224,0.35)] rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                value={formData.socialLink}
                onChange={e =>
                  setFormData({ ...formData, socialLink: e.target.value })
                }
              />
            </div>
            <p className="text-xs mt-2" style={{ color: "rgba(243,239,224,0.5)" }}>
              We use this to verify your connection to the shop. Make sure the
              account is public or lists your business email.
            </p>
          </div>

          <div className="bg-volt-400/10 border border-volt-400/30 p-4 rounded-xl flex gap-3">
            <i className="fas fa-shield-alt text-volt-400 mt-1"></i>
            <div className="text-sm" style={{ color: "#e4ddce" }}>
              <p className="font-bold" style={{ color: "#f3efe0" }}>Admin Verification Process</p>
              <p>
                An admin will review your link. Once verified (usually within
                24h), you'll get the{" "}
                <i className="fas fa-certificate text-volt-400"></i> badge and
                editing rights.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            variant="secondary"
            className="w-full py-4 text-lg font-extrabold"
            disabled={loading}
          >
            Submit for Review
          </Button>
        </form>
      </div>
      <BottomTabBar />
    </div>
  );
};

export default ClaimShop;
