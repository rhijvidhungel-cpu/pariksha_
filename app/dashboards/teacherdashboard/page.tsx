"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeacherDashboard() {
  const router = useRouter();

  // Security Guard: Ensure session exists
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "teacher") {
      router.push("/");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div style={styles.pageContainer}>
      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>PARIKSHA</h1>
          <p style={styles.subtitle}>TEACHER'S PORTAL</p>
        </div>
        <div style={styles.notificationIcon}>🔔</div>
      </header>

      {/* TEACHER INFO CARD */}
      <div style={styles.infoCard}>
        <span style={styles.avatarIcon}>👤</span> Teacher's Name
      </div>

      {/* NAVIGATION MENU */}
      <div style={styles.navSection}>
        <h2 style={styles.navHeader}>NAVIGATION MENU</h2>
        <div style={styles.cardContainer}>
          <button style={styles.navCard} onClick={() => router.push("/dashboards/teacherdashboard/view_exam_routine")}>
            <span style={styles.cardIcon}>📄</span>
            <h3 style={styles.cardTitle}>Exam Routine</h3>
            <p style={styles.cardDesc}>View date-wise institutional schedules</p>
          </button>

          <button style={styles.navCard} onClick={() => router.push("/teacher/halls")}>
            <span style={styles.cardIcon}>🪑</span>
            <h3 style={styles.cardTitle}>Allocated Exam Hall</h3>
            <p style={styles.cardDesc}>View desk mapping grid details</p>
          </button>
        </div>
      </div>

      {/* LOGOUT BUTTON (Left Bottom Corner) */}
      <button style={styles.logoutBtn} onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: { minHeight: "100vh", backgroundColor: "#F9FAFB", padding: "40px", fontFamily: "sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", backgroundColor: "white", padding: "20px", borderRadius: "12px", border: "1px solid #E5E7EB" },
  title: { margin: 0, fontSize: "24px", fontWeight: "800", color: "#1E293B" },
  subtitle: { margin: 0, fontSize: "12px", color: "#64748B", letterSpacing: "1px" },
  infoCard: { backgroundColor: "white", padding: "15px 20px", borderRadius: "12px", border: "1px solid #E5E7EB", width: "fit-content", marginBottom: "30px", fontWeight: "600" },
  navSection: { backgroundColor: "white", padding: "40px", borderRadius: "16px", border: "1px solid #E5E7EB" },
  navHeader: { fontSize: "14px", color: "#94A3B8", marginBottom: "20px" },
  cardContainer: { display: "flex", gap: "20px" },
  navCard: { flex: 1, padding: "30px", border: "1px solid #E5E7EB", borderRadius: "12px", backgroundColor: "#FFF", cursor: "pointer", textAlign: "left", transition: "0.3s" },
  cardIcon: { fontSize: "30px", marginBottom: "15px", display: "block" },
  cardTitle: { margin: "0 0 10px 0", color: "#1E293B" },
  cardDesc: { margin: 0, fontSize: "13px", color: "#64748B" },
  logoutBtn: { position: "fixed", bottom: "20px", left: "20px", padding: "10px 20px", backgroundColor: "#EF4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" },
  notificationIcon: { fontSize: "24px" }
};