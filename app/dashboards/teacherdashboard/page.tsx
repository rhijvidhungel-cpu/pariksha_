"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherDashboard() {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState<string>("Teacher Name");

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "teacher") {
      router.push("/");
      return;
    }

    setTeacherName(name);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>👩‍🏫 {teacherName}</div>
        <div>
          <button onClick={() => router.push("/notifications")}>🔔</button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <button onClick={() => router.push("/manage-classes")}>Manage My Classes</button>
        <button onClick={() => router.push("/upload-materials")}>Upload Materials</button>
        <button onClick={() => router.push("/exam-results")}>View Exam Results</button>
        <button onClick={() => router.push("/profile")}>Profile</button>
        <button onClick={handleLogout} style={{ marginTop: 12 }}>Log out</button>
      </div>
    </div>
  );
}
