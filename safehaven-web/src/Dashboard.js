// SafeHaven Full Dashboard.js

import React, { useState, useEffect } from "react";

// ======= Dashboard Component =======

const dashboardContainerStyle = {
  padding: "24px"
};

const titleStyle = {
  fontSize: "26px",
  marginBottom: "10px"
};

const subtitleStyle = {
  color: "#bbb"
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginTop: "24px"
};

const cardStyle = {
  backgroundColor: "#2e2e3e",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
  textAlign: "center"
};

const alertStyle = {
  color: "#e74c3c",
  fontWeight: "bold",
  marginBottom: "8px"
};

const normalStyle = {
  color: "#2ecc71",
  fontWeight: "bold",
  marginBottom: "8px"
};

const headingStyle = {
  fontSize: "22px",
  marginBottom: "8px"
};

const dashboardButtonStyle = {
  padding: "6px 12px",
  backgroundColor: "#444",
  color: "#f0f0f0",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold"
};

export default function Dashboard() {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dummyData = [
      { id: 1, name: "Living Room Motion", reading: "No motion", alert: false },
      { id: 2, name: "Main Door", reading: "Closed", alert: false },
      { id: 3, name: "Bedroom Temperature", reading: "29°C", alert: true },
      { id: 4, name: "Fall Detector (Wrist Tag)", reading: "Inactive", alert: false },
      { id: 5, name: "Kitchen Temp", reading: "35°C", alert: true },
    ];
    setSensorData(dummyData);
    setLoading(false);
  }, []);

  const acknowledgeAlert = (id) => {
    const updatedData = sensorData.map(sensor =>
      sensor.id === id ? { ...sensor, alert: false } : sensor
    );
    setSensorData(updatedData);
  };

  return (
    <div style={dashboardContainerStyle}>
      <h1 style={titleStyle}>Real-Time Monitoring</h1>
      <p style={subtitleStyle}>Keep track of all sensors and alerts in one place.</p>

      {loading ? (
        <p style={{ marginTop: "20px", color: "#aaa" }}>Loading sensor data...</p>
      ) : (
        <div style={gridStyle}>
          {sensorData.map((sensor) => (
            <div key={sensor.id} style={cardStyle}>
              <h2 style={headingStyle}>{sensor.name}</h2>
              <p style={{ fontSize: "16px", marginBottom: "12px" }}>{sensor.reading}</p>
              {sensor.alert ? (
                <>
                  <div style={alertStyle}>⚠ Alert</div>
                  <button style={dashboardButtonStyle} onClick={() => acknowledgeAlert(sensor.id)}>
                    Acknowledge
                  </button>
                </>
              ) : (
                <div style={normalStyle}>✓ Normal</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ======= Login Page =======

const loginContainerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  backgroundColor: "#1e1e2f",
  color: "#f0f0f0"
};

const formStyle = {
  backgroundColor: "#2e2e3e",
  padding: "40px",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
  textAlign: "center",
  minWidth: "300px"
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "10px 0",
  borderRadius: "6px",
  border: "1px solid #555",
  backgroundColor: "#1e1e2f",
  color: "#f0f0f0"
};

const loginButtonStyle = {
  width: "100%",
  padding: "10px",
  backgroundColor: "#444",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer"
};
const loginButtonHoverStyle = {
  backgroundColor: "#666",
  boxShadow: "0 0 8px #aaa",
};

export function Login() {
  return (
    <div style={loginContainerStyle}>
      <form style={formStyle}>
        <h2>Welcome to SafeHaven!</h2>
        <input type="text" placeholder="Username" style={inputStyle} />
        <input type="password" placeholder="Password" style={inputStyle} />
        <button
            style={loginButtonStyle}
            onMouseEnter={(e) => Object.assign(e.target.style, loginButtonHoverStyle)}
            onMouseLeave={(e) => Object.assign(e.target.style, loginButtonStyle)}
            >Login
        </button>
      </form>
    </div>
  );
}

// ======= Logs Page =======

export function Logs() {
  const logs = [
    { id: 1, message: "Motion detected in Living Room", time: "2025-07-22 14:33" },
    { id: 2, message: "Temperature Alert: Kitchen 35°C", time: "2025-07-22 13:12" },
    { id: 3, message: "Main Door opened", time: "2025-07-22 11:45" },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <h1>Alert Log</h1>
      <p style={{ color: "#bbb" }}>Historical records of alerts and sensor events</p>
      <ul style={{ marginTop: "20px", listStyle: "none", paddingLeft: 0 }}>
        {logs.map((log) => (
          <li key={log.id} style={{ backgroundColor: "#2e2e3e", padding: "12px", borderRadius: "8px", marginBottom: "10px" }}>
            <strong>{log.message}</strong>
            <div style={{ color: "#999", fontSize: "14px" }}>{log.time}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}