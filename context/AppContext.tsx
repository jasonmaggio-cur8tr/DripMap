import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from 'react-router-dom';
import { Shop, User, Vibe, ClaimRequest, Review, CalendarEvent, Brand } from "../types";
import { INITIAL_SHOPS } from "../constants";
import { supabase } from "../lib/supabase";
import { resetSupabaseAuthState } from "../lib/authUtils";
import * as db from "../services/dbService";
import { initializeStorage } from "../services/storageService";
import { loopService } from '../services/loopService';
import * as loops from "../services/loopsService";
import { useToast } from './ToastContext';

// Helper to parse username into first/last name
const parseName = (fullName: string) => {
  const parts = fullName.trim().split(' ');
  const firstName = parts[0];
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
  return { firstName, lastName };
};

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
  resetPassword: (email: string) => Promise<{ success: boolean; error?: any }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: any }>;
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
  isPasswordResetting: boolean;
  selectedVibes: Vibe[];
  toggleVibe: (vibe: Vibe) => void;
  refreshShops: () => Promise<void>;

  // Social Features
  getShopCommunity: (shopId: string) => Promise<{
    savers: { id: string; username: string; avatarUrl: string }[];
    visitors: { id: string; username: string; avatarUrl: string }[];
  }>;
  getProfileById: (userId: string) => Promise<User | null>;
  getProfileByUsername: (username: string) => Promise<User | null>;
  toggleFollow: (targetUserId: string) => void;

  // Events (PRO Feature)
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, "id" | "createdAt">) => void;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (eventId: string) => void;

  // Brands
  brands: Brand[];
  addBrand: (brand: Brand) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordResetting, setIsPasswordResetting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVibes, setSelectedVibes] = useState<Vibe[]>([]);
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const initializeApp = async () => {
    setLoading(true);

    await initializeStorage();
    await refreshShops();

    // Initial session check
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await loadUserProfile(session.user.id);
    }

    // Listen for auth changes (e.g. following email link, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AppContext] Auth event: ${event}`, session?.user?.email);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setClaimRequests([]);
        // Optional: clear other user-specific state
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          // If we already have the user loaded and IDs match, maybe skip?
          // But profile might have changed, safest to reload.
          if (user?.id !== session.user.id) {
            await loadUserProfile(session.user.id);
          }
        }
      }
    });

    setLoading(false);

    // Cleanup subscription on unmount? 
    // AppContext usually lives forever, but technically good practice.
    // However, initializeApp is called in useEffect [], so we can't return cleanup from here easily.
    // We'll rely on AppProvider unmount if we moved this to useEffect.
  };

  // Move initializeApp content to useEffect to handle cleanup
  useEffect(() => {
    let authSubscription: any = null;

    const init = async () => {
      setLoading(true);
      await initializeStorage();
      await refreshShops();

      // Check for auth errors in URL hash (e.g. expired links)
      const hashParams = new URLSearchParams(window.location.hash.substring(1)); // strip #
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      if (error) {
        console.error('[AppContext] Auth error detected in hash:', error, errorDescription);
        // Clean up the URL so the user doesn't see the ugly hash
        window.history.replaceState(null, '', window.location.pathname);
        setLoading(false);

        // Show user friendly message
        // Convert + to spaces if needed (though URLSearchParams handles it usually)
        toast.error(errorDescription?.replace(/\+/g, ' ') || 'Authentication failed. Please try again.');

        navigate('/auth');
        return;
      }

      // Check early for recovery intent in URL hash
      const isRecoveryHash = window.location.hash.includes('type=recovery') || window.location.hash.includes('reset-password');
      if (isRecoveryHash) {
        console.log('[AppContext] Detected recovery flow from URL hash.');
        setIsPasswordResetting(true);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }

      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`[AppContext] Auth event: ${event}`);

        const isRecoveryHashNow = window.location.hash.includes('type=recovery');

        if (event === 'PASSWORD_RECOVERY' || (isRecoveryHashNow && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED'))) {
          console.log('[AppContext] Password recovery detected! Enforcing reset state.');
          setIsPasswordResetting(true);
          // Use navigate for reliable router integration
          navigate('/reset-password');

        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setClaimRequests([]);
          setIsPasswordResetting(false);
        } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          console.log('[AppContext] Reloading profile from auth change');
          await loadUserProfile(session.user.id);
          // DO NOT navigate here. Let Auth.tsx handle redirects if needed, 
          // but effectively blocked if isPasswordResetting is true in Auth.tsx
        }
      });
      authSubscription = data.subscription;
      setLoading(false);
    };

    init();

    return () => {
      authSubscription?.unsubscribe();
    };
  }, [navigate]);

  const logout = async () => {
    setUser(null); // Manually clear user
    await resetSupabaseAuthState();
    navigate("/");
  };

  const loadUserProfile = async (userId: string) => {
    const profile = await db.fetchUserProfile(userId);
    if (profile) {
      setUser(profile);

      // Load claim requests - all for admin/business owner, own requests for regular users
      let requests: any[] = [];
      if (profile.isAdmin || profile.isBusinessOwner) {
        requests = await db.fetchClaimRequests();
      } else {
        // Regular users: fetch their own claim requests so they can see pending status
        requests = await db.fetchUserClaimRequests(userId);
      }

      if (requests.length > 0) {
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

      // Fetch events
      const fetchedEvents = await db.fetchEvents();
      const mappedEvents: CalendarEvent[] = fetchedEvents.map((e: any) => ({
        id: e.id,
        shopId: e.shop_id,
        title: e.title,
        description: e.description,
        eventType: e.event_type,
        startDateTime: e.start_date_time,
        endDateTime: e.end_date_time,
        allDay: false,
        locationName: e.location,
        ticketUrl: e.ticket_link,
        coverImage: e.cover_image_url ? {
          url: e.cover_image_url,
          fileName: '',
          mimeType: ''
        } : undefined,
        isPublished: e.is_published,
        // New fields
        createdByUserId: e.created_by || 'system', // Default for old events
        createdByRole: 'user', // We don't fetch creator profile role yet, simpler to default
        status: e.status || 'approved', // Default to approved for old events
        createdAt: e.created_at,
        attendees: e.attendees,
        attendeeCount: e.attendeeCount,
      }));
      setEvents(mappedEvents);
      console.log(`[AppContext] Loaded ${fetchedEvents.length} events from database`);
    } catch (error) {
      console.error("[AppContext] Failed to refresh shops:", error);
      // Fall back to initial shops on error
      setShops(INITIAL_SHOPS);
    }
  };

  // Auth
  const signup = async (email: string, password: string, username: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });

      if (error) throw error;

      // Profile creation is handled by DB trigger.
      // We only load user profile IF we have a session (auto-login enabled).
      // If email confirmation is required, session will be null here.
      if (data.user && data.session) {
        console.log('[AppContext] Auto-login active, loading profile...');
        await loadUserProfile(data.user.id);

        // Add to Loops.so (Email Marketing)
        // We use a fire-and-forget approach here so it doesn't block UI if it fails
        const { firstName, lastName } = parseName(username); // Helper to split username if possible, or just use username
        loopService.createContact(email, data.user.id, firstName, lastName, 'user');

      } else {
        console.log('[AppContext] No session returned (email verification likely required).');
        // Still try to add to loops (it might fail if email not verified, but worth a try or move to backend trigger)
        const { firstName, lastName } = parseName(username);
        loopService.createContact(email, data.user?.id || 'pending', firstName, lastName, 'user');
      }

      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) {
        await loadUserProfile(data.user.id);
      }
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // For HashRouter, we redirect to the base URL.
      // The onAuthStateChange listener will catch 'PASSWORD_RECOVERY' and push to /reset-password
      const redirectTo = `${window.location.origin}`;
      console.log('[AppContext] Sending password reset to:', email, 'Redirecting to base:', redirectTo);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Update password error:", error);
      return { success: false, error };
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const result = await db.updateUserProfile(user.id, updates);
    if (result.success) {
      setUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Shop Actions
  const addShop = async (shopData: any) => {
    // 1. Flatten data for DB insert
    // shopData comes from AddSpot form which has strictly typed shape matching Shop interface (mostly)
    // but dbService expects flat structure.
    const dbData = {
      name: shopData.name,
      description: shopData.description,
      // specific mapping for location object
      lat: shopData.location?.lat,
      lng: shopData.location?.lng,
      address: shopData.location?.address,
      city: shopData.location?.city,
      state: shopData.location?.state,
      country: shopData.location?.country,

      vibes: shopData.vibes,
      cheekyVibes: shopData.cheekyVibes,
      brandId: shopData.brandId,
      locationName: shopData.locationName,
      openHours: shopData.openHours,

      // Map gallery to simple structure for DB service
      images: shopData.gallery?.map((g: any) => ({
        url: g.url,
        type: g.type || 'owner'
      })) || []
    };

    const result = await db.createShop(dbData);

    if (result.success && result.shop) {
      // 2. Construct full Shop object for optimistic update
      // result.shop is the raw DB row. We need to map it to Shop interface.
      const newShop: Shop = {
        ...result.shop, // spread raw ID, timestamps, etc.

        // Re-construct the Location object
        location: {
          lat: result.shop.lat,
          lng: result.shop.lng,
          address: result.shop.address,
          city: result.shop.city,
          state: result.shop.state,
          country: result.shop.country,
        },

        // Use the gallery we just uploaded (result.shop doesn't have it yet as it's a separate table)
        gallery: shopData.gallery || [],

        // Default/Empty fields required by Shop interface
        rating: 0,
        reviewCount: 0,
        reviews: [],
        stampCount: 0,
        isClaimed: false,

        // Ensure arrays are initialized if DB returns null (though schema says default {})
        vibes: result.shop.vibes || [],
        cheekyVibes: result.shop.cheeky_vibes || [],
        customVibes: [],

        // Map snake_case to camelCase for specific fields if DB returns snake_case
        // (dbService.createShop returns raw row, so likely snake_case for some fields?)
        // Actually Supabase client returns what's in DB.
        // We know brand_id, location_name, open_hours are in DB.
        brandId: result.shop.brand_id,
        locationName: result.shop.location_name,
        openHours: result.shop.open_hours,
      };

      setShops(prev => [newShop, ...prev]);
    } else {
      // Throw error so UI knows it failed
      throw result.error || new Error("Failed to create shop");
    }
  };

  const updateShop = async (updatedShop: Shop) => {
    // Optimistic update
    setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));

    // DB update - we need to map Shop type back to DB columns if needed, 
    // but dbService.updateShopInDB takes specific fields.
    // For now, assuming specific updates are handled by components calling dbService directly
    // or we map here. 
    // Actually, looking at interface, it takes `updatedShop: Shop`.
    // dbService.updateShopInDB takes partial.
    // Let's implement basic update.
    await db.updateShopInDB(updatedShop.id, {
      name: updatedShop.name,
      description: updatedShop.description,
      // ... convert other fields if necessary
    });
  };

  const toggleSaveShop = async (shopId: string) => {
    if (!user) return;
    const isSaved = user.savedShops.includes(shopId);

    // Optimistic
    setUser(prev => {
      if (!prev) return null;
      const newSaved = isSaved
        ? prev.savedShops.filter(id => id !== shopId)
        : [...prev.savedShops, shopId];
      return { ...prev, savedShops: newSaved };
    });

    await db.toggleSavedShop(user.id, shopId, isSaved);
  };

  const toggleVisitedShop = async (shopId: string) => {
    if (!user) return;
    const isVisited = user.visitedShops.includes(shopId);

    // Optimistic
    setUser(prev => {
      if (!prev) return null;
      const newVisited = isVisited
        ? prev.visitedShops.filter(id => id !== shopId)
        : [...prev.visitedShops, shopId];
      return { ...prev, visitedShops: newVisited };
    });

    // Update shop stamp count optimistically
    setShops(prev => prev.map(shop => {
      if (shop.id === shopId) {
        return {
          ...shop,
          stampCount: Math.max(0, shop.stampCount + (isVisited ? -1 : 1))
        };
      }
      return shop;
    }));

    await db.toggleVisitedShop(user.id, shopId, isVisited);
  };

  const addReview = async (shopId: string, reviewData: any) => {
    if (!user) return;
    const result = await db.addReview(shopId, user.id, reviewData.rating, reviewData.comment);
    if (result.success) {
      // Refresh shops to get new rating/review count
      refreshShops();

      // FEAT-025: Notify shop owner of new review via Loops.so
      const shop = shops.find((s: Shop) => s.id === shopId);
      if (shop?.claimedBy) {
        const ownerProfile = await db.fetchUserProfile(shop.claimedBy);
        if (ownerProfile?.email) {
          loops.onNewReview(
            ownerProfile.email,
            shop.name,
            user.username,
            reviewData.rating.toString()
          ).catch(err => {
            console.error("Loops.so review notification failed:", err);
          });
        }
      }
    }
  };

  // Claim Requests
  const submitClaimRequest = async (request: any) => {
    const result = await db.submitClaimRequest(request);
    if (result.success) {
      // Reload profile to get updated requests if needed
      if (user) loadUserProfile(user.id);
    }
  };

  const markClaimRequest = async (requestId: string, status: "approved" | "rejected") => {
    const result = await db.markClaimRequest(requestId, status);
    if (result.success) {
      // Update local state
      setClaimRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
      if (status === 'approved' && user) loadUserProfile(user.id);

      // Notify owner via Loops.so when claim is approved
      if (status === "approved") {
        const claimRequest = claimRequests.find((r: ClaimRequest) => r.id === requestId);
        if (claimRequest) {
          const shop = shops.find((s: Shop) => s.id === claimRequest.shopId);
          if (shop && claimRequest.businessEmail) {
            loops.onShopClaimed(claimRequest.businessEmail, shop.name).catch(err => {
              console.error("Loops.so shop claimed notification failed:", err);
            });
          }
        }
      }
    }
  };

  // Filter Logic
  const toggleVibe = (vibe: Vibe) => {
    setSelectedVibes(prev =>
      prev.includes(vibe)
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe]
    );
  };

  const filteredShops = shops.filter(shop => {
    const name = shop.name || '';
    const city = shop.location?.city || shop.city || ''; // Handle nested location or root city
    // Note: shop type has city at root but dbService maps it to location.city too?
    // Looking at Shop interface: it has `city` at root AND `location: { city }`.
    // Let's be safe.

    // Actually Shop interface in `types.ts` has `city`? 
    // dbService maps `city: shop.city`.
    // Let's check Shop type def if needed, but safe access is best.

    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVibes = selectedVibes.length === 0 ||
      selectedVibes.every(v => {
        // shop.vibes comes from DB as string[] (or specifically Vibe[] if cast correctly)
        // But let's be safe and compare as strings
        return shop.vibes?.some(shopVibe => shopVibe === v || shopVibe === v.toString());
      });

    return matchesSearch && matchesVibes;
  });


  // Event functions (PRO Feature)
  const addEvent = async (eventData: Omit<CalendarEvent, "id" | "createdAt">) => {
    if (!user) throw new Error("Must be logged in to create an event");

    // Determine status
    const shop = shops.find(s => s.id === eventData.shopId);
    const isOwner = shop?.claimedBy === user.id;
    const isAdmin = user.isAdmin;
    const isPrivileged = isOwner || isAdmin;

    // Auto-approve for owners/admins, pending for everyone else
    const status: 'approved' | 'pending' = isPrivileged ? 'approved' : 'pending';

    // Only publish if privileged AND requested
    const isPublished = isPrivileged ? (eventData.isPublished ?? false) : false;

    const dbEventData = {
      shop_id: eventData.shopId,
      title: eventData.title,
      description: eventData.description,
      event_type: eventData.eventType,
      start_date_time: eventData.startDateTime,
      end_date_time: eventData.endDateTime,
      location: eventData.locationName,
      ticket_link: eventData.ticketUrl,
      cover_image_url: eventData.coverImage?.url,
      is_published: isPublished,
      created_by: user.id,
      status: status,
    };

    console.log('Creating event with data:', dbEventData);
    const result = await db.createEvent(dbEventData);

    if (result.success && result.data) {
      const newEvent: CalendarEvent = {
        id: result.data.id,
        shopId: result.data.shop_id,
        title: result.data.title,
        description: result.data.description,
        eventType: result.data.event_type,
        startDateTime: result.data.start_date_time,
        endDateTime: result.data.end_date_time,
        allDay: false,
        locationName: result.data.location,
        ticketUrl: result.data.ticket_link,
        coverImage: result.data.cover_image_url ? {
          url: result.data.cover_image_url,
          fileName: '',
          mimeType: ''
        } : undefined,
        isPublished: result.data.is_published,
        createdBy: isPrivileged ? 'owner' : 'user', // Backwards compat for UI
        createdByUserId: result.data.created_by,
        createdAt: result.data.created_at,
        status: result.data.status,
      };
      setEvents((prev: CalendarEvent[]) => [...prev, newEvent]);
    } else {
      console.error('Failed to create event:', result.error);
      throw new Error(result.error?.message || 'Failed to create event');
    }

    return result;
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    const updates = {
      title: updatedEvent.title,
      description: updatedEvent.description,
      event_type: updatedEvent.eventType,
      start_date_time: updatedEvent.startDateTime,
      end_date_time: updatedEvent.endDateTime,
      location: updatedEvent.locationName,
      ticket_link: updatedEvent.ticketUrl,
      cover_image_url: updatedEvent.coverImage?.url,
      is_published: updatedEvent.isPublished,
      status: updatedEvent.status, // Ensure status is updated if changed via edit
    };

    const result = await db.updateEvent(updatedEvent.id, updates);

    if (result.success) {
      setEvents((prev: CalendarEvent[]) => prev.map((e: CalendarEvent) => e.id === updatedEvent.id ? updatedEvent : e));
    }
  };

  const updateEventStatus = async (eventId: string, status: 'approved' | 'rejected') => {
    const result = await db.updateEventStatus(eventId, status);
    if (result.success) {
      setEvents((prev: CalendarEvent[]) => prev.map(e => {
        if (e.id === eventId) {
          return {
            ...e,
            status,
            isPublished: status === 'approved' ? true : e.isPublished
            // If rejected, usually unpublish? Or just keep as is?
            // dbService.updateEventStatus sets is_published=true if approved.
            // If rejected, let's assume we don't hide it necessarily if it was already published?
            // But usually pending -> approved/rejected.
          };
        }
        return e;
      }));
    }
    return result;
  };

  const deleteEvent = async (eventId: string) => {
    const result = await db.deleteEvent(eventId);

    if (result.success) {
      setEvents((prev: CalendarEvent[]) => prev.filter((e: CalendarEvent) => e.id !== eventId));
    }
  };

  // Social Features Implementation
  const getShopCommunity = async (shopId: string) => {
    return await db.fetchShopCommunity(shopId);
  };

  const getProfileById = async (userId: string) => {
    return await db.fetchUserProfile(userId);
  };

  const getProfileByUsername = async (username: string) => {
    return await db.fetchUserProfileByUsername(username);
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!user) return;
    const isFollowing = user.followingIds?.includes(targetUserId) || false;

    // Optimistic update
    setUser(prev => {
      if (!prev) return null;
      const newFollowing = isFollowing
        ? prev.followingIds?.filter(id => id !== targetUserId)
        : [...(prev.followingIds || []), targetUserId];
      return { ...prev, followingIds: newFollowing };
    });

    await db.toggleFollowUser(user.id, targetUserId, isFollowing);
  };

  // Brands
  const addBrand = (newBrand: Brand) => {
    setBrands(prev => [...prev, newBrand]);
  };

  return (
    <AppContext.Provider
      value={{
        shops: filteredShops,
        user,
        loading,
        signup,
        login,
        logout,
        resetPassword,
        updatePassword,
        updateUserProfile,
        isPasswordResetting,
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
        getShopCommunity, // Now defined
        getProfileById,   // Now defined
        getProfileByUsername, // Now defined
        toggleFollow,     // Now defined
        events,
        addEvent,
        updateEvent,
        updateEventStatus,
        deleteEvent,
        brands,
        addBrand,
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
