"use client";

import { useEffect, useMemo, useState } from "react";

const API = "https://pariksha-9qjs.onrender.com";

interface Session {
  exam_date: string;
  exam_time: string;
}

interface Batch {
  batch: string;
  subject: string;
  subject_code: string;
  students: number;
}

interface Room {
  hall_id: number;
  room_no: string;
  capacity: number;
}

export default function SeatAllocationPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadSessions();
    loadRooms();
  }, []);

  async function loadSessions() {
    try {
      const res = await fetch(`${API}/api/allocation/sessions`);
      const data = await res.json();

      setSessions(data);

      if (data.length > 0) {
        setSelectedSession(
          `${data[0].exam_date}|${data[0].exam_time}`
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function loadRooms() {
    try {
      const res = await fetch(`${API}/rooms`);
      const data = await res.json();

      setRooms(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!selectedSession) return;

    loadSessionDetails();
  }, [selectedSession]);

  async function loadSessionDetails() {
    const [date, time] = selectedSession.split("|");

    setLoading(true);

    try {
      const res = await fetch(
        `${API}/api/allocation/session?exam_date=${encodeURIComponent(
          date
        )}&exam_time=${encodeURIComponent(time)}`
      );

      const data = await res.json();

      setBatches(data.batches || []);
      setSelectedBatches([]);
    } catch (err) {
      console.error(err);
      setBatches([]);
    }

    setLoading(false);
  }

  function toggleBatch(batch: string) {
    if (selectedBatches.includes(batch)) {
      setSelectedBatches(
        selectedBatches.filter((b) => b !== batch)
      );
    } else {
      setSelectedBatches([...selectedBatches, batch]);
    }
  }

  function toggleRoom(id: number) {
    if (selectedRooms.includes(id)) {
      setSelectedRooms(
        selectedRooms.filter((r) => r !== id)
      );
    } else {
      setSelectedRooms([...selectedRooms, id]);
    }
  }

  const totalStudents = useMemo(() => {
    return batches
      .filter((b) => selectedBatches.includes(b.batch))
      .reduce((sum, b) => sum + b.students, 0);
  }, [selectedBatches, batches]);

  const totalCapacity = useMemo(() => {
    return rooms
      .filter((r) => selectedRooms.includes(r.hall_id))
      .reduce((sum, r) => sum + r.capacity, 0);
  }, [selectedRooms, rooms]);

async function generateAllocation() {
  if (selectedBatches.length === 0 || selectedRooms.length === 0) {
    alert("Select at least one batch and one room.");
    return;
  }

  setGenerating(true);

  try {
    const res = await fetch(`${API}/api/seat-allocation/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_date: selectedSession.split("|")[0],
        exam_time: selectedSession.split("|")[1],
        batches: selectedBatches,
        rooms: selectedRooms,
      }),
    });

    const data = await res.json();
    
    if (res.ok) {
      alert(`Allocation successful! Status: ${data.status}`);
      // Handle success (e.g., redirect or show results)
    } else {
      alert("Error: " + data.detail);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to connect to the server.");
  } finally {
    setGenerating(false);
  }
}

  return (
    <div className="min-h-screen bg-slate-100 p-8">

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-8">

        <div className="flex justify-between items-center">

          <div>

            <h1 className="text-3xl font-bold">
              Seat Allocation
            </h1>

            <p className="text-gray-500 mt-2">
              Allocate students to examination halls.
            </p>

          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-10">

          <div>

            <label className="font-semibold block mb-2">
              Exam Session
            </label>

            <select
              value={selectedSession}
              onChange={(e) =>
                setSelectedSession(e.target.value)
              }
              className="w-full border rounded-lg p-3"
            >
              {sessions.map((s, i) => (
                <option
                  key={i}
                  value={`${s.exam_date}|${s.exam_time}`}
                >
                  {s.exam_date} | {s.exam_time}
                </option>
              ))}
            </select>

          </div>

        </div>
                <div className="grid lg:grid-cols-2 gap-8 mt-8">

          {/* LEFT SIDE */}

          <div>

            <h2 className="text-xl font-bold mb-4">
              Select Batches
            </h2>

            {loading ? (

              <div className="text-gray-500">
                Loading batches...
              </div>

            ) : batches.length === 0 ? (

              <div className="border rounded-xl p-6 bg-gray-50 text-center text-gray-500">
                No batches found for this session.
              </div>

            ) : (

              <div className="space-y-4">

                {batches.map((batch) => (

                  <div
                    key={batch.batch}
                    className={`border rounded-xl p-5 cursor-pointer transition
                    ${
                      selectedBatches.includes(batch.batch)
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 hover:border-blue-400"
                    }`}
                    onClick={() => toggleBatch(batch.batch)}
                  >

                    <div className="flex justify-between items-center">

                      <div>

                        <h3 className="font-bold text-lg">
                          {batch.batch}
                        </h3>

                        <p className="text-gray-600 mt-1">
                          Subject : {batch.subject}
                        </p>

                        <p className="text-gray-600">
                          Code : {batch.subject_code}
                        </p>

                        <p className="font-semibold mt-2">
                          Students : {batch.students}
                        </p>

                      </div>

                      <input
                        type="checkbox"
                        checked={selectedBatches.includes(batch.batch)}
                        readOnly
                        className="h-6 w-6"
                      />

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

          {/* RIGHT SIDE */}

          <div>

            <h2 className="text-xl font-bold mb-4">
              Select Examination Rooms
            </h2>

            <div className="space-y-4">

              {rooms.map((room) => (

                <div
                  key={room.hall_id}
                  className={`border rounded-xl p-5 cursor-pointer transition
                  ${
                    selectedRooms.includes(room.hall_id)
                      ? "border-green-600 bg-green-50"
                      : "border-gray-300 hover:border-green-400"
                  }`}
                  onClick={() => toggleRoom(room.hall_id)}
                >

                  <div className="flex justify-between items-center">

                    <div>

                      <h3 className="font-bold">
                        Room {room.room_no}
                      </h3>

                      <p className="text-gray-600 mt-1">
                        Capacity : {room.capacity}
                      </p>

                    </div>

                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(room.hall_id)}
                      readOnly
                      className="h-6 w-6"
                    />

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-10">

          <div className="bg-blue-50 rounded-xl p-6">

            <div className="text-gray-500">
              Selected Students
            </div>

            <div className="text-4xl font-bold mt-2">
              {totalStudents}
            </div>

          </div>

          <div className="bg-green-50 rounded-xl p-6">

            <div className="text-gray-500">
              Total Room Capacity
            </div>

            <div className="text-4xl font-bold mt-2">
              {totalCapacity}
            </div>

          </div>

          <div className="bg-yellow-50 rounded-xl p-6">

            <div className="text-gray-500">
              Remaining Seats
            </div>

            <div className="text-4xl font-bold mt-2">
              {totalCapacity - totalStudents}
            </div>

          </div>

        </div>
                <div className="mt-10 flex flex-col md:flex-row justify-between items-center gap-4">

          <div>

            {totalCapacity < totalStudents ? (

              <div className="text-red-600 font-semibold">
                Selected rooms do not have enough capacity.
              </div>

            ) : (

              <div className="text-green-600 font-semibold">
                Enough room capacity available.
              </div>

            )}

          </div>

          <button
            disabled={
              generating ||
              totalStudents === 0 ||
              totalCapacity < totalStudents
            }
            onClick={generateAllocation}
            className={`px-8 py-3 rounded-lg text-white font-semibold transition
              ${
                generating
                  ? "bg-gray-500"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {generating
              ? "Generating..."
              : "Generate Seating"}
          </button>

        </div>

      </div>

    </div>
  );
}