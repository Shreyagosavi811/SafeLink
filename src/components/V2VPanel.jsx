// src/components/V2VPanel.jsx
import React, { useEffect, useState } from 'react';

export default function V2VPanel() {
    const [logs, setLogs] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'v2v_broadcast') {
                try {
                    const data = JSON.parse(e.newValue);
                    setLogs(prev => [{ ts: data.ts, payload: data.payload }, ...prev].slice(0, 100));
                } catch (err) { /* ignore */ }
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const send = () => {
        const payload = { from: 'demo_control', text: message };
        localStorage.setItem('v2v_broadcast', JSON.stringify({ ts: Date.now(), payload }));
        setMessage('');
        setLogs(prev => [{ ts: Date.now(), payload }, ...prev]);
    };

    return (
        <div style={{ padding: 16 }}>
            <h2>V2V Communication (Demo)</h2>
            <div style={{ display: 'flex', gap: 8 }}>
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Message to vehicles" />
                <button onClick={send}>Send</button>
            </div>

            <h3>Recent Messages</h3>
            <ul>
                {logs.map((l, i) => (
                    <li key={i}>
                        <strong>{new Date(l.ts).toLocaleTimeString()}:</strong> {JSON.stringify(l.payload)}
                    </li>
                ))}
            </ul>
        </div>
    );
}
