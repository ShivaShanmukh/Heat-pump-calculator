// ─── Heat Pump Sizing Model ───────────────────────────────────────────────────
// Contains all heat-loss, COP, processing, and sizing logic.
// All exported functions are pure (no side-effects, no external state).

// ─── Month names ──────────────────────────────────────────────────────────────
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── CoP Lookup ───────────────────────────────────────────────────────────────
// Returns the Coefficient of Performance based on flow temperature and
// outdoor temperature, using a stepped lookup table.
export function getCoP(flowTemp, outdoorTemp) {
    const tempDiff = flowTemp - outdoorTemp;

    if (flowTemp <= 35) {
        if (tempDiff <= 20) return 4.5;
        if (tempDiff <= 30) return 4.0;
        if (tempDiff <= 40) return 3.5;
        return 3.0;
    } else if (flowTemp <= 45) {
        if (tempDiff <= 20) return 4.0;
        if (tempDiff <= 30) return 3.5;
        if (tempDiff <= 40) return 3.0;
        return 2.5;
    } else if (flowTemp <= 55) {
        if (tempDiff <= 20) return 3.5;
        if (tempDiff <= 30) return 3.0;
        if (tempDiff <= 40) return 2.5;
        return 2.2;
    } else {
        if (tempDiff <= 20) return 3.0;
        if (tempDiff <= 30) return 2.5;
        if (tempDiff <= 40) return 2.2;
        return 2.0;
    }
}

// ─── Heat Loss (returns kW) ───────────────────────────────────────────────────
// Calculates steady-state heat loss through walls, roof, and floor.
export function calculateHeatLoss(wallArea, wallU, roofArea, roofU, floorArea, floorU, indoorTemp, outdoorTemp) {
    const wallLoss = wallArea * wallU * (indoorTemp - outdoorTemp);
    const roofLoss = roofArea * roofU * (indoorTemp - outdoorTemp);
    const floorLoss = floorArea * floorU * (indoorTemp - outdoorTemp);
    return (wallLoss + roofLoss + floorLoss) / 1000; // W → kW
}

// ─── Total UA (W/K) ──────────────────────────────────────────────────────────
// Returns the total thermal transmittance of the building envelope.
export function totalUA(wallArea, wallU, roofArea, roofU, floorArea, floorU) {
    return wallArea * wallU + roofArea * roofU + floorArea * floorU;
}

// ─── Parse TMY timestamp ─────────────────────────────────────────────────────
// PVGIS TMY timestamps look like "20050101:0010" → yyyyMMdd:HHmm
export function parseTMYTime(timeStr) {
    const str = String(timeStr);
    const month = parseInt(str.substring(4, 6), 10); // 1-12
    const day = parseInt(str.substring(6, 8), 10);
    const hour = parseInt(str.substring(9, 11), 10);
    return { month, day, hour };
}

