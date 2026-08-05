"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Youtube,
  BookOpen,
  ArrowRight,
  Sparkles,
  Link2,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  List,
  MessageSquare,
  Network,
  Download,
  FolderPlus,
  Loader2,
  FileText,
  Calendar,
  Globe,
  Tag
} from "lucide-react";
import { Workspace, UrlAnalysis } from "@/types";
import { dbService } from "@/lib/services/database/db-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

function AnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawUrl = searchParams.get("url") || "";

  // Loading States
  const [loadingStep, setLoadingStep] = useState(0); 
  const loadingStepsText = [
    "Detecting platform",
    "Reading metadata",
    "Extracting content",
    "Understanding context",
    "Preparing analysis"
  ];
  
  const [analysis, setAnalysis] = useState<UrlAnalysis | null>(null);

  // Save Modal States
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!rawUrl) return;

    let isMounted = true;

    async function performAnalysis() {
      // Check if already analyzed
      const existingAnalysis = await dbService.getAnalysisByUrl(rawUrl);
      if (existingAnalysis) {
        if (isMounted) {
          setAnalysis(existingAnalysis);
          setLoadingStep(loadingStepsText.length); // skip to complete
        }
        return;
      }

      let currentType: "youtube" | "reddit" | "github" | "generic" = "generic";
      if (rawUrl.includes("youtube.com") || rawUrl.includes("youtu.be")) {
        currentType = "youtube";
      } else if (rawUrl.includes("reddit.com")) {
        currentType = "reddit";
      } else if (rawUrl.includes("github.com")) {
        currentType = "github";
      }

      // Simulate step-by-step loading
      for (let i = 0; i < loadingStepsText.length; i++) {
        if (!isMounted) return;
        setLoadingStep(i);
        await new Promise(r => setTimeout(r, 700));
      }

      // Create new analysis
      if (isMounted) {
        const newAnalysis = await dbService.createAnalysis(rawUrl, currentType);
        setAnalysis(newAnalysis);
        setLoadingStep(loadingStepsText.length);
      }
    }

    performAnalysis();

    return () => {
      isMounted = false;
    };
  }, [rawUrl]);

  async function handleExpandToWorkspace() {
    if (!analysis) return;
    // 1. Create a workspace
    const ws = await dbService.createWorkspace(`Research: ${analysis.title || 'Web Content'}`, "Workspace expanded from an analyzed URL.", analysis.id);
    // 2. Create topic
    const topic = await dbService.createTopic(ws.id, "URL References", "Topic created for URL extraction.");
    // 3. Add reference
    let type: "youtube" | "link" | "reddit" = "link";
    if (analysis.type === "youtube") type = "youtube";
    if (analysis.type === "reddit") type = "reddit";
    
    await dbService.addReference(topic.id, analysis.title || "Web Content", rawUrl, type);
    // 4. Redirect to workspace
    router.push(`/workspace/${ws.id}?topic=${topic.id}&tab=research`);
  }

  async function openSaveModal() {
    const wsList = await dbService.getWorkspaces();
    setWorkspaces(wsList);
    setSearchQuery("");
    setIsSaveModalOpen(true);
  }

  async function handleSaveToWorkspace(workspaceId: string) {
    if (!analysis) return;
    setSaveStatus(workspaceId);
    
    // 1. Get or create a topic
    let topics = await dbService.getTopics(workspaceId);
    let targetTopicId = topics.length > 0 ? topics[0].id : null;
    if (!targetTopicId) {
      const newTopic = await dbService.createTopic(workspaceId, "URL References", "Saved from URL Analyzer");
      targetTopicId = newTopic.id;
    }
    
    // 2. Add reference
    let type: "youtube" | "link" | "reddit" = "link";
    if (analysis.type === "youtube") type = "youtube";
    if (analysis.type === "reddit") type = "reddit";
    
    await dbService.addReference(targetTopicId, analysis.title || "Web Content", rawUrl, type);
    
    setTimeout(() => {
      setSaveStatus("success");
      setTimeout(() => {
        setIsSaveModalOpen(false);
        setSaveStatus(null);
        // Redirect to workspace
        router.push(`/workspace/${workspaceId}?topic=${targetTopicId}&tab=research`);
      }, 1000);
    }, 600);
  }

  const filteredWorkspaces = workspaces.filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!rawUrl) {
    return (
      <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-bold">No URL Provided</h2>
          <p className="text-sm text-muted-foreground mb-6">Please go back and enter a valid URL to analyze.</p>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full select-none pb-20">
      <div className="mb-8">
        <button onClick={() => router.push("/dashboard")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          Back to Dashboard
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loadingStep < loadingStepsText.length || !analysis ? (
          <motion.div
            key="loading-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center min-h-[50vh]"
          >
            <div className="w-16 h-16 relative mb-8">
              <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-primary/20 rounded-full flex items-center justify-center backdrop-blur-md border border-primary/30">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-6 text-center">
              Analyzing URL...
            </h2>

            <div className="space-y-3 w-full max-w-xs">
              {loadingStepsText.map((step, index) => {
                const isActive = index === loadingStep;
                const isPast = index < loadingStep;
                return (
                  <div key={step} className="flex items-center gap-3">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-muted shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${isActive ? 'text-foreground' : isPast ? 'text-foreground/70' : 'text-muted-foreground'}`}>
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
            
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-8"
          >
            {/* Meta Header Snapshot */}
            <div className="flex flex-col border border-border/50 rounded-2xl p-6 bg-card shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-border/40">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm mt-1">
                    {analysis.type === "youtube" ? <Youtube className="w-7 h-7 text-red-500" /> : 
                     analysis.type === "reddit" ? <MessageSquare className="w-7 h-7 text-orange-500" /> :
                     <BookOpen className="w-7 h-7 text-primary" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                         {analysis.type === "youtube" ? "YouTube Video" : analysis.type === "reddit" ? "Reddit Discussion" : "Web Article"}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        Analyzed Source
                      </span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight mb-2">
                      {analysis.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      {analysis.creator && (
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {analysis.creator}</span>
                      )}
                      {analysis.publish_date && (
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {analysis.publish_date}</span>
                      )}
                      {analysis.duration && (
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {analysis.duration}</span>
                      )}
                      {analysis.language && (
                        <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {analysis.language}</span>
                      )}
                      {analysis.primary_topic && (
                        <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {analysis.primary_topic}</span>
                      )}
                    </div>
                    <a href={rawUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors max-w-[300px] truncate mt-4 text-xs font-mono bg-muted/30 px-2 py-1 rounded w-fit">
                      <Link2 className="w-3 h-3 shrink-0" /> {rawUrl.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              </div>

              {/* Analysis Content */}
              <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Short Summary
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed bg-primary/5 p-4 rounded-xl border border-primary/10">
                    {analysis.short_summary || "No summary available for this content."}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <List className="w-4 h-4 text-primary" /> Key Takeaways
                  </h3>
                  {analysis.key_takeaways && analysis.key_takeaways.length > 0 ? (
                    <ul className="space-y-3">
                      {analysis.key_takeaways.map((takeaway, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/90">{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">No key takeaways extracted.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Next Action Section */}
            <div className="pt-4">
              <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Choose Next Action
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2 flex flex-col gap-4">
                  <Card 
                    onClick={handleExpandToWorkspace}
                    className="p-5 border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer flex flex-col group relative overflow-hidden shadow-sm hover:shadow-md h-full justify-center"
                  >
                    <div className="absolute top-0 right-0 p-2 bg-primary rounded-bl-xl shadow-sm">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Network className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-foreground mb-1">Expand into New Research Workspace</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Create a brand new workspace dedicated to exploring this source and related topics.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card 
                    onClick={openSaveModal}
                    className="p-5 border-border hover:border-primary/40 bg-card hover:bg-primary/5 transition-all cursor-pointer flex flex-col group relative overflow-hidden shadow-sm hover:shadow-md h-full justify-center"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <FolderPlus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-foreground mb-1">Save to Existing Workspace</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Add this intelligence report to an ongoing research workspace.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="md:col-span-1 flex flex-col justify-between gap-3">
                  <button disabled className="w-full h-full flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card/30 text-center opacity-60 cursor-not-allowed group">
                    <Download className="w-5 h-5 text-muted-foreground mb-2" />
                    <span className="text-sm font-bold text-muted-foreground mb-1">Generate Notes</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground">Coming Soon</span>
                  </button>
                  <div className="flex gap-3 h-full">
                    <button disabled className="w-full flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card/30 text-center opacity-60 cursor-not-allowed">
                      <FileText className="w-5 h-5 text-muted-foreground mb-2" />
                      <span className="text-xs font-bold text-muted-foreground mb-1">Create Content</span>
                    </button>
                    <button disabled className="w-full flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-card/30 text-center opacity-60 cursor-not-allowed">
                      <MessageSquare className="w-5 h-5 text-muted-foreground mb-2" />
                      <span className="text-xs font-bold text-muted-foreground mb-1">Ask Questions</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Save to Workspace Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsSaveModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-border/50">
                <h3 className="text-lg font-bold text-foreground">Save to Workspace</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Select an existing workspace to add this source.</p>
                <input 
                  type="text"
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {filteredWorkspaces.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">No workspaces found.</div>
                ) : (
                  filteredWorkspaces.map(ws => (
                    <button
                      key={ws.id}
                      onClick={() => handleSaveToWorkspace(ws.id)}
                      disabled={saveStatus !== null}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <FolderPlus className="w-4 h-4 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-foreground truncate">{ws.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{ws.topics_count || 0} topics</p>
                        </div>
                      </div>
                      {saveStatus === ws.id ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      ) : saveStatus === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : null}
                    </button>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-border/50 bg-muted/20 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setIsSaveModalOpen(false)}>Cancel</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}
