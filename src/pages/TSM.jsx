// src/pages/TSM.jsx → FINAL PERFECTION WITH + ADD PRODUCT BUTTON (2025)
import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import DataTable from "../components/DataTable";

export default function TSM() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = localStorage.getItem("username") || "TSM User";
  localStorage.setItem("userRole", "TSM");
  const currentRole = "TSM";

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("http://localhost:5000/api/completed");
      if (!response.ok) throw new Error("Failed to fetch records");

      const result = await response.json();
      const tsmPending = result.filter(record => record.status === "approved_by_ta");

      setData(tsmPending);
    } catch (err) {
      setError("Failed to load TSM dashboard. Is server running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (record) => {
    if (!window.confirm("Approve this record as Territory Sales Manager (TSM)?")) return;

    try {
      const res = await fetch("http://localhost:5000/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: record.phone_number,
          record_date: record.record_date,
          role: "TSM",
          user: currentUser
        })
      });

      const result = await res.json();
      if (result.success) {
        alert("Approved by TSM! Record sent to AM");
        fetchRequests();
      } else {
        alert("Error: " + (result.error || "Unknown"));
      }
    } catch (err) {
      alert("Network error");
    }
  };

  // EDIT MODAL STATE
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    employee_name: "", hq: "", zone: "", area: "", products: []
  });

  const openEditModal = (record) => {
    setEditingRecord(record);
    setEditForm({
      employee_name: record.employee_name || "",
      hq: record.hq || "",
      zone: record.zone || "",
      area: record.area || "",
      products: JSON.parse(JSON.stringify(record.products || []))
    });
  };

  const saveEdit = async () => {
    if (!editingRecord) return;

    try {
      const res = await fetch("http://localhost:5000/api/edit", {
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
        fetchRequests();
      } else {
        alert("Edit failed: " + result.error);
      }
    } catch (err) {
      alert("Save failed");
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => (
    <span style={{
      background: "#f59e0b",
      color: "white",
      padding: "10px 22px",
      borderRadius: 40,
      fontWeight: "bold",
      fontSize: 13,
      boxShadow: "0 6px 20px rgba(245,158,11,0.3)"
    }}>
      PENDING TSM APPROVAL
    </span>
  );

  return (
    <DashboardLayout title="TSM - Territory Sales Manager Dashboard">
      <div style={{ padding: 28 }}>
        <h2 style={{ color: "#d97706", fontSize: 30, marginBottom: 8 }}>
          Pending TSM Approval ({data.length})
        </h2>
        <p style={{ color: "#666", marginBottom: 32, fontSize: 16 }}>
          <strong>{currentUser}</strong> — Review records approved by TA
        </p>

        {loading && (
          <div style={{ textAlign: "center", padding: 100, color: "#94a3b8" }}>
            Loading TSM requests...
          </div>
        )}

        {error && (
          <div style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: 16,
            borderRadius: 12,
            marginBottom: 20,
            textAlign: "center"
          }}>
            {error}
            <button onClick={fetchRequests} style={{ marginLeft: 12, padding: "8px 16px", background: "#dc2626", color: "white", border: "none", borderRadius: 6 }}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: 130,
            background: "#fffbeb",
            borderRadius: 24,
            color: "#92400e",
            fontSize: 24,
            fontWeight: "bold"
          }}>
            No records pending TSM approval
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <DataTable
            data={data}
            showActions={true}
            onApprove={handleApprove}
            onEdit={openEditModal}
            canApprove={() => true}
            canEdit={() => true}
            currentRole="TSM"
            currentUser={currentUser}
            getStatusBadge={getStatusBadge}
          />
        )}
      </div>

      {/* FULLY ALIGNED & GORGEOUS EDIT MODAL */}
      {editingRecord && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: "white",
            borderRadius: 20,
            width: "100%",
            maxWidth: "1200px",
            maxHeight: "92vh",
            overflow: "auto",
            padding: 40,
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)"
          }}>
            <h3 style={{ margin: "0 0 32px 0", fontSize: 28, color: "#1e293b" }}>
              Edit Record → {editingRecord.phone_number}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
              <input
                placeholder="Employee Name"
                value={editForm.employee_name}
                onChange={e => setEditForm({ ...editForm, employee_name: e.target.value })}
                style={{ padding: 16, borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 }}
              />
              <input
                placeholder="HQ"
                value={editForm.hq}
                onChange={e => setEditForm({ ...editForm, hq: e.target.value })}
                style={{ padding: 16, borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 }}
              />
              <input
                placeholder="Zone"
                value={editForm.zone}
                onChange={e => setEditForm({ ...editForm, zone: e.target.value })}
                style={{ padding: 16, borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 }}
              />
              <input
                placeholder="Area"
                value={editForm.area}
                onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                style={{ padding: 16, borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 }}
              />
            </div>

            <h4 style={{ margin: "28px 0 16px 0", color: "#d97706" }}>Products</h4>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", marginBottom: 28 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#fed7aa" }}>
                  <tr>
                    <th style={{ padding: "18px", textAlign: "left" }}>Product Name</th>
                    <th style={{ padding: "18px", textAlign: "left" }}>SKU</th>
                    <th style={{ padding: "18px", textAlign: "center" }}>Opening Stock</th>
                    <th style={{ padding: "18px", textAlign: "center" }}>Liq. Qty</th>
                    <th style={{ padding: "18px", textAlign: "center", width: 130 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {editForm.products.map((p, i) => (
                    <tr key={i} style={{ borderBottom: i !== editForm.products.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                      <td style={{ padding: "14px" }}>
                        <input
                          value={p.productName || p.product_name || ""}
                          onChange={e => {
                            const np = [...editForm.products];
                            np[i].productName = e.target.value;
                            setEditForm({ ...editForm, products: np });
                          }}
                          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1" }}
                        />
                      </td>
                      <td style={{ padding: "14px" }}>
                        <input
                          value={p.sku || ""}
                          onChange={e => {
                            const np = [...editForm.products];
                            np[i].sku = e.target.value;
                            setEditForm({ ...editForm, products: np });
                          }}
                          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1" }}
                        />
                      </td>
                      <td style={{ padding: "14px" }}>
                        <input
                          type="number"
                          value={p.openingStock || p.opening_qty || 0}
                          onChange={e => {
                            const np = [...editForm.products];
                            np[i].openingStock = Number(e.target.value);
                            setEditForm({ ...editForm, products: np });
                          }}
                          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1" }}
                        />
                      </td>
                      <td style={{ padding: "14px" }}>
                        <input
                          type="number"
                          value={p.liquidationQty || p.liquidation_qty || 0}
                          onChange={e => {
                            const np = [...editForm.products];
                            np[i].liquidationQty = Number(e.target.value);
                            setEditForm({ ...editForm, products: np });
                          }}
                          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1" }}
                        />
                      </td>
                      <td style={{ padding: "14px", textAlign: "center" }}>
                        <button
                          onClick={() => setEditForm({
                            ...editForm,
                            products: editForm.products.filter((_, idx) => idx !== i)
                          })}
                          style={{
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            padding: "12px 20px",
                            borderRadius: 10,
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

            {/* + ADD PRODUCT BUTTON */}
            <button
              onClick={() => setEditForm({
                ...editForm,
                products: [...editForm.products, {
                  sku: "",
                  productName: "",
                  openingStock: 0,
                  liquidationQty: 0
                }]
              })}
              style={{
                padding: "16px 32px",
                background: "#ea580c",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontWeight: "bold",
                fontSize: 16,
                marginBottom: 32,
                cursor: "pointer"
              }}
            >
              + Add Product
            </button>

            <div style={{ textAlign: "right" }}>
              <button
                onClick={saveEdit}
                style={{
                  padding: "18px 44px",
                  background: "#059669",
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 17,
                  fontWeight: "bold",
                  marginRight: 16
                }}
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingRecord(null)}
                style={{
                  padding: "18px 44px",
                  background: "#64748b",
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 17
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