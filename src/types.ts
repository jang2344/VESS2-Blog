export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  tags: string[];
  cover_image?: string;
  read_time?: number;
}

export interface SupabaseConfigProps {
  url: string;
  anonKey: string;
  useSupabase: boolean;
}
