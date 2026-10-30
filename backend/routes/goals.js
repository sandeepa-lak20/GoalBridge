import express from "express";
import mongoose from "mongoose";
import Goal from "../models/Goal.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect every route in this file
router.use(authMiddleware);

const categories = [
  "Learning",
  "Career",
  "Projects",
  "Personal Development",
];

function validateGoal(body, partial = false) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return "Invalid goal data.";
  }

  const allowedFields = [
    "title",
    "description",
    "category",
    "deadline",
    "completed",
    "priority",
  ];

  const keys = Object.keys(body);

  if (keys.some((key) => !allowedFields.includes(key))) {
    return "Goal contains unsupported fields.";
  }

  if (partial && keys.length === 0) {
    return "Provide at least one field to update.";
  }

  if (!partial || "title" in body) {
    if (
      typeof body.title !== "string" ||
      !body.title.trim() ||
      body.title.trim().length > 100
    ) {
      return "Goal title must be between 1 and 100 characters.";
    }
  }

  if (
    "description" in body &&
    (
      typeof body.description !== "string" ||
      body.description.length > 500
    )
  ) {
    return "Description must be 500 characters or fewer.";
  }

  if (
    "category" in body &&
    !categories.includes(body.category)
  ) {
    return "Invalid goal category.";
  }

  if ("deadline" in body) {
    const value = body.deadline;

    if (typeof value !== "string") {
      return "Deadline must be a date string.";
    }

    if (value) {
      const validFormat = /^\d{4}-\d{2}-\d{2}$/.test(value);
      const date = new Date(value);

      if (
        !validFormat ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        return "Deadline must be a valid YYYY-MM-DD date.";
      }
    }
  }

  if (
    "completed" in body &&
    typeof body.completed !== "boolean"
  ) {
    return "Completed must be true or false.";
  }

  
  if (
    "priority" in body &&
    !["High", "Medium", "Low"].includes(body.priority)
  ) {
    return "Invalid goal priority.";
  }

  return null;
}

// GET ALL GOALS
// GET /api/goals
router.get("/", async (req, res) => {
  try {
    const goals = await Goal.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json(goals);
  } catch (error) {
    console.error("Get goals error:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve goals.",
    });
  }
});

// CREATE GOAL
// POST /api/goals
router.post("/", async (req, res) => {
  try {
    const errorMessage = validateGoal(req.body);

    if (errorMessage) {
      return res.status(400).json({
        message: errorMessage,
      });
    }

    const goal = await Goal.create({
      user: req.user.id,
      title: req.body.title.trim(),
      description: req.body.description ?? "",
      category: req.body.category ?? "Learning",
      priority: req.body.priority ?? "Medium",
      deadline: req.body.deadline ?? "",
      completed: req.body.completed ?? false,
    });

    return res.status(201).json({
      message: "Goal created successfully.",
      goal,
    });
  } catch (error) {
    console.error("Create goal error:", error.message);

    return res.status(500).json({
      message: "Failed to create goal.",
    });
  }
});

// GET ONE GOAL
// GET /api/goals/:id
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid goal ID.",
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found.",
      });
    }

    return res.status(200).json(goal);
  } catch (error) {
    console.error("Get goal error:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve goal.",
    });
  }
});

// UPDATE GOAL
// PUT /api/goals/:id
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid goal ID.",
      });
    }

    const errorMessage = validateGoal(req.body, true);

    if (errorMessage) {
      return res.status(400).json({
        message: errorMessage,
      });
    }

    const updates = {};

    const allowedFields = [
      "title",
      "description",
      "category",
      "deadline",
      "completed",
      "priority",
    ];

    for (const field of allowedFields) {
      if (Object.hasOwn(req.body, field)) {
        updates[field] =
          field === "title"
            ? req.body[field].trim()
            : req.body[field];
      }
    }

    const goal = await Goal.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      { $set: updates },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found.",
      });
    }

    return res.status(200).json({
      message: "Goal updated successfully.",
      goal,
    });
  } catch (error) {
    console.error("Update goal error:", error.message);

    return res.status(500).json({
      message: "Failed to update goal.",
    });
  }
});

// DELETE GOAL
// DELETE /api/goals/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid goal ID.",
      });
    }

    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found.",
      });
    }

    return res.status(200).json({
      message: "Goal deleted successfully.",
    });
  } catch (error) {
    console.error("Delete goal error:", error.message);

    return res.status(500).json({
      message: "Failed to delete goal.",
    });
  }
});

export default router;
