// src/pages/CM.jsx → FINAL & FIXED CSV DOWNLOAD (Phone numbers with 91 preserved)
import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import DataTable from "../components/DataTable";

export default function CM() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = localStorage.getItem("userName") || "Country Manager";

  const fetchFinalizedRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/completed");
      if (!response.ok) throw new Error("Failed to fetch records");
      const allRecords = await response.json();
      const finalized = allRecords.filter(record => record.status === "fully_approved");
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
    const interval = setInterval(fetchFinalizedRecords, 90000);
    return () => clearInterval(interval);
  }, []);

  // FIXED CSV DOWNLOAD — PRESERVES 91 in phone numbers
  const downloadCSV = () => {
    if (data.length === 0) {
      alert("No records to download");
      return;
    }

    const headers = [
      "Phone Number", "Employee Name", "HQ", "Zone", "Area", "Date",
      "Product Family", "Product Name", "SKU", "Opening Stock", "Liq. Qty"
    ];

    const rows = data.flatMap(record =>
      (record.products || []).map(p => [
        record.phone_number,                    // ← Full number with 91
        record.employee_name || "",
        record.hq || "",
        record.zone || "",
        record.area || "",
        record.record_date || "",
        p.family || "",
        p.productName || p.product_name || "",
        p.sku || "",
        p.openingStock || p.opening_qty || 0,
        p.liquidationQty || p.liquidation_qty || 0
      ])
    );

    // THIS LINE IS THE KEY: Force phone number to stay as text
    const csvContent = [
      headers.join(","),
      ...rows.map(row =>
        row.map(cell => {
          const str = String(cell);
          // If it's a phone number (starts with 91 and 12 digits), wrap in quotes and prefix with = to force text
          if (/^91\d{10}$/.test(str)) {
            return `="${str}"`;
          }
          return `"${str}"`;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // BOM for Hindi/Unicode
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Liquidation_Finalized_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = () => (
    <span style={{
      background: "linear-gradient(135deg, #166534, #22c55e)",
      color: "white",
      padding: "14px 32px",
      borderRadius: 50,
      fontWeight: "900",
      fontSize: 15,
      letterSpacing: "1.5px",
      boxShadow: "0 10px 30px rgba(34, 197, 94, 0.4)",
    }}>
      FINALIZED
    </span>
  );

  return (
    <DashboardLayout title="CM - Country Manager Dashboard">
      <div style={{ padding: "24px 20px" }}>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{
            fontSize: 40,
            background: "linear-gradient(90deg, #166534, #22c55e)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "900",
            margin: "0 0 12px 0",
          }}>
            Finalized Liquidation Records
          </h1>
          <p style={{ fontSize: 19, color: "#1e293b", margin: 0 }}>
            Welcome, <strong style={{ color: "#166534", fontWeight: "bold" }}>{currentUser}</strong>
          </p>
        </div>

        <div style={{ textAlign: "right", marginBottom: 24 }}>
          <button
            onClick={downloadCSV}
            disabled={loading || data.length === 0}
            style={{
              padding: "14px 36px",
              background: data.length === 0 ? "#94a3b8" : "linear-gradient(135deg, #166534, #22c55e)",
              color: "white",
              border: "none",
              borderRadius: 16,
              fontSize: 17,
              fontWeight: "bold",
              cursor: data.length === 0 ? "not-allowed" : "pointer",
              boxShadow: "0 8px 25px rgba(34, 197, 94, 0.3)",
            }}
          >
            Download CSV ({data.length} records)
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "140px", color: "#64748b", fontSize: 20 }}>
            Loading finalized records...
          </div>
        )}

        {!loading && data.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: 160,
            background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
            borderRadius: 32,
            border: "3px dashed #86efac",
            color: "#166534",
            fontSize: 28,
            fontWeight: "bold"
          }}>
            No finalized records yet
          </div>
        )}

        {!loading && data.length > 0 && (
          <DataTable
            data={data}
            showActions={false}
            currentRole="CM"
            currentUser={currentUser}
            getStatusBadge={getStatusBadge}
          />
        )}
      </div>
    </DashboardLayout>
  );
}