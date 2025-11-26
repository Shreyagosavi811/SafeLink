import React, { useEffect, useRef, useState } from "react";
import { playMediumBeep, playHighBeep, speak, vibrate } from "../utils/alertAudio";
import "./CollisionAlert.css";

export default function CollisionAlert({ risks }) {
    const lastRef = useRef(0);
    const [flash, setFlash] = useState(false);
    const highest = risks?.[0];

    useEffect(() => {
        const now = Date.now();
        if (!highest) return;

        if (now - lastRef.current < 2000) return;

        if (highest.riskLevel === "MEDIUM") {
            playMediumBeep();
            vibrate([100, 60, 100]);
            speak("Caution. Vehicle ahead.");
        }

        if (highest.riskLevel === "HIGH") {
            playHighBeep();
            vibrate([300, 150, 300]);
            speak("Warning! Brake immediately!");
            setFlash(true);
            setTimeout(() => setFlash(false), 350);
        }

        lastRef.current = now;
    }, [highest]);

    if (!highest) return null;

    return (
        <>
            {flash && <div className="flash-overlay" />}
            <div className={`alert-banner ${highest.riskLevel.toLowerCase()}`}>
                <strong>{highest.riskLevel} RISK</strong> — TTC: {highest.ttc ?? "N/A"}s
            </div>
        </>
    );
}
