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

  return (
    <div className="text-[#111827]">
      <div className="grid md:grid-cols-2 gap-5">
        <button
          onClick={() => router.push("/dashboards/teacherdashboard/view_exam_routine")}
          className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-left hover:border-[#4F46E5] hover:shadow-md transition-all shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-xl mb-4">
            📅
          </div>
          <h2 className="text-xl font-bold text-[#111827]">View Exam Routine</h2>
          <p className="text-sm text-[#6B7280] mt-2">
            Search uploaded exam routines by batch, subject, or code.
          </p>
        </button>

        <button
          onClick={() =>
            router.push("/dashboards/teacherdashboard/view_allocated_hall")
          }
          className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-left hover:border-[#4F46E5] hover:shadow-md transition-all shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-xl mb-4">
            🏛️
          </div>
          <h2 className="text-xl font-bold text-[#111827]">View Allocated Hall</h2>
          <p className="text-sm text-[#6B7280] mt-2">
            See halls assigned to you for invigilation and print attendance sheets.
          </p>
        </button>
      </div>
    </div>
  );
}