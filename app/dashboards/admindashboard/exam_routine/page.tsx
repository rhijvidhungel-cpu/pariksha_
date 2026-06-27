"use client";
import { useState } from "react";

export default function AdminRoutinePage() {
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState("CE-2024");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select a file");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("batch", batch);

    setLoading(true);
    try {
      const res = await fetch("https://pariksha-9qjs.onrender.com/api/routines/bulk", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      alert(res.ok ? "Routine Uploaded!" : data.detail);
    } catch (err) {
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="p-8">
      <h2 className="text-xl font-bold mb-4">Upload Routine (Excel)</h2>
      <select value={batch} onChange={(e) => setBatch(e.target.value)} className="border p-2 mb-4 block">
        <option value="CE-2024">CE-2024</option>
        <option value="CS-2020">CS-2020</option>
      </select>
      <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-4 block" />
      <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 rounded">
        {loading ? "Processing..." : "Upload"}
      </button>
    </form>
  );
}