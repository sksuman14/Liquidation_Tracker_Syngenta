// api/approve.js  ← POST /api/approve

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone_number, record_date, role, user } = req.body;

  // Only these roles can approve now
  if (!["TSM", "AM", "ZM", "NSM"].includes(role)) {
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
    const currentStatus = record.status || "pending_tsm";

    const statusFlow = [
      "pending_tsm",
      "approved_by_tsm",
      "approved_by_am",
      "approved_by_zm",
      "approved_by_nsm",
      "fully_approved"
    ];

    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= 5) {  // 5 = last step before fully_approved
      return res.status(400).json({ error: "Invalid status or already fully approved" });
    }

    const roleToStatus = {
      TSM: "approved_by_tsm",
      AM:  "approved_by_am",
      ZM:  "approved_by_zm",
      NSM: "approved_by_nsm"
    };

    const nextExpectedStatus = statusFlow[currentIndex + 1];

    // Special case: NSM approval → directly to fully_approved
    const finalStatus = role === "NSM" ? "fully_approved" : roleToStatus[role];

    if (finalStatus !== nextExpectedStatus && role !== "NSM") {
      return res.status(400).json({ error: "Not your turn!" });
    }

    const approvalTag = `${user} (${role})`;
    if (approvedBy.includes(approvalTag)) {
      return res.status(400).json({ error: "You have already approved this record" });
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
    `, [finalStatus, approvalTag, approvalTag, phone_number, record_date]);

    res.status(200).json({ success: true, record: result.rows[0] });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ error: err.message });
  }
}