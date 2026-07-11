"use client";

import { useEffect, useMemo, useState } from "react";

const API = "https://pariksha-9qjs.onrender.com";

interface Routine {
  batch_name: string;
  subject_name: string;
  subject_code: string;
  exam_date: string;
  exam_time: string;
}

// Group routines by their exam session (date+time) for tabular display
function groupBySession(routines: Routine[]) {
  const sessions = new Map<string, { date: string; time: string; subjects: { name: string; code: string }[] }>();
  
  for (const r of routines) {
    const key = `${r.exam_date}|${r.exam_time}`;
    if (!sessions.has(key)) {
      sessions.set(key, { date: r.exam_date, time: r.exam_time, subjects: [] });
    }
    sessions.get(key)!.subjects.push({ name: r.subject_name, code: r.subject_code });
  }
  
  return Array.from(sessions.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default function StudentExamRoutinePage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentBatch, setStudentBatch] = useState<string>("");

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    // Get student's batch from localStorage username (format: roll-BATCH)
    const username = localStorage.getItem("username") || "";
    const batchFromUsername = username.includes("-") ? username.split("-").slice(1).join("-") : "";
    
    // Fetch student info to get batch
    fetch(`${API}/api/seat-allocation/student/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setStudentBatch(data[0].batch_name || batchFromUsername);
        } else {
          setStudentBatch(batchFromUsername);
        }
      })
      .catch(() => setStudentBatch(batchFromUsername))
      .finally(() => loadRoutines());
  }, []);

  async function loadRoutines() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/routines/all`);
      const data = await res.json();
      const allRoutines = Array.isArray(data) ? data : [];
      setRoutines(allRoutines);
    } catch (err) {
      console.error(err);
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  }

  // Filter routines: only show the student's own batch routines
  const myBatchRoutines = useMemo(() => {
    if (!studentBatch) return [];
    return routines.filter(r => r.batch_name === studentBatch);
  }, [routines, studentBatch]);

  const sessions = useMemo(() => groupBySession(myBatchRoutines), [myBatchRoutines]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111827]">
      <div className="p-8">
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-extrabold text-[#111827]">My Exam Routine</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {studentBatch ? `Showing routine for batch: ${studentBatch}` : "Loading your batch..."}
          </p>

          {loading ? (
            <div className="mt-6 text-[#9CA3AF]">Loading routine...</div>
          ) : sessions.length > 0 ? (
            <div className="mt-6 grid gap-6">
              {sessions.map((session, idx) => (
                <div key={idx} className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                  {/* Session Header */}
                  <div className="bg-[#2E1A47] text-white px-5 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-extrabold">{session.date}</span>
                        <span className="text-sm text-[#A5B4FC] font-medium">{session.time}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subjects Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase text-xs">
                        <tr>
                          <th className="p-4 font-semibold">S.No</th>
                          <th className="p-4 font-semibold">Subject Name</th>
                          <th className="p-4 font-semibold">Subject Code</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6]">
                        {session.subjects.map((subject, sIdx) => (
                          <tr key={sIdx} className="hover:bg-[#F9FAFB]">
                            <td className="p-4 font-bold text-[#4F46E5]">{sIdx + 1}</td>
                            <td className="p-4 font-medium">{subject.name}</td>
                            <td className="p-4 font-mono text-[#6B7280]">{subject.code}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 text-[#9CA3AF]">
              {studentBatch ? `No exam routine found for batch "${studentBatch}".` : "Unable to determine your batch. Please contact admin."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}