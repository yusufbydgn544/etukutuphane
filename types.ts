
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  studentNumber?: string; // Only for students
  department?: string; // New field
  phone?: string; // New field
  role: UserRole;
  avatarColor?: string; // Hex color code for background
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  features: string[];
  isMeetingRoom?: boolean; // New flag for rooms 21-23
}

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string; // Denormalized for easy admin view
  userStudentNumber?: string; // To check double booking easily
  roomId: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g., "09:00")
  endTime: string;   // HH:mm (e.g., "11:00")
  status: ReservationStatus;
  createdAt: string;
  groupMembers?: string[]; // Student numbers of the 4 other people
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface ReservationRequest {
  id: string;
  userId: string;
  userName: string;
  userStudentNumber?: string;
  roomId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: RequestStatus;
  createdAt: string;
  groupMembers?: string[];
}

export interface Suggestion {
  id: string;
  userId: string | null;
  userName: string;
  message: string;
  date: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  date: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface WaitingListEntry {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface AnalyticsData {
  totalReservations: number;
  mostPopularRoom: string;
  occupancyRate: number;
  dailyData: { name: string; value: number }[];
}
