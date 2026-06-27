"use client";
import { useEffect, useState } from "react";

export default function ExamRoutineView() {
  const [routineData, setRoutineData] = useState<any[]>([]);
  const [batch, setBatch] = useState("CE-2024");

  useEffect(() => {
    fetch(`https://pariksha-9qjs.onrender.com/api/routines?batch=${batch}`)
      .then((res) => res.json())
      .then((data) => setRoutineData(data));
  }, [batch]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Exam Schedule</h1>
      <select onChange={(e) => setBatch(e.target.value)} className="mb-6 p-2 border rounded">
        <option value="CE-2024">CE-2024</option>
        <option value="CS-2020">CS-2020</option>
      </select>
      
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Subject</th>
            <th className="border p-2">Code</th>
          </tr>
        </thead>
        <tbody>
          {routineData.length > 0 ? routineData.map((row, i) => (
            <tr key={i} className="text-center">
              <td className="border p-2">{row.Date}</td>
              <td className="border p-2">{row.Subject}</td>
              <td className="border p-2">{row.Code}</td>
            </tr>
          )) : (
            <tr><td colSpan={3} className="p-4 text-gray-500">No data found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}