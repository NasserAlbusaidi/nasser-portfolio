import exifr from 'exifr';

/**
 * Extracts EXIF data from an image file.
 * @param {File} file 
 * @returns {Promise<Object>} Structured EXIF data
 */
export const extractExif = async (file) => {
    try {
        const output = await exifr.parse(file, {
            tiff: true,
            exif: true,
            gps: true,
            ifd0: true,
            ifd1: true
        });

        if (!output) return null;

        // Helper to format coordinates to DMS
        const toDMS = (deg, isLat) => {
            if (!deg) return null;
            const absolute = Math.abs(deg);
            const d = Math.floor(absolute);
            const minFloat = (absolute - d) * 60;
            const m = Math.floor(minFloat);
            const s = ((minFloat - m) * 60).toFixed(2);
            const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
            return `${d}°${m}'${s}"${dir}`;
        };

        return {
            make: output.Make || null,
            model: output.Model || null,
            lens: output.LensModel || output.LensInfo || null,
            iso: output.ISO || null,
            aperture: output.FNumber ? `f/${output.FNumber}` : null,
            shutterSpeed: output.ExposureTime ? (output.ExposureTime < 1 ? `1/${Math.round(1 / output.ExposureTime)}` : `${output.ExposureTime}s`) : null,
            focalLength: output.FocalLength ? `${output.FocalLength}mm` : null,
            gps: (output.latitude && output.longitude) ? {
                lat: output.latitude,
                lng: output.longitude,
                dms: `${toDMS(output.latitude, true)} ${toDMS(output.longitude, false)}`
            } : null,
            date: output.DateTimeOriginal ? output.DateTimeOriginal.toISOString().split('T')[0] : null
        };
    } catch (error) {
        console.warn("EXIF extraction failed:", error);
        return null;
    }
};
