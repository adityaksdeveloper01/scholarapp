export type Role = 'teacher' | 'student';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  role: Role;
  password?: string;
  created_at: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export interface LiveClassLink {
  id: string;
  title: string;
  url: string;
  created_at: string;
}

export interface YoutubeVideo {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  youtube_url: string;
  created_at: string;
}

export interface DashboardStats {
  totalMaterials: number;
  totalVideos: number;
  totalNotifications: number;
  totalStudents: number; // Mock data for now
}

export interface Doubt {
  id: string;
  student_id: string;
  teacher_id: string | null;
  subject: string;
  question: string;
  answer: string | null;
  status: 'pending' | 'answered';
  created_at: string;
  updated_at: string;
}
