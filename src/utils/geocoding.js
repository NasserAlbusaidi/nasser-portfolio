/**
 * Reverse geocodes coordinates to get city and country.
 * Uses OpenStreetMap Nominatim API.
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @returns {Promise<{city: string, country: string}|null>} Location data or null
 */
export const reverseGeocode = async (lat, lng) => {
    if (!lat || !lng) return null;

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`,
            {
                headers: {
                    'User-Agent': 'NasserPortfolio/1.0' // Required by Nominatim usage policy
                }
            }
        );

        if (!response.ok) {
            throw new Error('Geocoding failed');
        }

        const data = await response.json();
        
        if (data.address) {
            // Nominatim returns different fields for "city" depending on location type
            const city = data.address.city || 
                        data.address.town || 
                        data.address.village || 
                        data.address.hamlet || 
                        data.address.suburb ||
                        data.address.county; // Fallback

            return {
                city: city || 'Unknown Location',
                state: data.address.state || '',
                country: data.address.country || ''
            };
        }

        return null;
    } catch (error) {
        console.warn("Reverse geocoding error:", error);
        return null;
    }
};
