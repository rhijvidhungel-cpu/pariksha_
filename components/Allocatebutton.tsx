'use client';

// 1. Define the shape of your Student object
interface Student {
  id: number;
  subject: string;
}

// 2. Define the shape of the Props for this component
interface AllocateButtonProps {
  students: Student[];
  classroomId: number | string;
}

// 3. Apply the interface to the component
export default function AllocateButton({ students, classroomId }: AllocateButtonProps) {
  
  const handleAllocate = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId, students })
      });
      
      if (!res.ok) throw new Error("Allocation failed");
      
      const data = await res.json();
      console.log("Seating Plan:", data.allocations);
      alert("Allocation successful!");
    } catch (error) {
      console.error(error);
      alert("Allocation failed: Check console for details.");
    }
  };

  return (
    <button 
      onClick={handleAllocate} 
      className="bg-blue-600 text-white px-4 py-2 rounded shadow-md hover:bg-blue-700 transition"
    >
      Generate Seating Plan
    </button>
  );
}