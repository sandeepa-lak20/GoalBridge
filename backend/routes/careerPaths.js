
import express from "express";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const ESCO_API = "https://ec.europa.eu/esco/api";

// ------------------------------------
// 1. SEARCH CAREERS
// ------------------------------------

router.get("/search", async (req, res) => {
  try {
    const searchText = String(req.query.q || "").trim();

    if (searchText.length < 2) {
      return res.status(400).json({
        message: "Enter at least 2 characters to search.",
      });
    }

    const url = new URL(`${ESCO_API}/search`);

    url.searchParams.set("text", searchText);
    url.searchParams.set("type", "occupation");
    url.searchParams.set("language", "en");
    url.searchParams.set("limit", "20");

    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `ESCO API returned status ${response.status}`
      );
    }

    const data = await response.json();

    const careers = (data._embedded?.results || []).map(
      (career) => ({
        uri: career.uri,
        title: career.title,
      })
    );

    return res.json({
      total: data.total || 0,
      careers,
    });
  } catch (error) {
    console.error("ESCO search error:", error.message);

    return res.status(502).json({
      message: "Unable to fetch careers from ESCO API.",
    });
  }
});

// ------------------------------------
// 2. GET CAREER DETAILS AND SKILLS
// ------------------------------------

router.get("/details", async (req, res) => {
  try {
    const uri = String(req.query.uri || "").trim();

    if (
      !/^https?:\/\/data\.europa\.eu\/esco\/occupation\/[a-zA-Z0-9-]+$/.test(
        uri
      )
    ) {
      return res.status(400).json({
        message: "Invalid career URI.",
      });
    }

    const url = new URL(`${ESCO_API}/resource/occupation`);

    url.searchParams.set("uri", uri);
    url.searchParams.set("language", "en");

    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `ESCO API returned status ${response.status}`
      );
    }

    const data = await response.json();

    const essentialSkills = (
      data._links?.hasEssentialSkill || []
    ).map((skill) => ({
      uri: skill.uri,
      title: skill.title,
    }));

    const optionalSkills = (
      data._links?.hasOptionalSkill || []
    ).map((skill) => ({
      uri: skill.uri,
      title: skill.title,
    }));

    const description =
      data.description?.en?.literal ||
      data.description?.en ||
      data.description ||
      "";

    return res.json({
      uri: data.uri || uri,
      title: data.title || "",
      description,
      essentialSkills,
      optionalSkills,
    });
  } catch (error) {
    console.error("ESCO details error:", error.message);

    return res.status(502).json({
      message: "Unable to load career details.",
    });
  }
});

// ------------------------------------
// 3. GET USER'S SELECTED CAREER
// ------------------------------------

router.get(
  "/selected",
  authMiddleware,
  async (req, res) => {
    try {
      // Correct user ID from authMiddleware
      const userId = req.user.id;

      const user = await User.findById(userId).select(
        "selectedCareer"
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      const selectedCareer =
        user.selectedCareer?.uri
          ? user.selectedCareer
          : null;

      return res.json({
        selectedCareer,
      });
    } catch (error) {
      console.error(
        "Get selected career error:",
        error.message
      );

      return res.status(500).json({
        message: "Unable to load selected career.",
      });
    }
  }
);

// ------------------------------------
// 4. SAVE OR CHANGE SELECTED CAREER
// ------------------------------------

router.put(
  "/selected",
  authMiddleware,
  async (req, res) => {
    try {
      // Correct user ID from authMiddleware
      const userId = req.user.id;

      const { uri, title } = req.body;

      if (
        typeof uri !== "string" ||
        typeof title !== "string" ||
        !/^https?:\/\/data\.europa\.eu\/esco\/occupation\/[a-zA-Z0-9-]+$/.test(
          uri
        ) ||
        !title.trim()
      ) {
        return res.status(400).json({
          message: "Valid career URI and title are required.",
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            selectedCareer: {
              uri: uri.trim(),
              title: title.trim(),
            },
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      return res.json({
        message: "Career path selected successfully.",
        selectedCareer: user.selectedCareer,
      });
    } catch (error) {
      console.error(
        "Save selected career error:",
        error.message
      );

      return res.status(500).json({
        message: "Unable to save selected career.",
      });
    }
  }
);

export default router;
