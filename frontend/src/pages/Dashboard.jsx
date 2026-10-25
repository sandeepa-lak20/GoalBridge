
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_URL = "http://localhost:5000/api/goals";

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const firstName = user?.firstName || "User";
  const userId = user?.id || user?._id;

  // Dashboard states
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [goalCategory, setGoalCategory] = useState("Learning");
  const [goalPriority, setGoalPriority] = useState("Medium");
  const [activeSection, setActiveSection] = useState("dashboard");

  // API states
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [busyGoalId, setBusyGoalId] = useState(null);
  const [goalError, setGoalError] = useState("");

  // NEW: Store the ID of the goal being edited
  const [editingGoalId, setEditingGoalId] = useState(null);

  // Helper for authenticated backend requests
  async function goalRequest(path = "", options = {}) {
    let response;

    try {
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
    } catch {
      throw new Error(
        "Cannot connect to the backend. Make sure it is running on port 5000."
      );
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          "Your login session has expired. Please log out and log in again."
        );
      }

      throw new Error(
        data.message || "Something went wrong. Please try again."
      );
    }

    return data;
  }

  // Load goals from MongoDB
  useEffect(() => {
    if (!token || !userId) {
      setLoadingGoals(false);
      return;
    }

    let cancelled = false;

    async function fetchGoals() {
      try {
        setLoadingGoals(true);
        setGoalError("");

        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Your login session has expired. Please log in again."
              : data.message || "Failed to load goals."
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("Unexpected response from the Goal API.");
        }

        if (!cancelled) {
          setGoals(data);
        }
      } catch (error) {
        if (!cancelled) {
          setGoalError(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoadingGoals(false);
        }
      }
    }

    fetchGoals();

    return () => {
      cancelled = true;
    };
  }, [token, userId]);

  // Clear form fields and editing state
  function resetGoalForm() {
    setGoalTitle("");
    setGoalDescription("");
    setGoalCategory("Learning");
     setGoalPriority("Medium");
    setGoalDate("");
    setEditingGoalId(null);
    setShowForm(false);
  }

  // Open form for creating a new goal
  function openAddGoalForm() {
    resetGoalForm();
    setGoalError("");
    setShowForm(true);
    scrollToSection("my-goals");
  }

  // NEW: Open form with existing goal details
  function editGoal(goal) {
    if (savingGoal || busyGoalId) return;

    setEditingGoalId(goal._id);
    setGoalTitle(goal.title);
    setGoalDescription(goal.description || "");
    setGoalCategory(goal.category || "Learning");
    setGoalPriority(goal.priority || "Medium");
    setGoalDate(goal.deadline || "");
    setGoalError("");
    setShowForm(true);

    scrollToSection("my-goals");
  }

  // Create or update a goal
  async function saveGoal(e) {
    e.preventDefault();

    if (!goalTitle.trim() || savingGoal) return;

    try {
      setSavingGoal(true);
      setGoalError("");

      const goalData = {
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        category: goalCategory,
        deadline: goalDate,
        priority: goalPriority,
      };

      if (editingGoalId) {
        // UPDATE existing goal using PUT
        const data = await goalRequest(
          `/${editingGoalId}`,
          {
            method: "PUT",
            body: JSON.stringify(goalData),
          }
        );

        setGoals((previousGoals) =>
          previousGoals.map((goal) =>
            goal._id === editingGoalId
              ? data.goal
              : goal
          )
        );
      } else {
        // CREATE new goal using POST
        const data = await goalRequest("", {
          method: "POST",
          body: JSON.stringify({
            ...goalData,
            completed: false,
          }),
        });

        setGoals((previousGoals) => [
          data.goal,
          ...previousGoals,
        ]);
      }

      resetGoalForm();
    } catch (error) {
      setGoalError(error.message);
    } finally {
      setSavingGoal(false);
    }
  }

  // Complete or uncomplete a goal
  async function toggleGoal(id) {
    if (busyGoalId || savingGoal) return;

    const selectedGoal = goals.find(
      (goal) => goal._id === id
    );

    if (!selectedGoal) return;

    try {
      setBusyGoalId(id);
      setGoalError("");

      const data = await goalRequest(`/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          completed: !selectedGoal.completed,
        }),
      });

      setGoals((previousGoals) =>
        previousGoals.map((goal) =>
          goal._id === id ? data.goal : goal
        )
      );
    } catch (error) {
      setGoalError(error.message);
    } finally {
      setBusyGoalId(null);
    }
  }

  // Delete a goal
  async function deleteGoal(id) {
    if (busyGoalId || savingGoal) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this goal?"
    );

    if (!confirmed) return;

    try {
      setBusyGoalId(id);
      setGoalError("");

      await goalRequest(`/${id}`, {
        method: "DELETE",
      });

      setGoals((previousGoals) =>
        previousGoals.filter(
          (goal) => goal._id !== id
        )
      );

      // Close edit form if the deleted goal was being edited
      if (editingGoalId === id) {
        resetGoalForm();
      }
    } catch (error) {
      setGoalError(error.message);
    } finally {
      setBusyGoalId(null);
    }
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  // Sidebar navigation
  function scrollToSection(id) {
    setActiveSection(id);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // Calculate dashboard statistics
  const activeGoals = goals.filter(
    (goal) => !goal.completed
  ).length;

  const completedGoals = goals.filter(
    (goal) => goal.completed
  ).length;

  const progress = goals.length
    ? Math.round(
        (completedGoals / goals.length) * 100
      )
    : 0;

  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const upcomingGoals = goals
    .filter(
      (goal) => !goal.completed && goal.deadline
    )
    .sort((a, b) =>
      a.deadline.localeCompare(b.deadline)
    );

  const stats = [
    {
      icon: "🧭",
      title: "Career Path",
      value: "Not selected",
    },
    {
      icon: "🎯",
      title: "Active Goals",
      value: activeGoals,
    },
    {
      icon: "✅",
      title: "Completed Goals",
      value: completedGoals,
    },
    {
      icon: "📈",
      title: "Your Progress",
      value: `${progress}%`,
    },
  ];

  if (!token || !userId) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          🌉 Goal<span>Bridge</span>
        </div>

        <p className="sidebar-heading">
          MAIN MENU
        </p>

        <nav className="sidebar-menu">

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              scrollToSection("dashboard")
            }
          >
            🏠 Dashboard
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "my-goals"
                ? "active"
                : ""
            }`}
            onClick={() =>
              scrollToSection("my-goals")
            }
          >
            🎯 My Goals
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "career-paths"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveSection("career-paths")
            }
          >
            🧭 Career Paths
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "profile"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveSection("profile")
            }
          >
            👤 My Profile
          </button>

        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{firstName}</strong>
            <p>GoalBridge Member</p>
          </div>
        </div>
      </aside>

      {/* MAIN PAGE */}
      <div className="dashboard-page">

        {/* HEADER */}
        <header className="dashboard-header">
          <div className="dashboard-brand">
            🌉 Goal<span>Bridge</span>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout →
          </button>
        </header>

        <main
          className="dashboard-main"
          id="dashboard"
        >

          {/* WELCOME SECTION */}
          <section className="dashboard-welcome">

            <span className="dashboard-tag">
              YOUR PERSONAL DASHBOARD
            </span>

            <h1>
              Welcome back, {firstName}! 👋
            </h1>

            <p>
              Every great career starts with a plan.
              Let's take the next step toward your future.
            </p>

          </section>

          {/* CAREER OVERVIEW */}
          <section className="dashboard-section">

            <h2>Your Career Overview</h2>

            <p className="section-subtitle">
              Here is a quick look at your career journey.
            </p>

            <div className="dashboard-stats">
              {stats.map((stat) => (
                <div
                  className="stat-card"
                  key={stat.title}
                >
                  <div className="stat-icon">
                    {stat.icon}
                  </div>

                  <p>{stat.title}</p>
                  <h3>{stat.value}</h3>
                </div>
              ))}
            </div>

          </section>

          {/* OVERALL PROGRESS */}
          <section className="overall-progress-card">

            <div className="progress-heading">
              <div>
                <h2>Overall Goal Progress</h2>
                <p>See how far you have come.</p>
              </div>

              <strong>{progress}%</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <p>
              {completedGoals} of {goals.length} goals completed
            </p>

          </section>

          {/* GETTING STARTED AND JOURNEY */}
          <section className="dashboard-bottom">

            <div className="getting-started-card">

              <span className="dashboard-tag">
                GET STARTED
              </span>

              <h2>
                Start your career journey 🚀
              </h2>

              <p>
                Set your first career goal and start building
                a clear path toward your dream job.
              </p>

              <button
                className="start-goal-btn"
                onClick={openAddGoalForm}
              >
                + Create Your First Goal
              </button>

            </div>

            <div className="journey-card">

              <h2>Your Journey</h2>

              <div className="journey-item">
                <span>✓</span>

                <div>
                  <strong>Create your account</strong>
                  <p>Welcome to GoalBridge!</p>
                </div>
              </div>

              <div className="journey-item">
                <span>
                  {goals.length > 0 ? "✓" : "2"}
                </span>

                <div>
                  <strong>Set your first goal</strong>

                  <p>
                    {goals.length > 0
                      ? "Your goal journey has started!"
                      : "Plan what you want to achieve."}
                  </p>
                </div>
              </div>

              <div className="journey-item">
                <span>
                  {completedGoals > 0 ? "✓" : "3"}
                </span>

                <div>
                  <strong>Achieve your goals</strong>
                  <p>Track your progress and grow.</p>
                </div>
              </div>

            </div>
          </section>

          {/* MY GOALS */}
          <section
            className="dashboard-section my-goals-section"
            id="my-goals"
          >

            <div className="goals-heading">

              <div>
                <h2>🎯 My Goals</h2>

                <p className="section-subtitle">
                  Manage your personal and career goals.
                </p>
              </div>

              <button
                className="add-goal-btn"
                disabled={savingGoal}
                onClick={() => {
                  if (showForm) {
                    resetGoalForm();
                  } else {
                    openAddGoalForm();
                  }
                }}
              >
                {showForm ? "Cancel" : "+ Add Goal"}
              </button>

            </div>

            {/* API ERROR */}
            {goalError && (
              <p
                role="alert"
                style={{
                  color: "#dc2626",
                  marginBottom: "15px",
                }}
              >
                {goalError}
              </p>
            )}

            {/* ADD / EDIT GOAL FORM */}
            {showForm && (
              <form
                className="goal-form"
                onSubmit={saveGoal}
              >

                <h3>
                  {editingGoalId
                    ? "✏️ Edit Goal"
                    : "Create a New Goal"}
                </h3>

                <label htmlFor="goal-title">
                  Goal Title
                </label>

                <input
                  id="goal-title"
                  type="text"
                  placeholder="Example: Learn React"
                  value={goalTitle}
                  onChange={(e) =>
                    setGoalTitle(e.target.value)
                  }
                  required
                  maxLength={100}
                />

                <label htmlFor="goal-description">
                  Description
                </label>

                <textarea
                  id="goal-description"
                  placeholder="What do you want to achieve?"
                  value={goalDescription}
                  onChange={(e) =>
                    setGoalDescription(e.target.value)
                  }
                  rows={3}
                  maxLength={500}
                />

                <label htmlFor="goal-category">
                  Category
                </label>

                <select
                  id="goal-category"
                  value={goalCategory}
                  onChange={(e) =>
                    setGoalCategory(e.target.value)
                  }
                >
                  <option>Learning</option>
                  <option>Career</option>
                  <option>Projects</option>
                  <option>Personal Development</option>
                </select>

                <label htmlFor="goal-date">
                  Target Date
                </label>

                <input
                  id="goal-date"
                  type="date"
                  value={goalDate}
                  onChange={(e) =>
                    setGoalDate(e.target.value)
                  }
                />

                
                <label htmlFor="goal-priority">
                  Goal Priority
                </label>

                <select
                  id="goal-priority"
                  value={goalPriority}
                  onChange={(e) => setGoalPriority(e.target.value)}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>



                <div className="goal-form-actions">
                  <button
                    type="submit"
                    className="save-goal-btn"
                    disabled={savingGoal}
                  >
                    {savingGoal
                      ? "Saving..."
                      : editingGoalId
                      ? "Update Goal"
                      : "Save Goal"}
                  </button>

                  {editingGoalId && (
                    <button
                      type="button"
                      className="cancel-edit-btn"
                      disabled={savingGoal}
                      onClick={resetGoalForm}
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>

              </form>
            )}

            {/* GOALS LIST */}
            {loadingGoals ? (
              <div className="goals-empty">
                <p>Loading your goals...</p>
              </div>
            ) : goalError && goals.length === 0 ? (
              <div className="goals-empty">
                <p>
                  Could not load goals. Check the error above.
                </p>
              </div>
            ) : goals.length === 0 ? (
              <div className="goals-empty">

                <div className="empty-goal-icon">
                  🎯
                </div>

                <h3>No goals added yet</h3>

                <p>
                  Your future starts with one goal.
                  Add your first goal to begin.
                </p>

              </div>
            ) : (

              <div className="goals-list">

                {goals.map((goal) => (
                  <div
                    className="goal-list-item"
                    key={goal._id}
                  >

                    <input
                      type="checkbox"
                      checked={goal.completed}
                      disabled={
                        busyGoalId !== null || savingGoal
                      }
                      onChange={() =>
                        toggleGoal(goal._id)
                      }
                      aria-label={`Toggle completion for ${goal.title}`}
                    />

                    <div className="goal-item-info">

                      <strong
                        className={
                          goal.completed
                            ? "goal-done"
                            : ""
                        }
                      >
                        {goal.title}
                      </strong>

                      {goal.description && (
                        <p>{goal.description}</p>
                      )}

                      <div className="goal-meta">

                        <span>
                          {goal.category}
                        </span>

                        
                        <span
                          className={`goal-priority priority-${(
                            goal.priority || "Medium"
                          ).toLowerCase()}`}
                        >
                          {goal.priority || "Medium"} Priority
                        </span>


                        {goal.deadline && (
                          <span>
                            📅 {goal.deadline}
                          </span>
                        )}

                        <span>
                          {goal.completed
                            ? "Completed"
                            : "In Progress"}
                        </span>

                      </div>
                    </div>

                    {/* NEW EDIT BUTTON */}
                    <button
                      type="button"
                      className="edit-goal-btn"
                      disabled={
                        busyGoalId !== null || savingGoal
                      }
                      onClick={() => editGoal(goal)}
                      aria-label={`Edit ${goal.title}`}
                    >
                      ✏️ Edit
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                      type="button"
                      className="delete-goal-btn"
                      disabled={
                        busyGoalId !== null || savingGoal
                      }
                      onClick={() =>
                        deleteGoal(goal._id)
                      }
                      aria-label={`Delete ${goal.title}`}
                    >
                      ✕
                    </button>

                  </div>
                ))}

              </div>
            )}

          </section>

          {/* UPCOMING DEADLINES */}
          <section className="dashboard-section deadlines-section">

            <h2>📅 Upcoming Deadlines</h2>

            <p className="section-subtitle">
              Stay organized and complete your goals on time.
            </p>

            {loadingGoals ? (
              <div className="deadline-empty">
                <p>Loading deadlines...</p>
              </div>
            ) : upcomingGoals.length === 0 ? (
              <div className="deadline-empty">

                <span>🗓️</span>
                <p>No upcoming deadlines yet.</p>

              </div>
            ) : (

              <div className="deadline-list">

                {upcomingGoals.map((goal) => (
                  <div
                    className="deadline-item"
                    key={goal._id}
                  >

                    <div>
                      <strong>{goal.title}</strong>
                      <p>{goal.category}</p>
                    </div>

                    <span
                      className={
                        goal.deadline < today
                          ? "deadline-overdue"
                          : ""
                      }
                    >
                      {goal.deadline < today
                        ? "Overdue: "
                        : ""}

                      {goal.deadline}
                    </span>

                  </div>
                ))}

              </div>
            )}

          </section>

        </main>
      </div>
    </div>
  );
}

export default Dashboard;
