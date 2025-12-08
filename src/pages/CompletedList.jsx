// src/pages/ApprovalDashboard.jsx → FINAL UPGRADED WITH FAMILY COLUMN + BEAUTIFUL UI
import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import DataTable from "../components/DataTable";
import { getSubordinateTAMobiles } from "../data/hierarchy"; // Import helper

export default function ApprovalDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);

  const [editForm, setEditForm] = useState({
    employee_name: "",
    hq: "",
    zone: "",
    area: "",
    products: []
  });

  const currentRole = localStorage.getItem("userRole") || "TA";
  const currentUser = localStorage.getItem("username") || "User";
  const userMobile = localStorage.getItem("userMobile"); // For filtering

  const roleOrder = { TSM: 1, AM: 2, ZM: 3, NSM: 4, CM: 5 };
const currentLevel = roleOrder[currentRole] || 0;

  const statusToLevel = {
  pending_tsm: 1,
  approved_by_tsm: 2,
  approved_by_am: 3,
  approved_by_zm: 4,
  approved_by_nsm: 5,
  fully_approved: 6
};

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/completed");
      const data = await res.json();
      // HIERARCHY FILTERING
      const allowedTAMobiles = getSubordinateTAMobiles(userMobile, currentRole);
      const filtered = allData.filter(record =>
        allowedTAMobiles.includes(record.phone_number.slice(2)) // "91" + mobile
      );
      setRecords(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (record) => {
    if (!window.confirm(`Approve as ${currentRole}?`)) return;

    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: record.phone_number,
          record_date: record.record_date,
          role: currentRole,
          user: currentUser
        })
      });

      const result = await res.json();
      if (result.success) {
        alert(`Approved by ${currentRole}!`);
        fetchRecords();
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const openFullEdit = (record) => {
    setEditingRecord(record);
    setEditForm({
      employee_name: record.employee_name || "",
      hq: record.hq || "",
      zone: record.zone || "",
      area: record.area || "",
      products: JSON.parse(JSON.stringify(record.products || []))
    });
  };

  const saveFullEdit = async () => {
    if (!editingRecord) return;

    try {
      const res = await fetch("/api/edit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: editingRecord.phone_number,
          record_date: editingRecord.record_date,
          role: currentRole,
          username: currentUser,
          employee_name: editForm.employee_name,
          hq: editForm.hq,
          zone: editForm.zone,
          area: editForm.area,
          products: editForm.products
        })
      });

      const result = await res.json();
      if (result.success) {
        alert("Record updated successfully!");
        setEditingRecord(null);
        fetchRecords();
      } else {
        alert("Edit failed: " + result.error);
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const canApprove = (status) => {
    if (status === "fully_approved") return false;
    return statusToLevel[status] === currentLevel;
  };

  const getStatusBadge = (status) => {
    const map = {
   pending_tsm: { text: "Pending TSM", color: "#f59e0b" },
  approved_by_tsm: { text: "TSM Approved", color: "#10b981" },
      approved_by_am: { text: "AM Approved", color: "#10b981" },
      approved_by_zm: { text: "ZM Approved", color: "#10b981" },
      approved_by_nsm: { text: "NSM Approved", color: "#10b981" },
      fully_approved: { text: "Fully Approved", color: "#7c3aed" }
    };
    const s = map[status] || { text: status, color: "#666" };
    return (
      <span style={{
        background: s.color,
        color: "white",
        padding: "6px 12px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: "bold"
      }}>
        {s.text}
      </span>
    );
  };

  if (loading) return <DashboardLayout title="Approval Dashboard"><p>Loading records...</p></DashboardLayout>;

  return (
    <DashboardLayout title="Liquidation Approval Dashboard">
      <div style={{ padding: 20 }}>
        <h2 style={{ margin: 0, fontSize: 28, color: "#1e293b" }}>All Records ({records.length})</h2>
        <p style={{ margin: "8px 0", color: "#64748b" }}>
          Logged in as: <strong>{currentUser}</strong> ({currentRole})
        </p>

        <DataTable
          data={records}
          showActions={true}
          currentRole={currentRole}
          onApprove={handleApprove}
          onEdit={openFullEdit}
          canApprove={canApprove}
          getStatusBadge={getStatusBadge}
        />
      </div>

      {/* FULL EDIT MODAL - UPGRADED WITH FAMILY COLUMN */}
      {editingRecord && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{
            background: "white",
            borderRadius: 16,
            width: "95%",
            maxWidth: "1200px",
            maxHeight: "92vh",
            overflow: "auto",
            padding: 32,
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)"
          }}>
            <h3 style={{ margin: "0 0 24px 0", fontSize: 26, color: "#1e293b" }}>
              Edit Record → {editingRecord.phone_number}
            </h3>

            {/* Employee Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
              <input placeholder="Employee Name" value={editForm.employee_name} onChange={(e) => setEditForm({...editForm, employee_name: e.target.value})} style={{ padding: 14, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 15 }} />
              <input placeholder="HQ" value={editForm.hq} onChange={(e) => setEditForm({...editForm, hq: e.target.value})} style={{ padding: 14, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 15 }} />
              <input placeholder="Zone" value={editForm.zone} onChange={(e) => setEditForm({...editForm, zone: e.target.value})} style={{ padding: 14, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 15 }} />
              <input placeholder="Area" value={editForm.area} onChange={(e) => setEditForm({...editForm, area: e.target.value})} style={{ padding: 14, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 15 }} />
            </div>

            {/* Products Table - FAMILY FIRST */}
            <h4 style={{ margin: "24px 0 16px 0", color: "#ea580c", fontSize: 20 }}>Products</h4>
            <div style={{ border: "2px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#0f172a", color: "white" }}>
                  <tr>
                    <th style={{ padding: "16px", textAlign: "left" }}>Family</th>
                    <th style={{ padding: "16px", textAlign: "left" }}>Product Name</th>
                    <th style={{ padding: "16px", textAlign: "left" }}>SKU</th>
                    <th style={{ padding: "16px", textAlign: "center" }}>Opening Stock</th>
                    <th style={{ padding: "16px", textAlign: "center" }}>Liq. Qty</th>
                    <th style={{ padding: "16px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {editForm.products.map((p, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafc" : "white", borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "12px" }}>
                        <input
                          value={p.family || ""}
                          onChange={(e) => {
                            const np = [...editForm.products];
                            np[i].family = e.target.value;
                            setEditForm({ ...editForm, products: np });
                          }}
                          placeholder="PBS / WSF / MIC"
                          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #94a3b8", fontWeight: "500" }}
                        />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <input
                          value={p.productName || ""}
                          onChange={(e) => {
                            const np = [...editForm.products];
                            np[i].productName = e.target.value;
                            setEditForm({ ...editForm, products: np });
                          }}
                          placeholder="VIVA, RADIFARM"
                          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #94a3b8" }}
                        />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <input
                          value={p.sku || ""}
                          onChange={(e) => {
                            const np = [...editForm.products];
                            np[i].sku = e.target.value;
                            setEditForm({ ...editForm, products: np });
                          }}
                          placeholder="5 L, 10 Kg"
                          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #94a3b8" }}
                        />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <input
                          type="number"
                          value={p.openingStock || ""}
                          onChange={(e) => {
                            const np = [...editForm.products];
                            np[i].openingStock = e.target.value === "" ? "" : Number(e.target.value);
                            setEditForm({ ...editForm, products: np });
                          }}
                          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #94a3b8", textAlign: "center" }}
                        />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <input
                          type="number"
                          value={p.liquidationQty || ""}
                          onChange={(e) => {
                            const np = [...editForm.products];
                            np[i].liquidationQty = e.target.value === "" ? "" : Number(e.target.value);
                            setEditForm({ ...editForm, products: np });
                          }}
                          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #94a3b8", textAlign: "center" }}
                        />
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button
                          onClick={() => setEditForm({
                            ...editForm,
                            products: editForm.products.filter((_, idx) => idx !== i)
                          })}
                          style={{
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            padding: "10px 16px",
                            borderRadius: 8,
                            fontWeight: "bold",
                            cursor: "pointer"
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Product Button */}
            <button
              onClick={() => setEditForm({
                ...editForm,
                products: [...editForm.products, {
                  family: "",
                  productName: "",
                  sku: "",
                  openingStock: "",
                  liquidationQty: ""
                }]
              })}
              style={{
                padding: "14px 32px",
                background: "#ea580c",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: "bold",
                fontSize: 16,
                marginBottom: 28,
                cursor: "pointer"
              }}
            >
              + Add New Product
            </button>

            {/* Save / Cancel Buttons */}
            <div style={{ textAlign: "right" }}>
              <button
                onClick={saveFullEdit}
                style={{
                  padding: "16px 40px",
                  background: "#059669",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 17,
                  fontWeight: "bold",
                  marginRight: 16,
                  cursor: "pointer"
                }}
              >
                Save All Changes
              </button>
              <button
                onClick={() => setEditingRecord(null)}
                style={{
                  padding: "16px 40px",
                  background: "#64748b",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 17,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}