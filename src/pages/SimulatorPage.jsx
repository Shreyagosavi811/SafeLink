// src/pages/SimulatorPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { AudioManager } from "../utils/AudioManager";
import { playMediumBeep, playHighBeep, speak, vibrate } from "../utils/alertAudio";
import VehicleMap from '../components/VehicleMap';
import CollisionAlert from '../components/CollisionAlert';
import { analyzeAllCollisionRisks } from '../utils/collisionDetection';
import '../styles/simulator-ui.css';
import 'leaflet/dist/leaflet.css';

const SCENARIOS = {
  HEAD_ON: {
    name: "Head-on Collision",
    description: "Two vehicles approaching each other at high speed.",
    setup: () => ({
      v1: { id: 'v1', lat: 12.9716, lng: 77.5946, speed: 60, heading: 90 },
      v2: { id: 'v2', lat: 12.9716, lng: 77.6036, speed: 60, heading: 270 }
    })
  },
  REAR_END: {
    name: "Rear-end Collision",
    description: "Fast vehicle approaching a slower vehicle from behind.",
    setup: () => ({
      v1: { id: 'v1', lat: 12.9716, lng: 77.5946, speed: 80, heading: 90 },
      v2: { id: 'v2', lat: 12.9716, lng: 77.5986, speed: 30, heading: 90 }
    })
  },
  INTERSECTION: {
    name: "Intersection Crossing",
    description: "Two vehicles approaching an intersection.",
    setup: () => ({
      v1: { id: 'v1', lat: 12.9716, lng: 77.5946, speed: 50, heading: 90 },
      v2: { id: 'v2', lat: 12.9766, lng: 77.5996, speed: 50, heading: 180 }
    })
  },
  SAFE_PASS: {
    name: "Safe Pass",
    description: "Vehicles passing each other safely on parallel lanes.",
    setup: () => ({
      v1: { id: 'v1', lat: 12.9716, lng: 77.5946, speed: 50, heading: 90 },
      v2: { id: 'v2', lat: 12.9718, lng: 77.6036, speed: 50, heading: 270 }
    })
  }
};

export default function SimulatorPage() {
  const [vehicles, setVehicles] = useState(SCENARIOS.HEAD_ON.setup());
  const [activeScenario, setActiveScenario] = useState('HEAD_ON');
  const [isPlaying, setIsPlaying] = useState(false);
  const [flashFlag, setFlashFlag] = useState(false);

  const requestRef = useRef();
  const lastTimeRef = useRef();
  const lastAlertRef = useRef(0);

  useEffect(() => {
    AudioManager.unlockAudioOnClick();
  }, []);

  const updatePhysics = (time) => {
    if (lastTimeRef.current != undefined) {
      const deltaTime = (time - lastTimeRef.current) / 1000;

      setVehicles(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const v = next[key];
          let newSpeed = v.speed;
          if (v.braking) {
            const decel = 20;
            newSpeed = Math.max(0, v.speed - decel * deltaTime);
          }
          const distKm = (newSpeed * deltaTime) / 3600;
          const rad = (90 - (v.heading || 0)) * Math.PI / 180;
          const dLat = (distKm * Math.sin(rad)) / 111;
          const dLng = (distKm * Math.cos(rad)) / (111 * Math.cos((v.lat || 0) * Math.PI / 180));
          next[key] = { ...v, lat: v.lat + dLat, lng: v.lng + dLng, speed: newSpeed };
        });
        return next;
      });
    }

    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(updatePhysics);
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(updatePhysics);
    } else {
      cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = undefined;
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying]);

  const loadScenario = (key) => {
    setIsPlaying(false);
    setActiveScenario(key);
    setVehicles(SCENARIOS[key].setup());
  };

  const triggerBrake = () => {
    setVehicles(prev => ({ ...prev, v2: { ...prev.v2, braking: true } }));
    playHighBeep();
    vibrate([200, 100, 200]);
    speak('Simulated brake applied');
    setFlashFlag(true);
    setTimeout(() => setFlashFlag(false), 400);

    setTimeout(() => {
      setVehicles(prev => ({ ...prev, v2: { ...prev.v2, braking: false } }));
    }, 3000);
  };

  const myVehicle = vehicles['v1'];
  const otherVehicles = { ...vehicles };
  delete otherVehicles['v1'];

  const collisionRisks = analyzeAllCollisionRisks(myVehicle, otherVehicles);

  useEffect(() => {
    if (!collisionRisks || collisionRisks.length === 0) return;
    const top = collisionRisks[0];
    const now = Date.now();
    const cooldown = top.riskLevel === 'HIGH' ? 1600 : 2600;
    if (now - lastAlertRef.current < cooldown) return;

    if (top.riskLevel === 'MEDIUM') {
      playMediumBeep();
      vibrate([120, 80, 120]);
      speak('Caution. Vehicle ahead.');
      lastAlertRef.current = now;
    } else if (top.riskLevel === 'HIGH') {
      playHighBeep();
      vibrate([300, 180, 300]);
      speak('High collision risk. Brake now!');
      setFlashFlag(true);
      setTimeout(() => setFlashFlag(false), 400);
      lastAlertRef.current = now;
    }
  }, [collisionRisks]);

  return (
    <div className="sim-root">

      {/* Sidebar */}
      <aside className="sim-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Simulator</h2>
          <p className="sidebar-subtitle">Test collision scenarios in real-time.</p>
        </div>

        <div className="controls">
          <button
            className={`start-btn ${isPlaying ? 'paused' : 'starting'}`}
            onClick={() => {
              AudioManager.unlockAudioOnClick();
              setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Start'}
          </button>
          <button className="reset-btn" onClick={() => loadScenario(activeScenario)}>↺ Reset</button>
          <button className="brake-btn" onClick={triggerBrake}>⚠️ Simulate Brake</button>
        </div>

        <div className="scenario-list">
          <h3>Scenarios</h3>
          {Object.entries(SCENARIOS).map(([key, scenario]) => (
            <button
              key={key}
              className={`scenario-btn ${activeScenario === key ? 'active' : ''}`}
              onClick={() => loadScenario(key)}
            >
              <div className="scenario-name">{scenario.name}</div>
              <div className="scenario-desc">{scenario.description}</div>
            </button>
          ))}
        </div>

        <div className="live-stats">
          <h3>Live Stats</h3>
          <div className="stat-box">
            <div>
              <span>My Speed:</span>
              <strong>{(myVehicle?.speed ?? 0).toFixed(0)} km/h</strong>
            </div>
            <div>
              <span>Risk Level:</span>
              <strong className={`risk-${collisionRisks[0]?.riskLevel?.toLowerCase() || 'low'}`}>
                {collisionRisks[0]?.riskLevel || 'LOW'}
              </strong>
            </div>
            {collisionRisks[0] && (
              <div className="stat-details">
                <div>TTC: <strong>{collisionRisks[0].ttc}s</strong></div>
                <div>Dist: <strong>{collisionRisks[0].distance}m</strong></div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Map Area */}
      <main className="sim-map">
        {flashFlag && <div className="flash-alert" />}

        <VehicleMap
          currentVehicle={{ position: { lat: myVehicle?.lat ?? 0, lng: myVehicle?.lng ?? 0 }, speed: myVehicle?.speed ?? 0, heading: myVehicle?.heading ?? 0 }}
          vehicles={otherVehicles}
          collisionRisks={collisionRisks}
        />

        <CollisionAlert risks={collisionRisks} />
      </main>
    </div>
  );
}
