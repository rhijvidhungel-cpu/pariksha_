"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function HallView() {
  const params = useParams();
  const roomId = params.hall_id; // IMPORTANT FIX

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
    <div>
      <h2>Room: {hall.room_no}</h2>
      <p>Rows: {hall.rows_count}</p>
      <p>Benches: {hall.benches_per_row}</p>
      <p>Seats per bench: {hall.seats_per_bench}</p>
    </div>
  );
}