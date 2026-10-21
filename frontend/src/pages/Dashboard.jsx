
import { useNavigate, Navigate } from "react-router-dom";
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

  if (!token) {
    return <Navigate to="/login" replace />;
  }

 const firstName = user?.firstName || "User";

  const stats = [
    { icon: "🧭", title: "Career Path", value: "Not selected" },
    { icon: "🎯", title: "Active Goals", value: "0" },
    { icon: "✅", title: "Completed Goals", value: "0" },
    { icon: "📈", title: "Your Progress", value: "0%" },
  ];

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  return (
    <div className="dashboard-page">
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

      <main className="dashboard-main">
        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-tag">
              YOUR PERSONAL DASHBOARD
            </span>

            <h1>Welcome back, {firstName}! 👋</h1>

            <p>
              Every great career starts with a plan.
              Let's take the next step toward your future.
            </p>
          </div>
        </section>

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

        <section className="dashboard-bottom">
          <div className="getting-started-card">
            <span className="dashboard-tag">
              GET STARTED
            </span>

            <h2>Start your career journey 🚀</h2>

            <p>
              Set your first career goal and start
              building a clear path toward your dream job.
            </p>

            <button className="start-goal-btn" disabled>
              + Create Your First Goal
            </button>

            <small>
              Goal creation will be available soon.
            </small>
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
              <span>2</span>
              <div>
                <strong>Choose a career path</strong>
                <p>Discover your future direction.</p>
              </div>
            </div>

            <div className="journey-item">
              <span>3</span>
              <div>
                <strong>Set your first goal</strong>
                <p>Plan what you want to achieve.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
