import React from "react";

const containerStyle = {
  padding: "24px",
  backgroundColor: "#1e1e2f",
  minHeight: "100vh",
  color: "#f0f0f0"
};

const cardStyle = {
  backgroundColor: "#2e2e3e",
  padding: "16px",
  borderRadius: "10px",
  marginBottom: "16px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)"
};

const titleStyle = {
  fontSize: "24px",
  marginBottom: "8px"
};

const noteStyle = {
  fontSize: "16px",
  color: "#ccc"
};

const dummyNotifications = [
  { id: 1, message: "Sensor: Fall Detector battery is low", timestamp: "2025-07-24 09:20" },
  { id: 2, message: "Sensor: Bedroom temperature reading failed", timestamp: "2025-07-24 08:52" },
  { id: 3, message: "Warning: Main door sensor went offline", timestamp: "2025-07-23 22:14" }
];

export default function Notifications() {
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>System Notifications</h1>
      <p style={noteStyle}>These are alerts about system performance or technical issues.</p>
      <div style={{ marginTop: "20px" }}>
        {dummyNotifications.map((n) => (
          <div key={n.id} style={cardStyle}>
            <strong>{n.message}</strong>
            <div style={{ color: "#aaa", marginTop: "6px", fontSize: "14px" }}>{n.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
