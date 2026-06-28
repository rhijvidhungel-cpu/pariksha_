// types.ts

export interface ExamRoom {
  id: string;
  name: string;
  capacity: number;
  allocatedStudentsCount: number;
  status: 'Available' | 'Full';
}

export interface StudentRoster {
  id: string;
  seatNumber: string;
  rollNumber: string;
  name: string;
  department: string;
  batch: string;
}

export interface SummaryCards {
  totalRooms: number;
  totalStudentsAllocated: number;
  totalSeats: number;
  availableSeats: number;
}