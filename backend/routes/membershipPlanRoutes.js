
import express from "express";
import db from "../config/db.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// GET ALL ACTIVE PLANS (Public - User can view)
router.get("/", async (req, res) => {
    try {
        const [plans] = await db.query(
            `SELECT plan_id, plan_name, duration, amount,
                    description, status
             FROM membership_plans
             WHERE status = 'Active'
             ORDER BY amount ASC`
        );

        res.json({
            success: true,
            data: plans
        });

    } catch (error) {
        console.error("Get Plans Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load membership plans"
        });
    }
});

// ADD PLAN (Admin Only)
router.post("/", adminAuthMiddleware, async (req, res) => {
    try {
        const { plan_name, duration, amount, description } = req.body;

        if (
            !plan_name ||
            !Number.isInteger(Number(duration)) ||
            Number(duration) <= 0 ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid plan name, duration and amount are required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO membership_plans
             (plan_name, duration, amount, description)
             VALUES (?, ?, ?, ?)`,
            [
                plan_name.trim(),
                Number(duration),
                Number(amount),
                description?.trim() || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Membership plan added successfully",
            plan_id: result.insertId
        });

    } catch (error) {
        console.error("Add Plan Error:", error);

        res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
            success: false,
            message: error.code === "ER_DUP_ENTRY"
                ? "This plan name already exists"
                : "Failed to add membership plan"
        });
    }
});

// UPDATE PLAN (Admin Only)
router.put("/:id", adminAuthMiddleware, async (req, res) => {
    try {
        const { plan_name, duration, amount, description, status } = req.body;
        const id = Number(req.params.id);

        if (
            !Number.isInteger(id) || id <= 0 ||
            !plan_name?.trim() ||
            !Number.isInteger(Number(duration)) ||
            Number(duration) <= 0 ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0 ||
            !["Active", "Inactive"].includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid plan details are required"
            });
        }

        const [result] = await db.query(
            `UPDATE membership_plans
             SET plan_name = ?, duration = ?, amount = ?,
                 description = ?, status = ?
             WHERE plan_id = ?`,
            [
                plan_name.trim(),
                Number(duration),
                Number(amount),
                description?.trim() || null,
                status,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Membership plan not found"
            });
        }

        res.json({
            success: true,
            message: "Membership plan updated successfully"
        });

    } catch (error) {
        console.error("Update Plan Error:", error);

        res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
            success: false,
            message: error.code === "ER_DUP_ENTRY"
                ? "This plan name already exists"
                : "Failed to update membership plan"
        });
    }
});

// DELETE PLAN (Admin Only)
router.delete("/:id", adminAuthMiddleware, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid plan ID"
            });
        }

        const [result] = await db.query(
            "DELETE FROM membership_plans WHERE plan_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Membership plan not found"
            });
        }

        res.json({
            success: true,
            message: "Membership plan deleted successfully"
        });

    } catch (error) {
        console.error("Delete Plan Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete membership plan"
        });
    }
});

export default router;
