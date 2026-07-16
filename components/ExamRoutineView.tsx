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

interface SessionGroup {
  batch_name: string;
  exam_date: string;
  exam_time: string;
  subjects: { name: string; code: string }[];
}

interface ExamRoutineViewProps {
  backHref: string;
  backLabel: string;
  title?: string;
}

function groupBySession(routines: Routine[]): SessionGroup[] {
  const sessions = new Map<string, SessionGroup>();

  for (const r of routines) {
    const key = `${r.batch_name}|${r.exam_date}|${r.exam_time}`;
    if (!sessions.has(key)) {
      sessions.set(key, {
        batch_name: r.batch_name,
        exam_date: r.exam_date,
        exam_time: r.exam_time,
        subjects: [],
      });
    }
    sessions.get(key)!.subjects.push({ name: r.subject_name, code: r.subject_code });
  }

  return Array.from(sessions.values()).sort((a, b) => {
    const dateCmp = new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime();
    if (dateCmp !== 0) return dateCmp;
    return a.exam_time.localeCompare(b.exam_time);
  });
}

export default function ExamRoutineView({
  backHref,
  backLabel,
  title = "Exam Routine",
}: ExamRoutineViewProps) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutines();
  }, []);

  async function loadRoutines() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/routines/all`);
      const data = await res.json();
      setRoutines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  }

  // Filter routines by search query
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return routines;
    return routines.filter(
      (routine) =>
        routine.batch_name?.toLowerCase().includes(query) ||
        routine.subject_name?.toLowerCase().includes(query) ||
        routine.subject_code?.toLowerCase().includes(query)
    );
  }, [routines, search]);

  // Group filtered routines by session (batch + date + time)
  const sessions = useMemo(() => groupBySession(filtered), [filtered]);

  const batchCount = useMemo(() => {
    return new Set(filtered.map((r) => r.batch_name)).size;
  }, [filtered]);

  return (
    <div className="text-[#111827]">
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#111827]">{title}</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Search by batch, subject, or subject code.
              {!loading && filtered.length > 0 && (
                <span className="ml-2 text-[#4F46E5] font-semibold">
                  {filtered.length} entries · {batchCount} batches · {sessions.length} sessions
                </span>
              )}
            </p>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full md:w-80 border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100"
            placeholder="Search batch e.g. CE-2024"
          />
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="p-8 text-center text-[#9CA3AF]">Loading routine...</div>
          ) : sessions.length > 0 ? (
            sessions.map((session, idx) => (
              <div key={idx} className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                {/* Session Header - shows batch, date, time once */}
                <div className="bg-[#2E1A47] text-white px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex items-center gap-4">
                    <span className="font-extrabold text-lg">{session.batch_name}</span>
                    <span className="text-sm text-[#A5B4FC] font-medium">{session.exam_date}</span>
                    <span className="text-sm text-[#A5B4FC] font-medium">{session.exam_time || "—"}</span>
                  </div>
                  <span className="text-xs text-[#A5B4FC]">{session.subjects.length} subject(s)</span>
                </div>

                {/* Subjects Table for this session */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase text-xs">
                      <tr>
                        <th className="p-4 font-semibold w-12">S.No</th>
                        <th className="p-4 font-semibold">Subject</th>
                        <th className="p-4 font-semibold">Code</th>
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
            ))
          ) : (
            <div className="p-8 text-center text-[#9CA3AF] border border-[#E5E7EB] rounded-xl">
              No routines found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
