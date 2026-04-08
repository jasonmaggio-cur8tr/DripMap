import { supabase } from '../lib/supabase';
import { AgentRun, ShopDraft, ShopDraftStatus, AgentRunMode } from '../types';

// ==================== API KEYS ====================
// In a real production app, these should be hidden behind an Edge Function.
// For this MVP/Admin tool, we accessed them from env variables.
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const SERPER_KEY = import.meta.env.VITE_SERPER_API_KEY;
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ==================== TYPES ====================

interface GooglePlaceResult {
    place_id: string;
    name: string;
    formatted_address: string;
    rating?: number;
    user_ratings_total?: number;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    photos?: {
        photo_reference: string;
        height: number;
        width: number;
    }[];
    website?: string;
    types?: string[];
}

// ==================== RUN MANAGEMENT ====================

export const createRun = async (mode: AgentRunMode, params: any): Promise<AgentRun | null> => {
    const { data, error } = await supabase
        .from('agent_runs')
        .insert({
            mode,
            status: 'RUNNING',
            input_params: params,
            metrics: { candidates_found: 0, drafted: 0, rejected: 0 }
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating run:', error);
        return null;
    }
    return data;
};

export const updateRunStatus = async (
    runId: string,
    status: 'COMPLETED' | 'FAILED',
    metrics?: any
) => {
    const updates: any = { status };
    if (metrics) updates.metrics = metrics;

    await supabase.from('agent_runs').update(updates).eq('id', runId);
};

// ==================== SOURCING (Gemini AI) ====================

/**
 * Search for shops using Gemini AI (cheaper alternative to Google Places API)
 */
export const searchGooglePlaces = async (city: string, keyword: string = 'specialty coffee'): Promise<any[]> => {
    // In a real app, strict check:
    // if (!GEMINI_KEY) { console.error('Missing Key'); return []; }

    // For MVP/Demo: Warn but proceed with Mock Data
    if (!GEMINI_KEY) {
        console.warn('[Curator] No VITE_GEMINI_API_KEY found. Using Mock Data.');
    }

    try {
        // We will use a mock implementation for now until the actual Gemini Client is connected
        // In a real implementation, you would call the Gemini API with a prompt like:
        // "Find 5 best specialty coffee shops in [City]. Return JSON with name, address, website."

        console.log(`[Curator] Scouting ${city} for ${keyword} using Gemini...`);

        // Simulating network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Return mock data for MVP verification (since we don't have the Gemini Client set up in this file yet)
        return [
            {
                place_id: `mock-${Date.now()}-1`,
                name: `${city} Coffee Works`,
                formatted_address: `123 Main St, ${city}`,
                geometry: { location: { lat: 37.7749, lng: -122.4194 } }, // Default SF coords for demo
                rating: 4.8,
                user_ratings_total: 120,
                website: 'https://example.com',
                opening_hours: {
                    periods: [
                        { open: { day: 0, time: "0800" }, close: { day: 0, time: "1800" } }, // Sunday
                        { open: { day: 1, time: "0700" }, close: { day: 1, time: "1900" } }, // Monday
                        { open: { day: 2, time: "0700" }, close: { day: 2, time: "1900" } }, // Tuesday
                        { open: { day: 3, time: "0700" }, close: { day: 3, time: "1900" } }, // Wednesday
                        { open: { day: 4, time: "0700" }, close: { day: 4, time: "1900" } }, // Thursday
                        { open: { day: 5, time: "0700" }, close: { day: 5, time: "1900" } }, // Friday
                        { open: { day: 6, time: "0800" }, close: { day: 6, time: "1800" } }, // Saturday
                    ]
                },
                photos: [
                    { photo_reference: "mock_ref_1", height: 1000, width: 1000 },
                    { photo_reference: "mock_ref_2", height: 1000, width: 1000 }
                ]
            },
            {
                place_id: `mock-${Date.now()}-2`,
                name: `The Daily Grind ${city}`,
                formatted_address: `456 Market St, ${city}`,
                geometry: { location: { lat: 37.7849, lng: -122.4094 } },
                rating: 4.5,
                user_ratings_total: 85,
                website: 'https://example.com',
                opening_hours: {
                    periods: [
                        { open: { day: 1, time: "0700" }, close: { day: 1, time: "1700" } },
                    ]
                },
                photos: [
                    { photo_reference: "mock_ref_3", height: 1000, width: 1000 },
                ]
            }
        ];

    } catch (error) {
        console.error('Failed to search with Gemini:', error);
        return [];
    }
};

/**
 * Get detailed place info 
 */
export const getPlaceDetails = async (placeId: string): Promise<any> => {
    // For Gemini-sourced data, we might already have the details or need a second prompt.
    // For MVP/Mock, simply return what we have.
    return {
        name: 'Mock Shop Details',
        formatted_address: '123 Mock Blvd',
        geometry: { location: { lat: 0, lng: 0 } },
        photos: []
    };
};

// ==================== SCORING (LLM) ====================

export const analyzeShopAesthetic = async (
    name: string,
    photoUrls: string[]
): Promise<{ score: number; vibeTags: string[]; reason: string }> => {
    // Mock LLM response if no key
    if (!GEMINI_KEY) {
        return {
            score: 85,
            vibeTags: ['Minimalist', 'Specialty', 'Laptop Friendly'],
            reason: '[MOCK] Key missing. Analyzing based on name: Sounds like a cool spot.'
        };
    }

    // TODO: Implement actual Gemini/OpenAI call here
    // For now returning high score to test flow
    return {
        score: 88,
        vibeTags: ['Industrial', 'Plants', 'Cozy'],
        reason: 'Good lighting and espresso machine visibility.'
    };
};

// ==================== DRAFTING ====================

export const createDraft = async (runId: string, placeData: any, scoreData: any) => {
    // Transform Google Place to Shop Draft

    // Mock parsing hours (Google Places -> DripMap format)
    // Simplify for MVP to generic str or basic map
    const openHours = {
        monday: '7:00 AM - 7:00 PM',
        tuesday: '7:00 AM - 7:00 PM',
        wednesday: '7:00 AM - 7:00 PM',
        thursday: '7:00 AM - 7:00 PM',
        friday: '7:00 AM - 7:00 PM',
        saturday: '8:00 AM - 6:00 PM',
        sunday: '8:00 AM - 6:00 PM',
    };

    // Images 
    // In real app, we'd fetch photo URLs. For mock, use Unsplash.
    const mockImages = [
        { url: `https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80`, type: 'owner', caption: 'Interior' },
        { url: `https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80`, type: 'owner', caption: 'Latte Art' },
        { url: `https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80`, type: 'owner', caption: 'Exterior' }
    ];

    const draftPayload = {
        name: placeData.name,
        description: `This is an auto-generated description for ${placeData.name}. It is known for its ${scoreData.vibeTags.join(', ')} vibes. Ideally, Gemini would write a 2-3 sentence summary here based on reviews and the website content.`,
        location: {
            address: placeData.formatted_address,
            lat: placeData.geometry.location.lat,
            lng: placeData.geometry.location.lng,
            city: 'Unknown', // Need parsing logic
            state: 'Unknown'
        },
        vibes: scoreData.vibeTags,
        rating: placeData.rating || 0,
        reviewCount: placeData.user_ratings_total || 0,
        websiteUrl: placeData.website,
        googlePlaceId: placeData.place_id,
        openHours: openHours,
        gallery: mockImages // Storing here in data jsonb for now
    };

    const { error } = await supabase.from('shop_drafts').insert({
        run_id: runId,
        status: 'PENDING_REVIEW',
        data: draftPayload,
        score: scoreData.score,
        score_breakdown: { reason: scoreData.reason },
        source_urls: [placeData.website || '']
    });

    if (error) console.error('Error saving draft:', error);
};
