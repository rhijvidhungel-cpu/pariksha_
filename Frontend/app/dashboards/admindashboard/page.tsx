"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState<string>("Master Admin");
  const [adminEmail, setAdminEmail] = useState<string>("root@ku.edu.p");
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "admin") {
      router.push("/");
      return;
    }

    setAdminName(name);
    // Optional fallback if email isn't in storage
    const email = localStorage.getItem("email");
    if (email) setAdminEmail(email);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div style={styles.adminLayout}>
      {/* LEFT SIDEBAR */}
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.logoSection}>
            <h1 style={styles.sidebarTitle}>PARIKSHA</h1>
            <p style={styles.sidebarSubtitle}>ADMIN CONTROL DESK</p>
          </div>

          <nav style={styles.navigation}>
            <button 
              style={{ ...styles.navLink, ...(activeTab === "dashboard" ? styles.navLinkActive : {}) }}
              onClick={() => setActiveTab("dashboard")}
            >
              <span style={styles.navIcon}>📊</span> Dashboard Summary
            </button>
            <button style={styles.navLink} onClick={() => router.push("/admin/students")}>
              <span style={styles.navIcon}>🎓</span> Students Directory
            </button>
            <button style={styles.navLink} onClick={() => router.push("/admin/teachers")}>
              <span style={styles.navIcon}>👥</span> Teachers Management
            </button>
            <button style={styles.navLink} onClick={() => router.push("/admin/classrooms")}>
              <span style={styles.navIcon}>🏛️</span> Classroom Management
            </button>
            <button style={styles.navLink} onClick={() => router.push("/admin/routine")}>
              <span style={styles.navIcon}>📅</span> Upload Exam Routine
            </button>
            <button style={styles.navLink} onClick={() => router.push("/admin/seat-allocation")}>
              <span style={styles.navIcon}>🔀</span> Seat Allocation Engine
            </button>
          </nav>
        </div>

        <div style={styles.sidebarFooter}>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
          <span style={styles.versionTag}>v2.1.0-2026-Prod</span>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div style={styles.mainContent}>
        {/* TOP BAR */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button style={styles.menuHamburger} aria-label="Menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <h2 style={styles.headerPortalTitle}>PARIKSHA</h2>
              <p style={styles.headerPortalSubtitle}>ADMIN'S PORTAL</p>
            </div>
          </div>

          <div style={styles.headerRight}>
            <button style={styles.bellBtn} aria-label="Notifications">
              <div style={styles.bellDot} />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8">
                <path d="M6 10a6 6 0 0 1 12 0c0 3.5 1.5 5 2 6H4c.5-1 2-2.5 2-6z" />
                <path d="M10 20a2 2 0 0 0 4 0" />
              </svg>
            </button>

            <div style={styles.divider} />

            <div style={styles.profileSection}>
              <div style={styles.avatar}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B6CB0" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div style={styles.profileMeta}>
                <p style={styles.profileName}>{adminName}</p>
                <p style={styles.profileEmail}>{adminEmail}</p>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE VIEW */}
        <main style={styles.workspace}>
          {/* OVERVIEW BANNER */}
          <div style={styles.overviewCard}>
            <h3 style={styles.overviewTitle}>System Operational Metrics Overview</h3>
            <p style={styles.overviewSubtitle}>Real-time status registers for Kathmandu University exam sectors.</p>
          </div>

          {/* METRICS GRID */}
          <div style={styles.metricsGrid}>
            <div style={{ ...styles.metricCard, borderLeft: "4px solid #3B82F6" }}>
              <p style={styles.metricLabel}>TOTAL ENROLLED STUDENTS</p>
              <p style={styles.metricCount}>7</p>
              <button style={{ ...styles.metricLink, color: "#3B82F6" }} onClick={() => router.push("/admin/students")}>
                Manage Profiles →
              </button>
            </div>

            <div style={{ ...styles.metricCard, borderLeft: "4px solid #10B981" }}>
              <p style={styles.metricLabel}>VERIFIED FACULTY TEACHERS</p>
              <p style={styles.metricCount}>3</p>
              <button style={{ ...styles.metricLink, color: "#10B981" }} onClick={() => router.push("/admin/teachers")}>
                Manage Invigilators →
              </button>
            </div>

            <div style={{ ...styles.metricCard, borderLeft: "4px solid #F59E0B" }}>
              <p style={styles.metricLabel}>AVAILABLE EXAMINATION ROOMS</p>
              <p style={styles.metricCount}>4</p>
              <button style={{ ...styles.metricLink, color: "#F59E0B" }} onClick={() => router.push("/admin/classrooms")}>
                View Seat Layouts →
              </button>
            </div>
          </div>

          {/* EXECUTION INFO */}
          <div style={styles.guideBanner}>
            <span style={styles.guideIcon}>💡</span>
            <div>
              <h4 style={styles.guideTitle}>Execution Guide Info</h4>
              <p style={styles.guideText}>
                To perform structural mappings, configure rosters inside Directory views, upload structural PDF routes, or utilize the automated Randomized Seating Allocation wizard module link.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// STYLES OBJECT WITH COLOR MATCHED TO LOGIN PALETTE
