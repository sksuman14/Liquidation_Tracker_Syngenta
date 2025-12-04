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
                {/* EXPANDED PRODUCTS ROW - FULL WIDTH + MOBILE SCROLL */}
{isExpanded && (
  <tr>
    <td colSpan={showActions && data.some(r => (canApprove?.(r) || canEdit?.(r))) ? 9 : 8} style={{ padding: 0 }}>
      <div className="expanded-products-container">
        {safeProducts.length > 0 ? (
          <div className="products-grid">
            {/* Header */}
            <div className="products-header">
              <div>Family</div>
              <div>Product Name</div>
              <div>SKU</div>
              <div>Opening</div>
              <div>Liq. Qty</div>
            </div>

            {/* Products List */}
            {safeProducts.map((p, i) => (
              <div key={i} className="product-row">
                {/* Family Badge */}
                <div className={`family-badge ${p.family?.toLowerCase() || 'default'}`}>
                  {p.family || "—"}
                </div>

                {/* Product Name */}
                <div className="product-name">
                  {p.productName || p.product_name || "Unknown Product"}
                </div>

                {/* SKU */}
                <div className="sku">
                  {p.sku || "—"}
                </div>

                {/* Opening Stock */}
                <div className="number">
                  {p.openingStock || p.opening_qty || 0}
                </div>

                {/* Liquidation Qty - RED */}
                <div className="liq-qty">
                  {p.liquidationQty || p.liquidation_qty || 0}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "50px", textAlign: "center", color: "#94a3b8", fontSize: 15 }}>
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