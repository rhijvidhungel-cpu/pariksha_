"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface HallData {
  hallId: string;
  hallName: string;
  seats: Array<{
    seatNumber: string;
    studentName: string;
    rollNumber: string;
    batch: string;
  }>;
}

export default function TeacherHallView() {
  const router = useRouter();
  const [hallData, setHallData] = useState<HallData | null>(null);
  const [selectedHall, setSelectedHall] = useState<string>("");
  const [halls, setHalls] = useState<string[]>(["Hall A", "Hall B", "Hall C", "Hall D"]);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "teacher") {
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

  const handlePrintAttendance = () => {
    const printWindow = window.open("", "", "height=600,width=800");
    if (printWindow && printRef.current) {
      const printContent = printRef.current.innerHTML;
      printWindow.document.write(
        "<html><head><title>Attendance Sheet</title><style>body { font-family: Arial, sans-serif; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #4F46E5; color: white; } .page-break { page-break-after: always; }</style></head><body>"
      );
      printWindow.document.write(printContent);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-[#2E1A47] mb-4">📊 Hall View</h1>
          <p className="text-sm text-[#6B7280]">Select a hall to view seating arrangement and manage attendance</p>
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

        {/* Hall View Display */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-[#6B7280]">Loading hall data...</p>
          </div>
        ) : hallData ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#111827]">{hallData.hallName}</h2>
              <button
                onClick={handlePrintAttendance}
                className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg font-medium hover:bg-[#4338CA] transition-colors"
              >
                📄 Print Attendance Sheet
              </button>
            </div>

            {/* Seating Layout */}
            <div className="mb-6 grid grid-cols-5 gap-3">
              {hallData.seats.map((seat) => (
                <div
                  key={seat.seatNumber}
                  className="p-3 border border-[#E5E7EB] rounded bg-[#F9FAFB] hover:border-[#4F46E5] hover:bg-[#F0F4FF] transition-all"
                >
                  <p className="text-xs font-bold text-[#4F46E5]">Seat {seat.seatNumber}</p>
                  <p className="text-xs text-[#111827] font-medium mt-1">{seat.studentName}</p>
                  <p className="text-[10px] text-[#6B7280]">{seat.rollNumber}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">{seat.batch}</p>
                </div>
              ))}
            </div>

            {/* Attendance Sheet (Hidden for Print) */}
            <div ref={printRef} className="hidden">
              <div className="page-break p-8">
                <h1 className="text-2xl font-bold mb-2">Attendance Sheet - {hallData.hallName}</h1>
                <p className="text-sm text-gray-600 mb-4">Date: {new Date().toLocaleDateString()}</p>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left">Seat No.</th>
                      <th className="border p-2 text-left">Student Name</th>
                      <th className="border p-2 text-left">Roll Number</th>
                      <th className="border p-2 text-left">Batch</th>
                      <th className="border p-2 text-left">Present/Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hallData.seats.map((seat) => (
                      <tr key={seat.seatNumber}>
                        <td className="border p-2">{seat.seatNumber}</td>
                        <td className="border p-2">{seat.studentName}</td>
                        <td className="border p-2">{seat.rollNumber}</td>
                        <td className="border p-2">{seat.batch}</td>
                        <td className="border p-2">_____</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
