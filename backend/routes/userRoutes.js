import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const router = express.Router();

// =====================================
// AUTH MIDDLEWARE
// =====================================
const verifyUser = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Please login first."
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please login again."
        });
    }
};

// =====================================
// FIND / LINK MEMBER FOR LOGGED-IN USER
// =====================================
const getLinkedMemberId = async (userId) => {
    const [users] = await db.execute(
        "SELECT user_id, member_id, email FROM users WHERE user_id = ?",
        [userId]
    );

    if (users.length === 0) return null;

    if (users[0].member_id) {
        return users[0].member_id;
    }

    // Try linking by matching email.
    const [members] = await db.execute(
        "SELECT member_id FROM members WHERE LOWER(email) = LOWER(?) LIMIT 2",
        [users[0].email]
    );

    // Link only when exactly one matching member exists.
    if (members.length === 1) {
        await db.execute(
            "UPDATE users SET member_id = ? WHERE user_id = ? AND member_id IS NULL",
            [members[0].member_id, userId]
        );

        return members[0].member_id;
    }

    return null;
};

// =====================================
// REGISTER
// =====================================
router.post("/register", async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (!full_name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [existingUser] = await db.execute(
            "SELECT user_id FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered."
            });
        }

        // Link to an existing gym member if exactly one email matches.
        const [matchingMembers] = await db.execute(
            "SELECT member_id FROM members WHERE LOWER(email) = LOWER(?) LIMIT 2",
            [normalizedEmail]
        );

        const memberId =
            matchingMembers.length === 1 ? matchingMembers[0].member_id : null;

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            `INSERT INTO users (member_id, full_name, email, password)
             VALUES (?, ?, ?, ?)`,
            [memberId, full_name.trim(), normalizedEmail, hashedPassword]
        );

        return res.status(201).json({
            success: true,
            message: "Registration successful!",
            user_id: result.insertId
        });

    } catch (error) {
        console.error("Register Error:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed."
        });
    }
});

