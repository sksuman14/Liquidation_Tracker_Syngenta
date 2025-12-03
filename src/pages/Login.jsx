import React, { useState } from "react";
import { users } from "../services/users";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Add this for styling

export default function Login() {
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = () => {
    const found = users.find(
      (u) => u.email === email.trim() && u.mobile === mobile.trim()
    );

    if (found) {
      localStorage.setItem("userName", found.name);
      localStorage.setItem("userRole", found.role);
      navigate("/dashboard", { replace: true });

    } else {
      setError("Invalid email or mobile number");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">Liquidation Dashboard</h2>
        <p className="login-subtitle">Sign in with your official credentials</p>

        <input
          type="email"
          className="login-input"
          placeholder="Official Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="text"
          className="login-input"
          placeholder="Mobile Number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />

        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}
