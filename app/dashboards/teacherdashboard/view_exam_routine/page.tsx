"use client";

import { useEffect, useState } from "react";

interface Routine {
  Date: string;
  Time: string;
  Subject: string;
  Code: string;
}

export default function ViewExamRoutine() {
  const API = "https://pariksha-9qjs.onrender.com";

  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [routine, setRoutine] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/batches`)
      .then((res) => res.json())
      .then((data) => {
        setBatches(data);
        if (data.length > 0) {
          setSelectedBatch(data[0]);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;
    loadRoutine(selectedBatch);
  }, [selectedBatch]);

  const loadRoutine = async (batch: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/routines?batch=${encodeURIComponent(batch)}`
      );
      const data = await res.json();
      setRoutine(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setRoutine([]);
    } finally {
      setLoading(false);
    }
  };

  const printRoutine = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
              View Exam Routine
            </h1>
            <p className="text-slate-500 mt-1">
              View uploaded examination schedules.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block font-semibold mb-2">Select Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full border rounded-lg p-3"
              >
                {batches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="text-lg font-semibold">Loading routine...</div>
            </div>
          ) : routine.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">No Routine Found</h2>
              <p>No exam routine has been uploaded for this batch.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="bg-blue-700 text-white">
                    <th className="border p-3">Date</th>
                    <th className="border p-3">Time</th>
                    <th className="border p-3">Subject</th>
                    <th className="border p-3">Subject Code</th>
                  </tr>
                </thead>
                <tbody>
                  {routine.map((item, index) => (
                    <tr key={index} className="hover:bg-blue-50 transition">
                      <td className="border p-3">{item.Date}</td>
                      <td className="border p-3 text-center">{item.Time || "-"}</td>
                      <td className="border p-3">{item.Subject}</td>
                      <td className="border p-3 text-center font-medium">{item.Code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-10 flex justify-between items-center print:hidden">
            <div className="text-gray-500 text-sm">
              Showing routine for <span className="font-semibold">{selectedBatch}</span>
            </div>
            <button
              onClick={printRoutine}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition"
            >
              Print Routine
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white;
            color: black !important;
          }
          * {
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid black !important;
            padding: 8px;
          }
          thead tr {
            background-color: transparent !important;
            color: black !important;
          }
          .shadow-xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}