"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface StudentRoster {
  id: string;
  seatNumber: string;
  rollNumber: string;
  name: string;
  department: string;
  batch: string;
}

export interface ExamRoom {
  id: string | number;
  name: string;
  rows_count: number;       // Number of rows of benches
  benches_per_row: number;  // Benches lined up horizontally per row
  seats_per_bench: number;  // Students sitting at one bench
  capacity: number;         // Total Capacity = rows * benches * seats
  allocatedStudentsCount: number;
  status: "Available" | "Full";
}

export default function ClassroomsManagement() {
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://pariksha-9qjs.onrender.com";

  // State Management
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ExamRoom | null>(null);
  const [roster, setRoster] = useState<StudentRoster[]>([]);
  
  // Loading & UX States
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ExamRoom | null>(null);

  // Form Fields
  const [roomName, setRoomName] = useState("");
  const [rowsCount, setRowsCount] = useState(5);
  const [benchesPerRow, setBenchesPerRow] = useState(3);
  const [seatsPerBench, setSeatsPerBench] = useState(2);

  // Calculate Capacity helper
  const calculatedCapacity = rowsCount * benchesPerRow * seatsPerBench;

  // Authorization Security Guard
  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    if (!name || role !== "admin") {
      router.push("/");
      return;
    }
    fetchRooms();
  }, [router]);

  
const fetchRooms = async () => {
  try {
    setLoading(true);
    setErrorMessage(null);
    const res = await fetch(`${apiBaseUrl}/rooms/`);
    
    if (res.ok) {
      const data = await res.json();
      
      // Map the backend data to the structure your UI expects
const formattedRooms: ExamRoom[] = data.map((room: any) => ({
    id: room.hall_id,
    name: room.room_no,
    rows_count: room.rows_count,
    benches_per_row: room.benches_per_row,
    seats_per_bench: room.seats_per_bench,
    capacity: room.capacity,
    allocatedStudentsCount: room.allocatedStudentsCount ?? 0,
    status: room.status ?? "Available",
}));
      setRooms(formattedRooms);
    } else {
      throw new Error("Could not fetch classrooms records.");
    }
  } catch (err: any) {
    setErrorMessage(err.message || "Failed to load classrooms records.");
  } finally {
    setLoading(false);
  }
};

  // Fetch roster & seating layout for a single room
  const handleViewRoomDetails = (room: ExamRoom) => {
  router.push(`/dashboards/admindashboard/classrooms/hall_view/${room.id}`);
};

  // Create room handler
