"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API = "https://pariksha-9qjs.onrender.com";

export default function TeacherAllocatedHallPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [sessionSearch, setSessionSearch] = useState("");
  const [hall, setHall] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  useEffect(() => {
    if (!selected) return;
    loadHallDetails(selected);
  }, [selected]);

  async function loadAssignments() {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/seat-allocation/teacher/${userId}`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      setAssignments(rows);
      setSelected(rows[0] || null);
    } catch (err) {
      console.error(err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadHallDetails(item: any) {
    const query = `exam_date=${encodeURIComponent(item.exam_date)}&exam_time=${encodeURIComponent(item.exam_time)}`;
    const [hallRes, attendanceRes] = await Promise.all([
      fetch(`${API}/api/seat-allocation/hall/${item.hall_id}?${query}`),
      fetch(`${API}/api/seat-allocation/attendance?hall_id=${item.hall_id}&${query}`),
    ]);
    setHall(await hallRes.json());
    setAttendance(await attendanceRes.json());
  }

  const seatMap = useMemo(() => {
    const map = new Map<string, any>();
    hall?.allocations?.forEach((allocation: any) => {
      map.set(
        `${allocation.row_no}-${allocation.bench_no}-${allocation.seat_no}`,
        allocation
      );
    });
    return map;
  }, [hall]);

  const filteredAssignments = useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    if (!query) return assignments;
    return assignments.filter(
      (item) =>
        item.room_no?.toLowerCase().includes(query) ||
        item.exam_date?.toLowerCase().includes(query) ||
        item.exam_time?.toLowerCase().includes(query)
    );
  }, [assignments, sessionSearch]);

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-950">
      <section className="max-w-7xl mx-auto">
        <Link
          href="/dashboards/teacherdashboard"
          className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-4"
        >
          ← Back to Teacher Dashboard
        </Link>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-extrabold">My Allocated Exam Hall</h1>
          <p className="text-sm text-slate-500 mt-1">
            View assigned invigilation halls and attendance sheets.
          </p>

          {loading ? (
            <div className="mt-6 text-slate-400">Loading assignments...</div>
          ) : assignments.length ? (
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <input
                value={sessionSearch}
                onChange={(event) => setSessionSearch(event.target.value)}
                placeholder="Search by room, date, or time..."
                className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500"
              />
              <select
                value={
                  selected
                    ? `${selected.exam_date}|${selected.exam_time}|${selected.hall_id}`
                    : ""
                }
                onChange={(event) => {
                  const [date, time, hallId] = event.target.value.split("|");
                  setSelected(
                    assignments.find(
                      (item) =>
                        item.exam_date === date &&
                        item.exam_time === time &&
                        String(item.hall_id) === hallId
                    ) || null
                  );
                }}
                className="border border-slate-300 rounded-lg px-4 py-3 text-sm min-w-[260px]"
              >
                {filteredAssignments.map((item) => (
                  <option
                    key={`${item.exam_date}-${item.exam_time}-${item.hall_id}`}
                    value={`${item.exam_date}|${item.exam_time}|${item.hall_id}`}
                  >
                    {item.exam_date} | {item.exam_time} | Room {item.room_no}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mt-6 text-slate-400">
              No hall has been assigned to you yet.
            </div>
          )}
        </div>

        {hall && (
          <div className="grid xl:grid-cols-2 gap-6 mt-6">
            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-auto">
              <h2 className="text-lg font-bold mb-4">Hall Layout: {hall.room_no}</h2>
              {Array.from({ length: hall.rows_count }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-4 mb-5">
                  <div className="w-16 font-bold">Row {rowIndex + 1}</div>
                  {Array.from({ length: hall.benches_per_row }).map((_, benchIndex) => (
                    <div
                      key={benchIndex}
                      className="flex border-2 border-slate-900 rounded-lg p-3 bg-white"
                    >
                      {Array.from({ length: hall.seats_per_bench }).map((_, seatIndex) => {
                        const allocation = seatMap.get(
                          `${rowIndex + 1}-${benchIndex + 1}-${seatIndex + 1}`
                        );
                        return (
                          <div
                            key={seatIndex}
                            className={`w-24 min-h-20 border-2 m-1 p-1 text-[10px] font-bold flex flex-col items-center justify-center ${
                              allocation ? "bg-emerald-100 border-emerald-700" : "bg-slate-100 border-slate-300"
                            }`}
                          >
                            {allocation ? (
                              <>
                                <div>{allocation.full_name || allocation.student_id}</div>
                                <div>{allocation.batch_name}</div>
                                <div>{allocation.subject_code}</div>
                                <div>S{allocation.seat_no}</div>
                              </>
                            ) : (
                              <>S{seatIndex + 1}</>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </section>

            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Attendance Sheet</h2>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3">Seat</th>
                      <th className="p-3">Signature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendance.map((row) => (
                      <tr key={`${row.student_id}-${row.row_no}-${row.seat_no}`}>
                        <td className="p-3">{row.full_name || row.student_id}</td>
                        <td className="p-3">{row.batch_name}</td>
                        <td className="p-3">
                          R{row.row_no} B{row.bench_no} S{row.seat_no}
                        </td>
                        <td className="p-3 border-l border-slate-100">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => window.print()}
                className="mt-4 bg-indigo-600 text-white rounded-lg px-5 py-3 font-bold"
              >
                Print Attendance Sheet
              </button>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
