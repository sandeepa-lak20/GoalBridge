import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    university: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },

    fieldOfStudy: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },

    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    skills: {
      type: [String],
      default: [],
    },

    careerInterests: {
      type: [String],
      default: [],
    },

    // User's selected career
    selectedCareer: {
      uri: {
        type: String,
        default: "",
        trim: true,
      },
      title: {
        type: String,
        default: "",
        trim: true,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
