// src/pages/ZM.jsx → FINAL 2025: Single Product Table + Rich AM Cards
import React, { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { getSubordinateTAMobiles } from "../data/hierarchy";
import { downloadCSV } from "../utils/downloadCSV";

const COLORS = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#e9d5ff", "#f3e8ff"];

// YOUR EXACT AREA LIST
const ZM_AREAS = [
  "ALL",
  "TG-CAP",
  "RYL CAP",
  "TN1",
  "TNKL",
  "KA1",
  "KA2",
  "MH 1",
  "MH 2",
  "MH 3",
  "GJ",
  "MP",
  "CG"
];

export default function ZM() {
  const [allRecords, setAllRecords] = useState([]);
  const [selectedAM, setSelectedAM] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [selectedArea, setSelectedArea] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const currentUser = localStorage.getItem("userName") || "Zonal Manager";
  const userMobile = localStorage.getItem("userMobile");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/completed");
      const data = await res.json();

      const allowedTAs = getSubordinateTAMobiles(userMobile, "ZM");
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

 const getAMStats = () => {
  let filtered = allRecords.filter(r => r.record_date === selectedDate);
  if (selectedArea !== "ALL") {
    filtered = filtered.filter(r => r.area === selectedArea);
  }

  const amMap = new Map();
  const productMap = new Map(); // Uses unique key: sku + productName

  filtered.forEach(r => {
    const key = r.phone_number;

    // AM Stats
    if (!amMap.has(key)) {
      amMap.set(key, {
        name: r.employee_name || "Unknown",
        mobile: r.phone_number,
        area: r.area || "N/A",
        zone: r.zone || "N/A",
        totalLiq: 0
      });
    }
    const perf = amMap.get(key);
    perf.totalLiq += (r.products || []).reduce(
      (sum, p) => sum + (p.liquidationQty || p.liquidation_qty || 0),
      0
    );

    // Product aggregation — UNIQUE per SKU + Product Name
    (r.products || []).forEach(p => {
      const sku = p.sku || "unknown";
      const name = p.productName || p.product_name || "Unknown";
      const uniqueKey = `${sku}___${name}`; // 100% safe unique identifier

      if (!productMap.has(uniqueKey)) {
        productMap.set(uniqueKey, {
          sku,
          name,
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
    amList: Array.from(amMap.values()).sort((a, b) => b.totalLiq - a.totalLiq),
    productList
  };
};

  const { amList, productList } = getAMStats();
  const totalLiquidated = amList.reduce((sum, am) => sum + am.totalLiq, 0);

  const getGroupedProducts = () => {
    if (!selectedAM) return [];
    const records = allRecords.filter(r => r.phone_number === selectedAM.mobile && r.record_date === selectedDate);
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
        <div style={{ textAlign: "center"}}>
          <h1 style={{
            fontSize: 44,
            background: "linear-gradient(90deg, #7c3aed, #8b5cf6, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 900,
          }}>
            Zonal Manager Dashboard
          </h1>
          <p style={{ fontSize: 20, color: "#1e293b"}}>
            Welcome, <strong style={{ color: "#7c3aed" }}>{currentUser}</strong>
          </p>
        </div>

        {/* DATE + AREA + CSV */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          marginBottom: 50
        }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <label style={{ fontWeight: "bold", fontSize: 18, marginRight: 12 }}>Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border: "2px solid #a78bfa",
                  background: "#f3e8ff",
                  fontSize: 16
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: "bold", fontSize: 18, marginRight: 12 }}>Area:</label>
              <select
                value={selectedArea}
                onChange={e => setSelectedArea(e.target.value)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border: "2px solid #a78bfa",
                  background: "#f3e8ff",
                  fontSize: 16,
                  minWidth: 200,
                  fontWeight: "600"
                }}
              >
                {ZM_AREAS.map(area => (
                  <option key={area} value={area}>
                    {area === "ALL" ? "All Areas" : area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => downloadCSV(
              allRecords.filter(r => 
                r.record_date === selectedDate && 
                (selectedArea === "ALL" || r.area === selectedArea)
              ),
              selectedDate,
              `ZM_${selectedArea === "ALL" ? "AllAreas" : selectedArea}_Report`
            )}
            style={{
              padding: "16px 36px",
              background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
              color: "white",
              border: "none",
              borderRadius: 16,
              fontSize: 18,
              fontWeight: "bold",
              boxShadow: "0 12px 30px rgba(124,58,237,0.4)",
              cursor: "pointer"
            }}
          >
            Download CSV
          </button>
        </div>

      

        {/* TITLE */}
        <h3 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 30, color: "#1e293b" }}>
          {selectedAM ? `${selectedAM.name}'s Performance` : "Your Team Members"}
          {selectedAM && (
            <button onClick={() => setSelectedAM(null)} style={{
              marginLeft: 24, padding: "12px 32px", background: "#64748b", color: "white",
              border: "none", borderRadius: 16, fontWeight: "bold"
            }}>
              Back to Team
            </button>
          )}
        </h3>

        {!selectedAM ? (
          <>
            {/* RICH AM CARDS */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
              gap: 32,
              marginBottom: 60
            }}>
              {amList.map((am, i) => (
                <div
                  key={am.mobile}
                  onClick={() => setSelectedAM(am)}
                  style={{
                    padding: 40,
                    background: "white",
                    borderRadius: 28,
                    textAlign: "center",
                    cursor: "pointer",
                    boxShadow: "0 15px 40px rgba(0,0,0,0.12)",
                    transition: "all 0.4s",
                    border: "3px solid #e9d5ff",
                    position: "relative"
                  }}
                >
                  {i === 0 && (
                    <div style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "#7c3aed",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: 20,
                      fontSize: 14,
                      fontWeight: "bold"
                    }}>
                      #1 PERFORMER
                    </div>
                  )}

                  <div style={{ fontSize: 26, fontWeight: "bold", marginBottom: 16, color: "#581c87" }}>
                    {am.name}
                  </div>
                  <div style={{ fontSize: 18, color: "#64748b", marginBottom: 8 }}>
                    Phone: <strong>{am.mobile}</strong>
                  </div>
                  <div style={{ fontSize: 18, color: "#64748b", marginBottom: 16 }}>
                    Area: <strong>{am.area}</strong> • Zone: <strong>{am.zone}</strong>
                  </div>
                  <div style={{ fontSize: 64, fontWeight: "900", color: "#7c3aed", margin: "20px 0" }}>
                    {am.totalLiq.toLocaleString()}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 18 }}>Liquidated</div>
                </div>
              ))}
            </div>

            {/* SINGLE PRODUCT TABLE */}
            <h3 style={{ fontSize: 28, fontWeight: "bold", margin: "60px 0 30px", color: "#1e293b" }}>
              Product-wise Summary ({selectedArea === "ALL" ? "All Areas" : selectedArea})
            </h3>
            <div style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#7c3aed", color: "white" }}>
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
                        background: i % 2 === 0 ? "#f8f9ff" : "white",
                        borderBottom: "1px solid #e2e8f0"
                      }}>
                        <td style={{ padding: "14px 16px", fontWeight: "600", color: "#1e293b" }}>
                          {prod.name}
                        </td>
                        <td style={{ padding: "14px 16px", color: "#64748b" }}>{prod.sku}</td>
                        <td style={{ padding: "14px 16px", color: "#64748b" }}>{prod.family}</td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "bold", color: "#6b21a8" }}>
                          {prod.opening.toLocaleString()}
                        </td>
                        <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: "bold", color: "#7c3aed" }}>
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
          // DETAILED AM VIEW (unchanged)
          <div>
            {/* PERSON INFO */}
            <div style={{
              background: "linear-gradient(135deg, #f3e8ff, #e0d4ff)",
              padding: 28,
              borderRadius: 20,
              marginBottom: 30,
              boxShadow: "0 10px 30px rgba(124,58,237,0.2)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 20,
              textAlign: "center"
            }}>
              <div><div style={{ fontSize: 18, color: "#6b21a8" }}>Name</div><div style={{ fontSize: 28, fontWeight: "bold", color: "#7c3aed" }}>{selectedAM.name}</div></div>
              <div><div style={{ fontSize: 18, color: "#6b21a8" }}>Phone</div><div style={{ fontSize: 24, fontWeight: "bold" }}>{selectedAM.mobile}</div></div>
              <div><div style={{ fontSize: 18, color: "#6b21a8" }}>Area</div><div style={{ fontSize: 24, fontWeight: "bold" }}>{selectedAM.area}</div></div>
              <div><div style={{ fontSize: 18, color: "#6b21a8" }}>Zone</div><div style={{ fontSize: 24, fontWeight: "bold" }}>{selectedAM.zone}</div></div>
            </div>

            {/* CHARTS + TOTAL BADGE */}
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
                  color: "#7c3aed",
                  background: "rgba(243, 232, 255, 0.9)",
                  padding: "10px 20px",
                  borderRadius: 16,
                  border: "2px solid #c4b5fd"
                }}>
                  Total: {selectedAM.totalLiq.toLocaleString()}
                </div>
              </div>

              {/* BAR CHART */}
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
                      <Bar dataKey="liquidated" fill="#7c3aed" name="Liquidated Stock" radius={[8, 8, 0, 0]} />
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
                      <div style={{ fontSize: 20, fontWeight: "bold", color: "#7c3aed" }}>
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
                          Opening: {item.opening} → Liquidated: <strong style={{ color: "#7c3aed" }}>{item.liquidated}</strong>
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