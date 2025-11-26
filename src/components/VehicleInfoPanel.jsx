import React from 'react';
import './VehicleInfoPanel.css';

/**
 * VehicleInfoPanel component - displays vehicle status and nearby vehicle info
 */
export default function VehicleInfoPanel({
    currentSpeed,
    nearestVehicle,
    riskLevel,
    vehicleCount,
    isTracking
}) {
    const getRiskColor = (level) => {
        switch (level) {
            case 'HIGH':
                return '#FF4444';
            case 'MEDIUM':
                return '#FFA500';
            default:
                return '#4CAF50';
        }
    };

    return (
        <div className="vehicle-info-panel">
            <div className="panel-header">
                <h3>Vehicle Status</h3>
                <div className={`status-indicator ${isTracking ? 'active' : 'inactive'}`}>
                    <span className="status-dot"></span>
                    {isTracking ? 'Tracking' : 'Inactive'}
                </div>
            </div>

            <div className="info-grid">
                {/* Current Speed */}
                <div className="info-card">
                    <div className="info-icon">🚗</div>
                    <div className="info-content">
                        <div className="info-label">Your Speed</div>
                        <div className="info-value">{currentSpeed.toFixed(1)} <span className="unit">km/h</span></div>
                    </div>
                </div>

                {/* Nearest Vehicle */}
                <div className="info-card">
                    <div className="info-icon">📍</div>
                    <div className="info-content">
                        <div className="info-label">Nearest Vehicle</div>
                        <div className="info-value">
                            {nearestVehicle ? (
                                <>{nearestVehicle.distance} <span className="unit">m</span></>
                            ) : (
                                <span className="no-data">None nearby</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Risk Level */}
                <div className="info-card">
                    <div className="info-icon">⚠️</div>
                    <div className="info-content">
                        <div className="info-label">Collision Risk</div>
                        <div
                            className="info-value risk-badge"
                            style={{ color: getRiskColor(riskLevel) }}
                        >
                            {riskLevel}
                        </div>
                    </div>
                </div>

                {/* Nearby Vehicles Count */}
                <div className="info-card">
                    <div className="info-icon">🚙</div>
                    <div className="info-content">
                        <div className="info-label">Nearby Vehicles</div>
                        <div className="info-value">{vehicleCount}</div>
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            {nearestVehicle && nearestVehicle.vehicle && (
                <div className="nearest-vehicle-details">
                    <h4>Nearest Vehicle Details</h4>
                    <div className="detail-row">
                        <span>Speed:</span>
                        <span>{nearestVehicle.vehicle.speed?.toFixed(1) || 0} km/h</span>
                    </div>
                    {nearestVehicle.vehicle.braking && (
                        <div className="detail-row braking">
                            <span>⚠️ BRAKING</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