const handleCreateRoom = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMessage(null);
  setSuccessMessage(null);

  // 1. Calculate values locally
  const calculatedCapacity = rowsCount * benchesPerRow * seatsPerBench;
  const calculatedTables = rowsCount * benchesPerRow;

  try {
    const res = await fetch(`${apiBaseUrl}/rooms/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_no: roomName,
        rows_count: rowsCount,
        benches_per_row: benchesPerRow,
        seats_per_bench: seatsPerBench,
        capacity: calculatedCapacity,
        tables: calculatedTables,
      }),
    });

    if (res.ok) {
      const result = await res.json();
      setSuccessMessage("Room structure recorded successfully!");

      // 2. Create the new room object to match your ExamRoom interface
      const newRoom: ExamRoom = {
        id: result.hall_id, // Ensure your backend returns the ID
        name: roomName,
        rows_count: rowsCount,
        benches_per_row: benchesPerRow,
        seats_per_bench: seatsPerBench,
        capacity: calculatedCapacity,
        allocatedStudentsCount: 0,
        status: 'Available'
      };

      // 3. Update state instantly so the UI refreshes
      setRooms((prevRooms) => [...prevRooms, newRoom]);
      
      // 4. Close the modal
      setShowAddModal(false); 
    } else {
      // If the server returns an error, extract the message
      const errorData = await res.json();
      throw new Error(errorData.detail || "Failed to save room structure.");
    }
  } catch (err: any) {
    setErrorMessage(err.message || "An error occurred while saving.");
  }
};

  // Open edit modal
  const openEditModal = (room: ExamRoom) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setRowsCount(room.rows_count);
    setBenchesPerRow(room.benches_per_row);
    setSeatsPerBench(room.seats_per_bench);
    setShowEditModal(true);
  };

  // Update room handler
  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Around line 161
const res = await fetch(`${apiBaseUrl}/rooms/${editingRoom.id}/`, { // Added trailing slash
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    room_no: roomName,           // Corrected key
    rows_count: rowsCount,
    benches_per_row: benchesPerRow,
    seats_per_bench: seatsPerBench,
    capacity: rowsCount * benchesPerRow * seatsPerBench,
    
  }),
});

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage("Room structure updated successfully.");
        setShowEditModal(false);
        setEditingRoom(null);
        if (selectedRoom?.id === editingRoom.id) {
          setSelectedRoom(null);
        }
        fetchRooms();
      } else {
        setErrorMessage(data.detail || "Could not modify layout structure.");
      }
    } catch (err: any) {
      setErrorMessage("Network error: failed to update classroom.");
    }
  };

  // Delete room handler
  const handleDeleteRoom = async (roomId: string | number) => {
    if (!confirm("Are you sure you want to delete this room layout? This will clear all allocations inside this room.")) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${apiBaseUrl}/rooms/${roomId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage("Room deleted successfully.");
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(null);
        }
        fetchRooms();
      } else {
        setErrorMessage(data.detail || "Failed to remove classroom.");
      }
    } catch (err) {
      setErrorMessage("Network error: failed to delete classroom.");
    }
  };

  // Auto-allocate students handler
  const handleAutoAllocate = async () => {
    if (!confirm("This will overwrite and re-distribute ALL student seat assignments randomly. Proceed?")) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setAllocating(true);

    try {
      const res = await fetch(`${apiBaseUrl}/rooms/auto-allocate`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Allocation routine complete! Assigned ${data.allocated} out of ${data.total} students.`);
        fetchRooms();
        setSelectedRoom(null);
      } else {
        setErrorMessage(data.detail || "Allocation Routine Interrupted.");
      }
    } catch (err) {
      setErrorMessage("Network error during seating allocation routine.");
    } finally {
      setAllocating(false);
    }
  };

  // Render Seating Grid Layout
  const renderVisualGrid = () => {
    if (!selectedRoom) return null;
    const { rows_count, benches_per_row, seats_per_bench } = selectedRoom;

    // Map roster to speed up lookups
    const seatMap: Record<string, StudentRoster> = {};
    roster.forEach((student) => {
      // Seat format in DB allocation routine is e.g. "R1-B2-S1"
      seatMap[student.seatNumber] = student;
    });

    const rows = [];
    for (let r = 1; r <= rows_count; r++) {
      const benches = [];
      for (let b = 1; b <= benches_per_row; b++) {
        const seats = [];
        for (let s = 1; s <= seats_per_bench; s++) {
          const seatLabel = `R${r}-B${b}-S${s}`;
          const student = seatMap[seatLabel];
          const isOccupied = !!student;

          seats.push(
            <div
              key={seatLabel}
              className={`group relative flex-1 p-2 rounded-lg text-center text-xs font-semibold transition-all border ${
                isOccupied
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 cursor-pointer"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <div className="text-[10px] opacity-70 mb-0.5">{`Seat S${s}`}</div>
              <div className="font-mono truncate">{isOccupied ? student.name.split(" ")[0] : "Empty"}</div>
              
              {/* Premium Hover Card */}
              {isOccupied && (
                <div className="absolute z-25 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[11px] p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-left pointer-events-none">
                  <div className="font-bold border-b border-gray-700 pb-1 mb-1 text-xs">{student.name}</div>
                  <div>Roll: <span className="font-mono text-indigo-300">{student.rollNumber}</span></div>
                  <div>Batch: <span className="text-gray-300">{student.batch}</span></div>
                  <div>Dept: <span className="text-gray-300">{student.department}</span></div>
                  <div className="mt-1 text-[10px] text-gray-400 font-mono text-right">{seatLabel}</div>
                </div>
              )}
            </div>
          );
        }

        benches.push(
          <div key={`R${r}-B${b}`} className="flex flex-col bg-white border border-gray-200 p-2.5 rounded-xl shadow-xs gap-1.5 w-full">
            <div className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wide">{`Bench ${b}`}</div>
            <div className="flex gap-2">{seats}</div>
          </div>
        );
      }

      rows.push(
        <div key={`Row-${r}`} className="flex flex-col md:flex-row items-center gap-4 bg-gray-50/40 p-4 border border-gray-100 rounded-2xl w-full">
          <div className="w-16 font-extrabold text-xs text-gray-400 uppercase tracking-wide border-r border-gray-200 pr-2 whitespace-nowrap text-center">
            {`Row ${r}`}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 flex-1 w-full">
            {benches}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 pb-6">
        {rows}
      </div>
    );
  };

  return (
    <div className="bg-transparent font-sans">
      
      {/* HEADER BREADCRUMB */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Smart Seat Allocation Wizard</h1>
          <p className="text-xs text-gray-500">Configure examination room desk blueprints and run automatic seating assignments.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white border border-gray-200 text-gray-800 text-xs font-bold px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
          >
            + Create New Room
          </button>
          
          <button
            onClick={handleAutoAllocate}
            disabled={allocating || rooms.length === 0}
            className="bg-indigo-600 text-white text-xs font-bold px-5 py-3 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors shadow-md shadow-indigo-100 flex items-center gap-2 cursor-pointer"
          >
            {allocating ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Allocating...
              </>
            ) : (
              "⚡ Run Auto-Allocation"
            )}
          </button>
        </div>
      </div>

      {/* ERROR & SUCCESS MESSAGES */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          ⚠️ {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          ✅ {successMessage}
        </div>
      )}

      {/* LOADING SPINNER FOR INITIAL LOAD */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider">Syncing room matrices...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: ROOMS LIST CARDS */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            <h2 className="text-xs font-extrabold text-gray-400 tracking-wider uppercase mb-1">Room Registries ({rooms.length})</h2>
            
            {rooms.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-xs font-mono">
                No examination rooms set up. Add a classroom layout to begin.
              </div>
            ) : (
              rooms.map((room) => {
                const percent = Math.min(100, Math.round((room.allocatedStudentsCount / room.capacity) * 100)) || 0;
                const isSelected = selectedRoom?.id === room.id;

                return (
                  <div
key={room.id}
onClick={() =>
  router.push(
    `/dashboards/admindashboard/classrooms/hall_view/${room.id}`
  )
}
                    className={`bg-white border p-5 rounded-2xl cursor-pointer hover:border-indigo-300 transition-all shadow-xs flex flex-col gap-3 relative overflow-hidden ${
                      isSelected ? "border-indigo-600 ring-2 ring-indigo-100" : "border-gray-200"
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase ${
                        room.status === "Full"
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : "bg-blue-50 border-blue-200 text-blue-700"
                      }`}>
                        {room.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 text-base mb-1 truncate pr-20">{room.name}</h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 font-medium">
                        <span>{`Layout: ${room.rows_count} rows × ${room.benches_per_row} benches`}</span>
                        <span className="text-gray-300">•</span>
                        <span>{`Capacity: ${room.capacity} seats (${room.seats_per_bench}/bench)`}</span>
                      </div>
                    </div>

                    {/* Occupancy Progress */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-semibold">Seat Occupancy</span>
                        <span className="font-mono font-bold text-gray-900">{`${room.allocatedStudentsCount} / ${room.capacity} (${percent}%)`}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            room.status === "Full" ? "bg-rose-500" : "bg-indigo-600"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Room Actions */}
                    <div className="flex justify-end gap-3 mt-1 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(room);
                        }}
                        className="bg-transparent border-none text-indigo-600 hover:text-indigo-900 text-[11px] font-bold uppercase cursor-pointer"
                      >
                        Edit Plan
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoom(room.id);
                        }}
                        className="bg-transparent border-none text-red-500 hover:text-red-700 text-[11px] font-bold uppercase cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

      {/* ADD ROOM MODAL DIALOG */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-2xl mx-4">
            <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wide mb-4">Create New Classroom Blueprint</h3>
            
            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Classroom Name (e.g. Room 101)</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Enter name"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Rows (Rows of Benches)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={rowsCount}
                    onChange={(e) => setRowsCount(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Benches Per Row</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={benchesPerRow}
                    onChange={(e) => setBenchesPerRow(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Seats Per Bench</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={seatsPerBench}
                    onChange={(e) => setSeatsPerBench(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Capacity Stats */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Total Seats Generated</span>
                <span className="font-mono font-bold text-indigo-600 text-sm">{calculatedCapacity} Seats</span>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  Save Blueprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROOM MODAL DIALOG */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-gray-200 shadow-2xl mx-4">
            <h3 className="text-base font-extrabold text-gray-900 uppercase tracking-wide mb-4">Edit Classroom Blueprint</h3>
            
            <form onSubmit={handleUpdateRoom} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Classroom Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Rows (Of Benches)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={rowsCount}
                    onChange={(e) => setRowsCount(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Benches Per Row</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={benchesPerRow}
                    onChange={(e) => setBenchesPerRow(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Seats Per Bench</label>
                  <input
                    type="number"
                    min="1"
                    max="4"
                    value={seatsPerBench}
                    onChange={(e) => setSeatsPerBench(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Capacity Stats */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Total Seats Generated</span>
                <span className="font-mono font-bold text-indigo-600 text-sm">{calculatedCapacity} Seats</span>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRoom(null);
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}