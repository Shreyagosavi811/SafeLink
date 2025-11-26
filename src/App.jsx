import React, { useState, useMemo, useEffect } from 'react';
import { AudioManager } from "./utils/AudioManager";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// MAIN PAGES & COMPONENTS
import VehicleMap from './components/VehicleMap';
import CollisionAlert from './components/CollisionAlert';
import VehicleInfoPanel from './components/VehicleInfoPanel';
import V2VPanel from './components/V2VPanel';
import SimulatorPage from './pages/SimulatorPage';

// HOOKS
import { useVehicleTracking, useVehiclesData } from './hooks/useVehicleTracking';

// UTILS
import { analyzeAllCollisionRisks, findNearestVehicle } from './utils/collisionDetection';

// STYLES
import './App.css';
import 'leaflet/dist/leaflet.css';

function AppMain() {
  const [vehicleId] = useState(() => {
    let id = localStorage.getItem('vehicleId');
    if (!id) {
      id = `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('vehicleId', id);
    }
    return id;
  });

  const { position, speed, heading, error, isTracking } = useVehicleTracking(vehicleId);
  const { vehicles } = useVehiclesData();

  const otherVehicles = useMemo(() => {
    const filtered = { ...vehicles };
    delete filtered[vehicleId];
    return filtered;
  }, [vehicles, vehicleId]);

  const currentVehicle = useMemo(() => {
    if (!position) return null;
    return {
      id: vehicleId,
      lat: position.lat,
      lng: position.lng,
      speed,
      heading
    };
  }, [position, speed, heading, vehicleId]);

  const collisionRisks = useMemo(() => {
    if (!currentVehicle) return [];
    return analyzeAllCollisionRisks(currentVehicle, otherVehicles);
  }, [currentVehicle, otherVehicles]);

  const nearestVehicle = useMemo(() => {
    if (!currentVehicle) return null;
    return findNearestVehicle(currentVehicle, otherVehicles);
  }, [currentVehicle, otherVehicles]);

  const overallRiskLevel = useMemo(() => {
    if (collisionRisks.length === 0) return 'LOW';
    return collisionRisks[0].riskLevel;
  }, [collisionRisks]);

  useEffect(() => {
    AudioManager.unlockAudioOnClick();

    // Initialize night mode from localStorage
    const nightMode = localStorage.getItem('nightMode') === 'true';
    if (nightMode) {
      document.documentElement.classList.add('night-mode');
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">🛡️</div>
          <div>
            <h1>SafeLink</h1>
            <p className="subtitle">V2V Collision Warning System</p>
          </div>
        </div>

        <div className="header-controls">
          <button
            className="night-mode-toggle"
            onClick={() => {
              const html = document.documentElement;
              const isDark = html.classList.toggle('night-mode');
              localStorage.setItem('nightMode', isDark);
            }}
            title="Toggle Night Mode"
          >
            {document.documentElement.classList.contains('night-mode') ? '☀️' : '🌙'}
          </button>
          <div className="vehicle-id">
            <span>ID:</span>
            <strong>{vehicleId.substring(0, 8)}...</strong>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <Link to="/" className="nav-link">Dashboard</Link>
        <Link to="/simulator" className="nav-link">Simulator</Link>
        <Link to="/v2v" className="nav-link">V2V Network</Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <div className="app-content">
              <aside className="info-sidebar">
                <VehicleInfoPanel
                  currentSpeed={speed}
                  nearestVehicle={nearestVehicle}
                  riskLevel={overallRiskLevel}
                  vehicleCount={Object.keys(otherVehicles).length}
                  isTracking={isTracking}
                />

                <div className="instructions-panel">
                  <h3>📱 Quick Start</h3>
                  <ol>
                    <li>Open on 2+ devices</li>
                    <li>Enable GPS</li>
                    <li>Move to test alerts</li>
                  </ol>
                </div>
              </aside>

              <main className="map-container">
                {!position && !error && (
                  <div className="loading-banner">
                    <div className="spinner"></div>
                    Waiting for GPS signal...
                  </div>
                )}

                {error && (
                  <div className="error-banner">
                    ⚠️ {error}
                  </div>
                )}

                {position && (
                  <>
                    <VehicleMap
                      currentVehicle={currentVehicle}
                      vehicles={otherVehicles}
                      collisionRisks={collisionRisks}
                      center={{ lat: currentVehicle.lat, lng: currentVehicle.lng }}
                    />
                    <CollisionAlert risks={collisionRisks} />
                  </>
                )}

                {!position && !error && (
                  <div className="map-placeholder">
                    Map will load once GPS is active…
                  </div>
                )}
              </main>
            </div>
          }
        />

        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/v2v" element={<V2VPanel vehicles={vehicles} currentId={vehicleId} />} />
      </Routes>

      <footer className="app-footer">
        <div className="footer-stat">
          <span>🌐 Connected</span>
          <strong>{Object.keys(vehicles).length}</strong>
        </div>
        <div className="footer-stat">
          <span>📡 Tracking</span>
          <strong>{isTracking ? "Active" : "Inactive"}</strong>
        </div>
        <div className="footer-stat">
          <span>⚡ Risk Level</span>
          <strong style={{
            color: overallRiskLevel === "HIGH" ? "#FF4444" :
              overallRiskLevel === "MEDIUM" ? "#FFA500" : "#4CAF50"
          }}>
            {overallRiskLevel}
          </strong>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppMain />
    </Router>
  );
}
