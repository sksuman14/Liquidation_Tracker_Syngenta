// src/pages/CM.jsx → FINAL VIEW-ONLY DASHBOARD FOR CM (2025)
import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import DataTable from "../components/DataTable";

export default function CM() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = localStorage.getItem("username") || "Country Manager";
  localStorage.setItem("userRole", "CM");

  const fetchFinalizedRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/completed");
      if (!response.ok) throw new Error("Failed to fetch records");

      const allRecords = await response.json();
      const finalized = allRecords.filter(record => 
        record.status === "fully_approved"
      );

      setData(finalized);
    } catch (err) {
      console.error("CM Dashboard Error:", err);
      alert("Failed to load finalized records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinalizedRecords();
    const interval = setInterval(fetchFinalizedRecords, 90000); // Refresh every 90s
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => (
    <span style={{
      background: "linear-gradient(135deg, #166534, #22c55e)",
      color: "white",
      padding: "14px 28px",
      borderRadius: 40,
      fontWeight: "bold",
      fontSize: 14,
      letterSpacing: "1.2px",
      boxShadow: "0 8px 25px rgba(34, 197, 94, 0.35)",
      border: "2px solid #22c55e"
    }}>
      FINALIZED
    </span>
  );

  return (
    <DashboardLayout >
      <div style={{ }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ 
            fontSize: 36, 
            color: "#166534", 
            margin: "0 0 12px 0",
            fontWeight: "800"
          }}>
            Finalized Liquidation Records
          </h1>
          <p style={{ fontSize: 18, color: "#475569", margin: 0 }}>
            Welcome, <strong>{currentUser}</strong> — These records are permanently approved and closed.
          </p>
        </div>

        
 <div style={{ marginTop: 32 }}></div>
        {loading && (
          <div style={{ 
            textAlign: "center", 
            padding: 120, 
            color: "#94a3b8", 
            fontSize: 18 
          }}>
            Loading finalized records...
          </div>
        )}

        {!loading && data.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: 140,
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
            borderRadius: 28,
            border: "2px dashed #86efac",
            color: "#166534",
            fontSize: 26,
            fontWeight: "bold"
          }}>
            No finalized records yet
          </div>
        )}

        {!loading && data.length > 0 && (
          <DataTable
            data={data}
            showActions={false}  // ← Critical: No approve/edit buttons
            currentRole="CM"
            currentUser={currentUser}
            getStatusBadge={getStatusBadge}
            // No onApprove, onEdit passed → completely read-only
          />
        )}

       
      </div>
    </DashboardLayout>
  );
}