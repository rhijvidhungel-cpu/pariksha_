"use client";
import { useEffect, useState } from "react";

export default function TeacherRoutinePage() {
  const [data, setData] = useState<any[]>([]);
  const [batch, setBatch] = useState("CE-2024");

  useEffect(() => {
    fetch(`https://pariksha-9qjs.onrender.com/api/routines?batch=${batch}`)
      .then((res) => res.json())
      .then((res) => {
        if (Array.isArray(res)) setData(res);
      })
      .catch(() => setData([]));
  }, [batch]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Exam Schedule</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Date</th><th className="p-2">Subject</th><th className="p-2">Code</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map((r, i) => (
            <tr key={i} className="text-center border-t">
              <td className="p-2">{r.Date}</td>
              <td className="p-2">{r.Subject}</td>
              <td className="p-2">{r.Code}</td>
            </tr>
          )) : (
            <tr><td colSpan={3} className="p-4 text-center">No data found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}