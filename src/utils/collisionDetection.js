import { calculateDistance } from './geoUtils';

// Validate vehicle object
function isValidVehicle(v) {
    return (
        v &&
        v.lat != null &&
        v.lng != null &&
        v.speed != null
    );
}

/**
 * Calculate Time-to-Collision (TTC)
 */
export function analyzeCollisionRisk(vehicle1, vehicle2) {
    if (!isValidVehicle(vehicle1) || !isValidVehicle(vehicle2)) {
        return {
            distance: null,
            ttc: null,
            riskLevel: "LOW",
            isCollisionCourse: false,
            relativeSpeed: 0
        };
    }

    const distance = calculateDistance(
        vehicle1.lat, vehicle1.lng,
        vehicle2.lat, vehicle2.lng
    );

    const speed1 = vehicle1.speed || 0;
    const speed2 = vehicle2.speed || 0;

    const relativeSpeed = Math.abs(speed1 - speed2);
    let ttc = Infinity;

    if (relativeSpeed > 0) {
        ttc = distance / ((relativeSpeed * 1000) / 3600); // km/h → m/s
    }

    let riskLevel = "LOW";
    if (ttc < 3) riskLevel = "HIGH";
    else if (ttc < 5) riskLevel = "MEDIUM";

    const isCollisionCourse = distance < 100 && relativeSpeed > 5;

    return {
        distance: Math.round(distance),
        ttc: ttc === Infinity ? null : ttc.toFixed(1),
        riskLevel,
        isCollisionCourse,
        relativeSpeed: relativeSpeed.toFixed(1)
    };
}

/**
 * Detect sudden braking
 */
export function detectSuddenBraking(currentSpeed, previousSpeed, timeDiff) {
    if (currentSpeed == null || previousSpeed == null) return false;

    const speedDrop = previousSpeed - currentSpeed;
    const t = timeDiff / 1000;

    if (t > 0) {
        const decel = speedDrop / t;
        return decel > 20;
    }
    return false;
}

/**
 * Find nearest vehicle
 */
export function findNearestVehicle(currentVehicle, vehicles) {
    if (!isValidVehicle(currentVehicle)) return null;

    let nearest = null;
    let minDistance = Infinity;

    Object.entries(vehicles || {}).forEach(([id, v]) => {
        if (!isValidVehicle(v)) return;
        if (id === currentVehicle.id) return;

        const distance = calculateDistance(
            currentVehicle.lat,
            currentVehicle.lng,
            v.lat,
            v.lng
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearest = { ...v, id, distance };
        }
    });

    return nearest;
}

/**
 * Analyze all vehicles
 */
export function analyzeAllCollisionRisks(currentVehicle, vehicles) {
    if (!isValidVehicle(currentVehicle)) return [];

    const risks = [];

    Object.entries(vehicles || {}).forEach(([id, v]) => {
        if (!isValidVehicle(v)) return;
        if (id === currentVehicle.id) return;

        const analysis = analyzeCollisionRisk(currentVehicle, v);

        if (analysis.distance != null && analysis.distance < 500) {
            risks.push({
                vehicleId: id,
                vehicle: v,
                ...analysis
            });
        }
    });

    // Sort: High > Medium > Low
    risks.sort((a, b) => {
        const order = { HIGH: 3, MEDIUM: 2, LOW: 1 };

        if (order[a.riskLevel] !== order[b.riskLevel])
            return order[b.riskLevel] - order[a.riskLevel];

        return a.distance - b.distance;
    });

    return risks;
}
