"use client";

import { useEffect, useMemo, useState } from "react";

const API = "https://pariksha-9qjs.onrender.com";

interface Session {
  exam_date: string;
  exam_time: string;
}

interface Batch {
  batch: string;
  subject_name: string;
  subject_code: string;
  students: number;
  already_allocated?: boolean;
}

interface Room {
  hall_id: number;
  room_no: string;
  capacity: number;
  allocated?: number;
  remaining?: number;
  is_full?: boolean;
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
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    loadSessionDetails();
  }, [selectedSession]);

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

  async function loadSessionDetails() {
    const [date, time] = selectedSession.split("|");

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/seat-allocation/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exam_date: date,
          exam_time: time,
          batches: [],
          rooms: [],
        }),
      });

      const data = await res.json();

      setBatches(data.batches || []);
      setRooms(data.rooms || []);
      setSelectedBatches([]);
      setSelectedRooms([]);
    } catch (err) {
      console.error(err);
      setBatches([]);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleBatch(batch: Batch) {
    if (batch.already_allocated) return;

    if (selectedBatches.includes(batch.batch)) {
      setSelectedBatches(selectedBatches.filter((b) => b !== batch.batch));
    } else {
      setSelectedBatches([...selectedBatches, batch.batch]);
    }
  }

  function toggleRoom(room: Room) {
    const remaining = room.remaining ?? room.capacity;

    if (room.is_full || remaining <= 0) return;

    if (selectedRooms.includes(room.hall_id)) {
      setSelectedRooms(selectedRooms.filter((r) => r !== room.hall_id));
    } else {
      setSelectedRooms([...selectedRooms, room.hall_id]);
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
      .reduce((sum, r) => sum + (r.remaining ?? r.capacity), 0);
  }, [selectedRooms, rooms]);

  async function generateAllocation() {
    if (selectedBatches.length === 0 || selectedRooms.length === 0) {
      alert("Select at least one batch and one room.");
      return;
    }

    const blockedBatch = batches.find(
      (batch) => selectedBatches.includes(batch.batch) && batch.already_allocated
    );

    if (blockedBatch) {
      alert(`${blockedBatch.batch} is already allocated for this exam session.`);
      return;
    }

    const blockedRoom = rooms.find((room) => {
      const remaining = room.remaining ?? room.capacity;
      return selectedRooms.includes(room.hall_id) && (room.is_full || remaining <= 0);
    });

    if (blockedRoom) {
      alert(`Room ${blockedRoom.room_no} is already full for this exam session.`);
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
        await loadSessionDetails();
      } else {
        const detail = data.detail;

        if (typeof detail === "object" && detail !== null) {
          alert(
            `${detail.message}\n\nRemaining students: ${detail.remaining ?? "N/A"}`
          );
        } else {
          alert("Error: " + detail);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to connect to the server.");
    } finally {
      setGenerating(false);
    }
  }

  async function removeSessionAllocations() {
    if (!selectedSession) return;

    if (!confirm("Remove every allocation for this exam session?")) {
      return;
    }

    const [date, time] = selectedSession.split("|");

    try {
      const res = await fetch(
        `${API}/api/seat-allocation/session?exam_date=${encodeURIComponent(date)}&exam_time=${encodeURIComponent(time)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to clear session allocation.");
      }

      await loadSessionDetails();
    } catch (err: any) {
      alert(err.message || "Failed to clear session allocation.");
    }
  }

  async function removeBatchAllocation(batch: string) {
    if (!selectedSession) return;

    if (!confirm(`Remove allocation for batch ${batch} in this exam session?`)) {
      return;
    }

    const [date, time] = selectedSession.split("|");

    try {
      const res = await fetch(
        `${API}/api/seat-allocation/batch?exam_date=${encodeURIComponent(date)}&exam_time=${encodeURIComponent(time)}&batch=${encodeURIComponent(batch)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to remove batch allocation.");
      }

      await loadSessionDetails();
    } catch (err: any) {
      alert(err.message || "Failed to remove batch allocation.");
    }
  }

  async function removeRoomAllocation(room: Room) {
    if (!selectedSession) return;

    if (!confirm(`Remove every allocation from Room ${room.room_no} in this exam session?`)) {
      return;
    }

    const [date, time] = selectedSession.split("|");

    try {
      const res = await fetch(
        `${API}/api/seat-allocation/room?exam_date=${encodeURIComponent(date)}&exam_time=${encodeURIComponent(time)}&hall_id=${room.hall_id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to clear room allocation.");
      }

      await loadSessionDetails();
    } catch (err: any) {
      alert(err.message || "Failed to clear room allocation.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8 text-black">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Seat Allocation</h1>
            <p className="text-gray-500 mt-2">Allocate students to examination halls.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div>
            <label className="font-semibold block mb-2">Exam Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full border rounded-lg p-3"
            >
              {sessions.map((s, i) => (
                <option key={i} value={`${s.exam_date}|${s.exam_time}`}>
                  {s.exam_date} | {s.exam_time}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-start md:justify-end">
            <button
              onClick={removeSessionAllocations}
              disabled={!selectedSession}
              className="px-5 py-3 rounded-lg border border-red-200 text-red-700 font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Session Allocations
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <div>
            <h2 className="text-xl font-bold mb-4">Select Batches</h2>

            {loading ? (
              <div className="text-gray-500">Loading batches...</div>
            ) : batches.length === 0 ? (
              <div className="border rounded-xl p-6 bg-gray-50 text-center text-gray-500">
                No batches found for this session.
              </div>
            ) : (
              <div className="space-y-4">
                {batches.map((batch) => {
                  const disabled = !!batch.already_allocated;

                  return (
                    <div
                      key={batch.batch}
                      className={`border rounded-xl p-5 transition ${
                        disabled
                          ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                          : selectedBatches.includes(batch.batch)
                            ? "border-blue-600 bg-blue-50 cursor-pointer"
                            : "border-gray-300 hover:border-blue-400 cursor-pointer"
                      }`}
                      onClick={() => toggleBatch(batch)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-lg">{batch.batch}</h3>
                          <p className="text-gray-600 mt-1">Subject : {batch.subject_name}</p>
                          <p className="text-gray-600">Code : {batch.subject_code}</p>
                          <p className="font-semibold mt-2">Students : {batch.students}</p>

                          {disabled && (
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <p className="text-red-600 font-semibold">
                                Already allocated for this session
                              </p>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeBatchAllocation(batch.batch);
                                }}
                                className="text-sm font-semibold text-red-700 underline"
                              >
                                Remove batch allocation
                              </button>
                            </div>
                          )}
                        </div>

                        <input
                          type="checkbox"
                          checked={selectedBatches.includes(batch.batch)}
                          disabled={disabled}
                          readOnly
                          className="h-6 w-6"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Select Examination Rooms</h2>

            {loading ? (
              <div className="text-gray-500">Loading rooms...</div>
            ) : rooms.length === 0 ? (
              <div className="border rounded-xl p-6 bg-gray-50 text-center text-gray-500">
                No examination rooms found.
              </div>
            ) : (
              <div className="space-y-4">
                {rooms.map((room) => {
                  const allocated = room.allocated ?? 0;
                  const remaining = room.remaining ?? room.capacity;
                  const disabled = !!room.is_full || remaining <= 0;

                  return (
                    <div
                      key={room.hall_id}
                      className={`border rounded-xl p-5 transition ${
                        disabled
                          ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                          : selectedRooms.includes(room.hall_id)
                            ? "border-green-600 bg-green-50 cursor-pointer"
                            : "border-gray-300 hover:border-green-400 cursor-pointer"
                      }`}
                      onClick={() => toggleRoom(room)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold">Room {room.room_no}</h3>
                          <p className="text-gray-600 mt-1">Capacity : {room.capacity}</p>
                          <p className="text-gray-600">Allocated : {allocated}</p>
                          <p className={`font-semibold ${disabled ? "text-red-600" : "text-green-700"}`}>
                            Remaining : {remaining}
                          </p>

                          {allocated > 0 && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                removeRoomAllocation(room);
                              }}
                              className="mt-2 text-sm font-semibold text-red-700 underline"
                            >
                              Clear room allocation
                            </button>
                          )}
                        </div>

                        <input
                          type="checkbox"
                          checked={selectedRooms.includes(room.hall_id)}
                          disabled={disabled}
                          readOnly
                          className="h-6 w-6"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <div className="bg-blue-50 rounded-xl p-6">
            <div className="text-gray-500">Selected Students</div>
            <div className="text-4xl font-bold mt-2">{totalStudents}</div>
          </div>

          <div className="bg-green-50 rounded-xl p-6">
            <div className="text-gray-500">Available Room Capacity</div>
            <div className="text-4xl font-bold mt-2">{totalCapacity}</div>
          </div>

          <div className="bg-yellow-50 rounded-xl p-6">
            <div className="text-gray-500">Remaining Seats</div>
            <div className="text-4xl font-bold mt-2">{totalCapacity - totalStudents}</div>
          </div>
        </div>

        <div className="mt-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            {totalCapacity < totalStudents ? (
              <div className="text-red-600 font-semibold">
                Selected rooms do not have enough available capacity.
              </div>
            ) : (
              <div className="text-green-600 font-semibold">
                Enough room capacity available.
              </div>
            )}
          </div>

          <button
            disabled={generating || totalStudents === 0 || totalCapacity < totalStudents}
            onClick={generateAllocation}
            className={`px-8 py-3 rounded-lg text-white font-semibold transition ${
              generating ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {generating ? "Generating..." : "Generate Seating"}
          </button>
        </div>
      </div>
    </div>
  );
}
