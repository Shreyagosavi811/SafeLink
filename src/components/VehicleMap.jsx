// src/components/VehicleMap.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RadarOverlay from './RadarOverlay';
import '../styles/radar.css';

// Fix Leaflet icon issue (keep your existing mergeOptions)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createVehicleIcon = (color, rotation = 0) =>
    L.divIcon({
        className: 'custom-vehicle',
        html: `<div style="transform: rotate(${rotation}deg); width:30px;height:30px; display:flex; align-items:center; justify-content:center;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L4 8V14L12 20L20 14V8L12 2Z" stroke="white" stroke-width="1"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });

function RecenterMap({ position }) {
    const map = useMap();
    React.useEffect(() => {
        if (position) map.setView([position.lat, position.lng], map.getZoom());
    }, [position, map]);
    return null;
}

// Memoized marker component to prevent re-rendering all markers when one moves
const VehicleMarker = React.memo(({ id, vehicle, color }) => {
    if (!vehicle || vehicle.lat == null || vehicle.lng == null) return null;

    return (
        <Marker
            position={[vehicle.lat, vehicle.lng]}
            icon={createVehicleIcon(color, vehicle.heading || 0)}
        >
            <Popup>
                <div>
                    <strong>{id}</strong><br />
                    Speed: {vehicle.speed?.toFixed(1) || 0} km/h
                </div>
            </Popup>
        </Marker>
    );
}, (prev, next) => {
    // Custom comparison for performance
    return prev.vehicle.lat === next.vehicle.lat &&
        prev.vehicle.lng === next.vehicle.lng &&
        prev.vehicle.heading === next.vehicle.heading &&
        prev.color === next.color;
});

export default React.memo(function VehicleMap({ currentVehicle, vehicles, collisionRisks }) {
    const defaultCenter = [19.076, 72.8777];
    const mapCenter = currentVehicle?.position ? [currentVehicle.position.lat, currentVehicle.position.lng] : defaultCenter;

    const getVehicleColor = (id) => {
        const risk = collisionRisks?.find(r => r.vehicleId === id);
        if (!risk) return '#4A90E2';
        if (risk.riskLevel === 'HIGH') return '#FF4444';
        if (risk.riskLevel === 'MEDIUM') return '#FFA500';
        return '#4A90E2';
    };

    // attach a small _radarRisk property to each vehicle for radar visualization (non-destructive)
    const vehiclesForRadar = React.useMemo(() => {
        const result = {};
        Object.entries(vehicles || {}).forEach(([id, v]) => {
            result[id] = { ...v };
            const r = collisionRisks?.find(x => x.vehicleId === id);
            if (r) result[id]._radarRisk = r.riskLevel;
        });
        return result;
    }, [vehicles, collisionRisks]);

    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {currentVehicle?.position && <RecenterMap position={currentVehicle.position} />}

                {/* Current vehicle marker */}
                {currentVehicle?.position && (
                    <Marker
                        position={[currentVehicle.position.lat, currentVehicle.position.lng]}
                        icon={createVehicleIcon('#00FF00', currentVehicle.heading)}
                    >
                        <Popup>
                            <div>
                                <strong>You</strong><br />
                                Speed: {currentVehicle.speed?.toFixed(1)} km/h
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Other vehicles - using memoized component */}
                {Object.entries(vehicles || {}).map(([id, v]) => (
                    <VehicleMarker
                        key={id}
                        id={id}
                        vehicle={v}
                        color={getVehicleColor(id)}
                    />
                ))}
            </MapContainer>

            {/* Radar overlay sits on top of map */}
            <RadarOverlay currentVehicle={currentVehicle} vehicles={vehiclesForRadar} rangeMeters={400} />
        </div>
    );
});
