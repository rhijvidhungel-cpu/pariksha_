"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API = "https://pariksha-9qjs.onrender.com";

interface Teacher {
  user_id: number;
  name: string;
  email: string;
}

export default function AdminHallView() {
  const params = useParams();
  const roomId = params.id;
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [hall, setHall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [assignedTeacher, setAssignedTeacher] = useState<any>(null);
  const [savingInvigilator, setSavingInvigilator] = useState(false);

  useEffect(() => {
    loadSessions();
    loadTeachers();
  }, []);

  useEffect(() => {
    if (!roomId || !selectedSession) return;
    loadHall();
    loadInvigilator();
  }, [roomId, selectedSession]);

  async function loadSessions() {
    const res = await fetch(`${API}/api/routines/sessions`);
    const data = await res.json();
    setSessions(Array.isArray(data) ? data : []);
    if (Array.isArray(data) && data.length > 0) {
      setSelectedSession(`${data[0].exam_date}|${data[0].exam_time}`);
    }
  }

  async function loadTeachers() {
    try {
      const res = await fetch(`${API}/api/dashboards/admindashboard/teachers`);
      const data = await res.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch {
      setTeachers([]);
    }
  }

  async function loadHall() {
    const [date, time] = selectedSession.split("|");
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/seat-allocation/hall/${roomId}?exam_date=${encodeURIComponent(
          date
        )}&exam_time=${encodeURIComponent(time)}`
      );
      setHall(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function loadInvigilator() {
    const [date, time] = selectedSession.split("|");
    try {
      const res = await fetch(
        `${API}/api/seat-allocation/invigilator?hall_id=${roomId}&exam_date=${encodeURIComponent(
          date
        )}&exam_time=${encodeURIComponent(time)}`
      );
      const data = await res.json();
      setAssignedTeacher(data?.teacher_user_id ? data : null);
      setSelectedTeacherId(data?.teacher_user_id ? String(data.teacher_user_id) : "");
    } catch {
      setAssignedTeacher(null);
      setSelectedTeacherId("");
    }
  }

  async function saveInvigilator() {
    if (!selectedTeacherId) {
      alert("Select a teacher to assign as invigilator.");
      return;
    }

    const [date, time] = selectedSession.split("|");
    setSavingInvigilator(true);
    try {
      const res = await fetch(`${API}/api/seat-allocation/invigilator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hall_id: Number(roomId),
          exam_date: date,
          exam_time: time,
          teacher_user_id: Number(selectedTeacherId),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to assign invigilator.");
      await loadInvigilator();
      alert("Invigilator assigned successfully.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to assign invigilator.");
    } finally {
      setSavingInvigilator(false);
    }
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

  if (!roomId) return <div className="p-8 text-black">Invalid Room ID</div>;

  return (
    <main className="p-8 text-black bg-slate-100 min-h-screen">
      <Link
        href="/dashboards/admindashboard/classrooms"
        className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-4"
      >
        ← Back to Classrooms
      </Link>

      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">
              Room: {hall?.room_no || roomId}
            </h1>
            {hall && (
              <p className="text-sm text-slate-500 mt-1">
                Allocated {hall.allocated} | Remaining {hall.remaining} | Usable{" "}
                {hall.usable_capacity}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Exam Session
              </label>
              <select
                value={selectedSession}
                onChange={(event) => setSelectedSession(event.target.value)}
                className="border border-slate-300 rounded-lg px-4 py-3 text-sm bg-white min-w-[220px]"
              >
                {sessions.map((session, index) => (
                  <option
                    key={index}
                    value={`${session.exam_date}|${session.exam_time}`}
                  >
                    {session.exam_date} | {session.exam_time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">
                Assign Invigilator
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedTeacherId}
                  onChange={(event) => setSelectedTeacherId(event.target.value)}
                  className="border border-slate-300 rounded-lg px-4 py-3 text-sm bg-white min-w-[200px]"
                >
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.user_id} value={teacher.user_id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
                <button
                  onClick={saveInvigilator}
                  disabled={savingInvigilator}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg px-4 py-3 text-sm font-bold whitespace-nowrap"
                >
                  {savingInvigilator ? "Saving..." : "Save"}
                </button>
              </div>
              {assignedTeacher?.full_name && (
                <p className="text-xs text-emerald-700 font-semibold mt-2">
                  Current invigilator: {assignedTeacher.full_name} ({assignedTeacher.email})
                </p>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-slate-400">Loading hall...</div>
        ) : hall ? (
          <div className="overflow-auto">
            {Array.from({ length: hall.rows_count }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-5 mb-6">
                <div className="w-20 font-bold">Row {rowIndex + 1}</div>
                {Array.from({ length: hall.benches_per_row }).map((_, benchIndex) => (
                  <div
                    key={benchIndex}
                    className="flex border-2 border-black rounded-lg p-4 bg-white"
                  >
                    {Array.from({ length: hall.seats_per_bench }).map((_, seatIndex) => {
                      const allocation = seatMap.get(
                        `${rowIndex + 1}-${benchIndex + 1}-${seatIndex + 1}`
                      );
                      return (
                        <div
                          key={seatIndex}
                          className={`w-28 min-h-24 border-2 m-1 p-1 text-[10px] font-bold flex flex-col items-center justify-center ${
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
          </div>
        ) : (
          <div className="text-slate-400">No hall data found.</div>
        )}
      </section>
    </main>
  );
}
