
import express from "express";
import db from "../config/db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// GET LOGGED-IN USER'S PAYMENT HISTORY
router.get("/my", authMiddleware, async (req, res) => {
    try {
        const memberId = req.user.member_id;

        if (!memberId) {
            return res.status(403).json({
                success: false,
                message: "Your account is not linked with a gym member"
            });
        }

        const [payments] = await db.query(
            `SELECT
                p.payment_id,
                p.member_id,
                p.membership_id,
                m.full_name,
                ms.plan_name,
                p.amount,
                p.payment_date,
                p.payment_method,
                p.payment_status,
                p.transaction_id,
                p.notes
             FROM payments p
             JOIN members m
                ON p.member_id = m.member_id
             JOIN memberships ms
                ON p.membership_id = ms.id
             WHERE p.member_id = ?
             ORDER BY p.payment_date DESC, p.payment_id DESC`,
            [memberId]
        );

        res.json({
            success: true,
            message: "Your payment history fetched successfully",
            data: payments
        });

    } catch (error) {
        console.error("User Payment History Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch payment history"
        });
    }
});

export default router;
