import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000";

const containerStyle = {
  padding: "24px",
  backgroundColor: "#1e1e2f",
  minHeight: "100vh",
  color: "#f0f0f0",
};

const cardStyle = {
  backgroundColor: "#2e2e3e",
  padding: "16px",
  borderRadius: "10px",
  marginBottom: "16px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
};

const titleStyle = {
  fontSize: "24px",
  marginBottom: "8px",
};

const noteStyle = {
  fontSize: "16px",
  color: "#ccc",
};

const sectionTitleStyle = {
  fontSize: "18px",
  marginTop: "24px",
  marginBottom: "12px",
  color: "#ddd",
};

const alertBadgeStyle = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "6px",
  marginRight: "8px",
  marginBottom: "8px",
  fontSize: "14px",
  backgroundColor: "#c0392b",
  color: "#fff",
};

const okBadgeStyle = {
  ...alertBadgeStyle,
  backgroundColor: "#27ae60",
};

export default function Notifications() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");

    async function fetchNotifications() {
      try {
        const res = await fetch(`${API_BASE}/api/notifications`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to load notifications");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load system notifications");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNotifications();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>System Notifications</h1>
        <p style={{ marginTop: "20px", color: "#aaa" }}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>System Notifications</h1>
        <p style={{ marginTop: "20px", color: "#e74c3c" }}>{error}</p>
      </div>
    );
  }

  const {
    deviceId,
    offline,
    lastSeen,
    alertsActive = [],
    battery = {},
    health = {},
    alertLog = [],
    raw = {},
  } = data || {};

  const { battery_pct, lowBattery, predictedHoursLeft, dischargeRate } = battery;
  const { intrusionDetected, highTemp, waterHigh, pressureHigh, lowBattery: healthLowBattery } = health;

  const failureMessages = [];
  if (offline) failureMessages.push("Device offline");
  if (lowBattery === 1 || healthLowBattery === 1) failureMessages.push("Low battery");
  if (intrusionDetected === 1) failureMessages.push("Intrusion detected");
  if (highTemp === 1) failureMessages.push("High temperature");
  if (waterHigh === 1) failureMessages.push("Water high");
  if (pressureHigh === 1) failureMessages.push("Pressure high");

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>System Notifications</h1>
      <p style={noteStyle}>
        Alerts about system performance, battery, and technical issues.
      </p>

      {lastSeen && (
        <p style={{ marginTop: "8px", color: "#999", fontSize: "14px" }}>
          Last seen: {lastSeen} {deviceId && `(${deviceId})`}
        </p>
      )}

      <h2 style={sectionTitleStyle}>Status</h2>
      <div style={cardStyle}>
        {offline ? (
          <span style={alertBadgeStyle}>Device offline</span>
        ) : (
          <span style={okBadgeStyle}>Device online</span>
        )}
        {battery_pct != null && (
          <span style={lowBattery === 1 ? alertBadgeStyle : okBadgeStyle}>
            Battery: {battery_pct}%
            {lowBattery === 1 && " (Low)"}
            {predictedHoursLeft != null && predictedHoursLeft > 0 && ` • ~${predictedHoursLeft}h left`}
            {dischargeRate != null && dischargeRate > 0 && ` • ${dischargeRate}%/hr discharge`}
          </span>
        )}
        {raw.tempC != null && (
          <span style={highTemp === 1 ? alertBadgeStyle : okBadgeStyle}>
            Temperature: {raw.tempC}°C
          </span>
        )}
      </div>

      {failureMessages.length > 0 && (
        <>
          <h2 style={sectionTitleStyle}>Active issues</h2>
          <div style={cardStyle}>
            {failureMessages.map((msg) => (
              <span key={msg} style={alertBadgeStyle}>
                {msg}
              </span>
            ))}
          </div>
        </>
      )}

      {alertsActive.length > 0 && (
        <>
          <h2 style={sectionTitleStyle}>Active alerts</h2>
          <div style={cardStyle}>
            {alertsActive.map((alert) => (
              <span key={alert} style={alertBadgeStyle}>
                {alert}
              </span>
            ))}
          </div>
        </>
      )}

      <h2 style={sectionTitleStyle}>Alert history</h2>
      {alertLog.length === 0 ? (
        <p style={{ color: "#888" }}>No alert history yet.</p>
      ) : (
        <div style={{ marginTop: "8px" }}>
          {alertLog.map((entry) => (
            <div key={entry.id || entry.time} style={cardStyle}>
              <strong>{entry.message}</strong>
              <div style={{ color: "#aaa", marginTop: "6px", fontSize: "14px" }}>
                {entry.time}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
