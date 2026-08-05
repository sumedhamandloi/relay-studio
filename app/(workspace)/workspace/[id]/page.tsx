"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  FolderClosed, 
  Plus, 
  FileText, 
  BookOpen, 
  Youtube, 
  Link2, 
  Sparkles, 
  BrainCircuit, 
  ArrowLeft,
  ArrowRight,
  Save,
  ExternalLink,
  Lock,
  Layers,
  MessageSquare,
  Calendar,
  Globe,
  Tag,
  Download,
  CheckCircle2,
  List,
  User,
  Clock,
  Lightbulb,
  Timer,
  Users,
  Cpu,
  Info
} from "lucide-react";
import { dbService } from "@/lib/services/database/db-service";
import { Workspace, ResearchTopic, Reference, ResearchNote, GeneratedScript, UrlAnalysis } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ResearchView, ResearchNav } from "@/components/Research/ResearchView";
import { SectionWrapper } from "@/components/Research/SectionWrapper";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorkspacePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTopicId = searchParams.get("topic");

  // Load States
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [originAnalysis, setOriginAnalysis] = useState<UrlAnalysis | null>(null);
  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ResearchTopic | null>(null);
  const [workspaceReferences, setWorkspaceReferences] = useState<Reference[]>([]);
  
  // View Modes
  type ViewMode = "topic" | "analysis";
  const [viewMode, setViewMode] = useState<ViewMode>("topic");
  const [selectedAnalysis, setSelectedAnalysis] = useState<UrlAnalysis | null>(null);
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null);
  
  // Topic Contents States
  const [references, setReferences] = useState<Reference[]>([]);
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [scripts, setScripts] = useState<GeneratedScript[]>([]);
  
  // Interactive UI States
  const [activeTab, setActiveTab] = useState<"research" | "references" | "insights" | "create">((searchParams.get("tab") as "research" | "references" | "insights" | "create") || "research");
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [isAddingRef, setIsAddingRef] = useState(false);
  
  // Add Reference Form States
  const [refTitle, setRefTitle] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const [refType, setRefType] = useState<"link" | "youtube" | "reddit" | "document">("link");
  const [refContent, setRefContent] = useState("");

  // Editor States
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptContent, setScriptContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaceData();
  }, [id]);

  useEffect(() => {
    if (selectedTopic) {
      loadTopicContents(selectedTopic.id);
    }
  }, [selectedTopic]);

  async function loadWorkspaceData() {
    const wsList = await dbService.getWorkspaces();
    const currentWs = wsList.find(w => w.id === id);
    if (!currentWs) {
      router.push("/dashboard");
      return;
    }
    setWorkspace(currentWs);

    if (currentWs.origin_analysis_id) {
      const analyses = await dbService.getAnalyses();
      const origin = analyses.find(a => a.id === currentWs.origin_analysis_id);
      if (origin) {
        setOriginAnalysis(origin);
      }
    }

    const wsTopics = await dbService.getTopics(id);
    setTopics(wsTopics);

    const wsRefs = await dbService.getWorkspaceReferences(id);
    setWorkspaceReferences(wsRefs);

    // Set active topic
    if (wsTopics.length > 0) {
      const match = wsTopics.find(t => t.id === initialTopicId);
      setSelectedTopic(match || wsTopics[0]);
    } else {
      setSelectedTopic(null);
    }
  }

  async function loadTopicContents(topicId: string) {
    const refs = await dbService.getReferences(topicId);
    setReferences(refs);

    const nts = await dbService.getNotes(topicId);
    setNotes(nts);
    if (nts.length > 0) {
      setNoteTitle(nts[0].title);
      setNoteContent(nts[0].content);
    } else {
      setNoteTitle("");
      setNoteContent("");
    }

    const scs = await dbService.getScripts(topicId);
    setScripts(scs);
    if (scs.length > 0) {
      setScriptTitle(scs[0].title);
      setScriptContent(scs[0].script_content || "");
    } else {
      setScriptTitle("");
      setScriptContent("");
    }
  }

  async function handleCreateTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!newTopicTitle.trim() || !workspace) return;
    const newT = await dbService.createTopic(workspace.id, newTopicTitle.trim(), "");
    setNewTopicTitle("");
    setIsAddingTopic(false);
    
    // Refresh topics
    const wsTopics = await dbService.getTopics(workspace.id);
    setTopics(wsTopics);
    setSelectedTopic(newT);
    setViewMode("topic");
    setSelectedReferenceId(null);
  }

  function handleSelectTopic(t: ResearchTopic) {
    setSelectedTopic(t);
    setViewMode("topic");
    setSelectedReferenceId(null);
  }

  async function handleSelectReference(ref: Reference) {
    if (!ref.url) return;
    const analysis = await dbService.getAnalysisByUrl(ref.url);
    if (analysis) {
      setSelectedAnalysis(analysis);
      setViewMode("analysis");
      setSelectedReferenceId(ref.id);
    } else {
      router.push(`/analyze?url=${encodeURIComponent(ref.url)}`);
    }
  }

  async function handleAddReference(e: React.FormEvent) {
    e.preventDefault();
    if (!refTitle.trim() || !selectedTopic) return;
    
    await dbService.addReference(
      selectedTopic.id,
      refTitle.trim(),
      refUrl.trim() || undefined,
      refType,
      refContent.trim() || undefined
    );

    // Reset Form
    setRefTitle("");
    setRefUrl("");
    setRefType("link");
    setRefContent("");
    setIsAddingRef(false);

    // Reload content
    loadTopicContents(selectedTopic.id);
    // Reload workspace references
    if (workspace) {
      const wsRefs = await dbService.getWorkspaceReferences(workspace.id);
      setWorkspaceReferences(wsRefs);
    }
  }

  async function handleSaveNote() {
    if (notes.length === 0 || !selectedTopic) return;
    setIsSaving(true);
    setSaveStatus("Saving...");
    
    await dbService.updateNote(notes[0].id, noteTitle, noteContent);
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveStatus("Saved");
      setTimeout(() => setSaveStatus(null), 1500);
      loadTopicContents(selectedTopic.id);
    }, 600);
  }

  async function handleSaveScript() {
    if (scripts.length === 0 || !selectedTopic) return;
    setIsSaving(true);
    setSaveStatus("Saving...");

    await dbService.updateScript(scripts[0].id, scriptTitle, scriptContent, scripts[0].status);

    setTimeout(() => {
      setIsSaving(false);
      setSaveStatus("Saved");
      setTimeout(() => setSaveStatus(null), 1500);
      loadTopicContents(selectedTopic.id);
    }, 600);
  }

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-foreground h-screen">
        <div className="text-center space-y-2">
          <Layers className="w-8 h-8 animate-pulse text-primary mx-auto" />
          <span className="text-xs text-muted-foreground font-medium block">Loading workspace canvas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background text-foreground">
      
      {/* Top Header/Navigation Bar */}
      <div className="h-14 border-b border-border bg-card/10 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3 overflow-hidden">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-accent/15">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 overflow-hidden">
            <FolderClosed className="w-4 h-4 text-primary shrink-0" />
            <h2 className="text-xs font-black truncate uppercase tracking-wider">{workspace.title}</h2>
          </div>
        </div>

        {/* Quick status indicator */}
        <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground">
          {saveStatus && (
            <span className="text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              {saveStatus}
            </span>
          )}
          <span className="px-2 py-0.5 rounded border border-border bg-card/60">
            Workspace Mode
          </span>
        </div>
      </div>

      {/* Main Multi-Panel Workspace Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Column: Topics Navigator */}
        <div className="w-56 border-r border-border bg-muted/30 flex flex-col shrink-0 overflow-y-auto select-none p-3 space-y-4">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>Research Topics</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-4 h-4 p-0 hover:bg-card hover:text-foreground"
              onClick={() => setIsAddingTopic(!isAddingTopic)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* New Topic inline input */}
          <AnimatePresence>
            {isAddingTopic && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateTopic}
                className="space-y-1.5 overflow-hidden"
              >
                <input 
                  type="text" 
                  placeholder="Topic title..." 
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  className="w-full text-[11px] bg-card border border-border rounded-[calc(var(--radius)-4px)] px-2.5 py-1.5 focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/50"
                  autoFocus
                />
                <div className="flex justify-end gap-1">
                  <Button type="button" variant="ghost" size="sm" className="h-5.5 text-[9px] px-1.5" onClick={() => setIsAddingTopic(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-5.5 text-[9px] px-1.5 bg-primary text-primary-foreground font-semibold">
                    Add
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Topics List */}
          <div className="space-y-0.5">
            {topics.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectTopic(t)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 rounded-[calc(var(--radius)-4px)] text-[11px] font-semibold text-left border transition-colors",
                  viewMode === "topic" && selectedTopic?.id === t.id
                    ? "bg-card border-border text-foreground font-semibold"
                    : "text-muted-foreground border-transparent hover:bg-card/40 hover:text-foreground"
                )}
              >
                <span className="truncate pr-2">{t.title}</span>
                <span className="text-[8px] font-bold text-muted-text px-1.5 py-0.5 border border-border bg-[#141414] rounded uppercase tracking-wider">
                  {t.status === "completed" ? "Done" : "Draft"}
                </span>
              </button>
            ))}
            {topics.length === 0 && (
              <div className="text-center py-8 text-[11px] text-muted-foreground/60 border border-dashed border-border/30 rounded-[var(--radius)]">
                No topics. Click + to add.
              </div>
            )}
          </div>
          
          {/* Collected URLs Section */}
          <div className="mt-8 mb-4">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
              <span>Collected URLs</span>
            </div>
            <div className="space-y-1">
              {workspaceReferences.map(ref => (
                <button
                  key={ref.id}
                  onClick={() => handleSelectReference(ref)}
                  className={cn("w-full flex flex-col px-2.5 py-2 rounded-[calc(var(--radius)-4px)] text-[11px] text-left hover:bg-card/40 transition-colors group border",
                    viewMode === "analysis" && selectedReferenceId === ref.id 
                      ? "bg-card border-border border-transparent" 
                      : "border-transparent hover:border-border/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {ref.type === "youtube" ? <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" /> : 
                     ref.type === "reddit" ? <MessageSquare className="w-3.5 h-3.5 text-orange-500 shrink-0" /> :
                     <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                    <span className="font-semibold text-foreground/90 truncate group-hover:text-foreground">{ref.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pl-5.5">
                    {ref.status === "processing" ? (
                       <span className="flex items-center gap-1 text-[9px] text-yellow-500 font-medium tracking-wide uppercase">
                         <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span> Processing
                       </span>
                    ) : ref.status === "failed" ? (
                       <span className="flex items-center gap-1 text-[9px] text-red-500 font-medium tracking-wide uppercase">
                         <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Failed
                       </span>
                    ) : (
                       <span className="flex items-center gap-1 text-[9px] text-green-500 font-medium tracking-wide uppercase">
                         <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Analyzed
                       </span>
                    )}
                  </div>
                </button>
              ))}
              {workspaceReferences.length === 0 && (
                <div className="text-center py-6 text-[11px] text-muted-foreground/60 border border-dashed border-border/30 rounded-[var(--radius)]">
                  No URLs collected yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Canvas: Selected Topic details + Editor tabs */}
        <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden border-r border-border relative">
          {viewMode === "analysis" && selectedAnalysis ? (
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Related Topics Quick Links */}
                {topics.length > 0 && (
                  <div className="flex flex-col gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Related Research Topics in This Workspace
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {topics.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleSelectTopic(t)}
                          className="text-xs font-semibold bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border/50 transition-colors flex items-center gap-1.5"
                        >
                          <FolderClosed className="w-3.5 h-3.5" />
                          {t.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Title Header */}
                <div className="flex items-center gap-4 mb-4 pb-6 border-b border-border/40">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                    {selectedAnalysis.type === "youtube" ? <Youtube className="w-6 h-6 text-red-500" /> : 
                     selectedAnalysis.type === "reddit" ? <MessageSquare className="w-6 h-6 text-orange-500" /> :
                     <BookOpen className="w-6 h-6 text-primary" />}
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {selectedAnalysis.title}
                  </h1>
                </div>

                {/* Analysis Content */}
                <div className="pt-2">
                    {/* Overview */}
                    {selectedAnalysis.overview && selectedAnalysis.overview.length > 0 && (
                      <SectionWrapper id="analysis-overview" title="Overview" icon={BookOpen}>
                        <div className="space-y-4 text-foreground/90 leading-relaxed text-sm">
                          {selectedAnalysis.overview.map((para, i) => (
                            <p key={i}>{para}</p>
                          ))}
                        </div>
                        {selectedAnalysis.reading_time_saved && (
                          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-green-600 bg-green-500/10 px-3 py-1.5 rounded-full w-fit">
                            <Timer className="w-4 h-4" />
                            Estimated reading time saved: {selectedAnalysis.reading_time_saved}
                          </div>
                        )}
                      </SectionWrapper>
                    )}

                    {/* Main Ideas */}
                    {selectedAnalysis.main_ideas && selectedAnalysis.main_ideas.length > 0 && (
                      <SectionWrapper id="analysis-main-ideas" title="Main Ideas" icon={Lightbulb}>
                        <div className="space-y-6">
                          {selectedAnalysis.main_ideas.map((idea, i) => (
                            <div key={i} className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
                              <h4 className="text-sm font-bold text-foreground mb-1.5">{idea.heading}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">{idea.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </SectionWrapper>
                    )}

                    {/* Detailed Breakdown */}
                    {selectedAnalysis.detailed_breakdown && selectedAnalysis.detailed_breakdown.length > 0 && (
                      <SectionWrapper id="analysis-breakdown" title="Detailed Breakdown" icon={Layers}>
                        <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                          {selectedAnalysis.detailed_breakdown.map((item, i) => (
                            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary/10 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-bold text-xs">
                                {i + 1}
                              </div>
                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm mb-4">
                                <h4 className="font-bold text-sm mb-1">{item.section}</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">{item.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </SectionWrapper>
                    )}

                    {/* Key Takeaways */}
                    {selectedAnalysis.key_takeaways && selectedAnalysis.key_takeaways.length > 0 && (
                      <SectionWrapper id="analysis-takeaways" title="Key Takeaways" icon={CheckCircle2}>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedAnalysis.key_takeaways.map((takeaway, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors shadow-sm">
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                              <span className="text-sm text-foreground/90 leading-relaxed">{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </SectionWrapper>
                    )}

                    {/* Timeline */}
                    {selectedAnalysis.timeline && selectedAnalysis.timeline.length > 0 && (
                      <SectionWrapper id="analysis-timeline" title="Timeline" icon={Clock}>
                        <div className="space-y-2 bg-card p-4 rounded-xl border border-border/50">
                          {selectedAnalysis.timeline.map((event, idx) => (
                            <div key={idx} className="flex gap-4 text-sm group p-2 hover:bg-muted/40 rounded-lg transition-colors cursor-pointer">
                              <span className="font-mono text-primary font-bold shrink-0 bg-primary/10 px-2 py-0.5 rounded text-xs">{event.timestamp}</span>
                              <span className="text-foreground/80 group-hover:text-foreground">{event.description}</span>
                            </div>
                          ))}
                        </div>
                      </SectionWrapper>
                    )}

                    {/* Important Quotes */}
                    {selectedAnalysis.important_quotes && selectedAnalysis.important_quotes.length > 0 && (
                      <SectionWrapper id="analysis-quotes" title="Important Quotes" icon={MessageSquare}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedAnalysis.important_quotes.map((quote, idx) => (
                            <blockquote key={idx} className="text-sm italic text-foreground/90 border-l-4 border-primary/50 pl-5 py-3 bg-card rounded-r-xl shadow-sm leading-relaxed">
                              "{quote}"
                            </blockquote>
                          ))}
                        </div>
                      </SectionWrapper>
                    )}

                    {/* Topics Covered */}
                    {selectedAnalysis.topics_covered && selectedAnalysis.topics_covered.length > 0 && (
                      <SectionWrapper id="analysis-topics" title="Topics Covered" icon={Tag}>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnalysis.topics_covered.map((tag, i) => (
                            <span key={i} className="text-sm px-3 py-1.5 rounded-lg bg-muted text-foreground border border-border/50 font-medium">{tag}</span>
                          ))}
                        </div>
                      </SectionWrapper>
                    )}

                    {/* People / Companies Mentioned */}
                    {selectedAnalysis.people_mentioned && selectedAnalysis.people_mentioned.length > 0 && (
                      <SectionWrapper id="analysis-people" title="People / Companies Mentioned" icon={Users}>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnalysis.people_mentioned.map((tag, i) => (
                            <span key={i} className="text-sm px-3 py-1.5 rounded-lg bg-muted text-foreground border border-border/50 font-medium">{tag}</span>
                          ))}
                        </div>
                      </SectionWrapper>
                    )}

                    {/* Technologies / Tools Mentioned */}
                    {selectedAnalysis.technologies_mentioned && selectedAnalysis.technologies_mentioned.length > 0 && (
                      <SectionWrapper id="analysis-tech" title="Technologies Mentioned" icon={Cpu}>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnalysis.technologies_mentioned.map((tag, i) => (
                            <span key={i} className="text-sm px-3 py-1.5 rounded-lg bg-muted text-foreground border border-border/50 font-medium">{tag}</span>
                          ))}
                        </div>
                      </SectionWrapper>
                    )}
                  </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-8 border-t border-border/40 pt-8 mt-8">
                  <button disabled className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-border bg-card/30 text-center opacity-60 cursor-not-allowed hover:bg-card/50 transition-colors">
                    <Download className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground">Generate Notes</span>
                  </button>
                  <button disabled className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-border bg-card/30 text-center opacity-60 cursor-not-allowed hover:bg-card/50 transition-colors">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground">Create Content</span>
                  </button>
                  <button disabled className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-border bg-card/30 text-center opacity-60 cursor-not-allowed hover:bg-card/50 transition-colors">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground">Ask Questions</span>
                  </button>
                </div>

                {/* Source Information */}
                <div className="mt-8 border border-border/50 bg-card/30 p-6 rounded-2xl mb-12">
                  <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    Source Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Platform</div>
                      <div className="font-medium">{selectedAnalysis.type === "youtube" ? "YouTube" : selectedAnalysis.type === "reddit" ? "Reddit" : "Web Article"}</div>
                    </div>
                    {selectedAnalysis.creator && (
                      <div>
                        <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Creator</div>
                        <div className="font-medium">{selectedAnalysis.creator}</div>
                      </div>
                    )}
                    {selectedAnalysis.publish_date && (
                      <div>
                        <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Date</div>
                        <div className="font-medium">{selectedAnalysis.publish_date}</div>
                      </div>
                    )}
                    {selectedAnalysis.language && (
                      <div>
                        <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Language</div>
                        <div className="font-medium">{selectedAnalysis.language}</div>
                      </div>
                    )}
                    {selectedAnalysis.duration && (
                      <div>
                        <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Duration</div>
                        <div className="font-medium">{selectedAnalysis.duration}</div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Original URL</div>
                    <a href={selectedAnalysis.url} target="_blank" rel="noreferrer" className="text-primary hover:underline underline-offset-4 text-sm font-mono max-w-full block truncate">
                      {selectedAnalysis.url}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === "topic" && selectedTopic ? (
            <>
              {/* Tabs Controller */}
              <div className="h-10 border-b border-border bg-card/5 flex items-center justify-between px-4 select-none shrink-0 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setActiveTab("research")}
                    className={cn(
                      "h-10 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap",
                      activeTab === "research" 
                        ? "border-primary text-foreground" 
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Research</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("references")}
                    className={cn(
                      "h-10 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap",
                      activeTab === "references" 
                        ? "border-primary text-foreground" 
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-secondary" />
                    <span>References ({references.length})</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("insights")}
                    className={cn(
                      "h-10 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap",
                      activeTab === "insights" 
                        ? "border-primary text-foreground" 
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                    <span>Insights</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("create")}
                    className={cn(
                      "h-10 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap",
                      activeTab === "create" 
                        ? "border-primary text-foreground" 
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Create</span>
                  </button>
                </div>

                {/* Tab action button */}
                {activeTab === "references" && (
                  <Button 
                    size="sm" 
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold flex items-center gap-1"
                    onClick={() => setIsAddingRef(true)}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Reference</span>
                  </Button>
                )}
                {activeTab === "insights" && (
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1"
                    onClick={handleSaveNote}
                    disabled={isSaving}
                  >
                    <Save className="w-3 h-3" />
                    <span>Save Insights</span>
                  </Button>
                )}
                {activeTab === "create" && (
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1"
                    onClick={handleSaveScript}
                    disabled={isSaving}
                  >
                    <Save className="w-3 h-3" />
                    <span>Save Script</span>
                  </Button>
                )}
              </div>

              {/* Research Section Navigation Strip — sits between tabs and scroll area */}
              {activeTab === "research" && <ResearchNav />}

              {/* Scrollable Tab Views */}
              <div className={cn(
                "flex-1 overflow-y-auto",
                activeTab === "research" ? "p-4 md:p-6" : "p-4 md:p-6"
              )}>
                
                {/* 0. Research tab (New) */}
                {activeTab === "research" && (
                  <ResearchView />
                )}

                {/* 1. References tab */}
                {activeTab === "references" && (
                  <div className="space-y-4">
                    {/* Add Reference Modal Form */}
                    {isAddingRef && (
                      <Card className="bg-card border-border p-5 space-y-3 rounded-[var(--radius)]">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block">New Reference Source</span>
                        <form onSubmit={handleAddReference} className="grid grid-cols-1 gap-3 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground uppercase">Title</label>
                              <input 
                                type="text" 
                                required
                                value={refTitle}
                                onChange={e => setRefTitle(e.target.value)}
                                placeholder="Linear's Sync architecture blog..."
                                className="w-full bg-muted/40 border border-border rounded-[calc(var(--radius)-4px)] px-2.5 py-1.5 focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground uppercase">Type</label>
                              <select 
                                value={refType}
                                onChange={e => setRefType(e.target.value as "link" | "youtube" | "reddit" | "document")}
                                className="w-full bg-muted/40 border border-border rounded-[calc(var(--radius)-4px)] px-2.5 py-1.5 focus:outline-none focus:border-primary text-foreground"
                              >
                                <option value="link">Web Link/Article</option>
                                <option value="youtube">YouTube Video</option>
                                <option value="reddit">Reddit Discussion</option>
                                <option value="document">Custom Document</option>
                              </select>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase">URL (optional)</label>
                            <input 
                              type="url" 
                              value={refUrl}
                              onChange={e => setRefUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-muted/40 border border-border rounded-[calc(var(--radius)-4px)] px-2.5 py-1.5 focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/50"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase">Raw content notes (optional)</label>
                            <textarea 
                              value={refContent}
                              onChange={e => setRefContent(e.target.value)}
                              placeholder="Paste notes, raw text, or description..."
                              className="w-full h-16 bg-muted/40 border border-border rounded-[calc(var(--radius)-4px)] px-2.5 py-1.5 focus:outline-none focus:border-primary text-foreground resize-none placeholder:text-muted-foreground/50"
                            />
                          </div>
                          <div className="flex justify-end gap-1.5 pt-2">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingRef(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" size="sm" className="bg-secondary text-secondary-foreground font-semibold">
                              Save Reference
                            </Button>
                          </div>
                        </form>
                      </Card>
                    )}

                    {/* Reference List */}
                    <div className="space-y-3">
                      {references.map(ref => (
                        <Card key={ref.id} className="bg-card border-border p-4 hover:border-accent/25 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                {ref.type === "youtube" ? (
                                  <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                                ) : ref.type === "reddit" ? (
                                  <Link2 className="w-4 h-4 text-orange-500 shrink-0" />
                                ) : (
                                  <Link2 className="w-4 h-4 text-secondary shrink-0" />
                                )}
                                <span className="text-xs font-bold text-foreground">{ref.title}</span>
                              </div>
                              {ref.url && (
                                <a 
                                  href={ref.url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            
                            {/* Summary description */}
                            {ref.summary && (
                              <p className="text-[11px] text-muted-foreground/80 mt-2 leading-relaxed">
                                {ref.summary}
                              </p>
                            )}

                             {/* Raw transcript content */}
                             {ref.raw_content && (
                               <div className="mt-3 bg-muted/40 border border-border p-2.5 rounded-[calc(var(--radius)-4px)] text-[10px] font-mono max-h-24 overflow-y-auto leading-normal text-muted-foreground whitespace-pre-wrap">
                                 {ref.raw_content}
                               </div>
                             )}
                           </div>
                           <div className="text-[9px] text-muted-foreground/50 mt-4 border-t border-border/30 pt-2 font-medium">
                             COLLECTED ON {new Date(ref.created_at).toLocaleDateString()}
                           </div>
                         </Card>
                       ))}

                       {references.length === 0 && !isAddingRef && (
                         <div className="text-center py-16 border border-dashed border-border bg-card/20 rounded-[var(--radius)]">
                           <BookOpen className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                           <h3 className="text-xs font-bold text-foreground">No references collected yet</h3>
                           <p className="text-[10px] text-muted-foreground mt-1">Paste web urls or youtube links to start organizing knowledge.</p>
                           <Button 
                             size="sm" 
                             className="mt-4 bg-secondary text-secondary-foreground font-semibold"
                             onClick={() => setIsAddingRef(true)}
                           >
                             Add Reference
                           </Button>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                 {/* 2. Insights tab (formerly Notes) */}
                {activeTab === "insights" && (
                   <div className="space-y-4 h-full flex flex-col py-2">
                     <input 
                       type="text" 
                       value={noteTitle}
                       onChange={e => setNoteTitle(e.target.value)}
                       placeholder="Note Title..."
                       className="w-full text-base font-bold bg-transparent border-b border-border/30 pb-2 focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/30"
                     />
                     <textarea 
                       value={noteContent}
                       onChange={e => setNoteContent(e.target.value)}
                       placeholder="Start writing synthesized insights. Use markdown to structure sections..."
                       className="w-full flex-1 min-h-[350px] bg-transparent py-2 resize-none focus:outline-none text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/40"
                     />
                   </div>
                 )}

                 {/* 3. Create tab (formerly Script) */}
                {activeTab === "create" && (
                   <div className="space-y-4 h-full flex flex-col py-2">
                     <input 
                       type="text" 
                       value={scriptTitle}
                       onChange={e => setScriptTitle(e.target.value)}
                       placeholder="Script Title..."
                       className="w-full text-base font-bold bg-transparent border-b border-border/30 pb-2 focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/30"
                     />
                     <textarea 
                       value={scriptContent}
                       onChange={e => setScriptContent(e.target.value)}
                       placeholder="Write your narration script here. Side-by-side with visual cues..."
                       className="w-full flex-1 min-h-[350px] bg-transparent py-2 resize-none focus:outline-none text-xs font-mono leading-relaxed text-foreground placeholder:text-muted-foreground/40"
                     />
                   </div>
                 )}

               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 h-full space-y-3">
               <Layers className="w-10 h-10 animate-pulse text-muted-foreground/20" />
               <p className="text-xs font-medium">Select a Research Topic or a Collected URL to view contents.</p>
             </div>
           )}
         </div>

        {/* Right Column: AI Assistant Actions panel placeholder */}
        <div className="w-72 border-l border-border bg-muted/30 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 select-none">
          
          {/* Source Analysis Panel */}
          {originAnalysis && (
            <div className="bg-primary/5 border border-primary/20 rounded-[var(--radius)] p-4 mb-2 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1.5 bg-primary rounded-bl-lg">
                 <Sparkles className="w-3 h-3 text-primary-foreground" />
              </div>
              <h3 className="text-[10px] font-bold text-primary tracking-widest uppercase block mb-1">Source Analysis</h3>
              <p className="text-xs text-foreground font-semibold line-clamp-1 mb-1" title={originAnalysis.title || originAnalysis.url}>{originAnalysis.title || originAnalysis.url}</p>
              <p className="text-[10px] text-muted-foreground mb-3">Workspace expanded from this source.</p>
              <Link href={`/analyze?url=${encodeURIComponent(originAnalysis.url)}`}>
                <Button size="sm" variant="outline" className="w-full text-[10px] h-7 font-bold border-primary/30 hover:bg-primary/10 hover:text-primary">
                  Open Original Analysis <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Root AI Assistant</span>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            AI features are currently stubbed. In the next ecosystem module (Root Access), you will be able to trigger actions on your collected references.
          </p>

          <div className="bg-card border border-border p-4 rounded-[var(--radius)] space-y-3.5">
            <span className="text-[9px] font-bold text-primary tracking-widest uppercase block">PROPOSED CAPABILITIES</span>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <BrainCircuit className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground block">Synthesize Sources</span>
                  <span className="text-[10px] text-muted-foreground">Generates structured summary note from all checked references.</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <FileText className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground block">Draft Video Script</span>
                  <span className="text-[10px] text-muted-foreground">Converts research notes into a YouTube script matching your voice profile.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Locked actions representing future modules */}
          <div className="space-y-2 border-t border-border/40 pt-4">
            <span className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase block">Future Actions</span>
            
            <button disabled className="w-full flex items-center justify-between px-2.5 py-1.5 border border-border bg-[#141414]/20 rounded-[calc(var(--radius)-4px)] text-[10px] font-semibold text-muted-foreground/60 cursor-not-allowed">
              <span>Align with Brand Voice</span>
              <Lock className="w-3 h-3 text-muted-foreground/50" />
            </button>
            <button disabled className="w-full flex items-center justify-between px-2.5 py-1.5 border border-border bg-[#141414]/20 rounded-[calc(var(--radius)-4px)] text-[10px] font-semibold text-muted-foreground/60 cursor-not-allowed">
              <span>Generate Thumbnail Hooks</span>
              <Lock className="w-3 h-3 text-muted-foreground/50" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
