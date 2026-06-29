"use client";
import { useEffect, useState } from "react";

export default function TeacherRoutinePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Added loading state
  const batch = "CE-2024";

  useEffect(() => {
    setLoading(true);
    fetch(`https://pariksha-9qjs.onrender.com/api/routines?batch=${batch}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((res) => {
        setData(Array.isArray(res) ? res : []);
      })
      .catch((err) => {
        console.error("Error fetching:", err);
        setData([]);
      })
      .finally(() => setLoading(false)); // Stop loading regardless of result
  }, [batch]); // Added batch as dependency

  if (loading) return <div className="p-8">Loading routine...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Exam Schedule</h1>
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Date</th>
            <th className="border p-2">Subject</th>
            <th className="border p-2">Code</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((r, i) => (
              <tr key={i} className="text-center border-t">
                <td className="border p-2">{r.Date}</td>
                <td className="border p-2">{r.Subject}</td>
                <td className="border p-2">{r.Code}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="p-4 text-center">No data found for {batch}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}