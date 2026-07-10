"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherDashboard() {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState("Teacher");

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "teacher") {
      router.push("/");
      return;
    }

    setTeacherName(name);
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
            <h1 className="text-2xl font-extrabold">Teacher Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">{teacherName}</p>
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
            onClick={() => router.push("/dashboards/teacherdashboard/view_exam_routine")}
            className="bg-white border border-slate-200 rounded-xl p-8 text-left hover:border-indigo-400 shadow-sm"
          >
            <h2 className="text-xl font-bold">View Exam Routine</h2>
            <p className="text-sm text-slate-500 mt-2">
              Search uploaded exam routines by batch, subject, or code.
            </p>
          </button>

          <button
            onClick={() =>
              router.push("/dashboards/teacherdashboard/view_allocated_hall")
            }
            className="bg-white border border-slate-200 rounded-xl p-8 text-left hover:border-emerald-400 shadow-sm"
          >
            <h2 className="text-xl font-bold">View Allocated Hall</h2>
            <p className="text-sm text-slate-500 mt-2">
              See halls assigned to you for invigilation and print attendance sheets.
            </p>
          </button>
        </div>
      </section>
    </main>
  );
}
