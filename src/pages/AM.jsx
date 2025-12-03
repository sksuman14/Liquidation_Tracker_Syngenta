// src/pages/AM.jsx → FINAL PERFECTION WITH + ADD PRODUCT (2025)
import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import DataTable from "../components/DataTable";

export default function AM() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = localStorage.getItem("username") || "AM User";
  localStorage.setItem("userRole", "AM");
  const currentRole = "AM";

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/server/completed");
      if (!response.ok) throw new Error("Server error");

      const allRecords = await response.json();
      const amPending = allRecords.filter(record => record.status === "approved_by_tsm");

      setData(amPending);
    } catch (err) {
      console.error("AM fetch error:", err);
      alert("Failed to load AM dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (record) => {
    if (!window.confirm("Approve this record as Area Manager (AM)?\nIt will be sent to ZM.")) return;

    try {
      const res = await fetch("/api/server/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: record.phone_number,
          record_date: record.record_date,
          role: "AM",
          user: currentUser
        })
      });

      const result = await res.json();
      if (result.success) {
        alert("Approved by AM! Record sent to ZM");
        fetchRequests();
      } else {
        alert("Error: " + (result.error || "Approval failed"));
      }
    } catch (err) {
      alert("Network error");
    }
  };

  // EDIT MODAL — FULLY POWERFUL & CONSISTENT
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
      const res = await fetch("/api/server/edit", {
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
      background: "#ea580c",
      color: "white",
      padding: "10px 22px",
      borderRadius: 40,
      fontWeight: "bold",
      fontSize: 13,
      boxShadow: "0 6px 20px rgba(234,88,12,0.3)"
    }}>
      PENDING AM APPROVAL
    </span>
  );

  return (
    <DashboardLayout title="AM - Area Manager Dashboard">
      <div style={{ padding: 28 }}>
        <h2 style={{ color: "#ea580c", fontSize: 30, marginBottom: 8 }}>
          Pending AM Approval ({data.length})
        </h2>
        <p style={{ color: "#666", marginBottom: 32, fontSize: 16 }}>
          <strong>{currentUser}</strong> — Review records approved by TSM
        </p>

        {loading && (
          <div style={{ textAlign: "center", padding: 100, color: "#94a3b8" }}>
            Loading pending records...
          </div>
        )}

        {!loading && data.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: 130,
            background: "#fff7ed",
            borderRadius: 24,
            color: "#c2410c",
            fontSize: 24,
            fontWeight: "bold"
          }}>
            No records pending your approval
          </div>
        )}

        {!loading && data.length > 0 && (
          <DataTable
            data={data}
            showActions={true}
            onApprove={handleApprove}
            onEdit={openEditModal}
            canApprove={() => true}
            canEdit={() => true}
            currentRole="AM"
            currentUser={currentUser}
            getStatusBadge={getStatusBadge}
          />
        )}
      </div>

      {/* GORGEOUS & FULLY ALIGNED EDIT MODAL */}
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

            <h4 style={{ margin: "28px 0 16px 0", color: "#ea580c" }}>Products</h4>
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