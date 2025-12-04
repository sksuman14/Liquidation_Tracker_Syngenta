// src/components/DataTable.jsx → FINAL UPGRADE: FAMILY + PRODUCT NAME + COLORS + PERFECT LAYOUT
import React, { useState } from "react";
import "./DataTable.css";
import { ChevronDown, ChevronUp, User, MapPin, Calendar, Package, Edit3, CheckCircle } from "lucide-react";

export default function DataTable({ 
  data = [], 
  showActions = false, 
  currentRole, 
  currentUser, 
  onApprove, 
  onEdit, 
  canApprove,
  canEdit,
  getStatusBadge
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "#94a3b8" }}>
        <Package size={80} style={{ marginBottom: "20px", opacity: 0.6 }} />
        <h3>No records found</h3>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="table-card">
        <div style={{ padding: "20px", background: "#1e293b", color: "white", borderRadius: "8px 8px 0 0" }}>
          <h2 style={{ margin: 0 }}>Liquidation Records ({data.length})</h2>
        </div>

        <table className="modern-table">
          <thead>
            <tr>
              <th>Phone Number</th>
              <th>Employee</th>
              <th>HQ</th>
              <th>Zone</th>
              <th>Area</th>
              <th>Date</th>
              <th>Products</th>
              <th>Status</th>
              {showActions && data.some(row => 
                (canApprove && canApprove(row) !== false) || 
                (canEdit && canEdit(row) !== false)
              ) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const isExpanded = expandedIndex === index;
              const safeProducts = Array.isArray(row.products) ? row.products.filter(p => p) : [];

              const showApproveBtn = canApprove && canApprove(row) !== false;
              const showEditBtn = canEdit && canEdit(row) !== false;
              const showAnyAction = showApproveBtn || showEditBtn;

              return (
                <React.Fragment key={index}>
                  <tr style={{ background: isExpanded ? "#f0f9ff" : "inherit" }}>
                    <td><strong>{row.phone_number}</strong></td>
                    <td><User size={16} style={{ marginRight: 6, opacity: 0.7 }} /> {row.employee_name || "-"}</td>
                    <td>{row.hq || "-"}</td>
                    <td>{row.zone || "-"}</td>
                    <td><MapPin size={16} style={{ marginRight: 6, opacity: 0.7 }} /> {row.area || "-"}</td>
                    <td>
                      <Calendar size={14} style={{ marginRight: 4, opacity: 0.7 }} />
                      <code style={{ 
                        background: "#ecfdf5", 
                        color: "#059669", 
                        padding: "6px 12px", 
                        borderRadius: "8px", 
                        fontSize: "14px", 
                        fontWeight: "bold",
                        fontFamily: "monospace"
                      }}>
                        {row.record_date}
                      </code>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleExpand(index)}
                        style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                      >
                        {safeProducts.length} item{safeProducts.length !== 1 && "s"}
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                    <td>{getStatusBadge?.(row.status) || row.status}</td>

                    {showActions && showAnyAction && (
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {showApproveBtn && (
                            <button onClick={() => onApprove(row)} style={{ 
                              background: "#059669", color: "white", border: "none", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: "bold", display: "flex", alignItems: "center", gap: 6
                            }}>
                              <CheckCircle size={16} /> Approve
                            </button>
                          )}
                          {showEditBtn && (
                            <button onClick={() => onEdit(row)} style={{ 
                              background: "#2563eb", color: "white", border: "none", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: "bold", display: "flex", alignItems: "center", gap: 6
                            }}>
                              <Edit3 size={16} /> Edit
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                    {showActions && !showAnyAction && <td style={{ color: "#94a3b8", fontStyle: "italic" }}>-</td>}
                  </tr>

                  {/* EXPANDED PRODUCTS ROW - FAMILY + PRODUCT NAME + COLORS */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={showActions && data.some(r => (canApprove?.(r) || canEdit?.(r))) ? 9 : 8} style={{ padding: 0 }}>
                        <div style={{ margin: "20px", background: "#f8fafc", borderRadius: "12px", border: "2px solid #e0e7ff", overflow: "hidden" }}>
                          {safeProducts.length > 0 ? (
                            <div style={{ padding: "16px" }}>
                              {/* Header */}
                              <div style={{ 
                                display: "grid", 
                                gridTemplateColumns: "100px 220px 120px 100px 100px", 
                                gap: "12px", 
                                fontWeight: "600", 
                                color: "#1e293b", 
                                fontSize: 14, 
                                padding: "12px 0",
                                borderBottom: "2px solid #c7d2fe"
                              }}>
                                <div>Family</div>
                                <div>Product Name</div>
                                <div>SKU</div>
                                <div style={{ textAlign: "center" }}>Opening</div>
                                <div style={{ textAlign: "center" }}>Liq. Qty</div>
                              </div>

                              {/* Products List */}
                              {safeProducts.map((p, i) => (
                                <div
                                  key={i}
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "100px 220px 120px 100px 100px",
                                    gap: "12px",
                                    padding: "14px 0",
                                    borderBottom: i === safeProducts.length - 1 ? "none" : "1px dashed #cbd5e1",
                                    alignItems: "center"
                                  }}
                                >
                                  {/* Family Badge */}
                                  <div style={{
                                    padding: "8px 12px",
                                    borderRadius: 10,
                                    fontWeight: "bold",
                                    fontSize: 12,
                                    textAlign: "center",
                                    background: 
                                      p.family === "PBS" ? "#dbeafe" :
                                      p.family === "WSF" ? "#fef3c7" :
                                      p.family === "MIC" ? "#d1fae5" : "#e2e8f0",
                                    color: 
                                      p.family === "PBS" ? "#1e40af" :
                                      p.family === "WSF" ? "#92400e" :
                                      p.family === "MIC" ? "#065f46" : "#475569"
                                  }}>
                                    {p.family || "—"}
                                  </div>

                                  {/* Product Name */}
                                  <div style={{ fontWeight: "600", color: "#1e293b", fontSize: 15 }}>
                                    {p.productName || p.product_name || "Unknown Product"}
                                  </div>

                                  {/* SKU */}
                                  <div style={{ color: "#64748b", fontFamily: "monospace", fontWeight: "500" }}>
                                    {p.sku || "—"}
                                  </div>

                                  {/* Opening Stock */}
                                  <div style={{ textAlign: "center", fontWeight: "500" }}>
                                    {p.openingStock || p.opening_qty || 0}
                                  </div>

                                  {/* Liquidation Qty - RED */}
                                  <div style={{ textAlign: "center", fontWeight: "bold", color: "#dc2626", fontSize: 16 }}>
                                    {p.liquidationQty || p.liquidation_qty || 0}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ padding: "50px", textAlign: "center", color: "#94a3b8" }}>
                              No product details available
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}