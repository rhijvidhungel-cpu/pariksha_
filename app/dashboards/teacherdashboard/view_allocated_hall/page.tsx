"use client";

import { useEffect, useMemo, useState } from "react";

const API = "https://pariksha-9qjs.onrender.com";

export default function TeacherAllocatedHallPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [sessionSearch, setSessionSearch] = useState("");
  const [hall, setHall] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHallFull, setShowHallFull] = useState(false);
  const [showAttendanceSheet, setShowAttendanceSheet] = useState(false);

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

  function printAttendanceOnly() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    let tableRows = attendance.map((row: any) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #333; font-size: 12px;">${row.full_name || row.student_id}</td>
        <td style="padding: 8px; border: 1px solid #333; font-size: 12px;">${row.batch_name}</td>
        <td style="padding: 8px; border: 1px solid #333; font-size: 12px;">R${row.row_no} B${row.bench_no} S${row.seat_no}</td>
        <td style="padding: 8px; border: 1px solid #333; height: 30px;"></td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Sheet - ${hall?.room_no || ''}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: Arial, sans-serif; }
            h2 { text-align: center; margin-bottom: 5px; font-size: 16px; }
            h3 { text-align: center; margin-top: 0; font-size: 14px; font-weight: normal; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f0f0f0; padding: 8px; border: 1px solid #333; font-size: 12px; text-align: left; }
            td { padding: 8px; border: 1px solid #333; font-size: 12px; }
            .header-info { text-align: center; margin-bottom: 10px; font-size: 12px; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h2>ATTENDANCE SHEET</h2>
          <h3>Room: ${hall?.room_no || ''} | Date: ${selected?.exam_date || ''} | Time: ${selected?.exam_time || ''}</h3>
          <div class="header-info">Invigilator Signature: ___________________</div>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Batch</th>
                <th>Seat</th>
                <th>Signature</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div style="margin-top: 30px; font-size: 11px;">
            <p>Total Students: ${attendance.length}</p>
            <p>Present: ________ | Absent: ________</p>
          </div>
          <script>
            window.print();
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111827]">
      <div className="p-4 md:p-8">
        {/* Selection Controls */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-extrabold text-[#111827]">My Allocated Exam Hall</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            View assigned invigilation halls and attendance sheets.
          </p>

          {loading ? (
            <div className="mt-6 text-[#9CA3AF]">Loading assignments...</div>
          ) : assignments.length ? (
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <input
                value={sessionSearch}
                onChange={(event) => setSessionSearch(event.target.value)}
                placeholder="Search by room, date, or time..."
                className="flex-1 border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm outline-none focus:border-[#4F46E5]"
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
                className="border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm w-full sm:min-w-[260px]"
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
            <div className="mt-6 text-[#9CA3AF]">
              No hall has been assigned to you yet.
            </div>
          )}
        </div>

        {hall && (
          <div className="flex flex-col gap-6 mt-6">
            {/* Hall View Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowHallFull(!showHallFull)}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg px-6 py-3 text-sm font-bold transition-colors"
              >
                {showHallFull ? "Collapse Hall View" : "View Full Hall Layout"}
              </button>
              <button
                onClick={() => { setShowAttendanceSheet(!showAttendanceSheet); }}
                className="bg-[#10B981] hover:bg-[#059669] text-white rounded-lg px-6 py-3 text-sm font-bold transition-colors"
              >
                {showAttendanceSheet ? "Hide Attendance Sheet" : "View Attendance Sheet"}
              </button>
            </div>

            {/* Full Hall Layout */}
            {showHallFull && (
              <section className="bg-white border border-[#E5E7EB] rounded-xl p-4 md:p-6 shadow-sm overflow-auto w-full">
                <h2 className="text-lg font-bold mb-4 text-[#111827]">Hall Layout: {hall.room_no}</h2>
                {Array.from({ length: hall.rows_count }).map((_, rowIndex) => (
                  <div key={rowIndex} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5 min-w-fit">
                    <div className="w-20 font-bold text-[#4F46E5] shrink-0">Row {rowIndex + 1}</div>
                    {Array.from({ length: hall.benches_per_row }).map((_, benchIndex) => (
                      <div
                        key={benchIndex}
                        className="flex border-2 border-[#1F2937] rounded-lg p-2 md:p-3 bg-white"
                      >
                        {Array.from({ length: hall.seats_per_bench }).map((_, seatIndex) => {
                          const allocation = seatMap.get(
                            `${rowIndex + 1}-${benchIndex + 1}-${seatIndex + 1}`
                          );
                          return (
                            <div
                              key={seatIndex}
                              className={`w-16 md:w-24 min-h-[4rem] md:min-h-20 border-2 m-1 p-1 text-[10px] font-bold flex flex-col items-center justify-center ${
                                allocation ? "bg-emerald-100 border-emerald-700" : "bg-slate-100 border-slate-300"
                              }`}
                            >
                              {allocation ? (
                                <>
                                  <div className="text-[9px] leading-tight text-center">{allocation.full_name || allocation.student_id}</div>
                                  <div className="text-[9px]">{allocation.batch_name}</div>
                                  <div className="text-[9px]">{allocation.subject_code}</div>
                                  <div className="text-[9px]">S{allocation.seat_no}</div>
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
            )}

            {/* Attendance Sheet Section */}
            {showAttendanceSheet && (
              <section className="bg-white border border-[#E5E7EB] rounded-xl p-4 md:p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4 text-[#111827]">Attendance Sheet</h2>
                <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
                  <table className="w-full text-left text-sm min-w-[500px]">
                    <thead className="bg-[#F9FAFB] text-[#6B7280] uppercase text-xs">
                      <tr>
                        <th className="p-3 font-semibold">Student</th>
                        <th className="p-3 font-semibold">Batch</th>
                        <th className="p-3 font-semibold">Seat</th>
                        <th className="p-3 font-semibold">Signature</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {attendance.map((row) => (
                        <tr key={`${row.student_id}-${row.row_no}-${row.seat_no}`}>
                          <td className="p-3">{row.full_name || row.student_id}</td>
                          <td className="p-3">{row.batch_name}</td>
                          <td className="p-3">
                            R{row.row_no} B{row.bench_no} S{row.seat_no}
                          </td>
                          <td className="p-3 border-l border-[#F3F4F6]">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={printAttendanceOnly}
                  className="mt-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg px-5 py-3 text-sm font-bold transition-colors"
                >
                  🖨️ Print Attendance Sheet (A4)
                </button>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}