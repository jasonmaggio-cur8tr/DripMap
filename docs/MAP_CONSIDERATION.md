# Map Provider Consideration: Mapbox vs. Google Maps vs. Leaflet

This document outlines the evaluation of migrating from the current Leaflet map implementation to a more robust provider like Mapbox or Google Maps, focusing on search quality, pricing, switch-over effort, and user experience.

## 1. Current State: Leaflet (Free/Open Source)
Currently, DripMap uses **Leaflet**. While Leaflet is lightweight and completely free, it has several limitations:
- **Search:** Out-of-the-box, it lacks a robust Places/POI (Points of Interest) search. You generally have to rely on free geocoders (like Nominatim) which are slow, strictly rate-limited, lack typo tolerance, and don't provide rich business data.
- **Experience:** Raster maps can feel clunky when zooming/panning compared to modern vector tiles.

## 2. Option A: Mapbox (Recommended)
Mapbox is a highly customizable geography platform optimized for modern, smooth web and mobile experiences.

**Search Product (Mapbox Search Box API):**
- Incredibly fast, with excellent typo tolerance and autocomplete.
- Rich POI data (though historically slightly less comprehensive for obscure small businesses than Google, it is still top-tier).
- Beautiful, out-of-the-box UI components for React.

**Pricing ("Pay-As-You-Go"):**
- **Map Loads:** 50,000 free map loads per month. 
- **Search/Geocoding:** 100,000 free requests per month.
- **After Free Tier:** Highly scalable and generally much more affordable than Google Maps for mid-to-high traffic applications. 

## 3. Option B: Google Maps Platform
Google Maps is the industry standard and offers the most comprehensive Places API.

**Search Product (Places API):**
- The absolute best POI database in the world. Unmatched for finding obscure or brand-new coffee shops.

**Pricing ("Pay-As-You-Go"):**
- **New Structure (As of March 2025):** The $200 free credit model has evolved into free usage caps per category.
- **Affordability:** Google Maps is notoriously expensive at scale. Simple autocomplete and place detail requests can quickly rack up costs if your user base grows.

## 4. Switch-Over Effort
Switching to either provider is a **moderate effort (1-3 days of developer time)**:
1. **Dependencies:** Remove Leaflet, install `@vis.gl/react-google-maps` or `react-map-gl` (for Mapbox).
2. **Component Rewrite:** Replace the Leaflet map component in `App.tsx`/dashboard with the new provider's component.
3. **Custom Styling:** Migrate your custom marker styles (the rotated coffee pin) to the new framework. Mapbox makes this natively very easy.
4. **Search Integration:** Rip out the current search mechanism and plug in Mapbox Search Box or Google Places Autocomplete.

## 5. Impact on Customer Experience
Migrating to a premium map provider will dramatically improve the app:
- **World-Class Search:** Users won't struggle to find a shop. Autocomplete will feel instant and native.
- **Fluid UI:** Vector-based maps (Mapbox) feel buttery smooth, highly detailed, and zoom seamlessly without loading gray grid squares.
- **Brand Identity:** Mapbox allows for deep, granular styling of the map tiles. You could literally style the streets and water to match DripMap's "Volt Green & Coffee" aesthetic seamlessly, creating a premium luxury feel.

## Conclusion 
**Mapbox is the ideal choice for DripMap.** It provides a superior, smooth user experience with powerful search, while offering a generous free tier that keeps initial costs at $0. Its customization capabilities perfectly align with building a beautiful, brand-rich application.
