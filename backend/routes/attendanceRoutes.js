
import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET: All Attendance Records
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                a.attendance_id,
                a.member_id,
                m.full_name,
                a.attendance_date,
                a.status,
                a.check_in
            FROM attendance a
            JOIN members m
            ON a.member_id = m.member_id
            ORDER BY a.attendance_date DESC, a.attendance_id DESC
        `);

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Get Attendance Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch attendance"
        });
    }
});


// POST: Mark Attendance
router.post("/", async (req, res) => {
    try {
        const { member_id, attendance_date, status, check_in } = req.body;

        if (!member_id || !attendance_date || !status) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields"
            });
        }

        if (!["Present", "Absent", "Late"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attendance status"
            });
        }

        await db.query(
            `INSERT INTO attendance
            (member_id, attendance_date, status, check_in)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            check_in = VALUES(check_in)`,
            [member_id, attendance_date, status, check_in || null]
        );

        res.status(201).json({
            success: true,
            message: "Attendance Saved Successfully"
        });

    } catch (error) {
        console.error("Mark Attendance Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to save attendance"
        });
    }
});

export default router;
