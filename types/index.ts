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
  origin_analysis_id?: string;
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
  status?: "analyzed" | "processing" | "failed";
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
  type: "youtube" | "instagram" | "twitter" | "linkedin" | "reddit" | "github" | "generic";
  title?: string;
  creator?: string;
  publish_date?: string;
  duration?: string;
  language?: string;
  primary_topic?: string;
  overview?: string[] | string;
  main_ideas?: { heading: string, explanation: string }[];
  detailed_breakdown?: { section: string, content: string }[];
  reading_time_saved?: string;
  short_summary?: string;
  key_takeaways?: string[];
  timeline?: { timestamp: string, description: string }[];
  important_quotes?: string[];
  topics_covered?: string[];
  people_mentioned?: string[];
  technologies_mentioned?: string[];
  resources_mentioned?: string[];
  // Platform-specific insights
  hook?: string;
  summary?: string;
  key_points?: string[];
  engagement_observations?: string[];
  format?: string;
  caption_analysis?: string;
  engagement_signals?: string[];
  content_structure?: string[];
  status?: "analyzed" | "processing" | "failed";
  created_at: string;
}

export interface ResearchSynthesisResult {
  overview: string;
  key_findings: string[];
  contradictions: string[];
  important_sources: Array<{ title?: string; url?: string; takeaway?: string } | string>;
  takeaways: string[];
}
