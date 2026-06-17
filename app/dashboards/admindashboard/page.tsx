"use client";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState<string>("Admin Name");

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "admin") {
      router.push("/");
      return;
    }

    setAdminName(name);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <div>
            <p style={styles.appTitle}>Parikcha</p>
            <p style={styles.studentName}>{adminName}</p>
          </div>
        </div>

        <button style={styles.bellBtn} aria-label="Notifications">
          <div style={styles.bellDot} />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 10a6 6 0 0 1 12 0c0 3.5 1.5 5 2 6H4c.5-1 2-2.5 2-6z" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
        </button>
      </div>

      <div style={styles.grid}>
        <button style={styles.card} onClick={() => router.push("/admin/teachers")}>Manage Teachers</button>
        <button style={styles.card} onClick={() => router.push("/admin/students")}>Manage Students</button>
      </div>

      <div style={styles.logoutRow}>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#F8F9FA",
    padding: "1.5rem 1.25rem",
    fontFamily: "Inter, system-ui, sans-serif",
    maxWidth: "480px",
    margin: "0 auto",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2rem",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "#DBEAFE",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1D4ED8",
  },
  appTitle: {
    fontSize: "11px",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: 0,
  },
  studentName: {
    fontSize: "15px",
    fontWeight: 500,
    color: "#111827",
    margin: 0,
  },
  bellBtn: {
    position: "relative",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#6B7280",
    padding: "4px",
    lineHeight: 0,
  },
  bellDot: {
    position: "absolute",
    top: "4px",
    right: "4px",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#EF4444",
    border: "2px solid #F8F9FA",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    marginBottom: "2rem",
  },
  card: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    padding: "2rem 1rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    cursor: "pointer",
    transition: "border-color 0.15s, box-shadow 0.15s",
    minHeight: "150px",
    textAlign: "center",
  },
  cardLabel: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#111827",
    lineHeight: 1.4,
  },
  logoutRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "none",
    border: "1px solid #FECACA",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "14px",
    color: "#DC2626",
    cursor: "pointer",
    fontFamily: "inherit",
  },
};