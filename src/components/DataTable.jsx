// src/components/DataTable.jsx → FINAL VERSION (Action column disappears after final approval)
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
  canApprove,        // (row) => true/false
  canEdit,           // (row) => true/false  ← NEW SUPPORT
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
              {/* Action column only appears if AT LEAST ONE row has actions */}
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

              // Determine if this row should show any actions
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

                    {/* Only render Actions cell if this row has any action */}
                    {showActions && showAnyAction && (
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {showApproveBtn && (
                            <button 
                              onClick={() => onApprove(row)} 
                              style={{ 
                                background: "#059669", 
                                color: "white", 
                                border: "none", 
                                padding: "10px 14px", 
                                borderRadius: 8, 
                                fontSize: 13,
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                gap: 6
                              }}
                            >
                              <CheckCircle size={16} /> Approve
                            </button>
                          )}
                          {showEditBtn && (
                            <button 
                              onClick={() => onEdit(row)} 
                              style={{ 
                                background: "#2563eb", 
                                color: "white", 
                                border: "none", 
                                padding: "10px 14px", 
                                borderRadius: 8, 
                                fontSize: 13,
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                gap: 6
                              }}
                            >
                              <Edit3 size={16} /> Edit
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {/* If no actions for this row → render empty cell to maintain layout */}
                    {showActions && !showAnyAction && <td style={{ color: "#94a3b8", fontStyle: "italic" }}>-</td>}
                  </tr>

                  {/* Expanded Product Details */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={showActions && data.some(r => (canApprove?.(r) || canEdit?.(r))) ? 9 : 8} style={{ padding: 0 }}>
                        <div style={{ margin: "16px 20px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #cbd5e1", overflow: "hidden" }}>
                          {safeProducts.length > 0 ? (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ background: "#dbeafe" }}>
                                  <th style={{ padding: "12px", textAlign: "left" }}>SKU</th>
                                  <th style={{ padding: "12px", textAlign: "left" }}>Product</th>
                                  <th style={{ padding: "12px", textAlign: "center" }}>Opening</th>
                                  <th style={{ padding: "12px", textAlign: "center" }}>Liq. Qty</th>
                                </tr>
                              </thead>
                              <tbody>
                                {safeProducts.map((p, i) => (
                                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f1f5f9" }}>
                                    <td style={{ padding: "12px" }}>
                                      <code style={{ background: "#e0e7ff", padding: "4px 8px", borderRadius: "4px" }}>
                                        {p.sku || "-"}
                                      </code>
                                    </td>
                                    <td style={{ padding: "12px", fontWeight: "500" }}>
                                      {p.productName || p.product_name || "Unknown"}
                                    </td>
                                    <td style={{ padding: "12px", textAlign: "center" }}>
                                      {p.openingStock || p.opening_qty || 0}
                                    </td>
                                    <td style={{ padding: "12px", textAlign: "center", fontWeight: "bold", color: "#dc2626" }}>
                                      {p.liquidationQty || p.liquidation_qty || 0}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                              No product details
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