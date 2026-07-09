"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Batch {
  batch_id: number;
  batch_name: string;
  department_id: number;
  student_count: number;
}

interface Department {
  department_id: number;
  department_name: string;
  batches: Batch[];
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://pariksha-9qjs.onrender.com";

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export default function AdminDashboard() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [batchName, setBatchName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/departments`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to load departments.");
      }

      const nextDepartments = Array.isArray(data) ? data : [];
      setDepartments(nextDepartments);
      setSelectedDepartmentId((prev) => {
        if (prev && nextDepartments.some((dept) => String(dept.department_id) === prev)) {
          return prev;
        }
        return nextDepartments[0] ? String(nextDepartments[0].department_id) : "";
      });
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: getErrorMessage(err, "Could not load academic structure."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "admin") {
      router.push("/");
      return;
    }

    queueMicrotask(() => {
      void fetchDepartments();
    });
  }, [router]);

  const selectedDepartment = departments.find(
    (dept) => String(dept.department_id) === selectedDepartmentId
  );

  const totalBatches = departments.reduce((total, dept) => total + dept.batches.length, 0);
  const totalStudents = departments.reduce(
    (total, dept) =>
      total + dept.batches.reduce((batchTotal, batch) => batchTotal + batch.student_count, 0),
    0
  );

  const filteredDepartments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return departments;

    return departments
      .map((dept) => {
        const departmentMatches = dept.department_name.toLowerCase().includes(query);
        const batches = dept.batches.filter((batch) =>
          batch.batch_name.toLowerCase().includes(query)
        );

        if (departmentMatches) return dept;
        if (batches.length > 0) return { ...dept, batches };
        return null;
      })
      .filter((dept): dept is Department => Boolean(dept));
  }, [departments, searchQuery]);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department_name: departmentName.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to create department.");
      }

      setDepartmentName("");
      setStatusMsg({ type: "success", text: "Department added successfully." });
      await fetchDepartments();
      setSelectedDepartmentId(String(data.department_id));
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: getErrorMessage(err, "Failed to create department."),
      });
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!selectedDepartmentId) {
      setStatusMsg({ type: "error", text: "Create or select a department first." });
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/departments/${selectedDepartmentId}/batches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batch_name: batchName.trim() }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to create batch.");
      }

      setBatchName("");
      setStatusMsg({ type: "success", text: "Batch added inside selected department." });
      await fetchDepartments();
    } catch (err: unknown) {
      setStatusMsg({
        type: "error",
        text: getErrorMessage(err, "Failed to create batch."),
      });
    }
  };

  return (
    <>
      <div style={styles.overviewCard}>
        <p style={styles.overviewSubtitle}>Admin Dashboard</p>
      </div>

      <div style={styles.metricsGrid}>
        <div style={{ ...styles.metricCard, borderLeft: "4px solid #3B82F6" }}>
          <p style={styles.metricLabel}>TOTAL ENROLLED STUDENTS</p>
          <p style={styles.metricCount}>{totalStudents}</p>
          <button
            style={{ ...styles.metricLink, color: "#3B82F6" }}
            onClick={() => router.push("/dashboards/admindashboard/students")}
          >
            Manage Profiles -&gt;
          </button>
        </div>

        <div style={{ ...styles.metricCard, borderLeft: "4px solid #10B981" }}>
          <p style={styles.metricLabel}>ACTIVE DEPARTMENTS</p>
          <p style={styles.metricCount}>{departments.length}</p>
          <button
            style={{ ...styles.metricLink, color: "#10B981" }}
            onClick={() => router.push("/dashboards/admindashboard/teachers")}
          >
            Manage Invigilators -&gt;
          </button>
        </div>

        <div style={{ ...styles.metricCard, borderLeft: "4px solid #F59E0B" }}>
          <p style={styles.metricLabel}>REGISTERED BATCHES</p>
          <p style={styles.metricCount}>{totalBatches}</p>
          <button
            style={{ ...styles.metricLink, color: "#F59E0B" }}
            onClick={() => router.push("/dashboards/admindashboard/classrooms")}
          >
            View Seat Layouts -&gt;
          </button>
        </div>
      </div>

      <section style={styles.structurePanel}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Academic Structure</h2>
            <p style={styles.sectionSubtitle}>
              Add departments first, then register batches inside each department.
            </p>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments or batches..."
            style={styles.searchInput}
          />
        </div>

        {statusMsg && (
          <div
            style={{
              ...styles.statusBox,
              ...(statusMsg.type === "success" ? styles.successBox : styles.errorBox),
            }}
          >
            {statusMsg.text}
          </div>
        )}

        <div style={styles.structureGrid}>
          <form onSubmit={handleCreateDepartment} style={styles.formCard}>
            <h3 style={styles.formTitle}>Create Department</h3>
            <label style={styles.label}>Department Name</label>
            <input
              type="text"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="e.g. Computer Science"
              style={styles.textInput}
              required
            />
            <button type="submit" style={styles.primaryButton}>
              Add Department
            </button>
          </form>

          <form onSubmit={handleCreateBatch} style={styles.formCard}>
            <h3 style={styles.formTitle}>Create Batch</h3>
            <label style={styles.label}>Department</label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              style={styles.textInput}
              required
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>

            <label style={styles.label}>Batch Name</label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="e.g. CS-2026"
              style={styles.textInput}
              required
            />
            <button type="submit" style={styles.primaryButton} disabled={!selectedDepartmentId}>
              Add Batch
            </button>
          </form>
        </div>

        <div style={styles.directoryCard}>
          <div style={styles.directoryHeader}>
            <h3 style={styles.formTitle}>Department Directory</h3>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              style={styles.compactSelect}
            >
              <option value="">All departments</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p style={styles.emptyText}>Loading academic structure...</p>
          ) : departments.length === 0 ? (
            <p style={styles.emptyText}>No departments have been added yet.</p>
          ) : (
            <div style={styles.departmentList}>
              {(selectedDepartment ? [selectedDepartment] : filteredDepartments).map((dept) => (
                <div key={dept.department_id} style={styles.departmentBlock}>
                  <div style={styles.departmentRow}>
                    <strong>{dept.department_name}</strong>
                    <span style={styles.batchCount}>{dept.batches.length} batches</span>
                  </div>

                  {dept.batches.length > 0 ? (
                    <div style={styles.batchPills}>
                      {dept.batches.map((batch) => (
                        <span key={batch.batch_id} style={styles.batchPill}>
                          {batch.batch_name}
                          <small style={styles.studentCount}>{batch.student_count} students</small>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={styles.emptyText}>No batches inside this department yet.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
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
    marginTop: "20px",
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
  structurePanel: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "24px",
    marginTop: "20px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#111827",
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: "13px",
    color: "#6B7280",
    margin: "4px 0 0 0",
  },
  searchInput: {
    minWidth: "260px",
    flex: "1 1 280px",
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    padding: "11px 14px",
    fontSize: "13px",
    color: "#111827",
  },
  statusBox: {
    borderRadius: "10px",
    padding: "12px 14px",
    fontSize: "12px",
    fontWeight: 700,
    marginTop: "16px",
  },
  successBox: {
    backgroundColor: "#ECFDF5",
    border: "1px solid #A7F3D0",
    color: "#047857",
  },
  errorBox: {
    backgroundColor: "#FFF1F2",
    border: "1px solid #FECDD3",
    color: "#BE123C",
  },
  structureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
    marginTop: "20px",
  },
  formCard: {
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  formTitle: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#111827",
    textTransform: "uppercase",
    margin: 0,
  },
  label: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#6B7280",
  },
  textInput: {
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    padding: "11px 12px",
    fontSize: "13px",
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  primaryButton: {
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#4F46E5",
    color: "#FFFFFF",
    padding: "12px 14px",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
    marginTop: "6px",
  },
  directoryCard: {
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    marginTop: "16px",
    overflow: "hidden",
  },
  directoryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    borderBottom: "1px solid #E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  compactSelect: {
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    padding: "9px 10px",
    fontSize: "12px",
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  departmentList: {
    display: "flex",
    flexDirection: "column",
  },
  departmentBlock: {
    padding: "16px",
    borderBottom: "1px solid #F3F4F6",
  },
  departmentRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    fontSize: "14px",
    color: "#111827",
  },
  batchCount: {
    fontSize: "11px",
    color: "#6B7280",
    fontWeight: 700,
  },
  batchPills: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },
  batchPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "1px solid #C7D2FE",
    backgroundColor: "#EEF2FF",
    color: "#3730A3",
    borderRadius: "8px",
    padding: "7px 9px",
    fontSize: "12px",
    fontWeight: 800,
  },
  studentCount: {
    color: "#6B7280",
    fontSize: "10px",
    fontWeight: 700,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: "12px",
    margin: "10px 0 0 0",
    padding: "16px",
  },
};
