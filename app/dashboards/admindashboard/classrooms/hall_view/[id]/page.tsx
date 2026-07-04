"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function HallView() {
  const params = useParams();
  const roomId = params.hall_id;

  const [hall, setHall] = useState<any>(null);

  useEffect(() => {
    const fetchHall = async () => {
      const res = await fetch(
        `https://pariksha-9qjs.onrender.com/rooms/${roomId}`
      );
      const data = await res.json();
      setHall(data);
    };

    if (roomId) fetchHall();
  }, [roomId]);

  if (!hall) return <div>Loading...</div>;

  const rows = hall.rows_count;
  const benches = hall.benches_per_row;
  const seats = hall.seats_per_bench;

  return (
    <div>
      <h2>Room: {hall.room_no}</h2>

      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "flex", gap: "10px", marginBottom: 10 }}>
          {Array.from({ length: benches }).map((_, b) => (
            <div key={b} style={{ border: "1px solid black", padding: 5 }}>
              {Array.from({ length: seats }).map((_, s) => (
                <div
                  key={s}
                  style={{
                    width: 20,
                    height: 20,
                    background: "lightgray",
                    margin: 2,
                    display: "inline-block",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}