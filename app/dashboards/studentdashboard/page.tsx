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

  return (
    <div className="text-[#111827]">
      <div className="grid md:grid-cols-2 gap-5">
        <button
          onClick={() =>
            router.push("/dashboards/studentdashboard/view_seat_allocation")
          }
          className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-left hover:border-[#4F46E5] hover:shadow-md transition-all shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-xl mb-4">
            💺
          </div>
          <h2 className="text-xl font-bold text-[#111827]">View Seat Allocation</h2>
          <p className="text-sm text-[#6B7280] mt-2">
            See only your assigned hall, row, bench, and seat.
          </p>
        </button>

        <button
          onClick={() =>
            router.push("/dashboards/studentdashboard/view_exam_routine")
          }
          className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-left hover:border-[#4F46E5] hover:shadow-md transition-all shadow-sm"
        >
          <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-xl mb-4">
            📅
          </div>
          <h2 className="text-xl font-bold text-[#111827]">View Exam Routine</h2>
          <p className="text-sm text-[#6B7280] mt-2">
            View your batch's exam routine in tabular format.
          </p>
        </button>
      </div>
    </div>
  );
}