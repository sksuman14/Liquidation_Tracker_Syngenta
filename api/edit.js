// api/edit.js  ← PATCH /api/edit

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone_number, record_date, role, username, ...updates } = req.body;

  try {
    const findRecord = await pool.query(
      `SELECT status FROM complete_records WHERE phone_number = $1 AND record_date = $2 LIMIT 1`, 
      [phone_number, record_date]
    );

    if (findRecord.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    if (findRecord.rows[0].status === "fully_approved") {
      return res.status(400).json({ error: "Cannot edit fully approved" });
    }

    const allowed = ["employee_name", "hq", "zone", "area", "products"];
    const fields = Object.keys(updates)
      .filter(k => allowed.includes(k))
      .map((k, i) => `${k} = $${i + 1}`)
      .join(", ");

    if (!fields) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const values = Object.keys(updates)
      .filter(k => allowed.includes(k))
      .map(k => Array.isArray(updates[k]) ? JSON.stringify(updates[k]) : updates[k]);

    const query = `UPDATE complete_records 
                   SET ${fields}, edited_by = $${values.length + 1}, edited_at = NOW()
                   WHERE phone_number = $${values.length + 2} AND record_date = $${values.length + 3} 
                   RETURNING *`;

    const result = await pool.query(query, [
      ...values, 
      `${username} (${role})`, 
      phone_number, 
      record_date
    ]);

    res.status(200).json({ success: true, record: result.rows[0] });
  } catch (err) {
    console.error("Edit error:", err);
    res.status(500).json({ error: err.message });
  }
}