const styles: Record<string, React.CSSProperties> = {
  adminLayout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#F3F4F6",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  sidebar: {
    width: "260px",
    backgroundColor: "#2E1A47", // The deep purple/navy base from your design matching login aesthetics
    color: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "24px 16px",
    position: "fixed",
    height: "100vh",
    left: 0,
    top: 0,
    zIndex: 10,
  },
  logoSection: {
    paddingBottom: "24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    marginBottom: "24px",
  },
  sidebarTitle: {
    fontSize: "22px",
    fontWeight: "800",
    letterSpacing: "0.05em",
    margin: 0,
    background: "linear-gradient(45deg, #6366F1, #A855F7)", // Gradient matching the login button style
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  sidebarSubtitle: {
    fontSize: "10px",
    color: "#A5B4FC",
    letterSpacing: "0.08em",
    fontWeight: 600,
    margin: "4px 0 0 0",
  },
  navigation: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "12px 16px",
    background: "none",
    border: "none",
    color: "#C7D2FE",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    textAlign: "left",
    transition: "all 0.2s ease",
  },
  navLinkActive: {
    backgroundColor: "#4F46E5", // Bright energetic blue/indigo from the login button gradient
    color: "#FFFFFF",
  },
  navIcon: {
    marginRight: "12px",
    fontSize: "16px",
  },
  sidebarFooter: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  versionTag: {
    fontSize: "11px",
    color: "#818CF8",
    fontFamily: "monospace",
    paddingLeft: "8px",
  },
  mainContent: {
    flex: 1,
    marginLeft: "260px", // Pushes context past fixed sidebar
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  header: {
    height: "70px",
    backgroundColor: "#FFFFFF",
    borderBottom: "1px solid #E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    position: "sticky",
    top: 0,
    zIndex: 5,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  menuHamburger: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
  },
  headerPortalTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#111827",
    margin: 0,
    letterSpacing: "0.02em",
  },
  headerPortalSubtitle: {
    fontSize: "11px",
    color: "#6B7280",
    fontWeight: 500,
    margin: 0,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  bellBtn: {
    position: "relative",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px",
  },
  bellDot: {
    position: "absolute",
    top: "6px",
    right: "6px",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#4F46E5", // Blue notification dot matching palette
    border: "2px solid #FFFFFF",
  },
  divider: {
    width: "1px",
    height: "28px",
    backgroundColor: "#E5E7EB",
  },
  profileSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#EEF2F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  profileMeta: {
    display: "flex",
    flexDirection: "column",
  },
  profileName: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#111827",
    margin: 0,
  },
  profileEmail: {
    fontSize: "11px",
    color: "#6B7280",
    margin: 0,
  },
  workspace: {
    padding: "32px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  overviewCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "24px",
  },
  overviewTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 6px 0",
  },
  overviewSubtitle: {
    fontSize: "13px",
    color: "#6B7280",
    margin: 0,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  metricLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#9CA3AF",
    letterSpacing: "0.04em",
    margin: "0 0 12px 0",
  },
  metricCount: {
    fontSize: "36px",
    fontWeight: 800,
    color: "#111827",
    margin: "0 0 16px 0",
  },
  metricLink: {
    background: "none",
    border: "none",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    textAlign: "left",
    width: "fit-content",
  },
  guideBanner: {
    backgroundColor: "#FEFBF0", // Warm notification color matching second screen
    border: "1px solid #FDE68A",
    borderRadius: "12px",
    padding: "20px 24px",
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  },
  guideIcon: {
    fontSize: "18px",
    marginTop: "2px",
  },
  guideTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#B45309",
    margin: "0 0 4px 0",
  },
  guideText: {
    fontSize: "13px",
    color: "#D97706",
    lineHeight: "1.5",
    margin: 0,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#FCA5A5",
    cursor: "pointer",
    transition: "background 0.2s",
  },
};