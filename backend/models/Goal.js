
import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    category: {
      type: String,
      enum: [
        "Learning",
        "Career",
        "Projects",
        "Personal Development",
      ],
      default: "Learning",
    },

    deadline: {
      type: String,
      default: "",
      validate: {
        validator: (value) =>
          !value ||
          (
            /^\d{4}-\d{2}-\d{2}$/.test(value) &&
            !Number.isNaN(Date.parse(value)) &&
            new Date(value).toISOString().slice(0, 10) === value
          ),
        message: "Deadline must be a valid YYYY-MM-DD date.",
      },
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Goal", goalSchema);
