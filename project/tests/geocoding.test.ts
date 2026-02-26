import { expect, describe, it, beforeEach, jest } from '@jest/globals';
import { reverseGeocode, extractNeighborhoodString, getPrivateSafeNeighborhood, GeocodingResult } from '../src/utils/geocoding';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Geocoding Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reverseGeocode', () => {
    it('should return geocoding result for valid coordinates', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              properties: {
                name: 'Brooklyn',
                city: 'New York',
                state: 'New York',
                country: 'United States',
                countrycode: 'us',
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await reverseGeocode(40.6782, -73.9442);

      expect(result.neighborhood).toBe('Brooklyn');
      expect(result.city).toBe('New York');
      expect(result.state).toBe('New York');
      expect(result.country).toBe('United States');
      expect(result.countryCode).toBe('US');
    });

    it('should make correct API call with parameters', async () => {
      mockedAxios.get.mockResolvedValue({ data: { features: [] } });

      await reverseGeocode(51.5074, -0.1278);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/reverse'),
        expect.objectContaining({
          params: expect.objectContaining({
            lat: 51.5074,
            lon: -0.1278,
            limit: 1,
            lang: 'en',
          }),
        })
      );
    });

    it('should return empty object on no features', async () => {
      mockedAxios.get.mockResolvedValue({ data: { features: [] } });

      const result = await reverseGeocode(0, 0);

      expect(result).toEqual({});
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await reverseGeocode(0, 0);

      expect(result).toEqual({});
    });

    it('should handle missing properties', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              properties: {
                // Only provide some properties
                city: 'London',
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await reverseGeocode(51.5074, -0.1278);

      expect(result.city).toBe('London');
      expect(result.neighborhood).toBeUndefined();
      expect(result.country).toBeUndefined();
    });

    it('should handle uppercase conversion for country code', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              properties: {
                countrycode: 'gb',
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await reverseGeocode(51.5074, -0.1278);

      expect(result.countryCode).toBe('GB');
    });
  });

  describe('extractNeighborhoodString', () => {
    it('should extract neighborhood and city', () => {
      const result: GeocodingResult = {
        neighborhood: 'SoHo',
        city: 'New York',
        state: 'New York',
        country: 'United States',
      };

      const str = extractNeighborhoodString(result);

      expect(str).toBe('SoHo, New York');
    });

    it('should handle missing neighborhood', () => {
      const result: GeocodingResult = {
        city: 'Paris',
        country: 'France',
      };

      const str = extractNeighborhoodString(result);

      expect(str).toBe('Paris, France');
    });

    it('should limit to 2 parts for privacy', () => {
      const result: GeocodingResult = {
        neighborhood: 'Marina',
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
      };

      const str = extractNeighborhoodString(result);

      expect(str.split(',').length).toBe(2);
      expect(str).toBe('Marina, San Francisco');
    });

    it('should return empty string for empty result', () => {
      const result: GeocodingResult = {};

      const str = extractNeighborhoodString(result);

      expect(str).toBe('');
    });

    it('should handle single property', () => {
      const result: GeocodingResult = {
        country: 'Canada',
      };

      const str = extractNeighborhoodString(result);

      expect(str).toBe('Canada');
    });

    it('should not expose exact coordinates (privacy check)', () => {
      const result: GeocodingResult = {
        neighborhood: 'Downtown',
        city: 'Seattle',
        country: 'United States',
      };

      const str = extractNeighborhoodString(result);

      // Should not contain any coordinates
      expect(str).not.toMatch(/\d+\.\d+/);
    });
  });

  describe('getPrivateSafeNeighborhood', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should combine reverseGeocode and extractNeighborhoodString', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              properties: {
                name: 'Williamsburg',
                city: 'Brooklyn',
                state: 'New York',
                country: 'United States',
                countrycode: 'us',
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const neighborhood = await getPrivateSafeNeighborhood(40.7128, -74.006);

      expect(neighborhood).toBe('Williamsburg, Brooklyn');
    });

    it('should return privacy-safe string (max 2 parts)', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              properties: {
                name: 'Downtown',
                city: 'Los Angeles',
                state: 'California',
                country: 'United States',
                countrycode: 'us',
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const neighborhood = await getPrivateSafeNeighborhood(34.0522, -118.2437);

      expect(neighborhood.split(',').length).toBeLessThanOrEqual(2);
    });

    it('should handle API failure gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const neighborhood = await getPrivateSafeNeighborhood(0, 0);

      expect(neighborhood).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative latitude and longitude', async () => {
      mockedAxios.get.mockResolvedValue({ data: { features: [] } });

      await reverseGeocode(-33.8688, 151.2093); // Sydney

      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('should handle coordinates with many decimal places', async () => {
      mockedAxios.get.mockResolvedValue({ data: { features: [] } });

      await reverseGeocode(40.712776567, -74.0059731445);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            lat: 40.712776567,
            lon: -74.0059731445,
          }),
        })
      );
    });

    it('should handle international characters in neighborhood names', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              properties: {
                name: 'Châtelet',
                city: 'Paris',
                country: 'France',
                countrycode: 'fr',
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await reverseGeocode(48.8566, 2.3522);

      expect(result.neighborhood).toBe('Châtelet');
    });
  });
});