// ─── Process hourly data into structured results ──────────────────────────────
// Takes raw PVGIS hourly data + building params and returns aggregated results
// including monthly breakdowns and per-hour detail.
export function processHourlyData(hourlyData, params) {
    const { wallArea, wallU, roofArea, roofU, floorArea, floorU,
        flowTemp, maxOutput, baseTemp, indoorTemp } = params;

    const ua = totalUA(wallArea, wallU, roofArea, roofU, floorArea, floorU);

    let totalHeatEnergy = 0;
    let totalElectricalEnergy = 0;
    let hoursExceedingCapacity = 0;
    let peakHeatLoad = 0;

    // Monthly accumulators (index 0-11)
    const monthlyHeat = new Array(12).fill(0);
    const monthlyElectrical = new Array(12).fill(0);

    // Full hourly detail for daily views
    const hourlyResults = [];

    for (const hour of hourlyData) {
        const outdoorTemp = hour.T2m;
        const { month, day, hour: hr } = parseTMYTime(hour['time(UTC)']);
        const monthIdx = month - 1;

        let heatLoss = 0;
        let electricalUse = 0;
        let cop = 0;
        let actualHeatDelivered = 0;
        let indoorTempActual = indoorTemp;

        if (outdoorTemp < baseTemp) {
            heatLoss = calculateHeatLoss(
                wallArea, wallU, roofArea, roofU, floorArea, floorU,
                indoorTemp, outdoorTemp
            );

            if (heatLoss > peakHeatLoad) peakHeatLoad = heatLoss;

            cop = getCoP(flowTemp, outdoorTemp);

            if (heatLoss > maxOutput) {
                hoursExceedingCapacity++;
                actualHeatDelivered = maxOutput;
                // When undersized, indoor temp drops
                // Q_delivered = UA * (T_indoor_actual - T_outdoor) / 1000
                // T_indoor_actual = T_outdoor + (Q_delivered * 1000) / UA
                indoorTempActual = outdoorTemp + (maxOutput * 1000) / ua;
            } else {
                actualHeatDelivered = heatLoss;
                indoorTempActual = indoorTemp;
            }

            electricalUse = actualHeatDelivered / cop;

            totalHeatEnergy += actualHeatDelivered;
            totalElectricalEnergy += electricalUse;
            monthlyHeat[monthIdx] += actualHeatDelivered;
            monthlyElectrical[monthIdx] += electricalUse;
        } else {
            indoorTempActual = indoorTemp; // no heating needed, indoor stays at setpoint
        }

        hourlyResults.push({
            month, day, hour: hr,
            outdoorTemp,
            heatLoss: parseFloat(heatLoss.toFixed(4)),
            electricalUse: parseFloat(electricalUse.toFixed(4)),
            cop: parseFloat(cop.toFixed(2)),
            indoorTempActual: parseFloat(indoorTempActual.toFixed(2)),
            actualHeatDelivered: parseFloat(actualHeatDelivered.toFixed(4))
        });
    }

    const averageCoP = totalElectricalEnergy > 0 ? totalHeatEnergy / totalElectricalEnergy : 0;

    return {
        totalHeatEnergy,
        electricalEnergy: totalElectricalEnergy,
        averageCoP,
        hoursExceedingCapacity,
        peakHeatLoad,
        monthlyHeat: monthlyHeat.map(v => parseFloat(v.toFixed(2))),
        monthlyElectrical: monthlyElectrical.map(v => parseFloat(v.toFixed(2))),
        monthNames: MONTH_NAMES,
        hourlyResults
    };
}

// ─── Find recommended heat pump size ──────────────────────────────────────────
// Uses quantile-based sizing: given a maximum number of allowed exceedance hours
// (thresholdHours), returns the Nth highest hourly heat load (where N = thresholdHours).
//
// Logic:
//   1. Collect all hourly heat loads where heating is needed (outdoor < base temp).
//   2. Sort loads descending (highest first).
//   3. The Nth highest load is at index (N - 1) in the sorted array.
//      A heat pump sized to this value will be exceeded for at most N hours per year.
//   4. Round up to the nearest 0.5 kW for practical sizing.
//
// This function is pure — it does not mutate the input hourlyData.
export function recommendHeatPumpSize(hourlyData, params, thresholdHours) {
    const { wallArea, wallU, roofArea, roofU, floorArea, floorU,
        flowTemp, baseTemp, indoorTemp } = params;

    // Collect all heat loads when heating is needed
    const loads = [];
    for (const hour of hourlyData) {
        const outdoorTemp = hour.T2m;
        if (outdoorTemp < baseTemp) {
            const heatLoss = calculateHeatLoss(
                wallArea, wallU, roofArea, roofU, floorArea, floorU,
                indoorTemp, outdoorTemp
            );
            loads.push(heatLoss);
        }
    }

    if (loads.length === 0) return 0;

    // Sort descending (does not affect external data since `loads` is a local array)
    loads.sort((a, b) => b - a);

    // If the allowed exceedance is greater than the number of heating hours,
    // any size works → return 0 (no minimum needed)
    if (thresholdHours >= loads.length) return 0;

    // Quantile-based sizing: the Nth highest load is at index N-1 in a
    // descending-sorted array. Clamp to valid bounds to prevent out-of-range access.
    const idx = Math.max(0, Math.min(loads.length - 1, thresholdHours - 1));
    const recommendedSize = loads[idx];

    // Round up to nearest 0.5 kW
    return Math.ceil(recommendedSize * 2) / 2;
}
