"use client";

import { useEffect, useState } from "react";

export default function SeatAllocationPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedBatchMap, setSelectedBatchMap] = useState<any>({});

  const api = "https://pariksha-9qjs.onrender.com";

  useEffect(() => {
    fetch(`${api}/rooms/`).then(r => r.json()).then(setRooms);
    fetch(`${api}/batches/`).then(r => r.json()).then(setBatches);
  }, []);

  return (
    <div style={{ display: "flex", padding: "20px", gap: "20px" }}>

      {/* LEFT SIDE - ROOMS */}
      <div style={{ width: "40%" }}>
        <h2 style={{ fontWeight: "800" }}>Exam Rooms</h2>

        {rooms.map((room) => (
          <div
            key={room.hall_id}
            onClick={() => setSelectedRoom(room)}
            style={{
              border: "2px solid black",
              padding: "12px",
              marginBottom: "10px",
              cursor: "pointer",
              backgroundColor: selectedRoom?.hall_id === room.hall_id ? "#ddd" : "#fff",
            }}
          >
            <div style={{ fontWeight: "700" }}>{room.room_no}</div>
            <div>Capacity: {room.capacity}</div>
          </div>
        ))}
      </div>

      {/* RIGHT SIDE */}
      <div style={{ width: "60%" }}>

        <h2 style={{ fontWeight: "800" }}>Batch Allocation</h2>

        {/* Batch Dropdown */}
        <select
          style={{ padding: "10px", border: "2px solid black", marginBottom: "10px" }}
          onChange={(e) =>
            setSelectedBatchMap({
              ...selectedBatchMap,
              batch: e.target.value,
            })
          }
        >
          <option>Select Batch</option>
          {batches.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Exam Mapping (simple for now) */}
        <select
          style={{ padding: "10px", border: "2px solid black", marginLeft: "10px" }}
        >
          <option>Select Exam</option>
          <option value="A">Exam A</option>
          <option value="B">Exam B</option>
          <option value="C">Exam C</option>
        </select>

        <br /><br />

        {/* Allocate Button */}
        <button
          style={{
            padding: "10px 20px",
            border: "2px solid black",
            backgroundColor: "black",
            color: "white",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Allocate Students
        </button>

      </div>
    </div>
  );
}