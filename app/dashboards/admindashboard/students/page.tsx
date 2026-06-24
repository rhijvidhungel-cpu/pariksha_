"use client";

import { useEffect, useState } from "react";

interface Student {
  sn: number;
  name: string;
  roll: string;
  batch: string;
}

export default function StudentsManagement() {
  const apiBaseUrl = "http://localhost:8000";

  // State Management
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<string[]>(["CE-2024", "CS-2020", "ME-2023"]);
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  
  // Active viewing/inserting batch filter (Defaults to CE-2024)
  const [currentBatchView, setCurrentBatchView] = useState("CE-2024");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Inline Editing States
  const [editingSn, setEditingSn] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editRoll, setEditRoll] = useState("");

  const safeGetField = (record: any, key: string, index: number = 0) => {
    if (!record) return null;
    if (typeof record === 'object' && !Array.isArray(record)) return record[key];
    return record[index];
  };

  const fetchDirectory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/students`);
      if (res.ok) {
        const data = await res.json();
        
        const normalizedData = data.map((item: any) => {
          const rawRoll = safeGetField(item, 'roll', 2) || "";
          return {
            sn: safeGetField(item, 'sn', 0),
            name: safeGetField(item, 'name', 1),
            roll: rawRoll.includes('-') ? rawRoll.split('-')[0] : rawRoll,
            batch: safeGetField(item, 'batch', 3) || "N/A"
          };
        });
        
        setStudents(normalizedData);
      }
    } catch (err) {
      console.error("Connection pipeline failure:", err);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchDirectory();
    fetchBatches();
  }, []);

  const handleExcelUploadEngine = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("batch", currentBatchView.trim().toUpperCase());

    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/students/bulk`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(data.message || "Spreadsheet operations parsed successfully!");
        fetchDirectory();
        fetchBatches();
      } else {
        alert(`UPLOADER REJECTION: ${data.detail}`);
      }
    } catch (err) {
      alert("Network exception: Is your Python FastAPI execution online?");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleManualInsertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !rollNumber || !currentBatchView) return;

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/students/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: fullName.trim(), 
          roll: rollNumber.trim(), 
          batch: currentBatchView.trim().toUpperCase() 
        }),
      });

      // 1. Check if the server responded with an error (like 400, 404, or 500)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${res.status}`);
      }

      // 2. Parse the successful data response
      const data = await res.json();
      
      // 3. Success! Alert the user and clear out the input fields
      alert("Student data added successfully!");
      setFullName("");
      setRollNumber("");
      
      // Optional: If you have a function that refreshes the student list on your screen, call it here:
      // fetchStudents(); 

    } catch (err: any) {
      // 4. Handle any network errors or database rejections
      console.error("Submission error:", err);
      alert(err.message || "Network exception: Is your Python FastAPI execution online?");
    } finally {
      // 5. Turn off the loading spinner no matter what happens
      setLoading(false);
    }
  };
  
  const handlePurgeRecord = async (rollId: string, batchId: string) => {
    if (!confirm(`Are you sure you want to delete roll [${rollId}] from batch [${batchId}]?`)) return;
    
    try {
      setLoading(true);
      const res = await fetch(
        `${apiBaseUrl}/api/students/delete?roll=${encodeURIComponent(rollId)}&batch=${encodeURIComponent(batchId)}`, 
        { method: "DELETE" }
      );

      if (res.ok) {
        fetchDirectory();
      } else {
        const data = await res.json();
        alert(`Deletion Failed: ${data.detail}`);
      }
    } catch (err) {
      alert("Failed to reach server to complete record deletion.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeEntireBatch = async () => {
    if (!confirm(`⚠️ CRITICAL WARNING!!! Are you absolutely sure you want to delete EVERY student inside batch [${currentBatchView}]? This cannot be undone.`)) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/students/bulk-purge?batch=${encodeURIComponent(currentBatchView)}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Batch wiped successfully.");
        fetchDirectory();
      } else {
        alert(`Purge Error: ${data.detail}`);
      }
    } catch (err) {
      alert("Network exception attempting complete batch wipe.");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (student: Student) => {
    setEditingSn(student.sn);
    setEditName(student.name);
    setEditRoll(student.roll);
  };

  const handleSaveEdit = async (studentSn: number, currentBatch: string) => {
    if (!editName.trim() || !editRoll.trim()) return;

    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/students/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentSn,
          new_name: editName.trim(),
          new_roll: editRoll.trim(),
          batch: currentBatch
        })
      });

      if (res.ok) {
        setEditingSn(null);
        fetchDirectory();
      } else {
        const data = await res.json();
        alert(`Update Error: ${data.detail}`);
      }
    } catch (err) {
      alert("Error processing student information update.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    
    if (!cleanQuery) {
      return s.batch?.toLowerCase() === currentBatchView.toLowerCase();
    }

    if (cleanQuery.includes(" ")) {
      const parts = cleanQuery.split(/\s+/);
      const batchPart = parts[0];
      const detailPart = parts[1];

      return (
        s.batch?.toLowerCase().includes(batchPart) &&
        (s.roll?.toString().toLowerCase().includes(detailPart) || s.name?.toLowerCase().includes(detailPart))
      );
    }

    const matchesSearchTerm = 
      s.name?.toLowerCase().includes(cleanQuery) || 
      s.roll?.toString().toLowerCase().includes(cleanQuery);
      
    const matchesExplicitBatchSearch = s.batch?.toLowerCase() === cleanQuery;

    if (matchesExplicitBatchSearch) return true;

    return s.batch?.toLowerCase() === currentBatchView.toLowerCase() && matchesSearchTerm;
  });

  return (
    <div className="p-8 flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      
      {/* HEADER CONTROLS BAR WITH INTEGRATED SCOPE SELECTOR */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-extrabold tracking-tight text-gray-900 uppercase m-0">Student Directory Control System</h2>
            <div className="flex items-center gap-2 border border-indigo-100 bg-indigo-50/40 px-3 py-1 rounded-xl">
              <span className="text-[11px] font-bold text-indigo-600 uppercase font-mono">Scope Filter:</span>
              <select 
                value={currentBatchView} 
                onChange={(e) => setCurrentBatchView(e.target.value)} 
                className="bg-transparent text-xs font-black text-indigo-950 font-mono outline-none cursor-pointer"
              >
                {batches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Currently targeting batch pool <span className="font-mono font-bold text-[#4F46E5] bg-indigo-50 px-1.5 py-0.5 rounded">{currentBatchView}</span>.</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={handlePurgeEntireBatch}
            className="bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 h-11"
          >
            💥 Wipe Entire {currentBatchView} List
          </button>

          <label 
            htmlFor="excel-upload-trigger" 
            className="bg-[#00875A] hover:bg-[#006B44] text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm select-none transition-all active:scale-95 h-11"
          >
            <span>📊 Bulk Parse Students into {currentBatchView}</span>
            <input 
              id="excel-upload-trigger" 
              type="file" 
              accept=".xlsx, .csv" 
              onChange={handleExcelUploadEngine} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
       {/* MANUAL MANIPULATION PANEL */}
<div className="bg-white border border-gray-200 rounded-xl p-6 lg:col-span-4 shadow-sm">
  <h3 className="text-xs font-extrabold text-gray-400 tracking-wider uppercase mb-5">Add New Student to {currentBatchView}</h3>
  <form onSubmit={handleManualInsertSubmit} className="flex flex-col gap-5">
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-2">Full Student Name</label>
      <input 
        type="text" 
        value={fullName} 
        onChange={(e) => setFullName(e.target.value)} 
        placeholder="e.g. Ramesh Poudel" 
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 font-medium" 
        required 
      />
    </div>
    <div>
      <label className="block text-xs font-bold text-gray-500 mb-2">Roll ID Number</label>
      <input 
        type="text" 
        value={rollNumber} 
        onChange={(e) => setRollNumber(e.target.value)} 
        placeholder="e.g. 45" 
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-400 font-medium" 
        required 
      />
    </div>
    
    <button type="submit" className="w-full mt-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98]">
      + Insert Into {currentBatchView} Directory
    </button>
  </form>
</div>

        {/* LIVE DATA DIRECTORY CONTAINER */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 lg:col-span-8 shadow-sm">
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-4 flex items-center text-gray-400 text-sm">🔍</span>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder='Search within active batch, or enter cross-query (e.g. "CS-2020 20")...' 
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 bg-gray-50/30 font-medium" 
            />
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full border-collapse text-left text-sm bg-white">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-bold text-xs uppercase tracking-wider">
                  <th className="p-4 text-center w-16">S.N.</th>
                  <th className="p-4">Name Parameters</th>
                  <th className="p-4">Roll Reference</th>
                  <th className="p-4">Batch Link</th>
                  <th className="p-4 text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400">Syncing live directory tables from PostgreSQL...</td></tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.sn} className="hover:bg-gray-50/40 transition-colors">
                      <td className="p-4 text-center text-gray-400 font-normal">{student.sn}</td>
                      
                      <td className="p-4 font-bold text-gray-900">
                        {editingSn === student.sn ? (
                          <input 
                            type="text" 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)} 
                            className="border border-indigo-400 px-2 py-1 rounded-md text-sm w-full font-normal"
                          />
                        ) : (
                          student.name
                        )}
                      </td>
                      
                      <td className="p-4 text-gray-600 font-mono">
                        {editingSn === student.sn ? (
                          <input 
                            type="text" 
                            value={editRoll} 
                            onChange={(e) => setEditRoll(e.target.value)} 
                            className="border border-indigo-400 px-2 py-1 rounded-md text-sm w-24 font-mono font-normal"
                          />
                        ) : (
                          student.roll
                        )}
                      </td>
                      
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs font-bold font-mono text-indigo-600 border border-indigo-200 rounded-md bg-indigo-50/40">{student.batch}</span>
                      </td>
                      
                      <td className="p-4 text-center flex items-center justify-center gap-3">
                        {editingSn === student.sn ? (
                          <>
                            <button onClick={() => handleSaveEdit(student.sn, student.batch)} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold hover:underline">Save</button>
                            <button onClick={() => setEditingSn(null)} className="text-gray-400 hover:text-gray-600 text-xs font-bold hover:underline">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditing(student)} className="text-[#4F46E5] hover:text-indigo-900 text-xs font-bold transition-all hover:underline">Edit</button>
                            <span className="text-gray-300">|</span>
                            <button onClick={() => handlePurgeRecord(student.roll, student.batch)} className="text-[#E11D48] hover:text-red-800 text-xs font-bold transition-all hover:underline">Remove</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400">No active students found matching criteria for this selection.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}