import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Vibe, User, Shop, DripClubMembership } from "../types";
import { useToast } from "../context/ToastContext";
import { uploadImage } from "../services/storageService";
import {
  getDripClubMembership,
  getCustomerPortalUrl,
  getSubscriptionStatusLabel,
  formatPrice,
  getPricing,
} from "../services/subscriptionService";
import { fetchUserExperienceLogs, getUserBadgeAwards, previousMonthStart } from "../services/dbService";
import BadgedAvatar from "../components/BadgedAvatar";
import MenuDrawer from "../components/darkroast/MenuDrawer";
import BottomTabBar from "../components/darkroast/BottomTabBar";
import NotificationBell from "../components/NotificationBell";
import { sizedImageUrl } from "../lib/imageUrl";

// Dark Roast shared bits (design_handoff_dark_roast/README.md → Design Tokens)
const SURFACE = "#2b221b";
const TILE = "#2f251d";
const TEXT = "#f3efe0";
const TEXT_2 = "#e4ddce";
const MUTED = "rgba(243,239,224,0.5)";
const pillBtn =
  "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400";

// --- ANIMATED DRIPCLUB BADGE COMPONENT ---
const DripClubBadge: React.FC<{ username: string; onManage?: () => void }> = ({ username, onManage }) => {
  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-[2rem] border-4 border-coffee-900 shadow-2xl group animate-in zoom-in-95 duration-500">
      {/* Animated Background Layers */}
      <div className="absolute inset-0 bg-coffee-900"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-volt-400/20 via-transparent to-volt-400/10 animate-pulse"></div>

      {/* Constantly moving scanning line (Prevents screenshots by showing movement) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-volt-400/40 shadow-[0_0_15px_rgba(163,230,53,0.8)] z-20 animate-scan"></div>

      {/* Animated holographic sheen */}
      <div className="absolute inset-0 z-10 opacity-30 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine bg-[length:200%_100%]"></div>

      <div className="relative z-10 p-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-volt-400 rounded-3xl flex items-center justify-center text-coffee-900 mb-6 shadow-[0_0_30px_rgba(163,230,53,0.4)] transform group-hover:rotate-12 transition-transform duration-500">
          <i className="fas fa-droplet text-4xl"></i>
        </div>

        <h2 className="text-4xl font-serif font-black text-volt-400 tracking-tighter mb-1 uppercase">DripClub</h2>
        <p className="text-white font-black text-[10px] uppercase tracking-[0.3em] mb-6 opacity-60">Verified Member</p>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 w-full border border-white/10 mb-6">
          <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">Account Holder</p>
          <p className="text-white text-xl font-bold font-serif tracking-tight">@{username}</p>
        </div>

        <div className="bg-volt-400 text-coffee-900 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2">
          <i className="fas fa-percent"></i>
          <span>10% Off All PRO+ Shops</span>
        </div>

        <div className="mt-8 flex items-center gap-2 opacity-40">
          <div className="w-1.5 h-1.5 rounded-full bg-volt-400 animate-ping"></div>
          <span className="text-[8px] text-white font-black uppercase tracking-widest">Active Membership Session</span>
        </div>

        {/* Manage button */}
        {onManage && (
          <button
            onClick={onManage}
            className="mt-6 w-full py-3 bg-white/10 text-white/80 rounded-xl font-bold text-sm hover:bg-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            <i className="fas fa-cog"></i>
            Manage Membership
          </button>
        )}
      </div>

      {/* Custom Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        @keyframes shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    user: currentUser,
    logout,
    shops,
    updateUserProfile,
    getProfileById,
    getProfileByUsername,
    toggleFollow,
  } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // DripClub membership state
  const [dripClubMembership, setDripClubMembership] = useState<DripClubMembership | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);

  // Edit State
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Monthly badge awards (gamified leaderboards trophy case)
  const [badgeAwards, setBadgeAwards] = useState<any[]>([]);

  const [editData, setEditData] = useState({
    username: "",
    bio: "",
    avatarUrl: "",
    socialLinks: {
      instagram: "",
      x: "",
    },
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if we are viewing our own profile
  const isOwnProfile =
    !id ||
    (currentUser && (id === currentUser.id || id === currentUser.username));
  const profileIdentifier = id || currentUser?.username;

  // Fetch Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      console.log("Fetching profile for:", id, "isOwnProfile:", isOwnProfile);

      try {
        if (isOwnProfile) {
          if (!currentUser) {
            console.log("No current user, redirecting to auth");
            navigate("/auth");
            return;
          }
          console.log(
            "Setting viewed user to current user:",
            currentUser.username
          );
          setViewedUser(currentUser);
        } else if (profileIdentifier) {
          console.log("Fetching profile by identifier:", profileIdentifier);

          // Try to fetch by username first, then by ID
          let profile = await getProfileByUsername(profileIdentifier);
          console.log("Profile by username:", profile);

          if (!profile) {
            console.log("Trying to fetch by ID");
            profile = await getProfileById(profileIdentifier);
            console.log("Profile by ID:", profile);
          }

          if (profile) {
            console.log("Profile found:", profile.username);
            setViewedUser(profile);
          } else {
            console.log("No profile found");
            toast.error("User not found");
            navigate("/");
          }
        } else {
          console.log("No profile identifier");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile. Please try again.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [
    id,
    currentUser,
    isOwnProfile,
    navigate,
    getProfileById,
    getProfileByUsername,
  ]);

  // Fetch DripClub membership for own profile
  useEffect(() => {
    const fetchMembership = async () => {
      if (!isOwnProfile || !currentUser?.id) return;

      setMembershipLoading(true);
      try {
        const membership = await getDripClubMembership(currentUser.id);
        setDripClubMembership(membership);
      } catch (error) {
        console.error("Error fetching DripClub membership:", error);
      } finally {
        setMembershipLoading(false);
      }
    };

    fetchMembership();
  }, [isOwnProfile, currentUser?.id]);

  // Fetch Experience Logs
  useEffect(() => {
    const fetchLogs = async () => {
      if (!viewedUser?.id) return;
      setLogsLoading(true);
      try {
        const logs = await fetchUserExperienceLogs(viewedUser.id);
        setUserLogs(logs);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLogsLoading(false);
      }
    };

    fetchLogs();
  }, [viewedUser?.id]);

  // Fetch monthly badge awards (fails soft to [] pre-migration)
  useEffect(() => {
    const fetchBadges = async () => {
      if (!viewedUser?.id) return;
      const awards = await getUserBadgeAwards(viewedUser.id);
      setBadgeAwards(awards);
    };
    fetchBadges();
  }, [viewedUser?.id]);

  // Only the reigning badge (last completed month's win) decorates the avatar
  const headerBadgeAward = badgeAwards.find(a => a.month_start === previousMonthStart());
  const headerBadge = headerBadgeAward?.badge
    ? { emoji: headerBadgeAward.badge.emoji, name: headerBadgeAward.badge.name }
    : null;

  // Handle manage membership click
  const handleManageMembership = async () => {
    if (!dripClubMembership?.stripeCustomerId) return;

    try {
      const config = window.location.origin;
      const result = await getCustomerPortalUrl(
        dripClubMembership.stripeCustomerId,
        `${config}/#/profile`
      );

      if ("url" in result) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Failed to open billing portal");
      }
    } catch (error) {
      toast.error("Failed to open billing portal");
    }
  };

  // Sticky glass header, shared across loading / error / loaded states
  const pageHeader = (
    <header
      className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.07]"
      style={{ background: "rgba(23,18,14,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
            style={{ background: SURFACE }}
          >
            <i className="fas fa-bars" style={{ color: TEXT }}></i>
          </button>
          <h1 className="font-serif text-[19px] font-black" style={{ color: TEXT, letterSpacing: "-0.02em" }}>
            {isOwnProfile ? "Your Drips" : viewedUser ? `@${viewedUser.username}` : "Drips"}
          </h1>
        </div>
        {currentUser && <NotificationBell />}
      </div>
    </header>
  );

  if (loading)
    return (
      <div className="min-h-screen" style={{ background: "#1e1712" }}>
        {pageHeader}
        <div className="pt-32 text-center">
          <i className="fas fa-spinner fa-spin text-2xl" style={{ color: "rgba(243,239,224,0.45)" }}></i>
        </div>
        <MenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <BottomTabBar />
      </div>
    );
  if (!viewedUser) {
    return (
      <div className="min-h-screen" style={{ background: "#1e1712" }}>
        {pageHeader}
        <div className="pt-32 text-center">
          <p style={{ color: MUTED }}>Unable to load profile</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 hover:underline focus:outline-none focus:ring-2 focus:ring-volt-400 rounded"
            style={{ color: "#a3e635" }}
          >
            Return to Home
          </button>
        </div>
        <MenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <BottomTabBar />
      </div>
    );
  }

  // --- Data Derivation for Gamification ---
  const savedSpots = shops.filter(shop =>
    viewedUser.savedShops.includes(shop.id)
  );
  const visitedSpots = shops.filter(shop =>
    viewedUser.visitedShops.includes(shop.id)
  );
  const claimedSpots = shops.filter(shop => shop.claimedBy === viewedUser.id);

  // Organize Visited Spots by City for Passport Book
  const passportBook = visitedSpots.reduce((acc, shop) => {
    const key = `${shop.location.city}, ${shop.location.state}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(shop);
    return acc;
  }, {} as Record<string, typeof visitedSpots>);

  // Calculate Drip Score
  const userReviewCount = shops.reduce(
    (acc, shop) =>
      acc + shop.reviews.filter(r => r.userId === viewedUser.id).length,
    0
  );
  const dripScore = viewedUser.dripScore || 0;

  // Badges Logic
  const uniqueCitiesVisited = new Set(visitedSpots.map(s => s.location.city))
    .size;
  const matchaSpotsVisited = visitedSpots.filter(s =>
    s.vibes.includes(Vibe.MATCHA)
  ).length;

  const BADGES = [
    {
      id: "first-sip",
      name: "First Sip",
      desc: "Visit your first spot",
      icon: "fas fa-mug-hot",
      unlocked: visitedSpots.length >= 1,
    },
    {
      id: "tastemaker",
      name: "Tastemaker",
      desc: "Leave 3 Reviews",
      icon: "fas fa-feather-alt",
      unlocked: userReviewCount >= 3,
    },
    {
      id: "nomad",
      name: "The Nomad",
      desc: "Visit 3 Cities",
      icon: "fas fa-globe-americas",
      unlocked: uniqueCitiesVisited >= 3,
    },
    {
      id: "matcha-fix",
      name: "Green Goddess",
      desc: "Visit 3 Matcha Spots",
      icon: "fas fa-leaf",
      unlocked: matchaSpotsVisited >= 3,
    },
    {
      id: "curator",
      name: "The Curator",
      desc: "Save 5 Spots",
      icon: "fas fa-bookmark",
      unlocked: savedSpots.length >= 5,
    },
    {
      id: "boss",
      name: "The Boss",
      desc: "Claim a Shop",
      icon: "fas fa-briefcase",
      unlocked: claimedSpots.length >= 1,
    },
  ];

  const startEditing = () => {
    setEditData({
      username: viewedUser.username,
      bio: viewedUser.bio || "",
      avatarUrl: viewedUser.avatarUrl,
      socialLinks: {
        instagram: viewedUser.socialLinks?.instagram || "",
        x: viewedUser.socialLinks?.x || "",
      },
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setUploadingAvatar(true);
      let finalAvatarUrl = editData.avatarUrl;

      // Upload new avatar if a file was selected
      if (avatarFile) {
        toast.info("Uploading profile picture...");
        try {
          const uploadResult = await uploadImage(avatarFile, "avatars");
          if (uploadResult.success && uploadResult.url) {
            finalAvatarUrl = uploadResult.url;
          } else {
            // defensive: uploadImage may return a result wrapper on success, but if it returned an error-like object, throw
            throw new Error(uploadResult.error || "Failed to upload avatar");
          }
        } catch (err: any) {
          console.error("Avatar upload error (Profile):", err);
          throw err;
        }
      }

      const profileResult = await updateUserProfile({
        username: editData.username,
        bio: editData.bio,
        avatarUrl: finalAvatarUrl,
        socialLinks: editData.socialLinks,
      });

      if (profileResult && !profileResult.success) {
        throw profileResult.error || new Error("Failed to save profile changes");
      }

      // Update local viewedUser state immediately after successful save
      setViewedUser(prev =>
        prev
          ? {
            ...prev,
            username: editData.username,
            bio: editData.bio,
            avatarUrl: finalAvatarUrl,
            socialLinks: editData.socialLinks,
          }
          : null
      );

      setAvatarFile(null);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
      console.error("Profile update error:", error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }

      // Store the file for upload on save
      setAvatarFile(file);

      // Show preview
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          setEditData(prev => ({
            ...prev,
            avatarUrl: event.target!.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSocialChange = (
    key: keyof typeof editData.socialLinks,
    value: string
  ) => {
    setEditData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: value,
      },
    }));
  };

  const handleShareProfile = () => {
    // Generate shareable profile URL with username
    const baseUrl = window.location.origin + window.location.pathname;
    const profileUrl = viewedUser.username
      ? `${baseUrl}#/profile/${viewedUser.username}`
      : window.location.href;

    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied to clipboard!");
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    await toggleFollow(viewedUser.id);
    toast.success(isFollowing ? "Unfollowed!" : "Following!");
  };

  const isFollowing =
    currentUser?.followingIds?.includes(viewedUser.id) || false;

  const renderSocialIcon = (
    url: string | undefined,
    iconClass: string,
    label: string,
    colorClass: string = "text-[#e4ddce]"
  ) => {
    if (!url) return null;

    // Build proper URL based on platform
    let safeUrl = url;
    const cleanValue = url.replace(/^@/, '').trim(); // Remove @ if present

    if (!url.startsWith("http")) {
      if (label === "Instagram") {
        safeUrl = `https://instagram.com/${cleanValue}`;
      } else if (label === "X") {
        safeUrl = `https://x.com/${cleanValue}`;
      } else {
        safeUrl = `https://${url}`;
      }
    }
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 border border-white/[0.09] hover:border-volt-400 focus:outline-none focus:ring-2 focus:ring-volt-400 ${colorClass}`}
        style={{ background: TILE }}
        title={label}
      >
        <i className={`${iconClass} text-lg`}></i>
      </a>
    );
  };

  // Eyebrow-style section heading
  const sectionTitle = (icon: string, label: React.ReactNode) => (
    <h2 className="text-lg sm:text-xl font-serif font-black mb-3 sm:mb-4 flex items-center gap-2" style={{ color: TEXT }}>
      <i className={`${icon}`} style={{ color: "rgba(243,239,224,0.35)" }}></i> {label}
    </h2>
  );

  return (
    <div className="min-h-screen px-3 sm:px-4" style={{ background: "#1e1712" }}>
      {pageHeader}
      <div className="container mx-auto max-w-4xl pt-20 pb-[110px]">
        {/* Header Card */}
        <div
          className="rounded-2xl sm:rounded-3xl border border-white/[0.06] p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-start gap-4 sm:gap-6 md:gap-8 relative mb-6 sm:mb-8"
          style={{ background: SURFACE }}
        >
          {/* Avatar Section */}
          <div className="flex-shrink-0 mx-auto md:mx-0 relative group">
            {!isEditing && headerBadge ? (
              <BadgedAvatar
                avatarUrl={sizedImageUrl(viewedUser.avatarUrl, { width: 120 })}
                alt={viewedUser.username}
                size={96}
                badge={headerBadge}
              />
            ) : (
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden"
                style={{ border: "2px solid #a3e635", background: TILE }}
              >
                <img
                  src={isEditing ? editData.avatarUrl : sizedImageUrl(viewedUser.avatarUrl, { width: 120 })}
                  alt={viewedUser.username}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer focus:outline-none focus:ring-2 focus:ring-volt-400"
              >
                <i className="fas fa-camera text-2xl"></i>
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* Info / Edit Form */}
          <div className="flex-1 w-full text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.08em] mb-1" style={{ color: MUTED }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={editData.username}
                    onChange={e =>
                      setEditData({ ...editData, username: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-white/[0.09] rounded-xl focus:ring-2 focus:ring-volt-400 outline-none font-bold"
                    style={{ background: TILE, color: TEXT }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.08em] mb-1" style={{ color: MUTED }}>
                    Bio
                  </label>
                  <textarea
                    value={editData.bio}
                    onChange={e =>
                      setEditData({ ...editData, bio: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-white/[0.09] rounded-xl focus:ring-2 focus:ring-volt-400 outline-none text-sm"
                    style={{ background: TILE, color: TEXT_2 }}
                    placeholder="Tell us about your coffee journey..."
                  />
                </div>

                <div className="pt-2 border-t border-white/[0.07]">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.08em] mb-3" style={{ color: MUTED }}>
                    Social Connections
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                      <i className="fab fa-instagram absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }}></i>
                      <input
                        type="text"
                        placeholder="Instagram username"
                        value={editData.socialLinks.instagram}
                        onChange={e =>
                          handleSocialChange("instagram", e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-2 text-sm border border-white/[0.09] rounded-lg focus:ring-2 focus:ring-volt-400 outline-none"
                        style={{ background: TILE, color: TEXT }}
                      />
                    </div>
                    <div className="relative">
                      <i className="fab fa-x-twitter absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }}></i>
                      <input
                        type="text"
                        placeholder="X username"
                        value={editData.socialLinks.x}
                        onChange={e => handleSocialChange("x", e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-white/[0.09] rounded-lg focus:ring-2 focus:ring-volt-400 outline-none"
                        style={{ background: TILE, color: TEXT }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 justify-center md:justify-start">
                  <button onClick={handleSave} className={pillBtn} style={{ background: "#a3e635", color: "#231b15" }}>
                    {uploadingAvatar ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      "Save Profile"
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className={`${pillBtn} border border-white/[0.09]`}
                    style={{ background: TILE, color: TEXT_2 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 justify-center sm:justify-start">
                  <h1 className="text-2xl sm:text-3xl font-serif font-black" style={{ color: TEXT }}>
                    @{viewedUser.username}
                  </h1>
                  {isOwnProfile && (
                    <span
                      className="text-xs sm:text-sm px-2 py-1 rounded-lg"
                      style={{ background: TILE, color: MUTED }}
                    >
                      {viewedUser.email}
                    </span>
                  )}

                  {/* Drip Score Pill */}
                  <div
                    className="ml-0 sm:ml-4 flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold"
                    style={{ background: "rgba(163,230,53,0.14)", color: "#a3e635" }}
                  >
                    <i className="fas fa-bolt"></i>
                    <span>{dripScore} DripScore</span>
                  </div>
                </div>

                {viewedUser.bio ? (
                  <p className="text-sm sm:text-base italic mb-4 max-w-lg mx-auto sm:mx-0" style={{ color: TEXT_2 }}>
                    "{viewedUser.bio}"
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm mb-4" style={{ color: "rgba(243,239,224,0.45)" }}>
                    No bio yet.
                  </p>
                )}

                {viewedUser.socialLinks &&
                  Object.values(viewedUser.socialLinks).some(v => v) && (
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                      {renderSocialIcon(
                        viewedUser.socialLinks.instagram,
                        "fab fa-instagram",
                        "Instagram",
                        "text-pink-400"
                      )}
                      {renderSocialIcon(
                        viewedUser.socialLinks.x,
                        "fab fa-x-twitter",
                        "X",
                        "text-white"
                      )}
                    </div>
                  )}

                <div className="flex justify-center sm:justify-start gap-3 sm:gap-4 mb-6 pt-2 border-t border-white/[0.06] sm:border-none flex-wrap">
                  <div className="text-center sm:text-left">
                    <span className="block font-serif font-black text-lg sm:text-xl" style={{ color: TEXT }}>
                      {savedSpots.length}
                    </span>
                    <span className="text-[10px] sm:text-xs uppercase tracking-wide" style={{ color: MUTED }}>
                      Saved
                    </span>
                  </div>
                  <div className="text-center sm:text-left pl-3 sm:pl-4 border-l border-white/[0.06]">
                    <span className="block font-serif font-black text-lg sm:text-xl" style={{ color: TEXT }}>
                      {visitedSpots.length}
                    </span>
                    <span className="text-[10px] sm:text-xs uppercase tracking-wide" style={{ color: MUTED }}>
                      Visited
                    </span>
                  </div>
                  <div className="text-center sm:text-left pl-3 sm:pl-4 border-l border-white/[0.06]">
                    <span className="block font-serif font-black text-lg sm:text-xl" style={{ color: TEXT }}>
                      {claimedSpots.length}
                    </span>
                    <span className="text-[10px] sm:text-xs uppercase tracking-wide" style={{ color: MUTED }}>
                      Owned
                    </span>
                  </div>
                  <div className="text-center sm:text-left pl-3 sm:pl-4 border-l border-white/[0.06]">
                    <span className="block font-serif font-black text-lg sm:text-xl" style={{ color: TEXT }}>
                      {viewedUser.followerIds?.length || 0}
                    </span>
                    <span className="text-[10px] sm:text-xs uppercase tracking-wide" style={{ color: MUTED }}>
                      Followers
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 justify-center sm:justify-start flex-wrap">
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={startEditing}
                        className={`${pillBtn} border border-white/[0.09]`}
                        style={{ background: TILE, color: TEXT }}
                      >
                        <i className="fas fa-edit mr-2"></i> Edit Profile
                      </button>
                      <button
                        onClick={() => navigate('/reset-password', { state: { returnPath: '/profile' } })}
                        className={`${pillBtn} border border-white/[0.09]`}
                        style={{ background: TILE, color: TEXT_2 }}
                      >
                        <i className="fas fa-lock mr-2"></i> Change Password
                      </button>
                      <button
                        onClick={handleShareProfile}
                        className={`${pillBtn} border border-white/[0.09]`}
                        style={{ background: TILE, color: "#a3e635" }}
                      >
                        <i className="fas fa-share mr-2"></i> Share Profile
                      </button>
                      <button
                        onClick={logout}
                        className={`${pillBtn} border border-white/[0.09]`}
                        style={{ background: TILE, color: "#f87171" }}
                      >
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleToggleFollow}
                        className={`${pillBtn} ${isFollowing ? "border border-white/[0.09]" : ""}`}
                        style={
                          isFollowing
                            ? { background: TILE, color: TEXT }
                            : { background: "#a3e635", color: "#231b15" }
                        }
                      >
                        <i
                          className={`fas ${isFollowing ? "fa-user-check" : "fa-user-plus"
                            } mr-2`}
                        ></i>
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                      <button
                        onClick={handleShareProfile}
                        className={`${pillBtn} border border-white/[0.09]`}
                        style={{ background: TILE, color: "#a3e635" }}
                      >
                        <i className="fas fa-share mr-2"></i> Share Profile
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* GAMIFICATION: Badges */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-serif font-black" style={{ color: TEXT }}>
              Achievements
            </h2>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
              style={{ background: "rgba(163,230,53,0.14)", color: "#a3e635" }}
            >
              Beta
            </span>
          </div>

          <div className="p-3 sm:p-4 md:p-6 rounded-2xl sm:rounded-3xl border border-white/[0.06]" style={{ background: SURFACE }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* Monthly Badge Awards (trophy case) */}
              {badgeAwards.map(award => {
                const [y, m] = String(award.month_start).split("-").map(Number);
                const monthLabel = new Date(y, (m || 1) - 1, 1).toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                });
                return (
                  <div
                    key={award.id}
                    className="aspect-square rounded-2xl flex flex-col items-center justify-center p-3 text-center border-2 transition-all duration-300 group scale-105 relative overflow-hidden"
                    style={{ background: TILE, borderColor: "rgba(163,230,53,0.6)" }}
                    title={award.badge?.description}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-2 text-2xl relative z-10"
                      style={{ background: "rgba(163,230,53,0.14)" }}
                    >
                      {award.badge?.emoji}
                    </div>
                    <h3 className="font-bold text-[10px] leading-tight mb-1 relative z-10" style={{ color: TEXT }}>
                      {award.badge?.name}
                    </h3>
                    <p className="text-[9px] font-bold relative z-10" style={{ color: "#a3e635" }}>
                      {monthLabel}
                    </p>
                  </div>
                );
              })}

              {/* Leaderboard Badges */}
              {viewedUser.leaderboardBadges?.map(badge => {
                let borderColor = "rgba(250,204,21,0.6)"; // gold
                let iconColors = "bg-yellow-400/15 text-yellow-400";
                let textColor = "#facc15";

                if (badge.rank === 2) {
                  borderColor = "rgba(209,213,219,0.5)";
                  iconColors = "bg-gray-300/15 text-gray-300";
                  textColor = "#d1d5db";
                } else if (badge.rank === 3) {
                  borderColor = "rgba(217,119,6,0.6)";
                  iconColors = "bg-amber-500/15 text-amber-500";
                  textColor = "#f59e0b";
                }

                return (
                  <div
                    key={badge.id}
                    className="aspect-square rounded-2xl flex flex-col items-center justify-center p-3 text-center border-2 transition-all duration-300 group scale-105 relative overflow-hidden"
                    style={{ background: TILE, borderColor }}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 text-xl relative z-10 ${iconColors}`}>
                      <i className="fas fa-mug-hot"></i>
                    </div>
                    <h3 className="font-bold text-[10px] leading-tight mb-1 relative z-10" style={{ color: TEXT }}>
                      {badge.title}
                    </h3>
                    <p className="text-[9px] font-bold relative z-10" style={{ color: textColor }}>
                      {badge.month}/{badge.year}
                    </p>
                  </div>
                );
              })}

              {/* Standard Badges */}
              {BADGES.map(badge => (
                <div
                  key={badge.id}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-3 text-center border-2 transition-all duration-300 group ${badge.unlocked ? "border-volt-400 scale-105" : "border-white/[0.06] opacity-50"
                    }`}
                  style={{ background: TILE }}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 text-xl ${badge.unlocked
                      ? "bg-volt-400 text-coffee-900"
                      : "bg-white/[0.06] text-[#f3efe0]/40"
                      }`}
                  >
                    <i className={badge.icon}></i>
                  </div>
                  <h3 className="font-bold text-xs mb-1" style={{ color: TEXT }}>
                    {badge.name}
                  </h3>
                  <p className="text-[9px] uppercase font-bold" style={{ color: MUTED }}>
                    {badge.desc}
                  </p>

                  {badge.unlocked && (
                    <div
                      className="mt-2 text-[9px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: "#a3e635", color: "#231b15" }}
                    >
                      UNLOCKED
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DRIPCLUB MEMBERSHIP - Only show on own profile */}
        {isOwnProfile && (
          <div className="mb-6 sm:mb-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-serif font-black" style={{ color: TEXT }}>
                DripClub Membership
              </h2>
            </div>

            {membershipLoading ? (
              <div className="p-6 rounded-2xl sm:rounded-3xl border border-white/[0.06] text-center" style={{ background: SURFACE }}>
                <i className="fas fa-spinner fa-spin text-xl" style={{ color: "rgba(243,239,224,0.45)" }}></i>
              </div>
            ) : dripClubMembership &&
              (dripClubMembership.status === "active" ||
                dripClubMembership.status === "trialing") ? (
              // Active member - Animated Badge + Info Section
              <div className="space-y-4">
                {/* Animated DripClub Badge */}
                <DripClubBadge
                  username={viewedUser.username}
                  onManage={handleManageMembership}
                />

                {/* Subscription Details Card */}
                <div className="rounded-2xl p-4 border border-white/[0.06]" style={{ background: SURFACE }}>
                  {/* Status + Plan Type */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: TEXT_2 }}>
                      {dripClubMembership.planType === "annual" ? "Annual" : "Monthly"} Plan
                    </span>
                    <div
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${dripClubMembership.status === "trialing"
                        ? "bg-blue-400/15 text-blue-300"
                        : "bg-green-400/15 text-green-300"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${dripClubMembership.status === "trialing"
                          ? "bg-blue-400"
                          : "bg-green-400"
                          }`}
                      ></span>
                      {dripClubMembership.status === "trialing"
                        ? "Free Trial"
                        : getSubscriptionStatusLabel(dripClubMembership.status)}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs border-t border-white/[0.07] pt-3">
                    <div>
                      <p className="text-[10px] uppercase" style={{ color: MUTED }}>Member Since</p>
                      <p className="font-bold" style={{ color: TEXT }}>
                        {dripClubMembership.createdAt
                          ? new Date(dripClubMembership.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase" style={{ color: MUTED }}>
                        {dripClubMembership.cancelAtPeriodEnd ? "Ends On" : "Renews On"}
                      </p>
                      <p className="font-bold" style={{ color: TEXT }}>
                        {dripClubMembership.currentPeriodEnd
                          ? new Date(dripClubMembership.currentPeriodEnd).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Cancel warning */}
                  {dripClubMembership.cancelAtPeriodEnd && (
                    <div className="rounded-xl p-3 mt-3 border border-amber-400/30" style={{ background: "rgba(251,191,36,0.08)" }}>
                      <p className="text-amber-300 text-xs font-medium flex items-center gap-2">
                        <i className="fas fa-exclamation-triangle"></i>
                        Your membership will end on{" "}
                        {dripClubMembership.currentPeriodEnd
                          ? new Date(dripClubMembership.currentPeriodEnd).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "N/A"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Non-member CTA card
              <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/[0.06]" style={{ background: SURFACE }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-volt-400 p-3 rounded-xl">
                    <i className="fas fa-crown text-coffee-900 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-black text-lg" style={{ color: TEXT }}>
                      Join DripClub
                    </h3>
                    <p className="text-xs" style={{ color: MUTED }}>
                      Unlock exclusive perks & discounts
                    </p>
                  </div>
                </div>

                <div className="rounded-xl p-4 mb-4 border border-white/[0.06]" style={{ background: TILE }}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-black" style={{ color: TEXT }}>
                      {formatPrice(getPricing().dripClub.annual.amount)}
                    </span>
                    <span className="text-sm" style={{ color: MUTED }}>/year</span>
                  </div>
                  <p className="text-xs font-bold" style={{ color: "#a3e635" }}>
                    Less than $1 per month!
                  </p>
                </div>

                <ul className="space-y-2.5 mb-5">
                  {[
                    "10% off at all PRO+ coffee shops",
                    "Exclusive DripClub member badge",
                    "Early access to events & tastings",
                    "Member only merchandise and surprises",
                  ].map((perk, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 text-sm"
                      style={{ color: TEXT_2 }}
                    >
                      <i className="fas fa-check text-xs" style={{ color: "#a3e635" }}></i>
                      {perk}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate("/dripclub")}
                  className="w-full py-3 bg-volt-400 text-coffee-900 rounded-full font-bold text-sm hover:bg-volt-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-volt-400"
                  style={{ boxShadow: "0 8px 24px -4px rgba(163,230,53,0.45)" }}
                >
                  <i className="fas fa-crown"></i>
                  Join DripClub
                </button>
              </div>
            )}
          </div>
        )}

        {/* PASSPORT BOOK */}
        <div className="mb-6 sm:mb-10">
          {sectionTitle("fas fa-passport", "Your Passport Book")}

          {Object.keys(passportBook).length > 0 ? (
            <div
              className="rounded-2xl sm:rounded-3xl border border-white/[0.09] p-4 sm:p-6 md:p-10 relative overflow-hidden"
              style={{ background: SURFACE }}
            >
              {/* Book Binding Gradient */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/40 via-black/10 to-transparent pointer-events-none z-10"></div>

              {(Object.entries(passportBook) as [string, Shop[]][]).map(
                ([location, shops]) => (
                  <div key={location} className="mb-8 last:mb-0 relative z-0">
                    <h3
                      className="text-[10px] font-bold uppercase tracking-[0.08em] border-b border-white/[0.09] pb-2 mb-6 flex items-center gap-2"
                      style={{ color: MUTED }}
                    >
                      <i className="fas fa-map-pin" style={{ color: "#a3e635" }}></i>{" "}
                      {location}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8">
                      {shops.map((shop, index) => {
                        // Randomize rotation slightly for organic "stamped" look
                        const rotations = [
                          "rotate-3",
                          "-rotate-3",
                          "rotate-6",
                          "-rotate-6",
                          "rotate-2",
                          "-rotate-2",
                        ];
                        const rotationClass =
                          rotations[index % rotations.length];

                        return (
                          <div
                            key={shop.id}
                            onClick={() => navigate(`/shop/${shop.id}`)}
                            className="cursor-pointer group flex flex-col items-center"
                          >
                            <div
                              className={`
                                                relative w-24 h-24 rounded-full border-[3px] flex flex-col items-center justify-center p-2 text-center transform transition-transform duration-300 hover:scale-110 hover:rotate-0
                                                ${rotationClass}
                                                ${shop.isClaimed
                                  ? "border-yellow-400/60 text-yellow-300" // Gold Stamp
                                  : "border-[#e4ddce]/40 text-[#e4ddce]/60 hover:border-[#e4ddce] hover:text-[#e4ddce]" // Standard Ink
                                }
                                            `}
                            >
                              {/* Rough texture overlay for ink effect */}
                              <div className="absolute inset-0 rounded-full opacity-20 bg-noise pointer-events-none"></div>

                              <div className="font-serif font-black text-[10px] leading-tight mb-1 line-clamp-2 uppercase tracking-tighter">
                                {shop.name}
                              </div>
                              <div className="text-[8px] uppercase font-bold opacity-60 border-t border-current pt-0.5 mt-0.5 w-1/2">
                                {new Date().toLocaleDateString(undefined, {
                                  month: "short",
                                  year: "2-digit",
                                })}
                              </div>

                              {shop.isClaimed && (
                                <i className="fas fa-star text-yellow-400 absolute -top-2 -right-1 text-sm filter drop-shadow-sm animate-pulse-slow"></i>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div
              className="rounded-3xl border-2 border-dashed border-white/[0.09] p-12 text-center"
              style={{ background: SURFACE }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: TILE }}
              >
                <i className="fas fa-passport text-4xl" style={{ color: "rgba(243,239,224,0.25)" }}></i>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: TEXT }}>
                Your passport is empty
              </h3>
              <p className="mb-6 max-w-xs mx-auto" style={{ color: MUTED }}>
                Check into shops to earn stamps, track your travels, and unlock
                badges.
              </p>
              <button
                onClick={() => navigate("/")}
                className={pillBtn}
                style={{ background: "#a3e635", color: "#231b15" }}
              >
                Start Exploring
              </button>
            </div>
          )}
        </div>

        {/* User Experience Logs */}
        <div className="mb-6 sm:mb-10">
          {sectionTitle("fas fa-book-open", <>Experience Logs ({userLogs.length})</>)}

          {logsLoading ? (
            <div className="p-6 rounded-2xl border border-white/[0.06] text-center" style={{ background: SURFACE }}>
              <i className="fas fa-spinner fa-spin text-xl" style={{ color: "rgba(243,239,224,0.45)" }}></i>
            </div>
          ) : userLogs.length > 0 ? (
            <div className="space-y-4">
              {userLogs.map((log) => {
                const ExpandableProfileLogCard = ({ log }: { log: any }) => {
                  const [expanded, setExpanded] = useState(false);
                  return (
                    <div key={log.id}
                      onClick={() => setExpanded(!expanded)}
                      className="p-5 rounded-2xl border border-white/[0.06] hover:border-volt-400 transition-colors cursor-pointer relative overflow-hidden"
                      style={{ background: SURFACE }}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/[0.09] shrink-0" style={{ background: TILE }}>
                            {log.shopCoverImage ? (
                              <img src={sizedImageUrl(log.shopCoverImage, { width: 1080 })} alt={log.shopName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ color: "rgba(243,239,224,0.45)" }}>
                                <i className="fas fa-coffee"></i>
                              </div>
                            )}
                          </div>
                          <div>
                            <Link to={`/shop/${log.shopId}`} onClick={(e) => e.stopPropagation()} className="font-bold text-[#f3efe0] text-base md:text-lg hover:text-volt-400 block line-clamp-1 truncate">
                              {log.shopName}
                            </Link>
                            <div className="text-xs" style={{ color: MUTED }}>
                              {log.shopCity}, {log.shopState}
                            </div>
                            <div className="text-[10px] mt-0.5" style={{ color: "rgba(243,239,224,0.45)" }}>
                              {new Date(log.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <div
                            className="flex items-center gap-1 px-2 py-1 rounded-md"
                            style={{ background: "rgba(163,230,53,0.14)", color: "#a3e635" }}
                          >
                            <i className="fas fa-tint text-[10px]"></i>
                            <span className="text-sm font-bold">{log.overallQuality}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Overview Grid */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {log.coffeeStyle !== null && log.coffeeStyle !== undefined ? (
                          <div className="rounded px-2 py-1 text-center" style={{ background: TILE }}>
                            <div className="text-[10px] uppercase flex flex-col" style={{ color: MUTED }}><span>Coffee</span></div>
                            <div className="text-xs font-bold" style={{ color: TEXT_2 }}>
                              {log.coffeeStyle >= 70 ? "Modern" : log.coffeeStyle <= 30 ? "Classic" : "Balanced"}
                            </div>
                          </div>
                        ) : <div></div>}
                        {log.vibeEnergy !== null && log.vibeEnergy !== undefined ? (
                          <div className="rounded px-2 py-1 text-center" style={{ background: TILE }}>
                            <div className="text-[10px] uppercase" style={{ color: MUTED }}>Vibe</div>
                            <div className="text-xs font-bold" style={{ color: TEXT_2 }}>
                              {log.vibeEnergy >= 70 ? "Lively" : log.vibeEnergy <= 30 ? "Quiet" : "Balanced"}
                            </div>
                          </div>
                        ) : <div></div>}
                        {log.bringFriendScore !== undefined ? (
                          <div className="rounded px-2 py-1 text-center" style={{ background: TILE }}>
                            <div className="text-[10px] uppercase" style={{ color: MUTED }}>Rec.</div>
                            <div className="text-xs font-bold" style={{ color: TEXT_2 }}>{log.bringFriendScore}/10</div>
                          </div>
                        ) : <div></div>}
                      </div>

                      {log.quickTake && (
                        <div className="relative pl-3 mb-2" style={{ borderLeft: "2px solid #a3e635" }}>
                          <p className="italic text-sm line-clamp-2" style={{ color: TEXT_2 }}>"{log.quickTake}"</p>
                        </div>
                      )}

                      {/* Expanded Details Wrapper */}
                      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-96 opacity-100 mt-4 border-t border-white/[0.06] pt-4' : 'max-h-0 opacity-0'}`}>
                        <div className="text-[10px] font-bold uppercase tracking-[0.08em] mb-2" style={{ color: MUTED }}>Full Vibe Check</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {log.matchaProfile !== null && log.matchaProfile !== undefined && (
                            <div className="text-sm p-2 rounded-lg border border-white/[0.06]" style={{ background: TILE }}>
                              <span className="block text-xs" style={{ color: "rgba(243,239,224,0.45)" }}>Matcha</span>
                              <span className="font-medium" style={{ color: TEXT_2 }}>{log.matchaProfile}/100</span>
                            </div>
                          )}
                          {log.pastryCraft !== null && log.pastryCraft !== undefined && (
                            <div className="text-sm p-2 rounded-lg border border-white/[0.06]" style={{ background: TILE }}>
                              <span className="block text-xs" style={{ color: "rgba(243,239,224,0.45)" }}>Pastry Craft</span>
                              <span className="font-medium" style={{ color: TEXT_2 }}>{log.pastryCraft}/100</span>
                            </div>
                          )}
                          {log.specialtyDrink !== null && log.specialtyDrink !== undefined && (
                            <div className="text-sm p-2 rounded-lg border border-white/[0.06]" style={{ background: TILE }}>
                              <span className="block text-xs" style={{ color: "rgba(243,239,224,0.45)" }}>Specialty Drink</span>
                              <span className="font-medium" style={{ color: TEXT_2 }}>{log.specialtyDrink}/100</span>
                            </div>
                          )}
                          {log.laptopFriendly !== null && log.laptopFriendly !== undefined && (
                            <div className="text-sm p-2 rounded-lg border border-white/[0.06]" style={{ background: TILE }}>
                              <span className="block text-xs" style={{ color: "rgba(243,239,224,0.45)" }}>Laptop Friendly</span>
                              <span className="font-medium" style={{ color: TEXT_2 }}>{log.laptopFriendly}%</span>
                            </div>
                          )}
                          {log.parkingEase !== null && log.parkingEase !== undefined && (
                            <div className="text-sm p-2 rounded-lg border border-white/[0.06]" style={{ background: TILE }}>
                              <span className="block text-xs" style={{ color: "rgba(243,239,224,0.45)" }}>Parking Ease</span>
                              <span className="font-medium" style={{ color: TEXT_2 }}>{log.parkingEase}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-center mt-2 cursor-pointer text-[10px] font-bold uppercase flex items-center justify-center gap-1 hover:text-volt-400 transition-colors text-[#f3efe0]/45">
                        {expanded ? (<><i className="fas fa-chevron-up"></i> Hide Details</>) : (<><i className="fas fa-chevron-down"></i> Expand Log</>)}
                      </div>
                    </div>
                  );
                };
                return <ExpandableProfileLogCard key={log.id} log={log} />;
              })}
            </div>
          ) : (
            <div
              className="rounded-3xl border-2 border-dashed border-white/[0.09] p-12 text-center"
              style={{ background: SURFACE }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: TILE }}
              >
                <i className="fas fa-pen text-3xl" style={{ color: "rgba(243,239,224,0.25)" }}></i>
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: TEXT }}>No logs yet</h3>
              <p className="text-sm mb-4 max-w-xs mx-auto" style={{ color: MUTED }}>
                {isOwnProfile ? "You haven't" : `@${viewedUser.username} hasn't`} rated any shops. Share your experiences!
              </p>
              {isOwnProfile && (
                <button
                  onClick={() => navigate("/")}
                  className={pillBtn}
                  style={{ background: "#a3e635", color: "#231b15" }}
                >
                  Find Shops to Rate
                </button>
              )}
            </div>
          )}
        </div>

        {/* Managed Shops (Owners Only) */}
        {claimedSpots.length > 0 && (
          <div className="mt-10 pb-10">
            {sectionTitle("fas fa-briefcase", "Your Managed Shops")}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {claimedSpots.map(shop => (
                <div
                  key={shop.id}
                  onClick={() => navigate(`/shop/${shop.id}`)}
                  className="p-5 rounded-xl border border-white/[0.06] border-l-4 border-l-volt-400 cursor-pointer transition-all group relative overflow-hidden hover:border-white/[0.12]"
                  style={{ background: SURFACE }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#f3efe0] group-hover:text-volt-400 transition-colors pr-8">
                      {shop.name}
                    </h3>
                    <div className="absolute top-5 right-5">
                      <span
                        className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
                        style={{ background: "rgba(163,230,53,0.14)", color: "#a3e635" }}
                      >
                        <i className="fas fa-check-circle"></i>
                      </span>
                    </div>
                  </div>
                  <p className="text-sm mb-4" style={{ color: MUTED }}>
                    {shop.location.address}, {shop.location.city}
                  </p>

                  <div
                    className="flex items-center justify-between text-xs font-bold uppercase tracking-wide mt-auto pt-3 border-t border-white/[0.06]"
                    style={{ color: "#a3e635" }}
                  >
                    <span>Manage Page</span>
                    <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Spots */}
        <div className="mt-10">
          {sectionTitle("fas fa-heart", "Your Saved Spots")}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedSpots.length > 0 ? (
              savedSpots.map(shop => (
                <div
                  key={shop.id}
                  onClick={() => navigate(`/shop/${shop.id}`)}
                  className="p-4 rounded-xl border border-white/[0.06] cursor-pointer transition-all group hover:border-white/[0.12]"
                  style={{ background: SURFACE }}
                >
                  <h3 className="font-bold text-[#f3efe0] group-hover:text-volt-400 transition-colors">
                    {shop.name}
                  </h3>
                  <p className="text-sm mb-2" style={{ color: MUTED }}>
                    {shop.location.city}
                  </p>
                  <div className="flex gap-1">
                    {shop.vibes.slice(0, 2).map(v => (
                      <span
                        key={v}
                        className="text-[9px] border border-white/[0.09] px-1.5 py-0.5 rounded-full"
                        style={{ background: TILE, color: TEXT_2 }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center border-2 border-dashed border-white/[0.09] rounded-xl">
                <p className="italic" style={{ color: "rgba(243,239,224,0.45)" }}>No saved spots yet.</p>
                <button
                  onClick={() => navigate("/")}
                  className={`${pillBtn} mt-2`}
                  style={{ background: TILE, color: "#a3e635", border: "1px solid rgba(255,255,255,0.09)" }}
                >
                  Explore Map
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <MenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <BottomTabBar />
    </div>
  );
};

export default Profile;
