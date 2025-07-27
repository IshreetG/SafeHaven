import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard, { Login, Logs } from "./Dashboard"; 
import Notifications from "./Notifications";

const appStyle = {
  backgroundColor: "#1e1e2f",
  color: "#f0f0f0",
  minHeight: "100vh",
  margin: 0,
  fontFamily: "Segoe UI, sans-serif",
};

const navbarStyle = {
  backgroundColor: "#29293d",
  padding: "12px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #444",
};

const navItemStyle = {
  color: "#f0f0f0",
  marginLeft: "20px",
  textDecoration: "none",
  fontWeight: "500",
  transition: "color 0.3s, text-shadow 0.3s",
};

const navItemHoverStyle = {
  color: "#ffffff",
  textShadow: "0 0 8px #ffffff",
};


function App() {
  return (
    <Router>
      <div style={appStyle}>
        <header style={navbarStyle}>
          <div style={{ fontSize: "20px", fontWeight: "bold" }}>SafeHaven</div>
          <nav>
            <Link to="/"style={navItemStyle}onMouseEnter={(e) =>Object.assign(e.target.style, navItemHoverStyle)}
              onMouseLeave={(e) =>
              Object.assign(e.target.style, navItemStyle)}>Login </Link>
            <Link to="/dashboard"style={navItemStyle}onMouseEnter={(e) =>Object.assign(e.target.style, navItemHoverStyle)}
              onMouseLeave={(e) =>
              Object.assign(e.target.style, navItemStyle)}>Dashboard </Link>
            <Link to="/logs"style={navItemStyle}onMouseEnter={(e) =>Object.assign(e.target.style, navItemHoverStyle)}
              onMouseLeave={(e) =>
              Object.assign(e.target.style, navItemStyle)}>Logs </Link>
            <Link to="/notifications"style={navItemStyle}onMouseEnter={(e) =>Object.assign(e.target.style, navItemHoverStyle)}
              onMouseLeave={(e) =>
              Object.assign(e.target.style, navItemStyle)}>Notifications </Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;