import verifyAdmin from "../middleware/verifyAdmin.js";
import express from "express";
import db from "../config/db.js";

const router = express.Router();

// 1. GET ALL MEMBERS + SEARCH
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";

    const [members] = await db.execute(
      `SELECT * FROM members
       WHERE full_name LIKE ?
       OR email LIKE ?
       OR phone LIKE ?
       ORDER BY member_id DESC`,
      [`%${search}%`, `%${search}%`, `%${search}%`]
    );

    res.json({
      success: true,
      data: members
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch members"
    });
  }
});


/* =========================================
   1. GET ALL REGISTERED USERS (ADMIN ONLY)
========================================= */

router.get("/registered-users", verifyAdmin, async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT
                u.user_id,
                u.full_name,
                u.email,
                u.member_id,
                m.full_name AS member_name
             FROM users u
             LEFT JOIN members m ON u.member_id = m.member_id
             ORDER BY u.user_id DESC`
        );

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error("Registered Users Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch registered users"
        });
    }
});


/* =========================================
   2. LINK USER WITH MEMBER (ADMIN ONLY)
========================================= */

router.put("/:id/link-user", verifyAdmin, async (req, res) => {
    try {
        const memberId = req.params.id;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "Please select a registered user"
            });
        }

        // Check member
        const [members] = await db.query(
            "SELECT member_id FROM members WHERE member_id = ?",
            [memberId]
        );

        if (members.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Member not found"
            });
        }

        // Check user
        const [users] = await db.query(
            "SELECT user_id, member_id FROM users WHERE user_id = ?",
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Registered user not found"
            });
        }

        // Check if user is already linked to another member
        if (
            users[0].member_id !== null &&
            Number(users[0].member_id) !== Number(memberId)
        ) {
            return res.status(409).json({
                success: false,
                message: "This user is already linked to another member"
            });
        }

        // Check if member is already linked to another user
        const [existingLink] = await db.query(
            `SELECT user_id FROM users
             WHERE member_id = ? AND user_id != ?`,
            [memberId, user_id]
        );

        if (existingLink.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This member is already linked to another user"
            });
        }

        // Link user with member
        await db.query(
            "UPDATE users SET member_id = ? WHERE user_id = ?",
            [memberId, user_id]
        );

        res.json({
            success: true,
            message: "User linked with member successfully"
        });

    } catch (error) {
        console.error("Link User Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to link user with member"
        });
    }
});


// 2. GET SINGLE MEMBER
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM members WHERE member_id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    res.json({ success: true, data: rows[0] });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch member"
    });
  }
});

// 3. ADD MEMBER
router.post("/", async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      gender,
      date_of_birth,
      join_date,
      membership_plan,
      status
    } = req.body;

    if (
      !full_name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !join_date ||
      !membership_plan
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    const [result] = await db.execute(
      `INSERT INTO members
      (full_name, email, phone, gender, date_of_birth,
       join_date, membership_plan, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name.trim(),
        email.trim(),
        phone.trim(),
        gender || null,
        date_of_birth || null,
        join_date,
        membership_plan,
        status || "Active"
      ]
    );

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      member_id: result.insertId
    });

  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to add member"
    });
  }
});

// 4. UPDATE MEMBER
router.put("/:id", async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      gender,
      date_of_birth,
      join_date,
      membership_plan,
      status
    } = req.body;

    if (
      !full_name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !join_date ||
      !membership_plan
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    const [result] = await db.execute(
      `UPDATE members SET
       full_name = ?, email = ?, phone = ?,
       gender = ?, date_of_birth = ?,
       join_date = ?, membership_plan = ?, status = ?
       WHERE member_id = ?`,
      [
        full_name.trim(),
        email.trim(),
        phone.trim(),
        gender || null,
        date_of_birth || null,
        join_date,
        membership_plan,
        status,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    res.json({
      success: true,
      message: "Member updated successfully"
    });

  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to update member"
    });
  }
});

// 5. DELETE MEMBER
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM members WHERE member_id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    res.json({
      success: true,
      message: "Member deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete member"
    });
  }
});

export default router;
