"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentHallView() {
  const router = useRouter();
  const [hallData, setHallData] = useState<any>(null);
  const [selectedHall, setSelectedHall] = useState<string>("");
  const [halls, setHalls] = useState<string[]>(["Hall A", "Hall B", "Hall C", "Hall D"]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "student") {
      router.push("/");
    }
  }, [router]);

  const loadHallData = async (hall: string) => {
    setLoading(true);
    try {
      const apiBaseUrl = "https://pariksha-9qjs.onrender.com";
      const res = await fetch(`${apiBaseUrl}/api/hall-view?hall=${hall}`);

      if (res.ok) {
        const data = await res.json();
        setHallData(data);
      }
    } catch (err) {
      console.error("Failed to load hall data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-[#2E1A47] mb-4">🎭 Hall View & Seating</h1>
          <p className="text-sm text-[#6B7280]">Check your assigned seat and hall information</p>
        </div>

        {/* Hall Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-bold text-[#374151] mb-3">Select Hall</label>
          <div className="flex gap-3 flex-wrap">
            {halls.map((hall) => (
              <button
                key={hall}
                onClick={() => {
                  setSelectedHall(hall);
                  loadHallData(hall);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedHall === hall
                    ? "bg-[#4F46E5] text-white shadow-md"
                    : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                }`}
              >
                {hall}
              </button>
            ))}
          </div>
        </div>

        {/* Hall View Display - Full Screen */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-[#6B7280]">Loading hall data...</p>
          </div>
        ) : hallData ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-[#111827] mb-6">{hallData.hallName}</h2>

            {/* Seating Layout Grid */}
            <div className="grid grid-cols-6 gap-2 mb-8">
              {hallData.seats.map((seat: any) => {
                const isYourSeat = seat.studentName === localStorage.getItem("username");
                return (
                  <div
                    key={seat.seatNumber}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      isYourSeat
                        ? "border-[#4F46E5] bg-[#EEF2FF] shadow-md"
                        : "border-[#E5E7EB] bg-[#F9FAFB] hover:border-[#4F46E5]"
                    }`}
                  >
                    <p className="text-xs font-bold text-[#4F46E5]">Seat {seat.seatNumber}</p>
                    <p className="text-xs text-[#111827] font-medium mt-1 truncate">{seat.studentName || "Empty"}</p>
                    {isYourSeat && (
                      <div className="mt-2 px-2 py-1 bg-[#4F46E5] text-white text-[10px] rounded">
                        Your Seat ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hall Information Card */}
            <div className="bg-[#F0F4FF] border border-[#4F46E5] rounded-lg p-4">
              <h3 className="font-bold text-[#4F46E5] mb-3">Hall Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#6B7280]">Hall Name</p>
                  <p className="font-bold text-[#111827]">{hallData.hallName}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Total Seats</p>
                  <p className="font-bold text-[#111827]">{hallData.seats.length}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-[#6B7280]">Select a hall to view seating arrangement</p>
          </div>
        )}
      </div>
    </div>
  );
}