// =====================================
// LOGIN
// =====================================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await db.execute(
            "SELECT * FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing in .env");
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role: "user"
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Link an existing member if possible.
        let memberId = user.member_id;

        if (!memberId) {
            memberId = await getLinkedMemberId(user.user_id);
        }

        return res.status(200).json({
            success: true,
            message: "Login successful!",
            token,
            user: {
                user_id: user.user_id,
                member_id: memberId,
                full_name: user.full_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
});

// =====================================
// GET MY PROFILE
// =====================================
router.get("/me", verifyUser, async (req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT user_id, member_id, full_name, email, created_at
             FROM users WHERE user_id = ?`,
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const memberId = await getLinkedMemberId(req.user.user_id);

        let member = null;

        if (memberId) {
            const [rows] = await db.execute(
                `SELECT member_id, full_name, email, phone, gender,
                        date_of_birth, join_date, membership_plan, status
                 FROM members WHERE member_id = ?`,
                [memberId]
            );

            member = rows[0] || null;
        }

        res.json({
            success: true,
            data: {
                ...users[0],
                member_id: memberId,
                member
            }
        });

    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load profile."
        });
    }
});

// =====================================
// UPDATE MY PROFILE
// =====================================
router.put("/profile", verifyUser, async (req, res) => {
    try {
        const { full_name, email, phone, gender, date_of_birth } = req.body;

        if (!full_name?.trim() || !email?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [duplicateUsers] = await db.execute(
            "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
            [normalizedEmail, req.user.user_id]
        );

        if (duplicateUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This email is already used by another account."
            });
        }

        const memberId = await getLinkedMemberId(req.user.user_id);

        if (memberId) {
            const [duplicateMembers] = await db.execute(
                "SELECT member_id FROM members WHERE LOWER(email) = LOWER(?) AND member_id != ?",
                [normalizedEmail, memberId]
            );

            if (duplicateMembers.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "This email is already assigned to another gym member."
                });
            }
        }

        await db.execute(
            "UPDATE users SET full_name = ?, email = ? WHERE user_id = ?",
            [full_name.trim(), normalizedEmail, req.user.user_id]
        );

        if (memberId) {
            await db.execute(
                `UPDATE members
                 SET full_name = ?, email = ?, phone = ?, gender = ?, date_of_birth = ?
                 WHERE member_id = ?`,
                [
                    full_name.trim(),
                    normalizedEmail,
                    phone?.trim() || "",
                    gender || null,
                    date_of_birth || null,
                    memberId
                ]
            );
        }

        res.json({
            success: true,
            message: "Profile updated successfully."
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update profile."
        });
    }
});

// =====================================
// CHANGE PASSWORD
// =====================================
router.put("/password", verifyUser, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Both password fields are required."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must contain at least 6 characters."
            });
        }

        const [users] = await db.execute(
            "SELECT password FROM users WHERE user_id = ?",
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const isMatch = await bcrypt.compare(
            currentPassword,
            users[0].password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.execute(
            "UPDATE users SET password = ? WHERE user_id = ?",
            [hashedPassword, req.user.user_id]
        );

        res.json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to change password."
        });
    }
});

// =====================================
// USER DASHBOARD SUMMARY
// =====================================
router.get("/dashboard", verifyUser, async (req, res) => {
    try {
        const memberId = await getLinkedMemberId(req.user.user_id);

        if (!memberId) {
            return res.json({
                success: true,
                linked: false,
                message: "Your account is not linked to a gym member record yet.",
                data: {
                    membership: null,
                    total_attendance: 0,
                    present_days: 0,
                    late_days: 0,
                    total_paid: 0,
                    recent_attendance: []
                }
            });
        }

        const [memberships] = await db.execute(
            `SELECT id, plan_name, duration, start_date, end_date,
                    amount, payment_status, status, payment_method
             FROM memberships
             WHERE member_id = ?
             ORDER BY end_date DESC, id DESC`,
            [memberId]
        );

        const [attendanceSummary] = await db.execute(
            `SELECT
                COUNT(*) AS total_attendance,
                SUM(status = 'Present') AS present_days,
                SUM(status = 'Late') AS late_days,
                SUM(status = 'Absent') AS absent_days
             FROM attendance
             WHERE member_id = ?`,
            [memberId]
        );

        const [paymentSummary] = await db.execute(
            `SELECT
                COALESCE(SUM(CASE WHEN payment_status = 'Paid'
                    THEN amount ELSE 0 END), 0) AS total_paid,
                COUNT(*) AS total_payments
             FROM payments
             WHERE member_id = ?`,
            [memberId]
        );

        const [recentAttendance] = await db.execute(
            `SELECT attendance_id, attendance_date, status, check_in
             FROM attendance
             WHERE member_id = ?
             ORDER BY attendance_date DESC, attendance_id DESC
             LIMIT 5`,
            [memberId]
        );

        res.json({
            success: true,
            linked: true,
            data: {
                membership: memberships[0] || null,
                membership_history: memberships,
                total_attendance: Number(attendanceSummary[0].total_attendance || 0),
                present_days: Number(attendanceSummary[0].present_days || 0),
                late_days: Number(attendanceSummary[0].late_days || 0),
                absent_days: Number(attendanceSummary[0].absent_days || 0),
                total_paid: Number(paymentSummary[0].total_paid || 0),
                total_payments: Number(paymentSummary[0].total_payments || 0),
                recent_attendance: recentAttendance
            }
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load dashboard."
        });
    }
});

// =====================================
// MY MEMBERSHIPS
// =====================================
router.get("/memberships", verifyUser, async (req, res) => {
    try {
        const memberId = await getLinkedMemberId(req.user.user_id);

        if (!memberId) {
            return res.json({ success: true, data: [] });
        }

        const [rows] = await db.execute(
            `SELECT id, plan_name, duration, start_date, end_date,
                    amount, payment_status, status, payment_method, created_at
             FROM memberships
             WHERE member_id = ?
             ORDER BY id DESC`,
            [memberId]
        );

        res.json({ success: true, data: rows });

    } catch (error) {
        console.error("Membership Error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load memberships."
        });
    }
});

// =====================================
// MY ATTENDANCE
// =====================================
router.get("/attendance", verifyUser, async (req, res) => {
    try {
        const memberId = await getLinkedMemberId(req.user.user_id);

        if (!memberId) {
            return res.json({ success: true, data: [] });
        }

        const [rows] = await db.execute(
            `SELECT attendance_id, attendance_date, status, check_in
             FROM attendance
             WHERE member_id = ?
             ORDER BY attendance_date DESC, attendance_id DESC`,
            [memberId]
        );

        res.json({ success: true, data: rows });

    } catch (error) {
        console.error("Attendance Error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load attendance."
        });
    }
});

// =====================================
// MY PAYMENTS
// =====================================
router.get("/payments", verifyUser, async (req, res) => {
    try {
        const memberId = await getLinkedMemberId(req.user.user_id);

        if (!memberId) {
            return res.json({ success: true, data: [] });
        }

        const [rows] = await db.execute(
            `SELECT
                p.payment_id,
                p.membership_id,
                p.amount,
                p.payment_date,
                p.payment_method,
                p.payment_status,
                p.transaction_id,
                p.notes,
                m.plan_name
             FROM payments p
             LEFT JOIN memberships m ON p.membership_id = m.id
             WHERE p.member_id = ?
             ORDER BY p.payment_date DESC, p.payment_id DESC`,
            [memberId]
        );

        res.json({ success: true, data: rows });

    } catch (error) {
        console.error("Payment Error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to load payments."
        });
    }
});

export default router;