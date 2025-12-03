import React from "react";
import { Navigate } from "react-router-dom";

export default function RoleBasedDashboard() {
  const role = localStorage.getItem("userRole");

  if (role === "TA") return <Navigate to="/ta" />;
  if (role === "TSM") return <Navigate to="/tsm" />;
  if (role === "AM") return <Navigate to="/am" />;
  if (role === "ZM") return <Navigate to="/zm" />;
  if (role === "NSM") return <Navigate to="/nsm" />;
  if (role === "CM") return <Navigate to="/cm" />;

  return <h2>No role found</h2>;
}
