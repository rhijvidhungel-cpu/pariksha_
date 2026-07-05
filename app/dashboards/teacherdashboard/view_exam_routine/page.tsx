"use client";

import { useEffect, useState } from "react";

interface Routine {
  Date: string;
  Time: string;
  Subject: string;
  Code: string;
}

export default function TeacherRoutinePage() {
  const API = "https://pariksha-9qjs.onrender.com";

  const [batches, setBatches] = useState<string[]>([]);
  const [batch, setBatch] = useState("");
  const [routine, setRoutine] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all batches
  useEffect(() => {
    fetch(`${API}/api/batches`)
      .then((res) => res.json())
      .then((data) => {
        setBatches(data);

        if (data.length > 0) {
          setBatch(data[0]);
        }
      });
  }, []);

  // Load routine whenever batch changes
  useEffect(() => {
    if (!batch) return;

    setLoading(true);

    fetch(`${API}/api/routines?batch=${batch}`)
      .then((res) => res.json())
      .then((data) => {
        setRoutine(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setRoutine([]);
      })
      .finally(() => setLoading(false));
  }, [batch]);

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold mb-6">
        View Exam Routine
      </h1>

      <div className="mb-6">

        <label className="font-semibold mr-4">
          Select Batch
        </label>

        <select
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          className="border p-2 rounded"
        >
          {batches.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>

      </div>

      {loading ? (
        <div>Loading...</div>
      ) : routine.length === 0 ? (
        <div>No routine available.</div>
      ) : (

        <table className="w-full border-collapse">

          <thead>

            <tr className="bg-gray-100">

              <th className="border p-3">Date</th>

              <th className="border p-3">Time</th>

              <th className="border p-3">Subject</th>

              <th className="border p-3">Subject Code</th>

            </tr>

          </thead>

          <tbody>

            {routine.map((item, index) => (

              <tr key={index}>

                <td className="border p-3">
                  {item.Date}
                </td>

                <td className="border p-3">
                  {item.Time || "-"}
                </td>

                <td className="border p-3">
                  {item.Subject}
                </td>

                <td className="border p-3">
                  {item.Code}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>
  );
}