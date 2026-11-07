
import express from "express";
import crypto from "crypto";
import db from "../config/db.js";
import razorpay, { keyId } from "../config/razorpay.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();


// ======================================
// ADMIN: GET ALL PAYMENT RECORDS
// ======================================
router.get("/", adminAuthMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                p.payment_id,
                p.member_id,
                m.full_name,
                p.membership_id,
                ms.plan_name,
                p.amount,
                p.payment_date,
                p.payment_method,
                p.payment_status,
                p.transaction_id,
                p.notes
            FROM payments p
            JOIN members m ON p.member_id = m.member_id
            JOIN memberships ms ON p.membership_id = ms.id
            ORDER BY p.payment_id DESC
        `);

        return res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Get Payments Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch payments"
        });
    }
});


// ======================================
// ADMIN: ADD MANUAL PAYMENT
// ======================================
router.post("/", adminAuthMiddleware, async (req, res) => {
    try {
        const {
            member_id,
            membership_id,
            amount,
            payment_date,
            payment_method,
            payment_status,
            transaction_id,
            notes
        } = req.body;

        if (
            !member_id ||
            !membership_id ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0 ||
            !payment_date ||
            !payment_method
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter valid payment details"
            });
        }

        const allowedMethods = [
            "Cash",
            "UPI",
            "Card",
            "Bank Transfer",
            "Razorpay"
        ];

        const allowedStatuses = [
            "Paid",
            "Pending",
            "Failed"
        ];

        if (!allowedMethods.includes(payment_method)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        const finalStatus = payment_status || "Paid";

        if (!allowedStatuses.includes(finalStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment status"
            });
        }

        const [membership] = await db.query(
            `SELECT id
             FROM memberships
             WHERE id = ? AND member_id = ?`,
            [membership_id, member_id]
        );

        if (!membership.length) {
            return res.status(400).json({
                success: false,
                message: "Selected membership does not belong to this member"
            });
        }

        const [result] = await db.query(
            `INSERT INTO payments
            (
                member_id,
                membership_id,
                amount,
                payment_date,
                payment_method,
                payment_status,
                transaction_id,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                member_id,
                membership_id,
                amount,
                payment_date,
                payment_method,
                finalStatus,
                transaction_id || null,
                notes || null
            ]
        );

        if (finalStatus === "Paid") {
            await db.query(
                `UPDATE memberships
                 SET payment_status = 'Paid'
                 WHERE id = ?`,
                [membership_id]
            );
        }

        return res.status(201).json({
            success: true,
            message: "Payment Added Successfully",
            payment_id: result.insertId
        });

    } catch (error) {
        console.error("Add Payment Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add payment"
        });
    }
});


// ======================================
// ADMIN: UPDATE PAYMENT STATUS
// ======================================
router.put("/:id", adminAuthMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;

        const allowedStatuses = [
            "Paid",
            "Pending",
            "Failed"
        ];

        if (!allowedStatuses.includes(payment_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment status"
            });
        }

        const [result] = await db.query(
            `UPDATE payments
             SET payment_status = ?
             WHERE payment_id = ?`,
            [payment_status, id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: "Payment Not Found"
            });
        }

        const [rows] = await db.query(
            `SELECT membership_id
             FROM payments
             WHERE payment_id = ?`,
            [id]
        );

        if (rows.length) {
            await db.query(
                `UPDATE memberships
                 SET payment_status = ?
                 WHERE id = ?`,
                [payment_status, rows[0].membership_id]
            );
        }

        return res.json({
            success: true,
            message: "Payment Status Updated Successfully"
        });

    } catch (error) {
        console.error("Update Payment Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update payment"
        });
    }
});


