"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const API = "https://pariksha-9qjs.onrender.com";

interface Session {
  exam_date: string;
  exam_time: string;
}

interface Allocation {
  student_id: number;
  full_name?: string | null;
  batch_name: string;
  subject_code: string;
  subject_name?: string | null;
  row_no: number;
  bench_no: number;
  seat_no: number;
}

interface Hall {
  hall_id: number;
  room_no: string;
  capacity: number;
  physical_capacity: number;
  usable_capacity: number;
  allocated: number;
  remaining: number;
  rows_count: number;
  benches_per_row: number;
  seats_per_bench: number;
  exam_date: string;
  exam_time: string;
  allocations: Allocation[];
}

export default function HallView() {
  const params = useParams();
  const roomId = params.id;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [hall, setHall] = useState<Hall | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/routines/sessions`);
      const data = await res.json();

      setSessions(Array.isArray(data) ? data : []);

      if (Array.isArray(data) && data.length > 0) {
        setSelectedSession(`${data[0].exam_date}|${data[0].exam_time}`);
      }
    } catch (err) {
      console.error(err);
      setSessions([]);
      setLoading(false);
    }
  }, []);

  const fetchHall = useCallback(async () => {
    if (!roomId || !selectedSession) return;

    const [date, time] = selectedSession.split("|");

    try {
      setLoading(true);

      const res = await fetch(
        `${API}/api/seat-allocation/hall/${roomId}?exam_date=${encodeURIComponent(
          date
        )}&exam_time=${encodeURIComponent(time)}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to load hall allocation.");
      }

      setHall(data);
    } catch (err) {
      console.error(err);
      setHall(null);
    } finally {
      setLoading(false);
    }
  }, [roomId, selectedSession]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadSessions();
    });
  }, [loadSessions]);

  useEffect(() => {
    if (!roomId || !selectedSession) return;

    queueMicrotask(() => {
      void fetchHall();
    });
  }, [fetchHall, roomId, selectedSession]);

  const seatMap = useMemo(() => {
    const map = new Map<string, Allocation>();

    hall?.allocations?.forEach((allocation) => {
      map.set(
        `${allocation.row_no}-${allocation.bench_no}-${allocation.seat_no}`,
        allocation
      );
    });

    return map;
  }, [hall]);

  const attendanceRows = useMemo(() => {
    return [...(hall?.allocations || [])].sort((a, b) => {
      if (a.row_no !== b.row_no) return a.row_no - b.row_no;
      if (a.bench_no !== b.bench_no) return a.bench_no - b.bench_no;
      return a.seat_no - b.seat_no;
    });
  }, [hall]);

  function generateAttendanceSheet() {
    if (!hall || attendanceRows.length === 0) {
      alert("No allocated students found for this hall and session.");
      return;
    }

    window.print();
  }

  if (!roomId) return <div style={{ padding: "30px" }}>Invalid Room ID</div>;

  return (
    <div style={{ padding: "30px", color: "black" }}>
      <style>{`
        .attendance-print-sheet {
          display: none;
        }

        @media print {
          body {
            background: white !important;
          }

          .hall-screen-view {
            display: none !important;
          }

          .attendance-print-sheet {
            display: block !important;
            color: black;
            font-family: Arial, sans-serif;
          }

          .attendance-print-sheet table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
            font-size: 12px;
          }

          .attendance-print-sheet th,
          .attendance-print-sheet td {
            border: 1px solid #111;
            padding: 8px;
            text-align: left;
            vertical-align: middle;
          }

          .attendance-print-sheet th {
            font-weight: 800;
            background: #f3f4f6;
          }

          .attendance-print-sheet .signature-cell {
            height: 34px;
          }

          @page {
            size: A4;
            margin: 14mm;
          }
        }
      `}</style>

      <div className="hall-screen-view">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "800",
              marginBottom: "8px",
            }}
          >
            Room: {hall?.room_no || roomId}
          </h2>

          {hall && (
            <div style={{ color: "#4b5563", fontWeight: 600 }}>
              Allocated: {hall.allocated} | Remaining: {hall.remaining} |
              Usable seats: {hall.usable_capacity}
            </div>
          )}
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            Exam Session
          </label>
          <select
            value={selectedSession}
            onChange={(event) => setSelectedSession(event.target.value)}
            style={{
              minWidth: "260px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "10px",
              color: "black",
              background: "white",
            }}
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
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : !hall ? (
        <div>No allocation data found for this room and session.</div>
      ) : (
        <>
          {hall.capacity !== hall.usable_capacity && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px 14px",
                border: "1px solid #f59e0b",
                borderRadius: "8px",
                background: "#fffbeb",
                color: "#92400e",
                fontWeight: 700,
              }}
            >
              Room capacity is {hall.capacity}, but the physical layout creates
              only {hall.physical_capacity} seats. Allocation uses{" "}
              {hall.usable_capacity} usable seats.
            </div>
          )}

          {Array.from({ length: hall.rows_count }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  fontWeight: "700",
                }}
              >
                Row {rowIndex + 1}
              </div>

              {Array.from({ length: hall.benches_per_row }).map(
                (_, benchIndex) => (
                  <div
                    key={benchIndex}
                    style={{
                      display: "flex",
                      border: "2px solid black",
                      padding: "18px",
                      borderRadius: "10px",
                      backgroundColor: "#fff",
                      minWidth: "120px",
                    }}
                  >
                    {Array.from({ length: hall.seats_per_bench }).map(
                      (_, seatIndex) => {
                        const allocation = seatMap.get(
                          `${rowIndex + 1}-${benchIndex + 1}-${seatIndex + 1}`
                        );

                        return (
                          <div
                            key={seatIndex}
                            style={{
                              width: "110px",
                              minHeight: "85px",
                              border: "2px solid black",
                              margin: "0 5px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              fontWeight: "700",
                              color: "black",
                              backgroundColor: allocation
                                ? "#d1fae5"
                                : "#f5f5f5",
                              padding: "4px",
                            }}
                          >
                            {allocation ? (
                              <>
                                <div>
                                  <b>ID:</b> {allocation.student_id}
                                </div>
                                <div>
                                  <b>Batch:</b> {allocation.batch_name}
                                </div>
                                <div>
                                  <b>Sub:</b> {allocation.subject_code}
                                </div>
                                <div>
                                  <b>Seat:</b> S{allocation.seat_no}
                                </div>
                              </>
                            ) : (
                              <>S{seatIndex + 1}</>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )
              )}
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "28px",
              paddingBottom: "12px",
            }}
          >
            <button
              type="button"
              onClick={generateAttendanceSheet}
              disabled={!hall || attendanceRows.length === 0}
              style={{
                border: "none",
                borderRadius: "10px",
                background:
                  !hall || attendanceRows.length === 0 ? "#9ca3af" : "#111827",
                color: "white",
                cursor:
                  !hall || attendanceRows.length === 0 ? "not-allowed" : "pointer",
                fontWeight: 800,
                padding: "13px 18px",
                boxShadow: "0 10px 25px rgba(17, 24, 39, 0.18)",
              }}
            >
              Generate Attendance Sheet
            </button>
          </div>
        </>
      )}
      </div>

      {hall && (
        <div className="attendance-print-sheet">
          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <h1 style={{ fontSize: "22px", margin: 0, fontWeight: 800 }}>
              Attendance Sheet
            </h1>
            <div style={{ marginTop: "8px", fontSize: "13px", fontWeight: 700 }}>
              Exam Date: {hall.exam_date} | Exam Time: {hall.exam_time}
            </div>
            <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700 }}>
              Hall: {hall.room_no} | Allocated Students: {hall.allocated}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style={{ width: "42px" }}>S.N.</th>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Batch</th>
                <th>Subject</th>
                <th>Seat</th>
                <th style={{ width: "145px" }}>Signature</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRows.map((allocation, index) => (
                <tr key={`${allocation.row_no}-${allocation.bench_no}-${allocation.seat_no}`}>
                  <td>{index + 1}</td>
                  <td>{allocation.student_id}</td>
                  <td>{allocation.full_name || ""}</td>
                  <td>{allocation.batch_name}</td>
                  <td>
                    {allocation.subject_code}
                    {allocation.subject_name ? ` - ${allocation.subject_name}` : ""}
                  </td>
                  <td>
                    R{allocation.row_no}-B{allocation.bench_no}-S{allocation.seat_no}
                  </td>
                  <td className="signature-cell"></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "48px",
              marginTop: "52px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            <div>
              <div style={{ borderTop: "1px solid #111", paddingTop: "8px" }}>
                Invigilator Signature
              </div>
            </div>
            <div>
              <div style={{ borderTop: "1px solid #111", paddingTop: "8px" }}>
                Exam Coordinator Signature
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
