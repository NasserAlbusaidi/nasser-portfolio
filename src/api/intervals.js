/**
 * Fetches activities from Intervals.icu API
 * @param {string} athleteId 
 * @param {string} apiKey 
 * @param {string} afterDate - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Array>}
 */
export const fetchActivities = async (athleteId, apiKey, afterDate) => {
  const auth = btoa(`API_KEY:${apiKey}`);
  const url = `https://intervals.icu/api/v1/athlete/${athleteId}/activities?oldest=${afterDate}&limit=200`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (!response.ok) {
      throw new Error(`Intervals.icu API Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch from Intervals.icu:", error);
    throw error;
  }
};

/**
 * Fetches daily wellness data (HR, Sleep, Steps, etc.)
 * @param {string} athleteId 
 * @param {string} apiKey 
 * @param {string} afterDate 
 * @returns {Promise<Array>}
 */
export const fetchWellness = async (athleteId, apiKey, afterDate) => {
  const auth = btoa(`API_KEY:${apiKey}`);
  // Fetching wellness data starting from 'afterDate'
  const url = `https://intervals.icu/api/v1/athlete/${athleteId}/wellness?oldest=${afterDate}`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    if (!response.ok) throw new Error("Wellness fetch failed");
    return await response.json();
  } catch (error) {
    console.error("Wellness API Error:", error);
    return [];
  }
};

/**
 * Processes raw activities into application format
 * @param {Array} activities 
 * @returns {Array}
 */
export const processActivities = (activities) => {
  const ALLOWED_TYPES = ['Ride', 'Run', 'Swim', 'OpenWaterSwim', 'WeightTraining'];

  return activities
    .filter(activity => ALLOWED_TYPES.includes(activity.type))
    .map(activity => {
      let activityType = 'run';
      if (activity.type === 'Ride') activityType = 'bike';
      if (activity.type === 'Swim' || activity.type === 'OpenWaterSwim') activityType = 'swim';
      if (activity.type === 'WeightTraining') activityType = 'workout';

      const distanceKm = (activity.distance / 1000).toFixed(2);
      const durationMin = Math.round(activity.moving_time / 60);

      return {
        externalId: String(activity.id),
        activityType,
        distance: distanceKm,
        duration: durationMin,
        date: activity.start_date_local.split('T')[0],
        description: activity.name,
        source: 'intervals.icu',
        avgHeartRate: activity.average_heartrate || null,
        maxPower: activity.icu_pm_p_max || null,
        avgSpeed: activity.average_speed || null,
        elevationGain: activity.total_elevation_gain || null,
        avgCadence: activity.average_cadence || null,
        maxHeartRate: activity.max_heartrate || null,
        trainingLoad: activity.icu_training_load || null,
        intensity: activity.icu_intensity || null,
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
      console.warn(`No map data for activity ${activityId}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (data && data.latlngs && data.latlngs.length > 0) {
      return data;
    }

    return null;

  } catch (error) {
    console.error(`Failed to fetch map for activity ${activityId}:`, error);
    return null;
  }
};