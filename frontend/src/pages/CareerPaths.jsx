
import { useState } from "react";
import "./CareerPaths.css";

const API_URL = "http://localhost:5000/api/career-paths";
const GOALS_API_URL = "http://localhost:5000/api/goals";

function CareerPaths({ onCareerSelected, onGoToGoals }) {
  // Career search states
  const [search, setSearch] = useState("");
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Page navigation
  const [currentView, setCurrentView] = useState("search");

  // Career details states
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Save career states
  const [savingCareer, setSavingCareer] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  // Skill-to-goal states
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [addingGoals, setAddingGoals] = useState(false);
  const [goalMessage, setGoalMessage] = useState("");
  const [goalError, setGoalError] = useState("");
  const [showGoToGoals, setShowGoToGoals] = useState(false);

  function resetSkillSelection() {
    setSelectedSkills([]);
    setGoalMessage("");
    setGoalError("");
    setShowGoToGoals(false);
  }

  // Search careers using ESCO API
  async function searchCareers(e) {
    e.preventDefault();

    if (search.trim().length < 2) {
      setError("Enter at least 2 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setCareers([]);
    setSearched(true);
    setSelectedCareer(null);
    setDetailsError("");
    setSaveMessage("");
    setSaveError("");
    resetSkillSelection();

    try {
      const response = await fetch(
        `${API_URL}/search?q=${encodeURIComponent(search.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to search careers."
        );
      }

      setCareers(data.careers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Load career details
  async function viewCareerDetails(career) {
    setSelectedCareer(null);
    setDetailsError("");
    setSaveMessage("");
    setSaveError("");
    resetSkillSelection();
    setDetailsLoading(true);
    setCurrentView("details");

    window.scrollTo({ top: 0, behavior: "instant" });

    try {
      const response = await fetch(
        `${API_URL}/details?uri=${encodeURIComponent(career.uri)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load career details."
        );
      }

      setSelectedCareer({
        ...data,
        title: data.title || career.title,
      });
    } catch (err) {
      setDetailsError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  // Return to search results
  function backToSearch() {
    if (addingGoals) return;

    setCurrentView("search");
    setSelectedCareer(null);
    setDetailsError("");
    setSaveMessage("");
    setSaveError("");
    resetSkillSelection();

    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // Save selected career to MongoDB
  async function selectCareerPath() {
    if (!selectedCareer || savingCareer) return;

    setSavingCareer(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in to select a career.");
      }

      const response = await fetch(
        `${API_URL}/selected`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uri: selectedCareer.uri,
            title: selectedCareer.title,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save career."
        );
      }

      onCareerSelected?.(data.selectedCareer);
      setSaveMessage("Career path selected successfully!");
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSavingCareer(false);
    }
  }

  // Select or deselect a skill
  function toggleSkill(skill) {
    if (addingGoals) return;

    const key = skill.uri || skill.title;

    setSelectedSkills((previous) => {
      const alreadySelected = previous.some(
        (item) => (item.uri || item.title) === key
      );

      if (alreadySelected) {
        return previous.filter(
          (item) => (item.uri || item.title) !== key
        );
      }

      return [...previous, skill];
    });

    setGoalMessage("");
    setGoalError("");
    setShowGoToGoals(false);
  }

  // Create goals from selected skills
  async function addSkillsToGoals() {
    if (addingGoals || selectedSkills.length === 0) return;

    setAddingGoals(true);
    setGoalMessage("");
    setGoalError("");
    setShowGoToGoals(false);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in to add goals.");
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Retrieve existing goals for duplicate checking
      const existingResponse = await fetch(GOALS_API_URL, {
        headers,
      });

      const existingData = await existingResponse
        .json()
        .catch(() => null);

      if (!existingResponse.ok) {
        throw new Error(
          existingData?.message || "Unable to check existing goals."
        );
      }

      if (!Array.isArray(existingData)) {
        throw new Error("Unexpected response from Goals API.");
      }

      const existingTitles = new Set(
        existingData.map((goal) =>
          goal.title.trim().toLowerCase()
        )
      );

      let addedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      // Create one goal for each selected skill
      for (const skill of selectedSkills) {
        const title = `Learn ${skill.title}`.slice(0, 100);
        const normalizedTitle = title.trim().toLowerCase();

        if (existingTitles.has(normalizedTitle)) {
          skippedCount++;
          continue;
        }

        try {
          const response = await fetch(GOALS_API_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({
              title,
              description:
                `Develop ${skill.title} skills for the ` +
                `${selectedCareer.title} career path.`,
              category: "Learning",
              priority: "Medium",
              deadline: "",
              completed: false,
            }),
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              data.message || `Failed to add ${skill.title}.`
            );
          }

          existingTitles.add(normalizedTitle);
          addedCount++;
        } catch (err) {
          console.error("Add skill goal error:", err);
          failedCount++;
        }
      }

      const messages = [];

      if (addedCount > 0) {
        messages.push(
          `${addedCount} learning goal(s) added successfully.`
        );
      }

      if (skippedCount > 0) {
        messages.push(
          `${skippedCount} duplicate goal(s) skipped.`
        );
      }

      if (messages.length > 0) {
        setGoalMessage(messages.join(" "));
      }

      if (failedCount > 0) {
        setGoalError(
          `${failedCount} goal(s) could not be added. Please try again.`
        );
      }

      if (addedCount > 0 || skippedCount > 0) {
        setShowGoToGoals(true);
      }

      // Keep failed skills selected so the user can retry.
      // Successful and duplicate skills are removed from selection
      // on a fully successful request.
      if (failedCount === 0) {
        setSelectedSkills([]);
      }
    } catch (err) {
      setGoalError(err.message);
    } finally {
      setAddingGoals(false);
    }
  }

  function renderSkillList(skills, type) {
    if (!skills?.length) {
      return <p>No {type.toLowerCase()} skills available.</p>;
    }

    return (
      <div className="career-skills-list">
        {skills.map((skill) => {
          const key = skill.uri || skill.title;
          const checked = selectedSkills.some(
            (item) => (item.uri || item.title) === key
          );

          return (
            <label
              className={`career-skill-selectable ${
                checked ? "selected" : ""
              }`}
              key={key}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={addingGoals}
                onChange={() => toggleSkill(skill)}
              />

              <span>{skill.title}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <section className="career-paths-page">

      {/* SEARCH VIEW */}
      {currentView === "search" && (
        <>
          <div className="career-paths-heading">
            <span className="dashboard-tag">
              CAREER EXPLORATION
            </span>

            <h1>Explore Career Paths</h1>

            <p>
              Discover career opportunities and explore
              different career directions.
            </p>
          </div>

          <form
            className="career-search-form"
            onSubmit={searchCareers}
          >
            <input
              type="text"
              placeholder="Search careers, e.g. Software Developer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search Careers"}
            </button>
          </form>

          {error && (
            <p className="career-error" role="alert">
              {error}
            </p>
          )}

          {!searched && (
            <div className="career-empty">
              <span>🧭</span>
              <h3>Find Your Career Path</h3>
              <p>
                Search for a career to explore available
                opportunities.
              </p>
            </div>
          )}

          {loading && (
            <p className="career-loading">
              Searching ESCO careers...
            </p>
          )}

          {!loading && searched && !error && (
            <div className="career-results">
              <h2>Search Results</h2>

              {careers.length === 0 ? (
                <p>No matching careers found.</p>
              ) : (
                <div className="career-results-grid">
                  {careers.map((career) => (
                    <div
                      className="career-result-card"
                      key={career.uri}
                    >
                      <div className="career-result-icon">
                        💼
                      </div>

                      <h3>{career.title}</h3>

                      <button
                        type="button"
                        className="career-details-btn"
                        onClick={() =>
                          viewCareerDetails(career)
                        }
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* DETAILS VIEW */}
      {currentView === "details" && (
        <div className="career-details-view">

          <button
            type="button"
            className="career-back-btn"
            onClick={backToSearch}
            disabled={addingGoals}
          >
            ← Back to Career Search
          </button>

          {detailsLoading && (
            <p className="career-loading">
              Loading career details...
            </p>
          )}

          {detailsError && (
            <p className="career-error" role="alert">
              {detailsError}
            </p>
          )}

          {selectedCareer && (
            <div className="career-details-panel">

              <h1>{selectedCareer.title}</h1>

              <h3>Career Description</h3>

              <p>
                {typeof selectedCareer.description ===
                  "string" &&
                selectedCareer.description
                  ? selectedCareer.description
                  : "Description not available."}
              </p>

              {/* ESSENTIAL SKILLS */}
              <h3>Essential Skills</h3>
              <p>Select the skills you want to learn.</p>

              {renderSkillList(
                selectedCareer.essentialSkills,
                "Essential"
              )}

              {/* OPTIONAL SKILLS */}
              <h3>Optional Skills</h3>

              {renderSkillList(
                selectedCareer.optionalSkills,
                "Optional"
              )}

              {/* ADD SKILLS TO GOALS */}
              <div className="career-add-goals-section">
                <h3>Add Skills to My Goals</h3>

                <p>
                  {selectedSkills.length} skill(s) selected
                </p>

                <button
                  type="button"
                  className="career-add-goals-btn"
                  onClick={addSkillsToGoals}
                  disabled={
                    addingGoals ||
                    selectedSkills.length === 0
                  }
                >
                  {addingGoals
                    ? "Adding Goals..."
                    : `+ Add ${selectedSkills.length} Selected Skills to My Goals`}
                </button>

                {goalMessage && (
                  <p
                    className="career-save-message"
                    role="status"
                  >
                    {goalMessage}
                  </p>
                )}

                {goalError && (
                  <p
                    className="career-save-error"
                    role="alert"
                  >
                    {goalError}
                  </p>
                )}

                {showGoToGoals && (
                  <button
                    type="button"
                    className="career-go-to-goals-btn"
                    onClick={() => onGoToGoals?.()}
                  >
                    Go to My Goals →
                  </button>
                )}
              </div>

              {/* SELECT CAREER PATH */}
              <button
                type="button"
                className="career-select-btn"
                onClick={selectCareerPath}
                disabled={savingCareer}
              >
                {savingCareer
                  ? "Saving..."
                  : "Select This Career Path"}
              </button>

              {saveMessage && (
                <p
                  className="career-save-message"
                  role="status"
                >
                  {saveMessage}
                </p>
              )}

              {saveError && (
                <p
                  className="career-save-error"
                  role="alert"
                >
                  {saveError}
                </p>
              )}

            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default CareerPaths;
