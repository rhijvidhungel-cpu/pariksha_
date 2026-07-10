// types.ts

export interface StudentRoster {
  id: string;
  seatNumber: string;
  rollNumber: string;
  name: string;
  department: string;
  batch: string;
  room_id?: number | null; // Added to match the backend allocation model
}

export interface ExamRoom {
  // Database fields (what comes from the backend)
  hall_id: number;
  room_no: string;
  rows_count: number;
  benches_per_row: number;
  seats_per_bench: number;
  capacity: number;
  tables: number; // Added to match your calculation logic

  // Frontend UI fields (the fields used for mapping/display)
  id: string | number;
  name: string;
  allocatedStudentsCount: number;
  status: 'Available' | 'Full';
}

// Helper type for creating a new room
export interface ExamHallCreate {
  room_no: string;
  rows_count: number;
  benches_per_row: number;
  seats_per_bench: number;
  capacity: number;
  tables: number;
}