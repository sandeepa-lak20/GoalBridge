
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/", authMiddleware, async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // Check that all fields are provided
    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "Please fill in all password fields.",
      });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must have at least 8 characters.",
      });
    }

    if (newPassword.length > 72) {
      return res.status(400).json({
        message: "New password must not exceed 72 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match.",
      });
    }

    // Get user including password hash
    const user = await User.findById(req.user.id)
      .select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Check current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    // Prevent reusing the current password
    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        message: "New password must be different from current password.",
      });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      12
    );

    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    return res.status(200).json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error.message);

    return res.status(500).json({
      message: "Unable to change password.",
    });
  }
});

export default router;
