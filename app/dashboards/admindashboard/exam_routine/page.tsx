"use client";

import { useEffect, useRef, useState } from "react";

export default function AdminRoutinePage() {
  const API = "https://pariksha-9qjs.onrender.com";

  const [batches, setBatches] = useState<string[]>([]);
  const [batch, setBatch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#f5f7fb] py-8 px-6">

      <div className="max-w-6xl mx-auto">
                {/* Header Card */}

        <div className="bg-white rounded-2xl border border-gray-300 shadow-md px-8 py-6">

          <h1 className="text-3xl font-extrabold text-[#1f2940] uppercase">
            Upload Examination Routine
          </h1>

        </div>

        {/* Upload Card */}

        <div className="bg-white rounded-3xl border border-gray-300 shadow-md max-w-3xl mx-auto mt-10 p-10">

          {/* Batch */}

          <div>

            <label className="block text-sm font-bold text-gray-700 uppercase mb-3">
              Target Batch
            </label>

            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full border rounded-xl px-4 py-4 text-lg focus:ring-2 focus:ring-blue-500 outline-none text-black font-semibold"
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
            className="mt-8 border-2 border-dashed border-gray-300 rounded-2xl p-16 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
          >

            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center">

              <div className="text-7xl">
                📊
              </div>

              <h2 className="mt-5 text-3xl font-bold text-[#24324d]">
                Click to Upload Routine in Excel Format
              </h2>

              <p className="mt-3 text-gray-500 text-lg">
                Supports .xlsx and .xls files
              </p>

            </div>

          </div>

          {/* Selected File */}

          {file && (

            <div className="mt-8 bg-[#eef2ff] rounded-2xl p-6 flex justify-between items-center">

              <div className="flex items-center gap-5">

                <div className="text-5xl">
                  📄
                </div>

                <div>

                  <h3 className="font-bold text-xl text-[#24324d]">
                    {file.name}
                  </h3>

                  <p className="text-blue-600 mt-1">
                    Status : Ready to Upload
                  </p>

                </div>

              </div>

              <button
                onClick={removeFile}
                className="border border-red-400 text-red-600 px-5 py-3 rounded-lg hover:bg-red-50 transition"
              >
                Remove File
              </button>

            </div>

          )}

          {/* Upload Button */}

          <button
            onClick={uploadRoutine}
            disabled={loading}
            className="mt-10 w-full bg-[#5668f5] hover:bg-[#4055eb] transition text-white font-bold py-5 rounded-2xl text-lg disabled:bg-gray-400"
          >
            {loading
              ? "Uploading..."
              : "Upload and Process Excel"}
          </button>

        </div>

      </div>

    </div>

  );

}