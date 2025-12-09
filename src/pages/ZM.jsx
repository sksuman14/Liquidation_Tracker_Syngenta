// src/pages/ZM.jsx → FINAL 2025: Pending on Top + Approved at Bottom (Never Disappears)
import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import DataTable from "../components/DataTable";
import { getSubordinateTAMobiles } from "../data/hierarchy";

export default function ZM() {
  const [pending, setPending] = useState([]);      // Needs your approval
  const [approved, setApproved] = useState([]);    // Already approved by you
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

 const currentUser = localStorage.getItem("userName") || "AM";
  const currentRole = localStorage.getItem("userRole") || "AM";
  const userMobile = localStorage.getItem("userMobile");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/completed");
      if (!res.ok) throw new Error("Server error");

      const allRecords = await res.json();

      // HIERARCHY FILTER: Only show records from TAs under this AM
      const allowedTAs = getSubordinateTAMobiles(userMobile, currentRole);
      const myRecords = allRecords.filter(r =>
        r.phone_number && allowedTAs.includes(r.phone_number)
      );

      // Pending AM approval → already approved by TSM
      const pendingList = myRecords.filter(r => r.status === "approved_by_am");

      // Already approved by THIS AM (stays forever)
      const approvedByMe = myRecords.filter(r =>
        (r.approved_by || []).some(tag => tag.includes("(ZM)"))
      );

      setPending(pendingList);
      setApproved(approvedByMe);
    } catch (err) {
      console.error("ZM fetch error:", err);
      setError("Failed to load AM dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (record) => {
    if (!window.confirm("Approve this record as Zonal Manager (ZM)?\nIt will be sent to NSM.")) return;

    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: record.phone_number,
          record_date: record.record_date,
          role: "ZM",
          user: currentUser
        })
      });

      const result = await res.json();
      if (result.success) {
        alert("Approved by ZM! Record sent to NSM");
        fetchRequests();
      } else {
        alert("Error: " + (result.error || "Approval failed"));
      }
    } catch (err) {
      alert("Network error");
    }
  };

  // FULL EDIT MODAL — IDENTICAL TO ALL OTHER ROLES
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
    if (
      (status.startsWith("approved_by_") && status !== "approved_by_am") ||
      status === "fully_approved"
    ) {
      return (
        <span style={{
          background: "#10b981",
          color: "white",
          padding: "10px 22px",
          borderRadius: 40,
          fontWeight: "bold",
          fontSize: 13,
        }}>
          APPROVED BY YOU
        </span>
      );
    }
    return (
      <span style={{
        background: "#ea580c",
        color: "white",
        padding: "10px 22px",
        borderRadius: 40,
        fontWeight: "bold",
        fontSize: 13,
        boxShadow: "0 6px 20px rgba(234,88,12,0.3)"
      }}>
        PENDING YOUR APPROVAL
      </span>
    );
  };

  return (
    <DashboardLayout title="ZM - Zonal Manager Dashboard">
      <div style={{}}>

        {/* PENDING APPROVAL SECTION */}
        <section style={{ marginBottom: 60 }}>
          <h2 style={{ color: "#7c3aed", fontSize: 24, marginBottom: 16 }}>
            Pending Your Approval ({pending.length})
          </h2>
          <p style={{ color: "#666", marginBottom: 32, fontSize: 15 }}>
            <strong>{currentUser}</strong> — Final review before NSM approval
          </p>

          {loading && (
            <div style={{ textAlign: "center", padding: 100, color: "#94a3b8" }}>
              Loading ZM records...
            </div>
          )}

          {!loading && pending.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: 140,
              background: "#f3e8ff",
              borderRadius: 24,
              color: "#6b21a8",
              fontSize: 24,
              fontWeight: "bold"
            }}>
              No records pending for your approval
            </div>
          )}

          {!loading && pending.length > 0 && (
            <DataTable
              data={pending}
              showActions={true}
              onApprove={handleApprove}
              onEdit={openEditModal}
              canApprove={() => true}
              canEdit={() => true}
              currentRole="ZM"
              currentUser={currentUser}
              getStatusBadge={getStatusBadge}
            />
          )}
        </section>

        {/* APPROVED BY YOU SECTION */}
        {approved.length > 0 && (
          <section>
            <div style={{
              borderTop: "3px solid #e2e8f0",
              paddingTop: 10,
              marginTop: 40
            }}>
              <h2 style={{ color: "#059669", fontSize: 24, marginBottom: 20 }}>
                Approved by You → Sent to NSM ({approved.length})
              </h2>
              <p style={{ color: "#64748b", marginBottom: 24, fontSize: 15 }}>
                These records have been approved by you and are now awaiting NSM final approval.
              </p>

              <DataTable
                data={approved}
                showActions={false}
                getStatusBadge={getStatusBadge}
              />
            </div>
          </section>
        )}

        {/* GORGEOUS ZM-THEMED EDIT MODAL */}
        {editingRecord && (
          <div style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.92)",
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
              boxShadow: "0 30px 80px rgba(124,58,237,0.35)"
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

              <h4 style={{ margin: "28px 0 16px 0", color: "#7c3aed" }}>Products</h4>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", marginBottom: 28 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "#e9d5ff" }}>
                    <tr>
                      <th style={{ padding: "18px", textAlign: "left" }}>Product Family</th>
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
                            value={p.family || ""}
                            onChange={e => {
                              const np = [...editForm.products];
                              np[i].family = e.target.value;
                              setEditForm({ ...editForm, products: np });
                            }}
                            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1" }}
                          />
                        </td>
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

              <button
                onClick={() => setEditForm({
                  ...editForm,
                  products: [...editForm.products, {
                    family: "",
                    productName: "",
                    sku: "",
                    openingStock: 0,
                    liquidationQty: 0
                  }]
                })}
                style={{
                  padding: "16px 32px",
                  background: "#7c3aed",
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
                    background: "#7c3aed",
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
      </div>
    </DashboardLayout>
  );
}