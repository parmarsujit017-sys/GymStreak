import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET: All Memberships
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM memberships ORDER BY id DESC"
        );

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Get Membership Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch memberships"
        });
    }
});


// POST: Add Membership
router.post("/", async (req, res) => {
    try {
        const {
            member_id,
            plan_name,
            duration,
            start_date,
            end_date,
            amount,
            payment_status,
            status,
            payment_method
        } = req.body;

        if (
            !member_id ||
            !plan_name ||
            !duration ||
            !start_date ||
            !end_date ||
            amount === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields"
            });
        }

        const [result] = await db.query(
            `INSERT INTO memberships
            (member_id, plan_name, duration, start_date, end_date,
            amount, payment_status, status, payment_method)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                member_id,
                plan_name,
                duration,
                start_date,
                end_date,
                amount,
                payment_status || "Pending",
                status || "Active",
                payment_method || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Membership Added Successfully",
            id: result.insertId
        });

    } catch (error) {
        console.error("Add Membership Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add membership"
        });
    }
});


// PUT: Update Membership
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            member_id,
            plan_name,
            duration,
            start_date,
            end_date,
            amount,
            payment_status,
            status,
            payment_method
        } = req.body;

        if (
            !member_id ||
            !plan_name ||
            !duration ||
            !start_date ||
            !end_date ||
            amount === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields"
            });
        }

        const [result] = await db.query(
            `UPDATE memberships SET
            member_id = ?,
            plan_name = ?,
            duration = ?,
            start_date = ?,
            end_date = ?,
            amount = ?,
            payment_status = ?,
            status = ?,
            payment_method = ?
            WHERE id = ?`,
            [
                member_id,
                plan_name,
                duration,
                start_date,
                end_date,
                amount,
                payment_status || "Pending",
                status || "Active",
                payment_method || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Membership Not Found"
            });
        }

        res.json({
            success: true,
            message: "Membership Updated Successfully"
        });

    } catch (error) {
        console.error("Update Membership Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update membership"
        });
    }
});


// DELETE: Delete Membership
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM memberships WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Membership Not Found"
            });
        }

        res.json({
            success: true,
            message: "Membership Deleted Successfully"
        });

    } catch (error) {
        console.error("Delete Membership Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete membership"
        });
    }
});

export default router;