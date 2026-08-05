import { Workspace, ResearchTopic, Reference, ResearchNote, GeneratedScript, BrandProfile, Integration, UrlAnalysis } from "@/types";
import { DUMMY_WORKSPACES, DUMMY_TOPICS, DUMMY_REFERENCES, DUMMY_NOTES, DUMMY_SCRIPTS, DUMMY_BRAND_PROFILE, DUMMY_INTEGRATIONS } from "@/lib/constants/dummy-data";
import { supabase } from "@/lib/supabase/client";

// Local storage key helpers
const KEYS = {
  WORKSPACES: "relay_studio_workspaces",
  TOPICS: "relay_studio_topics",
  REFERENCES: "relay_studio_references",
  NOTES: "relay_studio_notes",
  SCRIPTS: "relay_studio_scripts",
  BRAND: "relay_studio_brand",
  INTEGRATIONS: "relay_studio_integrations",
  URL_ANALYSES: "relay_studio_url_analyses"
};

// Check if we are running in the browser
const isClient = typeof window !== "undefined";

// Helper to initialize local storage with dummy data if not already present
function initLocalStorage() {
  if (!isClient) return;
  if (!localStorage.getItem(KEYS.WORKSPACES)) {
    localStorage.setItem(KEYS.WORKSPACES, JSON.stringify(DUMMY_WORKSPACES));
  }
  if (!localStorage.getItem(KEYS.TOPICS)) {
    localStorage.setItem(KEYS.TOPICS, JSON.stringify(DUMMY_TOPICS));
  }
  if (!localStorage.getItem(KEYS.REFERENCES)) {
    localStorage.setItem(KEYS.REFERENCES, JSON.stringify(DUMMY_REFERENCES));
  }
  if (!localStorage.getItem(KEYS.NOTES)) {
    localStorage.setItem(KEYS.NOTES, JSON.stringify(DUMMY_NOTES));
  }
  if (!localStorage.getItem(KEYS.SCRIPTS)) {
    localStorage.setItem(KEYS.SCRIPTS, JSON.stringify(DUMMY_SCRIPTS));
  }
  if (!localStorage.getItem(KEYS.BRAND)) {
    localStorage.setItem(KEYS.BRAND, JSON.stringify(DUMMY_BRAND_PROFILE));
  }
  if (!localStorage.getItem(KEYS.INTEGRATIONS)) {
    localStorage.setItem(KEYS.INTEGRATIONS, JSON.stringify(DUMMY_INTEGRATIONS));
  }
  if (!localStorage.getItem(KEYS.URL_ANALYSES)) {
    localStorage.setItem(KEYS.URL_ANALYSES, JSON.stringify([]));
  }
}

// Initialize on import
initLocalStorage();

// Helper to check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !url.includes("placeholder-project");
}

// Mock user ID for local storage testing
const MOCK_USER_ID = "00000000-0000-0000-0000-000000000000";

function notifyWorkspaceChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("workspaces-updated"));
  }
}

