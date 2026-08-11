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
  Save,
  ExternalLink,
  Lock,
  Layers,
  Trash2,
  Edit2
} from "lucide-react";
import { dbService } from "@/lib/services/database/db-service";
import { Workspace, ResearchTopic, Reference, ResearchNote, GeneratedScript } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ResearchView, ResearchNav } from "@/components/Research/ResearchView";

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
  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ResearchTopic | null>(null);
  
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

  const [isDeletingTopic, setIsDeletingTopic] = useState<string | null>(null);
  const [isDeletingRef, setIsDeletingRef] = useState<string | null>(null);

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
    const res = await fetch("/api/workspaces");
    if (!res.ok) {
      router.push("/dashboard");
      return;
    }
    const wsList: Workspace[] = await res.json();
    const currentWs = wsList.find(w => w.id === id);
    if (!currentWs) {
      router.push("/dashboard");
      return;
    }
    setWorkspace(currentWs);

    const tRes = await fetch(`/api/topics?workspaceId=${id}`);
    if (tRes.ok) {
      const wsTopics: ResearchTopic[] = await tRes.json();
      setTopics(wsTopics);

      // Set active topic
      if (wsTopics.length > 0) {
        const match = wsTopics.find(t => t.id === initialTopicId);
        setSelectedTopic(match || wsTopics[0]);
      } else {
        setSelectedTopic(null);
      }
    }
  }

  async function loadTopicContents(topicId: string) {
    const rRes = await fetch(`/api/references?topicId=${topicId}`);
    if (rRes.ok) {
      const refs: Reference[] = await rRes.json();
      setReferences(refs);
    } else {
      setReferences([]);
    }

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
    
    const res = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspace.id, title: newTopicTitle.trim(), description: "" })
    });
    if (!res.ok) return;
    const newT = await res.json();
    
    setNewTopicTitle("");
    setIsAddingTopic(false);
    
    // Refresh topics
    const tRes = await fetch(`/api/topics?workspaceId=${workspace.id}`);
    if (tRes.ok) {
      const wsTopics = await tRes.json();
      setTopics(wsTopics);
    }
    setSelectedTopic(newT);
  }

  async function handleAddReference(e: React.FormEvent) {
    e.preventDefault();
    if (!refTitle.trim() || !selectedTopic) return;
    
    await fetch("/api/references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic_id: selectedTopic.id,
        title: refTitle.trim(),
        url: refUrl.trim() || undefined,
        type: refType,
        summary: refContent.trim() || undefined
      })
    });

    // Reset Form
    setRefTitle("");
    setRefUrl("");
    setRefType("link");
    setRefContent("");
    setIsAddingRef(false);

    // Reload content
    loadTopicContents(selectedTopic.id);
  }

  async function handleDeleteTopic(topicId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this topic and all its contents?")) return;
    
    setIsDeletingTopic(topicId);
    await fetch(`/api/topics/${topicId}`, { method: "DELETE" });
    setIsDeletingTopic(null);
    
    if (selectedTopic?.id === topicId) setSelectedTopic(null);
    const tRes = await fetch(`/api/topics?workspaceId=${id}`);
    if (tRes.ok) {
      const wsTopics = await tRes.json();
      setTopics(wsTopics);
    }
  }

  async function handleDeleteReference(refId: string) {
    if (!confirm("Delete this reference?")) return;
    setIsDeletingRef(refId);
    await fetch(`/api/references/${refId}`, { method: "DELETE" });
    setIsDeletingRef(null);
    
    if (selectedTopic) loadTopicContents(selectedTopic.id);
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
              <div
                key={t.id}
                onClick={() => setSelectedTopic(t)}
                className={cn(
                  "group w-full flex items-center justify-between px-2.5 py-2 rounded-[calc(var(--radius)-4px)] text-[11px] text-left border transition-colors cursor-pointer",
                  selectedTopic?.id === t.id
                    ? "bg-card border-border text-foreground font-semibold shadow-sm"
                    : "text-muted-foreground border-transparent hover:bg-card/40 hover:text-foreground font-medium"
                )}
              >
                <span className="truncate pr-2">{t.title}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[8px] font-bold text-muted-text px-1.5 py-0.5 border border-border bg-[#141414] rounded uppercase tracking-wider hidden group-hover:hidden sm:block">
                    {t.status === "completed" ? "Done" : "Draft"}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-5 h-5 h-auto p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-opacity"
                    onClick={(e) => handleDeleteTopic(t.id, e)}
                    disabled={isDeletingTopic === t.id}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            {topics.length === 0 && (
              <div className="text-center py-8 text-[11px] text-muted-foreground/60 border border-dashed border-border/30 rounded-[var(--radius)]">
                No topics. Click + to add.
              </div>
            )}
          </div>
        </div>

        {/* Center Canvas: Selected Topic details + Editor tabs */}
        <div className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden border-r border-border">
          {selectedTopic ? (
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
                {activeTab === "research" && selectedTopic && (
                  <ResearchView topicId={selectedTopic.id} initialData={selectedTopic.research_data} />
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6 hover:bg-destructive/20 hover:text-destructive"
                                onClick={() => handleDeleteReference(ref.id)}
                                disabled={isDeletingRef === ref.id}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
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
             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
               <FolderClosed className="w-12 h-12 text-muted-foreground/45 mb-3" />
               <h2 className="text-sm font-bold text-foreground">No topic selected</h2>
               <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                 Select an existing research topic on the left navigator or click + to start a new focus branch.
               </p>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="mt-4"
                 onClick={() => setIsAddingTopic(true)}
               >
                 Create Topic
               </Button>
             </div>
           )}
         </div>

        {/* Right Column: AI Assistant Actions panel placeholder */}
        <div className="w-72 border-l border-border bg-muted/30 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 select-none">
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
