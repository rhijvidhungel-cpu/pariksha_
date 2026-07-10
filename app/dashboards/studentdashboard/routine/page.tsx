"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RoutineData {
  batch: string;
  date: string;
  exams: Array<{
    time: string;
    subject: string;
    code: string;
    room: string;
  }>;
}

export default function StudentViewRoutine() {
  const router = useRouter();
  const [routines, setRoutines] = useState<RoutineData[]>([]);
  const [studentBatch, setStudentBatch] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    const batch = localStorage.getItem("batch");

    if (!name || role !== "student") {
      router.push("/");
      return;
    }

    if (batch) {
      setStudentBatch(batch);
      fetchRoutine(batch);
    } else {
      setLoading(false);
    }
  }, [router]);

  const fetchRoutine = async (batch: string) => {
    try {
      setLoading(true);
      const apiBaseUrl = "https://pariksha-9qjs.onrender.com";
      const res = await fetch(`${apiBaseUrl}/api/routines?batch=${batch}`);

      if (res.ok) {
        const data = await res.json();
        setRoutines(data);
      }
    } catch (err) {
      console.error("Failed to fetch routine:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-[#2E1A47] mb-2">📅 View Exam Routine</h1>
          <p className="text-sm text-[#6B7280]">Your batch: <span className="font-bold text-[#111827]">{studentBatch}</span></p>
        </div>

        {/* Routines Display */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-[#6B7280]">Loading routine...</p>
          </div>
        ) : routines.length > 0 ? (
          <div className="space-y-6">
            {routines.map((routine, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-[#4F46E5] text-white px-6 py-4">
                  <h2 className="text-lg font-bold">📋 {routine.date}</h2>
                  <p className="text-sm opacity-90">Batch: {routine.batch}</p>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
                          <th className="px-4 py-3 text-left text-sm font-bold text-[#111827]">Time</th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-[#111827]">Subject</th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-[#111827]">Code</th>
                          <th className="px-4 py-3 text-left text-sm font-bold text-[#111827]">Room/Hall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routine.exams.map((exam, examIdx) => (
                          <tr
                            key={examIdx}
                            className="border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors"
                          >
                            <td className="px-4 py-3 text-sm text-[#374151] font-medium">{exam.time}</td>
                            <td className="px-4 py-3 text-sm text-[#111827] font-semibold">{exam.subject}</td>
                            <td className="px-4 py-3 text-sm text-[#6B7280]">{exam.code}</td>
                            <td className="px-4 py-3 text-sm text-[#4F46E5] font-bold">{exam.room}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-[#6B7280]">No routine available for your batch</p>
          </div>
        )}
      </div>
    </div>
  );
}
