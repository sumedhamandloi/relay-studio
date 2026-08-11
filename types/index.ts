export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  topics_count?: number;
}

export type TopicStatus = "draft" | "in_progress" | "completed";

export interface ResearchTopic {
  id: string;
  workspace_id: string;
  title: string;
  description?: string;
  status: TopicStatus;
  created_at: string;
  updated_at: string;
  references_count?: number;
  notes_count?: number;
  research_data?: any; // JSONB storage for generated insights
}

export type ReferenceType = "link" | "youtube" | "reddit" | "pdf" | "document";

export interface Reference {
  id: string;
  topic_id: string;
  title: string;
  url?: string;
  type: ReferenceType;
  raw_content?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchNote {
  id: string;
  topic_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type ScriptStatus = "draft" | "review" | "published";

export interface GeneratedScript {
  id: string;
  topic_id: string;
  title: string;
  outline?: Record<string, any>;
  script_content?: string;
  status: ScriptStatus;
  created_at: string;
  updated_at: string;
}

export interface BrandProfile {
  id: string;
  user_id: string;
  name: string;
  voice_description?: string;
  guidelines?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  platform: string;
  auth_token?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UrlAnalysis {
  id: string;
  url: string;
  type: string;
  title: string;
  creator?: string;
  publish_date?: string;
  duration?: string;
  language?: string;
  primary_topic?: string;
  overview?: any;
  main_ideas?: any;
  detailed_breakdown?: any;
  reading_time_saved?: string;
  short_summary?: string;
  key_takeaways?: any;
  timeline?: any;
  important_quotes?: any;
  topics_covered?: string[];
  people_mentioned?: string[];
  technologies_mentioned?: string[];
  resources_mentioned?: string[];
  status: string;
  created_at: string;
}
