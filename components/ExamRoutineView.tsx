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

interface ExamRoutineViewProps {
  backHref: string;
  backLabel: string;
  title?: string;
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
                  {filtered.length} entries · {batchCount} batches
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

        <div className="mt-6 overflow-x-auto border border-[#E5E7EB] rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase text-xs">
              <tr>
                <th className="p-4 font-semibold">Batch</th>
                <th className="p-4 font-semibold">Subject</th>
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#9CA3AF]">
                    Loading routine...
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((routine, index) => (
                  <tr
                    key={`${routine.batch_name}-${routine.subject_code}-${index}`}
                    className="hover:bg-[#F9FAFB]"
                  >
                    <td className="p-4 font-bold text-[#4F46E5]">
                      {routine.batch_name}
                    </td>
                    <td className="p-4">{routine.subject_name}</td>
                    <td className="p-4 font-mono text-[#6B7280]">{routine.subject_code}</td>
                    <td className="p-4">{routine.exam_date}</td>
                    <td className="p-4">{routine.exam_time || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#9CA3AF]">
                    No routines found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}