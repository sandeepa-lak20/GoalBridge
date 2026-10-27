
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Profile from "./Profile";
import CareerPaths from "./CareerPaths";

const API_URL = "http://localhost:5000/api/goals";

function getDeadlineStatus(goal) {
  if (goal.completed) return "Completed";
  if (!goal.deadline) return "No Deadline";

  const now = new Date();
  const today = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const [year, month, day] = goal.deadline
    .split("-")
    .map(Number);

  const deadline = Date.UTC(year, month - 1, day);
  const daysLeft = Math.round(
    (deadline - today) / 86400000
  );

  if (daysLeft < 0) return "Overdue";
  if (daysLeft === 0) return "Due Today";
  if (daysLeft <= 3) return "Due Soon";
  return "Upcoming";
}

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const userId = user?.id || user?._id;

  const [profileName, setProfileName] = useState(
    user?.firstName || "User"
  );
  const [activeSection, setActiveSection] =
    useState("dashboard");

  const [goals, setGoals] = useState([]);
  const [goalsRefreshKey, setGoalsRefreshKey] = useState(0);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [busyGoalId, setBusyGoalId] = useState(null);
  const [goalError, setGoalError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalCategory, setGoalCategory] = useState("Learning");
  const [goalPriority, setGoalPriority] = useState("Medium");
  const [goalDate, setGoalDate] = useState("");

  const [deadlineFilter, setDeadlineFilter] = useState("All");
  const [goalSort, setGoalSort] = useState("deadline");
  const [dashboardCareer, setDashboardCareer] = useState(null);

  // Delete confirmation states
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // Authenticated API requests
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
          "Your login session has expired. Please log in again."
        );
      }
      throw new Error(
        data.message || "Something went wrong."
      );
    }

    return data;
  }

  // Load goals
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
            data.message || "Failed to load goals."
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("Unexpected response from Goals API.");
        }

        if (!cancelled) setGoals(data);
      } catch (error) {
        if (!cancelled) setGoalError(error.message);
      } finally {
        if (!cancelled) setLoadingGoals(false);
      }
    }

    fetchGoals();

    return () => {
      cancelled = true;
    };
  }, [token, userId, goalsRefreshKey]);

  // Load selected career
  useEffect(() => {
    if (!token || activeSection !== "dashboard") return;

    let cancelled = false;

    async function fetchSelectedCareer() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/career-paths/selected",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load selected career.");
        }

        const data = await response.json();

        if (!cancelled) {
          setDashboardCareer(
            data.selectedCareer?.uri
              ? data.selectedCareer
              : null
          );
        }
      } catch (error) {
        console.error("Career loading error:", error);
      }
    }

    fetchSelectedCareer();

    return () => {
      cancelled = true;
    };
  }, [token, activeSection]);

  function resetGoalForm() {
    setGoalTitle("");
    setGoalDescription("");
    setGoalCategory("Learning");
    setGoalPriority("Medium");
    setGoalDate("");
    setEditingGoalId(null);
    setShowForm(false);
  }

  function scrollToSection(id) {
    setActiveSection(id);

    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function openAddGoalForm() {
    resetGoalForm();
    setGoalError("");
    setShowForm(true);
    scrollToSection("my-goals");
  }

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
        const data = await goalRequest(`/${editingGoalId}`, {
          method: "PUT",
          body: JSON.stringify(goalData),
        });

        setGoals((previous) =>
          previous.map((goal) =>
            goal._id === editingGoalId ? data.goal : goal
          )
        );
      } else {
        const data = await goalRequest("", {
          method: "POST",
          body: JSON.stringify({
            ...goalData,
            completed: false,
          }),
        });

        setGoals((previous) => [data.goal, ...previous]);
      }

      resetGoalForm();
    } catch (error) {
      setGoalError(error.message);
    } finally {
      setSavingGoal(false);
    }
  }

  async function toggleGoal(id) {
    if (busyGoalId || savingGoal) return;

    const selectedGoal = goals.find((goal) => goal._id === id);
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

      setGoals((previous) =>
        previous.map((goal) =>
          goal._id === id ? data.goal : goal
        )
      );
    } catch (error) {
      setGoalError(error.message);
    } finally {
      setBusyGoalId(null);
    }
  }

  // Open confirmation dialog
  function confirmDeleteGoal(goal) {
    if (busyGoalId || savingGoal) return;

    setGoalToDelete(goal);
    setDeleteError("");
  }

  // Close confirmation dialog
  function cancelDeleteGoal() {
    if (busyGoalId) return;

    setGoalToDelete(null);
    setDeleteError("");
  }

  // Delete only after confirmation
  async function deleteGoal() {
    if (!goalToDelete || busyGoalId || savingGoal) return;

    const id = goalToDelete._id;

    try {
      setBusyGoalId(id);
      setGoalError("");
      setDeleteError("");

      await goalRequest(`/${id}`, {
        method: "DELETE",
      });

      setGoals((previous) =>
        previous.filter((goal) => goal._id !== id)
      );

      if (editingGoalId === id) {
        resetGoalForm();
      }

      setGoalToDelete(null);
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setBusyGoalId(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  // Goal statistics
  const activeGoals = goals.filter(
    (goal) => !goal.completed
  ).length;

  const completedGoals = goals.filter(
    (goal) => goal.completed
  ).length;

  const overdueGoals = goals.filter(
    (goal) => getDeadlineStatus(goal) === "Overdue"
  ).length;

  const dueTodayGoals = goals.filter(
    (goal) => getDeadlineStatus(goal) === "Due Today"
  ).length;

  const dueSoonGoals = goals.filter(
    (goal) => getDeadlineStatus(goal) === "Due Soon"
  ).length;

  const progress = goals.length
    ? Math.round((completedGoals / goals.length) * 100)
    : 0;

  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  const upcomingGoals = goals
    .filter((goal) => !goal.completed && goal.deadline)
    .sort((a, b) =>
      a.deadline.localeCompare(b.deadline)
    );

  const filteredGoals = goals
    .filter((goal) => {
      if (deadlineFilter === "All") return true;
      return getDeadlineStatus(goal) === deadlineFilter;
    })
    .sort((a, b) => {
      if (goalSort === "priority") {
        const priorityOrder = {
          High: 1,
          Medium: 2,
          Low: 3,
        };

        return (
          (priorityOrder[a.priority || "Medium"] ?? 2) -
          (priorityOrder[b.priority || "Medium"] ?? 2)
        );
      }

      return (a.deadline || "9999-12-31").localeCompare(
        b.deadline || "9999-12-31"
      );
    });

  const stats = [
    {
      icon: "🧭",
      title: "Career Path",
      value: dashboardCareer?.title || "Not selected",
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

        <p className="sidebar-heading">MAIN MENU</p>

        <nav className="sidebar-menu">
          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "dashboard" ? "active" : ""
            }`}
            onClick={() => scrollToSection("dashboard")}
          >
            🏠 Dashboard
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "my-goals" ? "active" : ""
            }`}
            onClick={() => scrollToSection("my-goals")}
          >
            🎯 My Goals
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "career-paths" ? "active" : ""
            }`}
            onClick={() => setActiveSection("career-paths")}
          >
            🧭 Career Paths
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "profile" ? "active" : ""
            }`}
            onClick={() => setActiveSection("profile")}
          >
            👤 My Profile
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-avatar">
            {profileName.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{profileName}</strong>
            <p>GoalBridge Member</p>
          </div>
        </div>
      </aside>

      {/* MAIN PAGE */}
      <div className="dashboard-page">

        <header className="dashboard-header">
          <div className="dashboard-brand">
            🌉 GoalBridge
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout →
          </button>
        </header>

        <main className="dashboard-main" id="dashboard">

          {activeSection === "profile" ? (
            <Profile
              onSaved={(updatedUser) =>
                setProfileName(updatedUser.firstName)
              }
            />
          ) : activeSection === "career-paths" ? (
            <CareerPaths
              onCareerSelected={setDashboardCareer}
              onGoToGoals={() => {
                setGoalsRefreshKey((previous) => previous + 1);
                setActiveSection("my-goals");

                requestAnimationFrame(() => {
                  document
                    .getElementById("my-goals")
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                });
              }}
            />
          ) : (
            <>

              {/* WELCOME SECTION */}
              <section className="dashboard-welcome">
                <span className="dashboard-tag">
                  YOUR PERSONAL DASHBOARD
                </span>

                <h1>
                  Welcome back, {profileName}! 👋
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

              {/* DEADLINE OVERVIEW */}
              <section className="dashboard-section">
                <h2>📅 Deadline Overview</h2>

                <p className="section-subtitle">
                  See which goals need your attention.
                </p>

                <div className="deadline-summary">
                  <div className="deadline-summary-card overdue-card">
                    <h3>{overdueGoals}</h3>
                    <p>Overdue Goals</p>
                  </div>

                  <div className="deadline-summary-card today-card">
                    <h3>{dueTodayGoals}</h3>
                    <p>Due Today</p>
                  </div>

                  <div className="deadline-summary-card soon-card">
                    <h3>{dueSoonGoals}</h3>
                    <p>Due Soon</p>
                  </div>

                  <div className="deadline-summary-card completed-card">
                    <h3>{completedGoals}</h3>
                    <p>Completed Goals</p>
                  </div>
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
                    style={{ width: `${progress}%` }}
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

                  <h2>Start your career journey 🚀</h2>

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
                    <span>{goals.length > 0 ? "✓" : "2"}</span>
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

                {/* FILTER AND SORT */}
                <div className="goal-filter-bar">
                  <div>
                    <label htmlFor="deadline-filter">
                      Filter by Status
                    </label>

                    <select
                      id="deadline-filter"
                      value={deadlineFilter}
                      onChange={(e) =>
                        setDeadlineFilter(e.target.value)
                      }
                    >
                      <option value="All">All Goals</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Due Today">Due Today</option>
                      <option value="Due Soon">Due Soon</option>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Completed">Completed</option>
                      <option value="No Deadline">No Deadline</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="goal-sort">
                      Sort Goals
                    </label>

                    <select
                      id="goal-sort"
                      value={goalSort}
                      onChange={(e) =>
                        setGoalSort(e.target.value)
                      }
                    >
                      <option value="deadline">
                        Nearest Deadline
                      </option>
                      <option value="priority">
                        Highest Priority
                      </option>
                    </select>
                  </div>
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

                {/* CREATE / EDIT FORM */}
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
                      onChange={(e) =>
                        setGoalPriority(e.target.value)
                      }
                    >
                      <option value="High">
                        High Priority
                      </option>
                      <option value="Medium">
                        Medium Priority
                      </option>
                      <option value="Low">
                        Low Priority
                      </option>
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
                    <div className="empty-goal-icon">🎯</div>
                    <h3>No goals added yet</h3>
                    <p>
                      Your future starts with one goal.
                      Add your first goal to begin.
                    </p>
                  </div>
                ) : filteredGoals.length === 0 ? (
                  <div className="goals-empty">
                    <div className="empty-goal-icon">🔎</div>
                    <h3>No matching goals</h3>
                    <p>
                      No goals match the selected status.
                      Try changing the filter.
                    </p>
                  </div>
                ) : (
                  <div className="goals-list">
                    {filteredGoals.map((goal) => (
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
                              goal.completed ? "goal-done" : ""
                            }
                          >
                            {goal.title}
                          </strong>

                          {goal.description && (
                            <p>{goal.description}</p>
                          )}

                          <div className="goal-meta">
                            <span>{goal.category}</span>

                            <span
                              className={`goal-priority priority-${(
                                goal.priority || "Medium"
                              ).toLowerCase()}`}
                            >
                              {goal.priority || "Medium"} Priority
                            </span>

                            {goal.deadline && (
                              <span>📅 {goal.deadline}</span>
                            )}

                            <span
                              className={`deadline-status status-${getDeadlineStatus(
                                goal
                              )
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`}
                            >
                              {getDeadlineStatus(goal)}
                            </span>
                          </div>
                        </div>

                        {/* EDIT BUTTON */}
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
                            confirmDeleteGoal(goal)
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
            </>
          )}
        </main>
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      {goalToDelete && (
        <div
          className="delete-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cancelDeleteGoal();
            }
          }}
        >
          <div
            className="delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                cancelDeleteGoal();
              }
            }}
          >
            <div className="delete-modal-icon">
              ⚠️
            </div>

            <h2 id="delete-modal-title">
              Delete Goal?
            </h2>

            <p id="delete-modal-description">
              Are you sure you want to delete
              <strong> "{goalToDelete.title}"</strong>?
            </p>

            <p className="delete-modal-warning">
              This action cannot be undone.
            </p>

            {deleteError && (
              <p
                className="delete-modal-error"
                role="alert"
              >
                {deleteError}
              </p>
            )}

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel-btn"
                onClick={cancelDeleteGoal}
                disabled={busyGoalId !== null}
                autoFocus
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm-btn"
                onClick={deleteGoal}
                disabled={busyGoalId !== null}
              >
                {busyGoalId !== null
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
