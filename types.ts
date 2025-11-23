
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
  gallery: ShopImage[]; // Replaces simple string[]
  vibes: Vibe[];
  cheekyVibes: string[]; // New "Vibe Check" list
  rating: number;
  reviewCount: number;
  reviews: Review[];
  isClaimed: boolean; 
  claimedBy?: string;
  stampCount: number; // New: How many users have this in their passport
  openHours?: OpenHours; // New: Opening hours
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
  bio?: string; // New bio field
  socialLinks?: SocialLinks; // New social links
  isBusinessOwner: boolean;
  isAdmin?: boolean; // Platform admin role
  savedShops: string[];
  visitedShops: string[]; // New field for tracking check-ins
  followerIds?: string[]; // IDs of users who follow this user
  followingIds?: string[]; // IDs of users this user follows
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
