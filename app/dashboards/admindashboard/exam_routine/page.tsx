"use client";

import { useEffect, useRef, useState } from "react";

export default function AdminRoutinePage() {
  const API = "https://pariksha-9qjs.onrender.com";

  const [batches, setBatches] = useState<string[]>([]);
  const [batch, setBatch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteBatch, setDeleteBatch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [routineCount, setRoutineCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadRoutine = async () => {
    if (!file) {
      alert("Please select an Excel file.");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("batch", batch);

    setLoading(true);

    try {
      const res = await fetch(
        `${API}/api/routines/bulk`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Routine uploaded successfully.");

        removeFile();
      } else {
        alert(data.detail);
      }
    } catch {
      alert("Network Error");
    }

    setLoading(false);
  };

  // Fetch routine count for the batch selected in delete section
  useEffect(() => {
    if (!deleteBatch) {
      setRoutineCount(null);
      return;
    }

    fetch(`${API}/api/routines?batch=${encodeURIComponent(deleteBatch)}`)
      .then((res) => res.json())
      .then((data) => {
        setRoutineCount(Array.isArray(data) ? data.length : 0);
      })
      .catch(() => setRoutineCount(0));
  }, [deleteBatch]);

  const deleteRoutine = async () => {
    if (!deleteBatch) {
      alert("Please select a batch.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the entire exam routine for "${deleteBatch}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const res = await fetch(
        `${API}/api/routines/batch/${encodeURIComponent(deleteBatch)}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        setRoutineCount(0);
      } else {
        alert(data.detail || "Failed to delete routine.");
      }
    } catch {
      alert("Network Error");
    }

    setDeleting(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] py-6 md:py-8 px-4 md:px-6">

      <div className="max-w-6xl mx-auto">
                {/* Header Card */}

        <div className="bg-white rounded-2xl border border-gray-300 shadow-md px-6 md:px-8 py-6">

          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1f2940] uppercase">
            Upload Examination Routine
          </h1>

        </div>

        {/* Template Download Section */}

        <div className="bg-white rounded-3xl border border-blue-200 shadow-md max-w-3xl mx-auto mt-8 md:mt-10 p-6 md:p-10">

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">

            <div className="text-5xl md:text-6xl">
              📋
            </div>

            <div className="flex-1">

              <h2 className="text-xl md:text-2xl font-extrabold text-[#1f2940]">
                Need the correct format?
              </h2>

              <p className="mt-2 text-gray-600 text-sm md:text-base">
                Download the template with the exact column names required. Fill in your data and upload it back.
              </p>

            </div>

            <a
              href={`${API}/api/routines/template`}
              download
              className="inline-flex items-center gap-2 bg-[#5668f5] hover:bg-[#4055eb] transition text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl text-sm md:text-base shrink-0"
            >
              <span>📥</span>
              <span>Download Template</span>
            </a>

          </div>

        </div>

        {/* Upload Card */}

        <div className="bg-white rounded-3xl border border-gray-300 shadow-md max-w-3xl mx-auto mt-8 md:mt-10 p-6 md:p-10">

          {/* Batch */}

          <div>

            <label className="block text-sm font-bold text-gray-700 uppercase mb-3">
              Target Batch
            </label>

            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 md:py-4 text-base md:text-lg focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold"
            >
              {batches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

          </div>

          {/* Upload Box */}

          <div
            onClick={() => fileInputRef.current?.click()}
            className="mt-8 border-2 border-dashed border-gray-300 rounded-2xl p-8 md:p-16 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
          >

            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center">

              <div className="text-5xl md:text-7xl">
                📊
              </div>

              <h2 className="mt-4 md:mt-5 text-xl md:text-3xl font-bold text-[#24324d] text-center">
                Click to Upload Routine
              </h2>

              <p className="mt-3 text-gray-500 text-sm md:text-lg">
                Supports .xlsx and .xls files
              </p>

            </div>

          </div>

          {/* Selected File */}

          {file && (

            <div className="mt-8 bg-[#eef2ff] rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

              <div className="flex items-center gap-4 md:gap-5">

                <div className="text-4xl md:text-5xl">
                  📄
                </div>

                <div className="min-w-0">

                  <h3 className="font-bold text-base md:text-xl text-[#24324d] break-all">
                    {file.name}
                  </h3>

                  <p className="text-blue-600 mt-1 text-sm">
                    Status : Ready to Upload
                  </p>

                </div>

              </div>

              <button
                onClick={removeFile}
                className="border border-red-400 text-red-600 px-4 md:px-5 py-2.5 md:py-3 rounded-lg hover:bg-red-50 transition text-sm shrink-0"
              >
                Remove File
              </button>

            </div>

          )}

          {/* Upload Button */}

          <button
            onClick={uploadRoutine}
            disabled={loading}
            className="mt-8 md:mt-10 w-full bg-[#5668f5] hover:bg-[#4055eb] transition text-white font-bold py-4 md:py-5 rounded-2xl text-base md:text-lg disabled:bg-gray-400"
          >
            {loading
              ? "Uploading..."
              : "Upload and Process Excel"}
          </button>

        </div>

        {/* Delete Routine Card */}

        <div className="bg-white rounded-3xl border border-red-200 shadow-md max-w-3xl mx-auto mt-8 md:mt-10 p-6 md:p-10">

          <h2 className="text-xl md:text-2xl font-extrabold text-red-700 uppercase mb-6">
            Delete Examination Routine
          </h2>

          {/* Delete Batch Select */}

          <div>

            <label className="block text-sm font-bold text-gray-700 uppercase mb-3">
              Select Batch to Delete
            </label>

            <select
              value={deleteBatch}
              onChange={(e) => {
                setDeleteBatch(e.target.value);
              }}
              className="w-full border rounded-xl px-4 py-3 md:py-4 text-base md:text-lg focus:ring-2 focus:ring-red-500 outline-none text-black font-semibold"
            >
              <option value="">-- Select a Batch --</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

          </div>

          {/* Info & Delete Button */}

          {deleteBatch && (
            <div className="mt-6 bg-red-50 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

              <div>

                <p className="text-sm md:text-base text-gray-700">
                  <span className="font-semibold">Batch:</span> {deleteBatch}
                </p>

                <p className="text-sm md:text-base text-gray-700 mt-1">
                  <span className="font-semibold">Routine Entries:</span>{" "}
                  {routineCount === null ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : (
                    <span className={routineCount > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                      {routineCount}
                    </span>
                  )}
                </p>

              </div>

              <button
                onClick={deleteRoutine}
                disabled={deleting || routineCount === 0 || routineCount === null}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl text-sm md:text-base shrink-0"
              >
                {deleting
                  ? "Deleting..."
                  : routineCount === 0 && routineCount !== null
                  ? "No Entries"
                  : "Delete Routine"}
              </button>

            </div>
          )}

        </div>

      </div>

    </div>

  );

}