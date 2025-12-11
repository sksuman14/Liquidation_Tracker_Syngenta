// src/components/Sidebar.jsx
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

const ROLE_COLORS = {
  TSM: { primary: "#ea580c", secondary: "#f97316", accent: "#fbbf24" },
  AM:  { primary: "#fb923c", secondary: "#fdba74", accent: "#fdba74" },
  ZM:  { primary: "#7c3aed", secondary: "#8b5cf6", accent: "#a78bfa" },
  NSM: { primary: "#6d28d9", secondary: "#8b5cf6", accent: "#a78bfa" },
  CM:  { primary: "#166534", secondary: "#22c55e", accent: "#86efac" }
};

export default function Sidebar({ onMobileClose, onRoleAccessDenied }) {
  const navigate = useNavigate();
  const currentRole = localStorage.getItem("userRole") || "TSM";

  const colors = ROLE_COLORS[currentRole] || ROLE_COLORS.CM;

  const currentPath = window.location.pathname.split("/")[1]?.toUpperCase();

  const isActive = (role) => {
    const short = role.split(" ")[0];
    return short === currentPath || short === currentRole;
  };

  const handleRoleClick = (role) => {
    const shortRole = role.split(" ")[0];
    if (shortRole === currentRole) {
      navigate(`/${shortRole.toLowerCase()}`);
      onMobileClose?.();
    } else {
      onRoleAccessDenied?.(shortRole);
      onMobileClose?.();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <div 
      className="sidebar"
      style={{
        background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary}dd)`,
        borderRight: `4px solid ${colors.accent}`
      }}
    >
      <h2 className="sidebar-title" style={{ color: "white" }}>
        Approval Levels
      </h2>

      <ul>
        {["TSM", "AM", "ZM", "NSM", "CM / NMM"].map((role) => (
          <li
            key={role}
            onClick={() => handleRoleClick(role)}
            className={isActive(role) ? "active-role" : ""}
            style={{
              background: isActive(role) ? "rgba(255,255,255,0.25)" : "transparent",
              borderLeft: isActive(role) ? `4px solid white` : "none"
            }}
          >
            <span style={{ color: "white", fontWeight: isActive(role) ? "bold" : "normal" }}>
              {role}
            </span>
            {isActive(role) && <div className="active-indicator" style={{ background: "white" }} />}
          </li>
        ))}
      </ul>

      <div className="logout-container">
        <button 
          className="logout-btn" 
          onClick={handleLogout}
          style={{
            backgroundColor: "#dc2626",
            boxShadow: "0 8px 20px rgba(220,38,38,0.4)"
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}