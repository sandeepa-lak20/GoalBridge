
import { useEffect, useState } from "react";
import "./Profile.css";
import ChangePassword from "./ChangePassword";

const API = "http://localhost:5000/api/profile";

const blank = {
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  university: "",
  fieldOfStudy: "",
  bio: "",
  skills: [],
  careerInterests: [],
};

export default function Profile({ onSaved }) {
  const [profile, setProfile] = useState(blank);

  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  // Load profile from MongoDB
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch(API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load your profile."
          );
        }

        if (active) {
          setProfile({ ...blank, ...data.user });
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [token]);

  // Update an input field
  function update(key, value) {
    setProfile((previous) => ({
      ...previous,
      [key]: value,
    }));

    setMessage("");
  }

  // Add a skill or career interest
  function addTag(key, value, clearInput) {
    const item = value.trim();

    if (
      item &&
      item.length <= 60 &&
      profile[key].length < 30 &&
      !profile[key].includes(item)
    ) {
      update(key, [...profile[key], item]);
    }

    clearInput("");
  }

  // Remove a skill or career interest
  function removeTag(key, item) {
    update(
      key,
      profile[key].filter((tag) => tag !== item)
    );
  }

  // Save profile to MongoDB
  async function save(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(API, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not save profile."
        );
      }

      setProfile({ ...blank, ...data.user });

      // Update locally stored user details
      const previous = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...previous,
          ...data.user,
        })
      );

      // Update dashboard greeting
      onSaved?.(data.user);

      setMessage("Your profile was saved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="profile-panel">
        <p>Loading your profile...</p>
      </section>
    );
  }

  return (
    <section className="profile-screen">
      <div className="profile-heading">
        <span className="dashboard-tag">
          YOUR ACCOUNT
        </span>
        
        <h1>My Profile</h1>

        <p>
          Keep your personal details and career interests
          up to date.
        </p>
      </div>

      <div className="profile-panel">
        {/* Profile header */}
        <div className="profile-identity">
          <div className="profile-avatar">
            {(profile.firstName?.[0] || "U").toUpperCase()}
          </div>

          <div>
            <h2>
              {profile.firstName} {profile.lastName}
            </h2>
            <p>@{profile.username}</p>
          </div>
        </div>

        <form onSubmit={save} className="profile-form">
          {/* Personal information */}
          <h3>Personal Information</h3>

          <div className="profile-grid">
            <label>
              First Name
              <input
                required
                maxLength={60}
                value={profile.firstName}
                onChange={(e) =>
                  update("firstName", e.target.value)
                }
              />
            </label>

            <label>
              Last Name
              <input
                required
                maxLength={60}
                value={profile.lastName}
                onChange={(e) =>
                  update("lastName", e.target.value)
                }
              />
            </label>

            <label>
              Email Address
              <input
                readOnly
                value={profile.email}
                title="Email cannot be changed here"
              />
            </label>

            <label>
              Username
              <input
                readOnly
                value={profile.username}
                title="Username cannot be changed here"
              />
            </label>
          </div>

          {/* Education */}
          <h3>Education</h3>

          <div className="profile-grid">
            <label>
              University / Institute
              <input
                maxLength={120}
                placeholder="Your university"
                value={profile.university}
                onChange={(e) =>
                  update("university", e.target.value)
                }
              />
            </label>

            <label>
              Field of Study
              <input
                maxLength={120}
                placeholder="e.g. Computer Engineering"
                value={profile.fieldOfStudy}
                onChange={(e) =>
                  update("fieldOfStudy", e.target.value)
                }
              />
            </label>
          </div>

          {/* Career development */}
          <h3>Career Development</h3>

          <label>Technical Skills</label>

          <div className="profile-add-row">
            <input
              value={skillInput}
              maxLength={60}
              placeholder="e.g. React, Java, Python"
              onChange={(e) =>
                setSkillInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(
                    "skills",
                    skillInput,
                    setSkillInput
                  );
                }
              }}
            />

            <button
              type="button"
              onClick={() =>
                addTag(
                  "skills",
                  skillInput,
                  setSkillInput
                )
              }
            >
              Add Skill
            </button>
          </div>

          <div className="profile-tags">
            {profile.skills.map((skill) => (
              <span key={skill}>
                {skill}
                <button
                  type="button"
                  aria-label={`Remove ${skill}`}
                  onClick={() =>
                    removeTag("skills", skill)
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <label>Career Interests</label>

          <div className="profile-add-row">
            <input
              value={interestInput}
              maxLength={60}
              placeholder="e.g. Software Engineering"
              onChange={(e) =>
                setInterestInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(
                    "careerInterests",
                    interestInput,
                    setInterestInput
                  );
                }
              }}
            />

            <button
              type="button"
              onClick={() =>
                addTag(
                  "careerInterests",
                  interestInput,
                  setInterestInput
                )
              }
            >
              Add Interest
            </button>
          </div>

          <div className="profile-tags">
            {profile.careerInterests.map((interest) => (
              <span key={interest}>
                {interest}
                <button
                  type="button"
                  aria-label={`Remove ${interest}`}
                  onClick={() =>
                    removeTag("careerInterests", interest)
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* About Me */}
          <label>
            About Me
            <textarea
              rows={4}
              maxLength={500}
              placeholder="Write a little about your goals and interests..."
              value={profile.bio}
              onChange={(e) =>
                update("bio", e.target.value)
              }
            />
          </label>

          {/* Messages */}
          {error && (
            <p className="profile-error" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="profile-success" role="status">
              {message}
            </p>
          )}

          <div className="profile-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
                </form>

        <ChangePassword />
      </div>
    </section>
  );
}
