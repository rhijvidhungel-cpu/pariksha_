"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadRoutinePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [batches, setBatches] = useState<string[]>(["CE-2024", "CS-2020", "ME-2023"]);
  const [currentBatchView, setCurrentBatchView] = useState("CE-2024");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiBaseUrl = "https://pariksha-9qjs.onrender.com";

  // Auth Guard
  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "admin") {
      router.push("/");
    } else {
      fetchBatches();
    }
  }, [router]);

  // Sync available batches from server pipeline
  const fetchBatches = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/batches`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setBatches(data);
        }
      }
    } catch (err) {
      console.error("Failed to sync batches from server:", err);
    }
  };

  // Handle file selection parameters
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.type !== "application/pdf") {
        setMessage({ type: "error", text: "Invalid format. Please select an official PDF file." });
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setMessage(null);
    }
  };

  // Handle Multipart Form Submission
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: "error", text: "Please assign a source file context before launching process." });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file); // Changed field identifier to "file" matching bulk endpoint structural designs
    formData.append("batch", currentBatchView.trim().toUpperCase());

    try {
      const response = await fetch(`${apiBaseUrl}/api/routines/bulk`, {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok) {
        setMessage({ type: "success", text: "Exam PDF routine parsed and structurally mapped successfully!" });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        throw new Error(responseData.detail || responseData.message || "Uploader rejected file configuration data.");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "An infrastructure execution anomaly transpired." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6 w-full max-w-[640px] mx-auto">
      
      {/* HEADER NAVIGATION SECTION */}
      <div className="flex flex-col gap-1.5">
        <button 
          onClick={() => router.back()} 
          className="bg-transparent border-none text-gray-500 hover:text-gray-900 text-xs font-bold flex items-center gap-1 self-start cursor-pointer transition-colors p-0 mb-2"
        >
          ← Back to Dashboard
        </button>
        <h2 className="text-xl font-extrabold tracking-tight text-gray-900 uppercase m-0">Upload Exam Routine</h2>
        <p className="text-xs text-gray-400 font-medium m-0">Upload the examination schedule in PDF format to process structural tabular views.</p>
      </div>

      {/* CORE CONTROL CONTAINER CARD */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <form onSubmit={handleUpload} className="flex flex-col gap-5">
          
          {/* INTERACTION MATRIX SCOPE SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Target Batch Scope Link</label>
            <div className="relative w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus-within:border-indigo-500">
              <select 
                value={currentBatchView} 
                onChange={(e) => setCurrentBatchView(e.target.value)} 
                className="w-full bg-transparent text-sm font-bold text-gray-900 font-mono outline-none cursor-pointer appearance-none"
              >
                {batches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Extracted rows from PDF will be cataloged automatically inside pool <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1 rounded">{currentBatchView}</span>.</p>
          </div>

          {/* DRAG AND DROP ZONE */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              file ? 'border-indigo-400 bg-indigo-50/10' : 'border-gray-200 bg-gray-50/40 hover:bg-gray-50/80'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="text-4xl block mb-3 select-none">📄</span>
            <p className="text-sm font-bold text-gray-800 m-0">
              {file ? `Targeted: ${file.name}` : "Click to select or drag & drop routine PDF here"}
            </p>
            {file ? (
              <p className="text-xs text-indigo-500 font-mono font-bold mt-1.5">({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
            ) : (
              <p className="text-xs text-gray-400 font-medium mt-1">Accepts native layout programmatic PDF files</p>
            )}
          </div>

          {/* SYSTEM MESSAGES DISPATCH BANNER */}
          {message && (
            <div className={`border rounded-xl px-4 py-3 text-xs font-bold ${
              message.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              {message.type === "success" ? "✨ Success: " : "⚠️ Error: "} {message.text}
            </div>
          )}

          {/* ACTION SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={!file || isUploading}
            className={`w-full text-xs font-bold py-4 px-4 rounded-xl shadow-md transition-all h-12 ${
              !file || isUploading 
                ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none" 
                : "bg-[#4F46E5] hover:bg-[#4338CA] text-white active:scale-[0.99]"
            }`}
          >
            {isUploading ? "Processing & Extracting Table..." : `⚡ Parse PDF Into ${currentBatchView} Routine`}
          </button>
        </form>
      </div>
    </div>
  );
}