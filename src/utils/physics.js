// src/utils/physics.js
// Simple kinematic model for demo: updates lat/lng from speed (km/h) and heading (deg).
// Uses small-sphere approximation to move lat/lng by meters.

const EARTH_RADIUS = 6371000; // meters

function metersToLat(m) {
    return (m / EARTH_RADIUS) * (180 / Math.PI);
}
function metersToLng(m, lat) {
    return (m / (EARTH_RADIUS * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
}

/**
 * Advance a vehicle based on speed (km/h) and heading (deg) over dt seconds.
 * Allows acceleration and small heading changes.
 */
export function advanceVehicle(vehicle, dtSeconds) {
    const speed = vehicle.speed || 0; // km/h
    const heading = typeof vehicle.heading === 'number' ? vehicle.heading : 0; // degrees
    const accel = vehicle.acceleration || 0; // km/h^2 (per hour), we'll treat as km/h per second for demo
    const turnRate = vehicle.turnRate || 0; // deg per second

    // update speed and heading
    const newSpeed = Math.max(0, speed + (accel * dtSeconds)); // simple
    const newHeading = (heading + turnRate * dtSeconds + 3600) % 360;

    // convert speed to meters/sec
    const speedMps = (newSpeed * 1000) / 3600;
    const distanceMeters = speedMps * dtSeconds;

    // compute delta lat/lng using heading
    const theta = (newHeading * Math.PI) / 180;
    const dy = Math.cos(theta) * distanceMeters; // north component (meters)
    const dx = Math.sin(theta) * distanceMeters; // east component (meters)

    const dLat = metersToLat(dy);
    const dLng = metersToLng(dx, vehicle.lat || 0);

    return {
        ...vehicle,
        lat: (vehicle.lat || 0) + dLat,
        lng: (vehicle.lng || 0) + dLng,
        speed: newSpeed,
        heading: newHeading,
    };
}

/**
 * Smoothly approach a target value
 */
export function approach(current, target, ratePerSec, dt) {
    const diff = target - current;
    const change = Math.sign(diff) * Math.min(Math.abs(diff), ratePerSec * dt);
    return current + change;
}
