"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("Student");

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "student") {
      router.push("/");
      return;
    }

    setStudentName(name);
  }, [router]);

  function logout() {
    localStorage.clear();
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-950">
      <section className="max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold">Student Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">{studentName}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold"
          >
            Log out
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mt-6">
          <button
            onClick={() =>
              router.push("/dashboards/studentdashboard/view_seat_allocation")
            }
            className="bg-white border border-slate-200 rounded-xl p-8 text-left hover:border-indigo-400 shadow-sm"
          >
            <h2 className="text-xl font-bold">View Seat Allocation</h2>
            <p className="text-sm text-slate-500 mt-2">
              See only your assigned hall, row, bench, and seat.
            </p>
          </button>

          <button
            onClick={() =>
              router.push("/dashboards/studentdashboard/view_exam_routine")
            }
            className="bg-white border border-slate-200 rounded-xl p-8 text-left hover:border-emerald-400 shadow-sm"
          >
            <h2 className="text-xl font-bold">View Exam Routine</h2>
            <p className="text-sm text-slate-500 mt-2">
              Search exam routines by batch, subject, or code.
            </p>
          </button>
        </div>
      </section>
    </main>
  );
}
