// src/components/RadarOverlay.jsx
import React, { useEffect, useRef } from "react";
import "../styles/radar.css";

/**
 * RadarOverlay
 * Props:
 * - currentVehicle: { position: {lat,lng}, ... }
 * - vehicles: { id: {lat,lng, ...}, ... }
 * - rangeMeters: number (radius of radar)
 * - onAutoBrake: callback when auto-brake condition detected (optional)
 */
export default function RadarOverlay({ currentVehicle, vehicles = {}, rangeMeters = 300, onAutoBrake }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const angleRef = useRef(0);

    // convert lat/lng differences to approximate meters using equirect projection
    function latLngToMeters(lat1, lng1, lat2, lng2) {
        const R = 6371000;
        const toRad = (d) => (d * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        // bearing
        const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
        const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
        const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        return { distance: d, bearing };
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let last = performance.now();

        function resize() {
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
        resize();
        window.addEventListener("resize", resize);

        function draw(now) {
            const dt = now - last;
            last = now;

            // rotate sweep (degrees per second)
            angleRef.current = (angleRef.current + dt * 0.06) % 360; // ~0.06 deg/ms => ~216 deg/s (fast). adjust if needed

            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            // center in overlay (we keep radar in top-right corner)
            const size = Math.min(w, h) * 0.32; // radar size (proportional)
            const cx = w - size / 2 - 20;
            const cy = size / 2 + 20;
            const radius = size / 2 - 8;

            // background circle
            ctx.save();
            ctx.fillStyle = "rgba(8,20,30,0.55)";
            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            roundRect(ctx, cx - size / 2, cy - size / 2, size, size, 8);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // rings
            const rings = 4;
            for (let i = 1; i <= rings; i++) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(100,200,120,${0.12 * (1 - i / rings)})`;
                ctx.lineWidth = 1;
                ctx.arc(cx, cy, (radius * i / rings), 0, Math.PI * 2);
                ctx.stroke();
            }

            // sweep gradient
            const sweepAngle = angleRef.current * Math.PI / 180;
            const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, radius);
            grad.addColorStop(0, "rgba(120,255,140,0.18)");
            grad.addColorStop(1, "rgba(120,255,140,0)");
            ctx.fillStyle = grad;

            // draw triangular sweep area
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(sweepAngle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, -0.08, 0.08);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Draw sweep line
            ctx.beginPath();
            ctx.strokeStyle = "rgba(120,255,140,0.95)";
            ctx.lineWidth = 1.2;
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + radius * Math.cos(sweepAngle), cy + radius * Math.sin(sweepAngle));
            ctx.stroke();

            // Draw blips for vehicles within rangeMeters
            if (currentVehicle && currentVehicle.position) {
                Object.values(vehicles || {}).forEach(v => {
                    if (!v || v.lat == null || v.lng == null) return;
                    const rel = latLngToMeters(currentVehicle.position.lat, currentVehicle.position.lng, v.lat, v.lng);
                    const d = rel.distance;
                    if (d > rangeMeters) return; // out of radar
                    // normalized distance 0..1 (0 is near, 1 is outer ring)
                    const nd = Math.max(0, Math.min(1, d / rangeMeters));
                    // pixel position
                    const bx = cx + (radius * nd) * Math.cos((rel.bearing) * Math.PI / 180);
                    const by = cy + (radius * nd) * Math.sin((rel.bearing) * Math.PI / 180);

                    // color by risk if present
                    const risk = (v._radarRisk) ? v._radarRisk : "LOW"; // v._radarRisk is optional
                    let color = "rgba(74,144,226,0.95)";
                    if (risk === "MEDIUM") color = "rgba(255,165,0,0.95)";
                    if (risk === "HIGH") color = "rgba(255,68,68,0.95)";

                    // pulsate blip slightly based on distance
                    const pulse = 1 + 0.2 * Math.sin(now / 200 + d / 50);

                    ctx.beginPath();
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.95;
                    ctx.arc(bx, by, 4 * pulse, 0, Math.PI * 2);
                    ctx.fill();

                    // small direction wedge for vehicle heading
                    if (v.heading != null) {
                        ctx.beginPath();
                        ctx.strokeStyle = "rgba(255,255,255,0.15)";
                        ctx.lineWidth = 1;
                        ctx.moveTo(bx, by);
                        const hrad = (v.heading - rel.bearing) * Math.PI / 180;
                        ctx.lineTo(bx + Math.cos((v.heading) * Math.PI / 180) * 8, by + Math.sin((v.heading) * Math.PI / 180) * 8);
                        ctx.stroke();
                    }
                });
            }

            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener("resize", resize);
        };
    }, [currentVehicle, vehicles, rangeMeters]);

    // small helper to draw rounded rectangle for background
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    return (
        <canvas
            ref={canvasRef}
            className="radar-canvas"
            style={{ position: "absolute", pointerEvents: "none", top: 0, left: 0, right: 0, bottom: 0, zIndex: 3000 }}
        />
    );
}
