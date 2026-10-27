
import Navbar from "./components/Navbar";
import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";


const features = [
  {
    icon: "🎯",
    title: "Career Exploration",
    description:
      "Explore different career paths and discover the skills associated with your dream job.",
    color: "lavender",
  },
  {
    icon: "🧠",
    title: "Skill Gap Analysis",
    description:
      "Compare your current skills with career requirements and identify what you need to learn.",
    color: "mint",
  },
  {
    icon: "🚀",
    title: "Career Goal Setting",
    description:
      "Turn your career ambitions into achievable goals with priorities and deadlines.",
    color: "peach",
  },
  {
    icon: "📊",
    title: "Progress Tracking",
    description:
      "Monitor your learning progress, complete goals, and celebrate your achievements.",
    color: "blue",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose Your Career",
    description:
      "Search for a career role that matches your interests and future ambitions.",
  },
  {
    number: "02",
    title: "Discover Required Skills",
    description:
      "Explore the skills associated with your selected career using career information.",
  },
  {
    number: "03",
    title: "Create Your Goals",
    description:
      "Identify skills you need to improve and create goals with realistic deadlines.",
  },
  {
    number: "04",
    title: "Track Your Progress",
    description:
      "Update your goals as you learn and see how far you have progressed.",
  },
];

function Home() {
  return (
    <>
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">
              YOUR FUTURE STARTS HERE
            </span>
          
            <h1>
              Build your future,
              <br />
              <span>one goal at a time.</span>
            </h1>
        
            <p className="hero-description">
              Your career journey doesn't have to be confusing.
              Discover the skills you need, set meaningful goals,
              and take confident steps toward your dream career
              with GoalBridge.
            </p>
           
         <div className="hero-actions">
         <a href="/register" className="primary-button">
         Get Started <span>→</span>
        </a>

       <a href="/login" className="secondary-button">
       Login
      </a>
     </div>
     </div>

          <div className="hero-visual">
            <div className="visual-glow"></div>

            <div className="career-card">
              <div className="career-card-header">
                <div>
                  <span className="small-label">YOUR CAREER JOURNEY</span>
                  <h3>Dream it. Plan it.</h3>
                </div>
                <span className="target-icon">🎯</span>
              </div>

              <div className="journey-step completed">
                <span className="step-check">✓</span>
                <div>
                  <strong>Discover your direction</strong>
                  <p>Explore career possibilities</p>
                </div>
              </div>

              <div className="journey-step current">
                <span className="step-check">2</span>
                <div>
                  <strong>Build your skills</strong>
                  <p>Identify what you need to learn</p>
                </div>
              </div>

              <div className="journey-step">
                <span className="step-check">3</span>
                <div>
                  <strong>Achieve your goals</strong>
                  <p>Make progress every day</p>
                </div>
              </div>

              <div className="career-card-footer">
                <span>Small steps lead to big achievements.</span>
                <span className="sparkle">✦</span>
              </div>
            </div>

            <div className="floating-badge badge-top">
              <span>💡</span>
              Find your direction
            </div>

            <div className="floating-badge badge-bottom">
              <span>🌱</span>
              Grow your skills
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="intro-section">
          <span className="eyebrow">WELCOME TO GOALBRIDGE</span>
          <h2>
            Your career goals deserve
            <br />
            <span>a clear plan.</span>
          </h2>
          <p>
            GoalBridge helps students connect their career ambitions
            with the skills they need to develop. Instead of wondering
            what to do next, create a personal plan and work toward
            your future one step at a time.
          </p>
        </section>

        {/* Features */}
        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">WHAT YOU CAN DO</span>
            <h2>Everything you need to move forward</h2>
            <p>
              Simple tools to help you understand, plan, and develop
              your career.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature) => (
              <article
                className={`feature-card ${feature.color}`}
                key={feature.title}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="feature-arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="steps-section" id="how-it-works">
          <div className="section-heading">
            <span className="eyebrow">YOUR JOURNEY, SIMPLIFIED</span>
            <h2>Four steps to get started</h2>
          </div>

          <div className="steps-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.number}>
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="cta-content">
            <span className="eyebrow">YOUR NEXT CHAPTER STARTS NOW</span>
            <h2>
              Your future is built
              <br />
              by what you do today.
            </h2>
            <p>
              Set your direction, develop your skills, and keep moving
              toward the career you want.
            </p>
         <a href="/register" className="primary-button">
         Get Started <span>→</span>
        </a>
          </div>
          <div className="cta-decoration">✦</div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <a href="/" className="footer-brand">
          🌉 <span>GoalBridge</span>
        </a>
        <p>Plan. Learn. Achieve.</p>
      </footer>
    </>
  );
}


function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    user = null;
  }

  const userId = user?.id || user?._id;

  if (!token || !userId) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

 
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}


export default App;
