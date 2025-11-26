import { useState, useEffect, useRef } from 'react';
import { ref, set, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import { calculateSpeed, calculateBearing } from '../utils/geoUtils';
import { detectSuddenBraking } from '../utils/collisionDetection';

/**
 * Custom hook for vehicle tracking and data broadcasting
 * @param {string} vehicleId - Unique vehicle identifier
 * @returns {Object} Vehicle tracking state and data
 */
export function useVehicleTracking(vehicleId) {
    const [position, setPosition] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [heading, setHeading] = useState(0);
    const [error, setError] = useState(null);
    const [isTracking, setIsTracking] = useState(false);

    const previousPosition = useRef(null);
    const previousSpeed = useRef(0);
    const previousTime = useRef(null);
    const watchId = useRef(null);

    useEffect(() => {
        if (!vehicleId) return;

        // Check if geolocation is supported
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setIsTracking(true);

        // Start watching position
        watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const timestamp = Date.now();

                let calculatedSpeed = 0;
                let calculatedHeading = heading;

                // Calculate speed and heading if we have previous position
                if (previousPosition.current && previousTime.current) {
                    const timeDiff = timestamp - previousTime.current;

                    if (timeDiff > 0) {
                        // Calculate speed from GPS movement
                        calculatedSpeed = calculateSpeed(
                            previousPosition.current.lat,
                            previousPosition.current.lng,
                            latitude,
                            longitude,
                            timeDiff
                        );

                        // Calculate heading
                        calculatedHeading = calculateBearing(
                            previousPosition.current.lat,
                            previousPosition.current.lng,
                            latitude,
                            longitude
                        );

                        // Detect sudden braking
                        const isBraking = detectSuddenBraking(
                            calculatedSpeed,
                            previousSpeed.current,
                            timeDiff
                        );

                        // Broadcast vehicle data to Firebase
                        const vehicleData = {
                            lat: latitude,
                            lng: longitude,
                            speed: Math.max(0, calculatedSpeed), // Ensure non-negative
                            heading: calculatedHeading,
                            timestamp,
                            braking: isBraking
                        };

                        // Update Firebase
                        const vehicleRef = ref(database, `vehicles/${vehicleId}`);
                        set(vehicleRef, vehicleData).catch((err) => {
                            console.error('Firebase update error:', err);
                        });

                        // Update local state
                        setPosition({ lat: latitude, lng: longitude });
                        setSpeed(calculatedSpeed);
                        setHeading(calculatedHeading);

                        // Store for next calculation
                        previousSpeed.current = calculatedSpeed;
                    }
                } else {
                    // First position update
                    setPosition({ lat: latitude, lng: longitude });

                    // Initialize Firebase with first position
                    const vehicleRef = ref(database, `vehicles/${vehicleId}`);
                    set(vehicleRef, {
                        lat: latitude,
                        lng: longitude,
                        speed: 0,
                        heading: 0,
                        timestamp,
                        braking: false
                    }).catch((err) => {
                        console.error('Firebase initialization error:', err);
                    });
                }

                previousPosition.current = { lat: latitude, lng: longitude };
                previousTime.current = timestamp;
                setError(null);
            },
            (err) => {
                setError(`Location error: ${err.message}`);
                setIsTracking(false);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000
            }
        );

        // Cleanup function
        return () => {
            if (watchId.current) {
                navigator.geolocation.clearWatch(watchId.current);
            }

            // Remove vehicle from Firebase when component unmounts
            const vehicleRef = ref(database, `vehicles/${vehicleId}`);
            set(vehicleRef, null).catch((err) => {
                console.error('Firebase cleanup error:', err);
            });
        };
    }, [vehicleId]);

    return {
        position,
        speed,
        heading,
        error,
        isTracking
    };
}

/**
 * Custom hook to subscribe to all vehicles data
 * @returns {Object} All vehicles data
 */
export function useVehiclesData() {
    const [vehicles, setVehicles] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const vehiclesRef = ref(database, 'vehicles');

        // Subscribe to vehicles data
        onValue(vehiclesRef, (snapshot) => {
            const data = snapshot.val();
            setVehicles(data || {});
            setLoading(false);
        });

        // Cleanup
        return () => {
            off(vehiclesRef);
        };
    }, []);

    return { vehicles, loading };
}
