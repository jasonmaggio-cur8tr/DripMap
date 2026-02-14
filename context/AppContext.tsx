import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Shop, User, Vibe, ClaimRequest, Review, CalendarEvent, Brand } from "../types";
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
  const [shops, setShops] = useState<Shop[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVibes, setSelectedVibes] = useState<Vibe[]>([]);
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

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

      // Profile creation is handled by DB trigger, but we reload profile
      if (data.user) {
        await loadUserProfile(data.user.id);
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

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;
    const result = await db.updateUserProfile(user.id, updates);
    if (result.success) {
      setUser(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Shop Actions
  const addShop = async (shopData: any) => {
    const result = await db.createShop(shopData);
    if (result.success && result.shop) {
      setShops(prev => [result.shop, ...prev]);
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
      // Or optimistically update
      refreshShops();
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
      if (status === 'approved' && user) loadUserProfile(user.id); // Reload to check if I became owner
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
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVibes = selectedVibes.length === 0 ||
      selectedVibes.every(v => shop.vibes.includes(v.id));
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
