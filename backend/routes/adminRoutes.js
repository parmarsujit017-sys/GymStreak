
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const router = express.Router();

// ADMIN LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const [rows] = await db.query(
            `SELECT admin_id, full_name, email, password
             FROM admin
             WHERE email = ?`,
            [email.trim().toLowerCase()]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const admin = rows[0];

        let isMatch = false;

        // Support existing bcrypt passwords and legacy plain passwords
        if (
            admin.password.startsWith("$2a$") ||
            admin.password.startsWith("$2b$") ||
            admin.password.startsWith("$2y$")
        ) {
            isMatch = await bcrypt.compare(password, admin.password);
        } else if (password === admin.password) {
            isMatch = true;

            // Upgrade old plain password to bcrypt hash
            const hashedPassword = await bcrypt.hash(password, 10);

            await db.query(
                "UPDATE admin SET password = ? WHERE admin_id = ?",
                [hashedPassword, admin.admin_id]
            );
        }

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                admin_id: admin.admin_id,
                role: "admin"
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            success: true,
            message: "Admin login successful",
            token,
            admin: {
                admin_id: admin.admin_id,
                full_name: admin.full_name,
                email: admin.email,
                role: "admin"
            }
        });

    } catch (error) {
        console.error("Admin Login Error:", error);

        res.status(500).json({
            success: false,
            message: "Admin login failed"
        });
    }
});

export default router;
