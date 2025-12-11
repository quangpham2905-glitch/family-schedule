export enum EventType {
  STUDY = 'Học tập',
  EXTRA_CURRICULAR = 'Học thêm',
  MEDICINE = 'Uống thuốc',
  ACTIVITY = 'Hoạt động',
  OTHER = 'Khác'
}

export enum CompletionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED'
}

export enum UserRole {
  PARENT = 'Phụ huynh',
  CHILD = 'Con cái'
}

export interface Member {
  id: string;
  name: string;
  age: number;
  avatarColor: string; // Tailwind class, e.g., 'bg-blue-500'
  password?: string; // Simple password for demo purposes
  role: UserRole;
  createdAt?: string;
}

export interface FamilyEvent {
  id: string;
  memberId: string;
  title: string;
  description?: string;
  type: EventType;
  startTime: string; // ISO String
  endTime: string; // ISO String
  isRecurring: boolean;
  status: CompletionStatus;
  notifiedCompletion?: boolean; // Track if completion reminder was sent
  createdAt?: string; // DB Timestamp
  updatedAt?: string; // DB Timestamp
}

export interface ChartData {
  name: string;
  completed: number;
  missed: number;
  pending: number;
}

export interface SystemNotification {
  id: string;
  message: string;
  timestamp: string; // ISO String
  isRead: boolean;
  type: 'info' | 'success' | 'warning';
  relatedMemberId?: string; // Link to the member who triggered the action
}