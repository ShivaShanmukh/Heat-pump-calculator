// ─── Input Validation ─────────────────────────────────────────────────────────
// Validates all numeric inputs for the heat pump calculator.
// Returns an array of human-readable error strings (empty if valid).

export function validateInputs(body) {
    const errors = [];
    const { wallArea, wallU, roofArea, roofU, floorArea, floorU,
        latitude, longitude, flowTemp, maxOutput, baseTemp, indoorTemp } = body;

    // Required fields
    const fields = {
        wallArea, wallU, roofArea, roofU, floorArea, floorU,
        latitude, longitude, flowTemp, maxOutput, baseTemp, indoorTemp
    };
    for (const [name, val] of Object.entries(fields)) {
        if (val === undefined || val === null || val === '' || isNaN(Number(val))) {
            errors.push(`${name} is required and must be a number.`);
        }
    }
    if (errors.length) return errors;

    // Sensible ranges
    if (wallArea < 0 || wallArea > 5000) errors.push('Wall area should be between 0 and 5000 m².');
    if (wallU < 0.05 || wallU > 5) errors.push('Wall U-value should be between 0.05 and 5 W/m²K.');
    if (roofArea < 0 || roofArea > 5000) errors.push('Roof area should be between 0 and 5000 m².');
    if (roofU < 0.05 || roofU > 5) errors.push('Roof U-value should be between 0.05 and 5 W/m²K.');
    if (floorArea < 0 || floorArea > 5000) errors.push('Floor area should be between 0 and 5000 m².');
    if (floorU < 0.05 || floorU > 5) errors.push('Floor U-value should be between 0.05 and 5 W/m²K.');
    if (latitude < -90 || latitude > 90) errors.push('Latitude must be between -90 and 90.');
    if (longitude < -180 || longitude > 180) errors.push('Longitude must be between -180 and 180.');
    if (flowTemp < 20 || flowTemp > 80) errors.push('Flow temperature should be between 20 and 80 °C.');
    if (maxOutput < 0.5 || maxOutput > 100) errors.push('Maximum heat output should be between 0.5 and 100 kW.');
    if (baseTemp < -10 || baseTemp > 25) errors.push('Base temperature should be between -10 and 25 °C.');
    if (indoorTemp < 10 || indoorTemp > 30) errors.push('Indoor temperature should be between 10 and 30 °C.');
    if (baseTemp >= indoorTemp) errors.push('Base temperature must be lower than indoor temperature.');

    return errors;
}
