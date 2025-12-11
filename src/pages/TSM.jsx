// src/pages/TSM.jsx → FINAL 2025: Single Product Table + Rich TA Cards
import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { getSubordinateTAMobiles } from "../data/hierarchy";
import { downloadCSV } from "../utils/downloadCSV";

const COLORS = ["#f59e0b", "#f97316", "#ea580c", "#dc2626", "#7c3aed", "#166534"];

export default function TSM() {
  const [allRecords, setAllRecords] = useState([]);
  const [selectedTA, setSelectedTA] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [loading, setLoading] = useState(true);

  const currentUser = localStorage.getItem("userName") || "TSM";
  const userMobile = localStorage.getItem("userMobile");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/completed");
      const data = await res.json();

      const allowedTAs = getSubordinateTAMobiles(userMobile, "TSM");
      const myRecords = data.filter(r =>
        r.phone_number && allowedTAs.includes(r.phone_number)
      );

      setAllRecords(myRecords);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

 const getTAStats = () => {
  const recordsOnDate = allRecords.filter(r => r.record_date === selectedDate);

  const taMap = new Map();
  const productMap = new Map();

  recordsOnDate.forEach(r => {
    const key = r.phone_number;

    // TA stats
    if (!taMap.has(key)) {
      taMap.set(key, {
        name: r.employee_name || "Unknown",
        mobile: r.phone_number,
        area: r.area || "N/A",
        zone: r.zone || "N/A",
        totalLiq: 0
      });
    }
    const perf = taMap.get(key);
    perf.totalLiq += (r.products || []).reduce((sum, p) => sum + (p.liquidationQty || p.liquidation_qty || 0), 0);

    // UNIQUE KEY: sku + productName (prevents merging different products)
    (r.products || []).forEach(p => {
      const productName = p.productName || p.product_name || "Unknown";
      const sku = p.sku || "unknown";
      const uniqueKey = `${sku}|||${productName}`; // Safe separator

      if (!productMap.has(uniqueKey)) {
        productMap.set(uniqueKey, {
          sku,
          name: productName,
          family: p.family || "Others",
          opening: 0,
          liquidated: 0
        });
      }

      const prod = productMap.get(uniqueKey);
      prod.opening += p.openingStock || p.opening_qty || 0;
      prod.liquidated += p.liquidationQty || p.liquidation_qty || 0;
    });
  });

  const productList = Array.from(productMap.values())
    .map(p => ({
      ...p,
      remaining: p.opening - p.liquidated
    }))
    .sort((a, b) => b.liquidated - a.liquidated);

  return {
    taList: Array.from(taMap.values()).sort((a, b) => b.totalLiq - a.totalLiq),
    productList
  };
};

  const { taList, productList } = getTAStats();
  const territoryTotal = taList.reduce((sum, ta) => sum + ta.totalLiq, 0);

  const getGroupedProducts = () => {
    if (!selectedTA) return [];
    const records = allRecords.filter(r => r.phone_number === selectedTA.mobile && r.record_date === selectedDate);
    const grouped = {};

    records.forEach(r => {
      (r.products || []).forEach(p => {
        const family = p.family || "Others";
        if (!grouped[family]) grouped[family] = { family, totalOpening: 0, totalLiquidated: 0, items: [] };
        grouped[family].totalOpening += p.openingStock || p.opening_qty || 0;
        grouped[family].totalLiquidated += p.liquidationQty || p.liquidation_qty || 0;
        grouped[family].items.push({
          name: p.productName || p.product_name || "Unknown",
          sku: p.sku || "",
          opening: p.openingStock || p.opening_qty || 0,
          liquidated: p.liquidationQty || p.liquidation_qty || 0
        });
      });
    });
    return Object.values(grouped);
  };

  const groupedProducts = getGroupedProducts();
  const pieData = groupedProducts.map(g => ({ name: g.family, value: g.totalLiquidated })).filter(x => x.value > 0);
  const barData = groupedProducts.map(g => ({ name: g.family, opening: g.totalOpening, liquidated: g.totalLiquidated }));

  return (
    <DashboardLayout>
      <div style={{ padding: "0px 0px", maxWidth: "1600px" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontSize: 44,
            background: "linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 900,
          }}>
            Territory Sales Manager Dashboard
          </h1>
          <p style={{ fontSize: 20, color: "#1e293b"}}>
            Welcome, <strong style={{ color: "#d97706" }}>{currentUser}</strong>
          </p>
        </div>

        {/* DATE + CSV */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          marginBottom: 50
        }}>
          <div>
            <label style={{ fontWeight: "bold", fontSize: 18, marginRight: 12 }}>Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                padding: 14,
                borderRadius: 12,
                border: "2px solid #fbbf24",
                background: "#fffbeb",
                fontSize: 16
              }}
            />
          </div>

          <button
            onClick={() => downloadCSV(
              allRecords.filter(r => r.record_date === selectedDate),
              selectedDate,
              "TSM_Territory_Report"
            )}
            style={{
              padding: "16px 36px",
              background: "linear-gradient(135deg, #d97706, #f59e0b)",
              color: "white",
              border: "none",
              borderRadius: 16,
              fontSize: 18,
              fontWeight: "bold",
              boxShadow: "0 12px 30px rgba(245,158,11,0.4)",
              cursor: "pointer"
            }}
          >
            Download CSV
          </button>
        </div>

       

        {/* TITLE */}
        <h3 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 30, color: "#1e293b" }}>
          {selectedTA ? `${selectedTA.name}'s Performance` : "Your Team Members"}
          {selectedTA && (
            <button onClick={() => setSelectedTA(null)} style={{
              marginLeft: 24, padding: "12px 32px", background: "#64748b", color: "white",
              border: "none", borderRadius: 16, fontWeight: "bold"
            }}>
              Back to Team
            </button>
          )}
        </h3>

        {!selectedTA ? (
          <>
            {/* RICH TA CARDS */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              gap: 32,
              marginBottom: 60
            }}>
              {taList.map((ta, i) => (
                <div
                  key={ta.mobile}
                  onClick={() => setSelectedTA(ta)}
                  style={{
                    padding: 40,
                    background: "white",
                    borderRadius: 28,
                    textAlign: "center",
                    cursor: "pointer",
                    boxShadow: "0 15px 40px rgba(0,0,0,0.12)",
                    transition: "all 0.4s",
                    border: "3px solid #fed7aa",
                    position: "relative"
                  }}
                >
                  {i === 0 && (
                    <div style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "#d97706",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: 20,
                      fontSize: 14,
                      fontWeight: "bold"
                    }}>
                      #1 PERFORMER
                    </div>
                  )}

                  <div style={{ fontSize: 26, fontWeight: "bold", marginBottom: 16, color: "#92400e" }}>
                    {ta.name}
                  </div>
                  <div style={{ fontSize: 18, color: "#64748b", marginBottom: 8 }}>
                    Phone: <strong>{ta.mobile}</strong>
                  </div>
                  <div style={{ fontSize: 18, color: "#64748b", marginBottom: 16 }}>
                    Area: <strong>{ta.area}</strong> • Zone: <strong>{ta.zone}</strong>
                  </div>
                  <div style={{ fontSize: 64, fontWeight: "900", color: "#d97706", margin: "20px 0" }}>
                    {ta.totalLiq.toLocaleString()}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 18 }}>Liquidated</div>
                </div>
              ))}
            </div>

            {/* SINGLE PRODUCT TABLE */}
            <h3 style={{ fontSize: 28, fontWeight: "bold", margin: "60px 0 30px", color: "#1e293b" }}>
              Product-wise Summary
            </h3>
            <div style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#d97706", color: "white" }}>
                      <th style={{ padding: "16px", textAlign: "left" }}>Product</th>
                      <th style={{ padding: "16px", textAlign: "left" }}>SKU</th>
                      <th style={{ padding: "16px", textAlign: "left" }}>Family</th>
                      <th style={{ padding: "16px", textAlign: "center" }}>Opening</th>
                      <th style={{ padding: "16px", textAlign: "center" }}>Liquidated</th>
                      <th style={{ padding: "16px", textAlign: "center" }}>Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productList.map((prod, i) => (
                      <tr key={prod.sku} style={{
                        background: i % 2 === 0 ? "#fffbeb" : "white",
                        borderBottom: "1px solid #fed7aa"
                      }}>
                        <td style={{ padding: "14px 16px", fontWeight: "600", color: "#1e293b" }}>
                          {prod.name}
                        </td>
                        <td style={{ padding: "14px 16px", color: "#64748b" }}>{prod.sku}</td>
                        <td style={{ padding: "14px 16px", color: "#64748b" }}>{prod.family}</td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "bold", color: "#92400e" }}>
                          {prod.opening.toLocaleString()}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "bold", color: "#d97706" }}>
                          {prod.liquidated.toLocaleString()}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "bold", color: prod.remaining > 0 ? "#dc2626" : "#16a34a" }}>
                          {prod.remaining.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          // DETAILED TA VIEW (unchanged)
          <div>
            {/* PERSON INFO */}
            <div style={{
              background: "linear-gradient(135deg, #fff7ed, #fed7aa)",
              padding: 28,
              borderRadius: 20,
              marginBottom: 30,
              boxShadow: "0 10px 30px rgba(245,158,11,0.2)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 20,
              textAlign: "center"
            }}>
              <div><div style={{ fontSize: 18, color: "#92400e" }}>Name</div><div style={{ fontSize: 28, fontWeight: "bold", color: "#d97706" }}>{selectedTA.name}</div></div>
              <div><div style={{ fontSize: 18, color: "#92400e" }}>Phone</div><div style={{ fontSize: 24, fontWeight: "bold" }}>{selectedTA.mobile}</div></div>
              <div><div style={{ fontSize: 18, color: "#92400e" }}>Area</div><div style={{ fontSize: 24, fontWeight: "bold" }}>{selectedTA.area}</div></div>
              <div><div style={{ fontSize: 18, color: "#92400e" }}>Zone</div><div style={{ fontSize: 24, fontWeight: "bold" }}>{selectedTA.zone}</div></div>
            </div>

            {/* CHARTS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginBottom: 40 }}>
              <div style={{ background: "white", padding: 32, borderRadius: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.1)", position: "relative" }}>
                <h3 style={{ textAlign: "center", margin: "0 0 20px 0", fontWeight: "bold", color: "#1e293b", fontSize: 22 }}>
                  Liquidation by Family
                </h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${v.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={{ padding: 80, color: "#94a3b8", textAlign: "center", fontSize: 18 }}>No data</div>}

                <div style={{
                  position: "absolute",
                  bottom: 24,
                  right: 28,
                  fontSize: 19,
                  fontWeight: "bold",
                  color: "#d97706",
                  background: "rgba(255, 251, 235, 0.9)",
                  padding: "10px 20px",
                  borderRadius: 16,
                  border: "2px solid #fbbf24"
                }}>
                  Total: {selectedTA.totalLiq.toLocaleString()}
                </div>
              </div>

              <div style={{ background: "white", padding: 32, borderRadius: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
                <h3 style={{ textAlign: "center", marginBottom: 20, fontWeight: "bold", fontSize: 22 }}>
                  Opening vs Liquidated
                </h3>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(v) => `${v.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="opening" fill="#94a3b8" name="Opening Stock" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="liquidated" fill="#d97706" name="Liquidated Stock" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={{ padding: 80, color: "#94a3b8", textAlign: "center", fontSize: 18 }}>No data</div>}
              </div>
            </div>

            {/* GROUPED PRODUCTS */}
            <h3 style={{ fontSize: 24, fontWeight: "bold", margin: "40px 0 24px" }}>
              Product Details by Family
            </h3>
            <div style={{ display: "grid", gap: 24 }}>
              {groupedProducts.map((group, i) => (
                <div key={i} style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                  borderLeft: `6px solid ${COLORS[i % COLORS.length]}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h4 style={{ fontSize: 22, fontWeight: "bold", margin: 0, color: "#1e293b" }}>
                      {group.family}
                    </h4>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, color: "#64748b" }}>Opening: <strong>{group.totalOpening}</strong></div>
                      <div style={{ fontSize: 20, fontWeight: "bold", color: "#d97706" }}>
                        Liquidated: {group.totalLiquidated}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                    {group.items.map((item, j) => (
                      <div key={j} style={{
                        padding: 16,
                        background: "#f8fafc",
                        borderRadius: 12,
                        border: "1px solid #e2e8f0"
                      }}>
                        <div><strong>{item.name}</strong> ({item.sku})</div>
                        <div style={{ marginTop: 8, fontSize: 14, color: "#64748b" }}>
                          Opening: {item.opening} → Liquidated: <strong style={{ color: "#d97706" }}>{item.liquidated}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: 120, color: "#94a3b8", fontSize: 22 }}>
            Loading your team data...
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}