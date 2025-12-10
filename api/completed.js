// pages/api/completed.js → FINAL CLEAN VERSION (No status, No approval)
// Only returns what your beautiful dashboards actually use

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await pool.query(`
      SELECT 
        phone_number,
        employee_name,
        hq,
        zone,
        area,
        products,
        record_date
      FROM liquidation_records 
      ORDER BY record_date DESC
    `);

    const records = result.rows.map((row) => ({
      phone_number: row.phone_number?.trim() || "",
      employee_name: row.employee_name?.trim() || "Unknown",
      hq: row.hq || "",
      zone: row.zone || "",
      area: row.area || "",
      record_date: row.record_date
        ? new Date(row.record_date).toISOString().split("T")[0] // "2025-08-10"
        : null,
      products: row.products
        ? typeof row.products === "string"
          ? JSON.parse(row.products)
          : row.products
        : [],
    }));

    // Always return a clean array
    res.status(200).json(records);
  } catch (err) {
    console.error("GET /api/completed error:", err);
    res.status(500).json({ error: "Failed to fetch records" });
  }
}