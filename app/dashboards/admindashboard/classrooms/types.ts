// types.ts

export interface StudentRoster {
  id: string;
  seatNumber: string;
  rollNumber: string;
  name: string;
  department: string;
  batch: string;
  room_id?: number | null;
}

export interface ExamRoom {
  // Backend database fields
  id: number;
  room_no: string;
  rows_count: number;
  benches_per_row: number;
  seats_per_bench: number;
  capacity: number;
  
  // Frontend UI display fields
  allocatedStudentsCount: number;
  status: 'Available' | 'Full';
}

export interface ExamHallCreate {
  room_no: string;
  rows_count: number;
  benches_per_row: number;
  seats_per_bench: number;
  capacity: number;
}