// src/pages/ApprovalDashboard.jsx → FINAL FIXED VERSION
import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import DataTable from "../components/DataTable";

export default function ApprovalDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);

  // Edit form state (this is the fix!)
  const [editForm, setEditForm] = useState({
    employee_name: "",
    hq: "",
    zone: "",
    area: "",
    products: []
  });

  const currentRole = localStorage.getItem("userRole") || "TA";
  const currentUser = localStorage.getItem("username") || "User";

  const roleOrder = { TA: 1, TSM: 2, AM: 3, ZM: 4, NSM: 5, CM: 6 };
  const currentLevel = roleOrder[currentRole] || 0;

  const statusToLevel = {
    pending_ta: 1,
    approved_by_ta: 2,
    approved_by_tsm: 3,
    approved_by_am: 4,
    approved_by_zm: 5,
    approved_by_nsm: 6,
    fully_approved: 7
  };

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/completed");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error(err);
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
      pending_ta: { text: "Pending TA", color: "#f59e0b" },
      approved_by_ta: { text: "TA Approved", color: "#10b981" },
      approved_by_tsm: { text: "TSM Approved", color: "#10b981" },
      approved_by_am: { text: "AM Approved", color: "#10b981" },
      approved_by_zm: { text: "ZM Approved", color: "#10b981" },
      approved_by_nsm: { text: "NSM Approved", color: "#10b981" },
      fully_approved: { text: "Fully Approved", color: "#7c3aed" }
    };
    const s = map[status] || { text: status, color: "#666" };
    return <span style={{ background: s.color, color: "white", padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: "bold" }}>{s.text}</span>;
  };

  if (loading) return <DashboardLayout title="Approval Dashboard"><p>Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout title="Liquidation Approval Dashboard">
      <div style={{ padding: 20 }}>
        <h2 style={{ margin: 0 }}>All Records ({records.length})</h2>
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

      {/* FULL EDIT MODAL - NOW FIXED */}
      {editingRecord && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{ background: "white", borderRadius: 12, width: "90%", maxWidth: "1000px", maxHeight: "90vh", overflow: "auto", padding: 30 }}>
            <h3>Edit Record - {editingRecord.phone_number}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 20 }}>
              <input placeholder="Employee Name" value={editForm.employee_name} onChange={(e) => setEditForm({...editForm, employee_name: e.target.value})} style={{ padding: 10 }} />
              <input placeholder="HQ" value={editForm.hq} onChange={(e) => setEditForm({...editForm, hq: e.target.value})} style={{ padding: 10 }} />
              <input placeholder="Zone" value={editForm.zone} onChange={(e) => setEditForm({...editForm, zone: e.target.value})} style={{ padding: 10 }} />
              <input placeholder="Area" value={editForm.area} onChange={(e) => setEditForm({...editForm, area: e.target.value})} style={{ padding: 10 }} />
            </div>

            <h4>Products</h4>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 15 }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  
                  <th style={{ padding: 10 }}>Product Name</th>
                  <th style={{ padding: 10 }}>SKU</th>
                  <th style={{ padding: 10 }}>Opening</th>
                  <th style={{ padding: 10 }}>Liq. Qty</th>
                  <th style={{ padding: 10 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {editForm.products.map((p, i) => (
                  <tr key={i}>
                    <td><input value={p.sku || ""} onChange={(e) => {
                      const newProducts = [...editForm.products];
                      newProducts[i].sku = e.target.value;
                      setEditForm({...editForm, products: newProducts});
                    }} style={{ width: "100%", padding: 8 }} /></td>
                    <td><input value={p.productName || ""} onChange={(e) => {
                      const newProducts = [...editForm.products];
                      newProducts[i].productName = e.target.value;
                      setEditForm({...editForm, products: newProducts});
                    }} style={{ width: "100%", padding: 8 }} /></td>
                    <td><input type="number" value={p.openingStock || 0} onChange={(e) => {
                      const newProducts = [...editForm.products];
                      newProducts[i].openingStock = Number(e.target.value);
                      setEditForm({...editForm, products: newProducts});
                    }} style={{ width: "100%", padding: 8 }} /></td>
                    <td><input type="number" value={p.liquidationQty || 0} onChange={(e) => {
                      const newProducts = [...editForm.products];
                      newProducts[i].liquidationQty = Number(e.target.value);
                      setEditForm({...editForm, products: newProducts});
                    }} style={{ width: "100%", padding: 8 }} /></td>
                    <td><button onClick={() => {
                      const newProducts = editForm.products.filter((_, idx) => idx !== i);
                      setEditForm({...editForm, products: newProducts});
                    }} style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 10px" }}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

          

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button onClick={saveFullEdit} style={{ background: "#059669", color: "white", padding: "12px 24px", border: "none", borderRadius: 8, marginRight: 10 }}>
                Save All Changes
              </button>
              <button onClick={() => setEditingRecord(null)} style={{ background: "#64748b", color: "white", padding: "12px 24px", border: "none", borderRadius: 8 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}