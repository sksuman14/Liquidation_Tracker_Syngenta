// src/pages/CM.jsx → FINAL + ADD PRODUCT BUTTON (2025)
import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import DataTable from "../components/DataTable";

export default function CM() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = localStorage.getItem("username") || "CM User";
  localStorage.setItem("userRole", "CM");
  const currentRole = "CM";

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/server/api/completed");
      if (!response.ok) throw new Error("Server error");

      const allRecords = await response.json();
      const cmRecords = allRecords.filter(record => 
        record.status === "approved_by_nsm" || record.status === "fully_approved"
      );

      setData(cmRecords);
    } catch (err) {
      console.error("CM fetch error:", err);
      alert("Failed to load final approval dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (record) => {
    if (!window.confirm("FINAL APPROVAL: This record will be permanently finalized. Continue?")) return;

    try {
      const res = await fetch("/api/server/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: record.phone_number,
          record_date: record.record_date,
          role: "CM",
          user: currentUser
        })
      });

      const result = await res.json();
      if (result.success) {
        alert("FINAL APPROVAL SUCCESSFUL! Record is now permanently finalized.");
        fetchRequests();
      } else {
        alert("Error: " + (result.error || "Final approval failed"));
      }
    } catch (err) {
      alert("Network error");
    }
  };

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
      const res = await fetch("/api/server/api/edit", {
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

  const getStatusBadge = (status) => {
    if (status === "fully_approved") {
      return (
        <span style={{
          background: "#166534",
          color: "white",
          padding: "10px 22px",
          borderRadius: 24,
          fontWeight: "bold",
          fontSize: 12,
          boxShadow: "0 6px 20px rgba(22,101,52,0.4)",
          letterSpacing: "1px"
        }}>
          FINALIZED
        </span>
      );
    }
    return (
      <span style={{
        background: "#7c2d12",
        color: "white",
        padding: "10px 22px",
        borderRadius: 24,
        fontWeight: "bold",
        fontSize: 12,
        boxShadow: "0 4px 15px rgba(124,45,18,0.3)"
      }}>
        FINAL APPROVAL PENDING
      </span>
    );
  };

  return (
    <DashboardLayout title="CM / NMM - Final Approval Dashboard">
      <div style={{ padding: 28 }}>
        <h2 style={{ color: "#7c2d12", fontSize: 32, marginBottom: 10 }}>
          Final Approval Dashboard ({data.length})
        </h2>
      

        {loading && (
          <div style={{ textAlign: "center", padding: 100, color: "#94a3b8", fontSize: 18 }}>
            Loading final approval records...
          </div>
        )}

        {!loading && data.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: 140,
            background: "#fffbeb",
            borderRadius: 24,
            color: "#92400e",
            fontSize: 24,
            fontWeight: "bold"
          }}>
            No records in final approval stage
          </div>
        )}

        {!loading && data.length > 0 && (
          <DataTable
            data={data}
            showActions={true}
            onApprove={handleApprove}
            onEdit={openEditModal}
            canApprove={(row) => row.status !== "fully_approved"}
            canEdit={(row) => row.status !== "fully_approved"}
            currentRole="CM"
            currentUser={currentUser}
            getStatusBadge={getStatusBadge}
          />
        )}
      </div>

      {/* EDIT MODAL WITH + ADD PRODUCT BUTTON */}
      {editingRecord && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "white",
            borderRadius: 24,
            width: "96%",
            maxWidth: "1200px",
            maxHeight: "94vh",
            overflow: "auto",
            padding: 40,
            boxShadow: "0 30px 80px rgba(124,45,18,0.4)"
          }}>
            <h3 style={{ margin: "0 0 32px 0", fontSize: 28, color: "#1e293b" }}>
              Final Edit → {editingRecord.phone_number}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
              <input placeholder="Employee Name" value={editForm.employee_name}
                onChange={e => setEditForm({ ...editForm, employee_name: e.target.value })}
                style={{ padding: 16, borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 }} />
              <input placeholder="HQ" value={editForm.hq}
                onChange={e => setEditForm({ ...editForm, hq: e.target.value })}
                style={{ padding: 16, borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 }} />
              <input placeholder="Zone" value={editForm.zone}
                onChange={e => setEditForm({ ...editForm, zone: e.target.value })}
                style={{ padding: 16, borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 }} />
              <input placeholder="Area" value={editForm.area}
                onChange={e => setEditForm({ ...editForm, area: e.target.value })}
                style={{ padding: 16, borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 }} />
            </div>

            <h4 style={{ margin: "28px 0 16px 0", color: "#7c2d12", fontSize: 18 }}>Products</h4>
            <div style={{ maxHeight: "440px", overflowY: "auto", marginBottom: 20, border: "1px solid #e2e8f0", borderRadius: 16 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#fed7aa" }}>
                  <tr>
                    <th style={{ padding: "18px", textAlign: "left" }}>Product</th>
                    <th style={{ padding: "18px", textAlign: "left" }}>SKU</th>
                    <th style={{ padding: "18px", textAlign: "center" }}>Opening</th>
                    <th style={{ padding: "18px", textAlign: "center" }}>Liq. Qty</th>
                    <th style={{ padding: "18px", textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {editForm.products.map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td><input value={p.productName || p.product_name || ""} onChange={e => {
                        const np = [...editForm.products];
                        np[i].productName = e.target.value;
                        setEditForm({ ...editForm, products: np });
                      }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "1px solid #cbd5e1" }} /></td>
                      <td><input value={p.sku || ""} onChange={e => {
                        const np = [...editForm.products];
                        np[i].sku = e.target.value;
                        setEditForm({ ...editForm, products: np });
                      }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "1px solid #cbd5e1" }} /></td>
                      <td><input type="number" value={p.openingStock || p.opening_qty || 0} onChange={e => {
                        const np = [...editForm.products];
                        np[i].openingStock = Number(e.target.value);
                        setEditForm({ ...editForm, products: np });
                      }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "1px solid #cbd5e1" }} /></td>
                      <td><input type="number" value={p.liquidationQty || p.liquidation_qty || 0} onChange={e => {
                        const np = [...editForm.products];
                        np[i].liquidationQty = Number(e.target.value);
                        setEditForm({ ...editForm, products: np });
                      }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "1px solid #cbd5e1" }} /></td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => setEditForm({
                          ...editForm,
                          products: editForm.products.filter((_, idx) => idx !== i)
                        })} style={{ 
                          background: "#dc2626", 
                          color: "white", 
                          border: "none", 
                          padding: "12px 24px", 
                          borderRadius: 10,
                          fontWeight: "bold",
                          cursor: "pointer"
                        }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ADD PRODUCT BUTTON */}
            <button
              onClick={() => setEditForm({
                ...editForm,
                products: [...editForm.products, {
                  productName: "",
                  sku: "",
                  openingStock: 0,
                  liquidationQty: 0
                }]
              })}
              style={{
                marginBottom: 32,
                padding: "16px 36px",
                background: "#7c2d12",
                color: "white",
                border: "none",
                borderRadius: 16,
                fontSize: 17,
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              + Add Product
            </button>

            <div style={{ textAlign: "right", marginTop: 40 }}>
              <button onClick={saveEdit} style={{ padding: "20px 48px", background: "#7c2d12", color: "white", border: "none", borderRadius: 16, fontSize: 18, fontWeight: "bold" }}>
                Save Changes
              </button>
              <button onClick={() => setEditingRecord(null)} style={{ marginLeft: 20, padding: "20px 48px", background: "#64748b", color: "white", border: "none", borderRadius: 16, fontSize: 18 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}