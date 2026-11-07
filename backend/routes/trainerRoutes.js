import express from "express";
import db from "../config/db.js";

const router = express.Router();

// GET - All Trainers
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM trainers ORDER BY id DESC"
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch trainers",
      error: error.message
    });
  }
});

// POST - Add Trainer
router.post("/", async (req, res) => {
  try {
    const {
      trainer_name,
      email,
      phone,
      gender,
      specialization,
      experience,
      salary,
      joining_date,
      status
    } = req.body;

    if (!trainer_name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required"
      });
    }

    const [result] = await db.query(
      `INSERT INTO trainers
      (trainer_name, email, phone, gender, specialization,
       experience, salary, joining_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trainer_name,
        email,
        phone,
        gender || null,
        specialization || null,
        Number(experience) || 0,
        Number(salary) || 0,
        joining_date || null,
        status || "Active"
      ]
    );

    res.status(201).json({
      success: true,
      message: "Trainer added successfully",
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add trainer",
      error: error.message
    });
  }
});

// PUT - Update Trainer
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      trainer_name,
      email,
      phone,
      gender,
      specialization,
      experience,
      salary,
      joining_date,
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE trainers SET
       trainer_name = ?,
       email = ?,
       phone = ?,
       gender = ?,
       specialization = ?,
       experience = ?,
       salary = ?,
       joining_date = ?,
       status = ?
       WHERE id = ?`,
      [
        trainer_name,
        email,
        phone,
        gender || null,
        specialization || null,
        Number(experience) || 0,
        Number(salary) || 0,
        joining_date || null,
        status || "Active",
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found"
      });
    }

    res.json({
      success: true,
      message: "Trainer updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update trainer",
      error: error.message
    });
  }
});

// DELETE - Delete Trainer
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM trainers WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found"
      });
    }

    res.json({
      success: true,
      message: "Trainer deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete trainer",
      error: error.message
    });
  }
});

export default router;