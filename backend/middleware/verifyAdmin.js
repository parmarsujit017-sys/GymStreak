
import jwt from "jsonwebtoken";

const verifyAdmin = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication required"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "admin" || !decoded.admin_id) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        req.admin = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin token"
        });
    }
};

export default verifyAdmin;
