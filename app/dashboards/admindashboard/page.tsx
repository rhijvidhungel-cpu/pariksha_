"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "admin") {
      router.push("/");
    }
  }, [router]);

  return (
    <>
      {/* OVERVIEW BANNER */}
      <div style={styles.overviewCard}>
        <p style={styles.overviewSubtitle}>
          Admin Dashboard  
        </p>
      </div>

      {/* METRICS GRID */}
      <div style={styles.metricsGrid}>
        {/* Total Enrolled Students */}
        <div style={{ ...styles.metricCard, borderLeft: "4px solid #3B82F6" }}>
          <p style={styles.metricLabel}>TOTAL ENROLLED STUDENTS</p>
          <p style={styles.metricCount}>7</p>
          <button style={{ ...styles.metricLink, color: "#3B82F6" }} onClick={() => router.push("/dashboards/admindashboard/students")}>
            Manage Profiles →
          </button>
        </div>

        {/* Verified Faculty Teachers */}
        <div style={{ ...styles.metricCard, borderLeft: "4px solid #10B981" }}>
          <p style={styles.metricLabel}>VERIFIED FACULTY TEACHERS</p>
          <p style={styles.metricCount}>3</p>
          <button style={{ ...styles.metricLink, color: "#10B981" }} onClick={() => router.push("/dashboards/admindashboard/teachers")}>
            Manage Invigilators →
          </button>
        </div>

        {/* Available Examination Rooms */}
        <div style={{ ...styles.metricCard, borderLeft: "4px solid #F59E0B" }}>
          <p style={styles.metricLabel}>AVAILABLE EXAMINATION ROOMS</p>
          <p style={styles.metricCount}>4</p>
          <button style={{ ...styles.metricLink, color: "#F59E0B" }} onClick={() => router.push("/admin/classrooms")}>
            View Seat Layouts →
          </button>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overviewCard: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "24px",
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
    backgroundColor: "#FEFBF0",
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
};