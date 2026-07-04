"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function HallView() {
  const params = useParams();
  const roomId = params.id; // IMPORTANT FIX

  const [hall, setHall] = useState<any>(null);

  useEffect(() => {
    if (!roomId) return;

    const fetchHall = async () => {
      const res = await fetch(
        `https://pariksha-9qjs.onrender.com/rooms/${roomId}`
      );

      const data = await res.json();

      console.log("RAW RESPONSE:", data); // 👈 CHECK THIS IN CONSOLE

      setHall(data);
    };

    fetchHall();
  }, [roomId]);

  if (!roomId) return <div>Invalid Room ID</div>;
  if (!hall) return <div>Loading...</div>;

  return (
  <div style={{ padding: "20px" }}>
    <h2 style={{ fontWeight: "bold", marginBottom: "20px" }}>
      Room: {hall.room_no}
    </h2>

    {/* ROWS */}
    {Array.from({ length: hall.rows_count }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "20px",
          gap: "15px",
        }}
      >
        {/* Row label */}
        <div style={{ width: "60px", fontWeight: "bold" }}>
          Row {rowIndex + 1}
        </div>

        {/* Benches */}
        {Array.from({ length: hall.benches_per_row }).map((_, benchIndex) => (
          <div
            key={benchIndex}
            style={{
              display: "flex",
              border: "2px solid #333",
              padding: "10px",
              borderRadius: "8px",
              gap: "5px",
              background: "#f9f9f9",
            }}
          >
            {/* Seats */}
            {Array.from({ length: hall.seats_per_bench }).map((_, seatIndex) => (
              <div
                key={seatIndex}
                style={{
                  width: "30px",
                  height: "30px",
                  backgroundColor: "#ddd",
                  border: "1px solid #999",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                S
              </div>
            ))}
          </div>
        ))}
      </div>
    ))}
  </div>
);}