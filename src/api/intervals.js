/**
 * Fetches activities from Intervals.icu API
 * @param {string} athleteId 
 * @param {string} apiKey 
 * @param {string} afterDate - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Array>}
 */
export const fetchActivities = async (athleteId, apiKey, afterDate) => {
  const auth = btoa(`API_KEY:${apiKey}`);
  const url = `https://intervals.icu/api/v1/athlete/${athleteId}/activities?oldest=${afterDate}&limit=200`; // Limit to avoid overwhelming

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (!response.ok) {
      throw new Error(`Intervals.icu API Error: ${response.status} ${response.statusText}`);
    }
    // console.log(await response.json());
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch from Intervals.icu:", error);
    throw error;
  }
};

/**
 * Processes raw activities into application format
 * @param {Array} activities 
 * @returns {Array}
 */
export const processActivities = (activities) => {
  const ALLOWED_TYPES = ['Ride', 'Run', 'Swim', 'WeightTraining'];

  return activities
    .filter(activity => ALLOWED_TYPES.includes(activity.type))
    .map(activity => {
      // Map Intervals types to our app types
      let activityType = 'run';
      if (activity.type === 'Ride') activityType = 'bike';
      if (activity.type === 'Swim') activityType = 'swim';
      if (activity.type === 'WeightTraining') activityType = 'workout';

      // Convert distance from meters to km
      const distanceKm = (activity.distance / 1000).toFixed(2);

      // Convert duration from seconds to minutes
      const durationMin = Math.round(activity.moving_time / 60);

      return {
        externalId: String(activity.id),
        activityType,
        distance: distanceKm,
        duration: durationMin,
        date: activity.start_date_local.split('T')[0], // YYYY-MM-DD
        description: activity.name,
        source: 'intervals.icu',
        // Additional detailed metrics
        avgHeartRate: activity.average_heartrate || null,
        maxPower: activity.max_watts || null,
        avgSpeed: activity.average_speed || null,
      };
    });
};

/**
 * Fetches map data for a specific activity from Intervals.icu API.
 * @param {string} activityId
 * @param {string} athleteId
 * @param {string} apiKey
 * @returns {Promise<object|null>} Parsed GeoJSON map data or null
 */
export const fetchActivityMap = async (activityId, athleteId, apiKey) => {
  if (!activityId || !athleteId || !apiKey) return null;

  const auth = btoa(`API_KEY:${apiKey}`);
  const url = `https://intervals.icu/api/v1/activity/${activityId}/map`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (!response.ok) {
      // It's common for some activities to not have map data (e.g., manual entries)
      // So, don't throw, just return null or log a warning.
      console.warn(`No map data for activity ${activityId}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    // The API now directly returns the map data object, not stringified GeoJSON
    if (data && data.latlngs && data.latlngs.length > 0) {
      return data;
    }

    return null;

  } catch (error) {
    console.error(`Failed to fetch map for activity ${activityId}:`, error);
    return null;
  }
};
