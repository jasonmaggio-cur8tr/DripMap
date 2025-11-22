
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Shop, User, Vibe, ClaimRequest, Review } from '../types';
import { INITIAL_SHOPS } from '../constants';
import { supabase } from '../lib/supabase';

interface AppContextType {
  shops: Shop[];
  user: User | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  addShop: (shop: Shop) => void;
  toggleSaveShop: (shopId: string) => void;
  toggleVisitedShop: (shopId: string) => void;
  addReview: (shopId: string, review: Omit<Review, 'id' | 'username' | 'userId' | 'date'>) => void;
  claimShop: (shopId: string) => void;
  
  // Claim Logic
  claimRequests: ClaimRequest[];
  submitClaimRequest: (request: Omit<ClaimRequest, 'id' | 'status' | 'date'>) => void;
  approveClaimRequest: (requestId: string) => void;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedVibes: Vibe[];
  toggleVibe: (vibe: Vibe) => void;
  
  // Social Data
  getShopCommunity: (shopId: string) => { 
      savers: { id: string; username: string; avatarUrl: string }[], 
      visitors: { id: string; username: string; avatarUrl: string }[] 
  };
  getProfileById: (userId: string) => Promise<User | null>;
  toggleFollow: (targetUserId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shops, setShops] = useState<Shop[]>(INITIAL_SHOPS);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<Vibe[]>([]);
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);

  // Initialize Supabase Auth Listener
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        // Don't clear user if it was set by manual demo login (no ID conflicts)
        if (user && user.id.startsWith('demo-')) return;
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: any) => {
    try {
        const username = authUser.email?.split('@')[0] || 'user';
        
        setUser({
            id: authUser.id,
            username: username,
            email: authUser.email || '',
            avatarUrl: `https://ui-avatars.com/api/?name=${username}&background=231b15&color=ccff00`,
            bio: '', 
            socialLinks: {}, 
            isBusinessOwner: false,
            savedShops: [],
            visitedShops: [],
            followers: [],
            following: []
        });
    } catch (error) {
        console.error("Error loading user profile", error);
    }
  };

  // DEMO LOGIN: Bypasses Supabase for instant access
  const login = async (email: string) => {
     const username = email.split('@')[0];
     setUser({
        id: `demo-${Math.random().toString(36).substr(2, 9)}`,
        username: username,
        email: email,
        avatarUrl: `https://ui-avatars.com/api/?name=${username}&background=231b15&color=ccff00`,
        bio: 'Just a coffee lover exploring the world.', 
        socialLinks: {}, 
        isBusinessOwner: false,
        savedShops: [],
        visitedShops: [],
        followers: ['fake-1', 'fake-2'],
        following: ['fake-3']
     });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUserProfile = (updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const addShop = (newShop: Shop) => {
    setShops(prev => [newShop, ...prev]);
  };

  const toggleSaveShop = (shopId: string) => {
    if (!user) return;
    
    setUser(prev => {
        if(!prev) return null;
        const isSaved = prev.savedShops.includes(shopId);
        return {
            ...prev,
            savedShops: isSaved 
                ? prev.savedShops.filter(id => id !== shopId)
                : [...prev.savedShops, shopId]
        }
    });
  };

  const toggleVisitedShop = (shopId: string) => {
    if (!user) return;

    // Optimistically update shop stamp count
    setShops(prevShops => prevShops.map(shop => {
        if (shop.id === shopId) {
            const isNowVisited = !user.visitedShops.includes(shopId);
            return {
                ...shop,
                stampCount: isNowVisited ? (shop.stampCount || 0) + 1 : Math.max(0, (shop.stampCount || 0) - 1)
            };
        }
        return shop;
    }));
    
    setUser(prev => {
        if(!prev) return null;
        const isVisited = prev.visitedShops.includes(shopId);
        return {
            ...prev,
            visitedShops: isVisited 
                ? prev.visitedShops.filter(id => id !== shopId)
                : [...prev.visitedShops, shopId]
        }
    });
  };

  const addReview = (shopId: string, reviewData: Omit<Review, 'id' | 'username' | 'userId' | 'date'>) => {
    if (!user) return;

    const newReview: Review = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        username: user.username,
        date: new Date().toLocaleDateString(),
        ...reviewData
    };

    setShops(prevShops => prevShops.map(shop => {
        if (shop.id !== shopId) return shop;

        const updatedReviews = [newReview, ...shop.reviews];
        const totalStars = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
        const newRating = Number((totalStars / updatedReviews.length).toFixed(1));

        return {
            ...shop,
            reviews: updatedReviews,
            reviewCount: updatedReviews.length,
            rating: newRating
        };
    }));
  };

  const claimShop = (shopId: string) => {
    setShops(prev => prev.map(shop => 
        shop.id === shopId ? { ...shop, isClaimed: true, claimedBy: user?.id } : shop
    ));
  };

  const submitClaimRequest = (requestData: Omit<ClaimRequest, 'id' | 'status' | 'date'>) => {
    const newRequest: ClaimRequest = {
        ...requestData,
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending',
        date: new Date().toISOString()
    };
    setClaimRequests(prev => [...prev, newRequest]);
  };

  const approveClaimRequest = (requestId: string) => {
    const request = claimRequests.find(r => r.id === requestId);
    if (!request) return;

    setClaimRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: 'approved' } : r
    ));

    setShops(prev => prev.map(shop => 
        shop.id === request.shopId ? { ...shop, isClaimed: true, claimedBy: request.userId } : shop
    ));
  };

  const toggleVibe = (vibe: Vibe) => {
    setSelectedVibes(prev => 
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  const filteredShops = shops.filter(shop => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
        shop.name.toLowerCase().includes(query) || 
        shop.location.city.toLowerCase().includes(query) ||
        shop.location.state.toLowerCase().includes(query) ||
        shop.description.toLowerCase().includes(query) ||
        shop.vibes.some(v => v.toLowerCase().includes(query));
    
    const matchesVibes = selectedVibes.length === 0 || 
                         selectedVibes.every(v => shop.vibes.includes(v));
    
    return matchesSearch && matchesVibes;
  });

  // --- DEMO FEATURE: Simulate Community Data ---
  const getShopCommunity = (shopId: string) => {
      // Generate deterministic fake users based on shop ID
      const seed = shopId.charCodeAt(0) + (shopId.charCodeAt(1) || 0);
      const count = (seed % 5) + 3; // Generate 3-8 fake users
      
      const fakeNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Jamie', 'Riley', 'Avery', 'Quinn'];
      
      const generateFakeUsers = (offset: number) => Array.from({ length: count }).map((_, i) => {
          const name = fakeNames[(i + seed + offset) % fakeNames.length];
          return {
              id: `fake-${shopId}-${i}-${offset}`,
              username: name,
              avatarUrl: `https://ui-avatars.com/api/?name=${name}&background=random&size=128`
          };
      });

      let savers = generateFakeUsers(0);
      let visitors = generateFakeUsers(10);

      // If current user has interacted, add them to the list
      if (user) {
          if (user.savedShops.includes(shopId)) {
              savers = [{ id: user.id, username: user.username, avatarUrl: user.avatarUrl }, ...savers];
          }
          if (user.visitedShops.includes(shopId)) {
              visitors = [{ id: user.id, username: user.username, avatarUrl: user.avatarUrl }, ...visitors];
          }
      }

      return { savers, visitors };
  };

  // --- DEMO FEATURE: Fetch Profile ---
  const getProfileById = async (userId: string): Promise<User | null> => {
    // If it's me
    if (user && user.id === userId) return user;

    // If it's a fake/mock user from the community list
    if (userId.startsWith('fake-')) {
        // Generate consistent mock data
        const parts = userId.split('-');
        const seed = parseInt(parts[2] || '0') + parseInt(parts[3] || '0');
        const fakeNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Jamie', 'Riley', 'Avery', 'Quinn'];
        const name = fakeNames[seed % fakeNames.length];
        
        return {
            id: userId,
            username: name,
            email: `${name.toLowerCase()}@example.com`,
            avatarUrl: `https://ui-avatars.com/api/?name=${name}&background=random&size=128`,
            bio: 'Just another coffee enthusiast living the dream.',
            socialLinks: { instagram: 'https://instagram.com' },
            isBusinessOwner: false,
            savedShops: ['1', '3', '5'], // Mock saved shops
            visitedShops: ['2', '4', '6', '8'], // Mock visited shops
            followers: Array(Math.floor(Math.random() * 50)).fill('fake'),
            following: Array(Math.floor(Math.random() * 30)).fill('fake')
        };
    }

    return null;
  };

  const toggleFollow = (targetUserId: string) => {
      if (!user) return;
      
      setUser(prev => {
          if (!prev) return null;
          const isFollowing = prev.following.includes(targetUserId);
          return {
              ...prev,
              following: isFollowing 
                ? prev.following.filter(id => id !== targetUserId)
                : [...prev.following, targetUserId]
          };
      });
  };

  return (
    <AppContext.Provider value={{
      shops: filteredShops,
      user,
      login,
      logout,
      updateUserProfile,
      addShop,
      toggleSaveShop,
      toggleVisitedShop,
      addReview,
      claimShop,
      claimRequests,
      submitClaimRequest,
      approveClaimRequest,
      searchQuery,
      setSearchQuery,
      selectedVibes,
      toggleVibe,
      getShopCommunity,
      getProfileById,
      toggleFollow
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
