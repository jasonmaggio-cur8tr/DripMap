import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Shop, User, Vibe, ClaimRequest, Review } from "../types";
import { INITIAL_SHOPS } from "../constants";
import { supabase } from "../lib/supabase";
import { resetSupabaseAuthState } from "../lib/authUtils";
import * as db from "../services/dbService";
import { initializeStorage } from "../services/storageService";

interface AppContextType {
  shops: Shop[];
  user: User | null;
  loading: boolean;
  signup: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ success: boolean; error?: any }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  addShop: (
    shop: Omit<Shop, "id" | "rating" | "reviewCount" | "reviews" | "stampCount">
  ) => Promise<void>;
  updateShop: (updatedShop: Shop) => void;
  toggleSaveShop: (shopId: string) => Promise<void>;
  toggleVisitedShop: (shopId: string) => Promise<void>;
  addReview: (
    shopId: string,
    review: Omit<Review, "id" | "username" | "userId" | "date">
  ) => Promise<void>;

  // Claim Logic
  claimRequests: ClaimRequest[];
  submitClaimRequest: (
    request: Omit<ClaimRequest, "id" | "status" | "date">
  ) => Promise<void>;
  markClaimRequest: (
    requestId: string,
    status: "approved" | "rejected"
  ) => Promise<void>;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedVibes: Vibe[];
  toggleVibe: (vibe: Vibe) => void;
  refreshShops: () => Promise<void>;

  // Social Features
  getShopCommunity: (shopId: string) => {
    savers: { id: string; username: string; avatarUrl: string }[];
    visitors: { id: string; username: string; avatarUrl: string }[];
  };
  getProfileById: (userId: string) => Promise<User | null>;
  getProfileByUsername: (username: string) => Promise<User | null>;
  toggleFollow: (targetUserId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVibes, setSelectedVibes] = useState<Vibe[]>([]);
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);

  // Initialize app - load shops and set up auth listener
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setLoading(true);

    await initializeStorage();
    await refreshShops();

    // Just check if there's a session once
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user.id);
    }

    setLoading(false);
  };

  const logout = async () => {
    setUser(null); // Manually clear user
    await resetSupabaseAuthState();
    window.location.replace("/");
  };

  const loadUserProfile = async (userId: string) => {
    const profile = await db.fetchUserProfile(userId);
    if (profile) {
      setUser(profile);

      // Load claim requests if user is admin or business owner
      if (profile.isAdmin || profile.isBusinessOwner) {
        const requests = await db.fetchClaimRequests();
        setClaimRequests(
          requests.map(r => ({
            id: r.id,
            shopId: r.shop_id,
            userId: r.user_id,
            businessEmail: r.business_email,
            role: r.role,
            socialLink: r.social_link,
            status: r.status as "pending" | "approved" | "rejected",
            date: r.created_at,
          }))
        );
      }
    }
  };

  const refreshShops = async () => {
    try {
      console.log("[AppContext] Fetching shops...");
      const fetchedShops = await db.fetchShops();

      if (fetchedShops.length > 0) {
        console.log(
          `[AppContext] Loaded ${fetchedShops.length} shops from database`
        );
        setShops(fetchedShops);
      } else {
        console.warn(
          "[AppContext] No shops returned from database, using fallback data"
        );
        setShops(INITIAL_SHOPS);
      }
    } catch (error) {
      console.error("[AppContext] Failed to refresh shops:", error);
      // Fall back to initial shops on error
      setShops(INITIAL_SHOPS);
    }
  };

  // Helper to refresh session if needed
  const ensureValidSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      console.warn(
        "[AppContext] Session invalid or expired, clearing user state"
      );
      setUser(null);
      return null;
    }

    // Check if token is about to expire (within 5 minutes)
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresAt - now < fiveMinutes) {
      console.log("[AppContext] Session expiring soon, refreshing...");
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError || !refreshedSession) {
        console.error("[AppContext] Failed to refresh session:", refreshError);
        // Clear user state on refresh failure
        setUser(null);
        return null;
      }

      console.log("[AppContext] Session refreshed successfully");
      return refreshedSession;
    }

    return session;
  };

  // Authentication
  const signup = async (email: string, password: string, username: string) => {
    try {
      // Get the current origin for email redirect (works for both localhost and production)
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("Signup error:", error);
        throw error;
      }

      console.log("Signup successful:", data);
      return { success: true };
    } catch (error: any) {
      console.error("Signup error details:", error);
      return {
        success: false,
        error: error.message || "Failed to create account",
      };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      console.log("Login successful:", data);
      await loadUserProfile(data.user.id);
      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  // const logout = async () => {
  //   console.log("[AppContext] Logging out...");

  //   try {
  //     // Clear React state immediately
  //     setUser(null);
  //     setShops([]);
  //     setClaimRequests([]);

  //     // Sign out - your existing listener will handle the SIGNED_OUT event
  //     await resetSupabaseAuthState();

  //     console.log("[AppContext] Logout complete");

  //     // Redirect after a brief delay
  //     setTimeout(() => {
  //       window.location.replace("/");
  //     }, 100);
  //   } catch (error) {
  //     console.error("[AppContext] Logout error:", error);

  //     // Force clear and redirect on error
  //     localStorage.clear();
  //     sessionStorage.clear();
  //     window.location.replace("/");
  //   }
  // };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;

    // Ensure session is valid before updating profile
    const session = await ensureValidSession();
    if (!session) {
      throw new Error(
        "Your session has expired. Please log out and log back in."
      );
    }

    try {
      const result = await db.updateUserProfile(user.id, {
        username: updates.username,
        bio: updates.bio,
        avatarUrl: updates.avatarUrl,
        instagram: updates.socialLinks?.instagram,
        x: updates.socialLinks?.x,
      });

      if (result.success) {
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            username: updates.username ?? prev.username,
            bio: updates.bio ?? prev.bio,
            avatarUrl: updates.avatarUrl ?? prev.avatarUrl,
            socialLinks: {
              instagram:
                updates.socialLinks?.instagram ?? prev.socialLinks?.instagram,
              x: updates.socialLinks?.x ?? prev.socialLinks?.x,
            },
          };
        });
      } else {
        console.error("Failed to update profile:", result.error);
        throw new Error("Profile update failed");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const addShop = async (
    newShop: Omit<
      Shop,
      "id" | "rating" | "reviewCount" | "reviews" | "stampCount"
    >
  ) => {
    // Ensure session is valid before creating shop
    const session = await ensureValidSession();
    if (!session) {
      throw new Error(
        "Your session has expired. Please log out and log back in."
      );
    }

    const result = await db.createShop({
      name: newShop.name,
      description: newShop.description,
      lat: newShop.location.lat,
      lng: newShop.location.lng,
      address: newShop.location.address,
      city: newShop.location.city,
      state: newShop.location.state,
      vibes: newShop.vibes,
      cheekyVibes: newShop.cheekyVibes,
      images: newShop.gallery,
    });

    if (result.success) {
      await refreshShops();
    } else {
      console.error("AppContext.addShop failed:", result.error);
      // Throw to allow caller (UI) to handle/display the real error
      throw result.error || new Error("Failed to create shop");
    }
  };

  const updateShop = (updatedShop: Shop) => {
    setShops(prev =>
      prev.map(s => (s.id === updatedShop.id ? updatedShop : s))
    );
  };

  const toggleSaveShop = async (shopId: string) => {
    if (!user) return;

    const isSaved = user.savedShops.includes(shopId);

    // Optimistic update
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        savedShops: isSaved
          ? prev.savedShops.filter(id => id !== shopId)
          : [...prev.savedShops, shopId],
      };
    });

    // Sync with database
    await db.toggleSavedShop(user.id, shopId, isSaved);
  };

  const toggleVisitedShop = async (shopId: string) => {
    if (!user) return;

    const isVisited = user.visitedShops.includes(shopId);

    // Optimistic update
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        visitedShops: isVisited
          ? prev.visitedShops.filter(id => id !== shopId)
          : [...prev.visitedShops, shopId],
      };
    });

    setShops(prevShops =>
      prevShops.map(shop => {
        if (shop.id === shopId) {
          const isNowVisited = !isVisited;
          return {
            ...shop,
            stampCount: isNowVisited
              ? (shop.stampCount || 0) + 1
              : Math.max(0, (shop.stampCount || 0) - 1),
          };
        }
        return shop;
      })
    );

    // Sync with database
    await db.toggleVisitedShop(user.id, shopId, isVisited);
  };

  const addReview = async (
    shopId: string,
    reviewData: Omit<Review, "id" | "username" | "userId" | "date">
  ) => {
    if (!user) return;

    // Ensure session is valid before adding review
    const session = await ensureValidSession();
    if (!session) {
      console.error("Session expired, cannot add review");
      return;
    }

    console.log("AppContext: Adding review for shop", shopId);
    const result = await db.addReview(
      shopId,
      user.id,
      reviewData.rating,
      reviewData.comment
    );

    console.log("AppContext: Review result:", result);

    if (result.success) {
      // Refresh shops to get updated ratings
      console.log("AppContext: Refreshing shops...");
      await refreshShops();
      console.log("AppContext: Shops refreshed");
    } else {
      console.error("AppContext: Failed to add review:", result.error);
    }
  };

  const submitClaimRequest = async (
    requestData: Omit<ClaimRequest, "id" | "status" | "date">
  ) => {
    try {
      const result = await db.submitClaimRequest({
        shopId: requestData.shopId,
        userId: requestData.userId,
        businessEmail: requestData.businessEmail,
        role: requestData.role,
        socialLink: requestData.socialLink,
      });

      if (result.success) {
        // Refresh claim requests
        const requests = await db.fetchClaimRequests();
        setClaimRequests(
          requests.map(r => ({
            id: r.id,
            shopId: r.shop_id,
            userId: r.user_id,
            businessEmail: r.business_email,
            role: r.role,
            socialLink: r.social_link,
            status: r.status as "pending" | "approved" | "rejected",
            date: r.created_at,
          }))
        );
      } else {
        console.error("Failed to submit claim request:", result.error);
        throw result.error;
      }
    } catch (error) {
      console.error("Error in submitClaimRequest:", error);
      throw error;
    }
  };

  const markClaimRequest = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    const result = await db.markClaimRequest(requestId, status);

    if (result.success) {
      // Refresh data
      await refreshShops();

      // Refresh current user profile if they were the one approved
      if (user) {
        const updatedProfile = await db.fetchUserProfile(user.id);
        if (updatedProfile) {
          setUser(updatedProfile);
        }
      }

      // Refresh claim requests
      const requests = await db.fetchClaimRequests();
      setClaimRequests(
        requests.map(r => ({
          id: r.id,
          shopId: r.shop_id,
          userId: r.user_id,
          businessEmail: r.business_email,
          role: r.role,
          socialLink: r.social_link,
          status: r.status as "pending" | "approved" | "rejected",
          date: r.created_at,
        }))
      );
    }
  };

  const toggleVibe = (vibe: Vibe) => {
    setSelectedVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  // --- SOCIAL FEATURES ---
  const getShopCommunity = (shopId: string) => {
    // Generate deterministic fake users based on shop ID
    const seed = shopId.charCodeAt(0) + (shopId.charCodeAt(1) || 0);
    const count = (seed % 5) + 3; // Generate 3-8 fake users

    const fakeNames = [
      "Alex",
      "Jordan",
      "Taylor",
      "Casey",
      "Morgan",
      "Jamie",
      "Riley",
      "Avery",
      "Quinn",
    ];

    const generateFakeUsers = (offset: number) =>
      Array.from({ length: count }).map((_, i) => {
        const name = fakeNames[(i + seed + offset) % fakeNames.length];
        return {
          id: `fake-${shopId}-${i}-${offset}`,
          username: name,
          avatarUrl: `https://ui-avatars.com/api/?name=${name}&background=random&size=128`,
        };
      });

    let savers = generateFakeUsers(0);
    let visitors = generateFakeUsers(10);

    // If current user has interacted, add them to the list
    if (user) {
      if (user.savedShops.includes(shopId)) {
        savers = [
          { id: user.id, username: user.username, avatarUrl: user.avatarUrl },
          ...savers,
        ];
      }
      if (user.visitedShops.includes(shopId)) {
        visitors = [
          { id: user.id, username: user.username, avatarUrl: user.avatarUrl },
          ...visitors,
        ];
      }
    }

    return { savers, visitors };
  };

  const getProfileById = async (userId: string): Promise<User | null> => {
    // If it's me
    if (user && user.id === userId) return user;

    // Try to fetch from database
    const profile = await db.fetchUserProfile(userId);
    if (profile) return profile;

    // If it's a fake/mock user from the community list
    if (userId.startsWith("fake-")) {
      // Generate consistent mock data
      const parts = userId.split("-");
      const seed = parseInt(parts[2] || "0") + parseInt(parts[3] || "0");
      const fakeNames = [
        "Alex",
        "Jordan",
        "Taylor",
        "Casey",
        "Morgan",
        "Jamie",
        "Riley",
        "Avery",
        "Quinn",
      ];
      const name = fakeNames[seed % fakeNames.length];

      return {
        id: userId,
        username: name,
        email: `${name.toLowerCase()}@example.com`,
        avatarUrl: `https://ui-avatars.com/api/?name=${name}&background=random&size=128`,
        bio: "Just another coffee enthusiast living the dream.",
        socialLinks: { instagram: "https://instagram.com" },
        isBusinessOwner: false,
        savedShops: ["1", "3", "5"], // Mock saved shops
        visitedShops: ["2", "4", "6", "8"], // Mock visited shops
      };
    }

    return null;
  };

  const getProfileByUsername = async (
    username: string
  ): Promise<User | null> => {
    // If it's me
    if (user && user.username.toLowerCase() === username.toLowerCase())
      return user;

    // Try to fetch from database by username
    const profile = await db.fetchUserProfileByUsername(username);
    return profile;
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!user) return { success: false, error: "Not logged in" };

    const isCurrentlyFollowing =
      user.followingIds?.includes(targetUserId) || false;

    // Optimistic update
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        followingIds: isCurrentlyFollowing
          ? (prev.followingIds || []).filter(id => id !== targetUserId)
          : [...(prev.followingIds || []), targetUserId],
      };
    });

    // Sync with database
    const result = await db.toggleFollowUser(
      user.id,
      targetUserId,
      isCurrentlyFollowing
    );

    if (!result.success) {
      // Revert on error
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          followingIds: isCurrentlyFollowing
            ? [...(prev.followingIds || []), targetUserId]
            : (prev.followingIds || []).filter(id => id !== targetUserId),
        };
      });
    }

    return result;
  };

  const filteredShops = shops.filter(shop => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      shop.name.toLowerCase().includes(query) ||
      shop.location.city.toLowerCase().includes(query) ||
      shop.location.state.toLowerCase().includes(query) ||
      shop.description.toLowerCase().includes(query) ||
      shop.vibes.some(v => v.toLowerCase().includes(query));

    const matchesVibes =
      selectedVibes.length === 0 ||
      selectedVibes.every(v => shop.vibes.includes(v));

    return matchesSearch && matchesVibes;
  });

  return (
    <AppContext.Provider
      value={{
        shops: filteredShops,
        user,
        loading,
        signup,
        login,
        logout,
        updateUserProfile,
        addShop,
        updateShop,
        toggleSaveShop,
        toggleVisitedShop,
        addReview,
        claimRequests,
        submitClaimRequest,
        markClaimRequest,
        searchQuery,
        setSearchQuery,
        selectedVibes,
        toggleVibe,
        refreshShops,
        getShopCommunity,
        getProfileById,
        getProfileByUsername,
        toggleFollow,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
