"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const API = "https://pariksha-9qjs.onrender.com";

interface Session {
  exam_date: string;
  exam_time: string;
}

export default function HallView() {
  const params = useParams();
  const roomId = params.id;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [hall, setHall] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!roomId || !selectedSession) return;
    fetchHall();
  }, [roomId, selectedSession]);

  async function loadSessions() {
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
  }

  async function fetchHall() {
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

  if (!roomId) return <div style={{ padding: "30px" }}>Invalid Room ID</div>;

  return (
    <div style={{ padding: "30px", color: "black" }}>
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
        </>
      )}
    </div>
  );
}
