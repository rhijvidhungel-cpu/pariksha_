"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeacherAttendance() {
  const router = useRouter();
  const [hallData, setHallData] = useState<any>(null);
  const [selectedHall, setSelectedHall] = useState<string>("");
  const [halls, setHalls] = useState<string[]>(["Hall A", "Hall B", "Hall C", "Hall D"]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
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
        
        // Initialize attendance
        const initialAttendance: Record<string, boolean> = {};
        data.seats.forEach((seat: any) => {
          initialAttendance[seat.seatNumber] = true; // Default to present
        });
        setAttendance(initialAttendance);
      }
    } catch (err) {
      console.error("Failed to load hall data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (seatNumber: string) => {
    setAttendance((prev) => ({
      ...prev,
      [seatNumber]: !prev[seatNumber],
    }));
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "height=800,width=1000");
    if (printWindow && printRef.current) {
      const printContent = printRef.current.innerHTML;
      printWindow.document.write(
        "<html><head><title>Attendance Sheet</title><style>body { font-family: Arial, sans-serif; margin: 20px; } h1 { text-align: center; color: #2E1A47; } table { width: 100%; border-collapse: collapse; margin-top: 20px; } th, td { border: 1px solid #ddd; padding: 12px; text-align: left; } th { background-color: #4F46E5; color: white; font-weight: bold; } tr:nth-child(even) { background-color: #f9f9f9; } .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }</style></head><body>"
      );
      printWindow.document.write(printContent);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSaveAttendance = async () => {
    try {
      const apiBaseUrl = "https://pariksha-9qjs.onrender.com";
      const attendanceData = Object.entries(attendance).map(([seatNumber, isPresent]) => ({
        seatNumber,
        isPresent,
        date: new Date().toISOString().split("T")[0],
        hall: selectedHall,
      }));

      const res = await fetch(`${apiBaseUrl}/api/attendance/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceData),
      });

      if (res.ok) {
        alert("Attendance saved successfully!");
      } else {
        alert("Failed to save attendance");
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert("Error saving attendance");
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-[#2E1A47] mb-2">📋 Mark Attendance</h1>
          <p className="text-sm text-[#6B7280]">Select a hall and mark student attendance</p>
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

        {/* Attendance Grid */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-[#6B7280]">Loading hall data...</p>
          </div>
        ) : hallData ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#111827]">{hallData.hallName}</h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-[#6366F1] text-white rounded-lg font-medium hover:bg-[#4F46E5] transition-colors"
                >
                  🖨️ Print Sheet
                </button>
                <button
                  onClick={handleSaveAttendance}
                  className="px-4 py-2 bg-[#10B981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors"
                >
                  💾 Save Attendance
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#4F46E5] text-white">
                    <th className="px-4 py-3 text-left text-sm font-bold">Seat</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Student Name</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Roll No.</th>
                    <th className="px-4 py-3 text-left text-sm font-bold">Batch</th>
                    <th className="px-4 py-3 text-center text-sm font-bold">Present</th>
                  </tr>
                </thead>
                <tbody>
                  {hallData.seats.map((seat: any, idx: number) => (
                    <tr
                      key={seat.seatNumber}
                      className={`border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-[#F3F4F6]"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-bold text-[#4F46E5]">{seat.seatNumber}</td>
                      <td className="px-4 py-3 text-sm text-[#111827]">{seat.studentName}</td>
                      <td className="px-4 py-3 text-sm text-[#6B7280]">{seat.rollNumber}</td>
                      <td className="px-4 py-3 text-sm text-[#6B7280]">{seat.batch}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={attendance[seat.seatNumber] ?? true}
                          onChange={() => toggleAttendance(seat.seatNumber)}
                          className="w-5 h-5 rounded cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Hidden Print Content */}
            <div ref={printRef} className="hidden">
              <div style={{ padding: "20px" }}>
                <h1 style={{ textAlign: "center", marginBottom: "10px", fontSize: "20px", fontWeight: "bold" }}>
                  Attendance Sheet - {hallData.hallName}
                </h1>
                <p style={{ textAlign: "center", marginBottom: "20px", fontSize: "12px", color: "#666" }}>
                  Date: {new Date().toLocaleDateString()}
                </p>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", backgroundColor: "#4F46E5", color: "white" }}>Seat</th>
                      <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", backgroundColor: "#4F46E5", color: "white" }}>Student Name</th>
                      <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", backgroundColor: "#4F46E5", color: "white" }}>Roll No.</th>
                      <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", backgroundColor: "#4F46E5", color: "white" }}>Batch</th>
                      <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center", backgroundColor: "#4F46E5", color: "white" }}>Present/Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hallData.seats.map((seat: any) => (
                      <tr key={seat.seatNumber}>
                        <td style={{ border: "1px solid #ddd", padding: "10px" }}>{seat.seatNumber}</td>
                        <td style={{ border: "1px solid #ddd", padding: "10px" }}>{seat.studentName}</td>
                        <td style={{ border: "1px solid #ddd", padding: "10px" }}>{seat.rollNumber}</td>
                        <td style={{ border: "1px solid #ddd", padding: "10px" }}>{seat.batch}</td>
                        <td style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center" }}>
                          {attendance[seat.seatNumber] ? "✓" : "✗"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-[#6B7280]">Select a hall to mark attendance</p>
          </div>
        )}
      </div>
    </div>
  );
}
