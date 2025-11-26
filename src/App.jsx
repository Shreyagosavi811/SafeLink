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
  // -------------------------------
  // 1️⃣ GENERATE OR LOAD UNIQUE VEHICLE ID
  // -------------------------------
  const [vehicleId] = useState(() => {
    let id = localStorage.getItem('vehicleId');
    if (!id) {
      id = `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('vehicleId', id);
    }
    return id;
  });

  // -------------------------------
  // 2️⃣ LIVE GPS TRACKING
  // -------------------------------
  const { position, speed, heading, error, isTracking } = useVehicleTracking(vehicleId);

  // -------------------------------
  // 3️⃣ FETCH ALL VEHICLE DATA FROM FIREBASE
  // -------------------------------
  const { vehicles } = useVehiclesData();

  const otherVehicles = useMemo(() => {
    const filtered = { ...vehicles };
    delete filtered[vehicleId];
    return filtered;
  }, [vehicles, vehicleId]);

  // -------------------------------
  // 4️⃣ CURRENT VEHICLE OBJECT
  // -------------------------------
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

  // -------------------------------
  // 5️⃣ COLLISION ANALYSIS
  // -------------------------------
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
  }, []);

  // -------------------------------
  // 6️⃣ RENDER
  // -------------------------------
  return (
    <div className="app">

      {/* HEADER */}
      <header className="app-header">
        <div>
          <h1>🚗 V2V SafeNet</h1>
          <p className="subtitle">Real-Time Collision Warning System</p>
        </div>
        <div className="vehicle-id">
          <span>Vehicle ID:</span>
          <strong>{vehicleId.substring(0, 12)}...</strong>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className="app-nav">
        <Link to="/">Dashboard</Link> |{" "}
        <Link to="/simulator">Simulator</Link> |{" "}
        <Link to="/v2v">V2V Communication</Link>
      </nav>

      {/* ROUTES */}
      <Routes>
        {/* HOME MAP DASHBOARD */}
        <Route
          path="/"
          element={
            <div className="app-content">

              {/* LEFT PANEL */}
              <aside className="info-sidebar">
                <VehicleInfoPanel
                  currentSpeed={speed}
                  nearestVehicle={nearestVehicle}
                  riskLevel={overallRiskLevel}
                  vehicleCount={Object.keys(otherVehicles).length}
                  isTracking={isTracking}
                />

                <div className="instructions-panel">
                  <h3>📱 How to Test</h3>
                  <ol>
                    <li>Open on two mobile devices</li>
                    <li>Enable GPS on both</li>
                    <li>Start moving</li>
                    <li>Alerts trigger automatically</li>
                  </ol>
                </div>
              </aside>

              {/* MAP + ALERTS */}
              <main className="map-container">

                {!position && !error && (
                  <div className="loading-banner">
                    <div className="spinner"></div>
                    Waiting for GPS...
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
                  <div style={{ textAlign: "center", paddingTop: "80px", opacity: 0.6 }}>
                    Map will load once GPS is active…
                  </div>
                )}

              </main>
            </div>
          }
        />

        {/* SIMULATOR PAGE */}
        <Route path="/simulator" element={<SimulatorPage />} />

        {/* V2V COMMUNICATION SCREEN */}
        <Route path="/v2v" element={<V2VPanel vehicles={vehicles} currentId={vehicleId} />} />
      </Routes>

      {/* FOOTER */}
      <footer className="app-footer">
        <span>🌐 Connected: {Object.keys(vehicles).length}</span>
        <span>📡 Tracking: {isTracking ? "Active" : "Inactive"}</span>
        <span>
          ⚡ Risk:
          <strong style={{
            color:
              overallRiskLevel === "HIGH" ? "#FF4444" :
                overallRiskLevel === "MEDIUM" ? "#FFA500" :
                  "#4CAF50"
          }}>
            {" "}{overallRiskLevel}
          </strong>
        </span>
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
