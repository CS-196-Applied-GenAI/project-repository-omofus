import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const PHOTON_API_URL = process.env.PHOTON_API_URL || 'https://photon.komoot.io';

export interface GeocodingResult {
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
}

/**
 * Reverse geocode latitude and longitude to get neighborhood/locality
 * Uses OpenStreetMap Photon API
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
  try {
    const response = await axios.get(`${PHOTON_API_URL}/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        limit: 1,
        lang: 'en',
      },
    });

    if (response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      const properties = feature.properties;

      return {
        neighborhood: properties.name,
        city: properties.city,
        state: properties.state,
        country: properties.country,
        countryCode: properties.countrycode?.toUpperCase(),
      };
    }

    return {};
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    // Return empty object on error rather than throwing
    return {};
  }
}

/**
 * Extract neighborhood/locality string from geocoding result
 * IMPORTANT: Does NOT return exact coordinates for privacy
 */
export function extractNeighborhoodString(result: GeocodingResult): string {
  const parts = [];

  if (result.neighborhood) parts.push(result.neighborhood);
  if (result.city) parts.push(result.city);
  if (result.state) parts.push(result.state);
  if (result.country) parts.push(result.country);

  return parts.slice(0, 2).join(', '); // Return at most 2 parts for privacy
}

/**
 * Full reverse geocoding with privacy-safe neighborhood extraction
 */
export async function getPrivateSafeNeighborhood(
  latitude: number,
  longitude: number
): Promise<string> {
  const result = await reverseGeocode(latitude, longitude);
  return extractNeighborhoodString(result);
}