// ======================================
// USER: CREATE RAZORPAY TEST ORDER
// ======================================
router.post("/razorpay/order", authMiddleware, async (req, res) => {
    try {
        console.log("\n========== RAZORPAY ORDER ==========");
        console.log("User ID:", req.user?.user_id);
        console.log("Plan ID:", req.body?.plan_id);

        // Check Razorpay configuration
        if (!razorpay) {
            console.log("ERROR: Razorpay instance is missing");

            return res.status(503).json({
                success: false,
                message: "Razorpay is not configured. Check backend environment."
            });
        }

        if (!keyId || !keyId.startsWith("rzp_test_")) {
            console.log("ERROR: Test Mode Key ID is missing or invalid");

            return res.status(503).json({
                success: false,
                message: "Valid Razorpay Test Mode Key ID is missing."
            });
        }

        const { plan_id } = req.body;

        if (!plan_id) {
            return res.status(400).json({
                success: false,
                message: "Please select a membership plan"
            });
        }

        // Step 1: Find user-member link
        console.log("Step 1: Checking user-member link...");

        const [users] = await db.query(
            `SELECT member_id
             FROM users
             WHERE user_id = ?`,
            [req.user.user_id]
        );

        console.log("User found:", users.length);

        if (!users.length || !users[0].member_id) {
            console.log("ERROR: User is not linked to a member");

            return res.status(400).json({
                success: false,
                message: "Your account is not linked to a member profile"
            });
        }

        const memberId = users[0].member_id;

        console.log("Member ID:", memberId);

        // Step 2: Find active plan
        console.log("Step 2: Checking membership plan...");

        const [plans] = await db.query(
            `SELECT
                plan_id,
                plan_name,
                duration,
                amount
             FROM membership_plans
             WHERE plan_id = ?
             AND status = 'Active'`,
            [plan_id]
        );

        console.log("Plan found:", plans.length);

        if (!plans.length) {
            console.log("ERROR: Plan not found or inactive");

            return res.status(404).json({
                success: false,
                message: "Membership plan not found or inactive"
            });
        }

        const plan = plans[0];

        const amountInPaise = Math.round(
            Number(plan.amount) * 100
        );

        if (
            !Number.isSafeInteger(amountInPaise) ||
            amountInPaise <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid membership plan amount"
            });
        }

        console.log("Plan Name:", plan.plan_name);
        console.log("Amount in paise:", amountInPaise);

        // Step 3: Create Razorpay order
        console.log("Step 3: Creating Razorpay order...");

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `gym_${req.user.user_id}_${Date.now()}`,
            notes: {
                user_id: String(req.user.user_id),
                member_id: String(memberId),
                plan_id: String(plan.plan_id)
            }
        });

        console.log("SUCCESS: Razorpay order created:", order.id);

        return res.status(201).json({
            success: true,
            message: "Razorpay order created",
            key_id: keyId,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            plan: {
                plan_id: plan.plan_id,
                plan_name: plan.plan_name,
                duration: plan.duration,
                amount: Number(plan.amount)
            }
        });

    } catch (error) {
        console.error("\n========== RAZORPAY ORDER ERROR ==========");
        console.error("Status:", error.statusCode);
        console.error("Code:", error.error?.code);
        console.error("Description:", error.error?.description);
        console.error("Message:", error.message);

        return res.status(500).json({
            success: false,
            message:
                error.error?.description ||
                error.message ||
                "Unable to create payment order"
        });
    }
});


