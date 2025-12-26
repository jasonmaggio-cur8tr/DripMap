import { supabase } from "../lib/supabase";
import { Shop, User, Review, ClaimRequest, ShopImage } from "../types";

// ==================== RETRY UTILITY ====================

/**
 * Retry a function with exponential backoff
 * Helps handle transient network errors like ERR_QUIC_PROTOCOL_ERROR
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operationName: string = "operation"
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(
          `[dbService] Retry attempt ${attempt}/${maxRetries} for ${operationName} after ${delay}ms delay`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || error?.details || String(error);

      // Check if it's a retryable error (network issues, QUIC protocol errors, etc.)
      const isRetryable =
        errorMsg.includes("Failed to fetch") ||
        errorMsg.includes("QUIC") ||
        errorMsg.includes("network") ||
        errorMsg.includes("timeout") ||
        errorMsg.includes("ECONNRESET") ||
        errorMsg.includes("ETIMEDOUT");

      if (!isRetryable || attempt === maxRetries) {
        console.error(
          `[dbService] ${operationName} failed after ${attempt + 1} attempts:`,
          error
        );
        throw error;
      }

      console.warn(
        `[dbService] ${operationName} failed (attempt ${
          attempt + 1
        }), will retry:`,
        errorMsg
      );
    }
  }

  throw lastError;
};

// ==================== PROFILES ====================

export const fetchUserProfile = async (
  userId: string
): Promise<User | null> => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    if (!profile) return null;

    // Fetch saved shops, visited shops, followers, and following
    const [savedResult, visitedResult, followersResult, followingResult] =
      await Promise.all([
        supabase.from("saved_shops").select("shop_id").eq("user_id", userId),
        supabase.from("visited_shops").select("shop_id").eq("user_id", userId),
        supabase
          .from("user_follows")
          .select("follower_id")
          .eq("following_id", userId)
          .then(r => (r.error ? { data: [] } : r)),
        supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", userId)
          .then(r => (r.error ? { data: [] } : r)),
      ]);

    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      bio: profile.bio || "",
      socialLinks: {
        instagram: profile.instagram,
        x: profile.x,
      },
      isBusinessOwner: profile.is_business_owner,
      isAdmin: profile.is_admin || false,
      isPro: profile.is_pro || false,
      savedShops: savedResult.data?.map(s => s.shop_id) || [],
      visitedShops: visitedResult.data?.map(v => v.shop_id) || [],
      followerIds: followersResult.data?.map(f => f.follower_id) || [],
      followingIds: followingResult.data?.map(f => f.following_id) || [],
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const fetchUserProfileByUsername = async (
  username: string
): Promise<User | null> => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", username)
      .single();

    if (error) throw error;
    if (!profile) return null;

    // Fetch saved shops, visited shops, followers, and following
    const [savedResult, visitedResult, followersResult, followingResult] =
      await Promise.all([
        supabase
          .from("saved_shops")
          .select("shop_id")
          .eq("user_id", profile.id),
        supabase
          .from("visited_shops")
          .select("shop_id")
          .eq("user_id", profile.id),
        supabase
          .from("user_follows")
          .select("follower_id")
          .eq("following_id", profile.id)
          .then(r => (r.error ? { data: [] } : r)),
        supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", profile.id)
          .then(r => (r.error ? { data: [] } : r)),
      ]);

    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      bio: profile.bio || "",
      socialLinks: {
        instagram: profile.instagram,
        x: profile.x,
      },
      isBusinessOwner: profile.is_business_owner,
      isAdmin: profile.is_admin || false,
      isPro: profile.is_pro || false,
      savedShops: savedResult.data?.map(s => s.shop_id) || [],
      visitedShops: visitedResult.data?.map(v => v.shop_id) || [],
      followerIds: followersResult.data?.map(f => f.follower_id) || [],
      followingIds: followingResult.data?.map(f => f.following_id) || [],
    };
  } catch (error) {
    console.error("Error fetching user profile by username:", error);
    return null;
  }
};

export const toggleFollowUser = async (
  followerId: string,
  followingId: string,
  isCurrentlyFollowing: boolean
) => {
  try {
    if (isCurrentlyFollowing) {
      // Unfollow
      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("following_id", followingId);

      if (error) throw error;
    } else {
      // Follow
      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: followerId, following_id: followingId });

      if (error) throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error toggling follow:", error);
    return {
      success: false,
      error: error.message || "Failed to follow/unfollow",
    };
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: {
    username?: string;
    bio?: string;
    avatarUrl?: string;
    instagram?: string;
    x?: string;
  }
) => {
  try {
    const updateData: any = {};
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.avatarUrl !== undefined)
      updateData.avatar_url = updates.avatarUrl;
    if (updates.instagram !== undefined)
      updateData.instagram = updates.instagram;
    if (updates.x !== undefined) updateData.x = updates.x;

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error };
  }
};

// ==================== SHOPS ====================

export const fetchShops = async (): Promise<Shop[]> => {
  try {
    return await retryWithBackoff(
      async () => {
        const { data: shops, error } = await supabase
          .from("shops")
          .select(
            `
          *,
          shop_images(*),
          reviews(*, profiles(username, avatar_url))
        `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!shops) return [];

        // Debug: Log raw data to check field values
        if (shops.length > 0) {
          // Find shop with reviews to debug
          const shopWithReview = shops.find(s => s.reviews && s.reviews.length > 0) || shops[0];
          console.log("[fetchShops] Shop with reviews - raw data:", {
            id: shopWithReview.id,
            name: shopWithReview.name,
            rating: shopWithReview.rating,
            rating_type: typeof shopWithReview.rating,
            review_count: shopWithReview.review_count,
            stamp_count: shopWithReview.stamp_count,
            reviews_length: shopWithReview.reviews?.length,
            first_review: shopWithReview.reviews?.[0]
          });
        }

        return shops.map(shop => ({
          id: shop.id,
          name: shop.name,
          description: shop.description || "",
          location: {
            lat: parseFloat(shop.lat),
            lng: parseFloat(shop.lng),
            address: shop.address,
            city: shop.city,
            state: shop.state,
          },
          gallery:
            shop.shop_images?.map((img: any) => ({
              url: img.url,
              type: img.type,
              caption: img.caption,
            })) || [],
          vibes: shop.vibes || [],
          cheekyVibes: shop.cheeky_vibes || [],
          rating: parseFloat(shop.rating) || 0,
          reviewCount: shop.review_count || 0,
          reviews:
            shop.reviews?.map((r: any) => ({
              id: r.id,
              userId: r.user_id,
              username: r.profiles?.username || "Anonymous",
              avatarUrl:
                r.profiles?.avatar_url ||
                `https://ui-avatars.com/api/?name=${
                  r.profiles?.username || "User"
                }&background=random`,
              rating: r.rating,
              comment: r.comment || "",
              date: new Date(r.created_at).toLocaleDateString(),
            })) || [],
          isClaimed: shop.is_claimed,
          claimedBy: shop.claimed_by,
          stampCount: shop.stamp_count || 0,
          subscriptionTier: shop.subscription_tier || 'free',

          // PRO Features
          brandId: shop.brand_id,
          locationName: shop.location_name,
          customVibes: shop.custom_vibes || [],
          spotifyPlaylistUrl: shop.spotify_playlist_url,
          websiteUrl: shop.website_url,
          mapsUrl: shop.maps_url,
          onlineOrderUrl: shop.online_order_url,

          // Happening Now
          happeningNow: shop.happening_now_title ? {
            id: shop.id, // Use shop ID as happening now ID
            title: shop.happening_now_title,
            message: shop.happening_now_message,
            sticker: shop.happening_now_sticker,
            expiresAt: shop.happening_now_expires_at,
            createdAt: shop.updated_at || shop.created_at, // Use shop's updated_at
          } : undefined,

          // Now Brewing
          currentMenu: shop.current_menu || [],

          // Coffee Tech
          sourcingInfo: shop.sourcing_info,
          espressoMachine: shop.espresso_machine,
          grinderDetails: shop.grinder_details,
          brewingMethods: shop.brewing_methods || [],

          // Barista Profiles
          baristas: shop.baristas || [],

          // Specialty Menu
          specialtyDrinks: shop.specialty_drinks || [],

          // Vegan Options
          veganFoodOptions: shop.vegan_food_options || false,
          plantMilks: shop.plant_milks || [],
        }));
      },
      3,
      1000,
      "fetchShops"
    );
  } catch (error) {
    console.error(
      "[dbService] Error fetching shops (all retries exhausted):",
      error
    );
    return [];
  }
};

export const createShop = async (shopData: {
  name: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  vibes: string[];
  cheekyVibes: string[];
  images: { url: string; type: "owner" | "community" }[];
}) => {
  try {
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .insert({
        name: shopData.name,
        description: shopData.description,
        lat: shopData.lat,
        lng: shopData.lng,
        address: shopData.address,
        city: shopData.city,
        state: shopData.state,
        vibes: shopData.vibes,
        cheeky_vibes: shopData.cheekyVibes,
      })
      .select()
      .single();

    if (shopError) throw shopError;

    // Add images
    if (shopData.images.length > 0) {
      const imageInserts = shopData.images.map(img => ({
        shop_id: shop.id,
        url: img.url,
        type: img.type,
      }));

      await supabase.from("shop_images").insert(imageInserts);
    }

    return { success: true, shop };
  } catch (error) {
    console.error("Error creating shop:", error);
    return { success: false, error };
  }
};

/**
 * Add images to an existing shop
 */
