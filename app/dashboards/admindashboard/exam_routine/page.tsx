"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadRoutinePage() {
  const router = useRouter();
  const apiBaseUrl = "https://pariksha-9qjs.onrender.com";
  
  const [file, setFile] = useState<File | null>(null);
  const [batches, setBatches] = useState<string[]>(["CE-2024", "CS-2020", "ME-2023"]);
  const [currentBatchView, setCurrentBatchView] = useState("CE-2024");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Guard
  useEffect(() => {
    const name = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!name || role !== "admin") {
      router.push("/");
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.type !== "application/pdf") {
        alert("Invalid format. Please select an official PDF file.");
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUploadEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    // Matches your exact python parameters: file and batch
    formData.append("file", file);
    formData.append("batch", currentBatchView.trim().toUpperCase());

    try {
      setLoading(true);
      
      // Hits your exact backend router address definition string
      const res = await fetch(`${apiBaseUrl}/api/routines/bulk`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(data.message || "Exam PDF routine parsed successfully!");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        alert(`UPLOADER REJECTION: ${data.detail || "Failed to process routine file."}`);
      }
    } catch (err) {
      alert("Network exception: Is your Python FastAPI execution online?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6 w-full max-w-[640px] mx-auto">
      <div className="flex flex-col gap-1.5">
        <button 
          onClick={() => router.back()} 
          className="bg-transparent border-none text-gray-500 hover:text-gray-900 text-xs font-bold flex items-center gap-1 self-start cursor-pointer transition-colors p-0 mb-2"
        >
          ← Back to Dashboard
        </button>
        <h2 className="text-xl font-extrabold tracking-tight text-gray-900 uppercase m-0">Upload Exam Routine</h2>
        <p className="text-xs text-gray-400 font-medium m-0">Upload the examination schedule in PDF format to process structural mappings.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <form onSubmit={handleUploadEngine} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Target Batch Scope Filter</label>
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
          </div>

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
              {file ? `Selected: ${file.name}` : "Click to browse or drag & drop your PDF here"}
            </p>
            {file && <p className="text-xs text-indigo-500 font-mono font-bold mt-1.5">({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            className={`w-full text-xs font-bold py-4 px-4 rounded-xl shadow-md transition-all h-12 ${
              !file || loading 
                ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none" 
                : "bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.99]"
            }`}
          >
            {loading ? "Uploading Routine..." : "Upload and Process PDF"}
          </button>
        </form>
      </div>
    </div>
  );
}