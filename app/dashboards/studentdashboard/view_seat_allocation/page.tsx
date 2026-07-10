"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API = "https://pariksha-9qjs.onrender.com";

export default function StudentSeatAllocationPage() {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeat();
  }, []);

  async function loadSeat() {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/seat-allocation/student/${userId}`);
      const data = await res.json();
      setAllocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8 text-slate-950">
      <section className="max-w-5xl mx-auto">
        <Link
          href="/dashboards/studentdashboard"
          className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-4"
        >
          ← Back to Student Dashboard
        </Link>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-extrabold">My Seat Allocation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Only allocations linked to your login are shown here.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mt-6">
          {loading ? (
            <div className="text-slate-400">Loading seat allocation...</div>
          ) : allocations.length ? (
            allocations.map((allocation, index) => (
              <article
                key={`${allocation.exam_date}-${allocation.exam_time}-${index}`}
                className="border border-slate-200 rounded-xl p-5 bg-slate-50"
              >
                <div className="text-xs font-bold text-indigo-600 uppercase">
                  {allocation.exam_date} | {allocation.exam_time}
                </div>
                <h2 className="text-xl font-extrabold mt-2">
                  Room {allocation.room_no}
                </h2>
                <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                  <div>
                    <div className="text-slate-500">Row</div>
                    <div className="font-bold">{allocation.row_no}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Bench</div>
                    <div className="font-bold">{allocation.bench_no}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Seat</div>
                    <div className="font-bold">{allocation.seat_no}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-4">
                  {allocation.subject_name} ({allocation.subject_code})
                </p>
                <p className="text-sm text-slate-500">{allocation.batch_name}</p>
              </article>
            ))
          ) : (
            <div className="text-slate-400">
              No seat allocation has been published for your account yet.
            </div>
          )}
        </div>
        </div>
      </section>
    </main>
  );
}
