"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, FileSearch, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mockResearchData } from "./mockData";
import { ResearchData } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  OverviewSection, 
  SourcesSection, 
  CommunityOpinionsSection, 
  PopularVideosSection, 
  MisconceptionsSection, 
  ContrarianAnglesSection, 
  StatisticsSection 
} from "./Sections";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "sources", label: "Sources" },
  { id: "community", label: "Community" },
  { id: "videos", label: "Videos" },
  { id: "misconceptions", label: "Misconceptions" },
  { id: "contrarian", label: "Contrarian" },
  { id: "statistics", label: "Statistics" },
];

const GENERATION_SEQUENCE = [
  { id: "overview", loadingMsg: "Synthesizing Overview..." },
  { id: "sources", loadingMsg: "Collecting Sources..." },
  { id: "community", loadingMsg: "Analyzing Community..." },
  { id: "videos", loadingMsg: "Finding Videos..." },
  { id: "misconceptions", loadingMsg: "Detecting Misconceptions..." },
  { id: "contrarian", loadingMsg: "Generating Angles..." },
  { id: "statistics", loadingMsg: "Generating Statistics..." },
];

// Augment window type for cross-component state sharing via events
declare global {
  interface Window {
    __researchActiveSection__: string;
  }
}

/**
 * ResearchNav — the sticky section navigation strip.
 * Must be rendered OUTSIDE the scrollable/padded container in page.tsx
 * so it occupies its own layout row and never overlaps content.
 */
export function ResearchNav() {
  const [activeSection, setActiveSection] = useState("overview");
  const [hasData, setHasData] = useState(false);

  // Keep local active section in sync via a separate listener approach
  useEffect(() => {
    const onActive = () => setActiveSection(window.__researchActiveSection__ ?? "overview");
    window.addEventListener("research:activeSection", onActive);
    return () => window.removeEventListener("research:activeSection", onActive);
  }, []);

  useEffect(() => {
    const onData = () => setHasData(true);
    window.addEventListener("research:dataReady", onData);
    return () => window.removeEventListener("research:dataReady", onData);
  }, []);

  const scrollToSection = (id: string) => {
    // Dispatch to the scroll handler registered by ResearchView
    window.dispatchEvent(new CustomEvent("research:scrollTo", { detail: { id } }));
  };

  if (!hasData) return null;

  return (
    <div className="w-full border-b border-border bg-background shadow-sm">
      <div className="px-4 md:px-6 py-1.5 flex items-center justify-center gap-0.5 overflow-x-auto lg:overflow-x-visible no-scrollbar">
        {NAV_ITEMS.map((item, idx) => (
          <React.Fragment key={item.id}>
            <button
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "relative px-2.5 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap z-10",
                activeSection === item.id
                  ? "text-orange-500 font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {activeSection === item.id && (
                <motion.div
                  layoutId="activeNavBackground"
                  className="absolute inset-0 bg-orange-500/10 rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {item.label}
            </button>
            {idx < NAV_ITEMS.length - 1 && (
              <span className="text-border/50 text-[10px] select-none">•</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * ResearchView — the scrollable content area.
 * Renders inside the padded scroll container in page.tsx.
 * Does NOT include the navigation strip.
 */
export function ResearchView() {
  const [data, setData] = useState<ResearchData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [generatedSections, setGeneratedSections] = useState<string[]>([]);
  const [generatingStatus, setGeneratingStatus] = useState<string | null>(null);
  const [completedMessages, setCompletedMessages] = useState<string[]>([]);

  // Broadcast active section changes to ResearchNav via custom event
  const updateActiveSection = (id: string) => {
    setActiveSection(id);
    (window as any).__researchActiveSection__ = id;
    window.dispatchEvent(new Event("research:activeSection"));
  };

  // Broadcast when data arrives so ResearchNav can show itself
  useEffect(() => {
    if (data) {
      window.dispatchEvent(new Event("research:dataReady"));
    }
  }, [data]);

  // Listen for scroll requests from ResearchNav
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent).detail.id;
      const element = document.getElementById(id);
      if (!element) return;
      const scrollContainer = element.closest(".overflow-y-auto") as HTMLElement | null;
      if (scrollContainer) {
        const elementTop = element.getBoundingClientRect().top;
        const containerTop = scrollContainer.getBoundingClientRect().top;
        const scrollTop = scrollContainer.scrollTop + (elementTop - containerTop) - 24;
        scrollContainer.scrollTo({ top: scrollTop, behavior: "smooth" });
      } else {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("research:scrollTo", handler);
    return () => window.removeEventListener("research:scrollTo", handler);
  }, []);

  // Intersection Observer for active section tracking
  useEffect(() => {
    if (!data) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          const top = visible.reduce((a, b) =>
            a.intersectionRatio > b.intersectionRatio ? a : b
          );
          updateActiveSection(top.target.id);
        }
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    NAV_ITEMS.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [data, generatedSections]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setData(mockResearchData);
    setGeneratedSections([]);
    setCompletedMessages([]);
    let currentIdx = 0;
    const nextStep = () => {
      if (currentIdx < GENERATION_SEQUENCE.length) {
        const step = GENERATION_SEQUENCE[currentIdx];
        setGeneratingStatus(step.loadingMsg);
        setTimeout(() => {
          setGeneratedSections(prev => [...prev, step.id]);
          setCompletedMessages(prev => [
            ...prev,
            `${NAV_ITEMS.find(n => n.id === step.id)?.label} generated`,
          ]);
          currentIdx++;
          nextStep();
        }, 800 + Math.random() * 600);
      } else {
        setGeneratingStatus(null);
        setIsGenerating(false);
      }
    };
    nextStep();
  };

  if (!data && !isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-6 shadow-sm">
          <FileSearch className="w-8 h-8 text-primary/80" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-3 tracking-tight">AI-Powered Research Workspace</h2>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-8">
          Relay Studio generates structured, modular research insights rather than walls of text. Click below to start the research engine for this topic.
        </p>
        <Button
          onClick={handleGenerate}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 rounded-xl text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)]"
        >
          <Sparkles className="w-4 h-4" />
          Generate Research
        </Button>
      </div>
    );
  }

  const renderSection = (id: string, Component: React.FC<any>, dataProp: any) => {
    if (!generatedSections.includes(id)) return null;
    return (
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Component data={dataProp} />
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-32">
      <div className="space-y-16">
        {data && (
          <>
            {renderSection("overview", OverviewSection, data.overview)}
            {renderSection("sources", SourcesSection, data.sources)}
            {renderSection("community", CommunityOpinionsSection, data.community_opinions)}
            {renderSection("videos", PopularVideosSection, data.popular_videos)}
            {renderSection("misconceptions", MisconceptionsSection, data.misconceptions)}
            {renderSection("contrarian", ContrarianAnglesSection, data.contrarian_angles)}
            {renderSection("statistics", StatisticsSection, data.statistics)}
          </>
        )}
      </div>

      {/* AI Generation Status Indicators */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-12 p-6 rounded-2xl bg-card/30 border border-border flex flex-col gap-3"
          >
            {completedMessages.slice(-3).map((msg, i) => (
              <motion.div
                key={msg + i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {msg}
              </motion.div>
            ))}
            {generatingStatus && (
              <div className="flex items-center gap-3 text-sm font-black text-foreground mt-2">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                {generatingStatus}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
