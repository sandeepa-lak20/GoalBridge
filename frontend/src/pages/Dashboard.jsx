

import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "./Dashboard.css";

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
  const storageKey = userId ? `goalbridge_goals_${userId}` : null;

  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalDate, setGoalDate] = useState("");
  const [goalCategory, setGoalCategory] = useState("Learning");
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    if (!storageKey) return;

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setGoals(Array.isArray(saved) ? saved : []);
    } catch {
      setGoals([]);
    }
  }, [storageKey]);

  function saveGoals(updatedGoals) {
    if (!storageKey) return;
    setGoals(updatedGoals);
    localStorage.setItem(storageKey, JSON.stringify(updatedGoals));
  }

  function addGoal(e) {
    e.preventDefault();
    if (!goalTitle.trim() || !storageKey) return;

    const newGoal = {
      id: crypto.randomUUID(),
      title: goalTitle.trim(),
      description: goalDescription.trim(),
      category: goalCategory,
      deadline: goalDate,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    saveGoals([...goals, newGoal]);
    setGoalTitle("");
    setGoalDescription("");
    setGoalDate("");
    setGoalCategory("Learning");
    setShowForm(false);
  }

  function toggleGoal(id) {
    saveGoals(
      goals.map((goal) =>
        goal.id === id
          ? { ...goal, completed: !goal.completed }
          : goal
      )
    );
  }

  function deleteGoal(id) {
    if (!window.confirm("Delete this goal?")) return;
    saveGoals(goals.filter((goal) => goal.id !== id));
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  function scrollToSection(id) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const activeGoals = goals.filter((goal) => !goal.completed).length;
  const completedGoals = goals.filter((goal) => goal.completed).length;
  const progress = goals.length
    ? Math.round((completedGoals / goals.length) * 100)
    : 0;

  const today = new Date().toLocaleDateString("en-CA");

  const upcomingGoals = goals
    .filter((goal) => !goal.completed && goal.deadline)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const stats = [
    { icon: "🧭", title: "Career Path", value: "Not selected" },
    { icon: "🎯", title: "Active Goals", value: activeGoals },
    { icon: "✅", title: "Completed Goals", value: completedGoals },
    { icon: "📈", title: "Your Progress", value: `${progress}%` },
  ];

  if (!token || !userId) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          🌉 Goal<span>Bridge</span>
        </div>

        <p className="sidebar-heading">MAIN MENU</p>

        <nav className="sidebar-menu">
          <button
            className={`sidebar-link ${
              activeSection === "dashboard" ? "active" : ""
            }`}
            onClick={() => scrollToSection("dashboard")}
          >
            🏠 Dashboard
          </button>

          <button
            className={`sidebar-link ${
              activeSection === "my-goals" ? "active" : ""
            }`}
            onClick={() => scrollToSection("my-goals")}
          >
            🎯 My Goals
          </button>

          <button
          type="button"
          className="sidebar-link"
          onClick={() => setActiveSection("career-paths")}
          >
          🧭 Career Paths
         </button>

          <button
            type="button"
            className="sidebar-link"
            onClick={() => setActiveSection("profile")}
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

      <div className="dashboard-page">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-brand">
            🌉 Goal<span>Bridge</span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Logout →
          </button>
        </header>

        <main className="dashboard-main" id="dashboard">
          {/* Welcome Section */}
          <section className="dashboard-welcome">
            <span className="dashboard-tag">
              YOUR PERSONAL DASHBOARD
            </span>

            <h1>Welcome back, {firstName}! 👋</h1>

            <p>
              Every great career starts with a plan.
              Let's take the next step toward your future.
            </p>
          </section>

          {/* Career Overview */}
          <section className="dashboard-section">
            <h2>Your Career Overview</h2>
            <p className="section-subtitle">
              Here is a quick look at your career journey.
            </p>

            <div className="dashboard-stats">
              {stats.map((stat) => (
                <div className="stat-card" key={stat.title}>
                  <div className="stat-icon">{stat.icon}</div>
                  <p>{stat.title}</p>
                  <h3>{stat.value}</h3>
                </div>
              ))}
            </div>
          </section>

          {/* Progress */}
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

          {/* Previous Getting Started and Journey */}
          <section className="dashboard-bottom">
            <div className="getting-started-card">
              <span className="dashboard-tag">GET STARTED</span>

              <h2>Start your career journey 🚀</h2>

              <p>
                Set your first career goal and start building a
                clear path toward your dream job.
              </p>

              <button
                className="start-goal-btn"
                onClick={() => {
                  setShowForm(true);
                  scrollToSection("my-goals");
                }}
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
                <span>{completedGoals > 0 ? "✓" : "3"}</span>
                <div>
                  <strong>Achieve your goals</strong>
                  <p>Track your progress and grow.</p>
                </div>
              </div>
            </div>
          </section>

          {/* My Goals */}
          <section className="dashboard-section my-goals-section" id="my-goals">
            <div className="goals-heading">
              <div>
                <h2>🎯 My Goals</h2>
                <p className="section-subtitle">
                  Manage your personal and career goals.
                </p>
              </div>

              <button
                className="add-goal-btn"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? "Cancel" : "+ Add Goal"}
              </button>
            </div>

            {showForm && (
              <form className="goal-form" onSubmit={addGoal}>
                <h3>Create a New Goal</h3>

                <label htmlFor="goal-title">Goal Title</label>
                <input
                  id="goal-title"
                  type="text"
                  placeholder="Example: Learn React"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  required
                  maxLength={100}
                />

                <label htmlFor="goal-description">Description</label>
                <textarea
                  id="goal-description"
                  placeholder="What do you want to achieve?"
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                />

                <label htmlFor="goal-category">Category</label>
                <select
                  id="goal-category"
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value)}
                >
                  <option>Learning</option>
                  <option>Career</option>
                  <option>Projects</option>
                  <option>Personal Development</option>
                </select>

                <label htmlFor="goal-date">Target Date</label>
                <input
                  id="goal-date"
                  type="date"
                  value={goalDate}
                  min={today}
                  onChange={(e) => setGoalDate(e.target.value)}
                />

                <button type="submit" className="save-goal-btn">
                  Save Goal
                </button>
              </form>
            )}

            {goals.length === 0 ? (
              <div className="goals-empty">
                <div className="empty-goal-icon">🎯</div>
                <h3>No goals added yet</h3>
                <p>
                  Your future starts with one goal.
                  Add your first goal to begin.
                </p>
              </div>
            ) : (
              <div className="goals-list">
                {goals.map((goal) => (
                  <div className="goal-list-item" key={goal.id}>
                    <input
                      type="checkbox"
                      checked={goal.completed}
                      onChange={() => toggleGoal(goal.id)}
                      aria-label={`Mark ${goal.title} complete`}
                    />

                    <div className="goal-item-info">
                      <strong className={goal.completed ? "goal-done" : ""}>
                        {goal.title}
                      </strong>

                      {goal.description && <p>{goal.description}</p>}

                      <div className="goal-meta">
                        <span>{goal.category}</span>
                        {goal.deadline && (
                          <span>📅 {goal.deadline}</span>
                        )}
                        <span>
                          {goal.completed ? "Completed" : "In Progress"}
                        </span>
                      </div>
                    </div>

                    <button
                      className="delete-goal-btn"
                      onClick={() => deleteGoal(goal.id)}
                      aria-label={`Delete ${goal.title}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Deadlines */}
          <section className="dashboard-section deadlines-section">
            <h2>📅 Upcoming Deadlines</h2>
            <p className="section-subtitle">
              Stay organized and complete your goals on time.
            </p>

            {upcomingGoals.length === 0 ? (
              <div className="deadline-empty">
                <span>🗓️</span>
                <p>No upcoming deadlines yet.</p>
              </div>
            ) : (
              <div className="deadline-list">
                {upcomingGoals.map((goal) => (
                  <div className="deadline-item" key={goal.id}>
                    <div>
                      <strong>{goal.title}</strong>
                      <p>{goal.category}</p>
                    </div>

                    <span
                      className={
                        goal.deadline < today ? "deadline-overdue" : ""
                      }
                    >
                      {goal.deadline < today ? "Overdue: " : ""}
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
