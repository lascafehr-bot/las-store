export type LascoreRole = "admin" | "user";

export type LascoreProfile = {
  id: string;
  full_name: string;
  email: string;
  role: LascoreRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