export const dbService = {
  // WORKSPACES
  async getWorkspaces(): Promise<Workspace[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      if (!error && data) return data as Workspace[];
    }
    
    // Fallback to local storage
    if (isClient) {
      const stored = localStorage.getItem(KEYS.WORKSPACES);
      if (stored) {
        const workspaces = JSON.parse(stored) as Workspace[];
        // Count topics for each
        const topics = JSON.parse(localStorage.getItem(KEYS.TOPICS) || "[]") as ResearchTopic[];
        return workspaces.map(ws => ({
          ...ws,
          topics_count: topics.filter(t => t.workspace_id === ws.id).length
        }));
      }
    }
    return DUMMY_WORKSPACES;
  },

  async createWorkspace(title: string, description: string, origin_analysis_id?: string): Promise<Workspace> {
    const newWs: Workspace = {
      id: "ws-" + Math.random().toString(36).substr(2, 9),
      user_id: "user-1",
      title,
      description,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      topics_count: 0,
      origin_analysis_id
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("workspaces")
        .insert({ title, description, origin_analysis_id })
        .select()
        .single();
      if (!error && data) return data as Workspace;
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.WORKSPACES);
      const workspaces = stored ? JSON.parse(stored) : [...DUMMY_WORKSPACES];
      workspaces.unshift(newWs);
      localStorage.setItem(KEYS.WORKSPACES, JSON.stringify(workspaces));
      notifyWorkspaceChange();
    }
    return newWs;
  },

  async renameWorkspace(id: string, newTitle: string): Promise<Workspace | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("workspaces")
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as Workspace;
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.WORKSPACES);
      if (stored) {
        const workspaces = JSON.parse(stored) as Workspace[];
        const idx = workspaces.findIndex(ws => ws.id === id);
        if (idx !== -1) {
          workspaces[idx].title = newTitle;
          workspaces[idx].updated_at = new Date().toISOString();
          localStorage.setItem(KEYS.WORKSPACES, JSON.stringify(workspaces));
          notifyWorkspaceChange();
          return workspaces[idx];
        }
      }
    }
    return null;
  },

  async deleteWorkspace(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from("workspaces").delete().eq("id", id);
      if (!error) return true;
    }

    if (isClient) {
      // 1. Get topics for this workspace to delete its contents
      const topics = await this.getTopics(id);
      const topicIds = topics.map(t => t.id);

      // 2. Remove from workspaces
      const storedWs = localStorage.getItem(KEYS.WORKSPACES);
      if (storedWs) {
        const workspaces = JSON.parse(storedWs) as Workspace[];
        localStorage.setItem(KEYS.WORKSPACES, JSON.stringify(workspaces.filter(ws => ws.id !== id)));
      }

      // 3. Remove topics
      const storedTopics = localStorage.getItem(KEYS.TOPICS);
      if (storedTopics) {
        const t = JSON.parse(storedTopics) as ResearchTopic[];
        localStorage.setItem(KEYS.TOPICS, JSON.stringify(t.filter(topic => topic.workspace_id !== id)));
      }

      // 4. Remove associated references, notes, scripts
      if (topicIds.length > 0) {
        const storedRefs = localStorage.getItem(KEYS.REFERENCES);
        if (storedRefs) {
          const r = JSON.parse(storedRefs) as Reference[];
          localStorage.setItem(KEYS.REFERENCES, JSON.stringify(r.filter(ref => !topicIds.includes(ref.topic_id))));
        }
        
        const storedNotes = localStorage.getItem(KEYS.NOTES);
        if (storedNotes) {
          const n = JSON.parse(storedNotes) as ResearchNote[];
          localStorage.setItem(KEYS.NOTES, JSON.stringify(n.filter(note => !topicIds.includes(note.topic_id))));
        }

        const storedScripts = localStorage.getItem(KEYS.SCRIPTS);
        if (storedScripts) {
          const s = JSON.parse(storedScripts) as GeneratedScript[];
          localStorage.setItem(KEYS.SCRIPTS, JSON.stringify(s.filter(script => !topicIds.includes(script.topic_id))));
        }
      }
      notifyWorkspaceChange();
      return true;
    }
    return false;
  },

  async togglePinWorkspace(id: string): Promise<Workspace | null> {
    if (isSupabaseConfigured()) {
      // Fetch current state
      const { data: current } = await supabase.from("workspaces").select("is_pinned").eq("id", id).single();
      if (current) {
        const { data, error } = await supabase
          .from("workspaces")
          .update({ is_pinned: !current.is_pinned })
          .eq("id", id)
          .select()
          .single();
        if (!error && data) return data as Workspace;
      }
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.WORKSPACES);
      if (stored) {
        const workspaces = JSON.parse(stored) as Workspace[];
        const idx = workspaces.findIndex(ws => ws.id === id);
        if (idx !== -1) {
          workspaces[idx].is_pinned = !workspaces[idx].is_pinned;
          workspaces[idx].updated_at = new Date().toISOString();
          localStorage.setItem(KEYS.WORKSPACES, JSON.stringify(workspaces));
          notifyWorkspaceChange();
          return workspaces[idx];
        }
      }
    }
    return null;
  },

  // TOPICS
  async getTopics(workspaceId: string): Promise<ResearchTopic[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("research_topics")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (!error && data) return data as ResearchTopic[];
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.TOPICS);
      if (stored) {
        const topics = JSON.parse(stored) as ResearchTopic[];
        const filtered = topics.filter(t => t.workspace_id === workspaceId);
        
        const refs = JSON.parse(localStorage.getItem(KEYS.REFERENCES) || "[]") as Reference[];
        const notes = JSON.parse(localStorage.getItem(KEYS.NOTES) || "[]") as ResearchNote[];

        return filtered.map(t => ({
          ...t,
          references_count: refs.filter(r => r.topic_id === t.id).length,
          notes_count: notes.filter(n => n.topic_id === t.id).length
        }));
      }
    }
    return DUMMY_TOPICS.filter(t => t.workspace_id === workspaceId);
  },

  async createTopic(workspaceId: string, title: string, description: string): Promise<ResearchTopic> {
    const newTopic: ResearchTopic = {
      id: "topic-" + Math.random().toString(36).substr(2, 9),
      workspace_id: workspaceId,
      title,
      description,
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      references_count: 0,
      notes_count: 0
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("research_topics")
        .insert({ workspace_id: workspaceId, title, description, status: "draft" })
        .select()
        .single();
      if (!error && data) return data as ResearchTopic;
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.TOPICS);
      const topics = stored ? JSON.parse(stored) : [...DUMMY_TOPICS];
      topics.unshift(newTopic);
      localStorage.setItem(KEYS.TOPICS, JSON.stringify(topics));
    }
    return newTopic;
  },

  // REFERENCES
  async getReferences(topicId: string): Promise<Reference[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("references")
        .select("*")
        .eq("topic_id", topicId)
        .order("created_at", { ascending: false });
      if (!error && data) return data as Reference[];
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.REFERENCES);
      if (stored) {
        const references = JSON.parse(stored) as Reference[];
        return references.filter(r => r.topic_id === topicId);
      }
    }
    return DUMMY_REFERENCES.filter(r => r.topic_id === topicId);
  },

  async addReference(topicId: string, title: string, url?: string, type: "link" | "youtube" | "reddit" | "pdf" | "document" = "link", rawContent?: string): Promise<Reference> {
    const newRef: Reference = {
      id: "ref-" + Math.random().toString(36).substr(2, 9),
      topic_id: topicId,
      title,
      url,
      type,
      raw_content: rawContent,
      summary: url ? `Analyzed summary of references linked at ${url}. Key insights extracted.` : "Manually added source document content notes.",
      status: "analyzed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("references")
        .insert({ topic_id: topicId, title, url, type, raw_content: rawContent, summary: newRef.summary })
        .select()
        .single();
      if (!error && data) return data as Reference;
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.REFERENCES);
      const references = stored ? JSON.parse(stored) : [...DUMMY_REFERENCES];
      references.unshift(newRef);
      localStorage.setItem(KEYS.REFERENCES, JSON.stringify(references));
      
      // Touch topic update date
      this.touchTopic(topicId);
    }
    return newRef;
  },

  // WORKSPACE REFERENCES
  async getWorkspaceReferences(workspaceId: string): Promise<Reference[]> {
    const topics = await this.getTopics(workspaceId);
    let allRefs: Reference[] = [];
    for (const t of topics) {
      const refs = await this.getReferences(t.id);
      allRefs = [...allRefs, ...refs];
    }
    return allRefs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // RESEARCH NOTES
  async getNotes(topicId: string): Promise<ResearchNote[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("research_notes")
        .select("*")
        .eq("topic_id", topicId)
        .order("updated_at", { ascending: false });
      if (!error && data) return data as ResearchNote[];
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.NOTES);
      if (stored) {
        const notes = JSON.parse(stored) as ResearchNote[];
        const filtered = notes.filter(n => n.topic_id === topicId);
        if (filtered.length > 0) return filtered;
      }
    }
    
    const fallback = DUMMY_NOTES.filter(n => n.topic_id === topicId);
    if (fallback.length === 0 && isClient) {
      // Auto-create a note placeholder for editing if empty
      return [await this.createNote(topicId, "Synthesized Insights", "Start drafting your synthesis here. Highlight key takeaways from references.")];
    }
    return fallback;
  },

  async createNote(topicId: string, title: string, content: string): Promise<ResearchNote> {
    const newNote: ResearchNote = {
      id: "note-" + Math.random().toString(36).substr(2, 9),
      topic_id: topicId,
      title,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("research_notes")
        .insert({ topic_id: topicId, title, content })
        .select()
        .single();
      if (!error && data) return data as ResearchNote;
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.NOTES);
      const notes = stored ? JSON.parse(stored) : [...DUMMY_NOTES];
      notes.unshift(newNote);
      localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
      this.touchTopic(topicId);
    }
    return newNote;
  },

  async updateNote(id: string, title: string, content: string): Promise<ResearchNote | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("research_notes")
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as ResearchNote;
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.NOTES);
      if (stored) {
        const notes = JSON.parse(stored) as ResearchNote[];
        const idx = notes.findIndex(n => n.id === id);
        if (idx !== -1) {
          notes[idx].title = title;
          notes[idx].content = content;
          notes[idx].updated_at = new Date().toISOString();
          localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
          this.touchTopic(notes[idx].topic_id);
          return notes[idx];
        }
      }
    }
    return null;
  },

  // SCRIPTS
  async getScripts(topicId: string): Promise<GeneratedScript[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("generated_scripts")
        .select("*")
        .eq("topic_id", topicId)
        .order("updated_at", { ascending: false });
      if (!error && data) return data as GeneratedScript[];
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.SCRIPTS);
      if (stored) {
        const scripts = JSON.parse(stored) as GeneratedScript[];
        const filtered = scripts.filter(s => s.topic_id === topicId);
        if (filtered.length > 0) return filtered;
      }
    }

    const fallback = DUMMY_SCRIPTS.filter(s => s.topic_id === topicId);
    if (fallback.length === 0 && isClient) {
      // Auto-create a script layout if empty
      return [await this.createScript(topicId, "Video Script Outline")];
    }
    return fallback;
  },

  async createScript(topicId: string, title: string): Promise<GeneratedScript> {
    const newScript: GeneratedScript = {
      id: "script-" + Math.random().toString(36).substr(2, 9),
      topic_id: topicId,
      title,
      outline: {
        "hook": "Introduce the topic with a compelling hook.",
        "body": "Add your primary points, structure, and supporting data.",
        "outro": "Finish with a clear call to action."
      },
      script_content: "# Video Title\n\n**Visual**: Set the stage.\n\n**Voiceover**: Start speaking here.",
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("generated_scripts")
        .insert({ topic_id: topicId, title, script_content: newScript.script_content, status: "draft" })
        .select()
        .single();
      if (!error && data) return data as GeneratedScript;
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.SCRIPTS);
      const scripts = stored ? JSON.parse(stored) : [...DUMMY_SCRIPTS];
      scripts.unshift(newScript);
      localStorage.setItem(KEYS.SCRIPTS, JSON.stringify(scripts));
      this.touchTopic(topicId);
    }
    return newScript;
  },

  async updateScript(id: string, title: string, content: string, status: "draft" | "review" | "published" = "draft"): Promise<GeneratedScript | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("generated_scripts")
        .update({ title, script_content: content, status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) return data as GeneratedScript;
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.SCRIPTS);
      if (stored) {
        const scripts = JSON.parse(stored) as GeneratedScript[];
        const idx = scripts.findIndex(s => s.id === id);
        if (idx !== -1) {
          scripts[idx].title = title;
          scripts[idx].script_content = content;
          scripts[idx].status = status;
          scripts[idx].updated_at = new Date().toISOString();
          localStorage.setItem(KEYS.SCRIPTS, JSON.stringify(scripts));
          this.touchTopic(scripts[idx].topic_id);
          return scripts[idx];
        }
      }
    }
    return null;
  },

  // BRAND PROFILES
  async getBrandProfile(): Promise<BrandProfile> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("is_active", true)
        .single();
      if (!error && data) return data as BrandProfile;
    }

    if (isClient) {
      const stored = localStorage.getItem(KEYS.BRAND);
      if (stored) return JSON.parse(stored) as BrandProfile;
    }
    return DUMMY_BRAND_PROFILE;
  },

  async saveBrandProfile(profile: Partial<BrandProfile>): Promise<BrandProfile> {
    const current = await this.getBrandProfile();
    const updated: BrandProfile = {
      ...current,
      ...profile,
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from("brand_profiles")
        .update(profile)
        .eq("id", current.id)
        .select()
        .single();
      if (!error && data) return data as BrandProfile;
    }

    if (isClient) {
      localStorage.setItem(KEYS.BRAND, JSON.stringify(updated));
    }
    return updated;
  },

  // Helper to touch topic updated_at
  touchTopic(topicId: string) {
    if (!isClient) return;
    const topicsStored = localStorage.getItem(KEYS.TOPICS);
    if (topicsStored) {
      const topics = JSON.parse(topicsStored) as ResearchTopic[];
      const idx = topics.findIndex(t => t.id === topicId);
      if (idx !== -1) {
        topics[idx].updated_at = new Date().toISOString();
        localStorage.setItem(KEYS.TOPICS, JSON.stringify(topics));
        
        // Also touch workspace
        this.touchWorkspace(topics[idx].workspace_id);
      }
    }
  },

  // Helper to touch workspace updated_at
  touchWorkspace(wsId: string) {
    if (!isClient) return;
    const wsStored = localStorage.getItem(KEYS.WORKSPACES);
    if (wsStored) {
      const workspaces = JSON.parse(wsStored) as Workspace[];
      const idx = workspaces.findIndex(ws => ws.id === wsId);
      if (idx !== -1) {
        workspaces[idx].updated_at = new Date().toISOString();
        localStorage.setItem(KEYS.WORKSPACES, JSON.stringify(workspaces));
      }
    }
  },

  // URL ANALYSES
  async getAnalyses(): Promise<UrlAnalysis[]> {
    if (isClient) {
      const stored = localStorage.getItem(KEYS.URL_ANALYSES);
      if (stored) {
        return JSON.parse(stored) as UrlAnalysis[];
      }
    }
    return [];
  },

  async getAnalysisByUrl(url: string): Promise<UrlAnalysis | null> {
    const analyses = await this.getAnalyses();
    return analyses.find(a => a.url === url) || null;
  },

  async createAnalysis(url: string, type: "youtube" | "reddit" | "github" | "generic", title?: string): Promise<UrlAnalysis> {
    const existing = await this.getAnalysisByUrl(url);
    if (existing) return existing;

    // Generate mock intelligence data based on type
    const baseDomain = url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
    const generatedTitle = title || `${type === "youtube" ? "YouTube Video" : type === "reddit" ? "Reddit Discussion" : "Web Article"}: ${baseDomain}`;
    
    let keyTakeaways = [
      "The primary thesis focuses on efficiency optimizations in modern frameworks.",
      "A new standard is proposed for handling distributed state.",
      "The community remains divided on the practical application of this architecture."
    ];
    let shortSummary = "This source provides a highly practical, implementation-focused view of the topic, breaking down the essential concepts for immediate application.";
    let overview = [
      "This document provides a comprehensive overview of modern web architectures, focusing on the trade-offs between monolithic structures and micro-frontends.",
      "The author argues that while micro-frontends offer isolation, they introduce significant orchestration complexity that is often underestimated by teams adopting them."
    ];
    let mainIdeas = [
      { heading: "The Orchestration Tax", explanation: "Every new micro-frontend adds a fixed cost to the orchestration layer, impacting routing and state management." },
      { heading: "State Isolation vs Sharing", explanation: "Finding the right balance between isolated component state and global application state is the hardest challenge." }
    ];
    let detailedBreakdown = [
      { section: "Introduction", content: "Sets the stage by defining what a modern framework aims to achieve: speed, DX, and maintainability." },
      { section: "Core Arguments", content: "Explores the diminishing returns of hyper-optimization." },
      { section: "Conclusion", content: "Recommends a hybrid approach, using micro-frontends only when organizational scale demands it." }
    ];
    let readingTimeSaved = "12 minutes";
    let creator = "Anonymous";
    let duration = undefined;
    let timeline = undefined;
    let importantQuotes = [
      "Optimization is not just about speed, it's about predictable behavior at scale.",
      "The true cost of abstraction is only realized when the system fails."
    ];
    let topicsCovered = ["Frameworks", "State Management", "Performance Optimization"];
    let peopleMentioned = ["John Doe", "Jane Smith"];
    let technologiesMentioned = ["React", "TypeScript", "Node.js"];
    let resourcesMentioned = ["Official Documentation", "GitHub Repository"];

    if (type === "youtube") {
      keyTakeaways = [
        "Agents require complex orchestration layers to function reliably.",
        "Memory management is the biggest bottleneck for autonomous systems.",
        "Tools must have strict validation to prevent endless loops."
      ];
      shortSummary = "A comprehensive visual breakdown of building autonomous AI systems, focusing on orchestration, memory, and tool integration.";
      overview = [
        "In this video, Fireship explores the rapidly evolving landscape of autonomous AI agents. The video breaks down the fundamental components required to build a system where AI can make decisions and take actions independently.",
        "The core focus is on the 'plumbing'—the orchestration layer, memory management, and strict tool validation—rather than the LLM itself. It argues that building reliable agents is primarily a software engineering challenge, not an AI challenge."
      ];
      mainIdeas = [
        { heading: "The Orchestration Layer", explanation: "Agents need a reliable loop (like ReAct) to observe, think, and act. If this loop breaks, the agent fails." },
        { heading: "Memory is the Bottleneck", explanation: "LLMs are stateless. An agent's intelligence is limited by how effectively it can retrieve context from short-term (context window) and long-term (vector DB) memory." },
        { heading: "Tool Validation", explanation: "Agents will hallucinate inputs to tools. Strict schema validation is necessary to prevent them from executing destructive or looping actions." }
      ];
      detailedBreakdown = [
        { section: "Introduction to Agents", content: "Defines the difference between a chatbot and an agent: agency and the ability to execute tools." },
        { section: "The ReAct Framework", content: "Explains the Reason-Act-Observe loop that powers most modern agents." },
        { section: "Building the Memory Layer", content: "Discusses the use of Vector Databases to give agents long-term recall." },
        { section: "Security and Sandboxing", content: "Highlights the dangers of giving AI access to a live terminal and how to sandbox execution." }
      ];
      readingTimeSaved = "15 minutes";
      creator = "Fireship";
      duration = "15:24";
      timeline = [
        { timestamp: "00:00", description: "Introduction to Autonomous Agents" },
        { timestamp: "03:15", description: "The Orchestration Layer Explained" },
        { timestamp: "08:42", description: "Memory Management Strategies" },
        { timestamp: "12:05", description: "Tool Integration and Validation" },
        { timestamp: "14:50", description: "Conclusion and Future Outlook" }
      ];
      importantQuotes = [
        "An agent without memory is just a calculator.",
        "The hardest part of building AI agents isn't the AI, it's the plumbing."
      ];
      topicsCovered = ["AI Agents", "Orchestration", "Memory Management", "LLMs"];
      peopleMentioned = ["Fireship"];
      technologiesMentioned = ["OpenAI", "LangChain", "Vector Databases", "Python"];
      resourcesMentioned = ["LangChain Docs", "Pinecone"];
    } else if (type === "reddit") {
      keyTakeaways = [
        "The community largely agrees that current implementations are flawed.",
        "Many users suggest migrating to strictly typed frameworks.",
        "Counter arguments highlight the loss of creative flexibility."
      ];
      shortSummary = "A lively community debate weighing the pros and cons of strict typing in modern AI frameworks vs creative flexibility.";
      overview = [
        "This Reddit thread highlights a growing schism in the developer community regarding the use of strictly typed languages (like TypeScript) for AI framework development.",
        "One side argues that strict typing is essential for production reliability, while the other claims it slows down the rapid iteration required in the fast-moving AI space."
      ];
      mainIdeas = [
        { heading: "Production Reliability", explanation: "Types prevent catastrophic runtime failures when dealing with unpredictable LLM outputs." },
        { heading: "Iteration Speed", explanation: "Writing complex type definitions for dynamic LLM responses can significantly slow down prototyping." }
      ];
      detailedBreakdown = [
        { section: "Original Post", content: "User complains about spending more time defining types than writing logic for an AI agent." },
        { section: "The Pro-Type Argument", content: "Senior engineers chime in explaining how types saved their production systems from hallucinated JSON payloads." },
        { section: "The Middle Ground", content: "Suggestions to use Zod or similar validation libraries at runtime instead of purely static typing." }
      ];
      readingTimeSaved = "8 minutes";
      creator = "u/dev_enthusiast";
      importantQuotes = [
        "Strict typing saved our production build from a catastrophic failure.",
        "We spend more time fighting the compiler than building features."
      ];
      topicsCovered = ["TypeScript", "Community Debate", "Developer Experience"];
      peopleMentioned = ["u/dev_enthusiast", "u/angry_coder"];
      technologiesMentioned = ["TypeScript", "JavaScript", "React"];
      resourcesMentioned = ["Reddit Thread"];
    }

    const newAnalysis: UrlAnalysis = {
      id: "analysis-" + Math.random().toString(36).substr(2, 9),
      url,
      type,
      title: generatedTitle,
      creator,
      publish_date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      duration,
      language: "English",
      primary_topic: type === "youtube" ? "AI Architecture" : type === "reddit" ? "Developer Community" : "Web Development",
      overview,
      main_ideas: mainIdeas,
      detailed_breakdown: detailedBreakdown,
      reading_time_saved: readingTimeSaved,
      short_summary: shortSummary,
      key_takeaways: keyTakeaways,
      timeline,
      important_quotes: importantQuotes,
      topics_covered: topicsCovered,
      people_mentioned: peopleMentioned,
      technologies_mentioned: technologiesMentioned,
      resources_mentioned: resourcesMentioned,
      status: "analyzed",
      created_at: new Date().toISOString()
    };

    if (isClient) {
      const stored = localStorage.getItem(KEYS.URL_ANALYSES);
      const analyses = stored ? JSON.parse(stored) : [];
      analyses.unshift(newAnalysis);
      localStorage.setItem(KEYS.URL_ANALYSES, JSON.stringify(analyses));
    }
    return newAnalysis;
  }
};
