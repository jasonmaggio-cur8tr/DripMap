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

    const { error } = await supabase.from("shop_images").insert(imageInserts);

    if (error) throw error;

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

// ==================== REVIEWS ====================

export const addReview = async (
  shopId: string,
  userId: string,
  rating: number,
  comment: string
) => {
  try {
    console.log("Adding review:", { shopId, userId, rating, comment });

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
      console.error("Error inserting review:", error);
      throw error;
    }

    console.log("Review inserted successfully:", data);

    // Calculate new average rating
    const { data: allReviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("rating")
      .eq("shop_id", shopId);

    if (reviewsError) {
      console.error(
        "Error fetching reviews for rating calculation:",
        reviewsError
      );
      throw reviewsError;
    }

    console.log("All reviews for shop:", allReviews);

    if (allReviews && allReviews.length > 0) {
      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      console.log(
        "Calculated average rating:",
        avgRating,
        "from",
        allReviews.length,
        "reviews"
      );

      // Update shop's rating and review count
      const { error: updateError } = await supabase
        .from("shops")
        .update({
          rating: avgRating,
          review_count: allReviews.length,
        })
        .eq("id", shopId);

      if (updateError) {
        console.error("Error updating shop rating:", updateError);
        throw updateError;
      }

      console.log("Shop rating updated successfully");
    }

    return { success: true, review: data };
  } catch (error) {
    console.error("Error adding review:", error);
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

      if (error) throw error;
    } else {
      // Add to visited
      const { error } = await supabase
        .from("visited_shops")
        .insert({ user_id: userId, shop_id: shopId });

      if (error) throw error;
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
    const { error: updateError } = await supabase
      .from("claim_requests")
      .update({ status: status })
      .eq("id", requestId);

    if (updateError) throw updateError;

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

    return { success: true };
  } catch (error) {
    console.error("Error approving claim request:", error);
    return { success: false, error };
  }
};
