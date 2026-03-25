// ─── PVGIS Weather Data Client ────────────────────────────────────────────────
// Fetches Typical Meteorological Year (TMY) hourly data from the PVGIS API.
// Throws descriptive errors for invalid locations or API failures.
// In-memory cache so multiple scenario calls (undersized/optimal/oversized)
// for the same location only hit PVGIS once per server session.

const pvgisCache = new Map();

export async function fetchPVGISData(latitude, longitude) {
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (pvgisCache.has(cacheKey)) return pvgisCache.get(cacheKey);

    const url = `https://re.jrc.ec.europa.eu/api/v5_2/tmy?lat=${latitude}&lon=${longitude}&outputformat=json`;

    const response = await fetch(url);

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        // Detect coordinates-in-sea or out-of-range errors
        if (response.status === 400 || text.includes('sea') || text.includes('valid')) {
            throw new Error(
                'The specified location appears to be in the sea or outside the PVGIS coverage area. ' +
                'Please enter coordinates for a land-based location within Europe, Africa, or parts of Asia.'
            );
        }
        throw new Error(`PVGIS API returned status ${response.status}. Please check your coordinates and try again.`);
    }

    const data = await response.json();

    if (!data.outputs || !data.outputs.tmy_hourly || data.outputs.tmy_hourly.length === 0) {
        throw new Error(
            'PVGIS returned no hourly data for this location. ' +
            'The coordinates may be outside the supported region (Europe, Africa, parts of Asia).'
        );
    }

    pvgisCache.set(cacheKey, data);
    return data;
}
