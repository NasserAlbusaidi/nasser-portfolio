/**
 * Formats decimal hours into a HH:MM string.
 * @param {number} decimalHours - The time in decimal hours (e.g., 1.5).
 * @returns {string} - Formatted time string (e.g., "1:30") or "--" if invalid.
 */
export const formatTime = (decimalHours) => {
    if (!decimalHours || decimalHours === 0) return "--";
    const hrs = Math.floor(decimalHours);
    const mins = Math.round((decimalHours - hrs) * 60);
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
};
