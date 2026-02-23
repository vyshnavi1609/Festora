export type Role = 'admin' | 'council_president' | 'club_president' | 'club_member' | 'student';

export interface User {
  id: number;
  username: string;
  email?: string;
  phone_number?: string;
  full_name: string;
  role: Role;
  bio?: string;
  social_links?: string;
  avatar_url?: string;
  college_name?: string;
  roll_no?: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  image_url: string;
  date: string;
  location: string;
  category?: string;
  created_by: number;
  organizer_name: string;
  registration_count: number;
  comment_count: number;
  views: number;
  qr_code?: string;
  capacity?: number;
}

export interface Comment {
  id: number;
  event_id: number;
  user_id: number;
  username: string;
  full_name: string;
  content: string;
  timestamp: string;
}

export interface Analytics {
  stats: {
    total_events: number;
    total_views: number;
    total_registrations: number;
  };
  eventBreakdown: {
    title: string;
    views: number;
    registrations: number;
  }[];
}

export interface RoleRequest {
  id: number;
  requester_id: number;
  target_user_id: number;
  requested_role: Role;
  status: 'pending' | 'approved' | 'rejected';
  requester_name: string;
  target_name: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  timestamp: string;
}

export interface Notification {
  id: number;
  user_id: number;
  content: string;
  type: string;
  is_read: number;
  timestamp: string;
}
