import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Button from "../components/Button";
import { useToast } from "../context/ToastContext";

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

  if (!shop) return <div>Shop not found</div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl">
          <h2 className="text-2xl font-serif font-bold mb-4">
            Please Login First
          </h2>
          <p className="mb-6 text-coffee-600">
            You need an account to claim a business.
          </p>
          <Button onClick={() => navigate("/auth")}>Go to Login</Button>
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
    }
  };

  return (
    <div className="min-h-screen bg-coffee-50 pt-24 pb-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-coffee-100">
        <div className="bg-coffee-900 p-8 text-center">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-volt-400 mb-2">
            Claim {shop.name}
          </h1>
          <p className="text-coffee-100 opacity-80">
            Verify ownership to manage this listing.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6"
          disabled={loading}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2">
                Business Email
              </label>
              <input
                type="email"
                required
                placeholder="owner@coffee.com"
                className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                value={formData.businessEmail}
                onChange={e =>
                  setFormData({ ...formData, businessEmail: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2">
                Your Role
              </label>
              <select
                className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
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
            <label className="block text-sm font-bold text-coffee-900 mb-2">
              Official Social Media Link
            </label>
            <div className="relative">
              <i className="fas fa-link absolute left-4 top-1/2 transform -translate-y-1/2 text-coffee-400"></i>
              <input
                type="url"
                required
                placeholder="https://instagram.com/yourshop"
                className="w-full pl-10 pr-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                value={formData.socialLink}
                onChange={e =>
                  setFormData({ ...formData, socialLink: e.target.value })
                }
              />
            </div>
            <p className="text-xs text-coffee-500 mt-2">
              We use this to verify your connection to the shop. Make sure the
              account is public or lists your business email.
            </p>
          </div>

          <div className="bg-volt-400/10 border border-volt-400/30 p-4 rounded-xl flex gap-3">
            <i className="fas fa-shield-alt text-coffee-900 mt-1"></i>
            <div className="text-sm text-coffee-800">
              <p className="font-bold">Admin Verification Process</p>
              <p>
                An admin will review your link. Once verified (usually within
                24h), you'll get the{" "}
                <i className="fas fa-certificate text-coffee-900"></i> badge and
                editing rights.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full py-4 text-lg"
            disabled={loading}
          >
            Submit for Review
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ClaimShop;
