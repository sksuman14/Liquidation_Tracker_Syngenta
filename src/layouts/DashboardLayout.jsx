// src/layouts/DashboardLayout.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";   // ← ADD THIS LINE
import Sidebar from "../components/Sidebar";
import "./DashboardLayout.css";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({ title, children }) {
  const navigate = useNavigate();               // ← now it's defined
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAccessPopup, setShowAccessPopup] = useState(false);
  const [requestedRole, setRequestedRole] = useState("");

  const handleRoleAccessDenied = (role) => {
    setRequestedRole(role);
    setShowAccessPopup(true);
  };

  const confirmLoginAsRole = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <button
          className="menu-toggle-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
        <h2 className="mobile-title">{title || "Approval Dashboard"}</h2>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar-wrapper ${isMobileMenuOpen ? "open" : ""}`}>
        <Sidebar onMobileClose={closeMenu} onRoleAccessDenied={handleRoleAccessDenied} />
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={closeMenu} />}

      {/* Main Content */}
      <main className="main-content">
        <div className="content-inner">
          <h1 className="page-title-desktop">{title}</h1>
          {children}
        </div>
      </main>

      {/* Access Denied Popup – perfectly centered */}
      {showAccessPopup && (
        <div className="access-denied-overlay">
          <div className="access-denied-box">
            <h3>Access Denied</h3>
            <p>
              You must login as <strong>{requestedRole}</strong> to view this section.
            </p>
            <div className="access-denied-buttons">
              <button className="yes-btn" onClick={confirmLoginAsRole}>
                Yes, Login as {requestedRole}
              </button>
              <button className="no-btn" onClick={() => setShowAccessPopup(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}