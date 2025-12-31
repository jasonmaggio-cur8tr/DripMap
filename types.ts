
export enum Vibe {
  COZY = 'Cozy',
  LAPTOP_FRIENDLY = 'Laptop Friendly',
  FAST_WIFI = 'Fast Wifi',
  MATCHA = 'Matcha',
  SPECIALTY = 'Specialty',
  OUTDOOR_SEATING = 'Outdoor',
  MINIMALIST = 'Minimalist',
  AESTHETIC = 'Aesthetic',
  PLANTS = 'Plants',
  LATTE_ART = 'Latte Art',
  QUIET = 'Quiet',
}

// PRO Feature Types
export enum EventType {
  TASTING = 'Tasting',
  MUSIC = 'Music',
  WORKSHOP = 'Workshop',
  POPUP = 'Pop-up',
  COMMUNITY = 'Community',
  ACTIVE = 'Active',
  OTHER = 'Other',
}

export interface CalendarEvent {
  id: string;
  shopId: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime?: string;
  allDay: boolean;
  locationName?: string;
  addressOverride?: string;
  eventType: EventType;
  coverImage?: {
    url: string;
    fileName: string;
    mimeType: string;
  };
  ticketUrl?: string;
  isPublished: boolean;
  createdBy: 'admin' | 'owner';
  createdAt: string;
}

export interface BrewItem {
  id: string;
  type: 'Espresso' | 'Pour Over' | 'Drip' | 'Cold Brew';
  roaster: string;
  beanName: string;
  notes: string;
}

export interface HappeningNowStatus {
  id: string;
  title: string;
  message: string;
  sticker?: string;
  expiresAt: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface Barista {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
}

export interface PlantMilkInfo {
  type: 'Almond' | 'Oat' | 'Soy' | 'Cashew' | 'Hemp' | 'Watermelon' | 'Other';
  customType?: string;
  brand?: string;
}

export interface Campaign {
  id: string;
  shopId: string;
  shopName: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  days: number;
  totalCost: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  country?: string;
}

export interface ShopImage {
  url: string;
  type: 'owner' | 'community';
  caption?: string;
}

export interface OpenHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  location: Location;
  gallery: ShopImage[];
  vibes: Vibe[];
  cheekyVibes: string[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
  isClaimed: boolean;
  claimedBy?: string;
  stampCount: number;
  openHours?: OpenHours;

  // PRO Feature Fields
  brandId?: string;
  locationName?: string;
  customVibes?: string[];
  spotifyPlaylistUrl?: string;
  websiteUrl?: string;
  mapsUrl?: string;
  onlineOrderUrl?: string;
  happeningNow?: HappeningNowStatus;
  currentMenu?: BrewItem[];
  sourcingInfo?: string;
  espressoMachine?: string;
  grinderDetails?: string;
  brewingMethods?: string[];
  baristas?: Barista[];
  specialtyDrinks?: { name: string; desc: string }[];
  veganFoodOptions?: boolean;
  plantMilks?: PlantMilkInfo[];

  // Subscription fields (public)
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  proPlusDiscountEnabled?: boolean;
  subscriptionCurrentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string;

  // Stripe IDs (internal use only - not sent to general API responses)
  // These are only populated when specifically needed (e.g., billing management)
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface SocialLinks {
  instagram?: string;
  x?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  socialLinks?: SocialLinks;
  isBusinessOwner: boolean;
  isAdmin?: boolean;
  isPro?: boolean;
  savedShops: string[];
  visitedShops: string[];
  followerIds?: string[];
  followingIds?: string[];

  // DripClub membership fields
  isDripClubMember?: boolean;
  dripClubMemberSince?: string;
}

export interface ClaimRequest {
  id: string;
  shopId: string;
  userId: string;
  businessEmail: string;
  role: string;
  socialLink: string; // Updated from proofMessage
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

// =====================================================
// Subscription Types (FEAT-014 & FEAT-015)
// =====================================================

export type SubscriptionTier = 'free' | 'pro' | 'pro_plus';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'inactive';
export type BillingInterval = 'monthly' | 'annual';

export interface ShopSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  proPlusDiscountEnabled: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
}

export interface DripClubMembership {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  planType: BillingInterval;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPrice {
  id: string; // Stripe price ID
  productType: 'shop_pro' | 'shop_pro_plus' | 'dripclub';
  billingInterval: BillingInterval;
  amount: number; // in cents
  currency: string;
  active: boolean;
}

export interface CheckoutSessionRequest {
  priceId: string;
  shopId?: string; // For shop subscriptions
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionPricing {
  shopPro: {
    monthly: { amount: number; priceId: string };
    annual: { amount: number; priceId: string; savings: number };
  };
  shopProPlus: {
    monthly: { amount: number; priceId: string };
    annual: { amount: number; priceId: string; savings: number };
  };
  dripClub: {
    monthly: { amount: number; priceId: string };
    annual: { amount: number; priceId: string; savings: number };
  };
}

// Default pricing (in cents) - matches the existing PricingModal values
export const DEFAULT_PRICING: SubscriptionPricing = {
  shopPro: {
    monthly: { amount: 2888, priceId: '' }, // $28.88
    annual: { amount: 29888, priceId: '', savings: 4768 }, // $298.88, saves $47.68
  },
  shopProPlus: {
    monthly: { amount: 4888, priceId: '' }, // $48.88
    annual: { amount: 49888, priceId: '', savings: 9668 }, // $498.88, saves $96.68
  },
  dripClub: {
    monthly: { amount: 888, priceId: '' }, // $8.88
    annual: { amount: 8888, priceId: '', savings: 1768 }, // $88.88, saves $17.68
  },
};
