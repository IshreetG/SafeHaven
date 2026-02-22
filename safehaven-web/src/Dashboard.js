// SafeHaven Full Dashboard.js

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

const API_BASE = "http://localhost:5000";

export default function Dashboard() {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");

    async function fetchSensors() {
      try {
        const res = await fetch(`${API_BASE}/api/sensors`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to load sensors");
        const data = await res.json();
        if (!cancelled) setSensorData(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load sensor data");
          setSensorData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSensors();
    return () => { cancelled = true; };
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
      ) : error ? (
        <p style={{ marginTop: "20px", color: "#e74c3c" }}>{error}</p>
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={loginContainerStyle}>
      <form style={formStyle} onSubmit={handleSubmit}>
        <h2>Welcome to SafeHaven!</h2>
        {error && (
          <div style={{ color: "#e74c3c", marginBottom: "10px" }}>{error}</div>
        )}
        <input
          type="text"
          placeholder="Username"
          style={inputStyle}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          style={inputStyle}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          style={loginButtonStyle}
          disabled={loading}
          onMouseEnter={(e) =>
            !loading && Object.assign(e.target.style, loginButtonHoverStyle)
          }
          onMouseLeave={(e) =>
            Object.assign(e.target.style, loginButtonStyle)
          }
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

// ======= Logs Page =======

const API_BASE_LOGS = "http://localhost:5000";

export function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");

    async function fetchLogs() {
      try {
        const res = await fetch(`${API_BASE_LOGS}/api/logs`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to load logs");
        const data = await res.json();
        if (!cancelled) setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load alert logs");
          setLogs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLogs();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      <h1>Alert Log</h1>
      <p style={{ color: "#bbb" }}>Historical records of alerts and sensor events</p>
      {loading ? (
        <p style={{ marginTop: "20px", color: "#aaa" }}>Loading alert logs...</p>
      ) : error ? (
        <p style={{ marginTop: "20px", color: "#e74c3c" }}>{error}</p>
      ) : (
        <ul style={{ marginTop: "20px", listStyle: "none", paddingLeft: 0 }}>
          {logs.map((log) => (
            <li key={log.id} style={{ backgroundColor: "#2e2e3e", padding: "12px", borderRadius: "8px", marginBottom: "10px" }}>
              <strong>{log.message}</strong>
              <div style={{ color: "#999", fontSize: "14px" }}>{log.time}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}