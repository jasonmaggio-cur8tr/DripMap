
import { Shop, Vibe } from './types';

export const ALL_VIBES: Vibe[] = [
  Vibe.COZY,
  Vibe.LAPTOP_FRIENDLY,
  Vibe.FAST_WIFI,
  Vibe.MATCHA,
  Vibe.SPECIALTY,
  Vibe.OUTDOOR_SEATING,
  Vibe.MINIMALIST,
  Vibe.AESTHETIC,
  Vibe.PLANTS,
  Vibe.LATTE_ART,
  Vibe.QUIET,
];

export const CHEEKY_VIBES_OPTIONS = [
  "Bring Your Dog",
  "WFC (Work From Coffee) Friendly",
  "Yummy Treats",
  "Bring your feral kids",
  "Dress To Impress",
  "Wear whatever",
  "1/4 Zips and Matcha vibes",
  "First Date Safe",
  "Main Character Energy"
];

// Helper to migrate old string images to new structure quickly
const toGallery = (urls: string[]): { url: string; type: 'owner' | 'community' }[] => {
  return urls.map(url => ({ url, type: 'owner' }));
};

// Simulated "Scraped" Data for the MVP
export const INITIAL_SHOPS: Shop[] = [
  {
    id: '1',
    name: 'Sey Coffee',
    description: 'A bright, airy Scandinavian-style roastery in Bushwick. Known for some of the most exquisite light roasts in the world and a stunning skylit interior.',
    location: {
      lat: 40.7052,
      lng: -73.9335,
      address: '18 Grattan St',
      city: 'Brooklyn',
      state: 'NY'
    },
    gallery: [
      { url: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80', type: 'owner' },
      { url: 'https://images.unsplash.com/photo-1500353391678-d7b57970d9a5?auto=format&fit=crop&w=800&q=80', type: 'community' },
      { url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80', type: 'community' }
    ],
    vibes: [Vibe.MINIMALIST, Vibe.SPECIALTY, Vibe.PLANTS],
    cheekyVibes: ["WFC (Work From Coffee) Friendly", "Wear whatever", "Main Character Energy"],
    rating: 4.9,
    reviewCount: 342,
    reviews: [],
    isClaimed: false,
    stampCount: 842
  },
  {
    id: '2',
    name: 'Devoción',
    description: 'Farm-to-table coffee in a massive industrial space with a living plant wall. The beans are flown in from Colombia just days after harvest.',
    location: {
      lat: 40.7160,
      lng: -73.9645,
      address: '69 Grand St',
      city: 'Brooklyn',
      state: 'NY'
    },
    gallery: [
        { url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80', type: 'owner' },
        { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', type: 'community' },
        { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', type: 'community' }
    ],
    vibes: [Vibe.PLANTS, Vibe.COZY, Vibe.SPECIALTY],
    cheekyVibes: ["Bring Your Dog", "First Date Safe"],
    rating: 4.8,
    reviewCount: 890,
    reviews: [],
    isClaimed: false,
    stampCount: 1250
  },
  {
    id: '3',
    name: 'Cha Cha Matcha',
    description: 'The pink and green aesthetic dream. Famous for creative matcha lattes, soft serve, and being the ultimate Instagram spot.',
    location: {
      lat: 40.7248,
      lng: -73.9925,
      address: '327 Lafayette St',
      city: 'New York',
      state: 'NY'
    },
    gallery: [
        { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80', type: 'owner' },
        { url: 'https://images.unsplash.com/photo-1529667238621-a00c3a2534d5?auto=format&fit=crop&w=800&q=80', type: 'community' }
    ],
    vibes: [Vibe.MATCHA, Vibe.AESTHETIC, Vibe.LATTE_ART],
    cheekyVibes: ["Dress To Impress", "1/4 Zips and Matcha vibes", "Yummy Treats"],
    rating: 4.5,
    reviewCount: 1205,
    reviews: [],
    isClaimed: false,
    stampCount: 3400
  },
  {
    id: '4',
    name: 'Felix Roasting Co.',
    description: 'Opulent, maximalist design meets serious coffee science. Come for the hickory-smoked s\'mores latte, stay for the incredible decor.',
    location: {
      lat: 40.7432,
      lng: -73.9868,
      address: '450 Park Ave S',
      city: 'New York',
      state: 'NY'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.AESTHETIC, Vibe.SPECIALTY, Vibe.LATTE_ART],
    cheekyVibes: ["Dress To Impress", "Main Character Energy"],
    rating: 4.7,
    reviewCount: 412,
    reviews: [],
    isClaimed: false,
    stampCount: 670
  },
  {
    id: '5',
    name: 'La Cabra',
    description: 'Danish bakery and roastery bringing Nordic minimalism to NYC. Incredible cardamom buns and delicate hand-pours.',
    location: {
      lat: 40.7295,
      lng: -73.9895,
      address: '152 2nd Ave',
      city: 'New York',
      state: 'NY'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.MINIMALIST, Vibe.SPECIALTY, Vibe.COZY],
    cheekyVibes: ["Yummy Treats", "WFC (Work From Coffee) Friendly"],
    rating: 4.6,
    reviewCount: 289,
    reviews: [],
    isClaimed: false,
    stampCount: 450
  },
  {
    id: '6',
    name: 'Sightglass Coffee',
    description: 'A bi-level warehouse in SoMa that lets you watch the roasting process while you sip. High ceilings and an open coffee bar.',
    location: {
      lat: 37.7775,
      lng: -122.4084,
      address: '270 7th St',
      city: 'San Francisco',
      state: 'CA'
    },
    gallery: [
        { url: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=800&q=80', type: 'owner' },
        { url: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&q=80', type: 'community' }
    ],
    vibes: [Vibe.AESTHETIC, Vibe.LAPTOP_FRIENDLY, Vibe.SPECIALTY],
    cheekyVibes: ["WFC (Work From Coffee) Friendly", "1/4 Zips and Matcha vibes"],
    rating: 4.7,
    reviewCount: 950,
    reviews: [],
    isClaimed: false,
    stampCount: 1890
  },
  {
    id: '7',
    name: 'Saint Frank Coffee',
    description: 'Bright, clean, and heavily focused on producer relationships. Their "Little Brother" blend is a local favorite.',
    location: {
      lat: 37.7958,
      lng: -122.4222,
      address: '2340 Polk St',
      city: 'San Francisco',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1507133750069-69d3cdad863a?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.MINIMALIST, Vibe.SPECIALTY, Vibe.QUIET],
    cheekyVibes: ["Wear whatever", "WFC (Work From Coffee) Friendly"],
    rating: 4.8,
    reviewCount: 480,
    reviews: [],
    isClaimed: false,
    stampCount: 560
  },
  {
    id: '8',
    name: 'The Mill',
    description: 'A collaboration between Four Barrel Coffee and Josey Baker Bread. Famous for $4 toast that is actually worth it and impeccable espresso.',
    location: {
      lat: 37.7764,
      lng: -122.4378,
      address: '736 Divisadero St',
      city: 'San Francisco',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.COZY, Vibe.AESTHETIC],
    cheekyVibes: ["Yummy Treats", "Bring your feral kids"],
    rating: 4.6,
    reviewCount: 1100,
    reviews: [],
    isClaimed: false,
    stampCount: 2100
  },
  {
    id: '9',
    name: 'Stonemill Matcha',
    description: 'Authentic Japanese matcha cafe in the Mission. Features stone-ground matcha and decadent katsu sandos.',
    location: {
      lat: 37.7636,
      lng: -122.4216,
      address: '561 Valencia St',
      city: 'San Francisco',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1515823664-dd025908f8bb?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.MATCHA, Vibe.SPECIALTY, Vibe.AESTHETIC],
    cheekyVibes: ["Yummy Treats", "1/4 Zips and Matcha vibes"],
    rating: 4.7,
    reviewCount: 620,
    reviews: [],
    isClaimed: false,
    stampCount: 980
  },
  {
    id: '10',
    name: 'Go Get Em Tiger',
    description: 'L.A. staple known for its vibrant community vibe and the "Business & Pleasure" flight. Casual yet precise.',
    location: {
      lat: 34.0617,
      lng: -118.3271,
      address: '230 N Larchmont Blvd',
      city: 'Los Angeles',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1522992319-0365e5f11656?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.OUTDOOR_SEATING, Vibe.LATTE_ART, Vibe.SPECIALTY],
    cheekyVibes: ["Bring Your Dog", "Wear whatever"],
    rating: 4.8,
    reviewCount: 750,
    reviews: [],
    isClaimed: false,
    stampCount: 1100
  },
  {
    id: '11',
    name: 'Maru Coffee',
    description: 'Extremely minimalist aesthetic with a focus on slow coffee and mindfulness. The Cream Top is a must-try.',
    location: {
      lat: 34.1117,
      lng: -118.2925,
      address: '1936 Hillhurst Ave',
      city: 'Los Angeles',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.MINIMALIST, Vibe.AESTHETIC, Vibe.QUIET],
    cheekyVibes: ["Dress To Impress", "WFC (Work From Coffee) Friendly"],
    rating: 4.8,
    reviewCount: 390,
    reviews: [],
    isClaimed: false,
    stampCount: 540
  },
  {
    id: '12',
    name: 'Alfred Coffee',
    description: 'But first, coffee. The place to be seen in Melrose Place. Iconic floral wallpapers and solid vanilla lattes.',
    location: {
      lat: 34.0836,
      lng: -118.3734,
      address: '8428 Melrose Pl',
      city: 'Los Angeles',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1462206092226-f46025ffe607?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.AESTHETIC, Vibe.LATTE_ART, Vibe.OUTDOOR_SEATING],
    cheekyVibes: ["Main Character Energy", "Dress To Impress"],
    rating: 4.5,
    reviewCount: 2100,
    reviews: [],
    isClaimed: false,
    stampCount: 4200
  },
  {
    id: '13',
    name: 'Verve Coffee Roasters',
    description: 'Santa Cruz roots with an LA polish. Beautiful outdoor patios and consistently excellent pour-overs.',
    location: {
      lat: 34.0393,
      lng: -118.2625,
      address: '833 S Spring St',
      city: 'Los Angeles',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1554143225-05c665eb629b?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.OUTDOOR_SEATING, Vibe.PLANTS, Vibe.LAPTOP_FRIENDLY],
    cheekyVibes: ["WFC (Work From Coffee) Friendly", "Bring Your Dog"],
    rating: 4.6,
    reviewCount: 880,
    reviews: [],
    isClaimed: false,
    stampCount: 950
  },
  {
    id: '14',
    name: 'Starbucks Reserve Roastery',
    description: 'The "Willy Wonka" factory of coffee. Massive copper casks, siphon bars, and exclusive roasts you can\'t get anywhere else.',
    location: {
      lat: 47.6140,
      lng: -122.3280,
      address: '1124 Pike St',
      city: 'Seattle',
      state: 'WA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.AESTHETIC, Vibe.SPECIALTY],
    cheekyVibes: ["Yummy Treats", "Main Character Energy"],
    rating: 4.7,
    reviewCount: 5400,
    reviews: [],
    isClaimed: false,
    stampCount: 8500
  },
  {
    id: '15',
    name: 'Espresso Vivace',
    description: 'Legendary Seattle spot credited with popularizing latte art in the US. Known for their Northern Italian roast style.',
    location: {
      lat: 47.6216,
      lng: -122.3213,
      address: '532 Broadway E',
      city: 'Seattle',
      state: 'WA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1514432324607-b08763b5bc16?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.COZY, Vibe.SPECIALTY, Vibe.LATTE_ART],
    cheekyVibes: ["WFC (Work From Coffee) Friendly", "Wear whatever"],
    rating: 4.8,
    reviewCount: 1300,
    reviews: [],
    isClaimed: false,
    stampCount: 1800
  },
  {
    id: '16',
    name: 'Stumptown Coffee',
    description: 'The Ace Hotel location is iconic. Dark wood, comfy couches, and the cold brew that started a revolution.',
    location: {
      lat: 45.5226,
      lng: -122.6830,
      address: '1022 SW Stark St',
      city: 'Portland',
      state: 'OR'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.COZY, Vibe.SPECIALTY, Vibe.LAPTOP_FRIENDLY],
    cheekyVibes: ["WFC (Work From Coffee) Friendly", "Bring your feral kids"],
    rating: 4.7,
    reviewCount: 1500,
    reviews: [],
    isClaimed: false,
    stampCount: 2400
  },
  {
    id: '17',
    name: 'Coava Coffee',
    description: 'Industrial chic in a shared space with a woodworking shop. Focusing on single-origin coffees and metal filters.',
    location: {
      lat: 45.5170,
      lng: -122.6590,
      address: '1300 SE Grand Ave',
      city: 'Portland',
      state: 'OR'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.MINIMALIST, Vibe.SPECIALTY],
    cheekyVibes: ["Wear whatever", "WFC (Work From Coffee) Friendly"],
    rating: 4.8,
    reviewCount: 920,
    reviews: [],
    isClaimed: false,
    stampCount: 1050
  },
  {
    id: '18',
    name: 'Monmouth Coffee',
    description: 'A London institution near Borough Market. Expect a queue, but the filter coffee and pastries are worth the wait.',
    location: {
      lat: 51.5049,
      lng: -0.0918,
      address: '2 Park St',
      city: 'London',
      state: 'UK'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.COZY, Vibe.SPECIALTY],
    cheekyVibes: ["Yummy Treats", "Wear whatever"],
    rating: 4.7,
    reviewCount: 2300,
    reviews: [],
    isClaimed: false,
    stampCount: 5600
  },
  {
    id: '19',
    name: 'Prufrock Coffee',
    description: 'A mecca for coffee geeks in London. Home to barista champions and extensive brewing workshops.',
    location: {
      lat: 51.5198,
      lng: -0.1084,
      address: '23-25 Leather Ln',
      city: 'London',
      state: 'UK'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1529667238621-a00c3a2534d5?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.SPECIALTY, Vibe.LAPTOP_FRIENDLY, Vibe.MINIMALIST],
    cheekyVibes: ["WFC (Work From Coffee) Friendly", "1/4 Zips and Matcha vibes"],
    rating: 4.8,
    reviewCount: 650,
    reviews: [],
    isClaimed: false,
    stampCount: 980
  },
  {
    id: '20',
    name: '% Arabica',
    description: 'Iconic Kyoto coffee stand right on the river. Stunning views, sleek design, and world-class latte art.',
    location: {
      lat: 35.0034,
      lng: 135.7716,
      address: '87-5 Hoshinocho',
      city: 'Kyoto',
      state: 'JP'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1511537632536-b74c2a6eae92?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.MINIMALIST, Vibe.AESTHETIC, Vibe.LATTE_ART],
    cheekyVibes: ["Main Character Energy", "First Date Safe"],
    rating: 4.7,
    reviewCount: 1800,
    reviews: [],
    isClaimed: false,
    stampCount: 4100
  },
  // SACRAMENTO SHOPS
  {
    id: '21',
    name: 'Temple Coffee Roasters',
    description: 'Sacramento\'s crown jewel on K Street. Known for their impeccable farm-to-cup sourcing and a space that feels like a coffee sanctuary with its penny floor.',
    location: {
      lat: 38.5744,
      lng: -121.4785,
      address: '2200 K St',
      city: 'Sacramento',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.AESTHETIC, Vibe.SPECIALTY, Vibe.LATTE_ART],
    cheekyVibes: ["WFC (Work From Coffee) Friendly", "First Date Safe"],
    rating: 4.9,
    reviewCount: 1120,
    reviews: [],
    isClaimed: false,
    stampCount: 2200
  },
  {
    id: '22',
    name: 'The Mill',
    description: 'A beloved neighborhood spot in Midtown. Minimalist decor, house-made almond milk, and incredible liege waffles that are a local secret.',
    location: {
      lat: 38.5735,
      lng: -121.4832,
      address: '1827 I St',
      city: 'Sacramento',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.COZY, Vibe.MINIMALIST, Vibe.OUTDOOR_SEATING],
    cheekyVibes: ["Yummy Treats", "Bring Your Dog"],
    rating: 4.7,
    reviewCount: 450,
    reviews: [],
    isClaimed: false,
    stampCount: 650
  },
  {
    id: '23',
    name: 'Chocolate Fish Coffee Roasters',
    description: 'Award-winning roasters focused on sustainability and approachability. Their East Sac cafe features a lovely patio perfect for sunny days.',
    location: {
      lat: 38.5636,
      lng: -121.4412,
      address: '4749 Folsom Blvd',
      city: 'Sacramento',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.SPECIALTY, Vibe.OUTDOOR_SEATING, Vibe.PLANTS],
    cheekyVibes: ["Bring Your Dog", "Bring your feral kids"],
    rating: 4.8,
    reviewCount: 600,
    reviews: [],
    isClaimed: false,
    stampCount: 780
  },
  {
    id: '24',
    name: 'Old Soul Co.',
    description: 'Tucked away in a rear alley, this spot offers a gritty, industrial vibe with exposed brick, high ceilings, and fresh baked bread.',
    location: {
      lat: 38.5738,
      lng: -121.4826,
      address: '1716 L St (Rear Alley)',
      city: 'Sacramento',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.COZY, Vibe.LAPTOP_FRIENDLY, Vibe.PLANTS],
    cheekyVibes: ["WFC (Work From Coffee) Friendly", "Yummy Treats", "Wear whatever"],
    rating: 4.6,
    reviewCount: 980,
    reviews: [],
    isClaimed: false,
    stampCount: 1340
  },
  {
    id: '25',
    name: 'Camellia Coffee Roasters',
    description: 'Playful, bright, and pink. Serving vibrant coffees and arguably the best breakfast sandwich in the grid.',
    location: {
      lat: 38.5655,
      lng: -121.4919,
      address: '1200 R St',
      city: 'Sacramento',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1529667238621-a00c3a2534d5?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.AESTHETIC, Vibe.MATCHA, Vibe.OUTDOOR_SEATING],
    cheekyVibes: ["Yummy Treats", "Main Character Energy"],
    rating: 4.8,
    reviewCount: 320,
    reviews: [],
    isClaimed: false,
    stampCount: 560
  },
  {
    id: '26',
    name: 'Pachamama Coffee',
    description: 'Farmer-owned and completely organic. A community hub that connects you directly to the source of your beans.',
    location: {
      lat: 38.5750,
      lng: -121.4710,
      address: '919 20th St',
      city: 'Sacramento',
      state: 'CA'
    },
    gallery: toGallery(['https://images.unsplash.com/photo-1507133750069-69d3cdad863a?auto=format&fit=crop&w=800&q=80']),
    vibes: [Vibe.SPECIALTY, Vibe.LAPTOP_FRIENDLY, Vibe.QUIET],
    cheekyVibes: ["WFC (Work From Coffee) Friendly", "Bring Your Dog"],
    rating: 4.7,
    reviewCount: 410,
    reviews: [],
    isClaimed: false,
    stampCount: 420
  }
];
