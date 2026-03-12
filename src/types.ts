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
  privacy?: string;
  college_code?: string;
  pass?: string;
  // optional link for external registration form
  google_form_url?: string;
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
  club_id?: number;
  club_name?: string;
  requester_name: string;
  target_name: string;
  created_at?: string;
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
  link?: string; // optional URL to navigate when notification clicked
  is_read: number;
  timestamp: string;
}

export interface Club {
  id: number;
  name: string;
  description: string;
  logo_url?: string;
  president_id: number;
  created_by: number;
  college_code: string;
  created_at?: string;
}

export interface ClubRequest {
  id: number;
  requester_id: number;
  club_name: string;
  club_description: string;
  club_image_url?: string;
  in_charge_name: string;
  in_charge_email: string;
  related_to: string;
  college_code: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  requester_name?: string;
}

export interface ClubPost {
  id: number;
  club_id: number;
  user_id: number;
  content: string;
  image_url?: string;
  created_at: string;
  full_name?: string;
  avatar_url?: string;
}


export interface ClubMember {
  id: number;
  club_id: number;
  user_id: number;
  role: string; // custom role like 'financial_manager', 'head', 'president', etc.
  joined_at: string;
}
