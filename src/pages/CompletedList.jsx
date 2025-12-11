// src/pages/ApprovalDashboard.jsx → FINAL 2025: Clean View-Only Complete List (No Approve/Edit)
import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import DataTable from "../components/DataTable";
import { getSubordinateTAMobiles } from "../data/hierarchy";
import { downloadCSV } from "../utils/downloadCSV";

export default function ApprovalDashboard() {
  const [allRecords, setAllRecords] = useState([]);
  const [displayedRecords, setDisplayedRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = localStorage.getItem("userName") || "User";
  const currentRole = localStorage.getItem("userRole") || "TA";
  const userMobile = localStorage.getItem("userMobile");

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/completed");
      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      // Hierarchy filtering — show only your team's records
      const allowedTAs = getSubordinateTAMobiles(userMobile, currentRole);
      const myTeamRecords = data.filter(r =>
        r.phone_number && allowedTAs.includes(r.phone_number)
      );

      setAllRecords(myTeamRecords);
    } catch (err) {
      console.error(err);
      setError("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = allRecords.filter(r => r.record_date === selectedDate);
    setDisplayedRecords(filtered);
  }, [allRecords, selectedDate]);

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 60000);
    return () => clearInterval(interval);
  }, []);

  

  return (
    <DashboardLayout title="Complete Records View">
      <div style={{ padding: "24px 20px" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{
            fontSize: 40,
            background: "linear-gradient(90deg, #1e293b, #475569, #64748b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "900",
          }}>
            Complete Liquidation Records
          </h1>
          <p style={{ fontSize: 18, color: "#1e293b" }}>
            Logged in as: <strong style={{ color: "#1e40af" }}>{currentUser}</strong> ({currentRole})
          </p>
        </div>

        {/* DATE + CSV */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          marginBottom: 32
        }}>
          <div>
            <label style={{ fontSize: 18, fontWeight: "bold", marginRight: 12 }}>
              Select Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "2px solid #3b82f6",
                background: "#eff6ff",
                fontSize: 16
              }}
            />
          </div>

          <button
            onClick={() => downloadCSV(displayedRecords, selectedDate, "Complete_Records_Report")}
            disabled={loading || displayedRecords.length === 0}
            style={{
              padding: "14px 36px",
              background: displayedRecords.length === 0
                ? "#94a3b8"
                : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "white",
              border: "none",
              borderRadius: 16,
              fontSize: 17,
              fontWeight: "bold",
              cursor: displayedRecords.length === 0 ? "not-allowed" : "pointer",
              boxShadow: "0 10px 30px rgba(59,130,246,0.4)"
            }}
          >
            Download CSV ({displayedRecords.length} records)
          </button>
        </div>

        {/* TABLE */}
        <section>
          <h2 style={{ color: "#1e293b", fontSize: 26, marginBottom: 20, fontWeight: "bold" }}>
            All Team Records — {selectedDate} ({displayedRecords.length})
          </h2>

          {loading && (
            <div style={{ textAlign: "center", padding: 140, color: "#64748b" }}>
              Loading records...
            </div>
          )}

          {error && (
            <div style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: 20,
              borderRadius: 16,
              textAlign: "center",
              marginBottom: 24
            }}>
              {error}
              <button onClick={fetchRecords} style={{
                marginLeft: 16,
                padding: "10px 20px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: "bold"
              }}>
                Retry
              </button>
            </div>
          )}

          {!loading && displayedRecords.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: 160,
              background: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
              borderRadius: 32,
              border: "3px dashed #94a3b8",
              color: "#475569",
              fontSize: 28,
              fontWeight: "bold"
            }}>
              No records found for {selectedDate}
            </div>
          )}

          {!loading && displayedRecords.length > 0 && (
            <DataTable
              data={displayedRecords}
              showActions={false}           // No approve/edit
            
            />
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}