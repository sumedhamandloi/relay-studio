"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Link2,
  Pin,
  FolderClosed,
  ArrowRight,
  Sparkles,
  Youtube,
  BookOpen,
  TrendingUp,
  FileText,
  Clock,
  Plus
} from "lucide-react";
import { dbService } from "@/lib/services/database/db-service";
import { supabase } from "@/lib/supabase/client";
import { Workspace, ResearchTopic, Reference, UrlAnalysis } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Data State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [pinnedWorkspaces, setPinnedWorkspaces] = useState<Workspace[]>([]);
  const [recentReferences, setRecentReferences] = useState<Reference[]>([]);
  
  const [searchMode, setSearchMode] = useState<"research" | "analyze">("research");
  const [searchInput, setSearchInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  
  const [recentAnalyses, setRecentAnalyses] = useState<UrlAnalysis[]>([]);
  const [duplicateAnalysis, setDuplicateAnalysis] = useState<UrlAnalysis | null>(null);

  const [userName, setUserName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Good afternoon");

  // Smarter Workspace Creation State
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);
  const [researchQuery, setResearchQuery] = useState("");
  const [wsSearchQuery, setWsSearchQuery] = useState("");
  const [workspaceCreationPreference, setWorkspaceCreationPreference] = useState<"ask" | "always_new" | "always_last">("ask");
  const [isCreatingResearch, setIsCreatingResearch] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  useEffect(() => {
    loadData();
    fetchUser();
    const pref = localStorage.getItem("workspace-creation-preference");
    if (pref) setWorkspaceCreationPreference(pref as any);

    const handleUpdate = () => loadData();
    window.addEventListener("workspaces-updated", handleUpdate);
    return () => window.removeEventListener("workspaces-updated", handleUpdate);
  }, []);

  async function fetchUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null;
        if (fullName) {
          const firstName = fullName.split(" ")[0];
          setUserName(firstName);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  async function loadData() {
    const ws = await dbService.getWorkspaces();
    setWorkspaces(ws);
    setPinnedWorkspaces(ws.filter(w => w.is_pinned));

    // Load recent analyses immediately without waiting for references
    dbService.getAnalyses().then(analyses => {
      setRecentAnalyses(analyses.slice(0, 4));
    });

    // Load recent references from all topics in parallel
    const topicsArrays = await Promise.all(ws.map(w => dbService.getTopics(w.id)));
    const allTopics = topicsArrays.flat();
    const refsArrays = await Promise.all(allTopics.map(t => dbService.getReferences(t.id)));
    const allRefs = refsArrays.flat();

    // Sort by created date desc and take top 4
    allRefs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setRecentReferences(allRefs.slice(0, 4));
  }

  async function handleCreateWorkspace() {
    const title = prompt("Enter workspace name:");
    if (!title?.trim()) return;
    const newWs = await dbService.createWorkspace(title.trim(), "Newly created research hub.");
    loadData();
    router.push(`/workspace/${newWs.id}`);
  }

  async function handleTogglePin(id: string) {
    await dbService.togglePinWorkspace(id);
    loadData();
  }

  const handleModeSwitch = (mode: "research" | "analyze") => {
    setSearchMode(mode);
    setDuplicateAnalysis(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  async function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsSubmitting(true);
    setSubmitStatus(searchMode === "research" ? "Creating workspace..." : "Extracting content...");

    try {
      if (searchMode === "research") {
        const title = searchInput.trim();
        
        if (workspaceCreationPreference === "always_new") {
          const targetWs = await dbService.createWorkspace(title, "Automatically generated research workspace.");
          const targetTopic = await dbService.createTopic(targetWs.id, title, "Primary research thread.");
          
          setSubmitStatus("Workspace created! Redirecting...");
          setSearchInput("");
          setTimeout(() => {
            setSubmitStatus(null);
            loadData();
            router.push(`/workspace/${targetWs.id}?topic=${targetTopic.id}&tab=research`);
          }, 800);
        } else {
          setResearchQuery(title);
          setIsResearchModalOpen(true);
          setIsSubmitting(false);
        }
      } else {
        const cleanUrl = searchInput.trim();
        const existing = await dbService.getAnalysisByUrl(cleanUrl);
        
        if (existing) {
          setDuplicateAnalysis(existing);
          return;
        }

        setSubmitStatus("Redirecting to analysis...");
        setTimeout(() => {
          setSubmitStatus(null);
          router.push(`/analyze?url=${encodeURIComponent(cleanUrl)}`);
        }, 500);
      }
    } catch (err) {
      setSubmitStatus("An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateNewWorkspaceFromModal() {
    setIsCreatingResearch(true);
    const targetWs = await dbService.createWorkspace(researchQuery, "Automatically generated research workspace.");
    const targetTopic = await dbService.createTopic(targetWs.id, researchQuery, "Primary research thread.");
    setSearchInput("");
    setIsResearchModalOpen(false);
    loadData();
    router.push(`/workspace/${targetWs.id}?topic=${targetTopic.id}&tab=research`);
  }

  async function handleAddToExistingWorkspace(wsId: string) {
    setIsCreatingResearch(true);
    const targetTopic = await dbService.createTopic(wsId, researchQuery, "Primary research thread.");
    setSearchInput("");
    setIsResearchModalOpen(false);
    loadData();
    router.push(`/workspace/${wsId}?topic=${targetTopic.id}&tab=research`);
  }

  function handlePrefChange(val: "ask" | "always_new") {
    setWorkspaceCreationPreference(val);
    localStorage.setItem("workspace-creation-preference", val);
  }

  const filteredModalWorkspaces = workspaces.filter(ws => ws.title.toLowerCase().includes(wsSearchQuery.toLowerCase()));

  return (
    <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8 select-none">

      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            {userName ? `${greeting}, ${userName}.` : `${greeting}.`}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Research a new topic or analyze existing content.</p>
        </div>
        <Button
          size="sm"
          onClick={handleCreateWorkspace}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[11px] h-7 px-3 flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-3 h-3" />
          <span>New Workspace</span>
        </Button>
      </div>

      {/* Unified Search Section */}
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-2xl bg-card/60 backdrop-blur-sm border border-border px-6 py-5 rounded-[var(--radius)] shadow-sm relative overflow-hidden">
          
          {/* Segmented Toggle */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex gap-4 relative">
              <button
                type="button"
                onClick={() => handleModeSwitch("research")}
                className={cn(
                  "relative pb-1.5 text-[11px] font-semibold transition-colors duration-200",
                  searchMode === "research" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Research Topic
                {searchMode === "research" && (
                  <motion.div
                    layoutId="activeSearchTab"
                    className="absolute left-0 right-0 bottom-0 h-[2px] bg-primary"
                    initial={false}
                    transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch("analyze")}
                className={cn(
                  "relative pb-1.5 text-[11px] font-semibold transition-colors duration-200",
                  searchMode === "analyze" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Analyze URL
                {searchMode === "analyze" && (
                  <motion.div
                    layoutId="activeSearchTab"
                    className="absolute left-0 right-0 bottom-0 h-[2px] bg-primary"
                    initial={false}
                    transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
            <div className="absolute left-3.5 top-[11px] flex items-center justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                {searchMode === "research" ? (
                  <motion.div
                    key="search-icon"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Search className="w-4 h-4 text-muted-foreground/60" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="link-icon"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link2 className="w-4 h-4 text-muted-foreground/60" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Custom animated placeholder overlay */}
            {!searchInput && (
              <div className="absolute left-9 top-[11px] pointer-events-none flex items-center overflow-hidden text-muted-foreground/50 text-[13px]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={searchMode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {searchMode === "research" 
                      ? "Research AI Agents, System Design, Startups..." 
                      : "Paste a YouTube, LinkedIn, X, Reddit or Instagram URL..."}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
            
            <input
              ref={inputRef}
              type={searchMode === "analyze" ? "url" : "text"}
              required
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="flex-1 text-[13px] bg-muted/40 border border-border rounded-full pl-9 pr-3 py-2 hover:border-primary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground transition-all duration-200"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              className="h-[38px] px-5 min-w-[90px] rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-semibold shrink-0 relative overflow-hidden flex items-center justify-center"
              disabled={isSubmitting}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={searchMode}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  {searchMode === "research" ? "Research" : "Analyze"}
                </motion.span>
              </AnimatePresence>
            </Button>
            
            {submitStatus && (
              <span className="absolute -bottom-5 left-4 text-[10px] font-medium text-primary">
                {submitStatus}
              </span>
            )}
          </form>

          {/* Duplicate Analysis Prompt */}
          <AnimatePresence>
            {duplicateAnalysis && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-foreground mb-1">You've already analyzed this source.</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        Last analyzed: {new Date(duplicateAnalysis.created_at).toLocaleDateString()} at {new Date(duplicateAnalysis.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        <br/>What would you like to do?
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-[11px] font-semibold h-8"
                          onClick={() => router.push(`/analyze?url=${encodeURIComponent(duplicateAnalysis.url)}`)}
                        >
                          Open Existing Analysis
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-[11px] font-semibold h-8"
                          onClick={() => {
                            setDuplicateAnalysis(null);
                            setSubmitStatus("Redirecting to analysis...");
                            setTimeout(() => {
                              router.push(`/analyze?url=${encodeURIComponent(duplicateAnalysis.url)}&refresh=true`);
                            }, 500);
                          }}
                        >
                          Refresh Analysis
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-[11px] font-semibold h-8 text-muted-foreground hover:text-foreground"
                          onClick={() => router.push(`/analyze?url=${encodeURIComponent(duplicateAnalysis.url)}&expand=true`)}
                        >
                          Expand into Research Workspace
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* Pinned / Continue Working Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <Clock className="w-3.5 h-3.5" />
          <span>Active & Pinned Workspaces</span>
        </div>

        {workspaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.slice(0, 6).map(ws => (
              <Card key={ws.id} className="hover:border-primary/20 bg-card border-border transition-all p-5 rounded-[var(--radius)] relative flex flex-col justify-between min-h-[120px] group">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/workspace/${ws.id}`} className="hover:text-primary transition-colors">
                      <h3 className="text-xs font-bold text-foreground line-clamp-1">{ws.title}</h3>
                    </Link>
                    <button
                      onClick={() => handleTogglePin(ws.id)}
                      className="p-1 rounded-[calc(var(--radius)-4px)] hover:bg-[#141414] text-muted-foreground group-hover:opacity-100 transition-opacity"
                    >
                      <Pin className={`w-3.5 h-3.5 ${ws.is_pinned ? "fill-primary text-primary" : "text-muted-foreground/60"}`} />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 mt-1.5 line-clamp-2 leading-relaxed">
                    {ws.description || "No description provided."}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-border/40 mt-4 pt-3 text-[10px] text-muted-foreground font-medium">
                  <span>{ws.topics_count || 0} active topics</span>
                  <Link href={`/workspace/${ws.id}`} className="text-primary hover:underline flex items-center gap-0.5">
                    <span>Open Studio</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 border border-dashed border-border bg-card/10 rounded-[var(--radius)] text-center">
            <FolderClosed className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No workspaces found.</p>
            <Button variant="link" onClick={handleCreateWorkspace} className="text-xs text-primary font-bold mt-1">
              Create your first Workspace
            </Button>
          </div>
        )}
      </div>

      {/* References and Logs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Analyses */}
        <div className="bg-card border border-border rounded-[var(--radius)] p-5">
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
            <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Recent Analyses</span>
            </h2>
            <span className="text-[10px] font-bold text-muted-foreground">{recentAnalyses.length} total</span>
          </div>

          {recentAnalyses.length > 0 ? (
            <div className="divide-y divide-border/40">
              {recentAnalyses.map(analysis => (
                <div key={analysis.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
                  <div className="flex gap-2.5 overflow-hidden">
                    {analysis.type === "youtube" ? (
                      <Youtube className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    ) : analysis.type === "reddit" ? (
                      <Link2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    )}
                    <div className="overflow-hidden">
                      <span className="font-semibold text-foreground block truncate">{analysis.title || analysis.url.replace("https://", "").split("/")[0]}</span>
                      <span className="text-[10px] text-muted-foreground/80 block mt-0.5 uppercase tracking-wider">
                        {analysis.type}{analysis.creator ? ` • ${analysis.creator}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground/60 font-medium">
                      {new Date(analysis.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                    <button 
                      className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1"
                      onClick={() => router.push(`/analyze?url=${encodeURIComponent(analysis.url)}`)}
                    >
                      Open Analysis <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Link2 className="w-6 h-6 text-muted-foreground/50 mx-auto mb-1.5" />
              <p className="text-[11px] text-muted-foreground">No analyses performed yet.</p>
            </div>
          )}
        </div>

        {/* Recent References */}
        <div className="bg-card border border-border rounded-[var(--radius)] p-5">
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
            <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Recent References Collected</span>
            </h2>
            <span className="text-[10px] font-bold text-muted-foreground">{recentReferences.length} total</span>
          </div>

          {recentReferences.length > 0 ? (
            <div className="divide-y divide-border/40">
              {recentReferences.map(ref => (
                <div key={ref.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
                  <div className="flex gap-2.5 overflow-hidden">
                    {ref.type === "youtube" ? (
                      <Youtube className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    )}
                    <div className="overflow-hidden">
                      <span className="font-semibold text-foreground block truncate">{ref.title}</span>
                      <a href={ref.url} target="_blank" rel="noreferrer" className="text-[10px] text-muted-foreground/80 hover:text-primary block truncate mt-0.5">
                        {ref.url}
                      </a>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 font-medium">
                    {new Date(ref.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Link2 className="w-6 h-6 text-muted-foreground/50 mx-auto mb-1.5" />
              <p className="text-[11px] text-muted-foreground">No references collected yet. Paste URLs above to add.</p>
            </div>
          )}
        </div>

      </div>

      {/* Smarter Workspace Creation Modal */}
      <AnimatePresence>
        {isResearchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => !isCreatingResearch && setIsResearchModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-5 border-b border-border/50 bg-muted/20">
                <h3 className="text-lg font-bold text-foreground">Where would you like to save this research?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  You searched for: <span className="font-semibold text-primary">"{researchQuery}"</span>
                </p>
              </div>

              <div className="p-5 flex-1 overflow-y-auto space-y-6">
                
                {/* Option 1: Create New */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Option 1</h4>
                  <button 
                    onClick={handleCreateNewWorkspaceFromModal}
                    disabled={isCreatingResearch}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <FolderClosed className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-bold block mb-0.5">Create New Workspace</span>
                        <span className="text-[10px] text-muted-foreground">Start a brand new research hub.</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                </div>

                {/* Option 2: Add to Existing */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Option 2: Add to Existing Workspace</h4>
                  
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/60" />
                    <input 
                      type="text"
                      placeholder="Search workspaces..."
                      value={wsSearchQuery}
                      onChange={(e) => setWsSearchQuery(e.target.value)}
                      className="w-full text-xs bg-muted/40 border border-border rounded-md pl-9 pr-3 py-2.5 focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                    {filteredModalWorkspaces.length > 0 ? (
                      filteredModalWorkspaces.map(ws => (
                        <button
                          key={ws.id}
                          onClick={() => handleAddToExistingWorkspace(ws.id)}
                          disabled={isCreatingResearch}
                          className="w-full flex items-center justify-between p-2.5 rounded border border-transparent hover:border-border hover:bg-muted/50 transition-all text-left group"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FolderClosed className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                            <span className="text-xs font-semibold text-foreground truncate">{ws.title}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-[11px] text-muted-foreground py-4">No matching workspaces.</p>
                    )}
                  </div>
                </div>

              </div>
              
              <div className="p-4 border-t border-border/50 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                    checked={workspaceCreationPreference === "always_new"}
                    onChange={(e) => handlePrefChange(e.target.checked ? "always_new" : "ask")}
                  />
                  <span className="text-[10px] font-medium text-muted-foreground">Always create a new workspace</span>
                </label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsResearchModalOpen(false)}
                  disabled={isCreatingResearch}
                  className="h-8 text-xs font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
