// server.js → FINAL VERCEL + NEON + FULLY WORKING (DEC 2025)
require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Neon DB Connection (Vercel + Neon = Perfect)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// GET ALL RECORDS
app.get("/api/completed", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        phone_number, employee_name, hq, zone, area,
        products, created_at, status, edited_by, edited_at, record_date, approved_by
      FROM complete_records 
      ORDER BY record_date DESC, created_at DESC
    `);

    const rows = result.rows.map(row => ({
      ...row,
      products: row.products 
        ? (typeof row.products === 'string' ? JSON.parse(row.products) : row.products)
        : [],
      status: row.status || "pending_ta",
      approved_by: row.approved_by || [],
      record_date: row.record_date 
        ? row.record_date.toISOString().split('T')[0]  // Safe YYYY-MM-DD format
        : null
    }));

    res.json(rows);
  } catch (err) {
    console.error("GET /api/completed error:", err);
    res.status(500).json({ error: "Failed to fetch records", details: err.message });
  }
});

// APPROVE ENDPOINT
app.post("/api/approve", async (req, res) => {
  const { phone_number, record_date, role, user } = req.body;

  if (!["TA", "TSM", "AM", "ZM", "NSM", "CM"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const current = await pool.query(
      `SELECT status, approved_by FROM complete_records 
       WHERE phone_number = $1 AND record_date = $2 LIMIT 1`,
      [phone_number, record_date]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    const record = current.rows[0];
    const approvedBy = record.approved_by || [];
    const currentStatus = record.status || "pending_ta";

    const statusFlow = [
      "pending_ta",
      "approved_by_ta",
      "approved_by_tsm",
      "approved_by_am",
      "approved_by_zm",
      "approved_by_nsm",
      "fully_approved"
    ];

    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === 6) {
      return res.status(400).json({ error: "Invalid status or already fully approved" });
    }

    const expectedNextStatus = statusFlow[currentIndex + 1];
    const roleToStatus = {
      TA: "approved_by_ta",
      TSM: "approved_by_tsm",
      AM: "approved_by_am",
      ZM: "approved_by_zm",
      NSM: "approved_by_nsm",
      CM: "fully_approved"
    };

    if (roleToStatus[role] !== expectedNextStatus) {
      return res.status(400).json({ error: "Not your turn! Previous level must approve first" });
    }

    if (approvedBy.includes(`${user} (${role})`)) {
      return res.status(400).json({ error: "You already approved this" });
    }

    const result = await pool.query(`
      UPDATE complete_records 
      SET 
        status = $1,
        approved_by = array_append(approved_by, $2),
        edited_by = $3,
        edited_at = NOW()
      WHERE phone_number = $4 AND record_date = $5
      RETURNING *
    `, [
      roleToStatus[role],
      `${user} (${role})`,
      `${user} (${role})`,
      phone_number,
      record_date
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Failed to update record" });
    }

    res.json({ success: true, record: result.rows[0] });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ error: err.message });
  }
});

// EDIT ENDPOINT
app.patch("/api/edit", async (req, res) => {
  const { phone_number, record_date, role, username, ...updates } = req.body;

  try {
    const findRecord = await pool.query(
      `SELECT status FROM complete_records WHERE phone_number = $1 AND record_date = $2 LIMIT 1`,
      [phone_number, record_date]
    );

    if (findRecord.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    const currentStatus = findRecord.rows[0].status;
    if (currentStatus === "fully_approved") {
      return res.status(400).json({ error: "Cannot edit fully approved records" });
    }

    const allowed = ["employee_name", "hq", "zone", "area", "products"];
    const fields = Object.keys(updates)
      .filter(k => allowed.includes(k))
      .map((k, i) => `${k} = $${i + 1}`)
      .join(", ");

    if (!fields) return res.status(400).json({ error: "Nothing to update" });

    const values = Object.keys(updates)
      .filter(k => allowed.includes(k))
      .map(k => Array.isArray(updates[k]) ? JSON.stringify(updates[k]) : updates[k]);

    const query = `
      UPDATE complete_records 
      SET ${fields},
          edited_by = $${values.length + 1},
          edited_at = NOW()
      WHERE phone_number = $${values.length + 2} 
        AND record_date = $${values.length + 3}
      RETURNING *
    `;

    const result = await pool.query(query, [
      ...values,
      `${username} (${role})`,
      phone_number,
      record_date
    ]);

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Failed to update record" });
    }

    res.json({ success: true, record: result.rows[0] });
  } catch (err) {
    console.error("Edit error:", err);
    res.status(500).json({ error: err.message });
  }
});

// CRITICAL FOR VERCEL SERVERLESS
module.exports = app;

// DO NOT USE app.listen() — VERCEL WILL CRASH IF YOU DO
// DELETE THIS BLOCK:
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => { ... });