"use client";
import { useState } from "react";

export default function AdminRoutinePage() {
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState("CE-2024");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("batch", batch);
    setLoading(true);
    const res = await fetch("https://pariksha-9qjs.onrender.com/api/routines/bulk", {
      method: "POST", body: formData,
    });
    const data = await res.json();
    alert(res.ok ? "Routine Uploaded!" : data.detail);
    setLoading(false);
  };

  return (
    <form onSubmit={handleUpload} className="p-8">
      <h2 className="text-xl font-bold mb-4">Upload Routine</h2>
      <select value={batch} onChange={(e) => setBatch(e.target.value)} className="border p-2 mb-4 block">
        <option value="CE-2024">CE-2024</option>
      </select>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block mb-4" />
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}