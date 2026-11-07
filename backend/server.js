
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db.js";

import memberRoutes from "./routes/memberRoutes.js";
import trainerRoutes from "./routes/trainerRoutes.js";
import membershipRoutes from "./routes/membershipRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import userPaymentRoutes from "./routes/userPaymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import membershipPlanRoutes from "./routes/membershipPlanRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Home
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to GymStreak API"
    });
});

// Health Check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "GymStreak Backend is Running"
    });
});

// Database Check
app.get("/api/db-check", async (req, res) => {
    try {
        const connection = await db.getConnection();
        await connection.ping();
        connection.release();

        res.json({
            success: true,
            message: "MySQL Connected Successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "MySQL Connection Failed"
        });
    }
});

// Member APIs
app.use("/api/members", memberRoutes);

// Trainer APIs
app.use("/api/trainers", trainerRoutes);

// Membership APIs
app.use("/api/memberships", membershipRoutes);

app.use("/api/attendance", attendanceRoutes);

// Payment APIs
app.use("/api/payments", paymentRoutes);

app.use("/api/users", userRoutes);

app.use("/api/user-payments", userPaymentRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/membership-plans", membershipPlanRoutes);
// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`GymStreak Server running on port ${PORT}`);
});
