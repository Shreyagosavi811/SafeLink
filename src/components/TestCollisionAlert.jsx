import React, { useState, useEffect } from 'react';
import CollisionAlert from './CollisionAlert';

export default function TestCollisionAlert() {
    const [risks, setRisks] = useState([]);

    useEffect(() => {
        // Simulate risks updating every 2 seconds
        const interval = setInterval(() => {
            const random = Math.random();
            if (random < 0.3) {
                setRisks([
                    {
                        vehicle: { id: 'veh_1', braking: true },
                        riskLevel: 'HIGH',
                        distance: Math.floor(Math.random() * 20) + 5,
                        ttc: Math.floor(Math.random() * 5) + 1,
                        relativeSpeed: Math.floor(Math.random() * 80),
                    },
                ]);
            } else if (random < 0.6) {
                setRisks([
                    {
                        vehicle: { id: 'veh_2', braking: false },
                        riskLevel: 'MEDIUM',
                        distance: Math.floor(Math.random() * 50) + 10,
                        ttc: Math.floor(Math.random() * 10) + 2,
                        relativeSpeed: Math.floor(Math.random() * 50),
                    },
                ]);
            } else {
                setRisks([]); // No risk
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <h2>Collision Alert Test</h2>
            <CollisionAlert risks={risks} />
            <pre>{JSON.stringify(risks, null, 2)}</pre>
        </div>
    );
}