export const addShopImages = async (
  shopId: string,
  images: { url: string; type: "owner" | "community" }[]
) => {
  try {
    if (images.length === 0) return { success: true };

    const imageInserts = images.map(img => ({
      shop_id: shopId,
      url: img.url,
      type: img.type,
    }));

    const { error } = await supabase.from("shop_images").insert(imageInserts).select();

    if (error) {
      console.error('[addShopImages] Database insert error (RLS may be blocking):', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding shop images:", error);
    return { success: false, error };
  }
};

/**
 * Update shop details
 */
export const updateShopInDB = async (
  shopId: string,
  updates: {
    name?: string;
    description?: string;
    lat?: number;
    lng?: number;
    address?: string;
    city?: string;
    state?: string;
    vibes?: string[];
    cheeky_vibes?: string[];
    open_hours?: any;
  }
) => {
  try {
    const { error } = await supabase
      .from("shops")
      .update(updates)
      .eq("id", shopId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error updating shop:", error);
    return { success: false, error };
  }
};

// ==================== PRO FEATURES ====================

/**
 * Update Happening Now status (Digital A-Frame)
 */
export const updateHappeningNow = async (
  shopId: string,
  status: { title: string; message: string; sticker?: string } | null
) => {
  try {
    const updates = status
      ? {
          happening_now_title: status.title,
          happening_now_message: status.message,
          happening_now_sticker: status.sticker || null,
          happening_now_expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
        }
      : {
          happening_now_title: null,
          happening_now_message: null,
          happening_now_sticker: null,
          happening_now_expires_at: null,
        };

    const { error } = await supabase
      .from("shops")
      .update(updates)
      .eq("id", shopId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating Happening Now:", error);
    return { success: false, error };
  }
};

/**
 * Update Now Brewing menu
 */
export const updateNowBrewing = async (
  shopId: string,
  menu: Array<{ id: string; type: 'Espresso' | 'Pour Over' | 'Drip' | 'Cold Brew'; roaster: string; beanName: string; notes: string }>
) => {
  try {
    const { error } = await supabase
      .from("shops")
      .update({ current_menu: menu })
      .eq("id", shopId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating Now Brewing menu:", error);
    return { success: false, error };
  }
};

/**
 * Update Coffee Tech info
 */
export const updateCoffeeTech = async (
  shopId: string,
  data: {
    sourcingInfo?: string;
    espressoMachine?: string;
    grinderDetails?: string;
    brewingMethods?: string[];
  }
) => {
  try {
    const { error } = await supabase
      .from("shops")
      .update({
        sourcing_info: data.sourcingInfo || null,
        espresso_machine: data.espressoMachine || null,
        grinder_details: data.grinderDetails || null,
        brewing_methods: data.brewingMethods || [],
      })
      .eq("id", shopId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating Coffee Tech:", error);
    return { success: false, error };
  }
};

/**
 * Update Barista Profiles
 */
export const updateBaristaProfiles = async (
  shopId: string,
  baristas: Array<{ name: string; role: string; bio: string; favoriteOrder: string }>
) => {
  try {
    const { error } = await supabase
      .from("shops")
      .update({ baristas })
      .eq("id", shopId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating Barista Profiles:", error);
    return { success: false, error };
  }
};

/**
 * Update Specialty Menu
 */
export const updateSpecialtyMenu = async (
  shopId: string,
  drinks: Array<{ name: string; desc: string }>
) => {
  try {
    const { error } = await supabase
      .from("shops")
      .update({ specialty_drinks: drinks })
      .eq("id", shopId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating Specialty Menu:", error);
    return { success: false, error };
  }
};

/**
 * Update Vegan Options
 */
export const updateVeganOptions = async (
  shopId: string,
  data: {
    veganFoodOptions: boolean;
    plantMilks: Array<{ name: string; upcharge: string }>;
  }
) => {
  try {
    const { error } = await supabase
      .from("shops")
      .update({
        vegan_food_options: data.veganFoodOptions,
        plant_milks: data.plantMilks,
      })
      .eq("id", shopId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating Vegan Options:", error);
    return { success: false, error };
  }
};

/**
 * Update Premium Links
 */
export const updatePremiumLinks = async (
  shopId: string,
  links: {
    websiteUrl?: string;
    mapsUrl?: string;
    onlineOrderUrl?: string;
    spotifyPlaylistUrl?: string;
  }
) => {
  try {
    const { error } = await supabase
      .from("shops")
      .update({
        website_url: links.websiteUrl || null,
        maps_url: links.mapsUrl || null,
        online_order_url: links.onlineOrderUrl || null,
        spotify_playlist_url: links.spotifyPlaylistUrl || null,
      })
      .eq("id", shopId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating Premium Links:", error);
    return { success: false, error };
  }
};

// ==================== REVIEWS ====================

export const addReview = async (
  shopId: string,
  userId: string,
  rating: number,
  comment: string
) => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        shop_id: shopId,
        user_id: userId,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) {
      console.error("[addReview] Error inserting review:", error);
      throw error;
    }

    // Manually update shop rating and review_count (fallback if DB trigger doesn't exist)
    try {
      // Fetch all reviews for this shop to calculate new average
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("shop_id", shopId);

      if (reviewsError) {
        console.error("[addReview] Error fetching reviews for rating calc:", reviewsError);
      } else if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const reviewCount = reviews.length;

        const { error: updateError } = await supabase
          .from("shops")
          .update({
            rating: parseFloat(avgRating.toFixed(2)),
            review_count: reviewCount
          })
          .eq("id", shopId);

        if (updateError) {
          console.error("[addReview] Error updating shop rating/count (RLS may block this):", updateError);
        }
      }
    } catch (calcError) {
      console.error("[addReview] Error in rating calculation:", calcError);
    }

    return { success: true, review: data };
  } catch (error) {
    console.error("[addReview] Error adding review:", error);
    return { success: false, error };
  }
};

// ==================== SAVED SHOPS ====================

export const toggleSavedShop = async (
  userId: string,
  shopId: string,
  isSaved: boolean
) => {
  try {
    if (isSaved) {
      // Remove from saved
      const { error } = await supabase
        .from("saved_shops")
        .delete()
        .eq("user_id", userId)
        .eq("shop_id", shopId);

      if (error) throw error;
    } else {
      // Add to saved
      const { error } = await supabase
        .from("saved_shops")
        .insert({ user_id: userId, shop_id: shopId });

      if (error) throw error;
    }
    return { success: true };
  } catch (error) {
    console.error("Error toggling saved shop:", error);
    return { success: false, error };
  }
};

// ==================== VISITED SHOPS ====================

export const toggleVisitedShop = async (
  userId: string,
  shopId: string,
  isVisited: boolean
) => {
  try {

    if (isVisited) {
      // Remove from visited
      const { error } = await supabase
        .from("visited_shops")
        .delete()
        .eq("user_id", userId)
        .eq("shop_id", shopId);

      if (error) {
        console.error("[toggleVisitedShop] Error deleting from visited_shops:", error);
        throw error;
      }

      // Decrement stamp_count on the shop
      const { data: shop, error: fetchError } = await supabase
        .from("shops")
        .select("stamp_count")
        .eq("id", shopId)
        .single();

      if (fetchError) {
        console.error("[toggleVisitedShop] Error fetching shop stamp_count:", fetchError);
      }

      if (shop) {
        const newCount = Math.max(0, (shop.stamp_count || 0) - 1);
        const { error: updateError } = await supabase
          .from("shops")
          .update({ stamp_count: newCount })
          .eq("id", shopId);

        if (updateError) {
          console.error("[toggleVisitedShop] Error updating stamp_count (RLS may block this):", updateError);
        }
      }
    } else {
      // Add to visited
      const { error } = await supabase
        .from("visited_shops")
        .insert({ user_id: userId, shop_id: shopId });

      if (error) {
        console.error("[toggleVisitedShop] Error inserting to visited_shops:", error);
        throw error;
      }

      // Increment stamp_count on the shop
      const { data: shop, error: fetchError } = await supabase
        .from("shops")
        .select("stamp_count")
        .eq("id", shopId)
        .single();

      if (fetchError) {
        console.error("[toggleVisitedShop] Error fetching shop stamp_count:", fetchError);
      }

      if (shop) {
        const newCount = (shop.stamp_count || 0) + 1;
        const { error: updateError } = await supabase
          .from("shops")
          .update({ stamp_count: newCount })
          .eq("id", shopId);

        if (updateError) {
          console.error("[toggleVisitedShop] Error updating stamp_count (RLS may block this):", updateError);
        }
      }
    }
    return { success: true };
  } catch (error) {
    console.error("Error toggling visited shop:", error);
    return { success: false, error };
  }
};

// ==================== CLAIM REQUESTS ====================

export const submitClaimRequest = async (request: {
  shopId: string;
  userId: string;
  businessEmail: string;
  role: string;
  socialLink: string;
}) => {
  try {
    const { data, error } = await supabase
      .from("claim_requests")
      .insert({
        shop_id: request.shopId,
        user_id: request.userId,
        business_email: request.businessEmail,
        role: request.role,
        social_link: request.socialLink,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, request: data };
  } catch (error) {
    console.error("Error submitting claim request:", error);
    return { success: false, error };
  }
};

export const fetchClaimRequests = async () => {
  try {
    const { data, error } = await supabase
      .from("claim_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching claim requests:", error);
    return [];
  }
};

export const fetchUserClaimRequests = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("claim_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching user claim requests:", error);
    return [];
  }
};

export const markClaimRequest = async (
  requestId: string,
  status: "approved" | "rejected"
) => {
  try {
    // Get the request details
    const { data: request, error: fetchError } = await supabase
      .from("claim_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError) throw fetchError;

    // Update request status
    const { data: updateData, error: updateError } = await supabase
      .from("claim_requests")
      .update({ status: status })
      .eq("id", requestId)
      .select();

    if (updateError) {
      console.error("Error updating claim request status:", updateError);
      throw updateError;
    }

    console.log("Claim request updated:", updateData);

    // Only update shop and user if approved
    if (status === "approved") {
      // Update shop to mark as claimed
      const { error: shopError } = await supabase
        .from("shops")
        .update({
          is_claimed: true,
          claimed_by: request.user_id,
        })
        .eq("id", request.shop_id);

      if (shopError) throw shopError;

      // Update user to business owner
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_business_owner: true })
        .eq("id", request.user_id);

      if (profileError) throw profileError;
    }

    return { success: true };
  } catch (error) {
    console.error("Error marking claim request:", error);
    return { success: false, error };
  }
};

// ============================================
// EVENTS
// ============================================

export const fetchEvents = async () => {
  try {
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("start_date_time", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
};

export const createEvent = async (eventData: {
  shop_id: string;
  title: string;
  description?: string;
  event_type: string;
  start_date_time: string;
  end_date_time: string;
  location?: string;
  ticket_link?: string;
  cover_image_url?: string;
  is_published?: boolean;
}) => {
  try {
    const { data, error } = await supabase
      .from("calendar_events")
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error };
  }
};

export const updateEvent = async (eventId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from("calendar_events")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error };
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error };
  }
};
