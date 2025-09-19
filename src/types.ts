// TypeScript type definitions for the networking app

export interface CloudflareBindings {
  DB: D1Database;
}

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  profile_visibility: 'public' | 'searchable' | 'private';
  score_visibility: 'public' | 'private';
  allow_direct_contact: boolean;
  network_score: number;
  successful_connections: number;
  total_earnings: number;
  password_hash: string;
  email_verified: boolean;
  verification_token?: string;
  created_at: string;
  updated_at: string;
  last_active: string;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
  description?: string;
  created_at: string;
}

export interface UserSkill {
  id: number;
  user_id: number;
  skill_id: number;
  proficiency_level: number;
  created_at: string;
  skill?: Skill;
}

export interface Contact {
  id: number;
  owner_id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  notes?: string;
  is_platform_user: boolean;
  platform_user_id?: number;
  created_at: string;
  updated_at: string;
  skills?: ContactSkill[];
}

export interface ContactSkill {
  id: number;
  contact_id: number;
  skill_id: number;
  notes?: string;
  created_at: string;
  skill?: Skill;
}

export interface Invitation {
  id: number;
  inviter_id: number;
  invitee_email: string;
  invitee_name?: string;
  invitation_token: string;
  message?: string;
  recommended_skills?: number[];
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  responded_at?: string;
}

export interface Referral {
  id: number;
  requester_id: number;
  connector_id: number;
  contact_id?: number;
  connectee_id?: number;
  skill_id: number;
  description: string;
  budget_range?: string;
  introduction_fee: number;
  has_guarantee: boolean;
  guarantee_terms?: string;
  status: 'requested' | 'connector_approved' | 'contact_invited' | 'contact_approved' | 
          'introduction_made' | 'connection_successful' | 'payment_due' | 'completed' | 
          'declined' | 'expired';
  created_at: string;
  updated_at: string;
  expires_at: string;
  completed_at?: string;
}

export interface Transaction {
  id: number;
  referral_id: number;
  total_amount: number;
  connector_share: number;
  platform_share: number;
  connectee_share: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  external_transaction_id?: string;
  payment_method?: string;
  created_at: string;
  processed_at?: string;
}

export interface Message {
  id: number;
  referral_id: number;
  sender_id: number;
  message: string;
  message_type: 'general' | 'status_update' | 'system_notification';
  read_by_requester: boolean;
  read_by_connector: boolean;
  read_by_connectee: boolean;
  created_at: string;
}

// API Request/Response types
export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  bio?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token?: string;
}

export interface SearchUsersRequest {
  query?: string;
  skills?: number[];
  min_score?: number;
  visibility?: 'public' | 'searchable';
  page?: number;
  limit?: number;
}

export interface CreateReferralRequest {
  connector_id: number;
  contact_id?: number;
  skill_id: number;
  description: string;
  budget_range?: string;
  introduction_fee?: number;
}

export interface ContactUpload {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  notes?: string;
  skills: Array<{
    skill_id: number;
    notes?: string;
  }>;
}

export interface InviteContactRequest {
  contact_id: number;
  message?: string;
  recommended_skills?: number[];
}