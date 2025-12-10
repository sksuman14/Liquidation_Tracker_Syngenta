// api/completed.js  ← GET /api/completed

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await pool.query(`
      SELECT phone_number, employee_name, hq, zone, area,
             products, created_at, status, edited_by, edited_at, record_date, approved_by
      FROM liquidation_records 
      ORDER BY record_date DESC, created_at DESC
    `);

    const rows = result.rows.map(row => ({
      ...row,
      products: row.products 
        ? (typeof row.products === 'string' ? JSON.parse(row.products) : row.products)
        : [],
      status: row.status || "pending_tsm",
      approved_by: row.approved_by || [],
      record_date: row.record_date ? row.record_date.toLocaleDateString('en-CA') : null
    }));

    res.status(200).json(rows);
  } catch (err) {
    console.error("GET /completed error:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
}