// ======================================
// USER: VERIFY RAZORPAY TEST PAYMENT
// ======================================
router.post("/razorpay/verify", authMiddleware, async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: "Razorpay is not configured"
            });
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

        if (!keySecret) {
            return res.status(503).json({
                success: false,
                message: "Razorpay secret is not configured"
            });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment verification details are missing"
            });
        }

        // Verify payment signature
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(
                `${razorpay_order_id}|${razorpay_payment_id}`
            )
            .digest("hex");

        const expectedBuffer = Buffer.from(
            expectedSignature,
            "hex"
        );

        const receivedBuffer = Buffer.from(
            razorpay_signature,
            "hex"
        );

        if (
            expectedBuffer.length !== receivedBuffer.length ||
            !crypto.timingSafeEqual(
                expectedBuffer,
                receivedBuffer
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // Fetch order and payment from Razorpay
        const order = await razorpay.orders.fetch(
            razorpay_order_id
        );

        const payment = await razorpay.payments.fetch(
            razorpay_payment_id
        );

        if (
            String(order.notes?.user_id) !==
                String(req.user.user_id) ||
            payment.order_id !== razorpay_order_id ||
            payment.status !== "captured" ||
            payment.amount !== order.amount ||
            payment.currency !== "INR"
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment could not be verified as captured"
            });
        }

        const planId = Number(order.notes?.plan_id);
        const memberId = Number(order.notes?.member_id);

        if (!planId || !memberId) {
            return res.status(400).json({
                success: false,
                message: "Invalid order details"
            });
        }

        // Confirm user-member link
        const [users] = await db.query(
            `SELECT member_id
             FROM users
             WHERE user_id = ?
             AND member_id = ?`,
            [req.user.user_id, memberId]
        );

        if (!users.length) {
            return res.status(400).json({
                success: false,
                message: "User or member link not found"
            });
        }

        // Get plan details
        const [plans] = await db.query(
            `SELECT plan_id, plan_name, duration, amount
             FROM membership_plans
             WHERE plan_id = ?`,
            [planId]
        );

        if (!plans.length) {
            return res.status(400).json({
                success: false,
                message: "Membership plan not found"
            });
        }

        const plan = plans[0];

        const expectedAmount = Math.round(
            Number(plan.amount) * 100
        );

        if (
            expectedAmount !== order.amount ||
            expectedAmount !== payment.amount
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment amount does not match the selected plan"
            });
        }

        // Prevent duplicate payment processing
        const [existing] = await db.query(
            `SELECT payment_id, membership_id
             FROM payments
             WHERE transaction_id = ?`,
            [razorpay_payment_id]
        );

        if (existing.length) {
            return res.json({
                success: true,
                message: "Payment already verified",
                payment_id: existing[0].payment_id,
                membership_id: existing[0].membership_id
            });
        }

        // Start database transaction
        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Create membership
        const [membershipResult] = await connection.query(
            `INSERT INTO memberships
            (
                member_id,
                plan_name,
                duration,
                start_date,
                end_date,
                amount,
                payment_status,
                status,
                payment_method
            )
            VALUES (
                ?, ?, ?, CURDATE(),
                DATE_ADD(CURDATE(), INTERVAL ? DAY),
                ?, 'Paid', 'Active', 'Razorpay'
            )`,
            [
                memberId,
                plan.plan_name,
                plan.duration,
                plan.duration,
                plan.amount
            ]
        );

        const membershipId = membershipResult.insertId;

        // Create payment record
        const [paymentResult] = await connection.query(
            `INSERT INTO payments
            (
                member_id,
                membership_id,
                amount,
                payment_date,
                payment_method,
                payment_status,
                transaction_id,
                notes
            )
            VALUES (?, ?, ?, CURDATE(), 'Razorpay', 'Paid', ?, ?)`,
            [
                memberId,
                membershipId,
                plan.amount,
                razorpay_payment_id,
                `Razorpay order: ${razorpay_order_id}`
            ]
        );

        // Update member current plan
        await connection.query(
            `UPDATE members
             SET membership_plan = ?
             WHERE member_id = ?`,
            [plan.plan_name, memberId]
        );

        await connection.commit();
        transactionStarted = false;

        console.log("Payment verified successfully");
        console.log("Membership ID:", membershipId);
        console.log("Payment ID:", paymentResult.insertId);

        return res.status(200).json({
            success: true,
            message: "Payment verified and membership activated successfully",
            payment_id: paymentResult.insertId,
            membership_id: membershipId
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        console.error("Razorpay Verification Error:", error);

        return res.status(500).json({
            success: false,
            message: "Payment verification failed"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});


export default router;
