'use client';
import { useState } from 'react';
import { LayoutGrid, ClipboardList, CheckCircle } from 'lucide-react';

export default function AllocationPage() {
  const [step, setStep] = useState(1);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  const steps = [
    { id: 1, name: 'Select Batches', icon: ClipboardList },
    { id: 2, name: 'Assign Rooms', icon: LayoutGrid },
    { id: 3, name: 'Final Execution', icon: CheckCircle },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">RANDOMIZED SEAT ALLOCATION ENGINE</h1>
        <p className="text-gray-500 mb-8">Algorithmic placement controller system logic module.</p>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          {steps.map((s) => (
            <div key={s.id} className={`flex items-center gap-3 ${step === s.id ? 'text-blue-600' : 'text-gray-400'}`}>
              <s.icon size={24} />
              <span className="font-semibold">{s.id}. {s.name}</span>
            </div>
          ))}
        </div>

        {/* Dynamic Step Content */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
          {step === 1 && (
            <div className="animate-in fade-in duration-500">
              <h3 className="font-bold mb-6 text-gray-700">CHOOSE APPEARING BATCH FRAMEWORKS TO ALLOCATE:</h3>
              {['CE-2024', 'CS-2020', 'ME-2023'].map((batch) => (
                <label key={batch} className="flex items-center p-4 border rounded-lg mb-3 cursor-pointer hover:border-blue-500 transition">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 mr-4"
                    onChange={(e) => {
                      setSelectedBatches(e.target.checked 
                        ? [...selectedBatches, batch] 
                        : selectedBatches.filter(b => b !== batch))
                    }}
                  />
                  <span className="font-medium text-gray-700">Batch Structure Class Node Matrix ({batch})</span>
                </label>
              ))}
              <button 
                onClick={() => setStep(2)}
                disabled={selectedBatches.length === 0}
                className="mt-6 w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-lg font-bold transition"
              >
                Proceed to Target Locations →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <h2 className="text-xl font-bold mb-4">Assign Classrooms</h2>
              <p>Integration: Fetch your classroom database here to let the admin select where to place the {selectedBatches.length} batches.</p>
              <button onClick={() => setStep(3)} className="mt-6 bg-blue-600 text-white px-8 py-2 rounded">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}