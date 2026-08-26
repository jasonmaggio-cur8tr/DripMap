// Country name → emoji flag for the Discover card meta line.
// Data stores free-text country names ("USA", "United States", "Indonesia"…),
// so normalize common names to ISO-3166 alpha-2, then build the emoji from
// regional indicator symbols. Unknown countries return null (no flag shown).

const NAME_TO_ISO2: Record<string, string> = {
  'usa': 'US', 'us': 'US', 'united states': 'US', 'united states of america': 'US',
  'canada': 'CA', 'mexico': 'MX', 'brazil': 'BR', 'colombia': 'CO', 'peru': 'PE',
  'argentina': 'AR', 'chile': 'CL', 'guatemala': 'GT', 'costa rica': 'CR',
  'uk': 'GB', 'united kingdom': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB',
  'ireland': 'IE', 'france': 'FR', 'italy': 'IT', 'spain': 'ES', 'portugal': 'PT',
  'germany': 'DE', 'netherlands': 'NL', 'belgium': 'BE', 'switzerland': 'CH',
  'austria': 'AT', 'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK', 'finland': 'FI',
  'iceland': 'IS', 'greece': 'GR', 'turkey': 'TR', 'poland': 'PL', 'czech republic': 'CZ',
  'czechia': 'CZ', 'hungary': 'HU', 'croatia': 'HR', 'ukraine': 'UA',
  'australia': 'AU', 'new zealand': 'NZ',
  'japan': 'JP', 'south korea': 'KR', 'korea': 'KR', 'china': 'CN', 'taiwan': 'TW',
  'hong kong': 'HK', 'singapore': 'SG', 'malaysia': 'MY', 'indonesia': 'ID',
  'thailand': 'TH', 'vietnam': 'VN', 'philippines': 'PH', 'india': 'IN',
  'uae': 'AE', 'united arab emirates': 'AE', 'israel': 'IL', 'saudi arabia': 'SA',
  'egypt': 'EG', 'morocco': 'MA', 'south africa': 'ZA', 'kenya': 'KE', 'ethiopia': 'ET',
};

export function countryFlag(country?: string | null): string | null {
  if (!country) return null;
  const trimmed = country.trim();
  if (!trimmed) return null;
  // Accept a bare ISO2 code, else look up the normalized name.
  const iso2 =
    /^[A-Za-z]{2}$/.test(trimmed) && trimmed.toLowerCase() !== 'uk'
      ? trimmed.toUpperCase()
      : NAME_TO_ISO2[trimmed.toLowerCase()];
  if (!iso2) return null;
  const base = 0x1f1e6; // regional indicator 'A'
  return String.fromCodePoint(
    base + iso2.charCodeAt(0) - 65,
    base + iso2.charCodeAt(1) - 65
  );
}
