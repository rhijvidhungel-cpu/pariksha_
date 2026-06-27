"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ExamRoutineView() {
  const router = useRouter();
  const [routineData, setRoutineData] = useState<any[]>([]);
  const [batch, setBatch] = useState("CE-2024"); // Default scope

  useEffect(() => {
    fetch(`https://pariksha-9qjs.onrender.com/api/routines?batch=${batch}`)
      .then((res) => res.json())
      .then((data) => setRoutineData(data))
      .catch((err) => console.error("Error fetching routine:", err));
  }, [batch]);

  return (
    <div style={styles.container}>
      {/* HEADER CONTROLS */}
      <div style={styles.header}>
        <button onClick={() => router.back()} style={styles.btnExit}>Exit</button>
        <button onClick={() => window.print()} style={styles.btnPrint}>🖨️ Print Routine</button>
      </div>

      {/* DOCUMENT VIEW */}
      <div style={styles.document}>
        <h1 style={styles.title}>EXAMINATION ROUTINE</h1>
        <div style={styles.divider} />
        <p style={styles.subtext}>EXAMINATION TIME: 10:00 AM — 01:00 PM</p>

        <div style={styles.filterSection}>
          <label>Select Scope Filter: </label>
          <select value={batch} onChange={(e) => setBatch(e.target.value)} style={styles.select}>
            <option value="CE-2024">CE 2024</option>
            <option value="CS-2020">CS 2020</option>
            <option value="ME-2023">ME 2023</option>
          </select>
        </div>

        <table style={styles.table}>
          <thead>
            <tr style={styles.trHead}>
              <th style={styles.th}>Day & Date</th>
              <th style={styles.th}>Subject Module Course</th>
              <th style={styles.th}>Code Label</th>
            </tr>
          </thead>
          <tbody>
            {routineData.length > 0 ? routineData.map((row, i) => (
              <tr key={i} style={styles.trBody}>
                <td style={styles.td}>{row.date}</td>
                <td style={styles.td}>{row.subject}</td>
                <td style={styles.td}>{row.code}</td>
              </tr>
            )) : (
              <tr><td colSpan={3} style={styles.tdEmpty}>No routine uploaded for this batch.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: any = {
  container: { padding: "40px", backgroundColor: "#F3F4F6", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
  btnExit: { padding: "8px 16px", cursor: "pointer" },
  btnPrint: { backgroundColor: "#4F46E5", color: "white", padding: "8px 16px", border: "none", borderRadius: "6px", cursor: "pointer" },
  document: { backgroundColor: "white", padding: "50px", maxWidth: "800px", margin: "0 auto", border: "1px solid #E5E7EB" },
  title: { textAlign: "center", fontSize: "24px", fontWeight: "bold", margin: 0 },
  divider: { height: "2px", backgroundColor: "#000", margin: "20px 0" },
  subtext: { textAlign: "center", fontWeight: "600", marginBottom: "20px" },
  filterSection: { marginBottom: "20px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { border: "1px solid #000", padding: "10px", textAlign: "left" },
  td: { border: "1px solid #000", padding: "10px" },
  tdEmpty: { textAlign: "center", padding: "20px", color: "#6B7280" }
};