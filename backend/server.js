import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import goalRoutes from "./routes/goals.js";
import profileRoutes from "./routes/profile.js";
import changePasswordRoutes from "./routes/changePassword.js";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json({ limit: "20kb" }));

// Test API
app.get("/", (req, res) => {
  res.json({
    message: "GoalBridge API is running.",
  });
});

// Existing authentication routes
app.use("/api/auth", authRoutes);

// New goal management routes
app.use("/api/goals", goalRoutes);

// New profile management routes
app.use("/api/profile", profileRoutes);

// New change password routes
app.use("/api/profile/change-password", changePasswordRoutes);

// Invalid API routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
});

// Handle errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON request.",
    });
  }

  if (err.status === 413) {
    return res.status(413).json({
      message: "Request body is too large.",
    });
  }

  console.error("Server error:", err.message);

  return res.status(500).json({
    message: "Internal server error.",
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
      throw new Error(
        "MONGO_URI and JWT_SECRET must be configured."
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(
        `Backend running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );
    process.exit(1);
  }
}

startServer();
