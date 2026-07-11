"use client";

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
    <div className="text-[#111827]">
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-[#111827]">My Seat Allocation</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Only allocations linked to your login are shown here.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mt-6">
          {loading ? (
            <div className="text-[#9CA3AF]">Loading seat allocation...</div>
          ) : allocations.length ? (
            allocations.map((allocation, index) => (
              <article
                key={`${allocation.exam_date}-${allocation.exam_time}-${index}`}
                className="border border-[#E5E7EB] rounded-xl p-5 bg-[#F9FAFB]"
              >
                <div className="text-xs font-bold text-[#4F46E5] uppercase">
                  {allocation.exam_date} | {allocation.exam_time}
                </div>
                <h2 className="text-xl font-extrabold mt-2 text-[#111827]">
                  Room {allocation.room_no}
                </h2>
                <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                  <div>
                    <div className="text-[#6B7280]">Row</div>
                    <div className="font-bold text-[#111827]">{allocation.row_no}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280]">Bench</div>
                    <div className="font-bold text-[#111827]">{allocation.bench_no}</div>
                  </div>
                  <div>
                    <div className="text-[#6B7280]">Seat</div>
                    <div className="font-bold text-[#111827]">{allocation.seat_no}</div>
                  </div>
                </div>
                <p className="text-sm text-[#4B5563] mt-4">
                  {allocation.subject_name} ({allocation.subject_code})
                </p>
                <p className="text-sm text-[#6B7280]">{allocation.batch_name}</p>
              </article>
            ))
          ) : (
            <div className="text-[#9CA3AF]">
              No seat allocation has been published for your account yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}