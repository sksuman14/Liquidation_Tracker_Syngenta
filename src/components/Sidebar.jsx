// Sidebar.jsx
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar({ onMobileClose, onRoleAccessDenied }) {
  const navigate = useNavigate();
  const currentRole = localStorage.getItem("userRole");
  // Add this line inside Sidebar
const currentPath = window.location.pathname.split("/")[1]?.toUpperCase();
const isActive = (role) => {
  const short = role.split(" ")[0];
  return short === currentPath || short === currentRole;
};

  const handleRoleClick = (role) => {
    const shortRole = role.split(" ")[0]; // "CM / NMM" → "CM"

    if (shortRole === currentRole) {
      navigate(`/${shortRole.toLowerCase()}`);
      onMobileClose?.();
    } else {
      // Trigger access denied popup from parent
      onRoleAccessDenied?.(shortRole);
      onMobileClose?.();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Approval Levels</h2>

      <ul>
        {["TA", "TSM", "AM", "ZM", "NSM", "CM / NMM"].map((role) => (
         <li
  key={role}
  onClick={() => handleRoleClick(role)}
  className={isActive(role) ? "active-role" : ""}
>
  <span>{role}</span>
  {isActive(role) && <div className="active-indicator" />}
</li>
        ))}
      </ul>

      <div className="logout-container">
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}