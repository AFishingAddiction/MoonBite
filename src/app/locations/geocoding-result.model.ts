export interface GeocodingAddress {
  readonly name?: string;
  readonly county?: string;
  readonly state?: string;
  readonly country?: string;
  readonly countryCode?: string;
}

export interface GeocodingResult {
  readonly placeId: number;
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;
  readonly address: GeocodingAddress;
}

/** Raw shape returned by Nominatim /search API */
export interface NominatimAddress {
  readonly lake?: string;
  readonly city?: string;
  readonly town?: string;
  readonly village?: string;
  readonly hamlet?: string;
  readonly suburb?: string;
  readonly county?: string;
  readonly state?: string;
  readonly country?: string;
  readonly country_code?: string;
}

export interface NominatimResult {
  readonly place_id: number;
  readonly lat: string;
  readonly lon: string;
  readonly display_name: string;
  readonly address: NominatimAddress;
}

export function mapNominatimResult(raw: NominatimResult): GeocodingResult {
  const addr = raw.address;
  return {
    placeId: raw.place_id,
    latitude: parseFloat(raw.lat),
    longitude: parseFloat(raw.lon),
    displayName: raw.display_name,
    address: {
      name: addr.lake ?? addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? addr.suburb,
      county: addr.county,
      state: addr.state,
      country: addr.country,
      countryCode: addr.country_code,
    },
  };
}
