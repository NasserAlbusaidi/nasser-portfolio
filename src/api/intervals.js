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
  const ALLOWED_TYPES = ['Ride', 'Run', 'Swim'];

  return activities
    .filter(activity => ALLOWED_TYPES.includes(activity.type))
    .map(activity => {
      // Map Intervals types to our app types
      let activityType = 'run';
      if (activity.type === 'Ride') activityType = 'bike';
      if (activity.type === 'Swim') activityType = 'swim';

      // Convert distance from meters to km
      const distanceKm = (activity.distance / 1000).toFixed(2);

      // Convert duration from seconds to minutes
      const durationMin = Math.round(activity.moving_time / 60);

      return {
        externalId: String(activity.id), // Store original ID as string to prevent duplicates
        activityType,
        distance: distanceKm,
        duration: durationMin,
        date: activity.start_date_local.split('T')[0], // YYYY-MM-DD
        description: activity.name,
        source: 'intervals.icu'
      };
    });
};
