import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Only logged-in users can access profile routes
router.use(authMiddleware);

// Return safe profile information (never password)
function publicProfile(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username,
    university: user.university || "",
    fieldOfStudy: user.fieldOfStudy || "",
    bio: user.bio || "",
    skills: user.skills || [],
    careerInterests: user.careerInterests || [],
  };
}

// GET /api/profile
// Load the logged-in user's profile
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({
      user: publicProfile(user),
    });
  } catch (error) {
    console.error("Profile load error:", error.message);

    return res.status(500).json({
      message: "Unable to load profile.",
    });
  }
});

// PUT /api/profile
// Save changes to the logged-in user's profile
router.put("/", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      university,
      fieldOfStudy,
      bio,
      skills,
      careerInterests,
    } = req.body;

    const isText = (value, max) =>
      typeof value === "string" &&
      value.trim().length <= max;

    if (
      !isText(firstName, 60) ||
      !firstName.trim() ||
      !isText(lastName, 60) ||
      !lastName.trim() ||
      !isText(university, 120) ||
      !isText(fieldOfStudy, 120) ||
      !isText(bio, 500)
    ) {
      return res.status(400).json({
        message: "Please check the text fields and their lengths.",
      });
    }

    const validList = (items) =>
      Array.isArray(items) &&
      items.length <= 30 &&
      items.every(
        (item) =>
          typeof item === "string" &&
          item.trim().length > 0 &&
          item.trim().length <= 60
      );

    if (!validList(skills) || !validList(careerInterests)) {
      return res.status(400).json({
        message:
          "Skills and interests must contain at most 30 short items.",
      });
    }

    const cleanList = (items) => [
      ...new Set(items.map((item) => item.trim())),
    ];

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          university: university.trim(),
          fieldOfStudy: fieldOfStudy.trim(),
          bio: bio.trim(),
          skills: cleanList(skills),
          careerInterests: cleanList(careerInterests),
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({
      message: "Profile updated successfully.",
      user: publicProfile(user),
    });
  } catch (error) {
    console.error("Profile update error:", error.message);

    return res.status(500).json({
      message: "Unable to update profile.",
    });
  }
});

export default router;
