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
const seatMap = new Map<string, any>();

hall.allocations?.forEach((a: any) => {
  seatMap.set(
    `${a.row_no}-${a.bench_no}-${a.seat_no}`,
    a
  );
});

return (
  <div style={{ padding: "30px", color: "black" }}>
    <h2
      style={{
        fontSize: "22px",
        fontWeight: "800",
        marginBottom: "20px",
      }}
    >
      Room: {hall.room_no}
    </h2>

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

        {Array.from({ length: hall.benches_per_row }).map((_, benchIndex) => (
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
                        <div>ID: {allocation.student_id}</div>
                        <div>{allocation.batch_name}</div>
                        <div>S{allocation.seat_no}</div>
                      </>
                    ) : (
                      <>S{seatIndex + 1}</>
                    )}
                  </div>
                );
              }
            )}
          </div>
        ))}
      </div>
    ))}
  </div>
);
}