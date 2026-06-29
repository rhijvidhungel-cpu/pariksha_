export interface StudentRoster {
  id: string;
  seatNumber: string;
  rollNumber: string;
  name: string;
  department: string;
  batch: string;
}

export interface ExamRoom {
  id: string | number;
  name: string;
  rows_count: number;       // Number of rows of benches
  benches_per_row: number;  // Benches lined up horizontally per row
  seats_per_bench: number;  // Students sitting at one bench
  capacity: number;         // Total Capacity = rows * benches * seats
  allocatedStudentsCount: number;
  status: 'Available' | 'Full';
}